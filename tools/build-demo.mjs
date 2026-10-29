// Builds the GitHub Pages demo into docs/ while keeping docs/refactor/ (before/after screenshots).
import { execSync } from 'node:child_process';
import { copyFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

for (const f of readdirSync('docs')) if (f !== 'refactor') rmSync(`docs/${f}`, { recursive: true, force: true });
execSync('ng build --configuration demo', { stdio: 'inherit' });
copyFileSync('docs/index.html', 'docs/404.html');
writeFileSync('docs/.nojekyll', '');
