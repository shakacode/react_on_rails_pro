# frozen_string_literal: true

require "rails_helper"

describe "Upload asset", if: ENV["SERVER_RENDERER"] != "ExecJS" do
  let(:fixture_path) { File.expand_path("./spec/fixtures/sample.json") }
  let(:non_exist_fixture_path) { File.expand_path("./spec/fixtures/sample99.json") }
  let(:asset_path) { "/sample.json" }
  let(:asset_path_expanded) { File.expand_path("./public/webpack/production#{asset_path}") }

  before(:each) do
    File.delete(asset_path_expanded) if File.exist?(asset_path_expanded)
  end

  it "copying asset to public folder" do
    expect(asset_exist?).to eq(false)
    ReactOnRailsPro::RequestHelper.upload_asset(fixture_path, "application/json")
    expect(asset_exist?).to eq(true)
  end

  it "throwrs error if asset not found" do
    expect do
      ReactOnRailsPro::RequestHelper.upload_asset(non_exist_fixture_path, "application/json")
    end.to raise_error("Asset not found #{non_exist_fixture_path}")
  end

  it "throws error if can't connect to vm-renderer" do
    WebMock.disable_net_connect!(allow_localhost: false)
    stub_request(:any, /upload-asset/).to_timeout
    expect do
      ReactOnRailsPro::RequestHelper.upload_asset(fixture_path, "application/json")
    end.to raise_exception(ReactOnRailsPro::Error)
    WebMock.allow_net_connect!
  end

  def asset_exist?
    ReactOnRailsPro::RequestHelper.asset_exists_on_vm_renderer?(asset_path)
  end
end
