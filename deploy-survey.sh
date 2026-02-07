#!/bin/bash

echo "Survey Deployment Script - Enhanced with Real Data"
echo "================================"

# Culori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Funcție pentru bară de progres
show_progress() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local completed=$((width * current / total))
    local remaining=$((width - completed))
    
    printf "\r${CYAN}["
    printf "%${completed}s" | tr ' ' '='
    printf "%${remaining}s" | tr ' ' '-'
    printf "] ${percentage}%%${NC}"
    
    if [ $current -eq $total ]; then
        echo ""
    fi
}

# Funcție pentru erori
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" 1>&2
    echo ""
    read -p "Apasă Enter pentru a închide..."
    exit 1
}

# Funcție pentru success
success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Funcție pentru info
info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

# Funcție pentru warning
warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

# Funcție pentru step
step() {
    echo -e "${MAGENTA}STEP $1: $2${NC}"
}

# Verifică Node.js
if ! command -v node &> /dev/null; then
    error_exit "Node.js nu este instalat! Instalează-l mai întâi."
fi

# Verifică Git
if ! command -v git &> /dev/null; then
    error_exit "Git nu este instalat! Instalează-l mai întâi."
fi

# Verifică dacă există folderul surveys
if [ ! -d "surveys" ]; then
    error_exit "Folderul surveys/ nu există! Creează-l și adaugă fișiere JSON."
fi

# Verifică Git repo
if [ ! -d .git ]; then
    warning "Nu ești într-un repository Git. Inițializez..."
    git init
    success "Git repository inițializat"
fi

# Verifică dacă există schema nouă
if [ -f "survey-schema-enhanced.json" ]; then
    SCHEMA_FILE="survey-schema-enhanced.json"
    info "Folosesc schema enhanced (cu date reale)"
elif [ -f "survey-schema.json" ]; then
    SCHEMA_FILE="survey-schema.json"
    warning "Folosesc schema veche (fără date reale)"
else
    error_exit "Nu găsesc fișierul de schemă! Ai survey-schema.json sau survey-schema-enhanced.json?"
fi

# Caută surveys noi sau modificate AUTOMAT
echo ""
info "Scanez folderul surveys/ pentru fișiere JSON noi sau modificate..."
echo ""

NEW_SURVEYS=()

# Parcurge TOATE fișierele .json din surveys/
for file in surveys/*.json; do
    if [ -f "$file" ]; then
        survey_id=$(basename "$file" .json)
        
        # Verifică dacă e fișier nou (untracked)
        if ! git ls-files --error-unmatch "$file" > /dev/null 2>&1; then
            NEW_SURVEYS+=("$survey_id")
            info "Găsit survey NOU: $survey_id (fișier: $(basename "$file"))"
        # Verifică dacă e fișier modificat
        elif [ -n "$(git diff HEAD "$file" 2>/dev/null)" ]; then
            NEW_SURVEYS+=("$survey_id")
            info "Găsit survey MODIFICAT: $survey_id (fișier: $(basename "$file"))"
        fi
    fi
done

# Verifică dacă am găsit surveys
if [ ${#NEW_SURVEYS[@]} -eq 0 ]; then
    warning "Nu am găsit surveys noi sau modificate în folderul surveys/"
    echo ""
    echo "Pentru a adăuga un survey:"
    echo "  1. Creează un fișier surveys/numele-tau.json (orice nume .json)"
    echo "  2. Rulează din nou acest script"
    echo ""
    if [ "$SCHEMA_FILE" = "survey-schema-enhanced.json" ]; then
        echo "📊 Pentru survey-uri cu DATE REALE din cercetare:"
        echo "  - Folosește Gemini cu GEMINI_INSTRUCTIONS.md"
        echo "  - Cere-i să caute pe web studii științifice"
        echo "  - Verifică că include surse reale și verificabile"
        echo ""
    fi
    echo "Exemple de nume valide:"
    echo "  - surveys/survey_001.json"
    echo "  - surveys/inteligenta-emotionala.json"
    echo "  - surveys/test-personalitate.json"
    echo ""
    read -p "Apasă Enter pentru a închide..."
    exit 0
fi

echo ""
success "Găsite ${#NEW_SURVEYS[@]} survey(s) de procesat:"
for survey_id in "${NEW_SURVEYS[@]}"; do
    echo "  - $survey_id"
done

# Calculăm numărul total de pași
TOTAL_STEPS=$((${#NEW_SURVEYS[@]} * 3 + 2))  # 3 pași per survey + commit + push
CURRENT_STEP=0

# Procesează fiecare survey
for survey_id in "${NEW_SURVEYS[@]}"; do
    echo ""
    echo "================================================"
    echo -e "${BOLD}Procesez: $survey_id${NC}"
    echo "================================================"
    
    SURVEY_FILE="surveys/${survey_id}.json"
    
    # Validare JSON
    echo ""
    step "1" "Validare JSON cu $SCHEMA_FILE"
    ((CURRENT_STEP++))
    show_progress $CURRENT_STEP $TOTAL_STEPS
    echo ""
    
    # Rulează validarea și arată output-ul direct
    if node scripts/validate-survey.js "$SURVEY_FILE"; then
        success "JSON valid pentru $survey_id"
        
        # Verifică dacă sunt date reale (dacă e schema enhanced)
        if [ "$SCHEMA_FILE" = "survey-schema-enhanced.json" ]; then
            # Verifică dacă JSON-ul conține metadata.dataSource
            if grep -q '"dataSource"' "$SURVEY_FILE"; then
                # Extrage sample size dacă există
                SAMPLE_SIZE=$(grep -o '"sampleSize"[[:space:]]*:[[:space:]]*[0-9]*' "$SURVEY_FILE" | grep -o '[0-9]*$')
                if [ -n "$SAMPLE_SIZE" ]; then
                    info "📊 Survey bazat pe $SAMPLE_SIZE participanți din cercetare reală"
                fi
                
                # Numără sursele
                SOURCE_COUNT=$(grep -c '"name"[[:space:]]*:' "$SURVEY_FILE" | head -1)
                if [ -n "$SOURCE_COUNT" ] && [ "$SOURCE_COUNT" -gt 0 ]; then
                    info "📚 Găsite surse științifice în survey"
                fi
            else
                warning "Survey-ul nu conține metadata cu surse (posibil format vechi)"
            fi
        fi
    else
        error_exit "JSON invalid pentru $survey_id! Corectează erorile și încearcă din nou."
    fi
    
    # Generare pagină
    echo ""
    step "2" "Generare pagină HTML"
    ((CURRENT_STEP++))
    show_progress $CURRENT_STEP $TOTAL_STEPS
    echo ""
    
    # Rulează generarea și arată output-ul direct
    if node scripts/generate-page.js "$survey_id"; then
        success "Pagină generată pentru $survey_id"
    else
        error_exit "Eroare la generarea paginii pentru $survey_id"
    fi
    
    # Git add
    echo ""
    step "3" "Adăugare în Git"
    ((CURRENT_STEP++))
    show_progress $CURRENT_STEP $TOTAL_STEPS
    
    git add "$SURVEY_FILE"
    git add "public/survey/${survey_id}/"
    success "Fișiere adăugate pentru $survey_id"
    
done

# Git commit
echo ""
echo "================================================"
step "4" "Creare commit"
((CURRENT_STEP++))
show_progress $CURRENT_STEP $TOTAL_STEPS

if [ ${#NEW_SURVEYS[@]} -eq 1 ]; then
    COMMIT_MSG="Add survey: ${NEW_SURVEYS[0]}"
else
    COMMIT_MSG="Add surveys: ${NEW_SURVEYS[*]}"
fi

if git diff --cached --quiet; then
    warning "Nu sunt modificări de commit"
else
    git commit -m "$COMMIT_MSG" > /dev/null 2>&1
    success "Commit creat: $COMMIT_MSG"
fi

# Git push
echo ""
step "5" "Push pe GitHub"
((CURRENT_STEP++))
show_progress $CURRENT_STEP $TOTAL_STEPS

if ! git remote get-url origin > /dev/null 2>&1; then
    warning "Nu ai configurat remote-ul GitHub!"
    echo ""
    echo "Rulează următoarele comenzi:"
    echo "  git remote add origin https://github.com/USERNAME/REPO.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    echo ""
    read -p "Apasă Enter pentru a închide..."
    exit 0
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if git push origin "$CURRENT_BRANCH" 2>&1; then
    success "Push pe GitHub reușit!"
else
    error_exit "Eroare la push pe GitHub"
fi

# Informații finale
echo ""
echo "================================================"
echo -e "${GREEN}${BOLD}Deployment finalizat cu succes!${NC}"
echo "================================================"
echo ""

for survey_id in "${NEW_SURVEYS[@]}"; do
    echo -e "${CYAN}Survey: $survey_id${NC}"
    echo "  JSON: surveys/${survey_id}.json"
    echo "  HTML: public/survey/${survey_id}/index.html"
    echo "  URL (după deploy): https://yoursite.netlify.app/survey/${survey_id}"
    
    # Arată info despre date reale dacă există
    if [ "$SCHEMA_FILE" = "survey-schema-enhanced.json" ]; then
        SURVEY_FILE="surveys/${survey_id}.json"
        if grep -q '"dataSource"' "$SURVEY_FILE"; then
            echo -e "  ${GREEN}✓ Bazat pe date reale din cercetare${NC}"
        fi
    fi
    echo ""
done

if [ "$SCHEMA_FILE" = "survey-schema-enhanced.json" ]; then
    echo -e "${CYAN}💡 Tips pentru survey-uri cu date reale:${NC}"
    echo "  • Verifică că toate sursele sunt reale și accesibile"
    echo "  • Testează link-urile din secțiunea 'Surse Științifice'"
    echo "  • Asigură-te că procentele corespund cu realitatea"
    echo ""
fi

info "Netlify va detecta automat push-ul și va face deploy în aproximativ 1-2 minute"
echo ""

# Așteaptă Enter înainte de a închide
read -p "Apasă Enter pentru a închide..."