# Firebase Cloud Functions - GoPay Proxy Setup

## Problém

GoPay API nepodporuje CORS pro přímé volání z prohlížeče. Proto je potřeba vytvořit server-side proxy pomocí Firebase Cloud Functions.

## Instalace

### 1. Instalace Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Přihlášení do Firebase

```bash
firebase login
```

### 3. Inicializace Functions (pokud ještě není)

```bash
cd /Users/adam/Desktop/abulldogo3
firebase init functions
```

Vyberte:
- JavaScript
- ESLint: Ano
- Install dependencies: Ano

### 4. Instalace závislostí

```bash
cd functions
npm install
```

### 5. Nasazení Functions

```bash
firebase deploy --only functions
```

Po nasazení získáte URL ve formátu:
```
https://us-central1-inzerio-inzerce.cloudfunctions.net/gopayToken
https://us-central1-inzerio-inzerce.cloudfunctions.net/gopayCreatePayment
https://us-central1-inzerio-inzerce.cloudfunctions.net/gopayPaymentStatus
```

## Konfigurace

### Produkční prostředí

Pro produkci upravte v `functions/index.js`:

```javascript
const GOPAY_CONFIG = {
    isTest: false, // Změnit na false
    clientId: 'TVOJE_PRODUKCNI_CLIENT_ID',
    clientSecret: 'TVOJE_PRODUKCNI_CLIENT_SECRET',
    goId: 'TVOJE_PRODUKCNI_GO_ID'
};
```

### URL Cloud Functions

Po nasazení zkontrolujte URL v `packages.js`:

```javascript
const GOPAY_CONFIG = {
    isTest: true,
    clientId: '1204015758',
    clientSecret: '7WFS2HCS',
    goId: '8419533331',
    functionsBaseURL: 'https://us-central1-inzerio-inzerce.cloudfunctions.net' // Upravte podle vašeho projektu
};
```

## Testování

### Lokální testování

```bash
cd functions
npm run serve
```

Functions budou dostupné na:
- http://localhost:5001/inzerio-inzerce/us-central1/gopayToken
- http://localhost:5001/inzerio-inzerce/us-central1/gopayCreatePayment
- http://localhost:5001/inzerio-inzerce/us-central1/gopayPaymentStatus

### Testování nasazených Functions

Otevřete v prohlížeči:
```
https://us-central1-inzerio-inzerce.cloudfunctions.net/gopayToken?scope=payment-create
```

Měli byste dostat JSON s `access_token`.

## Bezpečnost

⚠️ **Důležité:** ClientSecret je nyní bezpečně uložen na serveru (Cloud Functions), ne v klientském kódu.

## Troubleshooting

### Chyba: "Functions directory not found"

Ujistěte se, že jste v kořenovém adresáři projektu a že existuje složka `functions/`.

### Chyba: "Permission denied"

Zkontrolujte, zda máte oprávnění k nasazení Functions v Firebase projektu:
```bash
firebase projects:list
```

### Chyba: "Module not found"

Spusťte v adresáři `functions/`:
```bash
npm install
```

## Aktualizace Functions

Po změně kódu v `functions/index.js`:

```bash
firebase deploy --only functions
```

## Monitoring

Sledování logů Functions:
```bash
firebase functions:log
```

Nebo v Firebase Console:
Firebase Console → Functions → Logs

