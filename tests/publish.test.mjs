import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
// Mock the local CLIs; these tests never authenticate, create or change a real repo.
async function run(fail = '') {
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'kirisame-publish-test-'));
  try {
    await fs.mkdir(path.join(temp,'scripts'),{recursive:true});
    await fs.mkdir(path.join(temp,'.github/workflows'),{recursive:true});
    await fs.mkdir(path.join(temp,'bin'));
    await fs.copyFile(new URL('../scripts/publish-github.sh',import.meta.url),path.join(temp,'scripts/publish-github.sh'));
    await fs.writeFile(path.join(temp,'.github/workflows/ci.yml'),'run: pnpm install --no-frozen-lockfile\n');
    const stub = `#!/usr/bin/env bash\nset -eu\nTOOL="$(basename "$0")"\nprintf '%s %s\\n' "$TOOL" "$*" >> "$LOG"\ncase "$TOOL $*" in\n 'gh api user --jq .login') echo "\${MOCK_USER:-qianxueye}";;\n 'gh api user --jq .id') echo 10359043;;\n 'gh repo view '*--json*) echo '{"visibility":"PUBLIC"}';;\n 'gh repo view '*) if [[ "$FAIL" == exists ]]; then exit 0; else exit 1; fi;;\n 'pnpm build') if [[ "$FAIL" == build ]]; then exit 2; fi;;\n 'git rev-parse HEAD') echo MOCK_COMMIT;;\n 'git diff --cached --quiet') exit 1;;\nesac\n`;
    for (const tool of ['gh','git','pnpm']) await fs.writeFile(path.join(temp,'bin',tool),stub,{mode:0o755});
    const result=spawnSync('bash',['scripts/publish-github.sh'],{cwd:temp,encoding:'utf8',env:{...process.env,PATH:path.join(temp,'bin')+path.delimiter+process.env.PATH,LOG:path.join(temp,'calls.log'),FAIL:fail,MOCK_USER:fail==='owner'?'other-user':'qianxueye'}});
    const log=await fs.readFile(path.join(temp,'calls.log'),'utf8');
    return {result,log};
  } finally { await fs.rm(temp,{recursive:true,force:true}); }
}
test('publishing stops before remote creation on build failure', async()=>{
  const {result,log}=await run('build');assert.notEqual(result.status,0);assert.ok(!log.includes('gh repo create'));
});
test('publishing never alters a same-named existing repository', async()=>{
  const {result,log}=await run('exists');assert.notEqual(result.status,0);assert.ok(!log.includes('gh repo edit')&&!log.includes('gh repo create'));
});
test('publishing rejects a different authenticated user',async()=>{
  const {result,log}=await run('owner');assert.notEqual(result.status,0);assert.ok(!log.includes('gh repo create'));
});
test('successful mocked path builds before public create and pushes before setting main',async()=>{
  const {result,log}=await run();assert.equal(result.status,0,result.stderr);
  assert.ok(log.indexOf('pnpm test:dist')<log.indexOf('gh repo create'));
  assert.match(log,/gh repo create qianxueye\/astro-theme-kirisame .*--public.*--push/);
  assert.ok(log.indexOf('gh repo create')<log.indexOf('gh repo edit'));
  assert.ok(!log.includes('--force'));assert.match(log,/git config --local user.email 10359043\+qianxueye@users.noreply.github.com/);
});
