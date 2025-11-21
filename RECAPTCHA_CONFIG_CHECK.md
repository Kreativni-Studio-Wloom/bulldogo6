# Jak zkontrolovat konfiguraci reCAPTCHA pro Firebase Phone Authentication

## Kontrola v Firebase Console

### 1. Otevřete Firebase Console
- Jděte na: https://console.firebase.google.com/
- Přihlaste se a vyberte projekt **inzerio-inzerce**

### 2. Zkontrolujte Phone Authentication
1. V levém menu klikněte na **Authentication**
2. Klikněte na záložku **Sign-in method**
3. Najděte **Phone** v seznamu metod přihlášení
4. Klikněte na **Phone** (nebo ikonu tužky pro úpravu)

### 3. Ověřte nastavení Phone Authentication
- ✅ **Phone number sign-in** musí být **Enabled** (Zapnuto)
- ✅ **reCAPTCHA verification** by měla být automaticky nastavena Firebase
- Pokud vidíte možnost vybrat reCAPTCHA verzi:
  - Doporučeno: **reCAPTCHA v3** nebo **Invisible reCAPTCHA v2**

### 4. Zkontrolujte reCAPTCHA klíče (pokud jsou viditelné)
- Pokud vidíte pole **reCAPTCHA Site Key** a **reCAPTCHA Secret Key**:
  - Tyto klíče musí být správně nakonfigurované
  - Firebase obvykle spravuje tyto klíče automaticky

### 5. Ověřte Authorized Domains
1. V **Authentication** klikněte na **Settings**
2. Scrollujte k sekci **Authorized domains**
3. Zkontrolujte, že je přidán:
   - ✅ `localhost` (pro lokální vývoj)
   - ✅ Vaše produkční doména (pokud ji máte)

### 6. Zkontrolujte Project Settings
1. Klikněte na ikonu ⚙️ (Settings) → **Project settings**
2. V záložce **General** zkontrolujte:
   - **Project ID**: `inzerio-inzerce`
   - **Project number**: `262039290071`
3. V sekci **Your apps** najděte webovou aplikaci:
   - **App ID**: `1:262039290071:web:30af0eb1c65cd75e307092`
   - Zkontrolujte, že API klíč odpovídá

## Kontrola v Google Cloud Console

### 1. Otevřete Google Cloud Console
- Jděte na: https://console.cloud.google.com/
- Přihlaste se a vyberte projekt **inzerio-inzerce**

### 2. Zkontrolujte povolená API
1. V levém menu klikněte na **APIs & Services** → **Enabled APIs**
2. Ujistěte se, že jsou povolená tato API:
   - ✅ **Identity Toolkit API** (pro Firebase Authentication)
   - ✅ **Firebase Installations API**
   - ✅ **Firebase Cloud Messaging API** (pokud používáte)

### 3. Zkontrolujte API klíče
1. Jděte na **APIs & Services** → **Credentials**
2. Najděte API klíč: `AIzaSyA1FEmsY458LLKQLGcUaOVXsYr3Ii55QeQ`
3. Klikněte na něj a zkontrolujte:
   - ✅ **Application restrictions**: Mělo by být nastaveno na **None** nebo **HTTP referrers**
   - ✅ **API restrictions**: Mělo by být nastaveno na **Don't restrict key** nebo povolená API z výše

### 4. Ověřte reCAPTCHA domény
1. V Google Cloud Console jděte na **Security** → **reCAPTCHA**
2. Zkontrolujte, že doména `localhost` je v seznamu autorizovaných domén
3. Pokud používáte vlastní reCAPTCHA klíče, zkontrolujte jejich konfiguraci

## Rychlý test v aplikaci

### Otevřete konzoli prohlížeče
1. Otevřete vaši aplikaci v prohlížeči
2. Otevřete Developer Tools (F12 nebo Cmd+Option+I)
3. Jděte na záložku **Console**
4. Zkuste registraci s telefonním číslem
5. Sledujte logy:
   - ✅ `✅ reCAPTCHA render dokončen`
   - ✅ `✅ reCAPTCHA verify dokončeno`
   - ❌ Pokud vidíte `auth/invalid-app-credential`, reCAPTCHA není správně nakonfigurovaná

## Časté problémy a řešení

### Problém: `auth/invalid-app-credential`
**Možné příčiny:**
1. Phone Authentication není povoleno v Firebase Console
2. reCAPTCHA není správně nakonfigurovaná
3. API klíč nemá oprávnění pro telefonní autentifikaci
4. Doména `localhost` není v Authorized domains

**Řešení:**
1. Povolte Phone Authentication v Firebase Console
2. Zkontrolujte, že Identity Toolkit API je povoleno v Google Cloud Console
3. Přidejte `localhost` do Authorized domains
4. Zkuste vytvořit novou webovou aplikaci v Firebase Console a použít novou konfiguraci

### Problém: reCAPTCHA se nenačte
**Možné příčiny:**
1. Blokování reCAPTCHA v prohlížeči (adblock)
2. Problémy s připojením k Google službám
3. Nesprávná konfigurace reCAPTCHA verifieru

**Řešení:**
1. Zkuste vypnout adblock
2. Zkontrolujte síťové připojení
3. Zkuste použít jiný prohlížeč

### Problém: reCAPTCHA se načte, ale SMS se nepošle
**Možné příčiny:**
1. `auth/invalid-app-credential` - reCAPTCHA není správně propojená s Firebase
2. Problémy s Firebase projektem
3. Neplatné telefonní číslo

**Řešení:**
1. Zkontrolujte konfiguraci v Firebase Console (viz výše)
2. Zkuste použít testovací telefonní číslo: `+420 123 456 789` (pokud je v testovacím režimu)
3. Zkontrolujte Firebase projekt v Console

## Kontrolní seznam

Před testováním registrace zkontrolujte:

- [ ] Firebase Console → Authentication → Sign-in method → Phone → **Enabled**
- [ ] Firebase Console → Authentication → Settings → Authorized domains → obsahuje **localhost**
- [ ] Google Cloud Console → APIs & Services → Enabled APIs → **Identity Toolkit API** je povoleno
- [ ] Google Cloud Console → APIs & Services → Credentials → API klíč má správná oprávnění
- [ ] Firebase Console → Project Settings → General → API klíč odpovídá konfiguraci v kódu
- [ ] Webová aplikace s App ID `1:262039290071:web:30af0eb1c65cd75e307092` existuje

## Testovací režim

Firebase Phone Authentication má testovací režim pro vývoj:
1. Firebase Console → Authentication → Sign-in method → Phone
2. V sekci **Testing** můžete přidat testovací telefonní čísla
3. Pro testovací čísla není potřeba skutečná SMS

---
*Tento dokument pomáhá diagnostikovat problémy s reCAPTCHA konfigurací pro Firebase Phone Authentication.*

