Rails.application.routes.draw do
  root "pages#index"
  get "/A", to: "pages#index"
  get "/B", to: "pages#index"
end
