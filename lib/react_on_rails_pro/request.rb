# frozen_string_literal: true

require "net/http"
require "net/http/post/multipart"
require "uri"
require "persistent_http"
require_relative "stream_request"

module ReactOnRailsPro
  class Request
    class << self
      def reset_connection
        @connection = create_connection(url: ReactOnRailsPro.configuration.renderer_url)
        @rsc_connection = create_connection(url: ReactOnRailsPro.configuration.rsc_renderer_url)
      end

      def render_code(path, js_code, send_bundle)
        Rails.logger.info { "[ReactOnRailsPro] Perform rendering request #{path}" }
        perform_request(path, form_with_code(js_code, send_bundle, false), false)
      end

      def render_code_as_stream(path, js_code, is_rendering_rsc_payload)
        Rails.logger.info { "[ReactOnRailsPro] Perform rendering request as a stream #{path}" }
        # The block here and at perform_request is passed to connection.request,
        # which allows us to read each chunk received in the HTTP stream as soon as it's received.
        ReactOnRailsPro::StreamRequest.create do |send_bundle, &block|
          perform_request(path, form_with_code(js_code, send_bundle, is_rendering_rsc_payload), is_rendering_rsc_payload, &block)
        end
      end

      # TODO: add support for uploading rsc assets
      def upload_assets
        Rails.logger.info { "[ReactOnRailsPro] Uploading assets" }
        perform_request("/upload-assets", form_with_assets_and_bundle, false)
      end

      # TODO: add support for checking if asset exists on rsc renderer
      def asset_exists_on_vm_renderer?(filename)
        Rails.logger.info { "[ReactOnRailsPro] Sending request to check if file exist on node-renderer: #{filename}" }
        response = perform_request("/asset-exists?filename=#{filename}", common_form_data, false)
        JSON.parse(response.body)["exists"] == true
      end

      private

      def connection
        @connection ||= create_connection(url: ReactOnRailsPro.configuration.renderer_url)
      end

      def rsc_connection
        @rsc_connection ||= create_connection(url: ReactOnRailsPro.configuration.rsc_renderer_url)
      end

      def perform_request(path, form, is_rendering_rsc_payload, &block)
        available_retries = ReactOnRailsPro.configuration.renderer_request_retry_limit
        retry_request = true
        while retry_request
          begin
            used_connection = is_rendering_rsc_payload ? rsc_connection : connection
            response = used_connection.request(Net::HTTP::Post::Multipart.new(path, form), &block)
            retry_request = false
          rescue Timeout::Error => e
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
          rescue StandardError => e
            raise ReactOnRailsPro::Error, "Can't connect to NodeRenderer renderer: #{path}.\n" \
                                          "Original error:\n#{e}\n#{e.backtrace}"
          end
        end

        Rails.logger.info { "[ReactOnRailsPro] Node Renderer responded" }

        case response.code
        when "412"
          # 412 is a protocol error, meaning the server and renderer are running incompatible versions
          # of React on Rails.
          raise ReactOnRailsPro::Error, response.body
        else
          response
        end
      end

      def form_with_code(js_code, send_bundle, is_rendering_rsc_payload)
        form = common_form_data
        form["renderingRequest"] = js_code
        if send_bundle
          renderer_bundle_file_name = is_rendering_rsc_payload ?
                                        ReactOnRailsPro::ServerRenderingPool::NodeRenderingPool.rsc_renderer_bundle_file_name :
                                        ReactOnRailsPro::ServerRenderingPool::NodeRenderingPool.renderer_bundle_file_name
          bundle_js_file_path = is_rendering_rsc_payload ? ReactOnRails::Utils.rsc_bundle_js_file_path : ReactOnRails::Utils.server_bundle_js_file_path
          form["bundle"] = UploadIO.new(
            File.new(bundle_js_file_path),
            "text/javascript",
            renderer_bundle_file_name
          )

          populate_form_with_assets_to_copy(form)
        end
        form
      end

      def populate_form_with_assets_to_copy(form)
        if ReactOnRailsPro.configuration.assets_to_copy.present?
          ReactOnRailsPro.configuration.assets_to_copy.each_with_index do |asset_path, idx|
            Rails.logger.info { "[ReactOnRailsPro] Uploading asset #{asset_path}" }
            unless File.exist?(asset_path)
              warn "Asset not found #{asset_path}"
              next
            end

            content_type = ReactOnRailsPro::Utils.mine_type_from_file_name(asset_path)

            # File.new is very important so that UploadIO does not have confusion over a Pathname
            # vs. a file path. I.e., Pathname objects don't work.
            form["assetsToCopy#{idx}"] = UploadIO.new(File.new(asset_path), content_type, asset_path)
          end
        end
        form
      end

      def form_with_assets_and_bundle
        form = common_form_data
        populate_form_with_assets_to_copy(form)

        src_bundle_path = ReactOnRails::Utils.server_bundle_js_file_path
        raise ReactOnRails::Error, "Bundle not found #{src_bundle_path}" unless File.exist?(src_bundle_path)

        renderer_bundle_file_name = ReactOnRailsPro::ServerRenderingPool::NodeRenderingPool.renderer_bundle_file_name
        form["bundle"] = UploadIO.new(File.new(src_bundle_path), "text/javascript",
                                      renderer_bundle_file_name)
        form
      end

      def common_form_data
        {
          "gemVersion" => ReactOnRailsPro::VERSION,
          "protocolVersion" => "1.0.0",
          "password" => ReactOnRailsPro.configuration.renderer_password
        }
      end

      def create_connection(url:)
        Rails.logger.info do
          "[ReactOnRailsPro] Setting up Node Renderer connection to #{ReactOnRailsPro.configuration.renderer_url}"
        end

        # NOTE: there are multiple similar gems
        # We use https://github.com/bpardee/persistent_http/blob/master/lib/persistent_http.rb
        # Not: https://github.com/drbrain/net-http-persistent
        PersistentHTTP.new(
          name: "ReactOnRailsProNodeRendererClient",
          logger: Rails.logger,
          pool_size: ReactOnRailsPro.configuration.renderer_http_pool_size,
          pool_timeout: ReactOnRailsPro.configuration.renderer_http_pool_timeout,
          warn_timeout: ReactOnRailsPro.configuration.renderer_http_pool_warn_timeout,

          # https://docs.ruby-lang.org/en/2.0.0/Net/HTTP.html#attribute-i-read_timeout
          # https://github.com/bpardee/persistent_http/blob/master/lib/persistent_http/connection.rb#L168
          read_timeout: ENV['DEBUGGER'] === 'true' ? 3600 : ReactOnRailsPro.configuration.ssr_timeout,
          force_retry: true,
          url: url
        )
      rescue StandardError => e
        message = <<~MSG
          [ReactOnRailsPro] Error creating PersistentHTTP connection.
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
