// Rychlá kontrola Phone Authentication konfigurace
// Zkopírujte tento kód a vložte ho do konzole prohlížeče

console.log('🔍 Kontrola Phone Authentication konfigurace...');
console.log('');
console.log('⚠️ Tato kontrola vyžaduje manuální ověření v Firebase Console:');
console.log('');
console.log('1. Firebase Console → Authentication → Sign-in method');
console.log('   ✅ Phone musí být ENABLED');
console.log('');
console.log('2. Klikněte na Phone (telefonní ikona) a zkontrolujte:');
console.log('   ✅ Phone number sign-in musí být Enabled');
console.log('   ✅ reCAPTCHA by měla být automaticky nakonfigurovaná');
console.log('');
console.log('3. Firebase Console → Authentication → Settings → Authorized domains');
console.log('   ✅ Musí obsahovat: localhost');
console.log('');
console.log('4. Google Cloud Console → APIs & Services → Enabled APIs');
console.log('   ✅ Identity Toolkit API musí být povoleno');
console.log('');

// Zkusit zjistit Firebase konfiguraci
if (window.firebaseAuth) {
    const auth = window.firebaseAuth;
    console.log('✅ Firebase Auth je připraven pro telefonní autentifikaci');
    console.log('   Project ID:', auth.app.options.projectId);
    console.log('   Auth Domain:', auth.app.options.authDomain);
    console.log('   API Key:', auth.app.options.apiKey ? 'nastaven' : 'chybí');
} else if (window.firebaseApp) {
    console.log('✅ Firebase App je dostupný');
    console.log('   Project ID:', window.firebaseApp.options.projectId);
} else {
    console.error('❌ Firebase Auth není dostupný');
    console.log('   Obnovte stránku a zkuste to znovu');
}

