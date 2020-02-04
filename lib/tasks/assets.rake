# frozen_string_literal: true

require "active_support"

namespace :react_on_rails_pro do
  desc <<-DESC.strip_heredoc
  DESC
  task copy_assets_to_vm_renderer: :environment do
    ReactOnRailsPro::Utils::copy_assets
  end
end
