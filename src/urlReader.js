const fs = require('fs');

function readUrlsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const urls = content
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .filter(url => isValidUrl(url));

    return urls;
  } catch (error) {
    throw new Error(`Failed to read URL file: ${error.message}`);
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = { readUrlsFromFile };
