# Project boundaries

Keep the one-sentence README. Keep theme source in `packages/theme` and public sample content in `examples/blog`.

Do not add personal articles, credentials, account IDs, analytics, advertising scripts, remote fonts, or paid services. A public repository exposes every committed file, including posts marked draft; real drafts belong in a separate private site repository.

Preserve the soft grey/blue palette, CJK typography, native HTML navigation, and reduced-motion support. Do not hide article paragraphs for scroll effects. Keep all external account changes behind explicit user authorization.

Run `pnpm test`, `pnpm check`, `pnpm build`, and `pnpm test:dist` before a release. Validate the packed theme in a separate consumer. Never claim unexecuted checks passed.
