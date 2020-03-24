# frozen_string_literal: true

ReactOnRails.configure do |config|
  config.random_dom_id = false
  config.node_modules_location = ""
  config.server_bundle_js_file = "server-bundle.js"
end

# Monkey patch
# Need to set a config value for React on Rails to say that the server bundle is not created by
# the webpack-dev-server
module ReactOnRails::WebpackerUtils
  def self.bundle_js_uri_from_webpacker(bundle_name)
    hashed_bundle_name = Webpacker.manifest.lookup!(bundle_name)

    same_bundle_for_client_and_server = false

    if Webpacker.dev_server.running? && same_bundle_for_client_and_server
      "#{Webpacker.dev_server.protocol}://#{Webpacker.dev_server.host_with_port}#{hashed_bundle_name}"
    else
      File.expand_path(File.join('public', hashed_bundle_name)).to_s
    end
  end
end
