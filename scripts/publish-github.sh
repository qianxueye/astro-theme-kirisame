#!/usr/bin/env bash
# Explicitly creates a PUBLIC repository. Runs locally with your GitHub CLI login.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OWNER=qianxueye
NAME=astro-theme-kirisame
REPO="$OWNER/$NAME"
DESCRIPTION='A reading-first Astro theme with soft colors, CJK-friendly typography, and gentle motion.'
for command in gh git node pnpm; do
  command -v "$command" >/dev/null 2>&1 || { printf 'Missing %s. Install it and rerun this script.\n' "$command" >&2; exit 1; }
done
gh auth status --hostname github.com >/dev/null
LOGIN="$(gh api user --jq .login)"
[[ "$LOGIN" == "$OWNER" ]] || { printf 'Expected GitHub account %s, got %s. No changes made.\n' "$OWNER" "$LOGIN" >&2; exit 1; }
# Never overwrite an existing repository or add a personal project by accident.
if gh repo view "$REPO" >/dev/null 2>&1; then
  printf '%s already exists. No changes made.\n' "$REPO" >&2
  exit 1
fi
if [[ -d .git ]]; then
  if git remote | grep -q .; then echo 'This directory already has a Git remote. No changes made.' >&2; exit 1; fi
  if [[ -n "$(git status --porcelain)" ]]; then echo 'Working tree changed; inspect it before publishing.' >&2; exit 1; fi
fi
# Do not create a remote until the real dependency install and build pass.
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a<22 || (a===22 && b<12)) process.exit(1)' || { echo 'Node 22.12+ is required.' >&2; exit 1; }
pnpm install --no-frozen-lockfile
pnpm test
pnpm build
pnpm test:dist
# Once the first resolution succeeds, CI must use that reviewed lockfile.
node --input-type=module -e "import fs from 'node:fs'; const p='.github/workflows/ci.yml'; fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('pnpm install --no-frozen-lockfile','pnpm install --frozen-lockfile'));"
if [[ ! -d .git ]]; then git init -b main; fi
# Local-only commit identity; no change to global Git settings or private email.
git config --local user.name "$LOGIN"
USER_ID="$(gh api user --jq .id)"
git config --local user.email "${USER_ID}+${LOGIN}@users.noreply.github.com"
# Stage only the theme's allowlisted source; never use a broad home-directory upload.
git add README.md LICENSE package.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore .gitattributes .editorconfig .nvmrc .node-version AGENTS.md .github packages examples scripts docs tests
if ! git diff --cached --quiet; then git commit -m 'feat: introduce Kirisame reading-first Astro theme'; fi
# Fail rather than force-push if a same-named repo appears in the meantime.
gh repo create "$REPO" --public --description "$DESCRIPTION" --source=. --remote=origin --push
# The branch now exists. CI already declares contents: read and no deployment.
gh repo edit "$REPO" --default-branch main --enable-issues --enable-wiki=false --enable-projects=false --enable-discussions=false --template --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --delete-branch-on-merge --add-topic astro --add-topic astro-theme --add-topic blog --add-topic typography --add-topic cjk
# Security features supported for public repos; no billing/paid service is enabled here.
gh api --method PUT "repos/$REPO/vulnerability-alerts" >/dev/null || printf 'Warning: enable Dependabot alerts manually if your token lacks admin scope.\n' >&2
gh repo view "$REPO" --json nameWithOwner,url,visibility,isTemplate,defaultBranchRef
printf '\nPushed commit: '; git rev-parse HEAD
printf 'Repository is public. Cloudflare and npm publication were NOT performed.\n'
