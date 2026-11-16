import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('[AutoDeploy] Running post-build synchronization check...');

if (fs.existsSync(distDir)) {
  const candidateTargets = [
    // 1. Direct sibling in hbuilds/versions/<version>/public_html (Hostinger publish sync source!)
    path.resolve(rootDir, '../public_html'),
    path.resolve(rootDir, '../../public_html'),
    path.resolve(rootDir, '../../../public_html'),
    // 2. Live server document root
    '/home/u910668982/domains/almosamem.com.sa/public_html',
    '/home/u910668982/public_html',
    // 3. Workspace public directory
    path.join(rootDir, 'public'),
  ];

  for (const target of candidateTargets) {
    try {
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        fs.cpSync(distDir, target, { recursive: true, force: true });
        console.log(`[AutoDeploy] Successfully synchronized dist to: ${target}`);
      }
    } catch (e) {
      // Ignore access or non-existent paths gracefully
    }
  }
} else {
  console.warn('[AutoDeploy] dist directory not found; skipping sync.');
}
