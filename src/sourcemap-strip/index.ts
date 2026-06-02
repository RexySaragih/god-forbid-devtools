/**
 * Source-map stripping utilities.
 *
 * Provides a Next.js webpack plugin and a standalone Webpack plugin that
 * removes source maps from production builds. Weakens an attacker's ability
 * to reverse-engineer application source even with DevTools open.
 *
 * Usage in `next.config.js`:
 * ```js
 * const { withSourceMapStrip } = require('@rexymayderio/god-forbid-devtools');
 *
 * module.exports = withSourceMapStrip({
 *   // ... your Next.js config
 * });
 * ```
 *
 * Or use the standalone Webpack plugin:
 * ```js
 * const { SourceMapStripPlugin } = require('@rexymayderio/god-forbid-devtools');
 *
 * module.exports = {
 *   plugins: [new SourceMapStripPlugin()],
 * };
 * ```
 */

export interface SourceMapStripOptions {
  /** Only strip in production. Default: true. */
  productionOnly?: boolean;
  /** Remove .map files from output. Default: true. */
  removeMapFiles?: boolean;
  /** Remove sourceMappingURL comments from bundles. Default: true. */
  removeSourceMappingURLs?: boolean;
  /** Glob patterns of files to exclude from stripping. Default: [] */
  exclude?: string[];
}

interface WebpackCompiler {
  hooks: {
    emit: {
      tapAsync(
        name: string,
        callback: (compilation: WebpackCompilation, done: () => void) => void,
      ): void;
    };
  };
}

interface WebpackCompilation {
  assets: Record<string, WebpackAsset>;
  deleteAsset?: (name: string) => void;
}

interface WebpackAsset {
  source(): string;
  size(): number;
}

class RawSource {
  private _source: string;
  constructor(source: string) {
    this._source = source;
  }
  source(): string {
    return this._source;
  }
  size(): number {
    return this._source.length;
  }
}

const SOURCEMAP_URL_REGEX = /\/\/[#@]\s*sourceMappingURL=\S+\s*$/gm;
const CSS_SOURCEMAP_URL_REGEX = /\/\*[#@]\s*sourceMappingURL=\S+\s*\*\/\s*$/gm;

export class SourceMapStripPlugin {
  private options: Required<SourceMapStripOptions>;

  constructor(options: SourceMapStripOptions = {}) {
    this.options = {
      productionOnly: options.productionOnly ?? true,
      removeMapFiles: options.removeMapFiles ?? true,
      removeSourceMappingURLs: options.removeSourceMappingURLs ?? true,
      exclude: options.exclude ?? [],
    };
  }

  apply(compiler: WebpackCompiler): void {
    compiler.hooks.emit.tapAsync(
      "SourceMapStripPlugin",
      (compilation, done) => {
        if (
          this.options.productionOnly &&
          process.env.NODE_ENV !== "production"
        ) {
          done();
          return;
        }

        const assetNames = Object.keys(compilation.assets);

        for (const name of assetNames) {
          if (this.isExcluded(name)) continue;

          // Remove .map files.
          if (this.options.removeMapFiles && name.endsWith(".map")) {
            if (compilation.deleteAsset) {
              compilation.deleteAsset(name);
            } else {
              delete compilation.assets[name];
            }
            continue;
          }

          // Strip sourceMappingURL comments from JS/CSS.
          if (
            this.options.removeSourceMappingURLs &&
            (name.endsWith(".js") || name.endsWith(".css"))
          ) {
            const asset = compilation.assets[name];
            if (!asset) continue;
            const source = asset.source();
            const stripped = source
              .replace(SOURCEMAP_URL_REGEX, "")
              .replace(CSS_SOURCEMAP_URL_REGEX, "");

            if (stripped !== source) {
              compilation.assets[name] = new RawSource(stripped) as unknown as WebpackAsset;
            }
          }
        }

        done();
      },
    );
  }

  private isExcluded(name: string): boolean {
    return this.options.exclude.some((pattern) => {
      // Simple glob: support only * wildcard.
      const regex = new RegExp(
        "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
      );
      return regex.test(name);
    });
  }
}

/**
 * Next.js config wrapper that strips source maps in production.
 *
 * Disables Next.js's built-in productionBrowserSourceMaps and adds the
 * SourceMapStripPlugin to the webpack config.
 */
export function withSourceMapStrip(
  nextConfig: Record<string, unknown> = {},
  pluginOptions?: SourceMapStripOptions,
): Record<string, unknown> {
  return {
    ...nextConfig,
    productionBrowserSourceMaps: false,
    webpack(
      config: { plugins: unknown[] },
      context: { isServer: boolean; dev: boolean },
    ) {
      // Only apply to client-side production builds.
      if (!context.isServer && !context.dev) {
        config.plugins.push(new SourceMapStripPlugin(pluginOptions));
      }

      // Call existing webpack config if present.
      const existingWebpack = nextConfig.webpack as
        | ((config: unknown, context: unknown) => unknown)
        | undefined;
      if (typeof existingWebpack === "function") {
        return existingWebpack(config, context);
      }

      return config;
    },
  };
}
