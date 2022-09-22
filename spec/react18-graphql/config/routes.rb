# frozen_string_literal: true

Rails.application.routes.draw do
  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  root "pages#index"

  get "suspense_graphql" => "pages#suspense_graphql", as: :suspense_graphql
  
end
