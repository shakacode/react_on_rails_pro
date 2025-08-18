### Streaming prerender caching (overview for review)

- Config flag
  - `lib/react_on_rails_pro/configuration.rb`: added `stream_prerender_caching` (default false). Gate streaming cache separately from existing `prerender_caching`.

- Helper: `lib/react_on_rails_pro/stream_cache.rb`
  - `fetch_stream(cache_key)`: reads `Rails.cache` for an Array of chunks; if found, wraps a `CachedChunksComponent` in `ReactOnRailsPro::StreamDecorator` so `.prepend/.transform/.append` continue to work.
  - `wrap_and_cache(cache_key, upstream_stream, cache_options:)`: wraps a live upstream stream in a `CachingComponent` that forwards chunks to the client and buffers them; after completion, writes the chunk array to `Rails.cache`. Returns a `StreamDecorator` over that component.
  - Implementation aligns with `StreamDecorator`’s contract (expects an object exposing `each_chunk`).

- Integration: `lib/react_on_rails_pro/server_rendering_pool/pro_rendering.rb`
  - In `exec_server_render_js` we still compute the same cache key and keep the non-streaming `Rails.cache.fetch` path.
  - For streaming, when `config.stream_prerender_caching` is true:
    - Try `StreamCache.fetch_stream(key)`; on HIT, return cached stream (no Node call).
    - On MISS, call `render_on_pool` to get the upstream stream and return `StreamCache.wrap_and_cache(key, upstream, cache_options: ...)`.

### Code snippets

lib/react_on_rails_pro/configuration.rb

```
stream_prerender_caching: Configuration::DEFAULT_STREAM_PRERENDER_CACHING,
```

```
DEFAULT_STREAM_PRERENDER_CACHING = false
...
attr_accessor :..., :prerender_caching, :stream_prerender_caching, ...
...
self.stream_prerender_caching = stream_prerender_caching
```

lib/react_on_rails_pro/server_rendering_pool/pro_rendering.rb

```
if ReactOnRailsPro.configuration.prerender_caching &&
   render_options.internal_option(:skip_prerender_cache).nil? &&
   (!render_options.streaming? || ReactOnRailsPro.configuration.stream_prerender_caching)
  prerender_cache_key = cache_key(js_code, render_options)
  result = if render_options.streaming?
             cached_stream = ReactOnRailsPro::StreamCache.fetch_stream(prerender_cache_key)
             if cached_stream
               cached_stream
             else
               upstream = render_on_pool(js_code, render_options)
               ReactOnRailsPro::StreamCache.wrap_and_cache(
                 prerender_cache_key,
                 upstream,
                 cache_options: render_options.internal_option(:cache_options)
               )
             end
           else
             Rails.cache.fetch(prerender_cache_key) { render_on_pool(js_code, render_options) }
           end
end
```

lib/react_on_rails_pro/stream_cache.rb

```
# frozen_string_literal: true

module ReactOnRailsPro
  class StreamCache
    class << self
      # Returns a stream-like object that responds to `each_chunk` and yields cached chunks
      # or nil if not present in cache.
      def fetch_stream(cache_key)
        cached_chunks = Rails.cache.read(cache_key)
        return nil unless cached_chunks.is_a?(Array)

        component = CachedChunksComponent.new(cached_chunks)
        ReactOnRailsPro::StreamDecorator.new(component)
      end

      # Wraps an upstream stream (responds to `each_chunk`), yields chunks downstream while
      # buffering them, and writes the chunks array to Rails.cache on successful completion.
      # Returns a stream-like object that responds to `each_chunk`.
      def wrap_and_cache(cache_key, upstream_stream, cache_options: nil)
        component = CachingComponent.new(upstream_stream, cache_key, cache_options)
        ReactOnRailsPro::StreamDecorator.new(component)
      end

      # Builds a stream-like object from an array of chunks.
      def build_stream_from_chunks(chunks)
        component = CachedChunksComponent.new(chunks)
        ReactOnRailsPro::StreamDecorator.new(component)
      end
    end

    class CachedChunksComponent
      def initialize(chunks)
        @chunks = chunks
      end

      def each_chunk(&block)
        return enum_for(:each_chunk) unless block
        @chunks.each { |chunk| block.call(chunk) }
      end
    end

    class CachingComponent
      def initialize(upstream_stream, cache_key, cache_options)
        @upstream_stream = upstream_stream
        @cache_key = cache_key
        @cache_options = cache_options
      end

      def each_chunk(&block)
        return enum_for(:each_chunk) unless block
        buffered_chunks = []
        @upstream_stream.each_chunk do |chunk|
          buffered_chunks << chunk
          block.call(chunk)
        end
        Rails.cache.write(@cache_key, buffered_chunks, @cache_options || {})
      end
    end
  end
end
```

### Notes
- Chose to cache after `StreamDecorator` by wrapping components that implement `each_chunk`, keeping the pipeline natural and preserving `.prepend/.transform/.append` semantics.
- Cache key matches non-streaming (bundle hash + `request_digest`), so invalidates on bundle changes.
