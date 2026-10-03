# Development

Use Node 22.12+ and pnpm 10.26.2. From the repository root:

```sh
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm test
pnpm test:dist
```

The example is a separate static Astro site consuming the local workspace package. It uses real `/posts/…/` URLs. `pnpm build` builds the HTML, then Pagefind; development search falls back to a same-origin static JSON index. Both indexes exclude drafts and future-dated posts.

# Use the theme elsewhere

```sh
pnpm pack:theme
```

Install the resulting `.tgz` into another Astro 7.3+ site with `pnpm add /path/to/package.tgz`. Import the layouts and components from `@qianxueye/astro-theme-kirisame/layouts/SiteLayout.astro`, `…/layouts/PostLayout.astro`, and `…/components/Home.astro`; use `defineTheme` from the package root. The example shows the exact content schema, route generation, props, and slots. This repository is not automatically published to npm.

# Configuration

Set `title`, `author`, `url` (origin only), `base`, `description`, navigation, hero text, `appearance`, `motion`, `reading`, `search`, `sidebar`, and `indexable`. The example is unindexed by default. Set a real site origin and `PUBLIC_INDEXABLE=true` only in your own publication. For a subdirectory use Astro's `base` and keep `config.base` synchronized.

Override CSS variables in your site's `custom.css`, imported after the theme. `SiteLayout` provides `head` and `body-end` slots; `PostLayout` provides `head`, `body-end`, `after-post`, and `sidebar`; `Home` has a `sidebar` slot. `AdSlot` is disabled by default and never injects advertising scripts by itself.

RSS includes article summaries. Article body and navigation work without JavaScript. Search, typography controls and optional finite animations are progressive enhancements. Native cross-document transitions are used where the browser supports them; otherwise regular HTML navigation remains available.

# Cloudflare

The example is static: no adapter, database, Worker handler, AI endpoint, or account ID. Build from the workspace root with `pnpm build`, then deploy `examples/blog/dist` with your approved deployment configuration. `examples/blog/wrangler.jsonc` is a starter, not an authorization to deploy. Set the actual domain only in the separate personal site. Do not deploy example material as real personal articles.

# Public-source boundary

Everything committed to this repository is public, including test drafts. `draft: true` controls generated pages, not GitHub access. Put your real blog content and private notes in a separate private repository; reference a tagged theme version or its package archive there.

# First GitHub publication

The repository-creation helper is deliberately not part of CI. After logging into GitHub CLI as `qianxueye`, run:

```sh
bash scripts/publish-github.sh
```

It creates **qianxueye/astro-theme-kirisame as a public template repository** only after dependency installation, tests, a complete example build and output checks succeed. It commits the generated lockfile, then uses frozen installs in CI. It uses a repository-local GitHub noreply identity, not your private email. The first push enables the repository's read-only CI workflow; it does not deploy anything or publish to npm.

Selected repository settings: `main`, Issues enabled; Wiki, Projects and Discussions disabled; squash merges only; merged branches automatically deleted; Astro/theme/blog/typography/CJK topics. It attempts to enable Dependabot vulnerability alerts and prints a warning when the local token lacks that permission. Scheduled dependency updates are monthly. No existing repository is overwritten.

An initial lockfile is not included because the authoring runtime could not reach the registry; the script generates and commits it before publishing. See `VALIDATION.md` for the exact tested and untested scope. If a step fails, read its output rather than bypassing the build gate.
