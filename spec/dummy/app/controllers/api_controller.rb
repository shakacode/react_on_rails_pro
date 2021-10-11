# frozen_string_literal: true

class ApiController < ActionController::API
  def test_network_request
    msg = {status: "ok", message: "API requests during server rendering work!"}
    render json: msg
  end
end
