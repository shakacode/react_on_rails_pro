require "react_on_rails/utils"

module ReactOnRailsPro
  module ReactComponent
    class Cache
      class << self
        def call(component_name, options)
          cache_key = cache_key(component_name, options)
          Rails.cache.fetch(cache_key) { yield }
        end

        def base_cache_key(type, prerender: nil)
          keys = [
            type,
            ReactOnRails::VERSION,
            ReactOnRailsPro::VERSION
          ]
          keys.push(ReactOnRailsPro::Utils.bundle_hash) if prerender
          keys
        end

        def cache_key(component_name, options)
          keys = [
            *base_cache_key("ror_component", prerender: options[:prerender]),
            component_name,
            options[:cache_key]
          ]

          # TODO: [CACHE] Add option for hash of serializers

          ActiveSupport::Cache.expand_cache_key(keys)
        end
      end
    end
  end
end
