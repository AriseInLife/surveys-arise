const fs = require('fs');
const path = require('path');

// Verifică argumentul
if (process.argv.length < 3) {
  console.error('❌ Utilizare: node scripts/generate-page.js <survey_id>');
  console.error('   Exemplu: node scripts/generate-page.js survey_001');
  process.exit(1);
}

const surveyId = process.argv[2];
const surveyPath = `surveys/${surveyId}.json`;

// Verifică dacă survey-ul există
if (!fs.existsSync(surveyPath)) {
  console.error(`❌ Fișierul ${surveyPath} nu există!`);
  process.exit(1);
}

// Încarcă datele survey-ului
const surveyData = JSON.parse(fs.readFileSync(surveyPath, 'utf8'));

console.log(`📄 Generez pagina pentru: ${surveyData.title}`);

// Template HTML
const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${surveyData.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 100%;
      padding: 40px;
    }
    
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    
    .description {
      color: #666;
      margin-bottom: 30px;
      font-size: 16px;
    }
    
    .question {
      margin-bottom: 30px;
    }
    
    .question h2 {
      color: #667eea;
      font-size: 18px;
      margin-bottom: 15px;
    }
    
    .question p {
      color: #333;
      font-size: 20px;
      margin-bottom: 20px;
      font-weight: 500;
    }
    
    .options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    button {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 15px 20px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      color: #333;
    }
    
    button:hover {
      background: #667eea;
      color: white;
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .results {
      text-align: center;
    }
    
    .results h2 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 26px;
    }
    
    .score {
      font-size: 48px;
      font-weight: bold;
      color: #764ba2;
      margin: 20px 0;
    }
    
    .result-description {
      color: #555;
      line-height: 1.6;
      margin-bottom: 30px;
      font-size: 16px;
    }
    
    .analysis {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
    }
    
    .analysis h3 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 20px;
    }
    
    .analysis-item {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .analysis-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .analysis-item strong {
      color: #333;
      display: block;
      margin-bottom: 5px;
    }
    
    .analysis-item p {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }
    
    #chartContainer {
      margin: 30px 0;
      max-width: 300px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .restart-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 15px 40px;
      font-size: 16px;
      border-radius: 12px;
      cursor: pointer;
      margin-top: 20px;
      transition: all 0.3s ease;
    }
    
    .restart-btn:hover {
      background: #764ba2;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div id="survey-container">
      <h1>${surveyData.title}</h1>
      <p class="description">${surveyData.description}</p>
      <div id="content"></div>
    </div>
  </div>
  
  <script>
    const surveyData = ${JSON.stringify(surveyData, null, 2)};
    let currentQuestion = 0;
    let answers = [];
    
    function renderQuestion(index) {
      const q = surveyData.questions[index];
      const html = \`
        <div class="question">
          <h2>Întrebarea \${index + 1} din 3</h2>
          <p>\${q.text}</p>
          <div class="options">
            \${q.options.map((opt, i) => \`
              <button onclick="selectAnswer(\${index}, \${i})">
                \${opt.text}
              </button>
            \`).join('')}
          </div>
        </div>
      \`;
      document.getElementById('content').innerHTML = html;
    }
    
    function selectAnswer(questionIndex, optionIndex) {
      answers[questionIndex] = optionIndex;
      
      if (currentQuestion < 2) {
        currentQuestion++;
        renderQuestion(currentQuestion);
      } else {
        showResults();
      }
    }
    
    function showResults() {
      const totalScore = answers.reduce((sum, answerIdx, qIdx) => {
        return sum + surveyData.questions[qIdx].options[answerIdx].score;
      }, 0);
      
      // Alege rezultatul bazat pe scor
      let result;
      surveyData.results.forEach(r => {
        const [min, max] = r.range.split('-').map(Number);
        if (totalScore >= min && totalScore <= max) {
          result = r;
        }
      });
      
      // Generează analiza pentru fiecare răspuns
      const analysisHTML = answers.map((ansIdx, qIdx) => {
        const q = surveyData.questions[qIdx];
        return \`
          <div class="analysis-item">
            <strong>\${q.text}</strong>
            <p>\${q.options[ansIdx].analysis}</p>
          </div>
        \`;
      }).join('');
      
      // Pie chart data
      const chartData = answers.map((ansIdx, qIdx) => 
        surveyData.questions[qIdx].options[ansIdx].score
      );
      
      document.getElementById('content').innerHTML = \`
        <div class="results">
          <h2>\${result.title}</h2>
          <div class="score">\${totalScore}/9</div>
          <p class="result-description">\${result.description}</p>
          
          <div id="chartContainer">
            <canvas id="resultsChart"></canvas>
          </div>
          
          <div class="analysis">
            <h3>Analiza răspunsurilor tale:</h3>
            \${analysisHTML}
          </div>
          
          <button class="restart-btn" onclick="location.reload()">
            🔄 Încearcă din nou
          </button>
        </div>
      \`;
      
      // Desenează chart
      const ctx = document.getElementById('resultsChart');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Întrebarea 1', 'Întrebarea 2', 'Întrebarea 3'],
          datasets: [{
            data: chartData,
            backgroundColor: [
              'rgba(102, 126, 234, 0.8)',
              'rgba(118, 75, 162, 0.8)',
              'rgba(237, 100, 166, 0.8)'
            ],
            borderColor: [
              'rgba(102, 126, 234, 1)',
              'rgba(118, 75, 162, 1)',
              'rgba(237, 100, 166, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            },
            title: {
              display: true,
              text: 'Scorul tău pe întrebare'
            }
          }
        }
      });
    }
    
    // Start
    renderQuestion(0);
  </script>
</body>
</html>`;

// Creează directorul pentru survey
const outputDir = path.join('public', 'survey', surveyId);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Scrie HTML-ul
fs.writeFileSync(path.join(outputDir, 'index.html'), html);

console.log(`✅ Pagina generată cu succes!`);
console.log(`   Locație: ${outputDir}/index.html`);
console.log(`   Preview: deschide fișierul în browser`);