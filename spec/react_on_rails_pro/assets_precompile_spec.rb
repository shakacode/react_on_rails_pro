# frozen_string_literal: true

require_relative "./spec_helper"
require_relative "../../lib/react_on_rails_pro/assets_precompile"

describe ReactOnRailsPro::AssetsPrecompile do
  describe ".bundles_cache_key" do
    it "calls ReactOnRailsPro::Utils.digest_of_globs with the union of " \
    "Webpacker.config.source_path & ReactOnRailsPro.configuration.dependency_globs" do
      expected_parameters = %w[source_path dependency_globs]

      source_path = instance_double(Pathname)
      allow(source_path).to receive(:join).and_return(expected_parameters.first)

      webpacker_config = instance_double(Webpacker::Configuration)
      allow(webpacker_config).to receive(:source_path).and_return(source_path)

      allow(Webpacker).to receive(:config).and_return(webpacker_config)

      ror_pro_config = instance_double(ReactOnRailsPro::Configuration)

      allow(ror_pro_config).to receive(:dependency_globs).and_return([expected_parameters.last])

      allow(ror_pro_config).to receive(:enable_glob_exclusion_for_bundle_caching).and_return(false)

      allow(ReactOnRailsPro).to receive(:configuration).and_return(ror_pro_config)

      expect(ReactOnRailsPro::Utils).to receive(:digest_of_globs).with(expected_parameters,
                                                                       enable_exclusion_globs: false)

      described_class.instance.bundles_cache_key
    end
  end

  describe ".build_or_fetch_bundles" do
    context "when ENV['DISABLE_PRECOMPILE_CACHE'] is not present" do

      before do
        ENV['DISABLE_PRECOMPILE_CACHE'] = nil
      end

      it "tries to fetch cached bundles" do
        instance = described_class.instance

        expect(instance).to receive(:fetch_and_unzip_cached_bundles).once.and_return(true)
        expect(instance).not_to receive(:build_bundles)
        expect(instance).not_to receive(:cache_bundles)

        instance.build_or_fetch_bundles
      end

      it "calls build_bundles & cache_bundles if cached bundles can't be fetched" do
        instance = described_class.instance

        allow(instance).to receive(:fetch_and_unzip_cached_bundles).and_return(false)
        expect(instance).to receive(:fetch_and_unzip_cached_bundles).once
        allow(instance).to receive(:build_bundles).and_return(nil)
        expect(instance).to receive(:build_bundles).once
        allow(instance).to receive(:cache_bundles).and_return(nil)
        expect(instance).to receive(:cache_bundles).once

        instance.build_or_fetch_bundles
      end
    end

    context "when ENV['DISABLE_PRECOMPILE_CACHE'] is present" do

      before do
        ENV['DISABLE_PRECOMPILE_CACHE'] = 'true'
      end

      it "doesn't check for cached bundles" do
        instance = described_class.instance

        allow(instance).to receive(:build_bundles).and_return(nil)
        expect(instance).to receive(:build_bundles).once
        expect(instance).not_to receive(:cache_bundles)
        expect(instance).not_to receive(:fetch_and_unzip_cached_bundles)

        instance.build_or_fetch_bundles
      end
    end
  end

  describe ".fetch_bundles" do
    context "when config.remote_bundle_cache_adapter is not correct" do
      it "prints an error message and returns false" do
        ror_pro_config = instance_double(ReactOnRailsPro::Configuration)
        allow(ror_pro_config).to receive(:remote_bundle_cache_adapter).and_return(nil)

        expect(described_class.instance.fetch_bundles).to be_falsey
      end
    end

    context "when config.remote_bundle_cache_adapter is correct" do
      it "writes the fetched bundle cache to disk" do
        adapter = Module.new do
          def self.fetch(filename)
            true
          end
        end
        ror_pro_config = instance_double(ReactOnRailsPro::Configuration)
        allow(ror_pro_config).to receive(:remote_bundle_cache_adapter).and_return(adapter)
        allow(ReactOnRailsPro).to receive(:configuration).and_return(ror_pro_config)

        instance = described_class.instance
        allow(instance).to receive(:zipped_bundles_filename).and_return("a")
        allow(instance).to receive(:zipped_bundles_filepath).and_return("b")

        allow(File).to receive(:open).and_return(true)
        expect(File).to receive(:open).once

        expect(instance.fetch_bundles).to be_truthy
      end
    end
  end

  describe ".fetch_and_unzip_cached_bundles" do
    context "when ENV['DISABLE_PRECOMPILE_CACHE'] is present" do

      before do
        ENV['DISABLE_PRECOMPILE_CACHE'] = 'true'
      end

      it "imediately returns" do
        expect(File).not_to receive(:exist?)

        expect(described_class.instance.fetch_and_unzip_cached_bundles).to eq(false)
      end
    end

    context "when ENV['DISABLE_PRECOMPILE_CACHE'] is not present" do

      before do
        ENV['DISABLE_PRECOMPILE_CACHE'] = nil
      end

      it "tries to fetch bundles if local cache is not detected" do
        allow(File).to receive(:exist?).and_return(false)

        instance = described_class.instance
        allow(instance).to receive(:fetch_bundles).and_return(false)
        allow(instance).to receive(:zipped_bundles_filepath).and_return("a")

        expect(instance.fetch_and_unzip_cached_bundles).to eq(false)
      end

      it "does not try to fetch remote cache if local cache exists" do
        allow(File).to receive(:exist?).and_return(true, false)

        instance = described_class.instance
        expect(instance).not_to receive(:fetch_bundles)
        allow(instance).to receive(:zipped_bundles_filepath).and_return("a")

        expect(instance.fetch_and_unzip_cached_bundles).to eq(true)
      end

      it "returns the same value as fetch_bundles" do
        allow(File).to receive(:exist?).and_return(false)

        instance = described_class.instance
        allow(instance).to receive(:zipped_bundles_filepath).and_return("a")
        expect(instance).to receive(:fetch_bundles).once.and_return(true)

        expect(instance.fetch_and_unzip_cached_bundles).to eq(true)
      end
    end
  end
end
