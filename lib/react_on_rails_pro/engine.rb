# frozen_string_literal: true

require "rails/railtie"

module ReactOnRailsPro
  class Engine < Rails::Engine
    initializer "react_on_rails_pro.routes" do
      ActionDispatch::Routing::Mapper.include ReactOnRailsPro::Routes
    end

    # Install ScoutApm instrumentation after ScoutApm is configured via "scout_apm.start" initializer.
    # https://github.com/scoutapp/scout_apm_ruby/blob/v6.1.0/lib/scout_apm.rb#L221
    initializer "react_on_rails_pro.scout_apm_instrumentation", after: "scout_apm.start" do
      next unless defined?(ScoutApm)

      ReactOnRailsPro::ServerRenderingPool::NodeRenderingPool.singleton_class.class_eval do
        include ScoutApm::Tracer
        instrument_method :exec_server_render_js, type: "ReactOnRails", name: "Node React Server Rendering"
      end
    end
  end
end
