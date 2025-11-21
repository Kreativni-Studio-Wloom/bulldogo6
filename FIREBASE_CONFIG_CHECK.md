# Ověření Firebase konfigurace

## Aktuální konfigurace v projektu

Tato konfigurace je definována v `firebase-init.js`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyA1FEmsY458LLKQLGcUaOVXsYr3Ii55QeQ",
    authDomain: "inzerio-inzerce.firebaseapp.com",
    projectId: "inzerio-inzerce",
    storageBucket: "inzerio-inzerce.appspot.com",
    messagingSenderId: "262039290071",
    appId: "1:262039290071:web:30af0eb1c65cd75e307092",
    measurementId: "G-7VD0ZE08M3"
};
```

## Jak ověřit v Firebase Console

### 1. Otevřete Firebase Console
- Jděte na: https://console.firebase.google.com/
- Přihlaste se a vyberte projekt **inzerio-inzerce**

### 2. Ověřte Project Settings
- Klikněte na ikonu ⚙️ (Settings) → **Project settings**
- V záložce **General** zkontrolujte:
  - **Project ID**: mělo by být `inzerio-inzerce` ✅
  - **Project number**: mělo by být `262039290071` ✅

### 3. Ověřte Web App konfiguraci
- V záložce **General** scrollujte dolů k sekci **Your apps**
- Najděte webovou aplikaci s **App ID**: `1:262039290071:web:30af0eb1c65cd75e307092`
- Pokud neexistuje, vytvořte novou webovou aplikaci:
  1. Klikněte na **</> Add app** (web)
  2. Zadejte název aplikace
  3. Firebase vygeneruje novou konfiguraci
  4. Zkopírujte novou konfiguraci do `firebase-init.js`

### 4. Ověřte API klíč
- V záložce **General** scrollujte k sekci **Your apps**
- V konfiguraci vaší webové aplikace zkontrolujte **apiKey**
- Mělo by být: `AIzaSyA1FEmsY458LLKQLGcUaOVXsYr3Ii55QeQ` ✅
- Pokud se liší, aktualizujte v `firebase-init.js`

### 5. Zkontrolujte Authorization domains
- Jděte na **Authentication** → **Settings** → **Authorized domains**
- Ujistěte se, že je přidán:
  - `localhost` (pro lokální vývoj) ✅
  - Vaše produkční doména (pokud ji máte)

### 6. Zkontrolujte Phone Authentication
- Jděte na **Authentication** → **Sign-in method**
- Ujistěte se, že je **Phone** povoleno (enabled) ✅
- Klikněte na **Phone** a zkontrolujte nastavení:
  - **Phone number sign-in** musí být **Enabled**
  - **reCAPTCHA** by měla být nakonfigurovaná

### 7. Ověřte Firestore pravidla
- Jděte na **Firestore Database** → **Rules**
- Pravidla by měla být zkopírovaná z `firestore-rules.txt` ✅
- Klikněte na **Publish** po úpravách

## Porovnání hodnot

| Parametr | Hodnota v kódu | Ověřte v Console |
|----------|----------------|-----------------|
| **projectId** | `inzerio-inzerce` | Project Settings → General → Project ID |
| **apiKey** | `AIzaSyA1FEmsY458LLKQLGcUaOVXsYr3Ii55QeQ` | Project Settings → General → Your apps → Web app config |
| **appId** | `1:262039290071:web:30af0eb1c65cd75e307092` | Project Settings → General → Your apps → App ID |
| **messagingSenderId** | `262039290071` | Project Settings → General → Project number |

## Rychlá kontrola

Pokud vidíte chybu `auth/invalid-app-credential`, zkontrolujte:

1. ✅ Projekt **inzerio-inzerce** existuje v Firebase Console
2. ✅ Webová aplikace s App ID `1:262039290071:web:30af0eb1c65cd75e307092` existuje
3. ✅ API klíč v Console odpovídá konfiguraci v kódu
4. ✅ **Phone authentication** je povoleno
5. ✅ Doména `localhost` je v **Authorized domains**

## Pokud hodnoty neodpovídají

1. **Nový API klíč**: Pokud API klíč v Console je jiný, aktualizujte `firebase-init.js`
2. **Nový App ID**: Pokud App ID neexistuje, vytvořte novou webovou aplikaci a zkopírujte novou konfiguraci
3. **Nový projekt**: Pokud projekt neexistuje, vytvořte nový projekt a použijte jeho konfiguraci

## Aktualizace konfigurace

Po ověření v Firebase Console:
1. Pokud jsou hodnoty správné → problém je pravděpodobně v jiných nastaveních (Phone auth, Authorized domains)
2. Pokud se hodnoty liší → aktualizujte `firebase-init.js` s hodnotami z Firebase Console

---
*Tento dokument byl vygenerován pro snadnou kontrolu Firebase konfigurace projektu.*

