# frozen_string_literal: true

module ReactOnRailsPro
  module Routes
    def rsc_route(path: "rsc", controller: "react_on_rails_pro/rsc", **options)
      get "#{path}/:component_name", to: "#{controller}#rsc", as: options[:as] || :rsc
    end
  end
end
