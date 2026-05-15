const fs = require('fs');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');

const REPLACEMENTS = [
  { from: '@internal/base-backend', to: 'moyan-mfw-base/backend' },
  { from: '@internal/base-shared', to: 'moyan-mfw-base/shared' },
  { from: '@internal/base-frontend', to: 'moyan-mfw-base/frontend' },
  { from: '@internal/ad-shared', to: '../shared/index.js' },
];

function fixDir(layer) {
  const distDir = path.join(packageRoot, 'dist', layer);
  if (!fs.existsSync(distDir)) {
    console.log('Skip:', layer);
    return;
  }
  walk(distDir, layer);
}

function escapeRegExp(s) { return s.replace(/[-\/]/g, '\\$&'); }

function walk(dir, layer) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fp, layer);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs') || entry.name.endsWith('.cjs')) {
      let content = fs.readFileSync(fp, 'utf8');
      const original = content;
      for (const { from, to } of REPLACEMENTS) {
        const escFrom = escapeRegExp(from);
        // require("@internal/x") → require("moyan-mfw-base/x")
        content = content.replace(new RegExp(`require\\(["']${escFrom}["']\\)`, 'g'), `require('${to}')`);
        // from "@internal/x" → from "moyan-mfw-base/x"
        content = content.replace(new RegExp(`from\\s+["']${escFrom}["']`, 'g'), `from '${to}'`);
        // import "@internal/x" → import "moyan-mfw-base/x" (side-effect, match closing quote too)
        content = content.replace(new RegExp(`import\\s+["']${escFrom}["']`, 'g'), `import '${to}'`);
      }
      if (content !== original) {
        fs.writeFileSync(fp, content);
        console.log(`[${layer}] Fixed:`, path.relative(path.join(packageRoot, 'dist', layer), fp));
      }
    }
  });
}

fixDir('shared');
fixDir('backend');
fixDir('frontend');
console.log('fix-dist-imports: done');
