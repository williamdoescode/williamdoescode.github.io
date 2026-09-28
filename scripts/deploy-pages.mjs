import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
if (readFileSync(join(dist, 'index.html'), 'utf8').includes('/src/main.jsx')) {
  throw new Error('Expected a production build. Run npm run build first.');
}
const git = (args, cwd = root) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const remote = git(['remote', 'get-url', 'origin']);
const directory = mkdtempSync(join(tmpdir(), 'portfolio-pages-'));
// Clone the publishing branch so updates preserve its history; never force-push.
git(['clone', '--single-branch', '--branch', 'gh-pages', remote, directory]);
git(['rm', '-r', '--ignore-unmatch', '.'], directory);
for (const name of readdirSync(dist)) cpSync(join(dist, name), join(directory, name), { recursive: true });
writeFileSync(join(directory, '.nojekyll'), '');
for (const key of ['user.name', 'user.email']) git(['config', key, git(['config', key])], directory);
git(['add', '.'], directory);
if (!git(['status', '--porcelain'], directory)) {
  console.log('The current build is already published.');
} else {
  git(['commit', '-m', `Deploy portfolio from ${git(['rev-parse', '--short', 'HEAD'])}`], directory);
  console.log(git(['push', 'origin', 'gh-pages'], directory));
  console.log('Build pushed. GitHub Pages will publish it shortly.');
}
console.log(`Deployment checkout: ${directory}`);
