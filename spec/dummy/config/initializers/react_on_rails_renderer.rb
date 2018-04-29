ReactOnRailsRenderer.configure do |config|
  config.renderer_port = 3800
  config.server_render_method = "NodeJSHttp"
  # config.renderer_port = 6081
end
