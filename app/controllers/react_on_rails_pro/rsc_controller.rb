# frozen_string_literal: true

module ReactOnRailsPro
  # TODO: Make mountable through Engine
  class RscController < ApplicationController
    include ActionController::Live
    include ReactOnRails::Helper

    def render_rsc
      render_options = ReactOnRails::ReactComponent::RenderOptions.new(
        react_component_name: params[:componentName],
        options: {
          trace: true,
          replay_console: true,
          raise_on_prerender_error: true
        }
      )

      # TODO: RailsContext
      js_code = ReactOnRailsPro::ServerRenderingJsCode.render_rsc(
        props_string(params[:props] || {}).gsub("\u2028", '\u2028').gsub("\u2029", '\u2029'),
        initialize_redux_stores,
        params[:componentName],
        render_options
      )

      ReactOnRailsPro::ServerRenderingPool::ProRendering.reset_pool_if_server_bundle_was_modified
      ReactOnRailsPro::ServerRenderingPool::NodeRenderingPool.eval_js(
        js_code,
        render_options,
        live_response: response
      )
    ensure
      response.stream.close
    end
  end
end
