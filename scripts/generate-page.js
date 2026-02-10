const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('❌ Utilizare: node scripts/generate-page.js <survey_slug>');
  process.exit(1);
}

const surveySlug = process.argv[2];
const surveyPath = `surveys/${surveySlug}.json`;

if (!fs.existsSync(surveyPath)) {
  console.error(`❌ Fișierul ${surveyPath} nu există!`);
  process.exit(1);
}

const surveyData = JSON.parse(fs.readFileSync(surveyPath, 'utf8'));

// Limitează numărul maxim de participanți la 600
const maxParticipants = 600;
if (surveyData.metadata.sampleSize > maxParticipants) {
  surveyData.metadata.sampleSize = maxParticipants;
}

console.log(`📄 Generez pagina pentru: ${surveyData.title}`);
console.log(`📊 Bazat pe ${surveyData.metadata.sampleSize.toLocaleString()} participanți din studii validate`);

const totalQuestions = surveyData.questions.length;

// Convertește distribuțiile reale în numere absolute pentru afișare
const convertToAbsoluteNumbers = () => {
  return surveyData.questions.map((q) => {
    const total = Math.min(q.context.realWorldData.totalResponses, maxParticipants);
    const distribution = q.context.realWorldData.distribution;
    return distribution.map((percentage) => Math.round((total * percentage) / 100));
  });
};

const realStats = convertToAbsoluteNumbers();

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
</head>
<body>
  <div class="container" id="survey-container">
    <div class="logo">
      <a href="https://ariseinlife.com/" target="_blank">
        <img src="../../assets/logo.png" alt="ARISEINLIFE">
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
    const surveySlug = ${JSON.stringify(surveySlug)};
    const surveyData = ${JSON.stringify(surveyData, null, 2)};
    let currentQuestion = 0;
    let answers = [];
    const totalQuestions = surveyData.questions.length;

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
            <div class="progress-fill" style="width: \${((index + 1) / totalQuestions) * 100}%"></div>
          </div>
          <h2>Întrebarea \${index + 1} din \${totalQuestions}</h2>
          <p class="question-text">\${q.text}</p>

          <div class="options">
            \${q.options.map((opt, i) => \`
              <button class="option-btn" onclick="selectAnswer(\${index}, \${i})">
                <div class="option-text">\${opt.text}</div>
              </button>
            \`).join('')}
          </div>

          <div class="research-context" style="margin-top: 16px;">
            <div class="research-icon"><img src="../../assets/brain.png" alt="Creier"></div>
            <div class="research-text">
              <strong>Context de dezvoltare:</strong> \${context.researchBasis}
            </div>
          </div>
        </div>
      \`;
      document.getElementById('content').innerHTML = html;
    }



    function selectAnswer(questionIndex, optionIndex) {
      answers[questionIndex] = optionIndex;

      if (typeof gtag !== 'undefined') {
        gtag('event', 'answer_selected', {
          'question_number': questionIndex + 1,
          'option_index': optionIndex,
          'survey_slug': surveySlug
        });
      }

      if (currentQuestion < totalQuestions - 1) {
        currentQuestion++;
        renderQuestion(currentQuestion);
      } else {
        showResults();
      }
    }

    function showResults() {
      const rawScore = answers.reduce((sum, answerIdx, qIdx) => {
        return sum + surveyData.questions[qIdx].options[answerIdx].score;
      }, 0);
      const maxScore = totalQuestions * 3;
      const normalizedScore = Math.round((rawScore / maxScore) * 10);

      let result;
      surveyData.results.forEach(r => {
        const [min, max] = r.range.split('-').map(Number);
        if (normalizedScore >= min && normalizedScore <= max) {
          result = r;
        }
      });

      if (typeof gtag !== 'undefined') {
        gtag('event', 'survey_completed', {
          'survey_slug': surveySlug,
          'total_score': normalizedScore,
          'result_category': result ? result.title : 'N/A'
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
              <strong>De ce contează acest răspuns:</strong> \${selectedOption.scientificBasis}
            </div>
          </div>
        \`;
      }).join('');

      const recommendationsHTML = result && result.recommendations
        ? \`<div class="recommendations">
          <h3>📌 Recomandări Personalizate</h3>
          \${result.recommendations.map(rec => \`
            <div class="recommendation-item">
              <div class="rec-text">\${rec.text}</div>
              <div class="rec-source">📚 Sursă: \${rec.source}</div>
            </div>
          \`).join('')}
        </div>\`
        : '';

      document.getElementById('content').innerHTML = \`
        <div class="results">
          <div class="result-header">
            <h2>\${result ? result.title : 'Rezultat indisponibil'}</h2>
            <p class="result-description">\${result ? result.description : ''}</p>
          </div>

          <div class="score-display">
            <div class="score">\${normalizedScore}/10</div>
            <div class="score-label">Scorul tău</div>
          </div>

          <div class="real-world-comparison">
            <div class="comparison-icon">📊</div>
            <div class="comparison-text">
              <strong>\${result ? result.percentile.interpretation : ''}</strong><br>
              \${result ? result.realWorldComparison.description : ''}
            </div>
          </div>

          <div id="chartContainer">
            <h3 class="chart-title">📈 Comparație: Tu vs Cercetare Reală</h3>
            <div class="chart-grid" id="chartGrid"></div>
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
            <button class="secondary-btn" onclick="downloadResults()">
              Descarcă rezultate
            </button>
            <button class="tertiary-btn" onclick="restartSurvey()">
              Începe din nou
            </button>
          </div>

          <a href="https://ariseinlife.com/" class="floating-cta-btn" target="_blank">
            Află mai multe
          </a>

          <div class="export-footer" id="export-footer">
            <div class="export-footer-text">Bazat pe cercetare validată</div>
            <div class="export-footer-link">ARISEINLIFE</div>
            <div class="export-footer-text" style="margin-top: 5px; font-size: 13px;">
              https://ariseinlife.com
            </div>
          </div>
        </div>
      \`;

      createComparisonChart();
    }

    function createComparisonChart() {
      const chartGrid = document.getElementById('chartGrid');
      if (!chartGrid) return;

      const chunkSize = 2;
      const chunks = [];
      for (let i = 0; i < totalQuestions; i += chunkSize) {
        const start = i;
        const end = Math.min(i + chunkSize, totalQuestions);
        chunks.push({ start, end });
      }

      chartGrid.innerHTML = chunks.map((chunk, chartIndex) => {
        return (
          '<div class="chart-card">' +
          '<div class="chart-card-title">Întrebările ' + (chunk.start + 1) + '-' + chunk.end + '</div>' +
          '<canvas id="resultsChart-' + chartIndex + '"></canvas>' +
          '</div>'
        );
      }).join('');

      chunks.forEach((chunk, chartIndex) => {
        const ctx = document.getElementById('resultsChart-' + chartIndex);
        const labels = surveyData.questions
          .slice(chunk.start, chunk.end)
          .map((_, idx) => 'Întrebarea ' + (chunk.start + idx + 1));

        const userScores = answers.slice(chunk.start, chunk.end).map((ansIdx, localIdx) => {
          const qIdx = chunk.start + localIdx;
          const score = surveyData.questions[qIdx].options[ansIdx].score;
          return (score / 3) * 10;
        });

        const avgScores = answers.slice(chunk.start, chunk.end).map((ansIdx, localIdx) => {
          const qIdx = chunk.start + localIdx;
          const distribution = surveyData.questions[qIdx].context.realWorldData.distribution;
          const options = surveyData.questions[qIdx].options;

          let weightedSum = 0;
          distribution.forEach((percentage, idx) => {
            const score = options[idx].score;
            weightedSum += (percentage * score) / 100;
          });

          return parseFloat(((weightedSum / 3) * 10).toFixed(2));
        });

        new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
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
            maintainAspectRatio: false,
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
                  padding: 10,
                  font: {
                    size: 11
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
      });
    }

    async function downloadResults() {
      const button = event.target;
      const originalText = button.innerHTML;

      if (typeof gtag !== 'undefined') {
        gtag('event', 'download_results', {
          'survey_slug': surveySlug
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
        link.download = 'rezultate-' + surveySlug + '-' + timestamp + '.png';
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
      if (typeof gtag !== 'undefined') {
        gtag('event', 'survey_restart', {
          'survey_slug': surveySlug
        });
      }

      currentQuestion = 0;
      answers = [];
      renderQuestion(0);
    }

    renderQuestion(0);

    if (typeof gtag !== 'undefined') {
      gtag('event', 'survey_started', {
        'survey_slug': surveySlug,
        'survey_title': surveyData.title
      });
    }
  </script>
</body>
</html>`;

const outputDir = path.join('public', 'survey', surveySlug);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'index.html'), html);

updateSurveysList(surveyData);

console.log('✅ Pagina generată cu succes!');
console.log(`   Locație: ${outputDir}/index.html`);
console.log('   Funcționalități:');
console.log('   ✓ Grafic comparativ cu date din cercetare');
console.log('   ✓ Afișare percentile și comparație cu populația');
console.log('   ✓ Surse de cercetare verificabile');
console.log('   ✓ Context de dezvoltare pentru fiecare întrebare');
console.log('   ✓ Recomandări personalizate bazate pe rezultat');
console.log('   ✓ Metadate complete despre cercetare');

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

  const existingIndex = surveysListData.surveys.findIndex(s => s.slug === surveySlug);

  const surveyEntry = {
    slug: surveySlug,
    title: newSurvey.title,
    topic: newSurvey.topic,
    description: newSurvey.description,
    metadata: {
      sampleSize: newSurvey.metadata.sampleSize
    }
  };

  if (existingIndex >= 0) {
    surveysListData.surveys[existingIndex] = surveyEntry;
    console.log(`📝 Actualizat ${surveySlug} în surveys-list.json`);
  } else {
    surveysListData.surveys.push(surveyEntry);
    console.log(`➕ Adăugat ${surveySlug} în surveys-list.json`);
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
