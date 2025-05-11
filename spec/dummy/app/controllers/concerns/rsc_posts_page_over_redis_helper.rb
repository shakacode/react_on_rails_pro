# frozen_string_literal: true

module RscPostsPageOverRedisHelper
  extend ActiveSupport::Concern

  private

  def write_posts_and_comments_to_redis(redis)
    posts = fetch_posts
    add_posts_to_stream(redis, posts)
    write_comments_for_posts_to_redis(redis, posts)
    redis.xadd("stream:#{@request_id}", { "end" => "true" })
  end

  def fetch_posts
    posts = Post.all
    posts.group_by { |post| post[:user_id] }.map { |_, user_posts| user_posts.first }
  end

  def add_posts_to_stream(redis, posts)
    Rails.logger.info "Adding posts to stream #{@request_id}"
    redis.xadd("stream:#{@request_id}", { ":posts" => posts.to_json })
  end

  def write_comments_for_posts_to_redis(redis, posts)
    all_posts_comments = []
    posts.each do |post|
      write_comments_for_post_to_redis(redis, post, all_posts_comments)
    end
    write_users_for_comments_to_redis(redis, all_posts_comments)
  end

  def write_comments_for_post_to_redis(redis, post, all_posts_comments)
    Rails.logger.info "Adding comments to stream #{@request_id}"
    post_comments = post.comments
    all_posts_comments.concat(post_comments)
    redis.xadd("stream:#{@request_id}", { ":comments:#{post[:id]}" => post_comments.to_json })
  end

  def write_users_for_comments_to_redis(redis, comments)
    comments.each do |comment|
      redis.xadd("stream:#{@request_id}", { ":user:#{comment[:user_id]}" => comment.user.to_json })
    end
  end
end
