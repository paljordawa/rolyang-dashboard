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
  if (f.endsWith('.tsx')) {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    
    // Replace max-w-6xl mx-auto
    content = content.replace(/max-w-6xl mx-auto/g, 'w-full');
    content = content.replace(/max-w-5xl mx-auto/g, 'w-full');
    content = content.replace(/max-w-4xl mx-auto/g, 'w-full');
    content = content.replace(/max-w-3xl mx-auto/g, 'w-full');
    
    if (content !== original) {
      fs.writeFileSync(f, content, 'utf8');
      console.log(`Updated width restrictions in: ${f}`);
    }
  }
});
