// Vercel Serverless Function - GoPay OAuth Token Proxy
// GET /api/gopay-token?scope=payment-create

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

// Cache pro tokeny (v paměti - resetuje se při restartu)
const tokenCache = new Map();

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
        const scope = req.query.scope || 'payment-all';
        const token = await getGoPayToken(scope);
        
        res.status(200).json({
            access_token: token,
            token_type: 'Bearer'
        });
    } catch (error) {
        console.error('Error getting GoPay token:', error);
        res.status(500).json({
            error: error.message
        });
    }
}

