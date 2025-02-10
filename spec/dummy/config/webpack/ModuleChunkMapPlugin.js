// ModuleMappingWebpackPlugin.js
const path = require('path');
const asyncLib = require('neo-async');
const glob = require('glob');
const { Compilation, sources } = require('webpack');
const { AsyncDependenciesBlock } = require('webpack');

class ModuleMappingWebpackPlugin {
  constructor(options = {}) {
    // Options:
    // - outputFile: name of the generated JSON manifest.
    // - searchPaths: an array of objects specifying where to look for original JS files.
    //   Each object can have: { directory, recursive, include (RegExp), exclude (optional RegExp) }.
    // - anchorFile: an absolute or relative path to a module that will act as the "anchor".
    //   When parsed, it will have async dependencies added for each file in searchPaths.
    //   This forces webpack to include those files in the dependency graph.
    this.options = Object.assign(
      {
        outputFile: 'module-mapping.json',
        searchPaths: [
          {
            directory: './client/app',
            recursive: true,
            include: /\.(js|jsx|ts|tsx)$/,
          },
        ],
        // If you set an anchorFile, ensure that file is imported somewhere.
        anchorFile: null,
      },
      options
    );
    // Will hold the normalized relative paths of files resolved from searchPaths.
    this.resolvedFiles = [];
  }

  apply(compiler) {
    const PLUGIN_NAME = 'ModuleMappingWebpackPlugin';

    // STEP 1: BEFORE COMPILE – Resolve all source files from the filesystem.
    // This pre-populates a list of files (as relative paths) that you want to appear
    // in the final mapping, even if they are not otherwise imported.
    compiler.hooks.beforeCompile.tapAsync(PLUGIN_NAME, (params, callback) => {
      const context = compiler.context;
      let files = [];
      asyncLib.each(
        this.options.searchPaths,
        (searchPath, cb) => {
          const directory = searchPath.directory;
          const pattern = searchPath.recursive ? '**/*' : '*';
          const fullPattern = path.join(directory, pattern);
          glob(fullPattern, { cwd: context, nodir: true }, (err, matches) => {
            if (err) return cb(err);
            matches.forEach((file) => {
              if (
                searchPath.include.test(file) &&
                (!searchPath.exclude || !searchPath.exclude.test(file))
              ) {
                // Normalize to a relative path starting with "./"
                files.push('./' + file.replace(/\\/g, '/'));
              }
            });
            cb();
          });
        },
        (err) => {
          if (err) return callback(err);
          // Remove duplicates.
          this.resolvedFiles = Array.from(new Set(files));
          callback();
        }
      );
    });

    // STEP 2 (Optional): If an anchorFile is specified, add an async dependency block
    // so that webpack includes the resolved files in the dependency graph.
    if (this.options.anchorFile) {
      compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
        normalModuleFactory.hooks.parser.for('javascript/auto').tap(PLUGIN_NAME, (parser) => {
          parser.hooks.program.tap(PLUGIN_NAME, () => {
            const mod = parser.state.module;
            // Check if this is the anchor module.
            if (mod.resource && path.resolve(mod.resource) === path.resolve(this.options.anchorFile)) {
              this.resolvedFiles.forEach((file, index) => {
                // Create a new async dependency block for each file.
                const block = new AsyncDependenciesBlock({
                  name: `moduleMappingBlock_${index}`,
                });
                // Add a dummy dependency with the file request.
                // (In a real plugin you might use a specialized dependency type.)
                block.addDependency({ request: file });
                mod.addBlock(block);
              });
            }
          });
        });
      });
    }

    // STEP 3: DURING THE COMPILATION – Create the mapping manifest.
    // This hook runs after modules and chunks are finalized.
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
        },
        () => {
          const mapping = {};

          // Pre-populate the mapping with all resolved files (files found on disk),
          // so that even if a file isn’t bundled, it will appear with null values.
          this.resolvedFiles.forEach((file) => {
            mapping[file] = {
              moduleId: null,
              chunks: [],
            };
          });

          // Iterate over all modules that webpack processed.
          // Using the ChunkGraph API to get module IDs and chunks.
          for (const module of compilation.modules) {
            if (module.resource && module.resource.endsWith('.js')) {
              const relativePath =
                './' + path.relative(compiler.context, module.resource).replace(/\\/g, '/');
              const moduleId = compilation.chunkGraph.getModuleId(module);
              // Get all chunk IDs where this module appears.
              const moduleChunks = Array.from(compilation.chunkGraph.getModuleChunks(module))
                .map((chunk) => chunk.id)
                // Remove duplicates, if any.
                .filter((v, i, a) => a.indexOf(v) === i);
              mapping[relativePath] = {
                moduleId,
                chunks: moduleChunks,
              };
            }
          }

          // Emit the JSON manifest as an asset.
          const json = JSON.stringify(mapping, null, 2);
          compilation.emitAsset(this.options.outputFile, new sources.RawSource(json));
        }
      );
    });
  }
}

module.exports = ModuleMappingWebpackPlugin;
