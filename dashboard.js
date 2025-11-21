// Dashboard JavaScript - Admin panel

let allUsers = [];
let allAds = [];
let currentUserDetails = null;

// Admin credentials (v produkci by měly být v bezpečném prostředí)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Inicializace po načtení Firebase
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard DOMContentLoaded');
    const checkFirebase = setInterval(() => {
        if (window.firebaseAuth && window.firebaseDb) {
            console.log('Firebase nalezen v Dashboard, inicializuji');
            initDashboard();
            clearInterval(checkFirebase);
        } else {
            console.log('Čekám na Firebase v Dashboard...');
        }
    }, 100);
});

// Inicializace dashboardu
function initDashboard() {
    console.log('Inicializuji Dashboard');
    
    // Event listenery
    setupEventListeners();
    
    // Zkontrolovat, jestli je admin už přihlášen
    checkAdminLogin();
}

// Zkontrolovat admin přihlášení
function checkAdminLogin() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showDashboard();
        loadDashboardData();
    } else {
        showLoginForm();
    }
}

// Nastavení event listenerů
function setupEventListeners() {
    // Admin login form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // User search
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
    
    // User filter
    const userFilter = document.getElementById('userFilter');
    if (userFilter) {
        userFilter.addEventListener('change', filterUsers);
    }
    
    // Balance edit form
    const balanceEditForm = document.getElementById('balanceEditForm');
    if (balanceEditForm) {
        balanceEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateUserBalance();
        });
    }
}

// Zpracování admin přihlášení
function handleAdminLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    
    console.log('Admin login attempt:', username);
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        console.log('Admin login successful');
        localStorage.setItem('adminLoggedIn', 'true');
        showDashboard();
        loadDashboardData();
        showMessage('Úspěšně přihlášen jako admin!', 'success');
    } else {
        console.log('Admin login failed');
        showMessage('Neplatné přihlašovací údaje!', 'error');
    }
}

// Zobrazení přihlašovacího formuláře
function showLoginForm() {
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.querySelector('.admin-info').style.display = 'none';
}

// Zobrazení dashboardu
function showDashboard() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.querySelector('.admin-info').style.display = 'flex';
}

// Načtení dat pro dashboard
async function loadDashboardData() {
    try {
        console.log('Načítám dashboard data...');
        
        // Načíst všechny uživatele
        await loadAllUsers();
        
        // Načíst všechny inzeráty
        await loadAllAds();
        
        // Aktualizovat statistiky
        updateDashboardStats();
        
        // Zobrazit uživatele
        displayUsers(allUsers);
        
        console.log('Dashboard data načtena');
        
    } catch (error) {
        console.error('Chyba při načítání dashboard dat:', error);
        showMessage('Nepodařilo se načíst data dashboardu.', 'error');
    }
}

// Načtení všech uživatelů
async function loadAllUsers() {
    try {
        const { getDocs, getDoc, collection, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const usersSnapshot = await getDocs(collection(window.firebaseDb, 'users'));
        allUsers = [];
        
        // Pro každý uživatel načti profil z users/{uid}/profile/profile a slouč
        for (const userDoc of usersSnapshot.docs) {
            const userData = { id: userDoc.id, ...userDoc.data() };
            const profileRef = doc(window.firebaseDb, 'users', userDoc.id, 'profile', 'profile');
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                userData.name = profileData.name || userData.name;
                userData.email = profileData.email || userData.email;
                userData.balance = profileData.balance || 0;
                userData.profileCreatedAt = profileData.createdAt || null;
            }
            allUsers.push(userData);
        }
        
        console.log('Načteno uživatelů (s profily):', allUsers.length);
        
    } catch (error) {
        console.error('Chyba při načítání uživatelů:', error);
        throw error;
    }
}

// Načtení všech inzerátů
async function loadAllAds() {
    try {
        const { getDocs, collection, collectionGroup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        console.log('Načítám inzeráty přes collectionGroup("inzeraty")...');
        const cgSnapshot = await getDocs(collectionGroup(window.firebaseDb, 'inzeraty'));
        allAds = [];
        
        cgSnapshot.forEach((docSnap) => {
            const data = docSnap.data() || {};
            const userIdFromPath = docSnap.ref.parent && docSnap.ref.parent.parent ? docSnap.ref.parent.parent.id : undefined;
            if (!data.userId && userIdFromPath) data.userId = userIdFromPath;
            allAds.push({ id: docSnap.id, ...data });
        });
        
        console.log('Načteno inzerátů z users/{uid}/inzeraty:', allAds.length);
        
        // Fallback: pokud nic nenačteme z nové struktury, zkus starou kolekci 'services'
        if (allAds.length === 0) {
            console.warn('Nenalezeny žádné inzeráty v users/{uid}/inzeraty, zkouším fallback na kolekci "services"');
            const servicesSnapshot = await getDocs(collection(window.firebaseDb, 'services'));
            servicesSnapshot.forEach((docSnap) => {
                const data = docSnap.data() || {};
                allAds.push({ id: docSnap.id, ...data });
            });
            console.log('Načteno inzerátů z fallback kolekce services:', allAds.length);
        }
        
    } catch (error) {
        console.error('Chyba při načítání inzerátů:', error);
        throw error;
    }
}

// Aktualizace statistik dashboardu
function updateDashboardStats() {
    const totalUsers = allUsers.length;
    const totalAds = allAds.length;
    const activeAds = allAds.filter(ad => ad.status === 'active').length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalAds').textContent = totalAds;
    document.getElementById('activeAds').textContent = activeAds;
}

// Zobrazení uživatelů
function displayUsers(users) {
    const grid = document.getElementById('usersGrid');
    
    if (users.length === 0) {
        grid.innerHTML = `
            <div class="no-users">
                <i class="fas fa-users"></i>
                <h3>Žádní uživatelé</h3>
                <p>V systému nejsou žádní registrovaní uživatelé.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = users.map(user => createUserCard(user)).join('');
}

// Vytvoření karty uživatele
function createUserCard(user) {
    const userAds = allAds.filter(ad => ad.userId === user.uid);
    const activeAds = userAds.filter(ad => ad.status === 'active').length;
    
    const joinDate = user.createdAt?.toDate?.() || user.createdAt || user.profileCreatedAt?.toDate?.() || user.profileCreatedAt;
    const formattedDate = joinDate ? new Date(joinDate).toLocaleDateString('cs-CZ') : 'Neznámé';
    
    return `
        <div class="user-card" onclick="showUserDetails('${user.uid}')">
            <div class="user-card-header">
                <div class="user-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-info">
                    <h3>${user.name || 'Bez jména'}</h3>
                    <p>${user.email}</p>
                </div>
            </div>
            <div class="user-card-stats">
                <div class="stat-item">
                    <i class="fas fa-list"></i>
                    <span>${userAds.length} inzerátů</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${activeAds} aktivních</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
            </div>
            <div class="user-card-actions">
                <button class="btn btn-primary" onclick="event.stopPropagation(); showUserDetails('${user.uid}')">
                    <i class="fas fa-eye"></i> Zobrazit detaily
                </button>
            </div>
        </div>
    `;
}

// Filtrování uživatelů
function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const filterValue = document.getElementById('userFilter').value;
    
    let filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(searchTerm) || 
                             user.email.toLowerCase().includes(searchTerm);
        
        let matchesFilter = true;
        if (filterValue === 'withAds') {
            const userAds = allAds.filter(ad => ad.userId === user.uid);
            matchesFilter = userAds.length > 0;
        } else if (filterValue === 'withoutAds') {
            const userAds = allAds.filter(ad => ad.userId === user.uid);
            matchesFilter = userAds.length === 0;
        }
        
        return matchesSearch && matchesFilter;
    });
    
    displayUsers(filteredUsers);
}

// Zobrazení detailů uživatele
function showUserDetails(userId) {
    console.log('Zobrazuji detaily uživatele:', userId);
    
    const user = allUsers.find(u => u.uid === userId);
    if (!user) {
        console.log('Uživatel nenalezen');
        return;
    }
    
    currentUserDetails = user;
    
    // Vyplnit informace o uživateli
    document.getElementById('userDetailName').textContent = user.name || 'Bez jména';
    document.getElementById('userDetailEmail').textContent = user.email;
    
    const joinDate = user.createdAt?.toDate?.() || user.createdAt;
    const formattedDate = joinDate ? new Date(joinDate).toLocaleDateString('cs-CZ') : 'Neznámé';
    document.getElementById('userDetailJoinDate').textContent = `Registrován: ${formattedDate}`;
    
    // Zobrazit zůstatek
    const balance = user.balance || 0;
    document.getElementById('userDetailBalance').textContent = `${balance.toLocaleString('cs-CZ')} Kč`;
    
    // Načíst inzeráty uživatele
    loadUserAds(userId);
    
    // Zobrazit modal
    document.getElementById('userDetailsModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Načtení inzerátů uživatele
function loadUserAds(userId) {
    const userAds = allAds.filter(ad => ad.userId === userId);
    const grid = document.getElementById('userAdsGrid');
    
    if (userAds.length === 0) {
        grid.innerHTML = `
            <div class="no-ads">
                <i class="fas fa-list"></i>
                <h3>Žádné inzeráty</h3>
                <p>Tento uživatel zatím nepřidal žádné inzeráty.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = userAds.map(ad => createUserAdCard(ad)).join('');
}

// Vytvoření karty inzerátu uživatele
function createUserAdCard(ad) {
    const categoryNames = {
        'technical': 'Technické služby',
        'it': 'IT služby',
        'design': 'Design a kreativita',
        'education': 'Vzdělávání',
        'home': 'Domácí služby',
        'transport': 'Doprava a logistika'
    };
    
    const statusColors = {
        'active': '#28a745',
        'inactive': '#dc3545',
        'paused': '#ffc107'
    };
    
    const statusTexts = {
        'active': 'Aktivní',
        'inactive': 'Neaktivní',
        'paused': 'Pozastaveno'
    };
    
    const createdDate = ad.createdAt?.toDate?.() || ad.createdAt;
    const formattedDate = createdDate ? new Date(createdDate).toLocaleDateString('cs-CZ') : 'Neznámé';
    
    return `
        <div class="user-ad-card">
            <div class="ad-header">
                <h4>${ad.title}</h4>
                <div class="ad-category">${categoryNames[ad.category] || ad.category}</div>
                <div class="ad-status" style="background-color: ${statusColors[ad.status]}; color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.8rem; margin-top: 0.5rem;">
                    ${statusTexts[ad.status] || ad.status}
                </div>
            </div>
            <div class="ad-content">
                <p class="ad-description">${ad.description}</p>
                <div class="ad-details">
                    <div class="ad-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${ad.location}</span>
                    </div>
                    ${ad.price ? `
                    <div class="ad-detail">
                        <i class="fas fa-tag"></i>
                        <span>${ad.price}</span>
                    </div>
                    ` : ''}
                    <div class="ad-detail">
                        <i class="fas fa-eye"></i>
                        <span>${ad.views || 0} zobrazení</span>
                    </div>
                    <div class="ad-detail">
                        <i class="fas fa-calendar"></i>
                        <span>Vytvořeno: ${formattedDate}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Zavření modalu s detaily uživatele
function closeUserDetailsModal() {
    document.getElementById('userDetailsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentUserDetails = null;
}

// Admin odhlášení
function adminLogout() {
    localStorage.removeItem('adminLoggedIn');
    showLoginForm();
    showMessage('Úspěšně odhlášen z admin panelu.', 'success');
}

// Zobrazení modalu pro úpravu zůstatku
function showBalanceEditModal() {
    if (!currentUserDetails) return;
    
    const currentBalance = currentUserDetails.balance || 0;
    document.getElementById('newBalance').value = currentBalance;
    document.getElementById('balanceReason').value = '';
    
    document.getElementById('balanceEditModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Zavření modalu pro úpravu zůstatku
function closeBalanceEditModal() {
    document.getElementById('balanceEditModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Aktualizace zůstatku uživatele
async function updateUserBalance() {
    try {
        if (!currentUserDetails) return;
        
        const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const formData = new FormData(document.getElementById('balanceEditForm'));
        const newBalance = parseInt(formData.get('balance'));
        const reason = formData.get('reason') || 'Admin změna';
        
        // Aktualizovat profil users/{uid}/profile/profile
        await updateDoc(doc(window.firebaseDb, 'users', currentUserDetails.uid, 'profile', 'profile'), {
            balance: newBalance,
            lastBalanceUpdate: new Date(),
            balanceUpdateReason: reason
        });
        
        // Aktualizovat lokální data
        currentUserDetails.balance = newBalance;
        const userIndex = allUsers.findIndex(u => u.uid === currentUserDetails.uid);
        if (userIndex !== -1) {
            allUsers[userIndex].balance = newBalance;
        }
        
        // Aktualizovat zobrazení
        document.getElementById('userDetailBalance').textContent = `${newBalance.toLocaleString('cs-CZ')} Kč`;
        
        showMessage(`Zůstatek uživatele byl úspěšně změněn na ${newBalance.toLocaleString('cs-CZ')} Kč!`, 'success');
        closeBalanceEditModal();
        
    } catch (error) {
        console.error('Chyba při aktualizaci zůstatku:', error);
        showMessage('Nepodařilo se aktualizovat zůstatek.', 'error');
    }
}

// Zobrazení zprávy
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Event listenery
document.addEventListener('DOMContentLoaded', () => {
    // Zavření modalu při kliknutí mimo něj
    window.addEventListener('click', (e) => {
        const userDetailsModal = document.getElementById('userDetailsModal');
        const balanceEditModal = document.getElementById('balanceEditModal');
        
        if (e.target === userDetailsModal) {
            closeUserDetailsModal();
        }
        
        if (e.target === balanceEditModal) {
            closeBalanceEditModal();
        }
    });
});

// Export funkcí pro globální použití
window.showUserDetails = showUserDetails;
window.closeUserDetailsModal = closeUserDetailsModal;
window.showBalanceEditModal = showBalanceEditModal;
window.closeBalanceEditModal = closeBalanceEditModal;
window.updateUserBalance = updateUserBalance;
window.adminLogout = adminLogout;
