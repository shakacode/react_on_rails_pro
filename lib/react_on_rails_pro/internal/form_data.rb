# frozen_string_literal: true

require "persistent_http"

module ReactOnRailsPro
  module Internal
    class FormData
      def self.render_code(js_code, send_bundle)
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
      def self.upload_asset(path, content_type)
        form = form_data
        form["asset"] = UploadIO.new(path, content_type)
        form
      end

      private

      def self.form_data
        {
          "gemVersion" => ReactOnRailsPro::VERSION,
          "protocolVersion" => "1.0.0",
          "password" => ReactOnRailsPro.configuration.renderer_password
        }
      end
    end
  end
end
