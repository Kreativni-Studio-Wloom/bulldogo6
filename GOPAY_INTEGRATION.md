# GoPay Integrace - Dokumentace

## Přehled

Integrace platební brány GoPay pro platby balíčků na Bulldogo.cz byla úspěšně implementována. Systém podporuje:
- Vytváření plateb přes GoPay REST API
- Inline i redirect variantu platební brány
- Automatické zpracování notifikací o změně stavu platby
- Aktivaci balíčků po úspěšné platbě
- Ukládání informací o platbách do Firestore

## Soubory

### 1. `gopay.js`
GoPay API wrapper pro komunikaci s GoPay REST API:
- OAuth token získání a cache
- Vytváření plateb
- Dotaz na stav platby
- Refundace plateb

### 2. `packages.js` (upraveno)
Hlavní logika pro zpracování plateb:
- `processPayment()` - vytvoření platby a zobrazení GoPay brány
- `handlePaymentResult()` - zpracování výsledku platby
- `activatePlanFromPayment()` - aktivace balíčku po úspěšné platbě
- `handleGoPayReturn()` - zpracování návratu z platební brány

### 3. `gopay-notification.html`
Endpoint pro zpracování GoPay notifikací:
- Automatické zpracování změn stavu platby
- Aktualizace stavu v Firestore
- Aktivace balíčků při úspěšné platbě

### 4. `packages.html` (upraveno)
Přidán GoPay JavaScript SDK a gopay.js

## Konfigurace

### Testovací prostředí (aktuálně aktivní)

V `packages.js` a `gopay-notification.html`:

```javascript
const GOPAY_CONFIG = {
    isTest: true,
    clientId: '1204015758',
    clientSecret: '7WFS2HCS',
    goId: '8419533331'
};
```

### Produkční prostředí

Pro přepnutí na produkční prostředí:

1. **Změňte konfiguraci v `packages.js`:**
```javascript
const GOPAY_CONFIG = {
    isTest: false, // Změnit na false
    clientId: 'TVOJE_PRODUKCNI_CLIENT_ID',
    clientSecret: 'TVOJE_PRODUKCNI_CLIENT_SECRET',
    goId: 'TVOJE_PRODUKCNI_GO_ID'
};
```

2. **Změňte konfiguraci v `gopay-notification.html`:**
Stejná změna jako výše.

3. **Změňte GoPay JavaScript SDK v `packages.html`:**
```html
<!-- Testovací -->
<script type="text/javascript" src="https://gw.sandbox.gopay.com/gp-gw/js/embed.js"></script>

<!-- Produkční -->
<script type="text/javascript" src="https://gate.gopay.cz/gp-gw/js/embed.js"></script>
```

4. **Změňte baseURL v `gopay.js`:**
Automaticky se změní podle `isTest` flagu, ale můžete zkontrolovat:
```javascript
this.baseURL = this.isTest 
    ? 'https://gw.sandbox.gopay.com/api'
    : 'https://gate.gopay.cz/api';
```

## Testování

### Testovací platební karty

**MasterCard:**
- Číslo: `5447380000000006`
- CVV: libovolné 3 čísla (např. `123`)
- Expirace: libovolný budoucí datum (např. `03/28`)

**VISA:**
- Číslo: `4444444444444448`
- CVV: libovolné 3 čísla (např. `123`)
- Expirace: libovolný budoucí datum (např. `03/28`)

### Výsledky podle částky

- **Částka končí na *00** (např. 10,00 CZK) → Autorizace úspěšná
- **Částka končí na *04** (např. 15,04 EUR) → Autorizace neúspěšná

### Testovací scénáře

1. **Úspěšná platba:**
   - Vyberte balíček
   - Zadejte testovací kartu s částkou končící na *00
   - Platba by měla být úspěšná a balíček aktivován

2. **Zrušená platba:**
   - Začněte platbu
   - Zrušte ji na platební bráně
   - Měla by se zobrazit zpráva o zrušení

3. **Neúspěšná platba:**
   - Zadejte testovací kartu s částkou končící na *04
   - Platba by měla být zamítnuta

## Firestore struktura

### Kolekce `payments/{paymentId}`

```javascript
{
    userId: string,           // ID uživatele
    paymentId: number,        // GoPay payment ID
    orderNumber: string,      // Číslo objednávky
    plan: string,            // 'hobby' nebo 'business'
    amount: number,          // Částka v Kč
    currency: string,        // 'CZK'
    status: string,          // Stav platby (CREATED, PAID, CANCELED, atd.)
    state: string,           // GoPay state
    createdAt: Timestamp,
    updatedAt: Timestamp,
    processed: boolean,      // Zda byl balíček aktivován
    planActivatedAt: Timestamp // Kdy byl balíček aktivován
}
```

### Kolekce `users/{userId}/profile/profile`

Po úspěšné platbě se aktualizuje:
```javascript
{
    plan: string,            // 'hobby' nebo 'business'
    planUpdatedAt: Timestamp,
    planPeriodStart: Timestamp,
    planPeriodEnd: Timestamp,
    planDurationDays: number, // 30
    planCancelAt: Timestamp | null
}
```

## URL endpointy

### Return URL
`https://bulldogo.cz/packages.html?payment_return=true&id={paymentId}`

Používá se pro návrat zákazníka z platební brány po dokončení/zrušení platby.

### Notification URL
`https://bulldogo.cz/gopay-notification.html?id={paymentId}`

Používá se GoPay pro asynchronní notifikace o změně stavu platby.

**Důležité:** Notification URL musí být přístupná z internetu a musí vracet HTTP 200 status.

## Bezpečnost

1. **ClientSecret:** Nikdy nesdílejte ClientSecret v klientském kódu v produkci. Pro produkci zvažte použití backend endpointu pro vytváření plateb.

2. **HTTPS:** Pro inline platební bránu je vyžadován SSL certifikát. Bez SSL se automaticky použije redirect varianta.

3. **Notifikace:** GoPay očekává HTTP 200 odpověď na notifikace. Pokud není vrácena, GoPay se pokusí notifikaci odeslat znovu (max 20 pokusů).

## Produkční nasazení

### Před nasazením do produkce:

1. ✅ Získejte produkční údaje od GoPay (ClientID, ClientSecret, GoID)
2. ✅ Změňte `isTest: false` v konfiguraci
3. ✅ Změňte GoPay JavaScript SDK URL na produkční
4. ✅ Otestujte na testovacím prostředí všechny scénáře
5. ✅ Zkontrolujte, že notification URL je přístupná z internetu
6. ✅ Nastavte SSL certifikát pro HTTPS
7. ✅ Zkontrolujte Firestore security rules pro kolekci `payments`

### Firestore Security Rules pro `payments`

```javascript
match /payments/{paymentId} {
    // Uživatelé mohou číst pouze své vlastní platby
    allow read: if request.auth != null && 
                   resource.data.userId == request.auth.uid;
    
    // Pouze server může zapisovat (nebo pomocí Cloud Functions)
    allow write: if false; // Nebo použijte Cloud Functions pro zápis
}
```

## Podpora

Pro problémy s integrací:
- GoPay dokumentace: https://doc.gopay.cz/
- GoPay podpora: integrace@gopay.cz
- Testovací účet: https://partner.sandbox.gopay.com/

## Poznámky

- Token má životnost 30 minut a je automaticky cachován
- Inline brána funguje pouze s HTTPS
- Notifikace jsou asynchronní a mohou přijít s malým zpožděním
- Pro produkci zvažte přesunutí vytváření plateb na backend (Cloud Functions)

