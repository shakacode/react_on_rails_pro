# frozen_string_literal: true

require_relative "./task_helpers"
require "react_on_rails"

desc("Releases both the gem and node package using the given version.

Periodically, update `release-it`:
`yarn global add release-it`

IMPORTANT: the gem version must be in valid rubygem format (no dashes).
It will be automatically converted to a valid yarn semver by the rake task
for the node package version. This only makes a difference for pre-release
versions such as `3.0.0.beta.1` (yarn version would be `3.0.0-beta.1`).

This task depends on the gem-release (ruby gem) and release-it (node package)
which are installed via `bundle install` and `yarn`

1st argument: The new version in rubygem format (no dashes). Pass no argument to
              automatically perform a patch version bump.
2nd argument: Perform a dry run by passing 'true' as a second argument.

Example: `rake release[2.1.0,false]`")

# rubocop:disable Metrics/BlockLength
task :release, %i[gem_version dry_run tools_install] do |_t, args|
  include ReactOnRailsPro::TaskHelpers

  class MessageHandler
    def add_error(error)
      raise error
    end
  end

  # Check if there are uncommited changes
  ReactOnRails::GitUtils.uncommitted_changes?(MessageHandler.new)
  args_hash = args.to_hash

  is_dry_run = ReactOnRails::Utils.object_to_boolean(args_hash[:dry_run])

  gem_version = args_hash.fetch(:gem_version, "")

  npm_version = if gem_version.strip.empty?
                  ""
                else
                  ReactOnRails::VersionSyntaxConverter.new.rubygem_to_npm(gem_version)
                end

  # Delete any react_on_rails.gemspec except the root one
  sh_in_dir(gem_root, "find . -mindepth 2 -name 'react_on_rails_pro.gemspec' -delete")

  # See https://github.com/svenfuchs/gem-release
  sh_in_dir(gem_root, "git pull --rebase")
  sh_in_dir(gem_root, "gem bump --no-commit #{gem_version.strip.empty? ? '' : %(--version #{gem_version})}")

  # Update spec/dummy and spec/loadable apps' Gemfile.lock files to match the version
  bundle_install_in(dummy_app_dir)
  bundle_install_in(loadable_app_dir)

  # Stage changes so far
  sh_in_dir(gem_root, "git add .")

  # Will bump the yarn version, commit, tag the commit, push to repo, and release on yarn
  release_it_command = "$(yarn bin)/release-it".dup
  release_it_command << " #{npm_version}" unless npm_version.strip.empty?
  release_it_command << " --ci -verbose"
  release_it_command << " --dry-run" if is_dry_run
  sh_in_dir(gem_root, release_it_command)

  # Release the new gem version
  gem_push_command = "gem release --key github --host https://rubygems.pkg.github.com/shakacode-tools"
  sh_in_dir(gem_root, gem_push_command) unless is_dry_run
end
# rubocop:enable Metrics/BlockLength
