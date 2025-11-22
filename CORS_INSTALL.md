# Rychlá instalace a nastavení CORS

## KROK 1: Instalace Google Cloud SDK

Spusť v terminálu:

```bash
brew install google-cloud-sdk
```

Po instalaci obnov terminál nebo spusť:
```bash
source ~/.zshrc
```

## KROK 2: Přihlášení a nastavení projektu

```bash
gcloud auth login
gcloud config set project inzerio-inzerce
```

## KROK 3: Nastavení CORS

**Možnost A: Použij automatický skript (doporučeno)**
```bash
cd /Users/adam/Desktop/abulldogo3
./setup-cors.sh
```

**Možnost B: Ruční příkazy**
```bash
cd /Users/adam/Desktop/abulldogo3
gsutil cors set cors.json gs://inzerio-inzerce.appspot.com
```

## KROK 4: Ověření

```bash
gsutil cors get gs://inzerio-inzerce.appspot.com
```

Mělo by zobrazit obsah z `cors.json`.

## Po nastavení

1. Obnov stránku v prohlížeči (Ctrl+Shift+R pro hard refresh)
2. Zkus znovu nahrát inzerát
3. Chyba 404 by měla zmizet

---

**Problém?** Pokud `gsutil cors get` vrátí prázdný výsledek nebo chybu, zkus:
```bash
gsutil cors set cors.json gs://inzerio-inzerce.appspot.com
```

Znovu zkontroluj:
```bash
gsutil cors get gs://inzerio-inzerce.appspot.com
```
