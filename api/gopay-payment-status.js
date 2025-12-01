// Vercel Serverless Function - GoPay Payment Status Proxy
// GET /api/gopay-payment-status?id={paymentId}

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

async function getGoPayToken(scope = 'payment-all') {
    const cacheKey = scope;
    const cached = tokenCache.get(cacheKey);
    
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
    const expiresIn = (data.expires_in || 1800) - 300;
    tokenCache.set(cacheKey, {
        token: data.access_token,
        expiry: Date.now() + expiresIn * 1000
    });

    return data.access_token;
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
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
        res.status(200).json(data);
    } catch (error) {
        console.error('Error getting GoPay payment status:', error);
        res.status(500).json({
            error: error.message
        });
    }
}

