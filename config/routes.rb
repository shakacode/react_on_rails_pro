# frozen_string_literal: true

Rails.application.routes.draw do
  get "rsc/:componentName" => "react_on_rails_pro/rsc#render_rsc", as: :rsc
end
