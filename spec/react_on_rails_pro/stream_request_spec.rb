# frozen_string_literal: true

require_relative "spec_helper"
require "react_on_rails_pro/stream_request"

RSpec.describe ReactOnRailsPro::StreamDecorator do
  subject { described_class.new(mock_component) }

  let(:mock_component) { double("MockComponent") }

  describe "chaining methods" do
    it "allows chaining of prepend, transform, and append" do
      result = subject.prepend { "start" }
                      .transform { |chunk| chunk.upcase }
                      .append { "end" }
      expect(result).to eq(subject)
    end
  end

  describe "#each_chunk" do
    before do
      allow(mock_component).to receive(:each_chunk).and_yield("chunk1").and_yield("chunk2")
    end

    it "yields chunks from the component" do
      chunks = []
      subject.each_chunk { |chunk| chunks << chunk }
      expect(chunks).to eq(%w[chunk1 chunk2])
    end

    it "prepends content to the first chunk" do
      subject.prepend { "start-" }
      chunks = []
      subject.each_chunk { |chunk| chunks << chunk }
      expect(chunks.first).to start_with("start-")
    end

    it "transforms non-empty chunks" do
      subject.transform { |chunk| chunk.upcase }
      chunks = []
      subject.each_chunk { |chunk| chunks << chunk }
      expect(chunks).to all(match(/^CHUNK\d$/))
    end

    it "appends content to the last chunk" do
      subject.append { "-end" }
      chunks = []
      subject.each_chunk { |chunk| chunks << chunk }
      expect(chunks.last).to end_with("-end")
    end

    it "combines prepend, transform, and append operations" do
      subject.prepend { "start-" }
             .transform { |chunk| chunk.upcase }
             .append { "-end" }

      chunks = []
      subject.each_chunk { |chunk| chunks << chunk }

      expect(chunks.first).to start_with("START-")
      expect(chunks[1..-2]).to all(match(/^CHUNK\d$/))
      expect(chunks.last).to end_with("-end")
    end
  end
end

RSpec.describe ReactOnRailsPro::StreamRequest do
  describe ".create" do
    it "returns a StreamDecorator instance" do
      result = described_class.create { mock_response }
      expect(result).to be_a(ReactOnRailsPro::StreamDecorator)
    end
  end
end
