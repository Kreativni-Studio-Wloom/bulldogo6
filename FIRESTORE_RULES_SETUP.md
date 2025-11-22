# Nastavení Firestore Rules

## Problém
Chyba `permission-denied: Missing or insufficient permissions` znamená, že Firestore pravidla nejsou správně nastavena nebo publikovaná.

## Řešení

### KROK 1: Otevři Firebase Console
1. Jdi na: https://console.firebase.google.com/
2. Vyber projekt **inzerio-inzerce**

### KROK 2: Otevři Firestore Rules
1. V levém menu klikni na **Firestore Database**
2. Klikni na záložku **Rules**

### KROK 3: Zkopíruj pravidla
1. Otevři soubor `firestore-rules.txt` v projektu
2. Zkopíruj celý obsah (včetně komentářů)
3. Vlož do editoru pravidel v Firebase Console

### KROK 4: Publikuj pravidla
1. Klikni na tlačítko **"Publish"**
2. Počkej 1-2 minuty, než se pravidla aktivují

## Ověření

Po publikování pravidel by mělo:
- ✅ Zmizet chyby `permission-denied`
- ✅ Inzeráty se načítat i bez přihlášení
- ✅ Přihlášení uživatelé mohou přidávat/upravovat své inzeráty

## Pokud stále vidíš chyby

1. Zkontroluj, že jsi klikl na **"Publish"** (ne jen uložil)
2. Počkej 2-3 minuty (pravidla se aktivují s malým zpožděním)
3. Obnov stránku v prohlížeči (Ctrl+Shift+R)
4. Zkontroluj konzoli prohlížeče pro další chyby
