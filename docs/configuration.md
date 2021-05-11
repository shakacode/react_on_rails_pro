`config/initializers/react_on_rails_pro.rb`

1. You don't need to create a initializer if you are satisfied with the defaults as described below.
1. Values beginning with `renderer` pertain only to using an external rendering server. You will need to ensure these values are consistent with your configuration for the external rendering server, as given in [docs/node-renderer/js-configuration.md](./node-renderer/js-configuration.md)
1. `config.prerender_caching` works for standard mini_racer server rendering and using an external rendering server.

# Example of Configuration

Also see [spec/dummy/config/initializers/react_on_rails_pro.rb](../../spec/dummy/config/initializers/react_on_rails_pro.rb) for how the testing app is setup.

The below example is a typical production setup, using the separate `NodeRenderer`, where development takes the defaults when the ENV values are not specified.

```ruby
ReactOnRailsPro.configure do |config|
  # If true, then capture timing of React on Rails Pro calls including server rendering and
  # component rendering.
  # Default for `tracing` is false.
  config.tracing = true

  # Array of globs to find any files for which changes should bust the fragment cache for
  # cached_react_component and cached_react_component_hash. This should include any files used to
  # generate the JSON props, webpack and/or webpacker configuration files, and npm package lockfiles.
  config.dependency_globs = [ File.join(Rails.root, "app", "views", "**", "*.jbuilder") ]

  # Array of globs to exclude from config.dependency_globs for ReactOnRailsPro cache key hashing
  config.excluded_dependency_globs = [ File.join(Rails.root, "app", "views", "**", "dont_hash_this.jbuilder") ]

  # If configured, ReactOnRailsPro::AssetsPrecompile will call the build, fetch, & upload methods
  # of the module assigned to config.remote_bundle_cache_adapter to cache webpack production bundles remotely
  # To run this during assets precompilation, configure config/initializers/react_on_rails.rb as follows:
  # Note, this next line is the React on Rails, not the Pro, configuration!
  # config.build_production_command = ReactOnRailsPro::AssetsPrecompile
  # 
  # Once configured for bundle caching, ReactOnRailsPro::AssetsPrecompile's caching functionality
  # can be disabled by setting ENV["DISABLE_PRECOMPILE_CACHE"] equal to "true"
  # 
  # Next, uncomment and configure the next line, substituting your own remote_bundle_cache_adapter
  # See the example below for an example definition of a S3BundleCacheAdapter
  # config.remote_bundle_cache_adapter = S3Adapter

  # ALL OPTIONS BELOW ONLY APPLY IF SERVER RENDERING

  # If true, then cache the evaluation of JS for prerendering using the standard Rails cache.
  # Applies to all rendering engines.
  # Default for `prerender_caching` is false.  
  config.prerender_caching = true

  # Retry request in case of time out on the node-renderer side
  # 5 - default, if not specified
  # 0 - no retry
  config.renderer_request_retry_limit = 5

  # NodeRenderer is for a renderer that is stateless. It does not need restarting when the JS bundles
  # are updated. It is the only custom renderer currently supported. Leave blank to use the standard
  # mini_racer rendering. Other option is NodeRenderer
  # Default for `server_renderer` is "ExecJS"
  config.server_renderer = "NodeRenderer"

  # If you're using the NodeRenderer, a value of true allows errors to be thrown from the bundle
  # code for SSR so that an error tracking system on the NodeRender can use the exceptions.
  # This value defaults to false. It should only be set to true when using the NodeRender.
  config.throw_js_errors = false

  # You may provide a password and/or a port that will be sent to renderer for simple authentication.
  # `https://:<password>@url:<port>`. For example: https://:myPassword1@renderer:3800. Don't forget
  # the leading `:` before the password. Your password must also not contain certain characters that
  # would break calling URI(config.renderer_url). This includes: `@`, `#`, '/'.
  # **Note:** Don't forget to set up **SSL** connection (https) otherwise password will useless
  # since it will be easy to intercept it.
  # If you provide an ENV value (maybe only for production) and there is no value, then you get the default.
  # Default for `renderer_url` is "http://localhost:3800".
  config.renderer_url = ENV["RENDERER_URL"]

  # If you don't want to worry about special characters in your password within the url, use this config value
  # Default for `renderer_password` is ""
  # config.renderer_password = ENV["RENDERER_PASSWORD"]

  # If false, then crash if no backup rendering when the remote renderer is not available
  # Can be useful to set to false in development or testing to make sure that the remote renderer
  # works and any non-availability of the remote renderer does not just do ExecJS.
  # Default for `renderer_use_fallback_exec_js` is true.
  config.renderer_use_fallback_exec_js = true

  # The maximum size of the http connection pool,
  # Set +pool_size+ to limit the maximum number of connections allowed.
  # Defaults to 1/4 the number of allowed file handles.  You can have no more
  # than this many threads with active HTTP transactions.
  # Default for `renderer_http_pool_size` is 10
  config.renderer_http_pool_size = 10

  # Seconds to wait for an available connection before a Timeout::Error is raised
  # Default for `renderer_http_pool_timeout` is 5
  config.renderer_http_pool_timeout = 5

  # warn_timeout  - Displays an error message if a checkout takes longer that the given time in seconds
  # (used to give hints to increase the pool size). Default is 0.25
  config.renderer_http_pool_warn_timeout = 0.25 # seconds

  # Snippet of JavaScript to be run right at the beginning of the server rendering process. The code
  # to be executed must either be self contained or reference some globally exposed module.  
  # For example, suppose that we had to call `SomeLibrary.clearCache()`between every call to server
  # renderer to ensure no leakage of state between calls. Note, SomeLibrary needs to be globally
  # exposed in the server rendering webpack bundle. This code is visible in the tracing of the calls
  # to do server rendering. Default is nil.
  config.ssr_pre_hook_js = "SomeLibrary.clearCache();"

  # When using the Node Renderer, you may require some extra assets in addition to the bundle.
  # The assets_to_copy option allows the Node Renderer to have assets copied at the end of
  # the assets:precompile task or directly by the
  # react_on_rails_pro:copy_assets_to_vm_renderer tasks.
  # These assets are also transferred any time a new bundle is sent from Rails to the renderer.
  # The value should be a file_path or an Array of file_paths. The files should have extensions
  # to resolve the content types, such as "application/json".
  config.assets_to_copy = [
     Rails.root.join("public", "webpack", Rails.env, "loadable-stats.json"),
     Rails.root.join("public", "webpack", Rails.env, "manifest.json")
  ]
end
```

Example of a module for custom methods for the `remote_bundle_cache_adapter` that does not save files
remotely. Local caches are used.

```ruby
class LocalBundleCacheAdapter
  def self.build
    Rake.sh(ReactOnRails::Utils.prepend_cd_node_modules_directory('yarn start build.prod').to_s)
  end

  def self.fetch(zipped_bundles_filename:)
    # no-op
  end

  def self.upload(zipped_bundles_filepath:)
    # no-op
  end
end
```


## S3BundleCacheAdapter 
Example of a module for custom methods for the `remote_bundle_cache_adapter`.

Note, S3UploadService is your own code that fetches and uploads.

```ruby
class S3BundleCacheAdapter
  # return value is unused
  # This command should build the bundles
  def self.build
    Rake.sh(ReactOnRails::Utils.prepend_cd_node_modules_directory('yarn start build.prod').to_s)
  end

  # parameter zipped_bundles_filename will be a string
  # should return the zipped file as a string if successful & nil if not
  def self.fetch(zipped_bundles_filename:)
    result = S3UploadService.new.fetch_object(zipped_bundles_filename)
    result.get.body.read if result
  end

  # parameter zipped_bundles_filepath will be a Pathname
  # return value is unused
  def self.upload(zipped_bundles_filepath:)
    return unless ENV['UPLOAD_BUNDLES_TO_S3'] == 'true'

    zipped_bundles_filename = zipped_bundles_filepath.basename.to_s
    puts "Bundles are being uploaded to s3 as #{zipped_bundles_filename}"
    starting = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    S3UploadService.new.upload_object(zipped_bundles_filename,
                                      File.read(zipped_bundles_filepath, mode: 'rb'),
                                      'application/zip', expiration_months: 12)
    ending = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    elapsed = (ending - starting).round(2)
    puts "Bundles uploaded to s3 as #{zipped_bundles_filename} in #{elapsed} seconds"
  end
end
```

## LocalBundleCacheAdapter
Example of a module for custom methods for the `remote_bundle_cache_adapter` that does not save files
remotely. Local caches are used.

```ruby
class LocalBundleCacheAdapter
  def self.build
    Rake.sh(ReactOnRails::Utils.prepend_cd_node_modules_directory('yarn start build.prod').to_s)
  end

  def self.fetch(zipped_bundles_filename:)
    # no-op
  end

  def self.upload(zipped_bundles_filepath:)
    # no-op
  end
end
```
