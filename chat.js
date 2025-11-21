// Instagram-like chat: pouze frontend (UI), připraveno na API integraci
// - Levý panel: konverzace
// - Pravý panel: aktivní chat (bubliny, avatar, timestamp)
// - Posílání textu + až 5 obrázků (náhledy)
// - Psaní jen pro přihlášené (gating přes Firebase auth)

console.log('💬 IG Chat: init');

/** Stav **/
let igCurrentUser = null;                 // přihlášený uživatel
let igConversations = [];                 // seznam konverzací (mock)
let igMessagesByConvId = {};              // zprávy podle ID konverzace (mock)
let igSelectedConvId = null;              // aktivní konverzace
let igSelectedFiles = [];                 // vybrané obrázky pro aktuální zprávu

/** Pomocné **/
function igFormatTime(date) {
	const d = date instanceof Date ? date : new Date(date);
	return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}
function igParams() { return new URLSearchParams(window.location.search); }

/** Inicializace po načtení DOM + auth watcher **/
document.addEventListener('DOMContentLoaded', async () => {
	// Firebase auth (pokud je k dispozici)
	try {
		if (window.firebaseAuth) {
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        onAuthStateChanged(window.firebaseAuth, (user) => {
				igCurrentUser = user || null;
				igUpdateGating();
			});
		}
	} catch (_) {}

	igInitUI();
	igLoadMockData();
	igHandleDeepLink();
	igRenderConversations();
	igUpdateGating();
});

/** UI prvky **/
function igQ(id) { return document.getElementById(id); }

function igInitUI() {
	const backBtn = igQ('igBackBtn');
	if (backBtn) backBtn.addEventListener('click', () => {
		window.history.back?.();
	});
	const openProfile = igQ('igOpenProfile');
	if (openProfile) openProfile.addEventListener('click', () => {
		console.log('Profil – TODO navázat na profil uživatele');
	});

	const input = igQ('igText');
	const send = igQ('igSend');
	const files = igQ('igFiles');
	if (input) {
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				igHandleSend();
			}
		});
	}
	if (send) {
		send.addEventListener('click', (e) => { e.preventDefault(); igHandleSend(); });
	}
	if (files) {
		files.addEventListener('change', () => {
			const selected = Array.from(files.files || []);
			igSelectedFiles = selected.slice(0, 5);
			igRenderFilePreview();
		});
	}
	const search = igQ('igSearch');
	if (search) search.addEventListener('input', igFilterConversations);
}

/** Mock dat pro UI (lze nahradit API) **/
function igLoadMockData() {
	igConversations = [
		{ id: 'c1', title: 'Karel Novák', last: 'Jasně, platí 👍', time: new Date(), avatar: '' },
		{ id: 'c2', title: 'Studio FotoX', last: 'Díky za zprávu!', time: new Date(Date.now() - 3600000), avatar: '' },
		{ id: 'c3', title: 'Jana – Grafika', last: 'Pošlu ukázku', time: new Date(Date.now() - 86400000), avatar: '' }
	];
	igMessagesByConvId = {
		c1: [
			{ id: 'm1', uid: 'other', text: 'Dobrý den, je nabídka aktuální?', images: [], at: new Date(Date.now() - 7200000) },
			{ id: 'm2', uid: 'me', text: 'Dobrý den, ano je. 😊', images: [], at: new Date(Date.now() - 7100000) },
			{ id: 'm3', uid: 'me', text: '', images: [], at: new Date(Date.now() - 7000000) }
		],
		c2: [],
		c3: []
	};
}

/** Deep link: ?userId=...&listingId=...&listingTitle=... **/
function igHandleDeepLink() {
	const p = igParams();
	const userId = p.get('userId');
	const listingTitle = p.get('listingTitle');
	const listingId = p.get('listingId');
	// Vytvořit / vybrat konverzaci pro daného uživatele
	if (userId) {
		let conv = igConversations.find(c => c.id === 'u_' + userId);
		if (!conv) {
			conv = { id: 'u_' + userId, title: 'Uživatel', last: '', time: new Date(), avatar: '' };
			igConversations.unshift(conv);
		}
		igSelectedConvId = conv.id;
		// Zobrazit předmět (ad title) nad zprávami
		if (listingTitle) {
			const subject = igQ('igSubject');
			const subjectText = igQ('igSubjectText');
			if (subject && subjectText) {
				// Pokud máme ID inzerátu, udělat z předmětu odkaz na detail inzerátu
				if (listingId) {
					const a = document.createElement('a');
					a.href = `ad-detail.html?id=${encodeURIComponent(listingId)}&userId=${encodeURIComponent(userId)}`;
					a.textContent = listingTitle;
					a.target = '_blank';
					a.rel = 'noopener';
					subjectText.innerHTML = '';
					subjectText.appendChild(a);
				} else {
					subjectText.textContent = listingTitle;
				}
				subject.style.display = 'inline-flex';
			}
			// Předvyplnit placeholder i samotný text zprávy
			const input = igQ('igText');
			if (input) {
				if (!input.placeholder) input.placeholder = 'K inzerátu: ' + listingTitle;
				if (!input.value) input.value = 'K inzerátu: ' + listingTitle + ' – ';
			}
		}
		igOpenConversation(conv.id);
	}
}

/** Gating – přihlášení povolí psaní **/
function igUpdateGating() {
	const prompt = igQ('igLoginPrompt');
	const inputBar = igQ('igInput');
	const input = igQ('igText');
	const send = igQ('igSend');
	const files = igQ('igFiles');
	const isLogged = !!igCurrentUser;
	if (prompt) prompt.style.display = isLogged ? 'none' : 'flex';
	if (inputBar) inputBar.style.display = isLogged ? 'block' : 'none';
	if (input) input.disabled = !isLogged;
	if (send) send.disabled = !isLogged;
	if (files) files.disabled = !isLogged;
}

/** Render konverzací **/
function igRenderConversations(list = igConversations) {
	const el = igQ('igConversations');
	if (!el) return;
	if (!list || list.length === 0) {
		el.innerHTML = '<div style="padding:12px; color:#6b7280;">Žádné konverzace</div>';
        return;
    }
	el.innerHTML = list.map(c => `
		<div class="ig-conv ${igSelectedConvId === c.id ? 'active' : ''}" data-id="${c.id}">
			<div class="ig-avatar"><i class="fas fa-user"></i></div>
			<div>
				<div class="ig-title">${c.title}</div>
				<div class="ig-last">${c.last || ''}</div>
            </div>
			<div class="ig-time">${igFormatTime(c.time)}</div>
                </div>
	`).join('');
	// click handlers
	Array.from(el.querySelectorAll('.ig-conv')).forEach(item => {
		item.addEventListener('click', () => {
			const id = item.getAttribute('data-id');
			igOpenConversation(id);
            });
        });
}

function igFilterConversations() {
	const q = (igQ('igSearch')?.value || '').toLowerCase();
	const filtered = igConversations.filter(c => (c.title || '').toLowerCase().includes(q) || (c.last || '').toLowerCase().includes(q));
	igRenderConversations(filtered);
}

/** Otevření konverzace **/
function igOpenConversation(convId) {
	igSelectedConvId = convId;
	igRenderConversations();
	// hlavička
	const conv = igConversations.find(c => c.id === convId);
	igQ('igPeerName').textContent = conv?.title || 'Konverzace';
	igQ('igPeerStatus').textContent = 'Online';
	igRenderMessages();
}

/** Render zpráv **/
function igRenderMessages() {
	const box = igQ('igMessages');
	if (!box) return;
	const msgs = igMessagesByConvId[igSelectedConvId] || [];
	if (msgs.length === 0) {
		box.innerHTML = '<div class="ig-empty">Zatím žádné zprávy – napište první.</div>';
        return;
    }
	box.innerHTML = msgs.map(m => {
		const mine = igCurrentUser ? (m.uid === 'me' || m.uid === igCurrentUser.uid) : (m.uid === 'me');
		const imgs = (m.images || []).map(img => `<img src="${img.url}" alt="${img.name||''}">`).join('');
        return `
			<div class="ig-row ${mine ? 'mine' : ''}">
				<div class="ig-avatar"><i class="fas fa-user"></i></div>
				<div class="ig-bubble">
					${m.text ? `<div>${m.text}</div>` : ''}
					${imgs ? `<div class=\"ig-images\">${imgs}</div>` : ''}
					<div class="ig-meta">${igFormatTime(m.at)}</div>
            </div>
			</div>`;
    }).join('');
	box.scrollTop = box.scrollHeight;
}

/** Náhled vybraných obrázků **/
function igRenderFilePreview() {
	const wrap = igQ('igFilePreview');
	if (!wrap) return;
	if (igSelectedFiles.length === 0) { wrap.innerHTML=''; return; }
	wrap.innerHTML = igSelectedFiles.map((f, i) => {
		const url = URL.createObjectURL(f);
		return `<img src="${url}" alt="náhled ${i+1}">`;
	}).join('');
}

/** Odeslání zprávy **/
function igHandleSend() {
	if (!igCurrentUser) return; // gating
	if (!igSelectedConvId) return;
	const input = igQ('igText');
	const text = (input?.value || '').trim();
	if (!text && igSelectedFiles.length === 0) return;
    const now = new Date();
	const msg = {
		id: 'm_' + now.getTime(),
		uid: 'me',
		text,
		images: igSelectedFiles.map(f => ({ name: f.name, url: URL.createObjectURL(f) })),
		at: now
	};
	igMessagesByConvId[igSelectedConvId] = (igMessagesByConvId[igSelectedConvId] || []).concat(msg);
	if (input) input.value = '';
	igSelectedFiles = [];
	igRenderFilePreview();
	const conv = igConversations.find(c => c.id === igSelectedConvId);
	if (conv) { conv.last = text || (msg.images.length ? '📷 Foto' : ''); conv.time = now; }
	igRenderConversations();
	igRenderMessages();
}

// Export / integrace: voláno z inzerátu (přesměruje na chat s parametry)
window.contactSeller = function(listingId, sellerUid, listingTitle) {
	const url = new URL(window.location.origin + '/chat.html');
	url.searchParams.set('userId', sellerUid || '');
	if (listingId) url.searchParams.set('listingId', listingId);
	if (listingTitle) url.searchParams.set('listingTitle', listingTitle);
	window.location.href = url.toString();
};

// Export pro případné využití
window.igOpenConversation = igOpenConversation;

// Konec – UI je čistě frontend mock, přizpůsoben stylu IG DM