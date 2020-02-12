# frozen_string_literal: true

require "rails_helper"

describe "Upload asset" do

  let(:fixture_path) { File.expand_path('./spec/fixtures/sample.json') }
  let(:non_exist_fixture_path) { File.expand_path('./spec/fixtures/sample99.json') }
  let(:asset_path) { File.expand_path('./public/webpack/production/sample.json') }
  let!(:orig_renderer_url) { ReactOnRailsPro.configuration.renderer_url }

  before(:each) do
    File.delete(asset_path) if File.exist?(asset_path)
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
    WebMock.disable_net_connect!(allow_localhost: false)
    stubbed_request = stub_request(:any, /upload-asset/).
        to_timeout
    expect do
      ReactOnRailsPro::RequestHelper.upload_asset(fixture_path, "application/json")
    end.to raise_exception(ReactOnRailsPro::Error)
    WebMock.allow_net_connect!
  end
end
