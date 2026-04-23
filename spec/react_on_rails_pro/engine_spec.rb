# frozen_string_literal: true

require_relative "spec_helper"

module ReactOnRailsPro
  RSpec.describe Engine do
    describe "ScoutApm instrumentation initializer" do
      subject(:initializer) { described_class.initializers.find { |i| i.name.include?("scout_apm") } }

      it "defines a named Rails initializer to run after scout_apm.start" do
        expect(initializer.name).to eq "react_on_rails_pro.scout_apm_instrumentation"
        expect(initializer.after).to eq "scout_apm.start"
      end

      describe "react_on_rails_pro.scout_apm_instrumentation" do
        let(:mock_scout_tracer) do
          # Simplified mock of ScoutApm::Tracer that mirrors its real implementation.
          # https://github.com/scoutapp/scout_apm_ruby/blob/v6.1.0/lib/scout_apm/tracer.rb#L47-L70
          Module.new do
            def self.included(base)
              base.define_singleton_method(:instrument_method) do |method_name, **|
                raise "method does not exist: #{method_name}" unless method_defined?(method_name)

                instrumented_name = :"#{method_name}_with_test_instrument"
                uninstrumented_name = :"#{method_name}_without_test_instrument"

                define_method(instrumented_name) do |*args, **kwargs, &block|
                  send(uninstrumented_name, *args, **kwargs, &block)
                end

                alias_method uninstrumented_name, method_name
                alias_method method_name, instrumented_name
              end
            end
          end
        end

        let(:mock_node_rendering_pool) do
          Class.new(ReactOnRailsPro::ServerRenderingPool::NodeRenderingPool)
        end

        before do
          stub_const("ReactOnRailsPro::ServerRenderingPool::NodeRenderingPool", mock_node_rendering_pool)
        end

        context "when ScoutApm is not defined" do
          before { hide_const("ScoutApm") }

          it "does not instrument NodeRenderingPool.exec_server_render_js" do
            initializer.run
            expect(mock_node_rendering_pool.methods(false)).not_to include(:exec_server_render_js_with_test_instrument)
            expect(mock_node_rendering_pool.methods(false)).not_to include(:exec_server_render_js_without_test_instrument)
          end
        end

        context "when ScoutApm is defined" do
          before { stub_const("ScoutApm::Tracer", mock_scout_tracer) }

          it "instruments NodeRenderingPool.exec_server_render_js" do
            initializer.run
            expect(mock_node_rendering_pool.methods(false)).to include(:exec_server_render_js_with_test_instrument)
            expect(mock_node_rendering_pool.methods(false)).to include(:exec_server_render_js_without_test_instrument)
          end
        end
      end
    end
  end
end
