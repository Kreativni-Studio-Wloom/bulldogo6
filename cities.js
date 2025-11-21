// Czech and Slovak cities for location autocomplete
const CITIES_CZ_SK = [
  // Base major cities (CZ + SK)
  'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Zlín',
  'Bratislava', 'Košice', 'Prešov', 'Žilina', 'Nitra', 'Banská Bystrica', 'Trnava', 'Martin', 'Trenčín', 'Poprad',
  // CZ extended list provided by user
  'Abertamy','Adamov','Andělská Hora','Aš',
  'Bakov nad Jizerou','Bavorov','Bečov nad Teplou','Bechyně','Bělá nad Radbuzou','Bělá pod Bezdězem','Bělčice','Benátky nad Jizerou','Benešov','Benešov nad Ploučnicí','Beroun','Bezdružice','Bílina','Bílovec','Blansko','Blatná','Blovice','Blšany','Bohumín','Bohušovice nad Ohří','Bochov','Bojkovice','Bor','Borohrádek','Borovany','Boskovice','Boží Dar','Brandýs nad Labem-Stará Boleslav','Brandýs nad Orlicí','Brno','Broumov','Brtnice','Brumov-Bylnice','Bruntál','Brušperk','Břeclav','Březnice','Březová','Březová nad Svitavou','Břidličná','Bučovice','Budišov nad Budišovkou','Budyně nad Ohří','Buštěhrad','Bystré','Bystřice','Bystřice nad Pernštejnem','Bystřice pod Hostýnem','Bzenec',
  'Cvikov',
  'Čáslav','Čelákovice','Černošice','Černošín','Černovice','Červená Řečice','Červený Kostelec','Česká Kamenice','Česká Lípa','Česká Skalice','Česká Třebová','České Budějovice','České Velenice','Český Brod','Český Dub','Český Krumlov','Český Těšín',
  'Dačice','Dašice','Děčín','Desná','Deštná','Dobrovice','Dobruška','Dobřany','Dobřichovice','Dobříš','Doksy','Dolní Benešov','Dolní Bousov','Dolní Kounice','Dolní Poustevna','Domažlice','Dubá','Dubí','Dubňany','Duchcov','Dvůr Králové nad Labem',
  'Františkovy Lázně','Frenštát pod Radhoštěm','Frýdek-Místek','Frýdlant','Frýdlant nad Ostravicí','Fryšták','Fulnek',
  'Golčův Jeníkov',
  'Habartov','Habry','Hanušovice','Harrachov','Hartmanice','Havířov','Havlíčkův Brod','Hejnice','Heřmanův Městec','Hlinsko','Hluboká nad Vltavou','Hlučín','Hluk','Hodkovice nad Mohelkou','Hodonín','Holešov','Holice','Holýšov','Hora Svaté Kateřiny','Horažďovice','Horní Benešov','Horní Blatná','Horní Bříza','Horní Cerekev','Horní Jelení','Horní Jiřetín','Horní Planá','Horní Slavkov','Horšovský Týn','Hořice','Hořovice','Hostinné','Hostivice','Hostomice','Hostouň','Hoštka','Hradec Králové','Hradec nad Moravicí','Hrádek','Hrádek nad Nisou','Hranice (okres Cheb)','Hranice (okres Přerov)','Hrob','Hrochův Týnec','Hronov','Hrotovice','Hroznětín','Hrušovany nad Jevišovkou','Hulín','Humpolec','Husinec','Hustopeče',
  'Chabařovice','Cheb','Chlumec','Chlumec nad Cidlinou','Choceň','Chodov','Chomutov','Chotěboř','Chrast','Chrastava','Chropyně','Chrudim','Chřibská','Chvaletice','Chýně','Chýnov','Chyše',
  'Ivančice','Ivanovice na Hané',
  'Jablonec nad Jizerou','Jablonec nad Nisou','Jablonné nad Orlicí','Jablonné v Podještědí','Jablunkov','Jáchymov','Janov','Janovice nad Úhlavou','Janské Lázně','Jaroměř','Jaroměřice nad Rokytnou','Javorník','Jemnice','Jesenice (okres Rakovník)','Jesenice (okres Praha-západ)','Jeseník','Jevíčko','Jevišovice','Jičín','Jihlava','Jilemnice','Jílové','Jílové u Prahy','Jindřichův Hradec','Jirkov','Jiříkov','Jistebnice',
  'Kadaň','Kamenice nad Lipou','Kamenický Šenov','Kaplice','Kardašova Řečice','Karlovy Vary','Karolinka','Karviná','Kasejovice','Kašperské Hory','Kaznějov','Kdyně','Kelč','Kladno','Kladruby','Klášterec nad Ohří','Klatovy','Klecany','Klimkovice','Klobouky u Brna','Kojetín','Kolín','Konice','Kopidlno','Kopřivnice','Koryčany','Kosmonosy','Kostelec na Hané','Kostelec nad Černými lesy','Kostelec nad Labem','Kostelec nad Orlicí','Košťany','Kouřim','Kožlany','Králíky','Kralovice','Kralupy nad Vltavou','Králův Dvůr','Kraslice','Krásná Hora nad Vltavou','Krásná Lípa','Krásné Údolí','Krásno','Kravaře','Krnov','Kroměříž','Krupka','Kryry','Kunovice','Kunštát','Kuřim','Kutná Hora','Kyjov','Kynšperk nad Ohří',
  'Lanškroun','Lanžhot','Lázně Bělohrad','Lázně Bohdaneč','Lázně Kynžvart','Ledeč nad Sázavou','Ledvice','Letohrad','Letovice','Libáň','Libčice nad Vltavou','Liběchov','Liberec','Libochovice','Libušín','Lipnice nad Sázavou','Lipník nad Bečvou','Lišov','Litoměřice','Litomyšl','Litovel','Litvínov','Loket','Lom','Lomnice nad Lužnicí','Lomnice nad Popelkou','Loštice','Loučná pod Klínovcem','Louny','Lovosice','Luby','Lučany nad Nisou','Luhačovice','Luže','Lysá nad Labem',
  'Manětín','Mariánské Lázně','Mašťov','Měčín','Mělník','Městec Králové','Město Albrechtice','Město Touškov','Meziboří','Meziměstí','Mikulášovice','Mikulov','Miletín','Milevsko','Miličín','Milovice','Mimoň','Miroslav','Mirošov','Mirotice','Mirovice','Mladá Boleslav','Mladá Vožice','Mnichovice','Mnichovo Hradiště','Mníšek pod Brdy','Modřice','Mohelnice','Moravská Třebová','Moravské Budějovice','Moravský Beroun','Moravský Krumlov','Morkovice-Slížany','Most','Mšeno','Mýto',
  'Náchod','Nalžovské Hory','Náměšť nad Oslavou','Napajedla','Nasavrky','Nechanice','Nejdek','Němčice nad Hanou','Nepomuk','Neratovice','Netolice','Neveklov','Nová Bystřice','Nová Paka','Nová Role','Nová Včelnice','Nové Hrady','Nové Město na Moravě','Nové Město nad Metují','Nové Město pod Smrkem','Nové Sedlo','Nové Strašecí','Nový Bor','Nový Bydžov','Nový Jičín','Nový Knín','Nymburk','Nýrsko','Nýřany',
  'Odolena Voda','Odry','Olešnice','Olomouc','Oloví','Opava','Opočno','Orlová','Osečná','Osek','Oslavany','Ostrava','Ostrov','Otrokovice',
  'Pacov','Pardubice','Paskov','Pec pod Sněžkou','Pečky','Pelhřimov','Petřvald','Pilníkov','Písek','Planá','Planá nad Lužnicí','Plánice','Plasy','Plesná','Plumlov','Plzeň','Poběžovice','Počátky','Podbořany','Poděbrady','Podivín','Pohořelice','Police nad Metují','Polička','Polná','Postoloprty','Potštát','Praha','Prachatice','Proseč','Prostějov','Protivín','Přebuz','Přelouč','Přerov','Přeštice','Příbor','Příbram','Přibyslav','Přimda','Pyšely',
  'Rabí','Radnice','Rájec-Jestřebí','Rajhrad','Rakovník','Ralsko','Raspenava','Rejštejn','Rokycany','Rokytnice nad Jizerou','Rokytnice v Orlických horách','Ronov nad Doubravou','Rosice','Rotava','Roudnice nad Labem','Rousínov','Rovensko pod Troskami','Roztoky','Rožmberk nad Vltavou','Rožďalovice','Rožmitál pod Třemšínem','Rožnov pod Radhoštěm','Rtyně v Podkrkonoší','Rudná','Rudolfov','Rumburk','Rychnov nad Kněžnou','Rychnov u Jablonce nad Nisou','Rychvald','Rýmařov',
  'Řevnice','Říčany',
  'Sadská','Sázava','Seč','Sedlčany','Sedlec-Prčice','Sedlice','Semily','Sezemice','Sezimovo Ústí','Skalná','Skuteč','Slaný','Slatiňany','Slavičín','Slavkov u Brna','Slavonice','Slušovice','Smečno','Smiřice','Smržovka','Soběslav','Sobotka','Sokolov','Solnice','Spálené Poříčí','Staňkov','Staré Město (okres Šumperk)','Staré Město (okres Uherské Hradiště)','Stárkov','Starý Plzenec','Stod','Stochov','Strakonice','Stráž nad Nežárkou','Stráž pod Ralskem','Strážnice','Strážov','Strmilov','Stříbro','Studénka','Suchdol nad Lužnicí','Sušice','Světlá nad Sázavou','Svitavy','Svoboda nad Úpou','Svratka',
  'Šenov','Šlapanice','Šluknov','Špindlerův Mlýn','Štěpánov','Šternberk','Štětí','Štíty','Štramberk','Šumperk','Švihov',
  'Tábor','Tachov','Tanvald','Telč','Teplá','Teplice','Teplice nad Metují','Terezín','Tišnov','Toužim','Tovačov','Trhové Sviny','Trhový Štěpánov','Trmice','Trutnov','Třebechovice pod Orebem','Třebenice','Třebíč','Třeboň','Třemošná','Třemošnice','Třešť','Třinec','Turnov','Týn nad Vltavou','Týnec nad Labem','Týnec nad Sázavou','Týniště nad Orlicí',
  'Uherské Hradiště','Uherský Brod','Uherský Ostroh','Uhlířské Janovice','Unhošť','Uničov',
  'Újezd u Brna','Úpice','Úsov','Ústí nad Labem','Ústí nad Orlicí','Úštěk','Úterý','Úvaly',
  'Valašské Klobouky','Valašské Meziříčí','Valtice','Vamberk','Varnsdorf','Vejprty','Velešín','Velká Bíteš','Velká Bystřice','Velké Bílovice','Velké Hamry','Velké Meziříčí','Velké Opatovice','Velké Pavlovice','Velký Šenov','Veltrusy','Velvary','Verneřice','Veselí nad Lužnicí','Veselí nad Moravou','Veverská Bítýška','Větřní','Vidnava','Vimperk','Vítkov','Vizovice','Vlachovo Březí','Vlašim','Vodňany','Volary','Volyně','Votice','Vracov','Vratimov','Vrbno pod Pradědem','Vrchlabí','Vroutek','Vsetín','Všeruby','Výsluní','Vysoké Mýto','Vysoké nad Jizerou','Vysoké Veselí','Vyškov','Vyšší Brod',
  'Zábřeh','Zákupy','Zásmuky','Zbiroh','Zbýšov','Zdice','Zlaté Hory','Zlín','Zliv','Znojmo','Zruč nad Sázavou','Zubří',
  'Žacléř','Žamberk','Žandov','Žatec','Ždánice','Žďár nad Sázavou','Ždírec nad Doubravou','Žebrák','Železná Ruda','Železnice','Železný Brod','Židlochovice','Žirovnice','Žlutice','Žulová'
];

function normalize(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '');
}

function attachLocationAutocomplete() {
  // Find all inputs that use the shared cities datalist (add form + search bar)
  const inputs = Array.from(document.querySelectorAll('input[list="citiesList"]'));
  if (inputs.length === 0) return;

  const datalist = document.getElementById('citiesList');
  if (!datalist) return;

  inputs.forEach((input) => {
    // Avoid attaching multiple times
    if (input.__citiesBound) return;
    input.__citiesBound = true;

    input.addEventListener('input', () => {
      const termRaw = input.value.trim();
      datalist.innerHTML = '';
      if (termRaw.length < 1) {
        // Do not show any suggestions until something is typed
        return;
      }

      const term = normalize(termRaw);
      // Rank by: startsWith first, then includes
      const ranked = CITIES_CZ_SK
        .map((city) => ({ city, n: normalize(city) }))
        .filter(({ n }) => n.includes(term))
        .sort((a, b) => {
          const aStarts = a.n.startsWith(term) ? 0 : 1;
          const bStarts = b.n.startsWith(term) ? 0 : 1;
          if (aStarts !== bStarts) return aStarts - bStarts;
          // Then shorter distance (position of match)
          return a.n.indexOf(term) - b.n.indexOf(term);
        })
        .slice(0, 5);

      ranked.forEach(({ city }) => {
        const option = document.createElement('option');
        option.value = city;
        datalist.appendChild(option);
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Attach now and also when modals open (simple periodic check to be robust)
  attachLocationAutocomplete();
  // In case modal content mounts later, retry shortly
  setTimeout(attachLocationAutocomplete, 300);
  setTimeout(attachLocationAutocomplete, 800);
});


