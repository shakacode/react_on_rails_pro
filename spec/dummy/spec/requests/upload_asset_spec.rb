# frozen_string_literal: true

require "rails_helper"

describe "Upload asset" do
  let(:fixture_path) { File.expand_path('./spec/fixtures/sample.json') }
  let(:non_exist_fixture_path) { File.expand_path('./spec/fixtures/sample99.json') }
  let(:asset_path) { File.expand_path('./public/webpack/production/sample.json') }

  before(:each) do
    File.delete(asset_path) if File.exist?(asset_path)
  end

  after(:all) do
    ReactOnRailsPro.configure do |config|
      config.renderer_url = "https://localhost:3800"
    end
    ReactOnRailsPro::RequestHelper.reset_connection
  end

  it "copying asset to public folder" do
    expect(File).not_to exist(asset_path)
    ReactOnRailsPro::RequestHelper.upload_asset(fixture_path, "application/json")
    expect(File).to exist(asset_path)
  end

  it "throwrs error if asset not found" do
    expect do
      ReactOnRailsPro::RequestHelper.upload_asset(non_exist_fixture_path, "application/json")
    end.to raise_error("Asset not found #{non_exist_fixture_path}")
  end

  it "throws error if can't connect to vm-renderer" do
    invalid_url = "http://localhost:99999"
    expect do
      ReactOnRailsPro.configure do |config|
        config.renderer_url = invalid_url
      end
      ReactOnRailsPro::RequestHelper.reset_connection
      ReactOnRailsPro::RequestHelper.upload_asset(fixture_path, "application/json")
    end.to raise_exception(ReactOnRailsPro::Error)
  end
end
