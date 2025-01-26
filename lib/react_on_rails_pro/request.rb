# frozen_string_literal: true

require "uri"
require "httpx"
require_relative "stream_request"

module ReactOnRailsPro
  class Request # rubocop:disable Metrics/ClassLength
    class << self
      def reset_connection
        @connection&.close
        @rsc_connection&.close
        @connection = create_connection(url: ReactOnRailsPro.configuration.renderer_url)

        return unless ReactOnRailsPro.configuration.enable_rsc_support

        @rsc_connection = create_connection(url: ReactOnRailsPro.configuration.rsc_renderer_url)
      end

      def render_code(path, js_code, send_bundle)
        Rails.logger.info { "[ReactOnRailsPro] Perform rendering request #{path}" }
        form = form_with_code(js_code, send_bundle, is_rsc: false)
        perform_request(path, is_rsc: false, form: form)
      end

      def render_code_as_stream(path, js_code, is_rsc:)
        Rails.logger.info { "[ReactOnRailsPro] Perform rendering request as a stream #{path}" }
        ReactOnRailsPro::StreamRequest.create(is_rsc: is_rsc) do |send_bundle|
          form = form_with_code(js_code, send_bundle, is_rsc: is_rsc)
          perform_request(path, is_rsc: is_rsc, form: form, stream: true)
        end
      end

      # TODO: add support for uploading rsc assets
      def upload_assets
        Rails.logger.info { "[ReactOnRailsPro] Uploading assets" }
        perform_request("/upload-assets", is_rsc: false, form: form_with_assets_and_bundle)

        return unless ReactOnRailsPro.configuration.enable_rsc_support

        perform_request("/upload-assets", is_rsc: true, form: form_with_assets_and_bundle(rsc_renderer: true))
        # Explicitly return nil to ensure consistent return value regardless of whether
        # enable_rsc_support is true or false. Without this, the method would return nil
        # when RSC is disabled but return the response object when RSC is enabled.
        nil
      end

      def asset_exists_on_vm_renderer?(filename, rsc_renderer: false)
        Rails.logger.info { "[ReactOnRailsPro] Sending request to check if file exist on node-renderer: #{filename}" }
        form_data = common_form_data(rsc_renderer: rsc_renderer)
        response = perform_request("/asset-exists?filename=#{filename}", is_rsc: rsc_renderer, json: form_data)
        JSON.parse(response.body)["exists"] == true
      end

      private

      def connection
        @connection ||= create_connection(url: ReactOnRailsPro.configuration.renderer_url)
      end

      def rsc_connection
        @rsc_connection ||= begin
          unless ReactOnRailsPro.configuration.enable_rsc_support
            raise ReactOnRailsPro::Error,
                  "RSC support is not enabled. Please set enable_rsc_support to true in your " \
                  "config/initializers/react_on_rails_pro.rb file before " \
                  "rendering any RSC payload."
          end

          create_connection(url: ReactOnRailsPro.configuration.rsc_renderer_url)
        end
      end

      def perform_request(path, is_rsc:, **post_options) # rubocop:disable Metrics/AbcSize,Metrics/CyclomaticComplexity,Metrics/PerceivedComplexity
        available_retries = ReactOnRailsPro.configuration.renderer_request_retry_limit
        retry_request = true
        while retry_request
          begin
            start_time = Time.now
            used_connection = is_rsc ? rsc_connection : connection
            response = used_connection.post(path, **post_options)
            raise response.error if response.is_a?(HTTPX::ErrorResponse)

            request_time = Time.now - start_time
            warn_timeout = ReactOnRailsPro.configuration.renderer_http_pool_warn_timeout
            if request_time > warn_timeout
              Rails.logger.warn "Request to #{path} took #{request_time} seconds, expected at most #{warn_timeout}."
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
              "[ReactOnRailsPro] Timed out trying to make a request to the Node Renderer. " \
                "Retrying #{available_retries} more times..."
            end
            available_retries -= 1
            next
          rescue HTTPX::Error => e # Connection errors or other unexpected errors
            # Such errors are handled by ReactOnRailsPro::StreamRequest instead
            raise if e.is_a?(HTTPX::HTTPError) && post_options[:stream]

            raise ReactOnRailsPro::Error,
                  "Node renderer request failed: #{path}.\nOriginal error:\n#{e}\n#{e.backtrace}"
          end
        end

        Rails.logger.info { "[ReactOnRailsPro] Node Renderer responded" }

        # +response+ can also be an +HTTPX::ErrorResponse+ or an +HTTPX::StreamResponse+, which don't have +#status+.
        if response.is_a?(HTTPX::Response) && response.status == ReactOnRailsPro::STATUS_INCOMPATIBLE
          raise ReactOnRailsPro::Error, response.body
        end

        response
      end

      def form_with_code(js_code, send_bundle, is_rsc:)
        form = common_form_data(rsc_renderer: is_rsc)
        form["renderingRequest"] = js_code
        populate_form_with_bundle_and_assets(form, is_rsc: is_rsc, check_bundle: false) if send_bundle
        form
      end

      def populate_form_with_bundle_and_assets(form, is_rsc:, check_bundle:)
        server_bundle_path = if is_rsc
                               ReactOnRails::Utils.rsc_bundle_js_file_path
                             else
                               ReactOnRails::Utils.server_bundle_js_file_path
                             end
        if check_bundle && !File.exist?(server_bundle_path)
          raise ReactOnRailsPro::Error, "Bundle not found #{server_bundle_path}"
        end

        pool = ReactOnRailsPro::ServerRenderingPool::NodeRenderingPool
        renderer_bundle_file_name = if is_rsc
                                      pool.rsc_renderer_bundle_file_name
                                    else
                                      pool.renderer_bundle_file_name
                                    end
        form["bundle"] = {
          body: get_form_body_for_file(server_bundle_path),
          content_type: "text/javascript",
          filename: renderer_bundle_file_name
        }

        add_assets_to_form(form, is_rsc: is_rsc)
      end

      def add_assets_to_form(form, is_rsc:)
        assets_to_copy = ReactOnRailsPro.configuration.assets_to_copy.presence || []
        # react_client_manifest file is needed to generate react server components payload
        assets_to_copy << ReactOnRails::Utils.react_client_manifest_file_path if is_rsc

        return form unless assets_to_copy.present?

        assets_to_copy.each_with_index do |asset_path, idx|
          Rails.logger.info { "[ReactOnRailsPro] Uploading asset #{asset_path}" }
          unless http_url?(asset_path) || File.exist?(asset_path)
            warn "Asset not found #{asset_path}"
            next
          end

          content_type = ReactOnRailsPro::Utils.mine_type_from_file_name(asset_path)

          begin
            form["assetsToCopy#{idx}"] = {
              body: get_form_body_for_file(asset_path),
              content_type: content_type,
              filename: File.basename(asset_path)
            }
          rescue StandardError => e
            warn "[ReactOnRailsPro] Error uploading asset #{asset_path}: #{e}"
          end
        end

        form
      end

      def form_with_assets_and_bundle(rsc_renderer: false)
        form = common_form_data(rsc_renderer: rsc_renderer)
        populate_form_with_bundle_and_assets(form, is_rsc: rsc_renderer, check_bundle: true)
        form
      end

      def common_form_data(rsc_renderer:)
        password = if rsc_renderer
                     ReactOnRailsPro.configuration.rsc_renderer_password
                   else
                     ReactOnRailsPro.configuration.renderer_password
                   end
        {
          "gemVersion" => ReactOnRailsPro::VERSION,
          "protocolVersion" => "1.0.0",
          "password" => password
        }
      end

      def create_connection(url:)
        Rails.logger.info do
          "[ReactOnRailsPro] Setting up Node Renderer connection to #{url}"
        end

        HTTPX
          # For persistent connections we want retries,
          # so the requests don't just fail if the other side closes the connection
          # https://honeyryderchuck.gitlab.io/httpx/wiki/Persistent
          .plugin(:retries, max_retries: 1, retry_change_requests: true)
          .plugin(:stream)
          # See https://www.rubydoc.info/gems/httpx/1.3.3/HTTPX%2FOptions:initialize for the available options
          .with(
            origin: url,
            # Version of HTTP protocol to use by default in the absence of protocol negotiation
            fallback_protocol: "h2",
            max_concurrent_requests: ReactOnRailsPro.configuration.renderer_http_pool_size,
            persistent: true,
            # Other timeouts supported https://honeyryderchuck.gitlab.io/httpx/wiki/Timeouts:
            # :write_timeout
            # :request_timeout
            # :operation_timeout
            # :keep_alive_timeout
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
          renderer_url = #{url}
          Be sure to use a url that contains the protocol of http or https.
          Original error is
          #{e}
        MSG
        raise ReactOnRailsPro::Error, message
      end

      def get_form_body_for_file(path)
        # Handles the case when the file is served from the dev server
        if http_url?(path)
          unless Rails.env.development?
            raise ReactOnRailsPro::Error,
                  "Not expected to get HTTP url for bundle or assets in production mode"
          end

          response = HTTPX.get(path)
          response.body
        else
          Pathname.new(path)
        end
      end

      def http_url?(path)
        path.to_s.match?(%r{https?://})
      end
    end
  end
end
