# Instrucțiuni pentru Gemini - Generare Survey cu Date Reale

## Obiectiv
Trebuie să generezi un chestionar (survey) bazat pe **date reale** obținute prin căutare pe web. Chestionarul trebuie să fie fundamentat științific și să permită utilizatorilor să se compare cu date reale din cercetări, studii și statistici.

## Proces de Generare

### 1. CERCETARE INIȚIALĂ (OBLIGATORIU)

Înainte de a genera orice întrebare, TREBUIE să cauți pe web:

**Căutări obligatorii:**
```
1. "[topic] research statistics 2026"
2. "[topic] scientific studies percentages"
3. "[topic] survey results real data"
4. "[topic] psychological research findings"
5. "[topic] behavioral statistics"
```

**Exemple concrete:**
- Pentru "Inteligență Emoțională": caută "emotional intelligence statistics 2026", "EQ research data", "emotional intelligence population distribution"
- Pentru "Leadership": caută "leadership styles statistics", "effective leadership research 2026"
- Pentru "Productivity": caută "productivity habits research", "time management statistics"

### 2. IDENTIFICARE SURSE CREDIBILE

Acceptă DOAR surse de calitate:
- ✅ Studii științifice (PubMed, Google Scholar, Nature, Science)
- ✅ Organizații recunoscute (WHO, Harvard, Stanford, Yale)
- ✅ Jurnale academice peer-reviewed
- ✅ Rapoarte de la firme de consultanță majore (McKinsey, Deloitte, Gallup)
- ✅ Instituite de cercetare recunoscute

❌ NU folosi:
- Bloguri personale
- Site-uri fără referințe
- Articole de opinie
- Surse mai vechi de 2020 (dacă există alternative mai noi)

### 3. EXTRAGERE DATE REALE

Pentru fiecare întrebare, extrage:

**A. Distribuția răspunsurilor reale:**
- "X% aleg răspunsul A"
- "Y% aleg răspunsul B"  
- "Z% aleg răspunsul C"

**B. Dimensiunea eșantionului:**
- "Studiul a inclus N=5000 participanți"
- "Meta-analiză pe 25 de studii, total 15,000 subiecți"

**C. Context demografic:**
- Vârsta participanților
- Țările/regiunile incluse
- Perioada studiului

### 4. STRUCTURA JSON

Generează JSON conform schemei `survey-schema-enhanced.json`. Iată un exemplu COMPLET:

```json
{
  "id": "survey_001",
  "title": "Test de Inteligență Emolțională Bazat pe Cercetare",
  "topic": "Inteligență Emolțională",
  "description": "Compară-te cu 15,000+ participanți din studii internaționale recente",
  
  "metadata": {
    "dataSource": [
      {
        "name": "Emotional Intelligence Meta-Analysis 2026",
        "url": "https://example.com/ei-study-2026",
        "type": "study",
        "year": 2026
      },
      {
        "name": "Harvard Business Review - EQ in Workplace",
        "url": "https://hbr.org/ei-workplace",
        "type": "article",
        "year": 2025
      }
    ],
    "researchDate": "2026-02-07",
    "sampleSize": 15420,
    "demographics": {
      "ageRange": "22-55",
      "countries": ["USA", "UK", "Canada", "Germany", "France"],
      "gender": "48% bărbați, 52% femei"
    }
  },
  
  "questions": [
    {
      "text": "Când un coleg face o greșeală, cum reacționezi de obicei?",
      "context": {
        "researchBasis": "Întrebarea este bazată pe studiul 'Emotional Response Patterns in Professional Settings' (2025, N=3,200) care a identificat trei tipuri principale de răspuns la greșelile colegilor.",
        "realWorldData": {
          "totalResponses": 3200,
          "distribution": [22, 45, 33]
        }
      },
      "options": [
        {
          "text": "Îl critic direct pentru a preveni greșeli viitoare",
          "score": 1,
          "realWorldPercentage": 22,
          "analysis": "22% din participanți aleg această abordare. Cercetările arată că critica directă publică reduce productivitatea echipei cu 35% și crește rata de turnover cu 18%.",
          "scientificBasis": "Studiul Goleman (2025) demonstrează că critica directă activează sistemul de luptă-sau-fugă, reducând capacitatea cognitivă și învățarea."
        },
        {
          "text": "Discut cu persoana respectivă în privat și empatic",
          "score": 3,
          "realWorldPercentage": 33,
          "analysis": "33% aleg feedback-ul privat și empatic - top 33% în inteligență emoțională. Datele arată că această abordare îmbunătățește performanța cu 47% comparativ cu critica directă.",
          "scientificBasis": "Meta-analiza pe 47 de studii (2026) confirmă că feedback-ul privat constructiv crește receptivitatea cu 340% și retenția informației cu 250%."
        },
        {
          "text": "Ignor situația pentru a evita conflictul",
          "score": 2,
          "realWorldPercentage": 45,
          "analysis": "45% aleg evitarea - cel mai comun răspuns. Deși reduce conflictul pe termen scurt, 68% din aceste situații escaladează în probleme mai mari în următoarele 3 luni.",
          "scientificBasis": "Studiile de psihologie organizațională arată că evitarea crește stresul cronic cu 40% și reduce coeziunea echipei."
        }
      ]
    },
    {
      "text": "Cum îți gestionezi stresul în situații de presiune intensă?",
      "context": {
        "researchBasis": "Bazat pe 'Global Stress Management Study 2026' (N=8,500) care a evaluat eficacitatea diferitelor strategii de coping.",
        "realWorldData": {
          "totalResponses": 8500,
          "distribution": [18, 51, 31]
        }
      },
      "options": [
        {
          "text": "Folosesc tehnici de respirație și iau pauze regulate",
          "score": 3,
          "realWorldPercentage": 31,
          "analysis": "31% folosesc tehnici evidence-based - top 31% în management al stresului. Aceste tehnici reduc cortizolul cu 23% în 2 minute.",
          "scientificBasis": "Studii neuroscientifice (Stanford, 2026) arată că respirația controlată activează nervul vag, reducând răspunsul la stres cu 64%."
        },
        {
          "text": "Continui să lucrez fără să recunosc stresul",
          "score": 1,
          "realWorldPercentage": 18,
          "analysis": "18% ignoră complet stresul. Datele longitudinale arată că aceștia au risc de burnout crescut cu 5.2x și productivitate redusă cu 42% în 6 luni.",
          "scientificBasis": "Meta-analiza pe burnout (2025, 35 studii) confirmă că ignorarea stresului cronic duce la epuizare în 89% din cazuri."
        },
        {
          "text": "Vorbesc cu cineva despre cum mă simt",
          "score": 2,
          "realWorldPercentage": 51,
          "analysis": "51% aleg suportul social - majoritatea. Eficient pe termen scurt (reduce stresul cu 28%), dar mai puțin decât tehnicile active combinate cu suport.",
          "scientificBasis": "Cercetările arată că doar vorbitul reduce stresul cu 28%, dar combinat cu tehnici active (respirație, mindfulness) crește la 61%."
        }
      ]
    },
    {
      "text": "Când observi că un coleg este supărat, care e prima ta reacție?",
      "context": {
        "researchBasis": "Bazat pe 'Empathy in Workplace Study 2025' (N=4,100) care măsoară răspunsul empatic în context profesional.",
        "realWorldData": {
          "totalResponses": 4100,
          "distribution": [25, 48, 27]
        }
      },
      "options": [
        {
          "text": "Îl întreb dacă vrea să vorbească și ofer suport",
          "score": 3,
          "realWorldPercentage": 27,
          "analysis": "27% oferă suport proactiv - top 27% în empatie. Această abordare crește satisfacția în echipă cu 52% și reduce conflictele cu 37%.",
          "scientificBasis": "Studiul 'Empathy and Team Performance' (2026) arată că echipele cu membri empatici proactivi au productivitate cu 31% mai mare."
        },
        {
          "text": "Aștept ca el să vină la mine dacă vrea",
          "score": 2,
          "realWorldPercentage": 48,
          "analysis": "48% aleg abordarea pasiv-respectuoasă. Eficientă pentru persoane introvertite, dar 63% din cei supărați nu cer ajutor chiar dacă ar avea nevoie.",
          "scientificBasis": "Cercetări pe comunicare arată că doar 37% din oameni cer ajutor activ când au nevoie, restul așteaptă să fie întrebați."
        },
        {
          "text": "Nu intervin, nu e treaba mea",
          "score": 1,
          "realWorldPercentage": 25,
          "analysis": "25% aleg detașarea. Corelat cu satisfacție în job redusă cu 44% și izolare socială crescută. Echipele cu această cultură au turnover cu 3.2x mai mare.",
          "scientificBasis": "Studiile pe cultură organizațională demonstrează că lipsa empatiei crește burnout-ul echipei cu 67% în 12 luni."
        }
      ]
    }
  ],
  
  "results": [
    {
      "range": "3-4",
      "title": "În Dezvoltare - Potențial Mare de Creștere",
      "description": "Te afli în bottom 40% din populație în inteligență emoțională, alături cu 38% din participanții la studii. Vestea bună: IE poate fi învățată! Studiile arată că 12 săptămâni de practică zilnică pot crește scorul cu 40%.",
      "percentile": {
        "value": 30,
        "interpretation": "Te afli în bottom 40% - există oportunități mari de îmbunătățire"
      },
      "realWorldComparison": {
        "percentage": 38,
        "description": "38% din populația studiată (5,852 persoane) au scoruri similare. Cu efort consistent, poți urca în top 60% în 3-6 luni."
      },
      "recommendations": [
        {
          "text": "Practică zilnic 5 minute de mindfulness - studiile arată îmbunătățire de 31% în 8 săptămâni",
          "source": "Stanford Mindfulness Research 2026"
        },
        {
          "text": "Journaling emoțional 10 minute/zi - crește autocunoașterea cu 45% în 12 săptămâni",
          "source": "Harvard Emotional Intelligence Lab 2025"
        },
        {
          "text": "Cursuri de comunicare empatică - îmbunătățire medie de 38 puncte percentile în 6 luni",
          "source": "Yale Center for Emotional Intelligence"
        }
      ]
    },
    {
      "range": "5-7",
      "title": "Nivel Mediu-Bun - Peste Medie",
      "description": "Te afli în top 60% din populație, alături cu 47% din participanți. Ai o fundație solidă în IE. Cu practică țintită, poți atinge top 25% în 4-8 luni.",
      "percentile": {
        "value": 60,
        "interpretation": "Te afli în top 40% - peste medie, cu potențial clar de excelență"
      },
      "realWorldComparison": {
        "percentage": 47,
        "description": "47% din cei testați (7,247 persoane) au scoruri în acest interval. Majoritatea liderilor de succes încep aici și progresează cu antrenament specific."
      },
      "recommendations": [
        {
          "text": "Practică feedback-ul constructiv zilnic - studiile arată tranziție la top 25% în 5 luni pentru 68% din participanți",
          "source": "Leadership Development Quarterly 2026"
        },
        {
          "text": "Coaching profesional IE - accelerează progresul cu 2.3x comparativ cu auto-învățare",
          "source": "International Coaching Federation Study 2025"
        },
        {
          "text": "Exerciții de perspective-taking 15 min/zi - crește empatia cu 54% în 10 săptămâni",
          "source": "Journal of Applied Psychology 2026"
        }
      ]
    },
    {
      "range": "8-9",
      "title": "Excelență în Inteligență Emoțională",
      "description": "Felicitări! Te afli în TOP 15% din populație. Doar 15% din cei 15,420 participanți la studii au atins acest nivel. IE-ul tău ridicat te poziționează pentru leadership și relații de calitate superioară.",
      "percentile": {
        "value": 85,
        "interpretation": "Te afli în top 15% - nivel de excelență dovedită științific"
      },
      "realWorldComparison": {
        "percentage": 15,
        "description": "Doar 15% (2,313 persoane) au scoruri în acest interval. Cercetările arată că această categorie include: 76% din liderii de top, 84% din antreprenorii de succes și 91% din terapeuții excelenti."
      },
      "recommendations": [
        {
          "text": "Mentorare - transmite-ți abilitățile. Studiile arată că mentorii își îmbunătățesc propria IE cu încă 12%",
          "source": "Mentorship Impact Study 2026"
        },
        {
          "text": "Leadership roles - IE-ul tău te poziționează perfect pentru roluri de conducere (corelație de 0.78 cu succesul în leadership)",
          "source": "Harvard Business Review Leadership Report 2026"
        },
        {
          "text": "Practică avansată - meditation de empatie, tehnici de comunicare non-violentă pentru a ajunge în top 5%",
          "source": "Center for Compassion and Altruism Research (Stanford)"
        }
      ]
    }
  ]
}
```

## 5. REGULI IMPORTANTE

### Pentru Întrebări:
- ✅ TREBUIE să ai date reale pentru fiecare opțiune
- ✅ Procentele reale trebuie să însumeze 100% (±2% toleranță)
- ✅ Fiecare analiză TREBUIE să menționeze date concrete ("reduce cu X%", "crește cu Y%")
- ✅ Fiecare scientificBasis TREBUIE să citeze un studiu real sau principiu scientific verificabil

### Pentru Rezultate:
- ✅ Percentilele trebuie să fie realiste și bazate pe distribuția reală
- ✅ Fiecare recomandare TREBUIE să aibă sursă citată
- ✅ Descrierile trebuie să includă numere concrete din cercetare
- ✅ realWorldComparison trebuie să fie bazat pe datele reale colectate

### Pentru Metadata:
- ✅ Minim 2-3 surse credibile
- ✅ Toate URL-urile trebuie să fie reale și verificabile
- ✅ SampleSize trebuie să fie suma reală din studiile citate
- ✅ ResearchDate = data curentă când generezi survey-ul

## 6. PROCES PAS-CU-PAS

**Pas 1:** Primești topic-ul (ex: "Productivity", "Leadership", "Creativity")

**Pas 2:** Cauți pe web:
```
- "[topic] research statistics"
- "[topic] scientific studies data"  
- "[topic] survey results percentages"
- "[topic] behavioral research findings"
```

**Pas 3:** Selectezi 2-3 studii credibile și extrage:
- Dimensiunea eșantionului
- Distribuția răspunsurilor
- Concluziile principale
- Datele demografice

**Pas 4:** Creezi întrebările bazându-te pe:
- Întrebările reale din studii
- Comportamentele măsurate în cercetare
- Distribuția reală observată

**Pas 5:** Calculezi percentilele:
- Bottom 40% = range 3-4 puncte
- Middle 45% = range 5-7 puncte  
- Top 15% = range 8-9 puncte

**Pas 6:** Adaugi recomandări din:
- Concluziile studiilor
- Best practices validate științific
- Interventii cu efect dovedit

**Pas 7:** Validezi că:
- [ ] Toate procentele însumează ~100%
- [ ] Toate sursele sunt reale și verificabile
- [ ] Toate cifrele sunt consistente
- [ ] JSON-ul respectă schema

## 7. EXEMPLE DE CĂUTĂRI BUNE

**Pentru "Work-Life Balance":**
```
1. "work-life balance statistics 2026"
2. "burnout research data percentages"
3. "work-life balance survey results global"
4. "WHO burnout statistics"
5. "work-life balance research findings"
```

**Pentru "Decision Making":**
```
1. "decision making psychology research 2026"
2. "cognitive biases statistics"
3. "decision making patterns study"
4. "rational vs emotional decisions research"
```

**Pentru "Communication Skills":**
```
1. "effective communication research 2026"
2. "communication styles workplace statistics"
3. "active listening research data"
4. "communication skills survey results"
```

## 8. VERIFICARE FINALĂ

Înainte de a returna JSON-ul, verifică:

✅ **Credibilitate:**
- Toate sursele sunt .edu, .org, .gov sau publicații științifice recunoscute?
- Studiile sunt recente (2020-2026)?

✅ **Matematică:**
- Procentele pentru fiecare întrebare însumează 100% (±2%)?
- Percentilele au sens matematic?
- Sample size = suma din toate studiile?

✅ **Consistență:**
- Cifrele se potrivesc între sections?
- Realworldcomparison.percentage corespunde cu distribuția?

✅ **Calitate:**
- Fiecare analiză are cifre concrete?
- Fiecare recomandare are sursă?
- Scientificbasis citează studii reale?

## 9. FORMATARE OUTPUT

Returnează JSON-ul complet, valid, conform schemei.
Asigură-te că:
- Toate string-urile sunt în Română
- URL-urile sunt reale și funcționale
- Numerele sunt realiste și consistente
- Structura respectă 100% schema JSON

---

## EXEMPLU COMPLET DE PROMPT PENTRU TINEți să știi exact cum să folosești aceste instrucțiuni:

**INPUT (ce vei primi tu):**
```
Topic: Mindfulness and Mental Health
```

**PROCES (ce trebuie să faci):**

1. Caută pe web:
   - "mindfulness research statistics 2026"
   - "mindfulness mental health study data"
   - "meditation effects research percentages"

2. Găsești de exemplu:
   - Studiu Harvard 2025: N=4,200, 34% practică zilnic, 51% ocazional, 15% deloc
   - Meta-analiză Johns Hopkins: 47 studii, reduce anxietatea cu 38%
   - WHO Mental Health Report: 68% îmbunătățire în 8 săptămâni de practică

3. Construiești întrebări bazate pe aceste date reale

4. Generezi JSON complet conform schemei

**OUTPUT (ce vei returna):**
Un JSON complet, valid, cu toate datele reale găsite, conform exemplului de mai sus.

---

## IMPORTANT - ASISTENȚĂ ÎN TIMP REAL

Dacă pentru un anumit topic:
- Nu găsești suficiente studii recente → caută studii mai vechi (dar menționează anul)
- Nu găsești distribuții exacte → estimează bazându-te pe mai multe surse și menționează că este "estimat bazat pe multiple studii"
- Nu găsești cifre exacte → folosește range-uri ("între 30-40%") și citează sursa

Transparența este esențială - e mai bine să spui "estimat din 3 studii" decât să inventezi cifre!

## FINAL

Scopul: Survey-uri CREDIBILE, BAZATE PE ȘTIINȚĂ, care oferă utilizatorilor o comparație REALĂ cu restul populației, nu estimări arbitrare.

Succces! 🚀