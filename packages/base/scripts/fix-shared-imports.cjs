/**
 * @fileoverview After tsc-alias rewrites all path aliases to relative paths,
 * restore "moyan-mfw-base/shared" imports that were incorrectly rewritten.
 */
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist/backend');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.js')) {
      fixFile(fullPath);
    }
  }
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // After tsc-alias rewrites "moyan-mfw-base/shared" to a relative path
  // like "../../../../dist/shared" or "../../../..", revert it.
  // The tsc-alias output for "dist/shared" paths is relative to the file location.
  // We detect: require("...") where the path is only ../ sequences (no actual dir name)
  content = content.replace(
    /require\("(\.\.\/)+\.\.\."\)/g,
    'require("moyan-mfw-base/shared")'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`  Fixed: ${path.relative(distDir, filePath)}`);
  }
}

walk(distDir);
console.log('Done fixing shared module imports.');
