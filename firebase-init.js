// Centralizovaná inicializace Firebase pro celý frontend
// Načítá oficiální SDK moduly z gstatic a publikuje app/auth/db na window

console.log('🔥 firebase-init.js: Začínám načítat Firebase...');

// Pro localhost úplně vypínáme App Check - neaktivujeme debug token, protože API není povoleno
// App Check není potřeba pro lokální vývoj

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, initializeFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';
// App Check importujeme dynamicky pouze pro produkci

console.log('✅ Firebase moduly načteny');

// Firebase konfigurace (sjednocená)
const firebaseConfig = {
    apiKey: "AIzaSyA1FEmsY458LLKQLGcUaOVXsYr3Ii55QeQ",
    authDomain: "inzerio-inzerce.firebaseapp.com",
    projectId: "inzerio-inzerce",
    storageBucket: "inzerio-inzerce.appspot.com",
    messagingSenderId: "262039290071",
    appId: "1:262039290071:web:30af0eb1c65cd75e307092",
    measurementId: "G-7VD0ZE08M3"
};

try {
    // Zajistit, že inicializujeme jen jednou na stránce
    let app;
    if (getApps().length) {
        app = getApps()[0];
        console.log('✅ Použil jsem existující Firebase app');
    } else {
        app = initializeApp(firebaseConfig);
        console.log('✅ Vytvořil jsem novou Firebase app');
    }

    const auth = getAuth(app);
    console.log('✅ Firebase Auth inicializován');

    let db;
    try {
        // Stabilnější v prohlížečích a lokálním vývoji
        db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true, useFetchStreams: false });
        console.log('✅ Firebase Firestore inicializován s experimentalAutoDetectLongPolling');
    } catch (err) {
        console.warn('⚠️ Experimental Firestore inicializace selhala, používám standardní:', err);
        db = getFirestore(app);
        console.log('✅ Firebase Firestore inicializován standardně');
    }

    // App Check (pomáhá s chybou auth/invalid-app-credential, pokud je v projektu vynucený)
    // Pro localhost používáme debug token, pokud je App Check vynucený v projektu
    if (typeof window !== 'undefined' && window.location) {
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        
        if (isLocalhost) {
            // Pro localhost úplně vypínáme App Check - API není povoleno v projektu
            // App Check není potřeba pro lokální vývoj
            console.log('⚠️ App Check vypnut pro localhost (lokální vývoj)');
        } else {
            // Pro produkci dynamicky importujeme a inicializujeme App Check
            const siteKey = window.FIREBASE_RECAPTCHA_V3_SITE_KEY || '';
            if (siteKey) {
                import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js')
                    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
                        const appCheck = initializeAppCheck(app, {
                            provider: new ReCaptchaV3Provider(siteKey),
                            isTokenAutoRefreshEnabled: true,
                        });
                        window.firebaseAppCheck = appCheck;
                        console.log('✅ Firebase App Check inicializován (produkce)');
                    })
                    .catch((err) => {
                        console.warn('⚠️ App Check není k dispozici nebo selhala inicializace:', err);
                    });
            } else {
                console.warn('⚠️ App Check není nakonfigurován. Pro produkci nastavte window.FIREBASE_RECAPTCHA_V3_SITE_KEY.');
            }
        }
    }

    // Analytics (bezpečně; v některých prostředích nemusí být k dispozici)
    let analytics;
    try { 
        analytics = getAnalytics(app);
        console.log('✅ Firebase Analytics inicializován');
    } catch (err) {
        console.warn('⚠️ Analytics není k dispozici:', err);
    }

    // Publikovat globálně pro stávající kód
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    if (analytics) window.firebaseAnalytics = analytics;

    // Signalizovat, že Firebase je připraven
    window.firebaseReady = true;

    // Vyslat event, že Firebase je připraven (pro event-driven přístup)
    if (typeof window.dispatchEvent !== 'undefined') {
        window.dispatchEvent(new Event('firebaseReady'));
        console.log('📢 Event firebaseReady vyslán');
    }

    console.log('✅ Firebase inicializován a připraven:', { 
        app: !!app, 
        auth: !!auth, 
        db: !!db,
        ready: !!window.firebaseReady
    });
} catch (error) {
    console.error('❌ Kritická chyba při inicializaci Firebase:', error);
    console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
    });
    window.firebaseError = error;
    window.firebaseReady = false;
    
    // Vyslat error event
    if (typeof window.dispatchEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
    }
}

