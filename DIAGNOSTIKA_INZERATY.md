# Diagnostika problému s načítáním inzerátů

## Problém
Inzeráty se nenačítají z Firestore databáze. V konzoli se zobrazuje:
- `permission-denied` chyba
- CORS chyba na `firestore.googleapis.com`

## Možné příčiny

### 1. Firestore pravidla nejsou publikována
**Příznaky:**
- `permission-denied` chyba
- Ani jednoduchý dotaz na `users` kolekci nefunguje

**Řešení:**
1. Otevři Firebase Console: https://console.firebase.google.com/
2. Vyber projekt **inzerio-inzerce**
3. Jdi na **Firestore Database** → **Rules**
4. Zkopíruj obsah z `firestore-rules.txt`
5. Vlož do editoru a klikni **Publish**
6. Počkej 1-2 minuty
7. Obnov stránku

### 2. App Check blokuje požadavky
**Příznaky:**
- CORS chyba na `firestore.googleapis.com`
- `permission-denied` i když jsou pravidla správně nastavena

**Řešení:**
1. Firebase Console → **App Check**
2. Najdi webovou aplikaci s App ID: `1:262039290071:web:30af0eb1c65cd75e307092`
3. Vypni **"Enforce App Check"** pro tuto aplikaci
4. Nebo povol Firebase App Check API: https://console.developers.google.com/apis/api/firebaseappcheck.googleapis.com/overview?project=262039290071

### 3. CollectionGroup dotaz potřebuje index
**Příznaky:**
- Chyba o chybějícím indexu (ne `permission-denied`)

**Řešení:**
- Firebase automaticky nabídne vytvoření indexu - klikni na odkaz v chybě

### 4. Data neexistují v databázi
**Příznaky:**
- Dotaz funguje, ale vrací 0 dokumentů

**Řešení:**
1. Firebase Console → **Firestore Database** → **Data**
2. Zkontroluj, zda existují dokumenty v `users/{uid}/inzeraty/`
3. Pokud ne, vytvoř testovací inzerát přes aplikaci

## Diagnostické kroky

### Krok 1: Zkontroluj základní přístup
V konzoli prohlížeče bys měl vidět:
```
🔍 DIAGNOSTIKA: Testuji základní přístup k Firestore...
✅ Test přístupu k users kolekci úspěšný!
```

Pokud vidíš `permission-denied` → Pravidla nejsou publikována

### Krok 2: Zkontroluj collectionGroup dotaz
V konzoli bys měl vidět:
```
🔍 Testuji collectionGroup dotaz na inzeráty...
✅ Test collectionGroup dotaz úspěšný! Počet inzerátů: X
```

Pokud vidíš `permission-denied` → Pravidla nejsou publikována nebo App Check blokuje

### Krok 3: Alternativní metoda
Pokud collectionGroup nefunguje, aplikace zkusí alternativní metodu:
```
🔄 Alternativní metoda: Načítám inzeráty přes users kolekci...
```

## Co jsem opravil v kódu

1. **Přidal diagnostiku** - testuje základní přístup k Firestore před collectionGroup dotazem
2. **Přidal alternativní metodu** - pokud collectionGroup nefunguje, načte inzeráty přes users kolekci
3. **Lepší error handling** - zobrazuje konkrétní chyby a řešení

## Kontrolní seznam

- [ ] Firestore pravidla jsou publikována v Firebase Console
- [ ] App Check není vynucený (nebo je API povoleno)
- [ ] V databázi existují dokumenty v `users/{uid}/inzeraty/`
- [ ] Po publikování pravidel uplynulo alespoň 1-2 minuty
- [ ] Stránka byla obnovena po publikování pravidel

