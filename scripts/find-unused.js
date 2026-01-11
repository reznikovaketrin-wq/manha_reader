#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORED_DIRS = ['.next', 'node_modules', '.git', 'public', 'dist'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    if (IGNORED_DIRS.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(full));
    else files.push(full);
  }
  return files;
}

function isSourceFile(p) {
  return EXTENSIONS.includes(path.extname(p));
}

function normalizeImport(src, fromFile) {
  if (!src) return null;
  if (src.startsWith("@/")) {
    return path.join(ROOT, src.slice(2));
  }
  if (src.startsWith('.')) {
    return path.join(path.dirname(fromFile), src);
  }
  return null; // external
}

function resolveImportCandidate(base) {
  // Try base with extensions and index files
  for (const ext of EXTENSIONS) {
    const p = base + ext;
    if (fs.existsSync(p)) return path.resolve(p);
  }
  for (const ext of EXTENSIONS) {
    const p = path.join(base, 'index' + ext);
    if (fs.existsSync(p)) return path.resolve(p);
  }
  return null;
}

function isNextRouteOrLayout(p) {
  const rel = path.relative(ROOT, p).split(path.sep).join('/');
  // pages in app directory that are implicitly used
  if (/^app\/.+\/(page|route|layout|head|loading|error)\.(ts|tsx|js|jsx)$/.test(rel)) return true;
  // next config, env, types, public assets
  if (rel === 'next.config.js' || rel.startsWith('public/')) return true;
  return false;
}

function main() {
  const allFiles = walk(ROOT).filter(isSourceFile).map(p => path.resolve(p));
  const fileSet = new Set(allFiles);

  const importsMap = new Map(); // file -> Set(importedFile)
  const referenced = new Set();

  const importRegex = /(?:import|export)\s+(?:[^'";]+from\s+)?['"]([^'"\n]+)['"]/g;

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const imports = new Set();
    let m;
    while ((m = importRegex.exec(content)) !== null) {
      const src = m[1];
      const norm = normalizeImport(src, file);
      if (!norm) continue;
      const resolved = resolveImportCandidate(norm);
      if (resolved) {
        imports.add(resolved);
        referenced.add(resolved);
      }
    }
    importsMap.set(file, imports);
  }

  // Candidates: files that are not referenced by any other file
  const candidates = allFiles.filter(f => {
    if (referenced.has(f)) return false;
    if (isNextRouteOrLayout(f)) return false;
    // Keep shared index files if they export things (likely used dynamically)
    if (/index\.(ts|tsx|js|jsx)$/.test(f)) return false;
    return true;
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('Scanned files:', allFiles.length);
    console.log('Referenced files:', referenced.size);
    console.log('\nPotentially unused source files (not referenced by other files):\n');
    candidates.sort().forEach(c => console.log('-', path.relative(ROOT, c)));
    console.log('\nNote: This is a heuristic. Some files (CLI scripts, dynamic imports, Next.js routes/layouts) are ignored. Review before deleting.');
  }
}

main();
