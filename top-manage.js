// Správa topování (profile-top.html)

async function topManage_waitForFirebase() {
    return new Promise((resolve) => {
        (function wait() {
            if (window.firebaseAuth && window.firebaseDb) return resolve();
            setTimeout(wait, 100);
        })();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await topManage_waitForFirebase();
    await topManageLoad();
});

async function topManageLoad() {
    try {
        const user = window.firebaseAuth && window.firebaseAuth.currentUser;
        const list = document.getElementById('topManageList');
        const empty = document.getElementById('topManageEmpty');
        if (!user || !window.firebaseDb || !list) return;

        list.innerHTML = '<div class="loading-services"><i class="fas fa-spinner fa-spin"></i><p>Načítám inzeráty…</p></div>';

        const { getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const adsRef = collection(window.firebaseDb, 'users', user.uid, 'inzeraty');
        const snap = await getDocs(adsRef);

        if (snap.empty) {
            list.innerHTML = '';
            if (empty) {
                empty.style.display = '';
                const h3 = empty.querySelector('h3');
                if (h3) h3.textContent = 'Nemáte žádné topované inzeráty';
                const p = empty.querySelector('p');
                if (p) p.textContent = 'Až inzerát topujete, zobrazí se zde.';
            }
            return;
        }

        const ads = [];
        snap.forEach(d => {
            const data = d.data() || {};
            ads.push({ id: d.id, ...data });
        });

        // Pouze topované inzeráty
        const topAds = ads.filter(a => !!a.isTop);

        if (topAds.length === 0) {
            list.innerHTML = '';
            if (empty) {
                empty.style.display = '';
                const h3 = empty.querySelector('h3');
                if (h3) h3.textContent = 'Nemáte žádné topované inzeráty';
                const p = empty.querySelector('p');
                if (p) p.textContent = 'Až inzerát topujete, zobrazí se zde.';
            }
            return;
        }

        // Seřadit podle nejbližší expirace (vzestupně)
        topAds.sort((a, b) => {
            const ta = a.topExpiresAt?.toDate ? a.topExpiresAt.toDate() : (a.topExpiresAt ? new Date(a.topExpiresAt) : new Date(8640000000000000));
            const tb = b.topExpiresAt?.toDate ? b.topExpiresAt.toDate() : (b.topExpiresAt ? new Date(b.topExpiresAt) : new Date(8640000000000000));
            return ta - tb;
        });

        list.innerHTML = topAds.map(renderTopManageCard).join('');
        if (empty) empty.style.display = 'none';
    } catch (e) {
        console.error('topManageLoad:', e);
        showMessage('Nepodařilo se načíst inzeráty', 'error');
    }
}

function renderTopManageCard(ad) {
    const isTop = !!ad.isTop;
    const topExpiresAt = ad.topExpiresAt?.toDate ? ad.topExpiresAt.toDate() : (ad.topExpiresAt ? new Date(ad.topExpiresAt) : null);
    const topUntilText = topExpiresAt ? topExpiresAt.toLocaleDateString('cs-CZ') : '-';
    const remaining = topExpiresAt ? Math.max(0, Math.ceil((topExpiresAt - new Date()) / (24*60*60*1000))) : 0;
    const remainingText = isTop && topExpiresAt ? `${remaining} dní` : '-';

    const badge = isTop ? '<div class="ad-badge-top"><i class="fas fa-fire"></i> TOP</div>' : '';
    const topStyle = isTop ? 'style="border: 3px solid #ff8a00 !important; box-shadow: 0 8px 28px rgba(255, 138, 0, 0.6), 0 0 0 2px rgba(255, 138, 0, 0.4) !important;"' : '';

    return `
        <article class="ad-card${isTop ? ' is-top' : ''}" ${topStyle}>
            <div class="ad-thumb">
                <img src="${ad.images && ad.images[0]?.url ? ad.images[0].url : 'fotky/team.jpg'}" alt="Inzerát" loading="lazy" decoding="async">
            </div>
            <div class="ad-body">
                <h3 class="ad-title">${ad.title || 'Bez názvu'}</h3>
                <div class="ad-meta"><span>${ad.location || 'Neuvedeno'}</span> • <span>${(ad.category || '').toString()}</span></div>
                <div style="margin-top:8px; font-size:14px; color:#444;">
                    <div><strong>Stav TOP:</strong> ${isTop ? 'Aktivní' : 'Neaktivní'}</div>
                    <div><strong>TOP do:</strong> ${isTop ? topUntilText : '-'}</div>
                    <div><strong>Zbývá:</strong> ${isTop ? remainingText : '-'}</div>
                </div>
                ${badge}
            </div>
            <div class="ad-actions" style="position: static; transform:none; justify-content:flex-start; gap:8px; margin-top:10px;">
                <button class="btn-activate" onclick="topManageExtend('${ad.id}')" title="Prodloužit (přejít na platbu)"><i class="fas fa-credit-card"></i></button>
                <button class="btn-edit" onclick="topManageView('${ad.id}')" title="Zobrazit detail inzerátu"><i class="fas fa-eye"></i></button>
                <button class="btn-delete" onclick="topManageCancel('${ad.id}')" title="Zrušit topování"><i class="fas fa-ban"></i></button>
            </div>
            <div class="quick-actions" style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                <button class="btn btn-secondary" onclick="topManageExtendQuick('${ad.id}', 1)" title="Prodloužit o 1 den">1 den</button>
                <button class="btn btn-secondary" onclick="topManageExtendQuick('${ad.id}', 7)" title="Prodloužit o 1 týden">1 týden</button>
                <button class="btn btn-secondary" onclick="topManageExtendQuick('${ad.id}', 30)" title="Prodloužit o 1 měsíc">1 měsíc</button>
            </div>
        </article>
    `;
}

function topManageExtend(adId) {
    // Přejít na stránku top-ads s předvybraným inzerátem
    const url = new URL('top-ads.html', window.location.href);
    url.searchParams.set('adId', adId);
    window.location.href = url.toString();
}

async function topManageCancel(adId) {
    try {
        if (!confirm('Opravdu chcete zrušit topování tohoto inzerátu?')) return;
        const user = window.firebaseAuth && window.firebaseAuth.currentUser;
        if (!user || !window.firebaseDb) return;
        const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const ref = doc(window.firebaseDb, 'users', user.uid, 'inzeraty', adId);
        await updateDoc(ref, { isTop: false });
        showMessage('Topování bylo zrušeno', 'success');
        await topManageLoad();
    } catch (e) {
        console.error('topManageCancel:', e);
        showMessage('Nepodařilo se zrušit topování', 'error');
    }
}

async function topManageRefresh() {
    await topManageLoad();
}

function topManageView(adId) {
    const user = window.firebaseAuth && window.firebaseAuth.currentUser;
    if (!user) return;
    const url = new URL('ad-detail.html', window.location.href);
    url.searchParams.set('id', adId);
    url.searchParams.set('userId', user.uid);
    window.location.href = url.toString();
}

// Expose
window.topManageExtend = topManageExtend;
window.topManageCancel = topManageCancel;
window.topManageRefresh = topManageRefresh;
window.topManageView = topManageView;

function topManageExtendQuick(adId, duration) {
    const priceByDuration = { 1: 19, 7: 49, 30: 149 };
    const price = priceByDuration[duration] || 0;
    const url = new URL('top-ads.html', window.location.href);
    url.searchParams.set('adId', adId);
    url.searchParams.set('duration', String(duration));
    url.searchParams.set('price', String(price));
    window.location.href = url.toString();
}

window.topManageExtendQuick = topManageExtendQuick;


