const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('❌ Utilizare: node scripts/generate-page.js <survey_id>');
  process.exit(1);
}

const surveyId = process.argv[2];
const surveyPath = `surveys/${surveyId}.json`;

if (!fs.existsSync(surveyPath)) {
  console.error(`❌ Fișierul ${surveyPath} nu există!`);
  process.exit(1);
}

const surveyData = JSON.parse(fs.readFileSync(surveyPath, 'utf8'));

console.log(`📄 Generez pagina pentru: ${surveyData.title}`);
console.log(`📊 Bazat pe ${surveyData.metadata.sampleSize.toLocaleString()} participanți din cercetare reală`);

// Convertește distribuțiile reale în numere absolute pentru afișare
const convertToAbsoluteNumbers = () => {
  return surveyData.questions.map((q, qIdx) => {
    const total = q.context.realWorldData.totalResponses;
    const distribution = q.context.realWorldData.distribution;
    
    return distribution.map(percentage => Math.round(total * percentage / 100));
  });
};

const realStats = convertToAbsoluteNumbers();

// Template HTML cu date reale și funcționalități îmbunătățite
const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${surveyData.title}</title>
  <meta name="description" content="${surveyData.description} - Bazat pe ${surveyData.metadata.sampleSize.toLocaleString()} participanți">
  <link rel="stylesheet" href="../../assets/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dom-to-image@2.6.0/dist/dom-to-image.min.js"></script>
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
        📊 Bazat pe cercetare reală: ${surveyData.metadata.sampleSize.toLocaleString()} participanți
      </div>
      <div id="content"></div>
    </div>
  </div>
  
  <script>
    const surveyData = ${JSON.stringify(surveyData, null, 2)};
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
      
      const html = \`
        <div class="question">
          <div class="progress-bar">
            <div class="progress-fill" style="width: \${((index + 1) / 3) * 100}%"></div>
          </div>
          <h2>Întrebarea \${index + 1} din 3</h2>
          <p class="question-text">\${q.text}</p>
          
          <div class="research-context">
            <div class="research-icon">🧠</div>
            <div class="research-text">
              <strong>Context științific:</strong> \${context.researchBasis}
            </div>
          </div>
          
          <div class="options">
            \${q.options.map((opt, i) => \`
              <button class="option-btn" onclick="selectAnswer(\${index}, \${i})">
                <div class="option-text">\${opt.text}</div>
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
      
      let result;
      surveyData.results.forEach(r => {
        const [min, max] = r.range.split('-').map(Number);
        if (totalScore >= min && totalScore <= max) {
          result = r;
        }
      });
      
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
              <strong>Bază științifică:</strong> \${selectedOption.scientificBasis}
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
            <div class="percentile-display">
              <div class="percentile-value">\${result.percentile.value}%</div>
              <div class="percentile-label">Percentila ta</div>
            </div>
          </div>
          
          <div class="score-display">
            <div class="score">\${totalScore}/10</div>
            <div class="score-label">Scorul tău</div>
          </div>
          
          <div class="real-world-comparison">
            <div class="comparison-icon">📊</div>
            <div class="comparison-text">
              <strong>\${result.percentile.interpretation}</strong><br>
              \${result.realWorldComparison.description}
            </div>
          </div>
          
          <p class="result-description">\${result.description}</p>
          
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
            <h3>📚 Surse Științifice</h3>
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
            <button class="secondary-btn" onclick="downloadResults()">
              Descarcă rezultate
            </button>
            <button class="tertiary-btn" onclick="restartSurvey()">
              Începe din nou
            </button>
          </div>
          
          <!-- Fixed floating button -->
          <a href="https://ariseinlife.com/" class="floating-cta-btn" target="_blank">
            Află mai multe
          </a>
          
          <!-- Footer pentru export PNG -->
          <div class="export-footer" id="export-footer">
            <div class="export-footer-text">Bazat pe cercetare științifică reală</div>
            <div class="export-footer-link">Arise in Life</div>
            <div class="export-footer-text" style="margin-top: 5px; font-size: 13px;">
              https://ariseinlife.com
            </div>
          </div>
        </div>
      \`;
      
      createComparisonChart();
    }
    
    function createComparisonChart() {
      const ctx = document.getElementById('resultsChart');
      
      // Calculăm răspunsurile utilizatorului (scalate la 10)
      const userScores = answers.map((ansIdx, qIdx) => {
        const score = surveyData.questions[qIdx].options[ansIdx].score;
        return (score / 3) * 10; // Scalăm de la 1-3 la 0-10
      });
      
      // Calculăm media reală din cercetare (scalată la 10)
      const avgScores = answers.map((ansIdx, qIdx) => {
        const distribution = surveyData.questions[qIdx].context.realWorldData.distribution;
        const options = surveyData.questions[qIdx].options;
        
        // Calculăm scorul mediu ponderat bazat pe distribuția reală
        let weightedSum = 0;
        distribution.forEach((percentage, idx) => {
          const score = options[idx].score;
          weightedSum += (percentage * score / 100);
        });
        
        return parseFloat(((weightedSum / 3) * 10).toFixed(2)); // Scalăm la 10
      });
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Întrebarea 1', 'Întrebarea 2', 'Întrebarea 3'],
          datasets: [
            {
              label: 'Scorul tău',
              data: userScores,
              backgroundColor: 'rgba(139, 158, 255, 0.8)',
              borderColor: 'rgba(139, 158, 255, 1)',
              borderWidth: 2,
              borderRadius: 8
            },
            {
              label: 'Media din cercetare (' + realWorldStats.totalResponses.toLocaleString() + ' participanți)',
              data: avgScores,
              backgroundColor: 'rgba(241, 120, 182, 0.8)',
              borderColor: 'rgba(241, 120, 182, 1)',
              borderWidth: 2,
              borderRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 10,
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
                  return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '/10';
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
        exportFooter.classList.add('export-footer-visible');
        
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
        exportFooter.classList.remove('export-footer-visible');
        
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
        if (exportFooter) exportFooter.classList.remove('export-footer-visible');
        
        button.innerHTML = '❌ Eroare';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 2000);
        
        alert('A apărut o eroare. Încearcă din nou sau folosește Print (Ctrl+P).');
      }
    }
    
    function restartSurvey() {
      currentQuestion = 0;
      answers = [];
      renderQuestion(0);
    }
    
    // Start survey
    renderQuestion(0);
  </script>
</body>
</html>`;

const outputDir = path.join('public', 'survey', surveyId);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'index.html'), html);

console.log(`✅ Pagina generată cu succes!`);
console.log(`   Locație: ${outputDir}/index.html`);
console.log(`   Funcționalități:`);
console.log(`   ✓ Grafic comparativ cu date reale din cercetare`);
console.log(`   ✓ Afișare percentile și comparație realistă`);
console.log(`   ✓ Surse științifice verificabile`);
console.log(`   ✓ Context științific pentru fiecare întrebare`);
console.log(`   ✓ Recomandări personalizate bazate pe rezultat`);
console.log(`   ✓ Metadate complete despre cercetare`);