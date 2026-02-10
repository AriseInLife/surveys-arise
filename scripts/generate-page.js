const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('❌ Utilizare: node scripts/generate-page.js <survey_id>');
  console.error('   Exemplu: node scripts/generate-page.js survey_001');
  process.exit(1);
}

const surveyId = process.argv[2];
const surveyPath = `surveys/${surveyId}.json`;

if (!fs.existsSync(surveyPath)) {
  console.error(`❌ Fișierul ${surveyPath} nu există!`);
  process.exit(1);
}

const surveyData = JSON.parse(fs.readFileSync(surveyPath, 'utf8'));

// Limitează numărul de participanți
const maxParticipants = 285;
if (surveyData.metadata.sampleSize > maxParticipants) {
  surveyData.metadata.sampleSize = maxParticipants;
}
if (surveyData.metadata.sampleSize < 25) {
  surveyData.metadata.sampleSize = 25;
}

// Calculează scorul maxim posibil bazat pe tipurile de întrebări
const maxPossibleScore = surveyData.questions.reduce((sum, q) => {
  const maxOptionScore = Math.max(...q.options.map(opt => opt.score));
  return sum + maxOptionScore;
}, 0);

console.log(`📄 Generez pagina pentru: ${surveyData.title}`);
console.log(`📊 Bazat pe ${surveyData.metadata.sampleSize.toLocaleString()} participanți din studii validate`);
console.log(`📊 Scor maxim posibil: ${maxPossibleScore} puncte`);

// Convertește distribuțiile reale în numere absolute
const convertToAbsoluteNumbers = () => {
  return surveyData.questions.map((q) => {
    const total = Math.min(q.context.realWorldData.totalResponses, maxParticipants);
    const distribution = q.context.realWorldData.distribution;
    return distribution.map(percentage => Math.round(total * percentage / 100));
  });
};

const realStats = convertToAbsoluteNumbers();

// Template HTML
const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
  
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${surveyData.title}</title>
  <meta name="description" content="${surveyData.description} - Bazat pe ${surveyData.metadata.sampleSize.toLocaleString()} participanți">
  <link rel="stylesheet" href="../../assets/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dom-to-image@2.6.0/dist/dom-to-image.min.js"></script>
  
  <style>
    /* Likert Scale Styles */
    .likert-container {
      margin-top: 30px;
    }

    .likert-labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 0 10px;
    }

    .likert-label-min,
    .likert-label-max {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-medium);
      max-width: 45%;
      text-align: left;
    }

    .likert-label-max {
      text-align: right;
    }

    .likert-options {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      max-width: 600px;
      margin: 0 auto;
    }

    .likert-btn {
      flex: 1;
      min-width: 60px;
      height: 70px;
      border: 2px solid var(--border-dark);
      background: var(--bg-dark);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .likert-btn:hover {
      border-color: var(--primary-color);
      background: linear-gradient(135deg, rgba(139, 158, 255, 0.15), rgba(157, 111, 212, 0.15));
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(139, 158, 255, 0.4);
    }

    .likert-number {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    @media (max-width: 768px) {
      .likert-options {
        max-width: 100%;
        gap: 8px;
      }
      
      .likert-btn {
        min-width: 50px;
        height: 60px;
      }
      
      .likert-number {
        font-size: 24px;
      }
      
      .likert-label-min,
      .likert-label-max {
        font-size: 12px;
      }
    }

    @media (max-width: 480px) {
      .likert-btn {
        min-width: 45px;
        height: 55px;
      }
      
      .likert-number {
        font-size: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container" id="survey-container">
    <div class="logo">
      <a href="https://ariseinlife.com/" target="_blank">
        <img src="../../assets/logo.png" alt="Arise In Life">
      </a>
    </div>
    <div id="content-wrapper">
      <h1>${surveyData.title}</h1>
      <p class="description">${surveyData.description}</p>
      <div class="research-badge">
        📊 Bazat pe studii validate: ${surveyData.metadata.sampleSize.toLocaleString()} participanți
      </div>
      <div id="content"></div>
    </div>
  </div>
  
  <script>
    const surveyData = ${JSON.stringify(surveyData, null, 2)};
    const maxPossibleScore = ${maxPossibleScore};
    let currentQuestion = 0;
    let answers = [];
    
    // Date reale din cercetare
    const realWorldStats = {
      totalResponses: surveyData.metadata.sampleSize,
      questionStats: ${JSON.stringify(realStats)},
      sources: surveyData.metadata.dataSource
    };
    
    function renderQuestion(index) {
      const q = surveyData.questions[index];
      const context = q.context;
      const isLikert = q.type === 'likert';
      
      let optionsHTML = '';
      
      if (isLikert) {
        // Afișare pentru scala Likert
        const likertScale = q.likertScale;
        optionsHTML = \`
          <div class="likert-container">
            <div class="likert-labels">
              <span class="likert-label-min">\${likertScale.minLabel}</span>
              <span class="likert-label-max">\${likertScale.maxLabel}</span>
            </div>
            <div class="likert-options">
              \${q.options.map((opt, i) => \`
                <button class="likert-btn" onclick="selectAnswer(\${index}, \${i})" title="Nivel \${opt.text}">
                  <span class="likert-number">\${opt.text}</span>
                </button>
              \`).join('')}
            </div>
          </div>
        \`;
      } else {
        // Afișare pentru întrebări choice (opțiuni descriptive)
        optionsHTML = \`
          <div class="options">
            \${q.options.map((opt, i) => \`
              <button class="option-btn" onclick="selectAnswer(\${index}, \${i})">
                <div class="option-text">\${opt.text}</div>
              </button>
            \`).join('')}
          </div>
        \`;
      }
      
      const html = \`
        <div class="question">
          <div class="progress-bar">
            <div class="progress-fill" style="width: \${((index + 1) / 6) * 100}%"></div>
          </div>
          <h2>Întrebarea \${index + 1} din 6</h2>
          <p class="question-text">\${q.text}</p>
          
          <div class="research-context">
            <div class="research-icon">🧠</div>
            <div class="research-text">
              <strong>Context de dezvoltare:</strong> \${context.researchBasis}
            </div>
          </div>
          
          \${optionsHTML}
        </div>
      \`;
      document.getElementById('content').innerHTML = html;
    }
    
    function selectAnswer(questionIndex, optionIndex) {
      answers[questionIndex] = optionIndex;
      
      // Track answer selection
      if (typeof gtag !== 'undefined') {
        gtag('event', 'answer_selected', {
          'question_number': questionIndex + 1,
          'option_index': optionIndex,
          'survey_id': surveyData.id
        });
      }
      
      if (currentQuestion < 5) {
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
      
      let result;
      surveyData.results.forEach(r => {
        const [min, max] = r.range.split('-').map(Number);
        if (totalScore >= min && totalScore <= max) {
          result = r;
        }
      });
      
      // Track survey completion
      if (typeof gtag !== 'undefined') {
        gtag('event', 'survey_completed', {
          'survey_id': surveyData.id,
          'total_score': totalScore,
          'result_category': result.title
        });
      }
      
      const analysisHTML = answers.map((ansIdx, qIdx) => {
        const q = surveyData.questions[qIdx];
        const selectedOption = q.options[ansIdx];
        return \`
          <div class="analysis-item">
            <div class="analysis-question">\${q.text}</div>
            <div class="analysis-answer">
              Răspunsul tău: "\${selectedOption.text}"
              <span class="percentile-badge">\${selectedOption.realWorldPercentage}% aleg la fel</span>
            </div>
            <div class="analysis-text">
              <strong>Analiză:</strong> \${selectedOption.analysis}
            </div>
            <div class="scientific-basis">
              <span class="science-icon">🧠</span>
              <strong>De ce contează:</strong> \${selectedOption.scientificBasis}
            </div>
          </div>
        \`;
      }).join('');
      
      const recommendationsHTML = result.recommendations ? 
        \`<div class="recommendations">
          <h3>📌 Recomandări Personalizate</h3>
          \${result.recommendations.map(rec => \`
            <div class="recommendation-item">
              <div class="rec-text">\${rec.text}</div>
              <div class="rec-source">📚 Sursă: \${rec.source}</div>
            </div>
          \`).join('')}
        </div>\` : '';
      
      document.getElementById('content').innerHTML = \`
        <div class="results">
          <div class="result-header">
            <h2>\${result.title}</h2>
            <p class="result-description">\${result.description}</p>
          </div>
          
          <div class="score-display">
            <div class="score">\${totalScore}/\${maxPossibleScore}</div>
            <div class="score-label">Scorul tău</div>
          </div>
          
          <div class="real-world-comparison">
            <div class="comparison-icon">📊</div>
            <div class="comparison-text">
              <strong>\${result.percentile.interpretation}</strong><br>
              \${result.realWorldComparison.description}
            </div>
          </div>
          
          <div id="chartContainer">
            <h3 class="chart-title">📈 Comparație: Tu vs Cercetare Reală</h3>
            <canvas id="resultsChart"></canvas>
            <div class="stats-legend">
              <div class="stats-legend-item">
                <div class="legend-color" style="background: #8b9eff;"></div>
                <span>Scorurile tale</span>
              </div>
              <div class="stats-legend-item">
                <div class="legend-color" style="background: #f178b6;"></div>
                <span>Media din cercetare (\${realWorldStats.totalResponses.toLocaleString()} participanți)</span>
              </div>
            </div>
          </div>
          
          <div class="analysis">
            <h3>🔍 Analiza Detaliată a Răspunsurilor</h3>
            \${analysisHTML}
          </div>
          
          \${recommendationsHTML}
          
          <div class="sources-section">
            <h3>📚 Surse de Cercetare</h3>
            <div class="sources-list">
              \${realWorldStats.sources.map((source, idx) => \`
                <div class="source-item">
                  <div class="source-number">\${idx + 1}</div>
                  <div class="source-details">
                    <div class="source-name">\${source.name} (\${source.year})</div>
                    <div class="source-type">\${source.type.toUpperCase()}</div>
                    <a href="\${source.url}" target="_blank" class="source-link">
                      Vezi sursa →
                    </a>
                  </div>
                </div>
              \`).join('')}
            </div>
          </div>
          
          <div class="action-buttons">
            <button onclick="downloadResults()" class="primary-btn">
              📥 Descarcă Rezultatele
            </button>
            <button onclick="restartSurvey()" class="secondary-btn">
              🔄 Reîncepe Chestionarul
            </button>
          </div>
          
          <div id="export-footer" style="display: none; margin-top: 30px; padding: 20px; text-align: center; border-top: 2px solid var(--border-dark);">
            <p style="color: var(--text-light); font-size: 14px;">
              🌐 survey.ariseinlife.com • 📊 Bazat pe cercetare validată
            </p>
          </div>
        </div>
        
        <a href="https://ariseinlife.com/" target="_blank" class="floating-cta-btn">
          Descoperă Arise In Life
        </a>
      \`;
      
      renderChart();
    }
    
    function renderChart() {
      const userScores = answers.map((ansIdx, qIdx) => {
        return surveyData.questions[qIdx].options[ansIdx].score;
      });
      
      const avgScores = surveyData.questions.map((q, qIdx) => {
        const stats = realWorldStats.questionStats[qIdx];
        const totalResponses = stats.reduce((a, b) => a + b, 0);
        
        const weightedSum = q.options.reduce((sum, opt, idx) => {
          return sum + (opt.score * stats[idx]);
        }, 0);
        
        return weightedSum / totalResponses;
      });
      
      const ctx = document.getElementById('resultsChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: surveyData.questions.map((q, i) => \`Q\${i + 1}\`),
          datasets: [
            {
              label: 'Scorul tău',
              data: userScores,
              backgroundColor: 'rgba(139, 158, 255, 0.8)',
              borderColor: 'rgba(139, 158, 255, 1)',
              borderWidth: 2
            },
            {
              label: 'Media cercetare',
              data: avgScores,
              backgroundColor: 'rgba(241, 120, 182, 0.8)',
              borderColor: 'rgba(241, 120, 182, 1)',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 5,
              ticks: {
                stepSize: 1,
                color: '#c1c7d0',
                callback: function(value) {
                  return value.toFixed(0);
                }
              },
              grid: {
                color: 'rgba(54, 59, 82, 0.5)'
              }
            },
            x: {
              ticks: {
                color: '#c1c7d0'
              },
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#c1c7d0',
                padding: 15,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(26, 29, 41, 0.95)',
              titleColor: '#e4e7eb',
              bodyColor: '#c1c7d0',
              borderColor: '#363b52',
              borderWidth: 1,
              padding: 12,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  const q = surveyData.questions[context.dataIndex];
                  const maxScore = Math.max(...q.options.map(opt => opt.score));
                  return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '/' + maxScore;
                }
              }
            }
          }
        }
      });
    }
    
    async function downloadResults() {
      const button = event.target;
      const originalText = button.innerHTML;
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'download_results', {
          'survey_id': surveyData.id
        });
      }
      
      if (typeof domtoimage === 'undefined') {
        alert('Librăria de export nu este încărcată. Te rugăm să reîmprospătezi pagina.');
        return;
      }
      
      button.innerHTML = '⏳ Generez...';
      button.disabled = true;
      
      try {
        const actionButtons = document.querySelector('.action-buttons');
        const floatingBtn = document.querySelector('.floating-cta-btn');
        const exportFooter = document.getElementById('export-footer');
        
        actionButtons.style.display = 'none';
        floatingBtn.style.display = 'none';
        exportFooter.style.display = 'block';
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const container = document.getElementById('survey-container');
        
        const dataUrl = await domtoimage.toPng(container, {
          quality: 1.0,
          bgcolor: '#2a2f45',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          },
          width: container.offsetWidth,
          height: container.offsetHeight
        });
        
        actionButtons.style.display = 'flex';
        floatingBtn.style.display = 'inline-block';
        exportFooter.style.display = 'none';
        
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = \`rezultate-\${surveyData.id}-\${timestamp}.png\`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        button.innerHTML = '✅ Descărcat!';
        button.disabled = false;
        
        setTimeout(() => {
          button.innerHTML = originalText;
        }, 2000);
        
      } catch (error) {
        console.error('Eroare la generarea imaginii:', error);
        
        const actionButtons = document.querySelector('.action-buttons');
        const floatingBtn = document.querySelector('.floating-cta-btn');
        const exportFooter = document.getElementById('export-footer');
        
        if (actionButtons) actionButtons.style.display = 'flex';
        if (floatingBtn) floatingBtn.style.display = 'inline-block';
        if (exportFooter) exportFooter.style.display = 'none';
        
        button.innerHTML = '❌ Eroare';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 2000);
        
        alert('A apărut o eroare. Încearcă din nou sau folosește Print (Ctrl+P).');
      }
    }
    
    function restartSurvey() {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'survey_restart', {
          'survey_id': surveyData.id
        });
      }
      
      currentQuestion = 0;
      answers = [];
      renderQuestion(0);
    }
    
    // Start survey
    renderQuestion(0);
    
    // Track survey start
    if (typeof gtag !== 'undefined') {
      gtag('event', 'survey_started', {
        'survey_id': surveyData.id,
        'survey_title': surveyData.title
      });
    }
  </script>
</body>
</html>`;

const outputDir = path.join('public', 'survey', surveyId);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'index.html'), html);

// Actualizează surveys-list.json
updateSurveysList(surveyData);

console.log(`✅ Pagina generată cu succes!`);
console.log(`   Locație: ${outputDir}/index.html`);
console.log(`   Funcționalități:`);
console.log(`   ✓ Suport pentru întrebări CHOICE și LIKERT`);
console.log(`   ✓ Grafic comparativ cu date din cercetare`);
console.log(`   ✓ Afișare percentile și comparație cu populația`);
console.log(`   ✓ Surse de cercetare verificabile`);
console.log(`   ✓ Context de dezvoltare pentru fiecare întrebare`);
console.log(`   ✓ Recomandări personalizate bazate pe rezultat`);

function updateSurveysList(newSurvey) {
  const surveysListPath = 'public/survey/surveys-list.json';
  
  let surveysListData;
  try {
    if (fs.existsSync(surveysListPath)) {
      surveysListData = JSON.parse(fs.readFileSync(surveysListPath, 'utf8'));
    } else {
      surveysListData = {
        surveys: [],
        lastUpdated: new Date().toISOString().split('T')[0],
        totalCount: 0
      };
    }
  } catch (error) {
    console.error('⚠️  Eroare la citirea surveys-list.json, creez unul nou');
    surveysListData = {
      surveys: [],
      lastUpdated: new Date().toISOString().split('T')[0],
      totalCount: 0
    };
  }
  
  const existingIndex = surveysListData.surveys.findIndex(s => s.id === newSurvey.id);
  
  const surveyEntry = {
    id: newSurvey.id,
    folderName: surveyId,
    title: newSurvey.title,
    topic: newSurvey.topic,
    description: newSurvey.description,
    metadata: {
      sampleSize: newSurvey.metadata.sampleSize
    }
  };
  
  if (existingIndex >= 0) {
    surveysListData.surveys[existingIndex] = surveyEntry;
    console.log(`📝 Actualizat ${newSurvey.id} în surveys-list.json`);
  } else {
    surveysListData.surveys.push(surveyEntry);
    console.log(`➕ Adăugat ${newSurvey.id} în surveys-list.json`);
  }
  
  surveysListData.totalCount = surveysListData.surveys.length;
  surveysListData.lastUpdated = new Date().toISOString().split('T')[0];
  
  const surveysListDir = path.dirname(surveysListPath);
  if (!fs.existsSync(surveysListDir)) {
    fs.mkdirSync(surveysListDir, { recursive: true });
  }
  
  fs.writeFileSync(surveysListPath, JSON.stringify(surveysListData, null, 2));
  console.log(`✅ surveys-list.json actualizat (${surveysListData.totalCount} chestionare)`);
}