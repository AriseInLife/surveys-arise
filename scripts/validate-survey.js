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
const schema = JSON.parse(fs.readFileSync('survey-schema-enhanced.json', 'utf8'));
const survey = JSON.parse(fs.readFileSync(surveyFile, 'utf8'));

// Validează structura JSON
const ajv = new Ajv();
const validate = ajv.compile(schema);
const valid = validate(survey);

if (!valid) {
  console.error('❌ JSON-ul NU este valid conform schemei!');
  console.error('Erori:');
  validate.errors.forEach(err => {
    console.error(`  - ${err.instancePath} ${err.message}`);
  });
  process.exit(1);
}

// Validări suplimentare pentru datele reale
let hasErrors = false;

console.log('✅ Structura JSON este validă!');
console.log('');
console.log('🔍 Verificare date reale...');
console.log('');

// Verifică că procentele din fiecare întrebare însumează ~100%
survey.questions.forEach((q, qIdx) => {
  const percentages = q.options.map(opt => opt.realWorldPercentage);
  const sum = percentages.reduce((a, b) => a + b, 0);
  
  if (Math.abs(sum - 100) > 2) {
    console.error(`❌ Întrebarea ${qIdx + 1}: Procentele nu însumează 100% (total: ${sum}%)`);
    hasErrors = true;
  } else {
    console.log(`✅ Întrebarea ${qIdx + 1}: Procente valide (${sum}%)`);
  }
  
  // Verifică consistența cu context.realWorldData.distribution
  const contextDist = q.context.realWorldData.distribution;
  if (contextDist) {
    const contextSum = contextDist.reduce((a, b) => a + b, 0);
    if (Math.abs(contextSum - 100) > 2) {
      console.error(`❌ Întrebarea ${qIdx + 1}: Distribution în context nu însumează 100% (total: ${contextSum}%)`);
      hasErrors = true;
    }
    
    // Verifică că distribution corespunde cu realWorldPercentage
    contextDist.forEach((dist, idx) => {
      if (Math.abs(dist - percentages[idx]) > 1) {
        console.error(`❌ Întrebarea ${qIdx + 1}, Opțiunea ${idx + 1}: Inconsistență între distribution (${dist}%) și realWorldPercentage (${percentages[idx]}%)`);
        hasErrors = true;
      }
    });
  }
});

console.log('');

// Verifică că percentilele din rezultate au sens
const totalResultPercentage = survey.results.reduce((sum, r) => 
  sum + r.realWorldComparison.percentage, 0
);

if (Math.abs(totalResultPercentage - 100) > 5) {
  console.error(`❌ Rezultate: Procentele din realWorldComparison nu însumează ~100% (total: ${totalResultPercentage}%)`);
  hasErrors = true;
} else {
  console.log(`✅ Rezultate: Distribuție validă (${totalResultPercentage}%)`);
}

// Verifică că percentilele sunt în ordine crescătoare
const percentiles = survey.results.map(r => r.percentile.value);
for (let i = 1; i < percentiles.length; i++) {
  if (percentiles[i] <= percentiles[i - 1]) {
    console.error(`❌ Rezultat ${i + 1}: Percentila (${percentiles[i]}) nu este mai mare decât precedenta (${percentiles[i - 1]})`);
    hasErrors = true;
  }
}

console.log('');

// Verifică surse
console.log('📚 Surse de date:');
survey.metadata.dataSource.forEach((source, idx) => {
  console.log(`   ${idx + 1}. ${source.name} (${source.year})`);
  console.log(`      ${source.url}`);
  
  // Verifică URL
  if (!source.url.startsWith('http://') && !source.url.startsWith('https://')) {
    console.error(`      ⚠️  URL invalid (ar trebui să înceapă cu http:// sau https://)`);
  }
});

console.log('');
console.log('📊 Statistici generale:');
console.log(`   Sample total: ${survey.metadata.sampleSize.toLocaleString()} participanți`);
console.log(`   Data cercetare: ${survey.metadata.researchDate}`);
if (survey.metadata.demographics) {
  console.log(`   Demografie: ${survey.metadata.demographics.ageRange || 'N/A'}`);
  if (survey.metadata.demographics.countries) {
    console.log(`   Țări: ${survey.metadata.demographics.countries.join(', ')}`);
  }
}

console.log('');

if (hasErrors) {
  console.error('❌ Validare eșuată - corectează erorile de mai sus!');
  process.exit(1);
} else {
  console.log('✅ Toate validările au trecut cu succes!');
  console.log('');
  console.log(`📋 Survey ID: ${survey.id}`);
  console.log(`📋 Titlu: ${survey.title}`);
  console.log(`📋 Topic: ${survey.topic}`);
  console.log('');
  process.exit(0);
}
