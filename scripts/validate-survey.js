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

// Verifică că avem exact 6 întrebări
if (survey.questions.length !== 6) {
  console.error(`❌ Trebuie să fie exact 6 întrebări (găsite: ${survey.questions.length})`);
  hasErrors = true;
} else {
  console.log(`✅ Număr corect de întrebări (6)`);
}

// Contoare pentru tipuri de întrebări
let choiceCount = 0;
let likertCount = 0;
let minScore = Infinity;
let maxScore = -Infinity;

console.log('');
console.log('📋 Verificare tipuri de întrebări:');

// Verifică fiecare întrebare
survey.questions.forEach((q, qIdx) => {
  const questionNum = qIdx + 1;
  
  // Verifică tipul întrebării
  if (!q.type || !['choice', 'likert'].includes(q.type)) {
    console.error(`❌ Întrebarea ${questionNum}: Tip invalid sau lipsă. Trebuie să fie 'choice' sau 'likert'`);
    hasErrors = true;
    return;
  }
  
  if (q.type === 'choice') {
    choiceCount++;
    
    // Verifică numărul de opțiuni (max 3 pentru choice)
    if (q.options.length > 3) {
      console.error(`❌ Întrebarea ${questionNum} (choice): Maximum 3 opțiuni (găsite: ${q.options.length})`);
      hasErrors = true;
    }
    
    // Verifică că distribution are 3 elemente
    if (q.context.realWorldData.distribution.length !== 3) {
      console.error(`❌ Întrebarea ${questionNum} (choice): Distribution trebuie să aibă 3 valori (găsite: ${q.context.realWorldData.distribution.length})`);
      hasErrors = true;
    }
    
    console.log(`   ${questionNum}. ✅ Choice (${q.options.length} opțiuni, scoruri 1-3)`);
    
    // Track min/max scores
    q.options.forEach(opt => {
      minScore = Math.min(minScore, opt.score);
      maxScore = Math.max(maxScore, opt.score);
    });
    
  } else if (q.type === 'likert') {
    likertCount++;
    
    // Verifică likertScale
    if (!q.likertScale) {
      console.error(`❌ Întrebarea ${questionNum} (likert): Lipsește câmpul 'likertScale'`);
      hasErrors = true;
    } else {
      if (q.likertScale.min !== 1 || q.likertScale.max !== 5) {
        console.error(`❌ Întrebarea ${questionNum} (likert): Scala trebuie să fie 1-5`);
        hasErrors = true;
      }
      if (!q.likertScale.minLabel || !q.likertScale.maxLabel) {
        console.error(`❌ Întrebarea ${questionNum} (likert): Lipsesc etichetele minLabel/maxLabel`);
        hasErrors = true;
      }
    }
    
    // Verifică numărul de opțiuni (trebuie 5 pentru likert)
    if (q.options.length !== 5) {
      console.error(`❌ Întrebarea ${questionNum} (likert): Trebuie să aibă exact 5 opțiuni (găsite: ${q.options.length})`);
      hasErrors = true;
    }
    
    // Verifică că distribution are 5 elemente
    if (q.context.realWorldData.distribution.length !== 5) {
      console.error(`❌ Întrebarea ${questionNum} (likert): Distribution trebuie să aibă 5 valori (găsite: ${q.context.realWorldData.distribution.length})`);
      hasErrors = true;
    }
    
    // Verifică că opțiunile sunt '1', '2', '3', '4', '5'
    const expectedTexts = ['1', '2', '3', '4', '5'];
    q.options.forEach((opt, idx) => {
      if (opt.text !== expectedTexts[idx]) {
        console.error(`❌ Întrebarea ${questionNum} (likert): Opțiunea ${idx + 1} trebuie să fie '${expectedTexts[idx]}' (găsit: '${opt.text}')`);
        hasErrors = true;
      }
      if (opt.score !== idx + 1) {
        console.error(`❌ Întrebarea ${questionNum} (likert): Opțiunea ${idx + 1} trebuie să aibă score ${idx + 1} (găsit: ${opt.score})`);
        hasErrors = true;
      }
    });
    
    const labels = q.likertScale ? `"${q.likertScale.minLabel}" → "${q.likertScale.maxLabel}"` : 'N/A';
    console.log(`   ${questionNum}. ✅ Likert (scala 1-5, ${labels})`);
    
    // Track min/max scores
    q.options.forEach(opt => {
      minScore = Math.min(minScore, opt.score);
      maxScore = Math.max(maxScore, opt.score);
    });
  }
  
  // Verifică procentele
  const percentages = q.options.map(opt => opt.realWorldPercentage);
  const sum = percentages.reduce((a, b) => a + b, 0);
  
  if (Math.abs(sum - 100) > 2) {
    console.error(`❌ Întrebarea ${questionNum}: Procentele nu însumează 100% (total: ${sum}%)`);
    hasErrors = true;
  }
  
  // Verifică consistența cu context.realWorldData.distribution
  const contextDist = q.context.realWorldData.distribution;
  if (contextDist) {
    const contextSum = contextDist.reduce((a, b) => a + b, 0);
    if (Math.abs(contextSum - 100) > 2) {
      console.error(`❌ Întrebarea ${questionNum}: Distribution în context nu însumează 100% (total: ${contextSum}%)`);
      hasErrors = true;
    }
    
    // Verifică că distribution corespunde cu realWorldPercentage
    contextDist.forEach((dist, idx) => {
      if (Math.abs(dist - percentages[idx]) > 1) {
        console.error(`❌ Întrebarea ${questionNum}, Opțiunea ${idx + 1}: Inconsistență între distribution (${dist}%) și realWorldPercentage (${percentages[idx]}%)`);
        hasErrors = true;
      }
    });
  }
});

console.log('');
console.log(`📊 Mix de întrebări: ${choiceCount} choice + ${likertCount} likert`);

// Calculează punctajul maxim posibil
const maxPossibleScore = survey.questions.reduce((sum, q) => {
  const maxOptionScore = Math.max(...q.options.map(opt => opt.score));
  return sum + maxOptionScore;
}, 0);

const minPossibleScore = survey.questions.length; // Fiecare întrebare are minim score 1

console.log(`📊 Punctaj minim posibil: ${minPossibleScore}`);
console.log(`📊 Punctaj maxim posibil: ${maxPossibleScore}`);

console.log('');

// Verifică sample size (25-285)
const sampleSize = survey.metadata.sampleSize;
if (sampleSize < 25 || sampleSize > 285) {
  console.error(`❌ Sample size invalid (${sampleSize}). Trebuie să fie între 25-285`);
  hasErrors = true;
} else {
  // Verifică că are 2-3 cifre diferite
  const digits = String(sampleSize).split('').map(Number);
  const uniqueDigits = new Set(digits);
  if (uniqueDigits.size < 2) {
    console.error(`❌ Sample size ${sampleSize} trebuie să aibă cel puțin 2 cifre diferite (ex: 127, 245, 78)`);
    hasErrors = true;
  } else {
    console.log(`✅ Sample size valid: ${sampleSize} participanți (cifre diferite: ${uniqueDigits.size})`);
  }
}

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

// Verifică range-urile rezultatelor
survey.results.forEach((result, idx) => {
  const [min, max] = result.range.split('-').map(Number);
  
  if (min < minPossibleScore) {
    console.error(`❌ Rezultat ${idx + 1}: Range-ul (${result.range}) începe sub ${minPossibleScore} (minimum posibil)`);
    hasErrors = true;
  }
  
  if (max > maxPossibleScore) {
    console.error(`❌ Rezultat ${idx + 1}: Range-ul (${result.range}) depășește ${maxPossibleScore} (maximum posibil pentru acest mix de întrebări)`);
    hasErrors = true;
  }
});

console.log('');

// Verifică surse și URL-uri
console.log('📚 Surse de date:');
let urlWarnings = 0;
survey.metadata.dataSource.forEach((source, idx) => {
  console.log(`   ${idx + 1}. ${source.name} (${source.year})`);
  console.log(`      ${source.url}`);
  
  // Verifică URL format
  if (!source.url.startsWith('http://') && !source.url.startsWith('https://')) {
    console.error(`      ⚠️  URL invalid (ar trebui să înceapă cu http:// sau https://)`);
    urlWarnings++;
  }
  
  // Avertizare pentru URL-uri suspecte
  if (source.url.includes('example.com') || source.url.includes('placeholder')) {
    console.error(`      ⚠️  URL pare a fi placeholder! Verifică că este link real!`);
    urlWarnings++;
  }
});

if (urlWarnings > 0) {
  console.log('');
  console.error(`⚠️  ATENȚIE: ${urlWarnings} URL-uri suspecte găsite! Verifică manual fiecare link!`);
}

console.log('');
console.log('📊 Statistici generale:');
console.log(`   Sample total: ${survey.metadata.sampleSize.toLocaleString()} participanți`);
console.log(`   Data cercetare: ${survey.metadata.researchDate}`);
console.log(`   Punctaj minim posibil: ${minPossibleScore}`);
console.log(`   Punctaj maxim posibil: ${maxPossibleScore}`);
if (survey.metadata.demographics) {
  console.log(`   Demografie: ${survey.metadata.demographics.ageRange || 'N/A'}`);
  if (survey.metadata.demographics.countries) {
    console.log(`   Țări: ${survey.metadata.demographics.countries.join(', ')}`);
  }
}

console.log('');

// Verifică recomandări
survey.results.forEach((result, idx) => {
  if (!result.recommendations || result.recommendations.length < 3) {
    console.error(`❌ Rezultat ${idx + 1} (${result.title}): Trebuie să aibă minim 3 recomandări`);
    hasErrors = true;
  }
});

if (hasErrors) {
  console.error('❌ Validare eșuată - corectează erorile de mai sus!');
  process.exit(1);
} else {
  console.log('✅ Toate validările au trecut cu succes!');
  console.log('');
  console.log(`📋 Survey ID: ${survey.id}`);
  console.log(`📋 Titlu: ${survey.title}`);
  console.log(`📋 Topic: ${survey.topic}`);
  console.log(`📋 Mix: ${choiceCount} întrebări choice + ${likertCount} întrebări likert`);
  console.log('');
  console.log('⚠️  IMPORTANT: Verifică manual că toate URL-urile funcționează (nu returnează 404)!');
  console.log('');
  process.exit(0);
}