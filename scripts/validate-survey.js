const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

// Verifică dacă a fost dat un argument
if (process.argv.length < 3) {
  console.error('❌ Utilizare: node scripts/validate-survey.js <fisier.json>');
  console.error('   Exemplu: node scripts/validate-survey.js surveys/survey_001.json');
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

// Validează structura JSON cu AJV
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

// Validări suplimentare personalizate
let hasErrors = false;

console.log('✅ Structura JSON este validă!');
console.log('');
console.log('🔍 Verificare date reale și consistență...');
console.log('');

// Verifică că avem exact 6 întrebări
if (survey.questions.length !== 6) {
  console.error(`❌ Trebuie să fie exact 6 întrebări (găsite: ${survey.questions.length})`);
  hasErrors = true;
} else {
  console.log(`✅ Număr corect de întrebări (6)`);
}

console.log('');

// Contoare pentru tipuri de întrebări
let choiceCount = 0;
let likertCount = 0;
let totalMaxScore = 0;
const questionScores = [];

console.log('📋 Verificare tipuri și structură întrebări:');
console.log('');

// Verifică fiecare întrebare în detaliu
survey.questions.forEach((q, qIdx) => {
  const questionNum = qIdx + 1;
  
  // Verifică tipul întrebării
  if (!q.type || !['choice', 'likert'].includes(q.type)) {
    console.error(`❌ Întrebarea ${questionNum}: Tip invalid sau lipsă. Trebuie să fie 'choice' sau 'likert'`);
    hasErrors = true;
    return;
  }
  
  // ÎNTREBĂRI CHOICE
  if (q.type === 'choice') {
    choiceCount++;
    
    // Verifică numărul de opțiuni (max 3)
    if (q.options.length > 3) {
      console.error(`❌ Întrebarea ${questionNum} (choice): Maximum 3 opțiuni permise (găsite: ${q.options.length})`);
      hasErrors = true;
    }
    
    if (q.options.length < 3) {
      console.error(`❌ Întrebarea ${questionNum} (choice): Minim 3 opțiuni necesare (găsite: ${q.options.length})`);
      hasErrors = true;
    }
    
    // Verifică că distribution are 3 elemente
    if (q.context.realWorldData.distribution.length !== 3) {
      console.error(`❌ Întrebarea ${questionNum} (choice): Distribution trebuie să aibă exact 3 valori (găsite: ${q.context.realWorldData.distribution.length})`);
      hasErrors = true;
    }
    
    // Verifică că score-urile sunt între 1-3
    let maxScore = 0;
    q.options.forEach((opt, optIdx) => {
      if (opt.score < 1 || opt.score > 3) {
        console.error(`❌ Întrebarea ${questionNum} (choice), Opțiunea ${optIdx + 1}: Score invalid (${opt.score}). Trebuie între 1-3`);
        hasErrors = true;
      }
      maxScore = Math.max(maxScore, opt.score);
    });
    
    totalMaxScore += maxScore;
    questionScores.push({ type: 'choice', max: maxScore });
    
    console.log(`   ${questionNum}. ✅ CHOICE (${q.options.length} opțiuni, scoruri 1-3)`);
    
  } 
  // ÎNTREBĂRI LIKERT
  else if (q.type === 'likert') {
    likertCount++;
    
    // Verifică likertScale
    if (!q.likertScale) {
      console.error(`❌ Întrebarea ${questionNum} (likert): Lipsește câmpul obligatoriu 'likertScale'`);
      hasErrors = true;
    } else {
      // Verifică valorile min/max
      if (q.likertScale.min !== 1 || q.likertScale.max !== 5) {
        console.error(`❌ Întrebarea ${questionNum} (likert): Scala trebuie să fie 1-5 (găsit: ${q.likertScale.min}-${q.likertScale.max})`);
        hasErrors = true;
      }
      
      // Verifică etichetele
      if (!q.likertScale.minLabel || !q.likertScale.maxLabel) {
        console.error(`❌ Întrebarea ${questionNum} (likert): Lipsesc etichetele minLabel sau maxLabel`);
        hasErrors = true;
      }
      
      if (q.likertScale.minLabel && q.likertScale.minLabel.length < 3) {
        console.error(`❌ Întrebarea ${questionNum} (likert): minLabel prea scurt (minim 3 caractere)`);
        hasErrors = true;
      }
      
      if (q.likertScale.maxLabel && q.likertScale.maxLabel.length < 3) {
        console.error(`❌ Întrebarea ${questionNum} (likert): maxLabel prea scurt (minim 3 caractere)`);
        hasErrors = true;
      }
    }
    
    // Verifică numărul de opțiuni (trebuie exact 5)
    if (q.options.length !== 5) {
      console.error(`❌ Întrebarea ${questionNum} (likert): Trebuie să aibă exact 5 opțiuni (găsite: ${q.options.length})`);
      hasErrors = true;
    }
    
    // Verifică că distribution are 5 elemente
    if (q.context.realWorldData.distribution.length !== 5) {
      console.error(`❌ Întrebarea ${questionNum} (likert): Distribution trebuie să aibă exact 5 valori (găsite: ${q.context.realWorldData.distribution.length})`);
      hasErrors = true;
    }
    
    // Verifică că opțiunile sunt '1', '2', '3', '4', '5' cu score-uri corespunzătoare
    const expectedTexts = ['1', '2', '3', '4', '5'];
    q.options.forEach((opt, idx) => {
      if (opt.text !== expectedTexts[idx]) {
        console.error(`❌ Întrebarea ${questionNum} (likert), Opțiunea ${idx + 1}: Text trebuie să fie '${expectedTexts[idx]}' (găsit: '${opt.text}')`);
        hasErrors = true;
      }
      if (opt.score !== idx + 1) {
        console.error(`❌ Întrebarea ${questionNum} (likert), Opțiunea ${idx + 1}: Score trebuie să fie ${idx + 1} (găsit: ${opt.score})`);
        hasErrors = true;
      }
    });
    
    totalMaxScore += 5;
    questionScores.push({ type: 'likert', max: 5 });
    
    const labels = q.likertScale ? `"${q.likertScale.minLabel}" → "${q.likertScale.maxLabel}"` : 'N/A';
    console.log(`   ${questionNum}. ✅ LIKERT (scala 1-5, ${labels})`);
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
      if (idx < percentages.length && Math.abs(dist - percentages[idx]) > 1) {
        console.error(`❌ Întrebarea ${questionNum}, Opțiunea ${idx + 1}: Inconsistență între distribution (${dist}%) și realWorldPercentage (${percentages[idx]}%)`);
        hasErrors = true;
      }
    });
  }
  
  // Verifică că totalResponses în context match-uiește cu metadata.sampleSize
  if (q.context.realWorldData.totalResponses !== survey.metadata.sampleSize) {
    console.error(`❌ Întrebarea ${questionNum}: totalResponses (${q.context.realWorldData.totalResponses}) diferă de metadata.sampleSize (${survey.metadata.sampleSize})`);
    hasErrors = true;
  }
});

console.log('');
console.log(`📊 Mix de întrebări: ${choiceCount} choice + ${likertCount} likert`);
console.log(`📊 Punctaj minim posibil: 6 (toate răspunsurile cu scor 1)`);
console.log(`📊 Punctaj maxim posibil: ${totalMaxScore}`);

console.log('');

// Verifică sample size (25-285 cu cifre diferite)
const sampleSize = survey.metadata.sampleSize;
if (sampleSize < 25 || sampleSize > 285) {
  console.error(`❌ Sample size invalid (${sampleSize}). Trebuie să fie între 25-285`);
  hasErrors = true;
} else {
  // Verifică că are minimum 2 cifre diferite
  const digits = String(sampleSize).split('').map(Number);
  const uniqueDigits = new Set(digits);
  
  if (uniqueDigits.size < 2) {
    console.error(`❌ Sample size ${sampleSize} trebuie să aibă cel puțin 2 cifre DIFERITE`);
    console.error(`   Exemple CORECTE: 127, 245, 78, 192, 156`);
    console.error(`   Exemple GREȘITE: 111, 222, 100, 200, 150`);
    hasErrors = true;
  } else {
    console.log(`✅ Sample size valid: ${sampleSize} participanți (${uniqueDigits.size} cifre diferite)`);
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
const minPossibleScore = 6;
survey.results.forEach((result, idx) => {
  const [min, max] = result.range.split('-').map(Number);
  
  if (min < minPossibleScore) {
    console.error(`❌ Rezultat ${idx + 1} (${result.title}): Range începe sub ${minPossibleScore} (minim posibil)`);
    hasErrors = true;
  }
  
  if (max > totalMaxScore) {
    console.error(`❌ Rezultat ${idx + 1} (${result.title}): Range depășește ${totalMaxScore} (maxim posibil pentru acest mix)`);
    hasErrors = true;
  }
  
  // Verifică că range-urile sunt continue
  if (idx > 0) {
    const prevMax = parseInt(survey.results[idx - 1].range.split('-')[1]);
    if (min !== prevMax + 1) {
      console.error(`❌ Rezultat ${idx + 1}: Range-ul (${result.range}) nu este continuu cu precedentul (ar trebui să înceapă de la ${prevMax + 1})`);
      hasErrors = true;
    }
  }
});

console.log('');

// Verifică surse și URL-uri
console.log('📚 Surse de date:');
let urlWarnings = 0;
survey.metadata.dataSource.forEach((source, idx) => {
  console.log(`   ${idx + 1}. ${source.name} (${source.year})`);
  console.log(`      📎 ${source.url}`);
  
  // Verifică URL format
  if (!source.url.startsWith('http://') && !source.url.startsWith('https://')) {
    console.error(`      ⚠️  URL INVALID - trebuie să înceapă cu http:// sau https://`);
    urlWarnings++;
  }
  
  // Avertizare pentru URL-uri suspecte
  if (source.url.includes('example.com') || source.url.includes('placeholder') || source.url.includes('lorem')) {
    console.error(`      ⚠️  URL pare a fi PLACEHOLDER! Trebuie să fie link REAL și VERIFICAT!`);
    urlWarnings++;
  }
  
  // Verifică anul
  if (source.year < 2010 || source.year > 2026) {
    console.error(`      ⚠️  An invalid (${source.year}). Trebuie între 2010-2026`);
    urlWarnings++;
  }
});

if (urlWarnings > 0) {
  console.log('');
  console.error(`⚠️  ATENȚIE: ${urlWarnings} probleme cu URL-urile găsite!`);
  console.error(`⚠️  VERIFICĂ MANUAL fiecare link în browser înainte de deployment!`);
}

console.log('');
console.log('📊 Statistici generale:');
console.log(`   📋 Survey ID: ${survey.id}`);
console.log(`   📋 Titlu: ${survey.title}`);
console.log(`   📋 Topic: ${survey.topic}`);
console.log(`   👥 Sample total: ${survey.metadata.sampleSize.toLocaleString()} participanți`);
console.log(`   📅 Data cercetare: ${survey.metadata.researchDate}`);
console.log(`   📊 Punctaj minim: ${minPossibleScore}`);
console.log(`   📊 Punctaj maxim: ${totalMaxScore}`);
console.log(`   🎯 Mix întrebări: ${choiceCount} choice + ${likertCount} likert`);

if (survey.metadata.demographics) {
  console.log(`   👤 Demografie: ${survey.metadata.demographics.ageRange || 'N/A'}`);
  if (survey.metadata.demographics.countries) {
    console.log(`   🌍 Țări: ${survey.metadata.demographics.countries.join(', ')}`);
  }
}

console.log('');

// Verifică recomandări
let recErrors = 0;
survey.results.forEach((result, idx) => {
  if (!result.recommendations || result.recommendations.length < 3) {
    console.error(`❌ Rezultat ${idx + 1} (${result.title}): Trebuie să aibă minim 3 recomandări (găsite: ${result.recommendations?.length || 0})`);
    recErrors++;
  }
});

if (recErrors > 0) {
  hasErrors = true;
}

console.log('');

// Sumar final
if (hasErrors) {
  console.error('❌ ═══════════════════════════════════════════════');
  console.error('❌ VALIDARE EȘUATĂ - Corectează erorile de mai sus!');
  console.error('❌ ═══════════════════════════════════════════════');
  process.exit(1);
} else {
  console.log('✅ ═══════════════════════════════════════════════');
  console.log('✅ TOATE VALIDĂRILE AU TRECUT CU SUCCES!');
  console.log('✅ ═══════════════════════════════════════════════');
  console.log('');
  console.log('⚠️  CHECKLIST FINAL:');
  console.log('   [ ] Am verificat MANUAL că toate URL-urile funcționează (nu 404)?');
  console.log('   [ ] Sample size are cifre diferite (ex: 127, nu 111)?');
  console.log('   [ ] Toate textele sunt în limba română?');
  console.log('   [ ] Context de dezvoltare este clar și accesibil?');
  console.log('');
  console.log(`🚀 Gata de generare: node scripts/generate-page.js ${survey.id.replace('survey_', 'survey_')}`);
  console.log('');
  process.exit(0);
}