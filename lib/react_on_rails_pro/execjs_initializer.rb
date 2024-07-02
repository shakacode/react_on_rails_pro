# frozen_string_literal: true

# Override ExecJS runtimes to use --prof flag for profiling

module ExecJS
  module Runtimes
    Node = ExecJS::ExternalRuntime.new(
      name: "Node.js (V8)",
      command: ["node --prof", "mv isolate*.log dd"],
      runner_path: ExecJS.root + "/support/v8_runner.js",
    )

    V8 = ExecJS::ExternalRuntime.new(
      name: "V8",
      command: ["d8 --prof"],
      runner_path: ExecJS.root + "/support/v8_runner.js",
    )
  end
end

# ExecJS.runtime = ExecJS::ExternalRuntime.new(
#   name: "Node.js (V8)",
#   command: ["node --prof"],
#   runner_path: ExecJS.root + "/support/v8_runner.js"
# )
