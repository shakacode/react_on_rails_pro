# frozen_string_literal: true

require "active_support"

Rake::Task["assets:precompile"].enhance do
  Rake::Task["react_on_rails_pro:copy_assets_to_vm_renderer"].invoke
end

namespace :react_on_rails_pro do
  desc "Copy assets to remote vm-renderer"
  task copy_assets_to_vm_renderer: :environment do
    Rails.logger.info { "[ReactOnRailsPro] Copying assets to vm-renderer..." }
    ReactOnRailsPro::Request.upload_assets
  end
end
