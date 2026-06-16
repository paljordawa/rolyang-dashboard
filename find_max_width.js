const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(f => {
  if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.html')) {
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.match(/max-w-(?:5xl|6xl|7xl|4xl|3xl|2xl|xl|lg|container|screen)/g);
    if (matches) {
      console.log(`${f}:`, matches);
    }
  }
});
