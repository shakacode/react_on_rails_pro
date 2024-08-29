# frozen_string_literal: true

class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  rescue_from ReactOnRails::PrerenderError do |err|
    Rails.logger.error("Caught ReactOnRails::PrerenderError in ApplicationController error handler.")
    Rails.logger.error(err.message)
    Rails.logger.error(err.backtrace.join("\n"))

    if response.committed?
      Rails.logger.error("Error occurred after part of the response already sent, " \
                         "the error should happen during streaming react component " \
                         "and the error happen outside the shell")

      error_message = "<h2>Server-Side Rendering Error</h2>"
      error_message += "<p>We apologize, but an error occurred while rendering " \
                       "the page on the server.</p>"
      error_message += "<p>If you are not redirected, please " \
                       "<a href=\"#{server_side_log_throw_raise_invoker_path}\">" \
                       "click here</a>.</p>"

      # Attempt to redirect using JavaScript
      js_redirect = "<script>"
      js_redirect += "document.getElementById('page-container').innerHTML = '#{error_message}';"
      js_redirect += "setTimeout(function() { " \
                     "window.location.href = '#{server_side_log_throw_raise_invoker_path}'; " \
                     "}, 5000);"
      js_redirect += "</script>"

      # Fallback to meta refresh if JavaScript is not supported
      meta_refresh = "<meta http-equiv='refresh' content='5;url=#{server_side_log_throw_raise_invoker_path}'>"

      # Write error message, JavaScript redirect, and meta refresh
      response.stream.write(error_message + js_redirect + meta_refresh)

      response.stream.close
    else
      msg = <<-MSG.strip_heredoc
        Error prerendering in react_on_rails.
        Redirected back to '/server_side_log_throw_raise_invoker'.
        See server logs for output.
      MSG
      redirect_to server_side_log_throw_raise_invoker_path,
                  flash: { error: msg }
    end
  end
end
