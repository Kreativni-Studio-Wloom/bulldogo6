# Nastavení CORS pro Firebase Storage

## Problém
Chyba 404 na preflight requestu při nahrávání do Firebase Storage znamená, že Storage bucket nemá správně nastavená CORS pravidla.

## Řešení

### KROK 1: Instalace gcloud CLI (pokud ještě nemáš)

1. Stáhni a nainstaluj Google Cloud SDK:
   - macOS: `brew install google-cloud-sdk`
   - Nebo stáhni z: https://cloud.google.com/sdk/docs/install

2. Přihlas se:
   ```bash
   gcloud auth login
   ```

3. Nastav projekt:
   ```bash
   gcloud config set project inzerio-inzerce
   ```

### KROK 2: Kontrola současných CORS pravidel

```bash
gsutil cors get gs://inzerio-inzerce.appspot.com
```

Pokud dostaneš chybu, že bucket neexistuje, zkontroluj správný název bucketu v Firebase Console → Storage → Settings.

### KROK 3: Nastavení CORS pravidel

1. Ujisti se, že máš soubor `cors.json` v aktuálním adresáři

2. Nahraj CORS pravidla:
   ```bash
   gsutil cors set cors.json gs://inzerio-inzerce.appspot.com
   ```

3. Ověř, že se pravidla nastavila:
   ```bash
   gsutil cors get gs://inzerio-inzerce.appspot.com
   ```

### KROK 4: Ověření Firebase konfigurace

Zkontroluj, že v `firebase-init.js` máš správný storageBucket:

```javascript
storageBucket: "inzerio-inzerce.appspot.com"
```

### Alternativní řešení (pokud nemáš gcloud CLI)

Můžeš použít Firebase Console:
1. Firebase Console → Storage → Settings
2. V sekci "CORS" můžeš nastavit CORS pravidla (pokud je tato možnost dostupná)

Nebo použít Google Cloud Console:
1. Jdi na: https://console.cloud.google.com/storage/browser
2. Vyber bucket `inzerio-inzerce.appspot.com`
3. Klikni na "Permissions" → "CORS"
4. Vlož obsah z `cors.json` (bez vnějších hranatých závorek)

## Po nastavení CORS

1. Obnov stránku v prohlížeči
2. Zkus znovu nahrát inzerát
3. Chyba 404 by měla zmizet

## Kontrola

Pokud stále dostáváš chybu:
- Zkontroluj, že bucket název je správný
- Zkontroluj, že CORS pravidla jsou publikovaná
- Zkontroluj konzoli prohlížeče pro další chyby
