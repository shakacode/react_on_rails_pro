# frozen_string_literal: true

module ReactOnRailsPro
  module RscControllerConcern
    extend ActiveSupport::Concern

    included do
      include ReactOnRails::Controller
      include ReactOnRailsPro::Stream
    end

    def rsc
      @rsc_component_name = rsc_component_name
      @rsc_component_props = rsc_component_props

      stream_view_containing_react_components(
        template: custom_rsc_template,
        layout: false
      )
    end

    private

    def rsc_component_props
      {}
    end

    def rsc_component_name
      params[:component_name]
    end

    def custom_rsc_template
      "react_on_rails_pro/rsc"
    end
  end
end
