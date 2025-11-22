#!/bin/bash

# Skript pro nastavení CORS na Firebase Storage bucket
# Vyžaduje Google Cloud SDK

echo "🔧 Nastavuji CORS pro Firebase Storage bucket..."

# Zkontroluj, zda je gsutil dostupné
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil není nainstalované"
    echo ""
    echo "Instalace Google Cloud SDK:"
    echo "1. macOS: brew install google-cloud-sdk"
    echo "2. Nebo stáhni z: https://cloud.google.com/sdk/docs/install"
    echo ""
    exit 1
fi

# Zkontroluj, zda je cors.json dostupný
if [ ! -f "cors.json" ]; then
    echo "❌ Soubor cors.json nenalezen!"
    exit 1
fi

echo "✅ gsutil nalezeno"
echo "📁 Bucket: gs://inzerio-inzerce.firebasestorage.app"
echo ""

# Přihlášení (pokud není)
echo "🔐 Kontrola přihlášení..."
gcloud auth list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Musíš se přihlásit:"
    gcloud auth login
fi

# Nastavení projektu
echo "📦 Nastavuji projekt..."
gcloud config set project inzerio-inzerce

# Kontrola současných CORS
echo "🔍 Kontrola současných CORS pravidel..."
gsutil cors get gs://inzerio-inzerce.firebasestorage.app

# Nastavení nových CORS
echo ""
echo "⚙️  Nastavuji nová CORS pravidla..."
gsutil cors set cors.json gs://inzerio-inzerce.firebasestorage.app

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CORS pravidla úspěšně nastavena!"
    echo ""
    echo "🔍 Ověření..."
    gsutil cors get gs://inzerio-inzerce.firebasestorage.app
else
    echo ""
    echo "❌ Chyba při nastavování CORS pravidel"
    exit 1
fi
