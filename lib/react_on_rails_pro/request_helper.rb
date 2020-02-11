# frozen_string_literal: true

require "net/http"
require "net/http/post/multipart"
require "uri"
require "persistent_http"

module ReactOnRailsPro
  class RequestHelper

    def self.reset_connection
      @@connection = create_connection
    end

    def self.render_code(path, js_code, send_bundle)
      Rails.logger.info { "[ReactOnRailsPro] Perform rendering request #{path}" }
      perform_request(path, form_with_code(js_code, send_bundle))
    end

    def self.upload_asset(asset_path, content_type)
      Rails.logger.info { "[ReactOnRailsPro] Uploading asset #{asset_path}" }
      unless File.exist?(asset_path)
        raise ReactOnRails::Error, "Asset not found #{asset_path}"
      end
      perform_request('/upload-asset', form_with_asset(asset_path, content_type))
    end

    private 

    def self.connection
      @@connection ||= create_connection
    end

    def self.perform_request(path, form)
      begin
        response = connection.request(Net::HTTP::Post::Multipart.new(path, form))
      rescue StandardError => e
        raise ReactOnRailsPro::Error, "Can't connect to VmRenderer renderer.\n"\
              "Original error:\n#{e}"
      end

      Rails.logger.info { "[ReactOnRailsPro] VM renderer responded" }

      case response.code
      when "412"
        # 412 is a protocol error, meaning the server and renderer are running incompatible versions
        # of React on Rails.
        raise ReactOnRailsPro::Error, response.body
      else
        return response
      end
    end

    def self.form_with_code(js_code, send_bundle)
      form = form_data
      form["renderingRequest"] = js_code
      if send_bundle
        form["bundle"] = UploadIO.new(
          File.new(ReactOnRails::Utils.server_bundle_js_file_path),
          ReactOnRails::Utils.server_bundle_js_file_path
        )
      end
      form
    end

    # content_type is the temp param
    # will be removed later
    def self.form_with_asset(path, content_type)
      form = form_data
      form["asset"] = UploadIO.new(path, content_type)
      form
    end

    def self.form_data
      {
        "gemVersion" => ReactOnRailsPro::VERSION,
        "protocolVersion" => "1.0.0",
        "password" => ReactOnRailsPro.configuration.renderer_password
      }
    end

    def self.create_connection
      Rails.logger.info { "[ReactOnRailsPro] Setting up connection VM Renderer" }

      # NOTE: there are multiple similar gems
      # We use https://github.com/bpardee/persistent_http/blob/master/lib/persistent_http.rb
      # Not: https://github.com/drbrain/net-http-persistent
      PersistentHTTP.new(
        name: "ReactOnRailsProVmRendererClient",
        logger: Rails.logger,
        pool_size: ReactOnRailsPro.configuration.renderer_http_pool_size,
        pool_timeout: ReactOnRailsPro.configuration.renderer_http_pool_timeout,
        warn_timeout: ReactOnRailsPro.configuration.renderer_http_pool_warn_timeout,
        force_retry: true,
        url: ReactOnRailsPro.configuration.renderer_url
      )
    end
  end
end
