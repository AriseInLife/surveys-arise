const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

// Verifică dacă a fost dat un argument
if (process.argv.length < 3) {
  console.error('❌ Utilizare: node scripts/validate-survey.js <fisier.json>');
  process.exit(1);
}

const surveyFile = process.argv[2];

// Verifică dacă fișierul există
if (!fs.existsSync(surveyFile)) {
  console.error(`❌ Fișierul ${surveyFile} nu există!`);
  process.exit(1);
}

// Încarcă schema și survey-ul
const schema = JSON.parse(fs.readFileSync('survey-schema.json', 'utf8'));
const survey = JSON.parse(fs.readFileSync(surveyFile, 'utf8'));

// Validează
const ajv = new Ajv();
const validate = ajv.compile(schema);
const valid = validate(survey);

if (valid) {
  console.log('✅ JSON-ul este valid!');
  console.log(`   ID: ${survey.id}`);
  console.log(`   Titlu: ${survey.title}`);
  console.log(`   Topic: ${survey.topic}`);
  process.exit(0);
} else {
  console.error('❌ JSON-ul NU este valid!');
  console.error('Erori:');
  validate.errors.forEach(err => {
    console.error(`  - ${err.instancePath} ${err.message}`);
  });
  process.exit(1);
}