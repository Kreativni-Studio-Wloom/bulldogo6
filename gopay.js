// GoPay API Wrapper
// Dokumentace: https://doc.gopay.cz/

class GoPayAPI {
    constructor(config) {
        // Testovací prostředí
        this.isTest = config.isTest !== false; // defaultně true
        this.baseURL = this.isTest 
            ? 'https://gw.sandbox.gopay.com/api'
            : 'https://gate.gopay.cz/api';
        
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.goId = config.goId;
        
        // Cache pro token
        this.tokenCache = null;
        this.tokenExpiry = null;
    }

    /**
     * Získání OAuth tokenu pro autentizaci API požadavků
     * @param {string} scope - 'payment-create' nebo 'payment-all'
     * @returns {Promise<string>} Access token
     */
    async getAccessToken(scope = 'payment-all') {
        // Zkontrolovat cache
        if (this.tokenCache && this.tokenExpiry && new Date() < this.tokenExpiry) {
            console.log('✅ Používám cached token');
            return this.tokenCache;
        }

        try {
            const url = `${this.baseURL}/oauth2/token`;
            const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
            
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
            
            // Uložit token do cache (expiruje za 30 minut, uložíme s 5min rezervou)
            this.tokenCache = data.access_token;
            const expiresIn = (data.expires_in || 1800) - 300; // 30 min - 5 min rezerva
            this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
            
            console.log('✅ GoPay token získán:', {
                expiresIn: expiresIn,
                expiry: this.tokenExpiry
            });
            
            return this.tokenCache;
        } catch (error) {
            console.error('❌ Chyba při získávání GoPay tokenu:', error);
            throw error;
        }
    }

    /**
     * Vytvoření platby
     * @param {Object} paymentData - Data pro platbu
     * @returns {Promise<Object>} Odpověď s informacemi o platbě (včetně gw_url)
     */
    async createPayment(paymentData) {
        try {
            const token = await this.getAccessToken('payment-create');
            const url = `${this.baseURL}/payments/payment`;

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
            console.log('✅ GoPay platba vytvořena:', {
                id: data.id,
                state: data.state,
                gw_url: data.gw_url
            });
            
            return data;
        } catch (error) {
            console.error('❌ Chyba při vytváření GoPay platby:', error);
            throw error;
        }
    }

    /**
     * Dotaz na stav platby
     * @param {number|string} paymentId - ID platby
     * @returns {Promise<Object>} Informace o platbě včetně stavu
     */
    async getPaymentStatus(paymentId) {
        try {
            const token = await this.getAccessToken('payment-all');
            const url = `${this.baseURL}/payments/payment/${paymentId}`;

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
            console.log('✅ GoPay stav platby:', {
                id: data.id,
                state: data.state
            });
            
            return data;
        } catch (error) {
            console.error('❌ Chyba při dotazu na stav GoPay platby:', error);
            throw error;
        }
    }

    /**
     * Refundace platby
     * @param {number|string} paymentId - ID platby
     * @param {number} amount - Částka k refundaci (v haléřích, volitelné - pro plnou refundaci)
     * @returns {Promise<Object>} Informace o refundaci
     */
    async refundPayment(paymentId, amount = null) {
        try {
            const token = await this.getAccessToken('payment-all');
            const url = `${this.baseURL}/payments/payment/${paymentId}/refund`;

            const refundData = {};
            if (amount !== null) {
                refundData.amount = amount;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(refundData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`GoPay refund error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ GoPay refundace provedena:', data);
            
            return data;
        } catch (error) {
            console.error('❌ Chyba při refundaci GoPay platby:', error);
            throw error;
        }
    }
}

// Export pro použití v jiných souborech
window.GoPayAPI = GoPayAPI;

