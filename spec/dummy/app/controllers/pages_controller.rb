# frozen_string_literal: true

class PagesController < ApplicationController
  include ReactOnRailsPro::RSCPayloadRenderer

  XSS_PAYLOAD = { "<script>window.alert('xss1');</script>" => '<script>window.alert("xss2");</script>' }.freeze
  PROPS_NAME = "Mr. Server Side Rendering"
  APP_PROPS_SERVER_RENDER = {
    helloWorldData: {
      name: PROPS_NAME
    }.merge(XSS_PAYLOAD)
  }.freeze

  before_action do
    session[:something_useful] = "REALLY USEFUL"
  end

  before_action :data

  before_action :initialize_shared_store, only: %i[client_side_hello_world_shared_store_controller
                                                   server_side_hello_world_shared_store_controller]

  # Used for testing streamed html pages
  # Capybara doesn't support streaming, so we need to navigate to an empty page first
  # and then make an XHR request to the desired page
  # We need to navigate to an empty page first to avoid CORS issues and to update the page host
  def empty
    render plain: ""
  end

  def cached_react_helmet
    render "/pages/pro/cached_react_helmet"
  end

  def stream_async_components
    stream_view_containing_react_components(template: "/pages/stream_async_components")
  end

  def stream_async_components_for_testing
    stream_view_containing_react_components(template: "/pages/stream_async_components_for_testing")
  end

  def rsc_posts_page_over_http
    stream_view_containing_react_components(template: "/pages/rsc_posts_page_over_http")
  end

  def rsc_posts_page_over_redis
    @request_id = SecureRandom.uuid

    Thread.new do
      redis = ::Redis.new
      posts = Post.all
      posts = posts.group_by { |post| post[:user_id] }.map { |_, user_posts| user_posts.first }
      Rails.logger.info "Adding posts to stream #{@request_id}"
      redis.xadd("stream:#{@request_id}", { ":posts" => posts.to_json })

      all_posts_comments = []
      posts.each do |post|
        Rails.logger.info "Adding comments to stream #{@request_id}"
        post_comments = post.comments
        all_posts_comments += post_comments
        redis.xadd("stream:#{@request_id}", { ":comments:#{post[:id]}" => post_comments.to_json })
      end
      all_posts_comments.each do |comment|
        redis.xadd("stream:#{@request_id}", { ":user:#{comment[:user_id]}" => comment.user.to_json })
      end
      redis.xadd("stream:#{@request_id}", { "end" => "true" })
    end

    stream_view_containing_react_components(template: "/pages/rsc_posts_page_over_redis")
  end

  def async_on_server_sync_on_client
    @render_on_server = true
    stream_view_containing_react_components(template: "/pages/async_on_server_sync_on_client")
  end

  def async_on_server_sync_on_client_client_render
    @render_on_server = false
    render "/pages/async_on_server_sync_on_client"
  end

  def server_router
    stream_view_containing_react_components(template: "/pages/server_router")
  end

  def posts_page # rubocop:disable Metrics/AbcSize
    artificial_delay = params[:artificial_delay] || 0
    posts = JSON.parse(HTTPX.get("http://localhost:3000/api/posts").body, symbolize_names: true)
    # pick one post per user
    posts = posts.group_by { |post| post[:user_id] }.map { |_, user_posts| user_posts.first }
    posts = posts.map do |post|
      comments = JSON.parse(HTTPX.get("http://localhost:3000/api/posts/#{post[:id]}/comments").body,
                            symbolize_names: true)
      comments = comments.map do |comment|
        comment.merge(user: JSON.parse(HTTPX.get("http://localhost:3000/api/users/#{comment[:user_id]}").body,
                                       symbolize_names: true))
      end
      post.merge(comments: comments)
    rescue StandardError => e
      raise "Error while fetching post #{post} #{post[:id]}: #{e.message}"
    end
    sleep artificial_delay.to_i / 1000 * 2
    @posts = posts
    render "/pages/posts_page"
  end

  def loadable_component
    render "/pages/pro/loadable_component"
  end

  def cached_redux_component
    render "/pages/pro/cached_redux_component"
  end

  def server_render_with_timeout
    render "/pages/pro/server_render_with_timeout"
  end

  def apollo_graphql
    render "/pages/pro/apollo_graphql"
  end

  def lazy_apollo_graphql
    render "/pages/pro/lazy_apollo_graphql"
  end

  def console_logs_in_async_server
    render "/pages/pro/console_logs_in_async_server"
  end

  # See files in spec/dummy/app/views/pages

  helper_method :calc_slow_app_props_server_render

  private

  def calc_slow_app_props_server_render
    msg = <<-MSG.strip_heredoc
      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
      calling slow calc_slow_app_props_server_render
      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    MSG
    Rails.logger.info msg
    render_to_string(template: "/pages/pro/serialize_props",
                     locals: { name: PROPS_NAME }, formats: :json)
  end

  def initialize_shared_store
    redux_store("SharedReduxStore", props: @app_props_server_render)
  end

  def data
    # This is the props used by the React component.
    @app_props_server_render = APP_PROPS_SERVER_RENDER

    @app_props_hello = {
      helloWorldData: {
        name: "Mrs. Client Side Rendering"
      }.merge(XSS_PAYLOAD)
    }

    @app_props_hello_again = {
      helloWorldData: {
        name: "Mrs. Client Side Hello Again"
      }.merge(XSS_PAYLOAD)
    }
  end
end
