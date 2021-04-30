# frozen_string_literal: true

module ReactOnRailsPro
  class AssetsPrecompile
    include Singleton

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
          puts "Calculating digest of bundle dependencies."
          starting = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          cache_dependencies = [Webpacker.config.source_path.join("**/*.*")]
                               .union(ReactOnRailsPro.configuration.dependency_globs)
          result = ReactOnRailsPro::Utils.digest_of_globs(cache_dependencies)
          ending = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          elapsed = (ending - starting).round(2)
          puts "Completed calculating digest of bundle dependencies in #{elapsed} seconds."
          result
        end
    end

    def build_bundles
      remote_adapter = ReactOnRailsPro.configuration.remote_bundle_cache_adapter
      unless remote_adapter.present? && remote_adapter.methods.include?(:build)
        raise "config.remote_bundle_cache_adapter is either not configured or not properly implemented."
      end

      remote_adapter.build
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
      remote_adapter = ReactOnRailsPro.configuration.remote_bundle_cache_adapter
      unless remote_adapter.present? && remote_adapter.methods.include?(:fetch)
        puts "config.remote_bundle_cache_adapter is either not configured or not properly implemented." \
        "This will be evaluated as a remote bundle cache miss."
        return false
      end

      puts "Checking for a cached bundle: #{zipped_bundles_filename}"
      begin
        fetch_result = remote_adapter.fetch(zipped_bundles_filename)

        if fetch_result
          puts "Remote bundle cache detected. Bundles will be restored to local bundle cache."
          File.open(zipped_bundles_filepath, "wb") { |file| file.write(fetch_result) }
          true
        else
          puts "Remote bundle cache not found."
          false
        end
      rescue StandardError => e
        puts "There was an error during the remote bundle cache fetch request:" \
             "#{e.inspect}. This will be evaluated as a remote bundle cache miss."
        false
      end
    end

    def fetch_and_unzip_cached_bundles
      if disable_precompile_cache?
        puts "The sentinel value for disabling precompile caching has been detected."\
             " Skipping dependency hashing & bundle cache fetch."
        return false
      end

      # First check for file in tmp directory from last build
      if File.exist?(zipped_bundles_filepath)
        puts "Found a local cache of bundles: #{zipped_bundles_filepath}"
        result = true
      else
        result = fetch_bundles
      end

      if File.exist?(zipped_bundles_filepath)
        puts "gunzipping bundle cache: #{zipped_bundles_filepath}"
        Rake.sh "tar -xzf #{zipped_bundles_filepath}"
        puts "gunzipped bundle cache: #{zipped_bundles_filepath}"
      end
      result
    end

    def cache_bundles
      puts "Gzipping built bundles to #{zipped_bundles_filepath}."
      Rake.sh "tar -czf #{zipped_bundles_filepath} --auto-compress public/webpack/production"

      remote_adapter = ReactOnRailsPro.configuration.remote_bundle_cache_adapter

      return unless remote_adapter.present? && remote_adapter.methods.include?(:upload)

      puts "Bundles are being uploaded to remote bundle cache as #{zipped_bundles_filename}"
      begin
        remote_adapter.upload(zipped_bundles_filepath)
      rescue StandardError => e
        puts "There was an error during the remote bundle cache upload request: #{e.inspect}"
      end
    end
  end
end
