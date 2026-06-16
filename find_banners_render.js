const fs = require('fs');

const content = fs.readFileSync('../rolyang/src/App.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('banners') || line.includes('banner')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
