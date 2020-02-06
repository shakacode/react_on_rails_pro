# frozen_string_literal: true

require "persistent_http"

module ReactOnRailsPro
  module Internal
    class Connection
      class << self
        def instance
          @instance ||= connection 
        end

        private :new

        def reset_connection
          @instance = connection
        end

        def connection
          Rails.logger.info { "[ReactOnRailsPro] Setting up connection VM Renderer at TODO" }

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
  end
end
