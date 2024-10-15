# frozen_string_literal: true

module ReactOnRailsPro
  module ServerRenderingJsCode
    class << self
      def ssr_pre_hook_js
        ReactOnRailsPro.configuration.ssr_pre_hook_js || ""
      end

      def render(props_string, rails_context, redux_stores, react_component_name, render_options)
        # Node renderer does not need to clear the console history
        # It already clears the console history after each render
        clear_console_history_if_needed_js = ReactOnRailsPro.configuration.node_renderer? ? "" : "console.history = [];"
        <<-JS
        (function() {
          var railsContext = #{rails_context};
        #{ssr_pre_hook_js}
        #{redux_stores}
          var props = #{props_string};
          #{clear_console_history_if_needed_js}
          return ReactOnRails.serverRenderReactComponent({
            name: '#{react_component_name}',
            domNodeId: '#{render_options.dom_id}',
            props: props,
            trace: #{render_options.trace},
            railsContext: railsContext,
            throwJsErrors: #{ReactOnRailsPro.configuration.throw_js_errors},
            renderingReturnsPromises: #{ReactOnRailsPro.configuration.rendering_returns_promises}
          });
        })()
        JS
      end
    end
  end
end
