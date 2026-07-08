const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, '..', 'version.json');

try {
  const data = fs.readFileSync(versionPath, 'utf8');
  const versionObj = JSON.parse(data);

  versionObj.version += 1;
  versionObj.buildDate = new Date().toISOString().split('T')[0];
  versionObj.timestamp = Date.now();

  fs.writeFileSync(versionPath, JSON.stringify(versionObj, null, 2) + '\n', 'utf8');
  console.log(`Bumped version to v${versionObj.version} (${versionObj.buildDate})`);
} catch (error) {
  console.error('Error bumping version:', error);
  process.exit(1);
}
