const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== '.vercel') {
        results = results.concat(walk(fullPath));
      }
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('../rolyang/src');
files.forEach(f => {
  if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.vue') || f.endsWith('.js') || f.endsWith('.jsx')) {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('banners')) {
      console.log(`${f} matches`);
    }
  }
});
