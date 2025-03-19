# frozen_string_literal: true

module ReactOnRailsPro
  module ServerRenderingJsCode
    class << self
      def ssr_pre_hook_js
        ReactOnRailsPro.configuration.ssr_pre_hook_js || ""
      end

      def generate_rsc_payload_js_function(render_options)
        return "" unless ReactOnRailsPro.configuration.enable_rsc_support

        if render_options.rsc_payload_streaming?
          return <<-JS
            if (typeof generateRSCPayload !== 'function') {
              globalThis.generateRSCPayload = function generateRSCPayload() {
                throw new Error('The rendering request is already running on the RSC bundle. Please ensure that generateRSCPayload is only called from any React Server Component.')
              }
            }
          JS
        end

        # To minimize the size of the HTTP request body sent to the node renderer,
        # we reuse the existing rendering request string within the generateRSCPayload function.
        # This approach allows us to simply replace the component name and props,
        # rather than rewriting the entire rendering request.
        <<-JS
        railsContext.serverSideRSCPayloadParameters = {
          renderingRequest,
          rscBundleHash: '#{ReactOnRailsPro::Utils.rsc_bundle_hash}',
        }
        if (typeof generateRSCPayload !== 'function') {
          globalThis.generateRSCPayload = function generateRSCPayload(componentName, props, serverSideRSCPayloadParameters) {
            const { renderingRequest, rscBundleHash } = serverSideRSCPayloadParameters;
            const propsString = JSON.stringify(props);
            const newRenderingRequest = renderingRequest.replace(/\\(\\s*\\)\\s*$/, `('${componentName}', ${propsString})`);
            return runOnOtherBundle(rscBundleHash, newRenderingRequest);
          }
        }
        JS
      end

      def render(props_string, rails_context, redux_stores, react_component_name, render_options)
        render_function_name = if render_options.streaming?
                                 "ReactOnRails.isRSCBundle ? " \
                                   "'serverRenderRSCReactComponent' : " \
                                   "'streamServerRenderedReactComponent'"
                               else
                                 "'serverRenderReactComponent'"
                               end
        rsc_params = if ReactOnRailsPro.configuration.enable_rsc_support
                       react_client_manifest_file = ReactOnRails.configuration.react_client_manifest_file
                       react_server_client_manifest_file = ReactOnRails.configuration.react_server_client_manifest_file
                       <<-JS
                          railsContext.reactClientManifestFileName = '#{react_client_manifest_file}';
                          railsContext.reactServerClientManifestFileName = '#{react_server_client_manifest_file}';
                       JS
                     else
                       ""
                     end
        <<-JS
        (function(componentName = '#{react_component_name}', props = undefined) {
          var railsContext = #{rails_context};
          #{rsc_params}
          #{generate_rsc_payload_js_function(render_options)}
          #{ssr_pre_hook_js}
          #{redux_stores}
          var usedProps = typeof props === 'undefined' ? #{props_string} : props;
          return ReactOnRails[#{render_function_name}]({
            name: componentName,
            domNodeId: '#{render_options.dom_id}',
            props: usedProps,
            trace: #{render_options.trace},
            railsContext: railsContext,
            throwJsErrors: #{ReactOnRailsPro.configuration.throw_js_errors},
            renderingReturnsPromises: #{ReactOnRailsPro.configuration.rendering_returns_promises},
          });
        })()
        JS
      end
    end
  end
end
