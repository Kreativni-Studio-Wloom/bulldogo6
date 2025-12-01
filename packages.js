// Packages functionality
let selectedPlan = null;
let gopayAPI = null;
let currentPaymentId = null;

// GoPay konfigurace
const GOPAY_CONFIG = {
    isTest: true, // Pro produkci změň na false
    clientId: '1204015758', // Test ClientID
    clientSecret: '7WFS2HCS', // Test ClientSecret
    goId: '8419533331' // Test GoID
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePackages();
    initializeAuthState();
    initializeGoPay();
    
    // Zpracování návratu z GoPay platební brány
    handleGoPayReturn();
    
    // Po načtení stránky vyčkej na Firebase a načti stav balíčku
    (function waitAndLoadPlan(){
        if (window.firebaseAuth && window.firebaseDb) {
            loadCurrentPlan();
        } else {
            setTimeout(waitAndLoadPlan, 100);
        }
    })();
});

// Inicializace GoPay API
function initializeGoPay() {
    if (typeof GoPayAPI === 'undefined') {
        console.error('❌ GoPayAPI není k dispozici. Zkontroluj, zda je gopay.js načten.');
        return;
    }
    
    gopayAPI = new GoPayAPI(GOPAY_CONFIG);
    console.log('✅ GoPay API inicializováno:', {
        isTest: GOPAY_CONFIG.isTest,
        baseURL: gopayAPI.baseURL,
        clientId: GOPAY_CONFIG.clientId ? 'nastaveno' : 'chybí'
    });
    
    // Kontrola GoPay SDK
    if (typeof _gopay === 'undefined') {
        console.warn('⚠️ GoPay JavaScript SDK (_gopay) není načteno. Použije se redirect varianta.');
    } else {
        console.log('✅ GoPay JavaScript SDK je k dispozici');
    }
}

function initializePackages() {
    console.log('🚀 Initializing packages');
    
    // Add event listeners to pricing buttons
    document.querySelectorAll('.btn-pricing').forEach(button => {
        button.addEventListener('click', function() {
            const plan = this.getAttribute('data-plan');
            const price = this.getAttribute('data-price');
            selectPlan(plan, price);
        });
    });
}

function selectPlan(plan, price) {
    selectedPlan = {
        plan: plan,
        price: parseInt(price)
    };

    console.log('📦 Selected plan:', plan, 'Price:', price);

    // Show payment section
    showPayment();
}

function showPayment() {
    document.getElementById('paymentSection').style.display = 'block';
    document.querySelector('.top-ads-pricing').style.display = 'none';
    
    // Update payment summary
    updatePaymentSummary();
    
    // Scroll to payment
    document.getElementById('paymentSection').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function hidePayment() {
    document.getElementById('paymentSection').style.display = 'none';
    document.querySelector('.top-ads-pricing').style.display = 'block';
    
    // Scroll to pricing
    document.querySelector('.top-ads-pricing').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function updatePaymentSummary() {
    if (!selectedPlan) return;
    
    let planTitle = '';
    let planType = '';
    
    switch(selectedPlan.plan) {
        case 'hobby':
            planTitle = 'Hobby uživatel';
            planType = 'První měsíc zdarma, poté 39 Kč/měsíc';
            break;
        case 'business':
            planTitle = 'Firma';
            planType = 'Měsíční předplatné';
            break;
    }
    
    document.getElementById('selectedPlanTitle').textContent = planTitle;
    document.getElementById('selectedPlanType').textContent = planType;
    
    if (selectedPlan.price === 0) {
        document.getElementById('totalPrice').textContent = 'První měsíc zdarma';
    } else {
        document.getElementById('totalPrice').textContent = selectedPlan.price + ' Kč/měsíc';
    }
}

async function processPayment() {
    // Kontrola přihlášení
    const user = window.firebaseAuth && window.firebaseAuth.currentUser;
    if (!user) {
        alert('Pro dokončení platby se prosím přihlaste.');
        showAuthModal('login');
        return;
    }

    if (!selectedPlan) {
        alert('Prosím vyberte balíček.');
        return;
    }

    // Show loading state
    const payButton = document.querySelector('.payment-actions .btn-primary');
    const originalText = payButton.innerHTML;
    payButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Zpracovávám...';
    payButton.disabled = true;

    try {
        // Kontrola GoPay API
        if (!gopayAPI) {
            initializeGoPay();
            if (!gopayAPI) {
                throw new Error('GoPay API není k dispozici. Zkontroluj, zda je gopay.js načten.');
            }
        }

        // Kontrola GoPay SDK
        console.log('🔍 Kontroluji GoPay SDK:', {
            _gopay: typeof _gopay,
            checkout: typeof _gopay !== 'undefined' ? typeof _gopay.checkout : 'N/A'
        });

        // Příprava dat pro platbu
        const amount = selectedPlan.price * 100; // převod na haléře
        const currency = 'CZK';
        const orderNumber = `PKG-${Date.now()}-${user.uid.substring(0, 8)}`;
        
        // URL pro návrat a notifikace
        const baseURL = window.location.origin;
        const returnURL = `${baseURL}/packages.html?payment_return=true`;
        const notificationURL = `${baseURL}/gopay-notification.html`;

        // Popis balíčku
        const planName = selectedPlan.plan === 'hobby' ? 'Hobby uživatel' : 'Firma';
        const planDescription = selectedPlan.plan === 'hobby' 
            ? 'První měsíc zdarma, poté 39 Kč/měsíc'
            : 'Měsíční předplatné';

        // Vytvoření platby přes GoPay API
        const paymentData = {
            payer: {
                default_payment_instrument: 'PAYMENT_CARD',
                allowed_payment_instruments: ['PAYMENT_CARD', 'BANK_ACCOUNT'],
                contact: {
                    email: user.email || '',
                    first_name: user.displayName?.split(' ')[0] || '',
                    last_name: user.displayName?.split(' ').slice(1).join(' ') || ''
                }
            },
            amount: amount,
            currency: currency,
            order_number: orderNumber,
            order_description: `${planName} - ${planDescription}`,
            items: [
                {
                    name: planName,
                    amount: amount,
                    count: 1
                }
            ],
            callback: {
                return_url: returnURL,
                notification_url: notificationURL
            },
            lang: 'cs'
        };

        console.log('💳 Vytvářím GoPay platbu:', {
            amount: amount,
            currency: currency,
            orderNumber: orderNumber,
            returnURL: returnURL,
            notificationURL: notificationURL
        });

        // Vytvoření platby
        let payment;
        try {
            payment = await gopayAPI.createPayment(paymentData);
            console.log('✅ Platba vytvořena:', {
                id: payment.id,
                state: payment.state,
                gw_url: payment.gw_url
            });
        } catch (apiError) {
            console.error('❌ Chyba při vytváření platby přes GoPay API:', apiError);
            
            // Detailnější error message
            let errorMessage = 'Nepodařilo se vytvořit platbu. ';
            if (apiError.message.includes('CORS') || apiError.message.includes('Failed to fetch')) {
                errorMessage += 'CORS chyba - GoPay API může vyžadovat server-side proxy. ';
                errorMessage += 'Zkuste použít redirect variantu nebo nasadit backend endpoint.';
            } else if (apiError.message.includes('401') || apiError.message.includes('403')) {
                errorMessage += 'Chyba autentizace - zkontrolujte ClientID a ClientSecret.';
            } else {
                errorMessage += apiError.message;
            }
            
            throw new Error(errorMessage);
        }
        
        // Uložení informací o platbě do Firestore
        try {
            await savePaymentToFirestore(user.uid, payment.id, selectedPlan, orderNumber);
        } catch (firestoreError) {
            console.warn('⚠️ Nepodařilo se uložit platbu do Firestore:', firestoreError);
            // Pokračujeme i když se nepodařilo uložit do Firestore
        }

        currentPaymentId = payment.id;
        console.log('✅ Platba připravena, ID:', payment.id);

        // Zobrazení GoPay platební brány
        if (typeof _gopay !== 'undefined' && _gopay && typeof _gopay.checkout === 'function') {
            // Inline varianta (pokud je SSL)
            const isHTTPS = window.location.protocol === 'https:';
            
            console.log('🚀 Otevírám GoPay platební bránu (inline:', isHTTPS, ')');
            
            try {
                _gopay.checkout({
                    gatewayUrl: payment.gw_url,
                    inline: isHTTPS
                }, async (checkoutResult) => {
                    // Callback po dokončení platby (pouze pro inline, pokud nedojde k redirectu)
                    console.log('🔄 GoPay checkout callback:', checkoutResult);
                    if (checkoutResult && checkoutResult.id) {
                        await handlePaymentResult(checkoutResult.id, checkoutResult.state);
                    }
                });
            } catch (checkoutError) {
                console.error('❌ Chyba při otevírání GoPay checkout:', checkoutError);
                // Fallback: redirect
                console.log('🔄 Používám redirect jako fallback');
                window.location.href = payment.gw_url;
            }
        } else {
            // Fallback: redirect na platební bránu
            console.warn('⚠️ GoPay JavaScript SDK není načteno, používám redirect');
            console.log('🔗 Přesměrovávám na:', payment.gw_url);
            window.location.href = payment.gw_url;
        }

    } catch (error) {
        console.error('❌ Chyba při zpracování platby:', error);
        console.error('❌ Error stack:', error.stack);
        
        // Detailnější error message pro uživatele
        let userMessage = 'Nastala chyba při vytváření platby.';
        if (error.message) {
            userMessage += '\n\n' + error.message;
        }
        userMessage += '\n\nZkuste to prosím znovu nebo kontaktujte podporu.';
        
        alert(userMessage);
        payButton.innerHTML = originalText;
        payButton.disabled = false;
    }
}

// Uložení informací o platbě do Firestore
async function savePaymentToFirestore(userId, paymentId, plan, orderNumber) {
    try {
        if (!window.firebaseDb) {
            throw new Error('Firestore není k dispozici');
        }

        const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const paymentRef = doc(window.firebaseDb, 'payments', paymentId);

        await setDoc(paymentRef, {
            userId: userId,
            paymentId: paymentId,
            orderNumber: orderNumber,
            plan: plan.plan,
            amount: plan.price,
            currency: 'CZK',
            status: 'CREATED',
            createdAt: new Date(),
            updatedAt: new Date()
        }, { merge: true });

        console.log('✅ Informace o platbě uloženy do Firestore:', paymentId);
    } catch (error) {
        console.error('❌ Chyba při ukládání platby do Firestore:', error);
        // Nevyhazujeme chybu, pokračujeme s platbou
    }
}

// Aktualizace stavu platby v Firestore
async function updatePaymentStatus(paymentId, status, paymentData = null) {
    try {
        if (!window.firebaseDb) return;

        const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const paymentRef = doc(window.firebaseDb, 'payments', paymentId);

        const updateData = {
            status: status,
            updatedAt: new Date()
        };

        if (paymentData) {
            updateData.state = paymentData.state;
            updateData.payer = paymentData.payer;
            if (paymentData.payment_instrument) {
                updateData.paymentInstrument = paymentData.payment_instrument;
            }
        }

        await updateDoc(paymentRef, updateData);
        console.log('✅ Stav platby aktualizován:', paymentId, status);
    } catch (error) {
        console.error('❌ Chyba při aktualizaci stavu platby:', error);
    }
}

// Zpracování výsledku platby
async function handlePaymentResult(paymentId, state) {
    try {
        if (!gopayAPI) {
            initializeGoPay();
        }

        // Dotaz na aktuální stav platby
        const paymentData = await gopayAPI.getPaymentStatus(paymentId);
        
        // Aktualizace stavu v Firestore
        await updatePaymentStatus(paymentId, paymentData.state, paymentData);

        // Zpracování podle stavu
        if (paymentData.state === 'PAID') {
            // Platba úspěšná - aktivovat balíček
            await activatePlanFromPayment(paymentId, paymentData);
            showSuccess();
        } else if (paymentData.state === 'CANCELED') {
            alert('Platba byla zrušena.');
            hidePayment();
        } else if (paymentData.state === 'TIMEOUTED') {
            alert('Platba vypršela. Zkuste to prosím znovu.');
            hidePayment();
        } else {
            console.log('ℹ️ Platba ve stavu:', paymentData.state);
            // Jiné stavy (CREATED, PAYMENT_METHOD_CHOSEN, atd.) - čekáme na notifikaci
        }
    } catch (error) {
        console.error('❌ Chyba při zpracování výsledku platby:', error);
        alert('Nastala chyba při ověřování platby. Zkontrolujte prosím stav objednávky.');
    }
}

// Aktivace balíčku po úspěšné platbě
async function activatePlanFromPayment(paymentId, paymentData) {
    try {
        if (!window.firebaseDb) return;

        // Načíst informace o platbě z Firestore
        const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const paymentRef = doc(window.firebaseDb, 'payments', paymentId);
        const paymentSnap = await getDoc(paymentRef);

        if (!paymentSnap.exists()) {
            console.error('❌ Platba nenalezena v Firestore:', paymentId);
            return;
        }

        const paymentInfo = paymentSnap.data();
        const userId = paymentInfo.userId;
        const plan = paymentInfo.plan;

        if (!userId || !plan) {
            console.error('❌ Chybí userId nebo plan v platbě:', paymentInfo);
            return;
        }

        // Aktivovat balíček
        const now = new Date();
        const durationDays = 30; // měsíční předplatné
        const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const { setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await setDoc(
            doc(window.firebaseDb, 'users', userId, 'profile', 'profile'),
            {
                plan: plan,
                planUpdatedAt: now,
                planPeriodStart: now,
                planPeriodEnd: periodEnd,
                planDurationDays: durationDays,
                planCancelAt: null
            },
            { merge: true }
        );

        // Označit platbu jako zpracovanou
        const { updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await updateDoc(paymentRef, {
            processed: true,
            planActivatedAt: now
        });

        console.log('✅ Balíček aktivován pro uživatele:', userId, plan);
    } catch (error) {
        console.error('❌ Chyba při aktivaci balíčku:', error);
        throw error;
    }
}

// Zpracování návratu z GoPay platební brány
function handleGoPayReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentReturn = urlParams.get('payment_return');
    const paymentId = urlParams.get('id');

    if (paymentReturn === 'true' && paymentId) {
        console.log('🔄 Návrat z GoPay platební brány, ID platby:', paymentId);
        
        // Odstranit parametry z URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Zpracovat výsledek platby
        handlePaymentResult(paymentId);
    }
}

async function showSuccess() {
    document.getElementById('paymentSection').style.display = 'none';
    document.getElementById('successSection').style.display = 'block';
    
    // Scroll to success
    document.getElementById('successSection').scrollIntoView({ 
        behavior: 'smooth' 
    });

    // Zapsat plán do Firestore profilu uživatele (users/{uid}/profile/profile) - zdroj pravdy
    try {
        const user = window.firebaseAuth && window.firebaseAuth.currentUser;
        if (user && window.firebaseDb && selectedPlan && selectedPlan.plan) {
            const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const now = new Date();
            const durationDays = 30; // měsíční předplatné
            const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
            
            console.log('💾 Ukládám balíček do databáze:', selectedPlan.plan);
            await setDoc(
                doc(window.firebaseDb, 'users', user.uid, 'profile', 'profile'),
                { plan: selectedPlan.plan, planUpdatedAt: now, planPeriodStart: now, planPeriodEnd: periodEnd, planDurationDays: durationDays, planCancelAt: null },
                { merge: true }
            );
            console.log('✅ Balíček úspěšně uložen do databáze');
            
            // Volitelně synchronizovat do localStorage pouze pro zobrazení odznaku (cache)
            try {
                localStorage.setItem('bdg_plan', selectedPlan.plan);
            } catch (_) {}
        }
    } catch (e) {
        console.error('❌ Uložení plánu do Firestore selhalo:', e);
        showMessage('Nepodařilo se uložit balíček. Zkuste to prosím znovu.', 'error');
    }
}

function resetPackages() {
    // Reset all selections
    selectedPlan = null;
    
    // Hide all sections except pricing
    document.getElementById('paymentSection').style.display = 'none';
    document.getElementById('successSection').style.display = 'none';
    document.querySelector('.top-ads-pricing').style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Ruční aktualizace odznaku po aktivaci balíčku (pro případ, že UI neodchytí změnu okamžitě)
async function refreshBadge() {
    try {
        const user = window.firebaseAuth && window.firebaseAuth.currentUser;
        if (!user) { showAuthModal('login'); return; }
        if (!window.firebaseDb) return;
        
        // Kontrola balíčku přímo z databáze (použít globální funkci pokud existuje)
        let plan = null;
        if (typeof window.checkUserPlanFromDatabase === 'function') {
            plan = await window.checkUserPlanFromDatabase(user.uid);
        } else {
            // Fallback: načíst přímo z databáze
            const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const ref = doc(window.firebaseDb, 'users', user.uid, 'profile', 'profile');
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                plan = data.plan || null;
                // Kontrola, zda je balíček aktivní
                if (plan) {
                    const planPeriodEnd = data.planPeriodEnd ? (data.planPeriodEnd.toDate ? data.planPeriodEnd.toDate() : new Date(data.planPeriodEnd)) : null;
                    if (planPeriodEnd && new Date() >= planPeriodEnd) {
                        plan = null;
                    }
                }
            }
        }
        
        // Volitelně synchronizovat do localStorage pro cache (zobrazení odznaku)
        if (plan) {
            try { localStorage.setItem('bdg_plan', plan); } catch (_) {}
        } else {
            try { localStorage.removeItem('bdg_plan'); } catch (_) {}
        }
        
        // Vložit/aktualizovat odznak v tlačítku Profil
        const userProfileSection = document.getElementById('userProfileSection');
        const btnProfile = userProfileSection && userProfileSection.querySelector('.btn-profile');
        if (btnProfile) {
            const old = btnProfile.querySelector('.user-badge');
            if (old) old.remove();
            const badge = document.createElement('span');
            const label = plan === 'business' ? 'Firma' : plan === 'hobby' ? 'Hobby' : '?';
            const cls = plan === 'business' ? 'badge-business' : plan === 'hobby' ? 'badge-hobby' : 'badge-unknown';
            badge.className = 'user-badge ' + cls;
            badge.textContent = label;
            btnProfile.appendChild(badge);
        }
        // krátká zpráva
        alert('Odznak aktualizován' + (plan ? `: ${plan}` : ''));
    } catch (e) {
        console.error('❌ refreshBadge:', e);
        alert('Nepodařilo se aktualizovat odznak');
    }
}

// Načíst aktuální balíček a aktualizovat manage UI
async function loadCurrentPlan() {
    try {
        const user = window.firebaseAuth && window.firebaseAuth.currentUser;
        const pPlan = document.getElementById('currentPlan');
        const pEnd = document.getElementById('currentPlanEnd');
        const pCancel = document.getElementById('currentPlanCancelAt');
        const cancelInfo = document.getElementById('cancelInfo');
        const btnCancel = document.getElementById('btnCancelPlan');
        const btnUndo = document.getElementById('btnUndoCancel');
        if (!user || !window.firebaseDb || !pPlan) return;
        const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const ref = doc(window.firebaseDb, 'users', user.uid, 'profile', 'profile');
        const snap = await getDoc(ref);
        let plan = 'none', planPeriodEnd = null, planCancelAt = null;
        if (snap.exists()) {
            const data = snap.data();
            plan = data.plan || 'none';
            planPeriodEnd = data.planPeriodEnd ? (data.planPeriodEnd.toDate ? data.planPeriodEnd.toDate() : new Date(data.planPeriodEnd)) : null;
            planCancelAt = data.planCancelAt ? (data.planCancelAt.toDate ? data.planCancelAt.toDate() : new Date(data.planCancelAt)) : null;
        }
        const planLabel = plan === 'business' ? 'Firma' : plan === 'hobby' ? 'Hobby' : 'Žádný';
        pPlan.textContent = planLabel;
        pEnd.textContent = planPeriodEnd ? planPeriodEnd.toLocaleDateString('cs-CZ') : '-';
        if (planCancelAt) {
            cancelInfo.style.display = '';
            pCancel.textContent = planCancelAt.toLocaleDateString('cs-CZ');
            if (btnCancel) btnCancel.style.display = 'none';
            if (btnUndo) btnUndo.style.display = '';
        } else {
            cancelInfo.style.display = 'none';
            if (btnCancel) btnCancel.style.display = plan === 'none' ? 'none' : '';
            if (btnUndo) btnUndo.style.display = 'none';
        }
    } catch (e) {
        console.error('❌ loadCurrentPlan:', e);
    }
}

// Naplánovat zrušení k datu konce období
async function cancelPlan() {
    try {
        const user = window.firebaseAuth && window.firebaseAuth.currentUser;
        if (!user || !window.firebaseDb) return;
        const { getDoc, setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const ref = doc(window.firebaseDb, 'users', user.uid, 'profile', 'profile');
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        const end = data.planPeriodEnd ? (data.planPeriodEnd.toDate ? data.planPeriodEnd.toDate() : new Date(data.planPeriodEnd)) : null;
        if (!end) { alert('Nelze určit konec období.'); return; }
        await setDoc(ref, { planCancelAt: end }, { merge: true });
        alert('Zrušení balíčku naplánováno k: ' + end.toLocaleDateString('cs-CZ'));
        loadCurrentPlan();
    } catch (e) {
        console.error('❌ cancelPlan:', e);
        alert('Nepodařilo se naplánovat zrušení');
    }
}

// Zrušit naplánované zrušení
async function undoCancel() {
    try {
        const user = window.firebaseAuth && window.firebaseAuth.currentUser;
        if (!user || !window.firebaseDb) return;
        const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const ref = doc(window.firebaseDb, 'users', user.uid, 'profile', 'profile');
        await setDoc(ref, { planCancelAt: null }, { merge: true });
        alert('Zrušení bylo odebráno');
        loadCurrentPlan();
    } catch (e) {
        console.error('❌ undoCancel:', e);
        alert('Nepodařilo se zrušit naplánované zrušení');
    }
}

// Auth modal functions (reused from main script)
function showAuthModal(type) {
    const modal = document.getElementById('authModal');
    const title = modal.querySelector('.modal-title');
    const form = modal.querySelector('.auth-form');
    const submitBtn = modal.querySelector('.auth-submit-btn');
    const switchBtn = modal.querySelector('.auth-switch-btn');
    
    if (type === 'login') {
        title.textContent = 'Přihlášení';
        submitBtn.textContent = 'Přihlásit se';
        switchBtn.textContent = 'Nemáte účet? Zaregistrujte se';
        switchBtn.setAttribute('data-type', 'register');
    } else {
        title.textContent = 'Registrace';
        submitBtn.textContent = 'Zaregistrovat se';
        switchBtn.textContent = 'Máte účet? Přihlaste se';
        switchBtn.setAttribute('data-type', 'login');
    }
    
    modal.style.display = 'block';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('authModal');
    if (event.target === modal) {
        closeAuthModal();
    }
});

// Auth form handling
document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Prosím vyplňte všechna pole.');
        return;
    }
    
    // Simulate auth process
    const submitBtn = this.querySelector('.auth-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Zpracovávám...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        alert('Přihlášení úspěšné!');
        closeAuthModal();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1500);
});

// Auth switch handling
document.querySelector('.auth-switch-btn').addEventListener('click', function() {
    const type = this.getAttribute('data-type');
    showAuthModal(type);
});

// Chat link handling with auth check
document.querySelectorAll('a[href="chat.html"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        checkAuthForChat();
    });
});

function checkAuthForChat() {
    // Check if user is authenticated
    if (window.firebaseAuth) {
        window.firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                // User is logged in, allow access to chat
                window.location.href = 'chat.html';
            } else {
                // User is not logged in, show auth modal
                showAuthModal('login');
            }
        });
    } else {
        // Firebase not loaded yet, show auth modal
        showAuthModal('login');
    }
}
