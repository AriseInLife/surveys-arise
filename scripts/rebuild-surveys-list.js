const fs = require('fs');
const path = require('path');

const surveysDir = 'surveys';
const outputPath = path.join('public', 'survey', 'surveys-list.json');

if (!fs.existsSync(surveysDir)) {
  console.error('❌ Folderul surveys/ nu există.');
  process.exit(1);
}

const surveyFiles = fs.readdirSync(surveysDir)
  .filter(name => name.endsWith('.json'))
  .map(name => path.join(surveysDir, name));

const surveys = [];

surveyFiles.forEach(filePath => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    const slug = path.basename(filePath, '.json');
    surveys.push({
      slug,
      title: data.title || '',
      topic: data.topic || '',
      description: data.description || '',
      metadata: {
        sampleSize: data.metadata?.sampleSize || 0
      }
    });
  } catch (err) {
    console.error(`❌ Nu pot citi ${filePath}: ${err.message}`);
    process.exit(1);
  }
});

surveys.sort((a, b) => a.slug.localeCompare(b.slug));

const out = {
  surveys,
  lastUpdated: new Date().toISOString().split('T')[0],
  totalCount: surveys.length
};

const outDir = path.dirname(outputPath);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(out, null, 2));
console.log(`✅ surveys-list.json reconstruit (${surveys.length} chestionare)`);
