const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
};

const removeComments = (content) => {
  // Regex for multi-line comments
  // It matches /* ... */ but uses a lookahead to ensure it's not containing "eslint-"
  content = content.replace(/\/\*(?!\s*\*?\s*eslint-)[\s\S]*?\*\//g, '');

  // Regex for single-line comments
  // It matches // ... but uses a lookahead to ensure it's not starting with " eslint-"
  // Note: We need to be careful with single line comments as they might be inside strings.
  // This is a naive regex but usually fine for simple codebases.
  // We'll split by line to process more reliably.
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // Find the first // that is NOT preceded by 'http:' or 'https:' or 'eslint-'
    const index = line.indexOf('//');
    if (index !== -1) {
      const commentPart = line.substring(index);
      if (commentPart.includes('eslint-')) {
          return line;
      }
      // Check if it's likely a URL
      const before = line.substring(0, index);
      if (before.endsWith('http:') || before.endsWith('https:')) {
          return line;
      }
      // Extremely simple check for whether the // is inside a string
      // This counts quotes before the //
      const quoteCount = (before.match(/'/g) || []).length + (before.match(/"/g) || []).length + (before.match(/`/g) || []).length;
      if (quoteCount % 2 !== 0) {
          return line;
      }
      
      return before.trimEnd();
    }
    return line;
  });

  return newLines.join('\n');
};

const srcDir = path.join(__dirname, 'src');
const files = walk(srcDir);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const newContent = removeComments(content);
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Cleaned: ${file}`);
  }
});
