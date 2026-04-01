const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'docs/04-项目实施/06-测试用例');
console.log('Reading directory:', testDir);

try {
  const files = fs.readdirSync(testDir);
  console.log('Files found:', files);

  // Read checklist file
  const checklistFile = files.find(f => f.includes('清单'));
  if (checklistFile) {
    const checklistPath = path.join(testDir, checklistFile);
    console.log('\nReading checklist:', checklistPath);
    const content = fs.readFileSync(checklistPath, 'utf8');
    console.log(content.substring(0, 8000));
  }
} catch (e) {
  console.error('Error:', e.message);
}
