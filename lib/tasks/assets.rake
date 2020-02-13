# frozen_string_literal: true

require "active_support"

Rake::Task["assets:precompile"]
    .clear_prerequisites
    .enhance([:environment, "react_on_rails:assets:compile_environment"])
    .enhance do
  Rake::Task["react_on_rails:assets:symlink_non_digested_assets"].invoke
  Rake::Task["react_on_rails:assets:delete_broken_symlinks"].invoke
  Rake::Task["react_on_rails:assets:pre_stage_bundle_for_vm_renderer"].invoke
  Rake::Task["react_on_rails_pro:assets:copy_assets_to_vm_renderer"].invoke
end

namespace :react_on_rails_pro do
  namespace :assets do
    task copy_assets_to_vm_renderer: :environment do
      if ReactOnRailsPro.configuration.renderer_url.include?("localhost")
        puts "Copying assets to remote vm-renderer..."
        ReactOnRailsPro::Utils::copy_assets
      else
        puts "Skip copying assets to vm-renderer. It's on localhost"
      end
    end
  end
end
