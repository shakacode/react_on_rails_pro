# frozen_string_literal: true

module ReactOnRailsPro
  class AssetsPrecompile
    include Singleton

    def remote_bundle_cache_adapter
      if ReactOnRailsPro.configuration.remote_bundle_cache_adapter.nil?
        raise ReactOnRailsPro::AssetsPrecompileError, "config.remote_bundle_cache_adapter must have a module assigned"
      end

      unless ReactOnRailsPro.configuration.remote_bundle_cache_adapter.methods.include?(:build)
        raise ReactOnRailsPro::AssetsPrecompileError,
              "config.remote_bundle_cache_adapter must be a module or class with a static method named 'build'"
      end

      ReactOnRailsPro.configuration.remote_bundle_cache_adapter
    end

    def zipped_bundles_filename
      "precompile-cache.#{bundles_cache_key}.production.gz"
    end

    def zipped_bundles_filepath
      @zipped_bundles_filepath ||=
        begin
          FileUtils.mkdir_p(Rails.root.join("tmp", "bundle_cache"))
          Rails.root.join("tmp", "bundle_cache", zipped_bundles_filename)
        end
    end

    def bundles_cache_key
      @bundles_cache_key ||=
        begin
          ReactOnRailsPro::Utils.rorp_puts "Calculating digest of bundle dependencies."
          starting = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          cache_dependencies = [Webpacker.config.source_path.join("**/*.*")]
                               .union(ReactOnRailsPro.configuration.dependency_globs)
          result = ReactOnRailsPro::Utils.digest_of_globs(cache_dependencies)
          ending = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          elapsed = (ending - starting).round(2)
          ReactOnRailsPro::Utils.rorp_puts "Completed calculating digest of bundle dependencies in #{elapsed} seconds."
          result
        end
    end

    def build_bundles
      remote_bundle_cache_adapter.build
    end

    def self.call
      instance.build_or_fetch_bundles
    end

    def build_or_fetch_bundles
      if disable_precompile_cache?
        build_bundles
        return
      end

      return if fetch_and_unzip_cached_bundles

      build_bundles
      cache_bundles
    end

    def disable_precompile_cache?
      ENV["DISABLE_PRECOMPILE_CACHE"] == "true"
    end

    def fetch_bundles
      unless remote_bundle_cache_adapter.methods.include?(:fetch)
        ReactOnRailsPro::Utils.rorp_puts "config.remote_bundle_cache_adapter must have a static method named 'fetch'"
        ReactOnRailsPro::Utils.rorp_puts "which takes a single named String parameter 'zipped_bundles_filename'"
        ReactOnRailsPro::Utils.rorp_puts "This will be evaluated as a remote bundle cache miss"
        return false
      end

      ReactOnRailsPro::Utils.rorp_puts "Checking for a cached bundle: #{zipped_bundles_filename}"
      fetch_result = remote_bundle_cache_adapter.fetch({ zipped_bundles_filename: zipped_bundles_filename })

      if fetch_result
        ReactOnRailsPro::Utils.rorp_puts "Remote bundle cache detected. Bundles will be restored to local cache."
        File.open(zipped_bundles_filepath, "wb") { |file| file.write(fetch_result) }
        true
      else
        ReactOnRailsPro::Utils.rorp_puts "Remote bundle cache not found."
        false
      end
    end

    def fetch_and_unzip_cached_bundles
      if disable_precompile_cache?
        ReactOnRailsPro::Utils.rorp_puts "The sentinel value for disabling precompile caching has been detected."
        ReactOnRailsPro::Utils.rorp_puts "Skipping dependency hashing & bundle cache fetch."
        return false
      end

      # First check for file in tmp directory from last build
      if File.exist?(zipped_bundles_filepath)
        ReactOnRailsPro::Utils.rorp_puts "Found a local cache of bundles: #{zipped_bundles_filepath}"
        result = true
      else
        result = fetch_bundles
      end

      if File.exist?(zipped_bundles_filepath)
        ReactOnRailsPro::Utils.rorp_puts "gunzipping bundle cache: #{zipped_bundles_filepath}"
        Rake.sh "tar -xzf #{zipped_bundles_filepath}"
        ReactOnRailsPro::Utils.rorp_puts "gunzipped bundle cache: #{zipped_bundles_filepath}"
      end
      result
    end

    def cache_bundles
      ReactOnRailsPro::Utils.rorp_puts "Gzipping built bundles to #{zipped_bundles_filepath}."
      Rake.sh "tar -czf #{zipped_bundles_filepath} --auto-compress public/webpack/production"

      unless remote_bundle_cache_adapter.methods.include?(:upload)
        ReactOnRailsPro::Utils.rorp_puts "config.remote_bundle_cache_adapter must have a static method named 'upload'"
        ReactOnRailsPro::Utils.rorp_puts "which takes a single named Pathname parameter 'zipped_bundles_filepath'"
        return false
      end

      ReactOnRailsPro::Utils.rorp_puts "Bundles will be uploaded to remote bundle cache as #{zipped_bundles_filename}"
      remote_bundle_cache_adapter.upload({ zipped_bundles_filepath: zipped_bundles_filepath })
    end
  end
end
