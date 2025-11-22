# Oprava CORS chyby na Firestore

## Problém
Chyba `XMLHttpRequest cannot load ... due to access control checks` na Firestore API znamená, že:
- App Check může blokovat požadavky, NEBO
- Doména není v Authorized domains, NEBO
- Firestore API není správně nakonfigurované

## Řešení

### KROK 1: Zkontroluj Authorized Domains

1. Firebase Console → **Authentication** → **Settings**
2. Scroll dolů k sekci **Authorized domains**
3. Ujisti se, že je přidána tvá doména (např. `bulldogo.cz`, `www.bulldogo.cz`)
4. Pokud není, klikni na **"Add domain"** a přidej ji

### KROK 2: Zkontroluj App Check

1. Firebase Console → **App Check**
2. Najdi webovou aplikaci s App ID: `1:262039290071:web:30af0eb1c65cd75e307092`
3. **DŮLEŽITÉ:** Vypni **"Enforce App Check"** pro tuto aplikaci, pokud je zapnuté
   - Klikni na aplikaci
   - V sekci **"Enforcement"** zkontroluj, že není aktivní pro Firestore

### KROK 3: Zkontroluj Firestore API

1. Google Cloud Console: https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=inzerio-inzerce
2. Ujisti se, že **Cloud Firestore API** je povolené (Enabled)

### KROK 4: Pokud používáš custom doménu

Ujisti se, že:
- Doména je přidána v **Authorized domains**
- DNS záznamy jsou správně nastavené
- HTTPS je povolené (Firebase vyžaduje HTTPS pro produkci)

## Po opravě

1. Obnov stránku v prohlížeči (Ctrl+Shift+R)
2. Zkontroluj konzoli - chyba by měla zmizet
3. Inzeráty by se měly načítat správně

## Alternativní řešení (pokud App Check musí být zapnuté)

Pokud potřebuješ App Check, musíš:
1. Nastavit reCAPTCHA V3 Site Key
2. Přidat do HTML: `<script>window.FIREBASE_RECAPTCHA_V3_SITE_KEY = 'tvuj-site-key';</script>`
3. Aktivovat App Check v kódu (ale pro teď je lepší ho vypnout)
