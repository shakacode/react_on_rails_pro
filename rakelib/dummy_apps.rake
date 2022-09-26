# frozen_string_literal: true

require_relative "task_helpers"

# rubocop:disable Style/MixinUsage
include ReactOnRailsPro::TaskHelpers
# rubocop:enable Style/MixinUsage

namespace :dummy_app do
  task :yarn_install do
    yarn_install_cmd = "yarn install --mutex network"
    sh_in_dir(dummy_app_dir, yarn_install_cmd)
    sh_in_dir(react18_graphql_dir, yarn_install_cmd)
  end

  task dummy_app: [:yarn_install] do
    dummy_app_dir = File.join(gem_root, "spec/dummy")
    react18_graphql_app_dir = File.join(gem_root, "spec/react18-graphql")
    bundle_install_in(dummy_app_dir)
    bundle_install_in(react18_graphql_app_dir)
  end
end

desc "Prepares dummy app by installing dependencies"
task dummy_app: ["dummy_app:dummy_app"]
