# frozen_string_literal: true

require_relative "spec_helper"
require 'react_on_rails_pro/stream_request'

RSpec.describe ReactOnRailsPro::StreamDecorator do
  let(:mock_component) { double('MockComponent') }
  subject { described_class.new(mock_component) }

  describe 'chaining methods' do
    it 'allows chaining of prepend, transform, and append' do
      result = subject.prepend { 'start' }
                      .transform { |chunk| chunk.upcase }
                      .append { 'end' }
      expect(result).to eq(subject)
    end
  end

  describe '#each_chunk' do
    before do
      allow(mock_component).to receive(:each_chunk).and_yield('chunk1').and_yield('chunk2')
    end

    it 'yields chunks from the component' do
      chunks = []
      subject.each_chunk { |chunk| chunks << chunk }
      expect(chunks).to eq(['chunk1', 'chunk2'])
    end

    it 'prepends content to the first chunk' do
      subject.prepend { 'start-' }
      chunks = []
      subject.each_chunk { |chunk| chunks << chunk }
      expect(chunks.first).to start_with('start-')
    end

    it 'transforms non-empty chunks' do
      subject.transform { |chunk| chunk.upcase }
      chunks = []
      subject.each_chunk { |chunk| chunks << chunk }
      expect(chunks).to all(match(/^CHUNK\d$/))
    end

    it 'appends content to the last chunk' do
      subject.append { '-end' }
      chunks = []
      subject.each_chunk { |chunk| chunks << chunk }
      expect(chunks.last).to end_with('-end')
    end

    it 'combines prepend, transform, and append operations' do
      subject.prepend { 'start-' }
             .transform { |chunk| chunk.upcase }
             .append { '-end' }
      
      chunks = []
      subject.each_chunk { |chunk| chunks << chunk }
      
      expect(chunks.first).to start_with('START-')
      expect(chunks[1..-2]).to all(match(/^CHUNK\d$/))
      expect(chunks.last).to end_with('-end')
    end
  end
end

RSpec.describe ReactOnRailsPro::StreamRequest do
  let(:mock_response) { double('MockResponse') }
  
  describe '.create' do
    it 'returns a StreamDecorator instance' do
      result = described_class.create { mock_response }
      expect(result).to be_a(ReactOnRailsPro::StreamDecorator)
    end
  end

  describe '#each_chunk' do
    let(:request_block) do
      lambda do |send_bundle, &block|
        block.call(mock_response)
        mock_response
      end
    end

    subject { described_class.send(:new, &request_block) }

    context 'when response code is 200' do
      before do
        allow(mock_response).to receive(:code).and_return('200')
        allow(mock_response).to receive(:read_body).and_yield('chunk1').and_yield('chunk2')
      end

      it 'yields chunks' do
        chunks = []
        subject.each_chunk { |chunk| chunks << chunk }
        expect(chunks).to eq(['chunk1', 'chunk2'])
      end
    end

    context 'when response code is 410 then 200' do
      it 'retries with send_bundle set to true' do
        allow(mock_response).to receive(:code).and_return('410', '200')
        allow(mock_response).to receive(:read_body).and_yield('chunk')

        expect(request_block).to receive(:call).with(false).and_return(mock_response)
        expect(request_block).to receive(:call).with(true).and_return(mock_response)

        subject.each_chunk.to_a
      end
    end

    context 'when response code is neither 200 nor 410' do
      it 'raises an error' do
        allow(mock_response).to receive(:code).and_return('500')
        allow(mock_response).to receive(:body).and_return('Error message')

        expect { subject.each_chunk.to_a }.to raise_error(ReactOnRailsPro::Error, /Unknown response code from renderer: 500/)
      end
    end
  end
end
