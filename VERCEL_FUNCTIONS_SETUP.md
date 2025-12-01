# Vercel Serverless Functions - GoPay Proxy Setup

## Přehled

Vytvořil jsem Vercel Serverless Functions jako alternativu k Firebase Cloud Functions. Vercel Functions nevyžadují billing a fungují automaticky při nasazení na Vercel.

## Struktura

Vytvořeny 3 API endpointy v adresáři `api/`:

1. **`api/gopay-token.js`** - Proxy pro získání OAuth tokenu
   - GET `/api/gopay-token?scope=payment-create`

2. **`api/gopay-create-payment.js`** - Proxy pro vytvoření platby
   - POST `/api/gopay-create-payment`

3. **`api/gopay-payment-status.js`** - Proxy pro dotaz na stav platby
   - GET `/api/gopay-payment-status?id={paymentId}`

## Nasazení

### Automatické nasazení

Funkce se automaticky nasadí při pushnutí do Git repozitáře, který je propojený s Vercel:

```bash
git add api/
git commit -m "Přidání Vercel Functions pro GoPay proxy"
git push
```

Vercel automaticky detekuje soubory v `api/` a vytvoří z nich serverless functions.

### Manuální nasazení

Pokud používáte Vercel CLI:

```bash
npm install -g vercel
vercel
```

## Testování

Po nasazení na Vercel budou funkce dostupné na:

- `https://bulldogo6.vercel.app/api/gopay-token?scope=payment-create`
- `https://bulldogo6.vercel.app/api/gopay-create-payment`
- `https://bulldogo6.vercel.app/api/gopay-payment-status?id={paymentId}`

### Test OAuth tokenu

Otevřete v prohlížeči:
```
https://bulldogo6.vercel.app/api/gopay-token?scope=payment-create
```

Měli byste dostat JSON:
```json
{
  "access_token": "...",
  "token_type": "Bearer"
}
```

## Konfigurace

### Produkční prostředí

Pro produkci upravte v každém souboru v `api/`:

```javascript
const GOPAY_CONFIG = {
    isTest: false, // Změnit na false
    clientId: 'TVOJE_PRODUKCNI_CLIENT_ID',
    clientSecret: 'TVOJE_PRODUKCNI_CLIENT_SECRET',
    goId: 'TVOJE_PRODUKCNI_GO_ID'
};
```

## Výhody Vercel Functions

✅ **Bez billing** - Vercel Functions jsou zdarma pro hobby projekty  
✅ **Automatické nasazení** - Při pushnutí do Git se automaticky nasadí  
✅ **Rychlé** - Edge functions jsou velmi rychlé  
✅ **CORS podpora** - Automaticky podporují CORS  

## Frontend konfigurace

Frontend (`gopay.js` a `packages.js`) je již nakonfigurován tak, aby automaticky používal aktuální doménu + `/api`:

```javascript
functionsBaseURL: window.location.origin + '/api'
```

Takže na `bulldogo6.vercel.app` bude automaticky používat:
- `https://bulldogo6.vercel.app/api/gopay-token`
- `https://bulldogo6.vercel.app/api/gopay-create-payment`
- `https://bulldogo6.vercel.app/api/gopay-payment-status`

## Troubleshooting

### Funkce nefungují po nasazení

1. Zkontrolujte Vercel Dashboard → Functions → Logs
2. Ověřte, že soubory jsou v adresáři `api/`
3. Zkontrolujte, že exportují `default async function handler`

### CORS chyby

Vercel Functions automaticky podporují CORS přes headers v kódu. Pokud máte problémy, zkontrolujte, že headers jsou správně nastavené.

### Environment variables

Pro produkční údaje můžete použít Vercel Environment Variables:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Přidejte `GOPAY_CLIENT_ID`, `GOPAY_CLIENT_SECRET`, `GOPAY_GO_ID`
3. Upravte kód, aby je používal: `process.env.GOPAY_CLIENT_ID`

## Alternativa: Firebase Functions

Pokud chcete použít Firebase Functions místo Vercel:

1. Aktivujte billing v Firebase Console
2. Nasaďte Functions podle `FIREBASE_FUNCTIONS_SETUP.md`
3. Upravte `functionsBaseURL` v `packages.js` na Firebase Functions URL

