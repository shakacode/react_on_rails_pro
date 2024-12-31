# frozen_string_literal: true

module HTTPX
  module Plugins
    module MockStream
      module OptionsMethods
        def option_stream(stream)
          stream
        end
      end

      module ResponseMethods
        attr_accessor :mocked

        def initialize(*)
          super
          @mocked = false
        end
      end

      module ResponseBodyMethods
        def decode_chunk(chunk)
          return chunk if @response.mocked

          super
        end
      end

      module ConnectionMethods
        def initialize(*)
          super
          @mocked = true
        end

        def send(request)
          request_uri = request.uri.to_s
          mock = MockStream.mock_responses.find do |pattern, _responses|
            case pattern
            when String
              pattern == request_uri
            when Regexp
              pattern.match?(request_uri)
            end
          end

          raise "Unmocked request detected! URI: #{request_uri}, Method: #{request.verb}" unless mock

          pattern, responses = mock
          current_mock = responses.first
          status, mock_block, count, request_data = current_mock

          request_data[:request] = request
          response = request.options.response_class.new(request, status, "2.0", {}).tap do |res|
            res.mocked = true
          end
          request.response = response
          request.emit(:response, response)

          yielder = lambda { |value|
            response << value
          }

          mock_block.call(yielder, request)

          # Decrease count and remove mock if count reaches 0
          return if count == Float::INFINITY

          count -= 1
          if count.zero?
            responses.shift
            MockStream.mock_responses.delete(pattern) if responses.empty?
          else
            current_mock[2] = count
          end
        end

        def open?
          return true if @mocked

          super
        end

        def interests
          return if @mocked

          super
        end
      end

      class << self
        def mock_responses
          @mock_responses ||= {}
        end

        def clear_mocks
          @mock_responses = {}
        end
      end

      def self.mock_streaming_response(url, status = 200, count: 1, &block)
        MockStream.mock_responses[url] ||= []

        if mock_responses[url].any? { |m| m[2] == Float::INFINITY }
          raise "Cannot add mock for #{url}: infinite mock already exists"
        end

        request_data = { request: nil }
        mock_responses[url] << [status, block, count, request_data]
        request_data
      end
    end
    register_plugin :mock_stream, MockStream
  end
end
