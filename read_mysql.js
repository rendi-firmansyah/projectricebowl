const fs = require('fs');
const path = require('path');
const xamppRoot = process.env.XAMPP_ROOT || 'C:\\xamppnew';
const mysqlRoot = path.join(xamppRoot, 'mysql');
const dataDir = path.join(mysqlRoot, 'data');

const possiblePaths = [
  path.join(mysqlRoot, 'bin', 'my.ini'),
  path.join(dataDir, 'mysql_error.log'),
];

// Read all files ending in .err in the configured XAMPP MySQL data directory.
try {
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir);
    files.forEach(f => {
      if (f.endsWith('.err')) {
        possiblePaths.push(path.join(dataDir, f));
      }
    });
  }
} catch (e) {
  console.log('Error reading data dir:', e.message);
}

possiblePaths.forEach(filePath => {
  console.log('--- FILE:', filePath, '---');
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // print last 1000 characters or 20 lines
      const lines = content.split('\n');
      console.log(lines.slice(-30).join('\n'));
    } catch (err) {
      console.log('Error reading file:', err.message);
    }
  } else {
    console.log('File does not exist');
  }
});
