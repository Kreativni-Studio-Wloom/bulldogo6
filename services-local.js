// Lokální verze services.js bez Firebase závislostí
let allServices = [];
let filteredServices = [];

// Debug: Zkontrolovat, jestli se skript načítá
console.log('🔧 services-local.js se načítá...');

// Inicializace po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, inicializuji lokální služby...');
    initLocalServices();
});

// Inicializace lokálních služeb
function initLocalServices() {
    console.log('🔄 Inicializace lokálních služeb...');
    
    // Načtení služeb z localStorage nebo vytvoření testovacích
    const savedServices = localStorage.getItem('inzerio-services');
    
    if (savedServices) {
        try {
            allServices = JSON.parse(savedServices);
            console.log('✅ Načteny služby z localStorage:', allServices.length);
        } catch (error) {
            console.error('❌ Chyba při načítání z localStorage:', error);
            createTestServices();
        }
    } else {
        console.log('⚠️ Žádné uložené služby, vytvářím testovací...');
        createTestServices();
    }
    
    filteredServices = [...allServices];
    displayServices();
    updateStats();
    setupEventListeners();
    console.log('✅ Lokální služby inicializovány');
}

// Vytvoření testovacích služeb
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
    
    const servicesGrid = document.getElementById('servicesGrid');
    const noServices = document.getElementById('noServices');
    
    if (!servicesGrid) {
        console.error('❌ Element servicesGrid nenalezen!');
        return;
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
        servicesGrid.innerHTML = filteredServices.map(service => `
            <div class="service-item${service.isTop ? ' top' : ''}" data-category="${service.category || ''}">
                <div class="service-item-header">
                    <h3 class="service-title">${service.title || 'Bez názvu'}</h3>
                    <span class="service-category">${getCategoryName(service.category || '')}</span>
                    ${service.isTop ? `<span class="top-badge"><i class="fas fa-crown"></i> TOP</span>` : ''}
                </div>
                <div class="service-content">
                    <p class="service-description">${service.description || ''}</p>
                    <div class="service-details">
                        <div class="service-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${service.location || 'Neuvedeno'}</span>
                        </div>
                        ${(service.price !== undefined && service.price !== null && service.price !== '') ? `
                        <div class="service-detail">
                            <i class="fas fa-tag"></i>
                            <span>${service.price}</span>
                        </div>
                        ` : ''}
                        <div class="service-detail">
                            <i class="fas fa-user"></i>
                            <span>${service.userEmail || 'Neuvedeno'}</span>
                        </div>
                        <div class="service-detail">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(service.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <div class="service-actions">
                    <button class="btn btn-primary" onclick="contactService('${service.id}')">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                    <button class="btn btn-success" onclick="showServiceProfile('${service.id}')">
                        <i class="fas fa-user"></i> Zobrazit profil
                    </button>
                    <button class="btn btn-outline" onclick="showServiceDetails('${service.id}')">
                        <i class="fas fa-info-circle"></i> Více info
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Služby zobrazeny');
    } catch (error) {
        console.error('❌ Chyba při zobrazování služeb:', error);
        servicesGrid.innerHTML = '<div class="error-message"><p>Chyba při načítání služeb. Zkuste obnovit stránku.</p></div>';
    }
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
        'specialized_custom': 'Specializované služby / na přání',
        'technical': 'Technické služby',
        'it': 'IT služby',
        'design': 'Design a kreativita',
        'education': 'Vzdělávání',
        'home': 'Domácí služby',
        'transport': 'Doprava a logistika'
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

// Nastavení event listenerů
function setupEventListeners() {
    // Vyhledávání
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterServices();
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterServices();
            }
        });
    }
    
    // Filtrování podle kategorie
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterServices);
    }
    
    // Řazení
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortServices);
    }

    // Filtrování podle kraje
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
        regionFilter.addEventListener('change', filterServices);
    }
}

// Filtrování služeb
function filterServices() {
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const regionValue = (document.getElementById('regionFilter')?.value || '').trim();
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    filteredServices = allServices.filter(service => {
        const title = (service.title || '').toLowerCase();
        const desc = (service.description || '').toLowerCase();
        const loc = (service.location || '').toLowerCase();
        const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm) || loc.includes(searchTerm);
        const matchesLocation = !regionValue || (service.location === regionValue);
        
        const matchesCategory = !categoryFilter || service.category === categoryFilter;
        
        return matchesSearch && matchesCategory && matchesLocation;
    });
    
    displayServices();
    updateStats();
}

// Řazení služeb
function sortServices() {
    const sortBy = document.getElementById('sortSelect').value;
    
    filteredServices.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'price-low':
                return extractPrice(a.price) - extractPrice(b.price);
            case 'price-high':
                return extractPrice(b.price) - extractPrice(a.price);
            default:
                return 0;
        }
    });
    
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
    
    if (!service) {
        console.error('❌ Služba nenalezena!');
        alert('Služba nenalezena!');
        return;
    }
    
    // Fallback na email
    const emailSubject = `Dotaz k službě: ${service.title}`;
    const emailBody = `Dobrý den,\n\nzajímá mě vaše služba "${service.title}".\n\nPopis: ${service.description}\n\nDěkuji za odpověď.`;
    
    const mailtoLink = `mailto:${service.userEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink);
}

// Zobrazení detailů služby
function showServiceDetails(serviceId) {
    // Redirect to ad detail page instead of showing modal
    const service = allServices.find(s => s.id === serviceId);
    if (service) {
        window.location.href = `ad-detail.html?id=${serviceId}&userId=${service.userId}`;
    }
    return;
    
    // Original modal code (commented out)
    /*
    const service = allServices.find(s => s.id === serviceId);
    if (!service) return;
    
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
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });
    */
}

// Zobrazení profilu prodejce služby
function showServiceProfile(serviceId) {
    console.log('👤 Zobrazuji profil prodejce služby:', serviceId);
    
    const service = allServices.find(s => s.id === serviceId);
    if (!service) {
        console.error('❌ Služba nenalezena!');
        alert('Služba nenalezena!');
        return;
    }
    
    // Najít všechny služby tohoto uživatele
    const userServices = allServices.filter(s => s.userId === service.userId);
    
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
                <div class="instagram-profile-info">
                    <div class="instagram-avatar-large">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="instagram-user-details">
                        <h1 class="instagram-username">${service.userEmail.split('@')[0]}</h1>
                        <div class="instagram-stats">
                            <div class="instagram-stat">
                                <span class="instagram-stat-number">${userServices.length}</span>
                                <span class="instagram-stat-label">Inzerátů</span>
                            </div>
                            <div class="instagram-stat">
                                <span class="instagram-stat-number">5.0</span>
                                <span class="instagram-stat-label">Hodnocení</span>
                            </div>
                        </div>
                        <div class="instagram-bio">
                            <p><strong>Email:</strong> ${service.userEmail}</p>
                        </div>
                    </div>
                </div>
                
                <div class="instagram-posts-section">
                    <div class="instagram-posts-header">
                        <h3><i class="fas fa-thumbtack"></i> Inzeráty uživatele</h3>
                    </div>
                    <div class="instagram-posts-grid">
                        ${userServices.map(ad => `
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
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log('✅ Profil prodejce zobrazen');
}

// Získání ikony podle kategorie
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
        'specialized_custom': 'fas fa-star',
        'technical': 'fas fa-tools',
        'it': 'fas fa-laptop',
        'design': 'fas fa-paint-brush',
        'education': 'fas fa-graduation-cap',
        'home': 'fas fa-home',
        'transport': 'fas fa-truck'
    };
    return icons[category] || 'fas fa-tag';
}

// Přidání testovacích služeb
function addTestServices() {
    console.log('🧪 Přidávám testovací služby...');
    createTestServices();
    filteredServices = [...allServices];
    displayServices();
    updateStats();
    console.log('Testovací služby přidány');
}

// Export funkcí pro globální použití
window.contactService = contactService;
window.showServiceDetails = showServiceDetails;
window.showServiceProfile = showServiceProfile;
window.addTestServices = addTestServices;