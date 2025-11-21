// Jednoduchá Firebase verze s otevřenými pravidly
let allServices = [];
let filteredServices = [];
let servicesFirebaseAuth = null;
let servicesFirebaseDb = null;

// Debug: Zkontrolovat, jestli se skript načítá
console.log('🔧 services.js se načítá...');

// Funkce pro inicializaci služeb
function initializeServices() {
    console.log('🚀 Inicializuji služby...');
    console.log('Window Firebase Auth:', window.firebaseAuth);
    console.log('Window Firebase DB:', window.firebaseDb);
    
    // Počkat na inicializaci Firebase
    const checkFirebase = setInterval(() => {
        if (window.firebaseAuth && window.firebaseDb) {
            servicesFirebaseAuth = window.firebaseAuth;
            servicesFirebaseDb = window.firebaseDb;
            console.log('✅ Firebase nalezen, inicializuji služby...');
            console.log('Firebase Auth:', servicesFirebaseAuth);
            console.log('Firebase DB:', servicesFirebaseDb);
            initServices();
            clearInterval(checkFirebase);
        } else {
            console.log('⏳ Čekám na Firebase...', {
                auth: !!window.firebaseAuth,
                db: !!window.firebaseDb
            });
        }
    }, 100);
    
    // Timeout po 5 sekundách (optimalizováno)
    setTimeout(() => {
        if (!servicesFirebaseAuth || !servicesFirebaseDb) {
            console.error('❌ Firebase se nepodařilo načíst po 5 sekundách');
            console.log('Final state:', {
                servicesFirebaseAuth: !!servicesFirebaseAuth,
                servicesFirebaseDb: !!servicesFirebaseDb,
                windowAuth: !!window.firebaseAuth,
                windowDb: !!window.firebaseDb
            });
            console.log('🔄 Přepínám na lokální databázi...');
            initLocalFallback();
        }
    }, 5000);
}

// Inicializace po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, spouštím inicializaci služeb...');
    initializeServices();
});

// Alternativní inicializace - pokud už je DOM načtený
if (document.readyState === 'loading') {
    // DOM se stále načítá, čekáme na DOMContentLoaded
    console.log('⏳ DOM se stále načítá, čekám na DOMContentLoaded...');
} else {
    // DOM je už načtený, můžeme spustit hned
    console.log('✅ DOM je už načtený, spouštím inicializaci hned...');
    initializeServices();
}

// Inicializace služeb
// Spustit periodickou kontrolu expirace TOP inzerátů v services každou minutu
let servicesTopExpirationInterval = null;

function startServicesTopExpirationCheck() {
    // Zastavit předchozí interval pokud existuje
    if (servicesTopExpirationInterval) {
        clearInterval(servicesTopExpirationInterval);
    }
    
    // Spustit kontrolu každou minutu
    servicesTopExpirationInterval = setInterval(async () => {
        await checkAndExpireTopAdsInServices();
    }, 60000); // 60 sekund
    
    console.log('🕒 Spuštěna periodická kontrola expirace TOP inzerátů v services');
}

function stopServicesTopExpirationCheck() {
    if (servicesTopExpirationInterval) {
        clearInterval(servicesTopExpirationInterval);
        servicesTopExpirationInterval = null;
        console.log('🕒 Zastavena periodická kontrola expirace TOP inzerátů v services');
    }
}

async function initServices() {
    console.log('Inicializace Firebase služeb...');
    
    try {
        // Nastavení real-time listeneru
        await setupRealtimeListener();
        // Přednastavit filtry podle URL parametrů
        applyFiltersFromUrl();
        
        console.log('🔧 Spouštím setupEventListeners...');
        setupEventListeners();
        console.log('✅ setupEventListeners dokončeno');
        
        // Spustit periodickou kontrolu expirace TOP inzerátů
        startServicesTopExpirationCheck();
    } catch (error) {
        console.error('Chyba při inicializaci Firebase:', error);
        showErrorMessage('Chyba při připojení k Firebase. Používám lokální databázi.');
        initLocalFallback();
    }
}

// Nastavení real-time listeneru pro služby
async function setupRealtimeListener() {
    try {
        console.log('🔧 Nastavuji real-time listener...');
        console.log('Firebase DB pro listener:', servicesFirebaseDb);
        
        if (!servicesFirebaseDb) {
            throw new Error('Firebase DB není dostupný');
        }
        
        const { collectionGroup, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Čtení všech inzerátů napříč uživateli přes collectionGroup
        const servicesRef = collectionGroup(servicesFirebaseDb, 'inzeraty');
        console.log('📁 Services reference:', servicesRef);
        
        // Bez orderBy - seřadíme v JavaScriptu
        console.log('🔍 Query bez orderBy (seřadíme v JS)');
        
        console.log('👂 Nastavuji onSnapshot listener...');
        
        onSnapshot(servicesRef, async (snapshot) => {
            console.log('📡 Real-time update:', snapshot.docs.length, 'služeb');
            console.log('Snapshot metadata:', {
                fromCache: snapshot.metadata.fromCache,
                hasPendingWrites: snapshot.metadata.hasPendingWrites
            });
            
            // Aktualizace stavu připojení
            updateConnectionStatus(true);
            
            // Nejdříve zkontrolovat a zrušit expirované TOP inzeráty
            try {
                await checkAndExpireTopAdsInServices();
            } catch (error) {
                console.warn('⚠️ Chyba při kontrole expirace TOP:', error);
            }
            
            allServices = [];
            snapshot.forEach((doc) => {
                const data = doc.data() || {};
                // Doplnit userId z cesty (users/{uid}/inzeraty/{adId}) pokud chybí
                const userIdFromPath = doc.ref.parent && doc.ref.parent.parent ? doc.ref.parent.parent.id : undefined;
                if (!data.userId && userIdFromPath) {
                    data.userId = userIdFromPath;
                }
                console.log('📄 Dokument:', doc.id, data);
                allServices.push({ 
                    id: doc.id, 
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date()
                });
            });
            
            // Seřadit podle data vytvoření (nejnovější první) v JavaScriptu
            allServices.sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return dateB - dateA;
            });
            
            console.log('📋 Všechny služby:', allServices);
            
            // Pokud nejsou žádné služby, přidáme testovací
            if (allServices.length === 0) {
                console.log('⚠️ Žádné služby v databázi, přidávám testovací služby...');
                try {
                    await addTestServices();
                } catch (error) {
                    console.error('❌ Chyba při přidávání testovacích služeb:', error);
                    initLocalFallback();
                }
                return;
            }
            
            // Respektovat aktuálně zadané filtry (včetně města)
            filterServices();
            updateStats();
            
        }, (error) => {
            console.error('❌ Chyba v real-time listeneru:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            updateConnectionStatus(false);
            
            // Pokud je chyba s oprávněními nebo síťovými problémy, použij lokální fallback
            if (error.code === 'permission-denied' || error.code === 'unavailable' || error.code === 'unauthenticated') {
                console.log('🔒 Problém s Firebase, přepínám na lokální databázi');
                initLocalFallback();
            } else {
                showErrorMessage('Chyba při sledování změn v databázi: ' + error.message);
                // Po 3 sekundách zkusit lokální fallback
                setTimeout(() => {
                    initLocalFallback();
                }, 3000);
            }
        });
        
    } catch (error) {
        console.error('❌ Chyba při nastavování real-time listeneru:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        showErrorMessage('Nepodařilo se nastavit real-time sledování: ' + error.message);
        initLocalFallback();
    }
}

// Kontrola a automatické zrušení expirovaných TOP inzerátů v services
async function checkAndExpireTopAdsInServices() {
    try {
        if (!servicesFirebaseDb) return;
        
        const { getDocs, collectionGroup, updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Načíst všechny inzeráty napříč uživateli
        const servicesRef = collectionGroup(servicesFirebaseDb, 'inzeraty');
        const adsSnapshot = await getDocs(servicesRef);
        
        const now = new Date();
        let expiredCount = 0;
        
        for (const adDoc of adsSnapshot.docs) {
            const adData = adDoc.data();
            
            // Kontrola zda je TOP a má čas expirace
            if (adData.isTop && adData.topExpiresAt) {
                const expiresAt = adData.topExpiresAt.toDate ? adData.topExpiresAt.toDate() : new Date(adData.topExpiresAt);
                
                if (now > expiresAt) {
                    // TOP vypršel - zrušit TOP status
                    await updateDoc(adDoc.ref, {
                        isTop: false,
                        topExpiredAt: now
                    });
                    expiredCount++;
                }
            }
        }
        
        if (expiredCount > 0) {
            console.log(`🕒 Automaticky zrušeno ${expiredCount} expirovaných TOP inzerátů v services`);
        }
        
    } catch (error) {
        console.error('Chyba při kontrole expirace TOP v services:', error);
    }
}

// Lokální fallback databáze
function initLocalFallback() {
    console.log('🔄 Inicializace lokální fallback databáze...');
    
    try {
        // Načtení služeb z localStorage nebo vytvoření testovacích
        const savedServices = localStorage.getItem('inzerio-services');
        
        if (savedServices) {
            allServices = JSON.parse(savedServices);
            console.log('✅ Načteny služby z localStorage:', allServices.length);
        } else {
            console.log('⚠️ Žádné uložené služby, vytvářím testovací...');
            createTestServices();
        }
        // Konzistence: řadit dle createdAt (nejnovější první)
        allServices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        filteredServices = [...allServices];
        // TOP služby vždy první i v lokálním fallbacku
        filteredServices.sort((a, b) => {
            if (a.isTop && !b.isTop) return -1;
            if (!a.isTop && b.isTop) return 1;
            return 0;
        });
        console.log('📊 Služby připraveny:', { allServices: allServices.length, filteredServices: filteredServices.length });
        
        displayServices();
        updateStats();
        updateConnectionStatus(true); // Lokální DB je vždy dostupná
        
        setupEventListeners();
        console.log('✅ Lokální fallback databáze inicializována');
    } catch (error) {
        console.error('❌ Chyba při inicializaci lokální databáze:', error);
        // Vytvořit minimální testovací služby
        allServices = [{
            id: 'fallback-1',
            title: "Testovací služba",
            description: "Toto je testovací služba pro fallback",
            price: "100 Kč/hod",
            location: "Praha",
            category: "technical",
            userId: "fallback-user",
            userEmail: "test@example.com",
            createdAt: new Date(),
            status: "active"
        }];
        filteredServices = [...allServices];
        displayServices();
        updateStats();
        updateConnectionStatus(true);
    }
}

// Vytvoření testovacích služeb pro lokální databázi
function createTestServices() {
    console.log('🧪 Vytvářím testovací služby...');
    allServices = [
        {
            id: '1',
            title: "Oprava počítačů a notebooků",
            category: "it",
            description: "Profesionální oprava počítačů, notebooků a tabletů. Diagnostika problémů, výměna komponentů, instalace operačních systémů. Rychlé a spolehlivé služby.",
            price: "500 Kč/hod",
            location: "Praha",
            userId: "test-user-1",
            userEmail: "opravy@example.com",
            createdAt: new Date(),
            status: "active"
        },
        {
            id: '2',
            title: "Instalace nábytku",
            category: "technical",
            description: "Montáž a instalace nábytku všech typů. IKEA nábytek, kuchyňské linky, skříně, postele. Zkušený montér s vlastním nářadím.",
            price: "800 Kč/hod",
            location: "Brno",
            userId: "test-user-2",
            userEmail: "montaz@example.com",
            createdAt: new Date(),
            status: "active"
        },
        {
            id: '3',
            title: "Doučování matematiky",
            category: "education",
            description: "Doučování matematiky pro základní a střední školy. Příprava na přijímací zkoušky, maturitu. Individuální přístup, trpělivost.",
            price: "400 Kč/hod",
            location: "Ostrava",
            userId: "test-user-3",
            userEmail: "doucovani@example.com",
            createdAt: new Date(),
            status: "active"
        },
        {
            id: '4',
            title: "Grafický design",
            category: "design",
            description: "Tvorba log, vizitek, bannerů, letáků. Branding a corporate identity. Moderní design, rychlé dodání, konkurenční ceny.",
            price: "1200 Kč/projekt",
            location: "Plzeň",
            userId: "test-user-4",
            userEmail: "design@example.com",
            createdAt: new Date(),
            status: "active"
        },
        {
            id: '5',
            title: "Úklidové služby",
            category: "home",
            description: "Profesionální úklid domácností a kanceláří. Jednorázový i pravidelný úklid. Ekologické prostředky, spolehlivost.",
            price: "300 Kč/hod",
            location: "České Budějovice",
            userId: "test-user-5",
            userEmail: "uklid@example.com",
            createdAt: new Date(),
            status: "active"
        },
        {
            id: '6',
            title: "Stěhování",
            category: "transport",
            description: "Kompletní stěhovací služby. Stěhování bytů, domů, kanceláří. Zabalené služby, pojištění, rychlé a šetrné stěhování.",
            price: "1500 Kč/hod",
            location: "Liberec",
            userId: "test-user-6",
            userEmail: "stehovani@example.com",
            createdAt: new Date(),
            status: "active"
        }
    ];
    
    console.log(`✅ Vytvořeno ${allServices.length} testovacích služeb`);
    saveServicesToLocalStorage();
}

// Uložení služeb do localStorage
function saveServicesToLocalStorage() {
    localStorage.setItem('inzerio-services', JSON.stringify(allServices));
    console.log('Služby uloženy do localStorage');
}

// Zobrazení služeb v gridu
function displayServices() {
    console.log('🎨 Zobrazuji služby...', { 
        allServices: allServices.length, 
        filteredServices: filteredServices.length 
    });
    
    console.log('📋 Všechny služby:', allServices);
    console.log('🔍 Filtrované služby:', filteredServices);
    
    let servicesGrid = document.getElementById('servicesGrid');
    const noServices = document.getElementById('noServices');
    
    if (!servicesGrid) {
        console.error('❌ Element servicesGrid nenalezen!');
        // Zkusit najít alternativní element
        const alternativeGrid = document.querySelector('.services-grid');
        if (alternativeGrid) {
            console.log('✅ Nalezen alternativní element .services-grid');
            servicesGrid = alternativeGrid;
        } else {
            console.error('❌ Žádný grid element nenalezen!');
            return;
        }
    }
    
    if (filteredServices.length === 0) {
        console.log('⚠️ Žádné služby k zobrazení');
        servicesGrid.innerHTML = '<div class="loading-services"><i class="fas fa-spinner fa-spin"></i><p>Žádné služby nenalezeny</p></div>';
        if (noServices) {
            noServices.style.display = 'block';
        }
        return;
    }
    
    console.log(`✅ Zobrazuji ${filteredServices.length} služeb`);
    
    if (noServices) {
        noServices.style.display = 'none';
    }
    
    try {
        // Nastavení limitu a zobrazení akcí podle atributů kontejneru
        const limitAttr = servicesGrid.getAttribute('data-limit');
        const showActionsAttr = servicesGrid.getAttribute('data-show-actions');
        const limit = limitAttr ? parseInt(limitAttr, 10) : null;
        const showActions = showActionsAttr ? showActionsAttr === 'true' : true;

        // Pokud je nastaven limit (typicky homepage), bereme vždy nejnovější podle allServices
        // Pozn.: allServices je již seřazen podle createdAt desc v initServices()
        const listToRender = Array.isArray(allServices) && limit
            ? allServices.slice(0, Math.max(0, limit))
            : filteredServices;

        servicesGrid.innerHTML = listToRender.map(service => createAdCard(service, showActions)).join('');
        
        console.log('✅ Služby zobrazeny');
    } catch (error) {
        console.error('❌ Chyba při zobrazování služeb:', error);
        servicesGrid.innerHTML = '<div class="error-message"><p>Chyba při načítání služeb. Zkuste obnovit stránku.</p></div>';
    }
}

// Vytvoření karty inzerátu
function createAdCard(service, showActions = true) {
    const topStyle = service.isTop ? 'style="border: 3px solid #ff8a00 !important; box-shadow: 0 8px 28px rgba(255, 138, 0, 0.6), 0 0 0 2px rgba(255, 138, 0, 0.4) !important;"' : '';
    
    return `
        <article class="ad-card${service.isTop ? ' is-top' : ''}" data-category="${service.category || ''}" ${topStyle}>
            <div class="ad-thumb">
                <img src="${service.images && service.images.length > 0 ? service.images[0].url : 'fotky/team.jpg'}" alt="Inzerát" loading="lazy" decoding="async">
            </div>
            <div class="ad-body">
                <h3 class="ad-title">${service.title || 'Bez názvu'}</h3>
                <div class="ad-meta"><span>${service.location || 'Neuvedeno'}</span> • <span>${getCategoryName(service.category || '')}</span></div>
                ${service.price ? `<div class="ad-price">${service.price}</div>` : ''}
            </div>
            ${service.isTop ? `
            <div class="ad-badge-top"><i class="fas fa-fire"></i> TOP</div>
            <div class="ad-flames" aria-hidden="true"></div>
            ` : ''}
            ${showActions ? `
            <div class="ad-actions">
                <button class="btn-contact" onclick="contactService('${service.id}')" title="Kontaktovat">
                    <i class="fas fa-comment"></i>
                </button>
                <button class="btn-profile" onclick="showServiceProfile('${service.id}')" title="Profil">
                    <i class="fas fa-user"></i>
                </button>
                <button class="btn-info" onclick="showServiceDetails('${service.id}')" title="Info">
                    <i class="fas fa-info"></i>
                </button>
            </div>
            ` : ''}
        </article>
    `;
}

// Získání názvu kategorie
function getCategoryName(category) {
    const categories = {
        'home_craftsmen': 'Domácnost & Řemeslníci',
        'auto_moto': 'Auto & Moto',
        'garden_exterior': 'Zahrada & Exteriér',
        'education_tutoring': 'Vzdělávání & Doučování',
        'it_technology': 'IT & technologie',
        'health_personal_care': 'Zdraví a Osobní péče',
        'gastronomy_catering': 'Gastronomie & Catering',
        'events_entertainment': 'Události & Zábava',
        'personal_small_jobs': 'Osobní služby & drobné práce',
        'auto_moto_transport': 'Auto - moto doprava',
        'hobby_creative': 'Hobby & kreativní služby',
        'law_finance_admin': 'Právo & finance & administrativa',
        'pets': 'Domácí zvířata',
        'specialized_custom': 'Specializované služby / na přání'
    };
    return categories[category] || category;
}

// Formátování data
function formatDate(date) {
    if (!date) return 'Neznámé datum';
    
    const now = new Date();
    const serviceDate = date instanceof Date ? date : new Date(date);
    const diffTime = Math.abs(now - serviceDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Včera';
    if (diffDays < 7) return `Před ${diffDays} dny`;
    if (diffDays < 30) return `Před ${Math.ceil(diffDays / 7)} týdny`;
    return serviceDate.toLocaleDateString('cs-CZ');
}

// Aktualizace statistik
function updateStats() {
    const totalEl = document.getElementById('totalServices');
    const activeEl = document.getElementById('activeServices');
    if (totalEl) totalEl.textContent = allServices.length;
    if (activeEl) activeEl.textContent = filteredServices.length;
}

// Aktualizace stavu připojení
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        const icon = statusElement.querySelector('i');
        if (isConnected) {
            icon.style.color = '#28a745';
            icon.title = 'Databáze aktivní (Firebase nebo lokální)';
        } else {
            icon.style.color = '#dc3545';
            icon.title = 'Databáze nedostupná';
        }
    }
}

// Nastavení event listenerů
function setupEventListeners() {
    // Vyhledávání
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterServices);
    }
    
    // Filtry
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterServices);
    }
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortServices);
    }
}

// Filtrování služeb
function filterServices() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let filteredAds = allServices.filter(service => {
        const matchesSearch = service.title.toLowerCase().includes(searchTerm) || 
                             service.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || service.category === categoryFilter;
        
        // Pouze zobrazovat aktivní inzeráty (ne pozastavené)
        const isActive = service.status === 'active';
        
        return matchesSearch && matchesCategory && isActive;
    });
    
    // TOP inzeráty vždy první
    filteredAds.sort((a, b) => {
        if (a.isTop && !b.isTop) return -1;
        if (!a.isTop && b.isTop) return 1;
        return 0;
    });
    
    filteredServices = filteredAds;
    displayServices();
    updateStats();
}

// Načtení filtrů z URL a jejich aplikace
function applyFiltersFromUrl() {
    try {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q') ? decodeURIComponent(params.get('q')) : '';
        const region = params.get('region') ? decodeURIComponent(params.get('region')) : '';
        const searchInput = document.getElementById('searchInput');
        const regionFilter = document.getElementById('regionFilter');
        if (searchInput && q) searchInput.value = q;
        if (regionFilter && region) regionFilter.value = region;
        if (q || region) {
            filterServices();
        }
    } catch (e) {
        console.warn('Nelze aplikovat filtry z URL:', e);
    }
}

// Vyhledání uživatelských profilů podle jména/příjmení/emailu/telefonu
async function searchUsers() {
    try {
        const queryTextRaw = (document.getElementById('userSearchInput')?.value || '').trim();
        const queryText = normalize(queryTextRaw);
        const userResultsEl = document.getElementById('userResults');
        if (!userResultsEl) return;
        if (!queryText) {
            userResultsEl.style.display = 'none';
            userResultsEl.innerHTML = '';
            return;
        }

        // Načti profily přes collectionGroup "profile"
        const { collectionGroup, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const profilesRef = collectionGroup(servicesFirebaseDb, 'profile');
        const snapshot = await getDocs(profilesRef);

        const matched = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data() || {};
            const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            const haystack = normalize(`${fullName} ${data.name || ''} ${data.email || ''} ${data.phone || ''}`);
            if (haystack.includes(queryText)) {
                matched.push({ id: docSnap.id, uid: docSnap.ref.parent.parent?.id, ...data });
            }
        });

        renderUserResults(matched);
    } catch (err) {
        console.error('Chyba při vyhledávání uživatelů:', err);
        showMessage('Chyba při vyhledávání uživatelů', 'error');
    }
}

function renderUserResults(users) {
    const userResultsEl = document.getElementById('userResults');
    if (!userResultsEl) return;
    if (!users || users.length === 0) {
        userResultsEl.style.display = 'block';
        userResultsEl.innerHTML = `
            <div class="no-services" style="grid-column: 1 / -1;">
                <i class="fas fa-user-slash"></i>
                <h3>Žádné profily nenalezeny</h3>
                <p>Zkuste upravit hledaný výraz.</p>
            </div>
        `;
        return;
    }

    userResultsEl.style.display = 'grid';
    userResultsEl.innerHTML = users.map(u => `
        <div class="service-item">
            <div class="service-item-header">
                <h3 class="service-title">${u.name || `${u.firstName || ''} ${u.lastName || ''}` || 'Uživatel'}</h3>
                <span class="service-category">Profil</span>
            </div>
            <div class="service-content">
                <div class="service-details">
                    <div class="service-detail"><i class="fas fa-user"></i> <span>${u.email || 'N/A'}</span></div>
                    ${u.phone ? `<div class="service-detail"><i class="fas fa-phone"></i> <span>${u.phone}</span></div>` : ''}
                </div>
            </div>
            <div class="service-actions">
                <button class="btn btn-success" onclick="openUserProfile('${u.uid || ''}')">
                    <i class="fas fa-user"></i> Zobrazit profil
                </button>
            </div>
        </div>
    `).join('');
}

async function openUserProfile(uid) {
    if (!uid) return;
    // Najít libovolný inzerát tohoto uživatele a použít existující showServiceProfile
    const anyService = allServices.find(s => s.userId === uid);
    if (anyService) {
        showServiceProfile(anyService.id);
        return;
    }
    // Fallback: otevřít prázdný profil (bez inzerátů)
    try {
        const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const userRef = doc(servicesFirebaseDb, 'users', uid, 'profile', 'profile');
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            showMessage('Profil nenalezen', 'error');
            return;
        }
        // Vytvořit dočasnou službu jen pro využití existujícího UI
        const tempService = { id: `temp-${uid}`, userId: uid, userEmail: userSnap.data().email || '' };
        allServices.push(tempService);
        showServiceProfile(tempService.id);
        // odstranit temp
        allServices = allServices.filter(s => s !== tempService);
    } catch (e) {
        console.error(e);
        showMessage('Nepodařilo se otevřít profil', 'error');
    }
}

// Normalizace textu pro porovnávání bez diakritiky
function normalize(str) {
    return (str || '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}+/gu, '');
}

// Řazení služeb
function sortServices() {
    const sortBy = document.getElementById('sortSelect').value;
    let sortedServices = [...allServices];
    
    switch (sortBy) {
        case 'newest':
            sortedServices.sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt));
            break;
        case 'oldest':
            sortedServices.sort((a, b) => new Date(a.createdAt?.toDate?.() || a.createdAt) - new Date(b.createdAt?.toDate?.() || b.createdAt));
            break;
        case 'title':
            sortedServices.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }
    
    // TOP inzeráty vždy první bez ohledu na vybrané řazení
    sortedServices.sort((a, b) => {
        if (a.isTop && !b.isTop) return -1;
        if (!a.isTop && b.isTop) return 1;
        return 0;
    });
    
    filteredServices = sortedServices;
    displayServices();
}

// Extrakce ceny z textu
function extractPrice(priceText) {
    if (!priceText) return 0;
    const match = priceText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// Kontaktování služby
function contactService(serviceId) {
    console.log('📞 Kontaktování služby:', serviceId);
    const service = allServices.find(s => s.id === serviceId);
    console.log('🔍 Nalezená služba:', service);
    
    if (!service) {
        console.error('❌ Služba nenalezena!');
        showMessage('Služba nenalezena!', 'error');
        return;
    }
    
    // Kontrola přihlášení
    const currentUser = window.firebaseAuth?.currentUser;
    if (!currentUser) {
        showMessage('Pro kontaktování se prosím přihlaste', 'error');
        return;
    }
    
    // Kontrola, že uživatel nekontaktuje sám sebe
    if (service.userId === currentUser.uid) {
        showMessage('Nemůžete kontaktovat sami sebe', 'error');
        return;
    }
    
    console.log('✅ Kontrola přihlášení prošla, pokračuji s chatem...');
    
    // Použít chat funkcionalitu - přímo zavolat funkci
    if (typeof contactSeller === 'function') {
        console.log('🎯 Volám contactSeller funkci...');
        console.log('📋 Parametry:', { serviceId, sellerUid: service.userId, listingTitle: service.title });
        contactSeller(serviceId, service.userId, service.title);
    } else if (window.contactSeller) {
        console.log('🎯 Volám window.contactSeller funkci...');
        console.log('📋 Parametry:', { serviceId, sellerUid: service.userId, listingTitle: service.title });
        window.contactSeller(serviceId, service.userId, service.title);
    } else {
        console.log('⚠️ Chat funkce není dostupná, používám email fallback');
        // Fallback na email pokud chat není dostupný
        const emailSubject = `Dotaz k službě: ${service.title}`;
        const emailBody = `Dobrý den,\n\nzajímá mě vaše služba "${service.title}".\n\nPopis: ${service.description}\n\nDěkuji za odpověď.`;
        
        const mailtoLink = `mailto:${service.userEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoLink);
    }
}

// Zobrazení detailů služby
function showServiceDetails(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    if (!service) return;
    
    // Vytvoření modalu s detaily služby
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content service-details-modal">
            <div class="modal-header">
                <h2>${service.title}</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="service-details-content">
                ${service.images && service.images.length > 0 ? `
                <div class="service-detail-section">
                    <h3><i class="fas fa-images"></i> Fotky služby</h3>
                    <div class="service-images-gallery">
                        ${service.images.map((img, index) => `
                            <div class="gallery-image-item" onclick="openImageViewer(${JSON.stringify(service.images).replace(/"/g, '&quot;')}, ${index})">
                                <img src="${img.url}" alt="${service.title} - obrázek ${index + 1}" class="gallery-image">
                                <div class="gallery-image-overlay">
                                    <i class="fas fa-expand"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <p class="gallery-info">Klikněte na obrázek pro plné zobrazení</p>
                </div>
                ` : ''}
                <div class="service-detail-section">
                    <h3>Popis služby</h3>
                    <p>${service.description}</p>
                </div>
                <div class="service-detail-section">
                    <h3>Detaily</h3>
                    <div class="service-details-grid">
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span><strong>Lokalita:</strong> ${service.location}</span>
                        </div>
                        ${service.price ? `
                        <div class="detail-item">
                            <i class="fas fa-tag"></i>
                            <span><strong>Cena:</strong> ${service.price}</span>
                        </div>
                        ` : ''}
                        <div class="detail-item">
                            <i class="fas fa-user"></i>
                            <span><strong>Poskytovatel:</strong> ${service.userEmail}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span><strong>Přidáno:</strong> ${formatDate(service.createdAt)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-tags"></i>
                            <span><strong>Kategorie:</strong> ${getCategoryName(service.category)}</span>
                        </div>
                    </div>
                </div>
                <div class="service-actions">
                    <button class="btn btn-primary" onclick="contactService('${service.id}'); this.closest('.modal').remove();">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                        Zavřít
                    </button>
                </div>
                <div class="service-detail-section">
                    <h3><i class="fas fa-star"></i> Hodnocení této nabídky</h3>
                    <div id="listingReviews_${service.id}" class="reviews-list"></div>
                    <div id="listingReviewForm_${service.id}" class="review-form" style="display: none;">
                        <label>Vaše hodnocení</label>
                        <div class="stars" data-for="listing" data-adid="${service.id}">
                            ${[1,2,3,4,5].map(n => `<i class=\"fas fa-star\" data-value=\"${n}\"></i>`).join('')}
                        </div>
                        <textarea id="listingReviewText_${service.id}" class="form-input" placeholder="Napište vaši zkušenost"></textarea>
                        <button class="btn btn-success" onclick="submitListingReview('${service.userId}','${service.id}')">Uložit hodnocení</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    // Inicializace hodnocení
    initStarsInteractions();
    loadListingReviews(service.userId, service.id);
    
    // Zobrazit formulář pouze pokud je uživatel přihlášen a není vlastník
    const currentUser = window.firebaseAuth?.currentUser;
    const reviewForm = document.getElementById(`listingReviewForm_${service.id}`);
    if (reviewForm) {
        if (currentUser && currentUser.uid !== service.userId) {
            reviewForm.style.display = 'block';
        } else if (!currentUser) {
            reviewForm.innerHTML = '<p class="review-login-required">Pro hodnocení se prosím přihlaste</p>';
            reviewForm.style.display = 'block';
        }
    }
    
    // Zavření při kliknutí mimo modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });
}

// Zobrazení chybové zprávy
function showErrorMessage(message) {
    console.error('❌ Zobrazuji chybovou zprávu:', message);
    const servicesGrid = document.getElementById('servicesGrid');
    if (servicesGrid) {
        servicesGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Chyba při načítání</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Zkusit znovu</button>
                <button class="btn btn-secondary" onclick="initLocalFallback()">Použít lokální databázi</button>
            </div>
        `;
    } else {
        console.error('❌ Element servicesGrid nenalezen!');
    }
}

// Přidání testovacích služeb
async function addTestServices() {
    try {
        console.log('🧪 Přidávám testovací služby...');
        console.log('Firebase DB pro testovací služby:', servicesFirebaseDb);
        
        // Pokud máme Firebase, použij ho
        if (servicesFirebaseDb) {
            const { addDoc, collection } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const testServices = [
                {
                    title: "Oprava počítačů a notebooků",
                    category: "it",
                    description: "Profesionální oprava počítačů, notebooků a tabletů. Diagnostika problémů, výměna komponentů, instalace operačních systémů. Rychlé a spolehlivé služby.",
                    price: "500 Kč/hod",
                    location: "Praha",
                    userId: "test-user-1",
                    userEmail: "opravy@example.com",
                    createdAt: new Date(),
                    status: "active"
                },
                {
                    title: "Instalace nábytku",
                    category: "technical",
                    description: "Montáž a instalace nábytku všech typů. IKEA nábytek, kuchyňské linky, skříně, postele. Zkušený montér s vlastním nářadím.",
                    price: "800 Kč/hod",
                    location: "Brno",
                    userId: "test-user-2",
                    userEmail: "montaz@example.com",
                    createdAt: new Date(),
                    status: "active"
                },
                {
                    title: "Doučování matematiky",
                    category: "education",
                    description: "Doučování matematiky pro základní a střední školy. Příprava na přijímací zkoušky, maturitu. Individuální přístup, trpělivost.",
                    price: "400 Kč/hod",
                    location: "Ostrava",
                    userId: "test-user-3",
                    userEmail: "doucovani@example.com",
                    createdAt: new Date(),
                    status: "active"
                },
                {
                    title: "Grafický design",
                    category: "design",
                    description: "Tvorba log, vizitek, bannerů, letáků. Branding a corporate identity. Moderní design, rychlé dodání, konkurenční ceny.",
                    price: "1200 Kč/projekt",
                    location: "Plzeň",
                    userId: "test-user-4",
                    userEmail: "design@example.com",
                    createdAt: new Date(),
                    status: "active"
                },
                {
                    title: "Úklidové služby",
                    category: "home",
                    description: "Profesionální úklid domácností a kanceláří. Jednorázový i pravidelný úklid. Ekologické prostředky, spolehlivost.",
                    price: "300 Kč/hod",
                    location: "České Budějovice",
                    userId: "test-user-5",
                    userEmail: "uklid@example.com",
                    createdAt: new Date(),
                    status: "active"
                },
                {
                    title: "Stěhování",
                    category: "transport",
                    description: "Kompletní stěhovací služby. Stěhování bytů, domů, kanceláří. Zabalené služby, pojištění, rychlé a šetrné stěhování.",
                    price: "1500 Kč/hod",
                    location: "Liberec",
                    userId: "test-user-6",
                    userEmail: "stehovani@example.com",
                    createdAt: new Date(),
                    status: "active"
                }
            ];
            
            console.log('📝 Přidávám', testServices.length, 'testovacích služeb...');
            
            for (const service of testServices) {
                console.log('➕ Přidávám službu:', service.title);
                
                // Nejdříve vytvořit uživatele, pokud neexistuje
                const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                
                // Vytvořit root dokument uživatele
                await setDoc(doc(servicesFirebaseDb, 'users', service.userId), {
                    uid: service.userId,
                    email: service.userEmail,
                    createdAt: new Date()
                });
                
                // Vytvořit profil uživatele
                await setDoc(doc(servicesFirebaseDb, 'users', service.userId, 'profile', 'profile'), {
                    name: service.userEmail.split('@')[0],
                    email: service.userEmail,
                    balance: 1000,
                    createdAt: new Date()
                });
                
                // Uložit inzerát do users/{userId}/inzeraty
                const adsCollection = collection(servicesFirebaseDb, 'users', service.userId, 'inzeraty');
                const docRef = await addDoc(adsCollection, service);
                console.log('✅ Služba přidána s ID:', docRef.id);
            }
            
            console.log('🎉 Testovací služby byly úspěšně přidány do Firebase databáze');
        } else {
            // Pokud nemáme Firebase, použij lokální databázi
            createTestServices();
            filteredServices = [...allServices];
            displayServices();
            updateStats();
            console.log('Testovací služby přidány do lokální databáze');
        }
        
    } catch (error) {
        console.error('❌ Chyba při přidávání testovacích služeb:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        
        // Fallback na lokální databázi
        console.log('🔄 Přepínám na lokální databázi...');
        createTestServices();
        filteredServices = [...allServices];
        displayServices();
        updateStats();
    }
}

// Přidání nové služby
function addService(serviceData) {
    // Tato funkce je pro lokální databázi - pro Firebase používáme auth.js
    const newService = {
        id: Date.now().toString(),
        ...serviceData,
        userId: 'local-user',
        userEmail: 'local@example.com',
        createdAt: new Date(),
        status: 'active'
    };
    
    allServices.unshift(newService);
    filteredServices = [...allServices];
    saveServicesToLocalStorage();
    displayServices();
    updateStats();
    
    console.log('Nová služba přidána:', newService);
}

// Test připojení
async function testFirebaseConnection() {
    try {
        console.log('Testování připojení...');
        
        if (servicesFirebaseDb) {
            const { collection, addDoc, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Test zápisu
            const testRef = collection(servicesFirebaseDb, 'test');
            const testDoc = await addDoc(testRef, {
                test: true,
                timestamp: new Date()
            });
            console.log('Test zápisu úspěšný:', testDoc.id);
            
            // Test čtení
            const snapshot = await getDocs(testRef);
            console.log('Test čtení úspěšný:', snapshot.docs.length, 'dokumentů');
            
            updateConnectionStatus(true);
            return true;
        } else {
            console.log('Firebase není dostupný, používám lokální databázi');
            updateConnectionStatus(true);
            return true;
        }
        
    } catch (error) {
        console.error('Test selhal:', error);
        updateConnectionStatus(false);
        return false;
    }
}

// Zobrazení profilu prodejce služby
async function showServiceProfile(serviceId) {
    console.log('👤 Zobrazuji profil prodejce služby:', serviceId);
    
    const service = allServices.find(s => s.id === serviceId);
    if (!service) {
        console.error('❌ Služba nenalezena!');
        showMessage('Služba nenalezena!', 'error');
        return;
    }
    
    console.log('🔍 Nalezená služba:', service);
    
    try {
        // Načíst informace o uživateli
        const { getDoc, doc, collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const userRef = doc(window.firebaseDb, 'users', service.userId, 'profile', 'profile');
        const userSnap = await getDoc(userRef);
        
        let userData = {};
        if (userSnap.exists()) {
            userData = userSnap.data();
            console.log('📄 Uživatel nalezen:', userData);
        } else {
            console.log('⚠️ Uživatel nenalezen, používám základní informace');
            userData = {
                name: 'Uživatel',
                email: service.userEmail || 'N/A',
                bio: 'Žádné informace o uživateli.'
            };
        }
        
        // Načíst inzeráty uživatele
        const adsRef = collection(window.firebaseDb, 'users', service.userId, 'inzeraty');
        const q = query(adsRef, where('status', '==', 'active'));
        const adsSnapshot = await getDocs(q);
        
        const userAds = [];
        adsSnapshot.forEach((doc) => {
            userAds.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('📋 Načteny inzeráty uživatele:', userAds.length);
        
        // Vytvoření Instagram-like profil modalu
        const modal = document.createElement('div');
        modal.className = 'modal instagram-profile-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content instagram-profile-content">
                <div class="instagram-profile-header">
                    <button class="instagram-close-btn" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <h2>Profil prodejce</h2>
                </div>
                
                <div class="instagram-profile-body">
                    <!-- Profil Header -->
                    <div class="instagram-profile-info">
                        <div class="instagram-avatar-large">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="instagram-user-details">
                            <h1 class="instagram-username">${userData.name || userData.displayName || 'Uživatel'}</h1>
                            <div class="instagram-stats">
                                <div class="instagram-stat">
                                    <span class="instagram-stat-number">${userAds.length}</span>
                                    <span class="instagram-stat-label">Inzerátů</span>
                                </div>
                                <div class="instagram-stat">
                                    <span class="instagram-stat-number">${userData.rating || '5.0'}</span>
                                    <span class="instagram-stat-label">Hodnocení</span>
                                </div>
                                <div class="instagram-stat">
                                    <span class="instagram-stat-number">${userData.createdAt ? new Date(userData.createdAt).getFullYear() : '2024'}</span>
                                    <span class="instagram-stat-label">Registrován</span>
                                </div>
                            </div>
                            <div class="instagram-bio">
                                <p><strong>Email:</strong> ${userData.email || service.userEmail || 'N/A'}</p>
                                <p><strong>O uživateli:</strong> ${userData.bio || 'Žádné informace o uživateli.'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Inzeráty Grid -->
                    <div class="instagram-posts-section">
                        <div class="instagram-posts-header">
                            <h3><i class="fas fa-thumbtack"></i> Inzeráty uživatele</h3>
                        </div>
                        <div class="instagram-posts-grid">
                            ${userAds.map(ad => `
                                <div class="instagram-post" onclick="showServiceDetails('${ad.id}')">
                                    <div class="instagram-post-content">
                                        <div class="instagram-post-icon">
                                            <i class="${getCategoryIcon(ad.category)}"></i>
                                        </div>
                                        <div class="instagram-post-info">
                                            <h4>${ad.title}</h4>
                                            <p class="instagram-post-price">${ad.price}</p>
                                            <p class="instagram-post-location">
                                                <i class="fas fa-map-marker-alt"></i> ${ad.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Hodnocení profilu + agregace -->
                    <div class="instagram-posts-section">
                        <div class="instagram-posts-header">
                            <h3><i class="fas fa-star"></i> Recenze a hodnocení</h3>
                        </div>
                        <div id="profileReviewForm_${service.userId}" class="review-form" style="display: none;">
                            <label>Vaše hodnocení uživatele</label>
                            <div class="stars" data-for="profile" data-userid="${service.userId}">
                                ${[1,2,3,4,5].map(n => `<i class=\"fas fa-star\" data-value=\"${n}\"></i>`).join('')}
                            </div>
                            <textarea id="profileReviewText_${service.userId}" class="form-input" placeholder="Napište vaši zkušenost s uživatelem"></textarea>
                            <button class="btn btn-success" onclick="submitProfileReview('${service.userId}')">Uložit hodnocení</button>
                        </div>

                        <div id="combinedReviews_${service.userId}" class="reviews-list"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        // Inicializace hodnocení
        initStarsInteractions();
        loadCombinedUserReviews(service.userId);
        
        // Zobrazit formulář pouze pokud je uživatel přihlášen a není vlastník
        const currentUser = window.firebaseAuth?.currentUser;
        const profileReviewForm = document.getElementById(`profileReviewForm_${service.userId}`);
        if (profileReviewForm) {
            if (currentUser && currentUser.uid !== service.userId) {
                profileReviewForm.style.display = 'block';
            } else if (!currentUser) {
                profileReviewForm.innerHTML = '<p class="review-login-required">Pro hodnocení se prosím přihlaste</p>';
                profileReviewForm.style.display = 'block';
            }
        }
        
        console.log('✅ Instagram-like profil prodejce zobrazen');
        
    } catch (error) {
        console.error('❌ Chyba při načítání profilu prodejce:', error);
        showMessage('Nepodařilo se načíst profil prodejce: ' + error.message, 'error');
    }
}

// ===================== Reviews helpers =====================
function initStarsInteractions() {
    try {
        const containers = document.querySelectorAll('.stars');
        containers.forEach(container => {
            const stars = container.querySelectorAll('i.fas.fa-star');
            stars.forEach(star => {
                star.addEventListener('mouseenter', () => highlightStars(stars, parseInt(star.getAttribute('data-value'))));
                star.addEventListener('mouseleave', () => restoreStars(container));
                star.addEventListener('click', () => selectStars(container, parseInt(star.getAttribute('data-value'))));
            });
            container.setAttribute('data-selected', '0');
        });
    } catch (e) {
        console.warn('initStarsInteractions warning:', e);
    }
}

function highlightStars(stars, upto) {
    stars.forEach(s => {
        const val = parseInt(s.getAttribute('data-value'));
        s.style.color = val <= upto ? '#ffc107' : '#e0e0e0';
    });
}

function restoreStars(container) {
    const stars = container.querySelectorAll('i.fas.fa-star');
    const selected = parseInt(container.getAttribute('data-selected') || '0');
    highlightStars(stars, selected);
}

function selectStars(container, value) {
    container.setAttribute('data-selected', String(value));
    restoreStars(container);
}

async function submitProfileReview(targetUserId) {
    try {
        const currentUser = window.firebaseAuth?.currentUser;
        if (!currentUser) { showMessage('Pro hodnocení se přihlaste', 'error'); return; }
        if (currentUser.uid === targetUserId) { showMessage('Nemůžete hodnotit sami sebe', 'error'); return; }

        const starsEl = document.querySelector(`.stars[data-for="profile"][data-userid="${targetUserId}"]`);
        const rating = parseInt(starsEl?.getAttribute('data-selected') || '0');
        const text = (document.getElementById(`profileReviewText_${targetUserId}`)?.value || '').trim();
        if (rating < 1 || rating > 5) { showMessage('Vyberte počet hvězd (1-5)', 'error'); return; }

        const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const reviewRef = doc(window.firebaseDb, 'users', targetUserId, 'reviews', currentUser.uid);
        await setDoc(reviewRef, {
            type: 'profile',
            rating,
            text,
            fromUserId: currentUser.uid,
            fromUserEmail: currentUser.email || '',
            updatedAt: new Date()
        }, { merge: true });

        showMessage('Hodnocení uloženo', 'success');
        loadCombinedUserReviews(targetUserId);
    } catch (e) {
        console.error('submitProfileReview error', e);
        showMessage('Nepodařilo se uložit hodnocení', 'error');
    }
}

async function submitListingReview(ownerUserId, adId) {
    try {
        const currentUser = window.firebaseAuth?.currentUser;
        if (!currentUser) { showMessage('Pro hodnocení se přihlaste', 'error'); return; }
        if (currentUser.uid === ownerUserId) { showMessage('Nemůžete hodnotit vlastní inzerát', 'error'); return; }

        const starsEl = document.querySelector(`.stars[data-for="listing"][data-adid="${adId}"]`);
        const rating = parseInt(starsEl?.getAttribute('data-selected') || '0');
        const text = (document.getElementById(`listingReviewText_${adId}`)?.value || '').trim();
        if (rating < 1 || rating > 5) { showMessage('Vyberte počet hvězd (1-5)', 'error'); return; }

        const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const reviewRef = doc(window.firebaseDb, 'users', ownerUserId, 'inzeraty', adId, 'reviews', currentUser.uid);
        await setDoc(reviewRef, {
            type: 'ad',
            adId,
            rating,
            text,
            fromUserId: currentUser.uid,
            fromUserEmail: currentUser.email || '',
            updatedAt: new Date()
        }, { merge: true });

        showMessage('Hodnocení inzerátu uloženo', 'success');
        loadListingReviews(ownerUserId, adId);
    } catch (e) {
        console.error('submitListingReview error', e);
        showMessage('Nepodařilo se uložit hodnocení', 'error');
    }
}

async function loadListingReviews(ownerUserId, adId) {
    try {
        const container = document.getElementById(`listingReviews_${adId}`);
        if (!container) return;
        container.innerHTML = '<p>Načítám recenze...</p>';

        const { getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const reviewsRef = collection(window.firebaseDb, 'users', ownerUserId, 'inzeraty', adId, 'reviews');
        const snap = await getDocs(reviewsRef);
        const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        container.innerHTML = renderReviewsList(reviews);
    } catch (e) {
        console.error('loadListingReviews error', e);
    }
}

async function loadCombinedUserReviews(userId) {
    try {
        const container = document.getElementById(`combinedReviews_${userId}`);
        if (!container) return;
        container.innerHTML = '<p>Načítám recenze...</p>';

        const { getDocs, collection, collectionGroup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        // Recenze profilu
        const profileReviewsRef = collection(window.firebaseDb, 'users', userId, 'reviews');
        const profileSnap = await getDocs(profileReviewsRef);
        const profileReviews = profileSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Recenze ke všem inzerátům uživatele napříč strukturou
        const adReviewsGroup = collectionGroup(window.firebaseDb, 'reviews');
        const adReviews = [];
        const groupSnap = await getDocs(adReviewsGroup);
        groupSnap.forEach(docSnap => {
            const parent = docSnap.ref.parent; // reviews
            const adDoc = parent?.parent; // adId document
            const inzeraty = adDoc?.parent; // collection 'inzeraty'
            const userDoc = inzeraty?.parent; // user uid doc
            if (userDoc && userDoc.id === userId && inzeraty.id === 'inzeraty') {
                adReviews.push({ id: docSnap.id, ...docSnap.data() });
            }
        });

        const combined = [...profileReviews, ...adReviews];
        container.innerHTML = renderReviewsList(combined);
    } catch (e) {
        console.error('loadCombinedUserReviews error', e);
    }
}

function renderReviewsList(reviews) {
    if (!reviews || reviews.length === 0) {
        return `<div class=\"no-services\"><i class=\"fas fa-comment-slash\"></i><p>Zatím žádné recenze</p></div>`;
    }
    const avg = (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1);
    return `
        <div class=\"reviews-summary\"><strong>Průměr:</strong> ${avg} / 5 • <strong>Počet:</strong> ${reviews.length}</div>
        <div class=\"reviews-items\">
            ${reviews.map(r => `
                <div class=\"review-item\">
                    <div class=\"review-header\">
                        <span class=\"review-stars\">${'★'.repeat(r.rating || 0)}${'☆'.repeat(5 - (r.rating || 0))}</span>
                        <span class=\"review-meta\">${r.fromUserEmail || r.fromUserId || ''}</span>
                    </div>
                    ${r.text ? `<p class=\"review-text\">${escapeHtml(r.text)}</p>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function escapeHtml(str) {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Expose submit functions
window.submitProfileReview = submitProfileReview;
window.submitListingReview = submitListingReview;

// Add CSS for review forms
const reviewStyles = document.createElement('style');
reviewStyles.textContent = `
    .review-form {
        margin-top: 15px;
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background: #f9f9f9;
    }
    .review-form label {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
    }
    .stars {
        margin-bottom: 10px;
    }
    .stars i {
        font-size: 20px;
        color: #e0e0e0;
        cursor: pointer;
        margin-right: 3px;
        transition: color 0.2s;
    }
    .stars i:hover {
        color: #ffc107;
    }
    .review-form textarea {
        width: 100%;
        min-height: 80px;
        margin-bottom: 10px;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        resize: vertical;
    }
    .review-login-required {
        color: #666;
        font-style: italic;
        text-align: center;
        padding: 10px;
        background: #f0f0f0;
        border-radius: 4px;
    }
    .reviews-list {
        margin-top: 15px;
    }
    .reviews-summary {
        margin-bottom: 15px;
        padding: 10px;
        background: #e8f4fd;
        border-radius: 4px;
        font-size: 14px;
    }
    .review-item {
        margin-bottom: 15px;
        padding: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        background: white;
    }
    .review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    .review-stars {
        color: #ffc107;
        font-size: 16px;
    }
    .review-meta {
        font-size: 12px;
        color: #666;
    }
    .review-text {
        margin: 0;
        color: #333;
        line-height: 1.4;
    }
`;
document.head.appendChild(reviewStyles);

// Získání ikony podle kategorie (stejné jako v chat.js)
function getCategoryIcon(category) {
    const icons = {
        'home_craftsmen': 'fas fa-hammer',
        'auto_moto': 'fas fa-car',
        'garden_exterior': 'fas fa-leaf',
        'education_tutoring': 'fas fa-graduation-cap',
        'it_technology': 'fas fa-microchip',
        'health_personal_care': 'fas fa-heart',
        'gastronomy_catering': 'fas fa-utensils',
        'events_entertainment': 'fas fa-music',
        'personal_small_jobs': 'fas fa-hands-helping',
        'auto_moto_transport': 'fas fa-truck',
        'hobby_creative': 'fas fa-palette',
        'law_finance_admin': 'fas fa-balance-scale',
        'pets': 'fas fa-paw',
        'specialized_custom': 'fas fa-star'
    };
    return icons[category] || 'fas fa-tag';
}

// Export funkcí pro globální použití
// Testovací funkce pro kontakt
function testContact() {
    console.log('🧪 Testování kontaktu...');
    console.log('📊 Stav služeb:', { 
        allServices: allServices.length, 
        filteredServices: filteredServices.length 
    });
    
    console.log('🔍 Kontrola funkcí:');
    console.log('- contactSeller:', typeof contactSeller);
    console.log('- window.contactSeller:', typeof window.contactSeller);
    console.log('- contactService:', typeof contactService);
    console.log('- window.firebaseAuth:', !!window.firebaseAuth);
    console.log('- window.firebaseDb:', !!window.firebaseDb);
    
    if (allServices.length === 0) {
        showMessage('Žádné služby nejsou načteny!', 'error');
        return;
    }
    
    const firstService = allServices[0];
    console.log('🔍 První služba:', firstService);
    
    if (firstService) {
        console.log('🎯 Spouštím contactService...');
        contactService(firstService.id);
    } else {
        showMessage('Nebyla nalezena žádná služba!', 'error');
    }
}

window.contactService = contactService;
window.showServiceDetails = showServiceDetails;
window.showServiceProfile = showServiceProfile;
window.addTestServices = addTestServices;
window.testFirebaseConnection = testFirebaseConnection;
window.addService = addService;
window.testContact = testContact;