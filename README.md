# Survey Generator

Generator pentru chestionare statice, bazate pe JSON, cu pagini HTML și listare automată.

## Cerințe
- Node.js
- Git

## Utilizare
1. Validează un survey:
   ```powershell
   node scripts\validate-survey.js surveys\survey555.json
   ```

2. Generează pagina:
   ```powershell
   node scripts\generate-page.js survey555
   ```

3. Rulează scriptul de deploy:
   ```bash
   ./deploy-survey.sh
   ```

## Notă pentru Windows
Dacă diacriticele apar stricate în consola Windows, rulează înainte:
```powershell
chcp 65001
```
