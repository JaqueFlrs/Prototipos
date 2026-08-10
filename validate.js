const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\JaquelineFlores\\tmp-prototipos\\mis-viajes-v3.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  try {
    new Function(scriptMatch[1]);
    console.log('JS SYNTAX OK');
  } catch (e) {
    console.log('SYNTAX ERROR:', e.message);
  }
} else {
  console.log('No script tag found');
}
const chunk = html.slice(html.indexOf('<body>'), html.indexOf('<script>'));
console.log('div opens:', (chunk.match(/<div/g)||[]).length, 'div closes:', (chunk.match(/<\/div>/g)||[]).length);
