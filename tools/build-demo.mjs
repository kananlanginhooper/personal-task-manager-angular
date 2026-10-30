// Builds the GitHub Pages demo into docs/ while keeping the before/after screenshots in docs/refactor/ and docs/mobile/.
import { execSync } from 'node:child_process';
import { copyFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

for (const f of readdirSync('docs'))
  if (!['refactor', 'mobile'].includes(f)) rmSync(`docs/${f}`, { recursive: true, force: true });
execSync('ng build --configuration demo', { stdio: 'inherit' });
copyFileSync('docs/index.html', 'docs/404.html');
writeFileSync('docs/.nojekyll', '');
