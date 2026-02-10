#!/bin/bash

echo "Survey Deployment Script - Enhanced with Real Data"
echo "================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

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

error_exit() {
    echo -e "${RED}ERROR: $1${NC}" 1>&2
    echo ""
    read -p "Apasă Enter pentru a închide..."
    exit 1
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

step() {
    echo -e "${MAGENTA}STEP $1: $2${NC}"
}

if ! command -v node &> /dev/null; then
    error_exit "Node.js nu este instalat! Instalează-l mai întâi."
fi

if ! command -v git &> /dev/null; then
    error_exit "Git nu este instalat! Instalează-l mai întâi."
fi

if [ ! -d "surveys" ]; then
    error_exit "Folderul surveys/ nu există! Creează-l și adaugă fișiere JSON."
fi

if [ ! -d .git ]; then
    warning "Nu ești într-un repository Git. Inițializez..."
    git init
    success "Git repository inițializat"
fi

if [ -f "survey-schema-enhanced.json" ]; then
    SCHEMA_FILE="survey-schema-enhanced.json"
    info "Folosesc schema enhanced (cu date reale)"
elif [ -f "survey-schema.json" ]; then
    SCHEMA_FILE="survey-schema.json"
    warning "Folosesc schema veche (fără date reale)"
else
    error_exit "Nu găsesc fișierul de schemă! Ai survey-schema.json sau survey-schema-enhanced.json?"
fi

echo ""
info "Scanez folderul surveys/ pentru fișiere JSON noi, modificate sau șterse..."
echo ""

NEW_SURVEYS=()
MODIFIED_SURVEYS=()
DELETED_SURVEYS=()

for file in surveys/*.json; do
    if [ -f "$file" ]; then
        survey_slug=$(basename "$file" .json)

        if ! git ls-files --error-unmatch "$file" > /dev/null 2>&1; then
            NEW_SURVEYS+=("$survey_slug")
            info "Găsit survey NOU: $survey_slug (fișier: $(basename "$file"))"
        elif [ -n "$(git diff HEAD "$file" 2>/dev/null)" ]; then
            MODIFIED_SURVEYS+=("$survey_slug")
            info "Găsit survey MODIFICAT: $survey_slug (fișier: $(basename "$file"))"
        fi
    fi
done

while IFS= read -r deleted_file; do
    if [[ "$deleted_file" == surveys/*.json ]]; then
        survey_slug=$(basename "$deleted_file" .json)
        DELETED_SURVEYS+=("$survey_slug")
        warning "Găsit survey ȘTERS: $survey_slug (fișier: $(basename "$deleted_file"))"
    fi
done < <(git ls-files --deleted 2>/dev/null)

while IFS= read -r deleted_path; do
    if [[ "$deleted_path" =~ ^public/survey/([^/]+)/ ]]; then
        survey_slug="${BASH_REMATCH[1]}"
        if [[ ! " ${DELETED_SURVEYS[@]} " =~ " ${survey_slug} " ]]; then
            DELETED_SURVEYS+=("$survey_slug")
            warning "Găsit survey ȘTERS din public: $survey_slug (director: public/survey/${survey_slug}/)"
        fi
    fi
done < <(git ls-files --deleted 2>/dev/null | grep "^public/survey/")

ALL_CHANGED_SURVEYS=("${NEW_SURVEYS[@]}" "${MODIFIED_SURVEYS[@]}" "${DELETED_SURVEYS[@]}")

if [ ${#ALL_CHANGED_SURVEYS[@]} -eq 0 ]; then
    warning "Nu am găsit surveys noi sau modificate în folderul surveys/"
    echo ""
    echo "Voi continua pentru a include index.html, 404.html și surveys-list.json dacă au modificări."
    echo ""
fi

echo ""
success "Găsite ${#ALL_CHANGED_SURVEYS[@]} survey(s) cu schimbări:"
if [ ${#NEW_SURVEYS[@]} -gt 0 ]; then
    echo ""
    echo -e "${GREEN}Surveys NOI (${#NEW_SURVEYS[@]}):${NC}"
    for survey_slug in "${NEW_SURVEYS[@]}"; do
        echo "  + $survey_slug"
    done
fi
if [ ${#MODIFIED_SURVEYS[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Surveys MODIFICATE (${#MODIFIED_SURVEYS[@]}):${NC}"
    for survey_slug in "${MODIFIED_SURVEYS[@]}"; do
        echo "  ~ $survey_slug"
    done
fi
if [ ${#DELETED_SURVEYS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Surveys ȘTERSE (${#DELETED_SURVEYS[@]}):${NC}"
    for survey_slug in "${DELETED_SURVEYS[@]}"; do
        echo "  - $survey_slug"
    done
fi

SURVEYS_TO_PROCESS=("${NEW_SURVEYS[@]}" "${MODIFIED_SURVEYS[@]}")
TOTAL_STEPS=$((${#SURVEYS_TO_PROCESS[@]} * 3 + ${#DELETED_SURVEYS[@]} + 2))
CURRENT_STEP=0

for survey_slug in "${SURVEYS_TO_PROCESS[@]}"; do
    echo ""
    echo "================================================"
    echo -e "${BOLD}Procesez: $survey_slug${NC}"
    echo "================================================"

    SURVEY_FILE="surveys/${survey_slug}.json"

    echo ""
    step "1" "Validare JSON cu $SCHEMA_FILE"
    ((CURRENT_STEP++))
    show_progress $CURRENT_STEP $TOTAL_STEPS
    echo ""

    if node scripts/validate-survey.js "$SURVEY_FILE"; then
        success "JSON valid pentru $survey_slug"

        if [ "$SCHEMA_FILE" = "survey-schema-enhanced.json" ]; then
            if grep -q '"dataSource"' "$SURVEY_FILE"; then
                SAMPLE_SIZE=$(grep -o '"sampleSize"[[:space:]]*:[[:space:]]*[0-9]*' "$SURVEY_FILE" | grep -o '[0-9]*$')
                if [ -n "$SAMPLE_SIZE" ]; then
                    info "📊 Survey bazat pe $SAMPLE_SIZE participanți din cercetare reală"
                fi

                SOURCE_COUNT=$(grep -c '"name"[[:space:]]*:' "$SURVEY_FILE" | head -1)
                if [ -n "$SOURCE_COUNT" ] && [ "$SOURCE_COUNT" -gt 0 ]; then
                    info "📚 Găsite surse științifice în survey"
                fi
            else
                warning "Survey-ul nu conține metadata cu surse (posibil format vechi)"
            fi
        fi
    else
        error_exit "JSON invalid pentru $survey_slug! Corectează erorile și încearcă din nou."
    fi

    echo ""
    step "2" "Generare pagină HTML"
    ((CURRENT_STEP++))
    show_progress $CURRENT_STEP $TOTAL_STEPS
    echo ""

    if node scripts/generate-page.js "$survey_slug"; then
        success "Pagină generată pentru $survey_slug"
    else
        error_exit "Eroare la generarea paginii pentru $survey_slug"
    fi

    echo ""
    step "3" "Adăugare în Git"
    ((CURRENT_STEP++))
    show_progress $CURRENT_STEP $TOTAL_STEPS

    git add "$SURVEY_FILE"
    git add "public/survey/${survey_slug}/"
    success "Fișiere adăugate pentru $survey_slug"
done

echo ""
step "EXTRA" "Adăugare index.html, 404.html și surveys-list.json"
if [ -f "index.html" ]; then
    git add index.html
    success "index.html adăugat"
else
    warning "index.html nu există"
fi

if [ -f "404.html" ]; then
    git add 404.html
    success "404.html adăugat"
else
    warning "404.html nu există"
fi

# Reconstruiește surveys-list.json din surveys/ ca să șteargă intrările lipsă
if [ -f "scripts/rebuild-surveys-list.js" ]; then
    node scripts/rebuild-surveys-list.js
else
    warning "scripts/rebuild-surveys-list.js nu există"
fi

if [ -f "public/survey/surveys-list.json" ]; then
    git add public/survey/surveys-list.json
    success "surveys-list.json adăugat"
else
    warning "public/survey/surveys-list.json nu există"
fi

if [ ${#DELETED_SURVEYS[@]} -gt 0 ]; then
    echo ""
    echo "================================================"
    echo -e "${BOLD}Procesez surveys ȘTERSE${NC}"
    echo "================================================"

    for survey_slug in "${DELETED_SURVEYS[@]}"; do
        echo ""
        step "ȘTERS" "Înregistrez ștergerea pentru $survey_slug"
        ((CURRENT_STEP++))
        show_progress $CURRENT_STEP $TOTAL_STEPS

        SURVEY_FILE="surveys/${survey_slug}.json"
        SURVEY_DIR="public/survey/${survey_slug}"

        if git ls-files --error-unmatch "$SURVEY_FILE" > /dev/null 2>&1; then
            git add "$SURVEY_FILE" 2>/dev/null || true
            info "Înregistrat: $SURVEY_FILE (șters)"
        fi

        if git ls-files "$SURVEY_DIR/" 2>/dev/null | grep -q .; then
            git add "$SURVEY_DIR/" 2>/dev/null || true
            info "Înregistrat: $SURVEY_DIR/ (șters)"
        fi

        if [ -d "$SURVEY_DIR" ]; then
            rm -rf "$SURVEY_DIR"
            info "Curățat: $SURVEY_DIR/ (șters de pe disc)"
        fi

        success "Ștergere înregistrată pentru $survey_slug"
    done
fi

echo ""
echo "================================================"
step "4" "Creare commit"
((CURRENT_STEP++))
show_progress $CURRENT_STEP $TOTAL_STEPS

COMMIT_MSG=""
if [ ${#NEW_SURVEYS[@]} -gt 0 ]; then
    if [ ${#NEW_SURVEYS[@]} -eq 1 ]; then
        COMMIT_MSG="Add survey: ${NEW_SURVEYS[0]}"
    else
        COMMIT_MSG="Add surveys: ${NEW_SURVEYS[*]}"
    fi
fi

if [ ${#MODIFIED_SURVEYS[@]} -gt 0 ]; then
    if [ -n "$COMMIT_MSG" ]; then
        COMMIT_MSG="${COMMIT_MSG}; "
    fi
    if [ ${#MODIFIED_SURVEYS[@]} -eq 1 ]; then
        COMMIT_MSG="${COMMIT_MSG}Update survey: ${MODIFIED_SURVEYS[0]}"
    else
        COMMIT_MSG="${COMMIT_MSG}Update surveys: ${MODIFIED_SURVEYS[*]}"
    fi
fi

if [ ${#DELETED_SURVEYS[@]} -gt 0 ]; then
    if [ -n "$COMMIT_MSG" ]; then
        COMMIT_MSG="${COMMIT_MSG}; "
    fi
    if [ ${#DELETED_SURVEYS[@]} -eq 1 ]; then
        COMMIT_MSG="${COMMIT_MSG}Delete survey: ${DELETED_SURVEYS[0]}"
    else
        COMMIT_MSG="${COMMIT_MSG}Delete surveys: ${DELETED_SURVEYS[*]}"
    fi
fi

if git diff --cached --quiet; then
    warning "Nu sunt modificări de commit"
else
    if [ -z "$COMMIT_MSG" ]; then
        warning "Mesaj de commit gol - nu creez commit"
    else
        git commit -m "$COMMIT_MSG" > /dev/null 2>&1
        success "Commit creat: $COMMIT_MSG"
    fi
fi

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

if git diff --cached --quiet; then
    warning "Nu există commit nou - sar peste push"
else
    if git push origin "$CURRENT_BRANCH" 2>&1; then
        success "Push pe GitHub reușit!"
    else
        error_exit "Eroare la push pe GitHub"
    fi
fi

echo ""
echo "================================================"
echo -e "${GREEN}${BOLD}Deployment finalizat cu succes!${NC}"
echo "================================================"
echo ""

if [ ${#NEW_SURVEYS[@]} -gt 0 ]; then
    echo -e "${GREEN}${BOLD}✓ Surveys NOI adăugate:${NC}"
    for survey_slug in "${NEW_SURVEYS[@]}"; do
        echo -e "${CYAN}Survey: $survey_slug${NC}"
        echo "  JSON: surveys/${survey_slug}.json"
        echo "  HTML: public/survey/${survey_slug}/index.html"
        echo "  URL (după deploy): https://yoursite.netlify.app/survey/${survey_slug}"

        if [ "$SCHEMA_FILE" = "survey-schema-enhanced.json" ]; then
            SURVEY_FILE="surveys/${survey_slug}.json"
            if grep -q '"dataSource"' "$SURVEY_FILE" 2>/dev/null; then
                echo -e "  ${GREEN}✓ Bazat pe date reale din cercetare${NC}"
            fi
        fi
        echo ""
    done
fi

if [ ${#MODIFIED_SURVEYS[@]} -gt 0 ]; then
    echo -e "${YELLOW}${BOLD}✓ Surveys MODIFICATE:${NC}"
    for survey_slug in "${MODIFIED_SURVEYS[@]}"; do
        echo -e "${CYAN}Survey: $survey_slug${NC}"
        echo "  JSON: surveys/${survey_slug}.json"
        echo "  HTML: public/survey/${survey_slug}/index.html"
        echo "  URL (după deploy): https://yoursite.netlify.app/survey/${survey_slug}"

        if [ "$SCHEMA_FILE" = "survey-schema-enhanced.json" ]; then
            SURVEY_FILE="surveys/${survey_slug}.json"
            if grep -q '"dataSource"' "$SURVEY_FILE" 2>/dev/null; then
                echo -e "  ${GREEN}✓ Bazat pe date reale din cercetare${NC}"
            fi
        fi
        echo ""
    done
fi

if [ ${#DELETED_SURVEYS[@]} -gt 0 ]; then
    echo -e "${RED}${BOLD}✓ Surveys ȘTERSE:${NC}"
    for survey_slug in "${DELETED_SURVEYS[@]}"; do
        echo -e "${CYAN}Survey: $survey_slug${NC}"

        SURVEY_FILE="surveys/${survey_slug}.json"
        SURVEY_DIR="public/survey/${survey_slug}"

        JSON_DELETED=false
        DIR_DELETED=false

        if git ls-files --deleted 2>/dev/null | grep -q "^${SURVEY_FILE}$"; then
            JSON_DELETED=true
        fi

        if git ls-files --deleted 2>/dev/null | grep -q "^${SURVEY_DIR}/"; then
            DIR_DELETED=true
        fi

        if [ "$JSON_DELETED" = true ]; then
            echo "  - Fișier JSON: surveys/${survey_slug}.json (șters)"
        fi

        if [ "$DIR_DELETED" = true ]; then
            echo "  - Director public: public/survey/${survey_slug}/ (șters)"
        fi

        if [ "$JSON_DELETED" = false ] && [ "$DIR_DELETED" = false ]; then
            echo "  - Schimbări de ștergere detectate"
        fi

        echo "  ⚠️  URL-ul nu va mai fi accesibil după deploy"
        echo ""
    done
fi

if [ "$SCHEMA_FILE" = "survey-schema-enhanced.json" ]; then
    echo -e "${CYAN}💡 Tips pentru survey-uri cu date reale:${NC}"
    echo "  • Verifică că toate sursele sunt reale și accesibile"
    echo "  • Testează link-urile din secțiunea 'Surse Științifice'"
    echo "  • Asigură-te că procentele corespund cu realitatea"
    echo ""
fi

info "Netlify va detecta automat push-ul și va face deploy în aproximativ 1-2 minute"
echo ""

read -p "Apasă Enter pentru a închide..."
