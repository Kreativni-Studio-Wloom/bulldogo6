const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Node.js 18+ má fetch nativně, pro starší verze použijte node-fetch
// const fetch = require('node-fetch');

// GoPay konfigurace
const GOPAY_CONFIG = {
    isTest: true, // Pro produkci změň na false
    clientId: '1204015758', // Test ClientID
    clientSecret: '7WFS2HCS', // Test ClientSecret
    goId: '8419533331' // Test GoID
};

const GOPAY_BASE_URL = GOPAY_CONFIG.isTest
    ? 'https://gw.sandbox.gopay.com/api'
    : 'https://gate.gopay.cz/api';

// Cache pro tokeny
const tokenCache = new Map();

/**
 * Získání OAuth tokenu
 */
async function getGoPayToken(scope = 'payment-all') {
    const cacheKey = scope;
    const cached = tokenCache.get(cacheKey);
    
    // Zkontrolovat cache (token má životnost 30 minut)
    if (cached && cached.expiry > Date.now()) {
        return cached.token;
    }

    const url = `${GOPAY_BASE_URL}/oauth2/token`;
    const credentials = Buffer.from(`${GOPAY_CONFIG.clientId}:${GOPAY_CONFIG.clientSecret}`).toString('base64');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            scope: scope
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoPay OAuth error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Uložit do cache (expiruje za 30 minut, uložíme s 5min rezervou)
    const expiresIn = (data.expires_in || 1800) - 300; // 30 min - 5 min rezerva
    tokenCache.set(cacheKey, {
        token: data.access_token,
        expiry: Date.now() + expiresIn * 1000
    });

    return data.access_token;
}

/**
 * Cloud Function: GoPay OAuth Token
 * GET /gopayToken?scope=payment-create
 */
exports.gopayToken = functions.https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const scope = req.query.scope || 'payment-all';
        const token = await getGoPayToken(scope);
        
        res.json({
            access_token: token,
            token_type: 'Bearer'
        });
    } catch (error) {
        console.error('Error getting GoPay token:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

/**
 * Cloud Function: Vytvoření GoPay platby
 * POST /gopayCreatePayment
 */
exports.gopayCreatePayment = functions.https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const paymentData = req.body;
        
        // Validace
        if (!paymentData.amount || !paymentData.currency) {
            res.status(400).json({
                error: 'Missing required fields: amount, currency'
            });
            return;
        }

        // Získat token
        const token = await getGoPayToken('payment-create');
        
        // Vytvořit platbu
        const url = `${GOPAY_BASE_URL}/payments/payment`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GoPay create payment error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error creating GoPay payment:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

/**
 * Cloud Function: Dotaz na stav GoPay platby
 * GET /gopayPaymentStatus?id={paymentId}
 */
exports.gopayPaymentStatus = functions.https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const paymentId = req.query.id;
        
        if (!paymentId) {
            res.status(400).json({
                error: 'Missing payment ID'
            });
            return;
        }

        // Získat token
        const token = await getGoPayToken('payment-all');
        
        // Dotaz na stav
        const url = `${GOPAY_BASE_URL}/payments/payment/${paymentId}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GoPay get payment status error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error getting GoPay payment status:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

