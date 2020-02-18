# frozen_string_literal: true

require "active_support"

Rake::Task["assets:precompile"].enhance do
  Rake::Task["react_on_rails_pro:assets:assets_to_copy_to_vm_renderer"].invoke
end

namespace :react_on_rails_pro do
  namespace :assets do
    task copy_assets_to_vm_renderer: :environment do
      if ReactOnRailsPro.configuration.renderer_url.include?("localhost")
        Rails.logger.info { "[ReactOnRailsPro] Copying assets to remote vm-renderer..." }
        ReactOnRailsPro::Utils.copy_assets
      else
        Rails.logger.info { "[ReactOnRailsPro] Skip copying assets to vm-renderer. It's on localhost" }
      end
    end
  end
end
