# frozen_string_literal: true

require "uri"
require "httpx"
require_relative "stream_request"

module ReactOnRailsPro
  class Request
    class << self
      def reset_connection
        @connection = create_connection
      end

      def render_code(path, js_code, send_bundle)
        Rails.logger.info { "[ReactOnRailsPro] Perform rendering request #{path}" }
        perform_request(path, form: form_with_code(js_code, send_bundle))
      end

      def render_code_as_stream(path, js_code)
        Rails.logger.info { "[ReactOnRailsPro] Perform rendering request as a stream #{path}" }
        # The block here and at perform_request is passed to connection.request,
        # which allows us to read each chunk received in the HTTP stream as soon as it's received.
        ReactOnRailsPro::StreamRequest.create do |send_bundle, &block|
          perform_request(path, form_with_code(js_code, send_bundle), &block)
        end
      end

      def upload_assets
        Rails.logger.info { "[ReactOnRailsPro] Uploading assets" }
        perform_request("/upload-assets", form: form_with_assets_and_bundle)
      end

      def asset_exists_on_vm_renderer?(filename)
        Rails.logger.info { "[ReactOnRailsPro] Sending request to check if file exist on node-renderer: #{filename}" }
        response = perform_request("/asset-exists?filename=#{filename}", json: common_form_data)
        JSON.parse(response.body)["exists"] == true
      end

      private

      def connection
        @connection ||= create_connection
      end

      def perform_request(path, form: nil, json: nil, &block)
        available_retries = ReactOnRailsPro.configuration.renderer_request_retry_limit
        retry_request = true
        while retry_request
          begin
            response = form ? connection.post(path, form: form, &block) : connection.post(path, json: json, &block)
            if response.is_a?(HTTPX::ErrorResponse)
              e = response.error
              raise ReactOnRailsPro::Error, "Can't connect to NodeRenderer renderer: #{path}.\n" \
                                            "Original error:\n#{e}\n#{e.backtrace}"
            end
            retry_request = false
          rescue HTTPX::TimeoutError => e
            # Testing timeout catching:
            # https://github.com/shakacode/react_on_rails_pro/pull/136#issue-463421204
            if available_retries.zero?
              raise ReactOnRailsPro::Error, "Time out error when getting the response on: #{path}.\n" \
                                            "Original error:\n#{e}\n#{e.backtrace}"
            end
            Rails.logger.info do
              "[ReactOnRailsPro] Timed out trying to connect to the Node Renderer. " \
                "Retrying #{available_retries} more times..."
            end
            available_retries -= 1
            next
          end
        end

        Rails.logger.info { "[ReactOnRailsPro] Node Renderer responded" }

        case response.status
        when 412
          # 412 is a protocol error, meaning the server and renderer are running incompatible versions
          # of React on Rails.
          raise ReactOnRailsPro::Error, response.body
        else
          response
        end
      end

      def form_with_code(js_code, send_bundle)
        form = common_form_data
        form["renderingRequest"] = js_code
        populate_form_with_bundle_and_assets(form, check_bundle: false) if send_bundle
        form
      end

      def populate_form_with_bundle_and_assets(form, check_bundle:)
        server_bundle_path = ReactOnRails::Utils.server_bundle_js_file_path
        if check_bundle && !File.exist?(server_bundle_path)
          raise ReactOnRailsPro::Error, "Bundle not found #{server_bundle_path}"
        end

        renderer_bundle_file_name = ReactOnRailsPro::ServerRenderingPool::NodeRenderingPool.renderer_bundle_file_name
        form["bundle"] = {
          body: Pathname.new(server_bundle_path),
          content_type: "text/javascript",
          filename: renderer_bundle_file_name
        }

        if ReactOnRailsPro.configuration.assets_to_copy.present?
          ReactOnRailsPro.configuration.assets_to_copy.each_with_index do |asset_path, idx|
            Rails.logger.info { "[ReactOnRailsPro] Uploading asset #{asset_path}" }
            unless File.exist?(asset_path)
              warn "Asset not found #{asset_path}"
              next
            end

            content_type = ReactOnRailsPro::Utils.mine_type_from_file_name(asset_path)

            form["assetsToCopy#{idx}"] = {
              body: Pathname.new(asset_path),
              content_type: content_type,
              filename: File.basename(asset_path)
            }
          end
        end
        form
      end

      def form_with_assets_and_bundle
        form = common_form_data
        populate_form_with_bundle_and_assets(form, check_bundle: true)
        form
      end

      def common_form_data
        {
          "gemVersion" => ReactOnRailsPro::VERSION,
          "protocolVersion" => "1.0.0",
          "password" => ReactOnRailsPro.configuration.renderer_password
        }
      end

      def create_connection
        Rails.logger.info do
          "[ReactOnRailsPro] Setting up Node Renderer connection to #{ReactOnRailsPro.configuration.renderer_url}"
        end

        HTTPX
          # https://honeyryderchuck.gitlab.io/httpx/wiki/Persistent
          # The implementation implies retries as well in case something closes the connection
          .plugin(:persistent)
          .with(
            origin: ReactOnRailsPro.configuration.renderer_url,
            max_concurrent_requests: ReactOnRailsPro.configuration.renderer_http_pool_size,
            # Other timeouts supported https://honeyryderchuck.gitlab.io/httpx/wiki/Timeouts:
            # :write_timeout
            # :request_timeout
            # :operation_timeout
            # :keep_alive_timeout
            # TODO: Do we want to add config for them?
            # FIXME: remove warn_timeout, which is not supported
            timeout: {
              connect_timeout: ReactOnRailsPro.configuration.renderer_http_pool_timeout,
              read_timeout: ReactOnRailsPro.configuration.ssr_timeout
            }
          )
      rescue StandardError => e
        message = <<~MSG
          [ReactOnRailsPro] Error creating HTTPX connection.
          renderer_http_pool_size = #{ReactOnRailsPro.configuration.renderer_http_pool_size}
          renderer_http_pool_timeout = #{ReactOnRailsPro.configuration.renderer_http_pool_timeout}
          renderer_http_pool_warn_timeout = #{ReactOnRailsPro.configuration.renderer_http_pool_warn_timeout}
          renderer_url = #{ReactOnRailsPro.configuration.renderer_url}
          Be sure to use a url that contains the protocol of http or https.
          Original error is
          #{e}
        MSG
        raise ReactOnRailsPro::Error, message
      end
    end
  end
end
