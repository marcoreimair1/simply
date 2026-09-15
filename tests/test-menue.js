/* Testlauf: Profilmenü — Schliessen, Ruecksprung, Schieberegler.
   Abgemeldet. Masse und Ueberlauf lassen sich in jsdom nicht pruefen
   (es rechnet kein Layout) — die stehen im Browser nachgemessen im
   Commit. Hier geht es um Verhalten und darum, dass die Regeln, auf
   denen die Masse beruhen, ueberhaupt in der Datei stehen. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');
const roh = fs.readFileSync(DATEI, 'utf8');
/* Die Regeln der Datenbank stehen nicht in index.html — geprueft wird
   gegen die Migration, die sie zuletzt gesetzt hat. */
const policy = (function(){
  try{
    const d = path.join(__dirname, '..', 'supabase', 'migrations');
    return fs.readdirSync(d).filter(f => /team_policy|team_nachzug|team_ausloeser/.test(f))
             .map(f => fs.readFileSync(path.join(d, f), 'utf8')).join('\n')
             /* Kommentare heraus: dort steht die alte, falsche Regel als
                Erklaerung — die soll die Pruefung nicht finden. */
             .split('\n').filter(z => !/^\s*--/.test(z)).join('\n');
  }catch(e){ return ''; }
})();
const vc = new VirtualConsole();
['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));

const dom = new JSDOM(roh, {
  url: 'https://moji-app.at/', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: vc
});

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }

ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
var m = document.querySelector('#menu');
menuAuf();
ok('Menue ist offen', m.classList.contains('on'));
ok('Menue ist im Vollbild gebaut', m.dataset.vollbild === '1');

/* ── 1 · Schliessen-Knopf: auch das Symbol darin trifft ── */
var zu = m.querySelector('.mzurueck');
ok('Schliessen-Knopf da', !!zu);
var pfad = zu.querySelector('path');
ok('Er traegt ein SVG mit Pfad', !!pfad);
pfad.dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Tipp auf den Pfad schliesst', m.classList.contains('zu'));

m.classList.remove('on','zu'); menuAuf();
zu.querySelector('svg').dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Tipp auf das SVG schliesst', m.classList.contains('zu'));

m.classList.remove('on','zu'); menuAuf();
zu.dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Tipp auf den Knopf selbst schliesst', m.classList.contains('zu'));

/* ── 2 · Ruecksprung aus einem Untermenue: ohne Pause ── */
m.classList.remove('on','zu','sofort');
_vonMenu = true;
zurueckInsMenu();
ok('Menue steht im selben Zug wieder', m.classList.contains('on'));
ok('Und ist als "sofort" gekennzeichnet', m.classList.contains('sofort'));

/* ── 3 · Schieberegler an allen drei Zeilen ── */
['erscheinung','erinnerung','passkey'].forEach(function(a){
  var z = m.querySelector('[data-act="' + a + '"]');
  ok('Zeile ' + a + ' hat einen Schieberegler', !!(z && z.querySelector('.mischalter')));
  ok('Zeile ' + a + ' hat KEINEN Pfeil daneben', !!z && !z.querySelector('.michev'));
});
var mitPfeil = [...m.querySelectorAll('.mi.michev, .mi')].filter(function(z){
  return z.querySelector('.mischalter') && z.querySelector('.michev'); });
ok('Nirgends Regler und Pfeil zugleich', mitPfeil.length === 0, mitPfeil.length);

/* ── 4 · Der Stand steht in aria-pressed ── */
var erin = m.querySelector('#mi-erin');
ME.mailOk = true;  malErinnerung();
ok('Erinnerung ein -> aria-pressed true', erin.getAttribute('aria-pressed') === 'true',
   erin.getAttribute('aria-pressed'));
ME.mailOk = false; malErinnerung();
ok('Erinnerung aus -> aria-pressed false', erin.getAttribute('aria-pressed') === 'false',
   erin.getAttribute('aria-pressed'));

var pk = m.querySelector('#mi-pk');
paintPasskey();
ok('Passkey traegt einen Stand', pk.hasAttribute('aria-pressed'), pk.getAttribute('aria-pressed'));

/* ── 5 · Passkey laesst das Menue offen ── */
m.classList.remove('zu'); menuAuf();
pk.dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Tipp auf Passkey schliesst das Menue NICHT', !m.classList.contains('zu'));
try{ pkBarZu(); }catch(e){}

/* ── 6 · Wischen nach rechts geht zurueck ──
   jsdom rechnet kein Layout, clientWidth ist also 0 — die Schwelle
   "ein Viertel der Breite" laesst sich hier nicht pruefen (das ist im
   Browser nachgemessen). Was hier zaehlt: die richtige Flaeche wird
   geschlossen, die Richtung stimmt, und der Loeschen-Griff bleibt
   unberuehrt. */
function zeiger(art, x, ziel){
  var e = new window.MouseEvent(art, { bubbles:true, clientX:x, clientY:400, button:0 });
  (ziel || document.querySelector('#menu')).dispatchEvent(e);
}
function wisch(von, bis, ziel){
  zeiger('pointerdown', von, ziel);
  zeiger('pointermove', von + (bis > von ? 12 : -12));
  zeiger('pointermove', bis);
  zeiger('pointerup', bis);
}

m.classList.remove('zu'); menuAuf();
kontenAuf(true);
ok('Konten offen', kontenOffen());
wisch(40, 900);
ok('Wisch nach rechts schliesst das Untermenue', !kontenOffen());
ok('Das Menue bleibt dabei offen', m.classList.contains('on') && !m.classList.contains('zu'));

kontenAuf(true);
wisch(900, 40);
ok('Wisch nach links loest nicht aus', kontenOffen());
kontenAuf(false);

dlAuf();
ok('Loeschen offen', dlOffen());
var griff = document.querySelector('#dlbox .dlz');
ok('Loeschen-Griff ist da', !!griff);
wisch(40, 900, griff);
ok('Wisch AUF dem Loeschen-Griff schliesst nicht', dlOffen());
wisch(40, 900);
ok('Wisch daneben schliesst schon', !dlOffen());

wisch(40, 900);
ok('Im Menue selbst schliesst der Wisch das Menue', m.classList.contains('zu'));

/* ── 7 · Fassungswechsel laedt die Seite neu ──
   In jsdom ist location.reload folgenlos, also laesst sich hier
   nachsehen, was vor dem Neustart passiert. */
try{ sessionStorage.removeItem('moji.fassung'); }catch(e){}
var vorher = document.documentElement.dataset.theme;
var mt = document.querySelector('meta[name=theme-color]');
ME = normalize({ id:'t2', vorname:'Marco', nachname:'R', dob:'1990-05-04', av:3 });
erscheinungUmschalten();
var nachher = document.documentElement.dataset.theme;
ok('Die Fassung kippt sofort', nachher !== vorher, vorher + ' → ' + nachher);
ok('theme-color geht mit',
   mt.content === (nachher === 'dark' ? '#0B0711' : '#F4F1FA'), mt.content);
ok('Die Wahl liegt im Geraetespeicher',
   localStorage.getItem('moji.erscheinung') === nachher,
   localStorage.getItem('moji.erscheinung'));
ok('Und im Profil', ME.erscheinung === nachher, ME.erscheinung);
var deckel = document.querySelector('.fassungsdeckel');
ok('Ein Deckel liegt auf', !!deckel);
ok('Der Vermerk fuer den Neustart steht',
   sessionStorage.getItem('moji.fassung') === '1',
   String(sessionStorage.getItem('moji.fassung')));
/* Ein zweiter Tipp darf nicht noch einen Deckel legen. */
erscheinungUmschalten();
ok('Ein zweiter Tipp prallt ab',
   document.querySelectorAll('.fassungsdeckel').length === 1,
   document.querySelectorAll('.fassungsdeckel').length + ' Deckel');
ok('Und kippt die Fassung nicht zurueck',
   document.documentElement.dataset.theme === nachher);
if (deckel) deckel.remove();
try{ sessionStorage.removeItem('moji.fassung'); }catch(e){}

/* ── 8 · Nach dem Neustart kein Vorspann ── */
ok('Es gibt einen Weg am Vorspann vorbei', typeof vorspannUeberspringen === 'function');
playIntro();
ok('Vorspann laeuft', window.__introLaeuft === true);
vorspannUeberspringen();
ok('Uebersprungen: Vorspann aus', window.__introLaeuft === false);
ok('Der Vorspann ist weg', document.querySelector('#splash').style.display === 'none');
ok('Die App ist da', document.querySelector('#app').classList.contains('on'));
ok('Und blendet kurz auf statt lang',
   document.body.classList.contains('fassung-neu'));

/* ── 9 · menuZu nimmt "sofort" zurueck ── */
m.classList.add('sofort');
menuZu();
window.__WEITER = function(){
  ok('Nach dem Schliessen ist "sofort" weg', !m.classList.contains('sofort'));
  ME = null;
  /* ── Dienstzeiten bearbeiten: kompakte Liste statt Formular ──
     Weiter oben wurde abgemeldet, ME ist also leer — hier wieder eins. */
  ME = normalize({ id:'tz', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04',
                   sched:defaultSched() });
  DRAFT = JSON.parse(JSON.stringify(ME.sched)); DRAFT.tab = 0; _hrOffen = null;
  var host = document.getElementById('sched-edit');
  renderZeiten(host, DRAFT, null);
  ok('Das Wochenintervall steht oben', host.querySelectorAll('[data-wc]').length === 4);
  ok('Sechs Tage, je eine Zeile',      host.querySelectorAll('.hz-tag').length === 6,
     host.querySelectorAll('.hz-tag').length);
  ok('Zugeklappt stehen keine Raeder da', host.querySelectorAll('.rad').length === 0);
  ok('Die Zeile nennt die Zeiten',
     /08:00–12:00/.test(host.querySelector('.hz-zeit').textContent),
     host.querySelector('.hz-zeit').textContent);

  host.querySelector('[data-tag="1"]').click();
  ok('Antippen klappt auf',           !!host.querySelector('.hz-tag.auf'));
  ok('Und zeigt vier Raeder',         host.querySelectorAll('.hz-tag.auf .rad').length === 4,
     host.querySelectorAll('.hz-tag.auf .rad').length);
  ok('Mit denselben Abschnitten wie im Funnel',
     host.querySelectorAll('.hz-tag.auf .za-seg').length === 2);
  ok('Nur einer auf einmal',          host.querySelectorAll('.hz-tag.auf').length === 1);

  /* Der Schalter im Abschnitt regelt sich selbst und zieht die Zeile nach. */
  host.querySelector('.hz-tag.auf .za-seg[data-seg="nm"] .za-seg-kopf').click();
  ok('Nachmittag aus',                DRAFT.weeks[0][1].nmOn === false);
  ok('Die Zeile zieht mit',           host.querySelector('.hz-zeit').textContent === '08:00–12:00',
     host.querySelector('.hz-zeit').textContent);
  ok('Und die Stunden auch',          host.querySelector('.hz-std').textContent === '4,00 h',
     host.querySelector('.hz-std').textContent);
  host.querySelector('[data-tag="1"]').click();
  ok('Nochmal antippen klappt zu',    !host.querySelector('.hz-tag.auf'));

  /* Mehr Wochen: Reiter, Uebernahme, laufende Woche */
  host.querySelector('[data-wc="2"]').click();
  ok('Zwei Wochen gemerkt',           DRAFT.weekCount === 2, DRAFT.weekCount);
  ok('Es gibt Wochenreiter',          host.querySelectorAll('[data-tab]').length === 2);
  ok('Und die Frage nach der laufenden Woche', host.querySelectorAll('[data-rot]').length === 2);
  ok('Ganze Woche uebernehmen geht',  host.querySelectorAll('[data-copy]').length === 1);

  /* Hinauswischen fragt nur, wenn sich etwas geaendert hat. */
  ok('Geaendert heisst fragen',       !schedGleich(ME.sched, DRAFT));
  hoursRaus();
  ok('Die Rueckfrage kommt',          document.getElementById('hrbar').classList.contains('on'));
  ok('Und nennt das Verwerfen',       /verwerfen/i.test(document.getElementById('hrbar').textContent));
  document.querySelector('#hrbar [data-hrzu]').click();

  /* ── Das Schloss ──
     Die Seite faengt verschlossen an; erst ein Tipp gibt sie frei. */
  var sperre = document.getElementById('hr-sperre');
  var nav = document.getElementById('hr-nav');
  var schloss = document.getElementById('hr-lock');
  ok('Es gibt einen Zurueck-Knopf', !!document.getElementById('hr-back'));
  ok('Und er traegt das Wort',
     /Zurück/.test(document.getElementById('hr-back').textContent),
     document.getElementById('hr-back').textContent.trim());
  ok('Die alte Augenbraue ist weg', !document.querySelector('#v-hours .eyebrow'));
  ok('Und die alte Ueberschrift auch', !document.querySelector('#v-hours h1.dis')
     && !!document.querySelector('#v-hours h1.obh'));
  hrSchloss(false);
  ok('Verschlossen beginnt es',       sperre.classList.contains('zu'));
  ok('Ohne Leiste zum Speichern',     nav.classList.contains('hide'));
  ok('Das Schloss ist zu',            schloss.getAttribute('aria-pressed') === 'false');
  schloss.click();
  ok('Ein Tipp sperrt auf',           !sperre.classList.contains('zu'));
  ok('Jetzt kommt die Leiste',        !nav.classList.contains('hide'));
  ok('Und das Schloss steht offen',   schloss.getAttribute('aria-pressed') === 'true');
  schloss.click();
  ok('Nochmal tippen sperrt wieder zu', sperre.classList.contains('zu')
     && nav.classList.contains('hide'));
  /* Ein Tipp ins Gesperrte weist aufs Schloss, statt nichts zu tun. */
  sperre.click();
  ok('Der Tipp ins Gesperrte stupst das Schloss', schloss.classList.contains('stups'),
     schloss.className);

  /* ── Zeitausgleich und Urlaubstage: Schloss und Raeder ── */
  ME.konten.zaStart = 6.5; ME.konten.topf = 25;
  var kSchloss = document.getElementById('k-lock');
  ok('Das Schloss ist dasselbe wie bei den Dienstzeiten',
     kSchloss.classList.contains('swz') && kSchloss.classList.contains('hr-schloss'),
     kSchloss.className);
  ok('Der alte Riegel ist weg', !document.querySelector('.kschloss'));
  kontenFrei(false);
  ok('Verschlossen steht kein Rad da', document.querySelectorAll('#konten .rad').length === 0);
  kontenFrei(true);
  ok('Aufgesperrt kommen zwei Raeder', document.querySelectorAll('#konten .rad').length === 2,
     document.querySelectorAll('#konten .rad').length);
  ok('Zeitausgleich in Viertelstunden',
     document.querySelectorAll('#k-za-rad .rad-roll i').length === 801,
     document.querySelectorAll('#k-za-rad .rad-roll i').length);
  ok('Urlaub in halben Tagen',
     document.querySelectorAll('#k-ur-rad .rad-roll i').length === 561,
     document.querySelectorAll('#k-ur-rad .rad-roll i').length);
  ok('Und das Rad steht auf dem Stand',
     document.querySelector('#k-za-rad .rad-roll i.on').textContent === '+6,50 h',
     document.querySelector('#k-za-rad .rad-roll i.on').textContent);
  ok('Auch beim Urlaub',
     document.querySelector('#k-ur-rad .rad-roll i.on').textContent === '25 Tage',
     document.querySelector('#k-ur-rad .rad-roll i.on').textContent);
  kontenFrei(false);
  ok('Zusperren raeumt die Raeder wieder weg',
     document.querySelectorAll('#konten .rad').length === 0);
  /* Ein Tipp auf die Kachel weist aufs Schloss. */
  document.querySelector('#konten .kbox').dispatchEvent(
    new window.MouseEvent('click', { bubbles:true }));
  ok('Der Tipp ins Gesperrte stupst auch hier', kSchloss.classList.contains('stups'),
     kSchloss.className);

  /* ── Ein Zahlenrad kann man auch allein pruefen ── */
  var probe = radZahl(0, 2, 0.5, 1.5, v => v + ' x', function(){});
  ok('radZahl baut die Stufen', probe.querySelectorAll('i').length === 5,
     probe.querySelectorAll('i').length);
  ok('Und faengt beim naechsten Wert an',
     probe.querySelector('i.on').textContent === '1.5 x',
     probe.querySelector('i.on') && probe.querySelector('i.on').textContent);

  /* ── Urlaubsanspruch: neues Schloss, kein Rad ── */
  var uaSchloss = document.getElementById('ua-lock');
  ok('Auch hier dasselbe Schloss', uaSchloss.classList.contains('hr-schloss'));
  uaFrei(false);
  ok('Verschlossen', !document.getElementById('uabox').classList.contains('frei'));
  uaSchloss.click();
  ok('Aufgesperrt', document.getElementById('uabox').classList.contains('frei'));
  ok('Und dort steht kein Rad', document.querySelectorAll('#uabox .rad').length === 0);

  /* ── Meine Firma und das Team ── */
  ok('Die Firmenkachel faengt zugeklappt an', document.getElementById('fi-zeilen').hidden);
  /* Die Marke des Dienstgebers statt eines gezeichneten Hauses. */
  ok('Die Kachel zeigt die Wortmarke',
     document.querySelector('#fi-karte .fk-logo img').getAttribute('src')
       .indexOf('firma-miller-wort') === 0,
     document.querySelector('#fi-karte .fk-logo img').getAttribute('src'));
  /* Das Bild statt des Hauses. Ein svg gibt es in der Zeile weiterhin —
     das ist der Pfeil am rechten Rand, den das Menue selbst anhaengt. */
  ok('Und die Menuezeile die Marke selbst',
     (document.querySelector('.mi[data-act="firma"] img') || {}).getAttribute
       && document.querySelector('.mi[data-act="firma"] img')
            .getAttribute('src').indexOf('firma-miller.png') === 0,
     document.querySelector('.mi[data-act="firma"]').innerHTML.slice(0, 80));
  /* Die Bubble Teas werden in den Details erklaert, nicht auf der Liste. */
  malFirma();
  ok('Alle zehn Getraenke stehen in den Details',
     document.querySelectorAll('#fi-zeilen .teek').length === 10,
     document.querySelectorAll('#fi-zeilen .teek').length);
  ok('Mit Namen und Schwelle',
     document.querySelector('#fi-zeilen .teek b').textContent === 'Ube Pop'
     && document.querySelectorAll('#fi-zeilen .teek u')[9].textContent === 'ab 91',
     document.querySelectorAll('#fi-zeilen .teek u')[9].textContent);
  ok('Und einer Erklaerung davor',
     document.querySelector('#fi-zeilen .fiz-tee b').textContent
       .indexOf('Zehn Stufen zum Freischalten') === 0);
  /* Der Hinweis zum Dienstgeber sass als eigener Kasten zwischen den
     Angaben und den Getraenken — dort trennte er, statt zu erklaeren. */
  ok('Kein eigener Kasten mehr',   document.querySelectorAll('#fi-zeilen .fihint').length === 0);
  ok('Der Hinweis steht beim Dienstgeber',
     document.querySelector('#fi-zeilen .fiz b small').textContent
       .indexOf('Fest eingestellt') === 0,
     document.querySelector('#fi-zeilen .fiz b small').textContent.slice(0, 40));
  ok('Fuenf gleich schwere Zeilen',
     [].slice.call(document.querySelectorAll('#fi-zeilen .fiz u'))
       .map(function(u){ return u.textContent; }).join('|')
     === 'Arbeitsort|Dein Dienstplan|Dabei seit|Feiertage|Bubble Tea',
     [].slice.call(document.querySelectorAll('#fi-zeilen .fiz u'))
       .map(function(u){ return u.textContent; }).join('|'));
  ok('Es gibt einen Zurueck-Knopf', !!document.getElementById('fi-back'));
  ok('Die alte Augenbraue ist weg', !document.querySelector('#v-firma .eyebrow'));

  /* Die Stufenrechnung muss dieselbe sein wie tee_level() in der Datenbank. */
  var stufen = [[0,0],[1,1],[2,1],[10,1],[11,2],[21,3],[31,4],[41,5],[51,6],
                [61,7],[71,8],[81,9],[90,9],[91,10],[500,10]];
  ok('Die Stufenrechnung stimmt mit der Datenbank ueberein',
     stufen.every(function(x){ return teeLevel(x[0]) === x[1]; }),
     stufen.map(function(x){ return x[0] + '→' + teeLevel(x[0]); }).join(' '));
  ok('Zehn Getraenke, zehn Namen', TEE.length === 10 && TEE[0].n === 'Ube Pop'
     && TEE[9].n === 'Ruby Royale');
  ok('Bei zehn ist Schluss', teeRest(91) === null && teeRest(500) === null);
  ok('Der erste Tee reicht fuer Stufe 1', teeRest(0).braucht === 1 && teeRest(0).bis === 1);
  ok('Danach sind es zehn', teeRest(1).braucht === 10 && teeRest(1).bis === 10,
     JSON.stringify(teeRest(1)));
  ok('Und die Naechste heisst richtig', teeRest(1).name === 'Blue Breeze', teeRest(1).name);

  /* „Zuletzt online" — die Leiter. */
  var vor = function(h){ return new Date(Date.now() - h * 3600e3).toISOString(); };
  ok('Bis vier Stunden: kuerzlich',   zuletztText(vor(1)) === 'kürzlich gesehen',
     zuletztText(vor(1)));
  ok('Spaeter am selben Tag: heute',  zuletztText(vor(5)).indexOf('heute') === 0
     || zuletztText(vor(5)) === 'gestern', zuletztText(vor(5)));
  ok('Ein Tag: gestern',              zuletztText(vor(24 * 1 + 12)) === 'gestern'
     || zuletztText(vor(24 * 1 + 12)) === 'vor 2 Tagen', zuletztText(vor(36)));
  /* Ohne regulaeren Ausdruck: der Pruefteil steckt in einer Vorlage,
     dort waere \\d nur ein d. */
  ok('Mehrere Tage werden gezaehlt',  zuletztText(vor(24 * 12)) === 'vor 12 Tagen',
     zuletztText(vor(24 * 12)));
  ok('Ab 41 Tagen wird es vage',      zuletztText(vor(24 * 60)) === 'es ist schon ewig her',
     zuletztText(vor(24 * 60)));
  ok('Ohne Zeitstempel steht nichts', zuletztText(null) === '');

  /* Die Liste selbst. */
  UID = 'u-ich';
  TEAM = [{user_id:'u-ich',vorname:'Marco',kuerzel:'R',avatar:5,filiale:'Linz',stufe:7,zuletzt:vor(0)},
          {user_id:'u-a',vorname:'Anna',kuerzel:'M',avatar:3,filiale:'Linz',stufe:7,zuletzt:vor(1)},
          {user_id:'u-c',vorname:'Clara',kuerzel:'W',avatar:9,filiale:'Linz',stufe:2,zuletzt:vor(74)}];
  TEE_PAARE = {'u-a':{punkte:25,heuteSchon:false},'u-c':{punkte:0,heuteSchon:false}};
  malTeam();
  var karten = document.querySelectorAll('#fi-team .tm');
  ok('Je Mitglied eine Karte',      karten.length === 3, karten.length);
  ok('Ich stehe zuerst',            karten[0].classList.contains('ich'));
  ok('Und ohne Sende-Knopf',        !karten[0].querySelector('[data-tee]'));
  ok('Name mit Anfangsbuchstaben',  karten[1].querySelector('.tm-t b').textContent === 'Anna M.',
     karten[1].querySelector('.tm-t b').textContent);
  /* Der Name stand am 15.09.2026 unsichtbar auf der Karte: die Klasse
     hiess mk, und mk gehoert der Mitarbeiterkarte, die color:var(--f-2)
     setzt — fast Weiss. Hier wird die Farbe wirklich nachgesehen. */
  var namFarbe = getComputedStyle(karten[1].querySelector('.tm-t b')).color;
  /* jsdom loest keine Variablen auf — es gibt "var(--tx)" zurueck. Genau
     das genuegt: faellt die Karte wieder in die Regeln der
     Mitarbeiterkarte, stuende hier var(--f-2). */
  ok('Der Name nimmt die Textfarbe der Seite',
     namFarbe.indexOf('--f-') === -1 && namFarbe.indexOf('255, 255, 255') === -1
     && namFarbe !== '', namFarbe || '(leer)');
  ok('Filiale und MOJI-Stufe',      karten[1].querySelector('.wo').textContent === 'Linz · Stufe 7 Uhrwerk',
     karten[1].querySelector('.wo').textContent);
  ok('Das geteilte Level steht rechts',
     karten[1].querySelector('.tm-lvl b').textContent === '3',
     karten[1].querySelector('.tm-lvl b').textContent);
  ok('Bei null bleibt die Box grau', karten[2].querySelector('.tm-lvl b').textContent === '0'
     && !karten[2].querySelector('.tm-lvl').classList.contains('an'));
  ok('Und der Becher ist blass',     !!karten[2].querySelector('.becher.leer'));
  ok('Der Becher passt zur Stufe',
     karten[1].querySelector('.becher').getAttribute('src') === 'tee-3.webp',
     karten[1].querySelector('.becher').getAttribute('src'));
  /* Wer heute schon geschickt hat, kann nicht noch einmal. */
  TEE_PAARE['u-a'].heuteSchon = true; malTeam();
  var a = document.querySelectorAll('#fi-team .tm')[1];
  ok('Heute schon geschickt heisst gesperrt', !!a.querySelector('.tm-send[disabled]')
     && a.querySelector('.tm-send').textContent.indexOf('Heute') > -1,
     a.querySelector('.tm-send').textContent.trim());
  /* Ein Fehler darf nicht wie eine leere Liste aussehen — genau das hat
     die falsche Leseregel verdeckt. */
  /* ── Reihenfolge, Herz und offener Tee ── */
  ME.besties = ['u-c'];
  TEAM = [{user_id:'u-ich',vorname:'Marco',kuerzel:'R',avatar:5,filiale:'',stufe:10,zuletzt:vor(0)},
          {user_id:'u-a',vorname:'Anna',kuerzel:'M',avatar:3,filiale:'',stufe:7,zuletzt:vor(1)},
          {user_id:'u-b',vorname:'Bernd',kuerzel:'K',avatar:7,filiale:'',stufe:4,zuletzt:vor(9)},
          {user_id:'u-c',vorname:'Clara',kuerzel:'W',avatar:9,filiale:'',stufe:2,zuletzt:vor(74)}];
  TEE_PAARE = {'u-a':{punkte:25,heuteSchon:false},'u-b':{punkte:35,heuteSchon:false},
               'u-c':{punkte:0,heuteSchon:false}};
  TEE_OFFEN = {'u-b':true};
  TEAM.sort(teamReihung); malTeam();
  var reihe = [].slice.call(document.querySelectorAll('#fi-team .tm'))
    .map(function(c){ return c.querySelector('.tm-t b').textContent.replace(' · du',''); });
  ok('Ich, dann der offene Tee, dann das Herz, dann der Rest',
     reihe.join(',') === 'Marco R.,Bernd K.,Clara W.,Anna M.', reihe.join(','));
  var bernd = document.querySelectorAll('#fi-team .tm')[1];
  ok('Der offene Tee faerbt die Karte', bernd.classList.contains('offen'));
  ok('Und sagt es auch',                !!bernd.querySelector('.tm-neu'));
  ok('Das Herz ist bei der Bestie gesetzt',
     document.querySelectorAll('#fi-team .tm')[2]
       .querySelector('.tm-herz').getAttribute('aria-pressed') === 'true');
  ok('Beim Rest nicht',
     document.querySelectorAll('#fi-team .tm')[3]
       .querySelector('.tm-herz').getAttribute('aria-pressed') === 'false');
  ok('Der Bildrahmen traegt die Farbe der Stufe',
     bernd.getAttribute('style').indexOf('--rang:' + RAENGE[3].a) > -1,
     bernd.getAttribute('style'));
  ok('Ich selbst habe kein Herz und kein Level',
     !document.querySelectorAll('#fi-team .tm')[0].querySelector('.tm-rechts'));
  /* Antippen merkt es im Profil — und der andere erfaehrt nichts davon. */
  document.querySelectorAll('#fi-team .tm')[3].querySelector('.tm-herz')
    .dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
  ok('Ein Tipp markiert',  ME.besties.indexOf('u-a') > -1, ME.besties.join(','));
  document.querySelectorAll('#fi-team .tm')[3].querySelector('.tm-herz')
    .dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
  ok('Nochmal hebt auf',   ME.besties.indexOf('u-a') === -1, ME.besties.join(','));
  ok('Die Reihe bleibt beim Antippen stehen',
     document.querySelectorAll('#fi-team .tm')[3]
       .querySelector('.tm-t b').textContent === 'Anna M.');

  /* ── Offene Tees aus den Daten der Datenbank ── */
  UID = 'u-ich';
  var offen = teeOffenAus([
    { a:'u-ich', b:'u-b', letzt_a:'2026-09-10', letzt_b:'2026-09-14' },  /* er zuletzt */
    { a:'u-ich', b:'u-a', letzt_a:'2026-09-14', letzt_b:'2026-09-10' },  /* ich zuletzt */
    { a:'u-c',   b:'u-ich', letzt_a:'2026-09-14', letzt_b:null },        /* nur er */
    { a:'u-ich', b:'u-d', letzt_a:'2026-09-14', letzt_b:'2026-09-14' }   /* gleich */
  ]);
  ok('Offen ist nur, wer zuletzt geschickt hat',
     Object.keys(offen).sort().join(',') === 'u-b,u-c', Object.keys(offen).sort().join(','));

  /* ── Der Zaehler: rot, violett, halb und halb ── */
  var z = document.getElementById('av-zaehler');
  _zaehlerFrei = true;
  ME.gelesen = alleNachrichten().map(function(n){ return n.id; });
  TEE_OFFEN = {}; malZaehler();
  ok('Ohne alles kein Punkt', z.hidden);
  TEE_OFFEN = {'u-b':true}; malZaehler();
  ok('Nur Tee: violett und eins', !z.hidden && z.textContent === '1'
     && z.classList.contains('tee') && !z.classList.contains('beides'), z.className);
  ok('Und im Menue steht es auch',
     document.getElementById('fi-zaehler').textContent === '1'
     && !document.getElementById('fi-zaehler').hidden);
  /* An der Ecke der Symbolkachel, wie der rote am Briefsymbol — frei in
     der Zeile war er ein fremder Punkt zwischen Bild und Text. */
  ok('Er sitzt an der Ecke des Symbols',
     document.getElementById('fi-zaehler').parentNode.classList.contains('miico'),
     document.getElementById('fi-zaehler').parentNode.className);
  ME.gelesen = []; malZaehler();
  var summe = pfNeu().length + aufOffen() + 1;
  ok('Beides: halb und halb, Zahl zusammengezaehlt',
     z.classList.contains('beides') && z.textContent === String(summe),
     z.className + ' ' + z.textContent);
  TEE_OFFEN = {}; malZaehler();
  ok('Nur Nachrichten: wieder rot',
     !z.classList.contains('tee') && !z.classList.contains('beides'), z.className);
  ME.besties = []; TEE_OFFEN = {};

  TEAM = []; TEAM_FEHLER = 'keine Rechte';
  malTeam();
  ok('Ein Fehler wird benannt',
     document.getElementById('fi-team').textContent.indexOf('nicht laden') > -1
     && document.getElementById('fi-team').textContent.indexOf('keine Rechte') > -1,
     document.getElementById('fi-team').textContent.trim().slice(0, 70));
  TEAM_FEHLER = ''; malTeam();
  ok('Ohne Fehler steht die leere Liste da',
     document.getElementById('fi-team').textContent.indexOf('Noch niemand') > -1);

  TEAM = null; TEE_PAARE = {}; UID = null;

  window.__FERTIG = true;
};
setTimeout(window.__WEITER, 400);
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

setTimeout(() => {
  const E = dom.window.__E || [];
  const _roh = roh;

  /* ── 7 · Die Regeln, auf denen die Masse beruhen ──
     jsdom rechnet kein Layout. Geprueft wird deshalb, dass die Regeln
     in der Datei stehen; die Masse selbst sind im Browser nachgemessen. */
  const css = [
    ['Karte laesst sich nicht seitlich schieben', /overflow-y:auto;\s*overflow-x:hidden/],
    ['Zeilen fahren nicht mehr von der Seite herein', /@keyframes miInVoll\{\s*from\{\s*opacity:0\s*\}\s*\}/],
    ['Karte skaliert beim Oeffnen nicht mehr', /@keyframes menuBlende\{\s*from\{\s*opacity:0\s*\}\s*\}/],
    ['Untermenues sind fest am Fenster', /\.avgrid, \.konten, \.uabox, \.rangbox, \.dlbox, #konten, #uabox\{\s*\n\s*position:fixed; inset:0/],
    ['mbody hebt sich ueber die Fusszeile', /\.menu-card\.dlauf \.mbody\{ z-index:6 \}/],
    ['Zurueck-Pfeil sitzt fest', /\.rangbox \.zurueckbtn, \.dlbox \.zurueckbtn\{\s*\n\s*position:fixed/],
    ['Profilbild ohne Fuge zwischen Rahmen und Bild', /\.avbig::after\{content:'';position:absolute;inset:0/],
    ['Regler haengt an aria-pressed', /\.mi\[aria-pressed="true"\] \.mischalter\{ background:var\(--butter\) \}/],
   /* Das Kopfskript muss VOR dem Stilblock stehen, sonst wird erst hell
      gezeichnet und dann umgeschaltet — ein Aufblitzen bei jedem Start. */
   ['Die Fassung steht vor dem ersten Anstrich',
    roh.indexOf("localStorage.getItem('moji.erscheinung')") < roh.indexOf('<style')],
   ['Der Deckel traegt die Farbe der neuen Fassung',
    /\.fassungsdeckel\{[\s\S]{0,120}background:var\(--ink\)/],
   ['Nach dem Wechsel kommt kein Gruss', /afterLogin\(session, !FASSUNG_NEU\)/],
   /* Das alte Formular ist am 14.09.2026 entfallen — mitsamt Schloessern
      und Zeit-Popover. Es darf nicht zurueckkommen. */
   ['Kein altes Dienstplan-Formular mehr', !/function renderSched\(/.test(roh)],
   ['Kein Zeit-Popover mehr',              !/function openTime\(/.test(roh)],
   /* Das meint die zwei Schloesser im alten Formular, nicht das eine,
      das seit 14.09.2026 die ganze Seite sperrt. */
   ['Kein schlossHtml aus dem alten Formular', !/function schlossHtml\(/.test(roh)],
   ['Hinauswischen ist verdrahtet',        /wireWischRaus\('v-hours', hoursRaus\)/],
   ['Die Raeder ziehen nur senkrecht',     /\.rad-roll\{[\s\S]{0,200}touch-action:pan-y/],
   /* Die Seite bringt ihre eigene Kopfzeile mit — dann darf die der App
      dort nicht auch noch stehen. */
   ['Dienstzeiten ohne Kopfleiste',        /id === 'v-hours'/.test(roh)],
   ['Das Gesperrte ist taub',              /\.hr-sperre\.zu > \*\{ pointer-events:none \}/.test(roh)],
   ['Und bleibt lesbar',                   /\.hr-sperre\.zu\{ opacity:\.46 \}/.test(roh)],
   /* Die Plus-Minus-Knoepfe bei Zeitausgleich und Urlaub sind am
      14.09.2026 den Raedern gewichen. */
   ['Keine Stepper mehr bei den Staenden',  !/data-kstep/.test(roh)],
   ['Verschlossen bleibt der Anspruch lesbar',
    /#uabox \.zabtn,#uabox \.uaein\{opacity:\.3;pointer-events:none\}/.test(roh)],
   /* Das Blatt der Anmeldung kommt im Takt der Tastatur, nicht langsamer. */
   ['Das Blatt hat eine eigene Kurve',      /--ease-blatt:cubic-bezier/.test(roh)],
   ['Und faehrt in einer Drittelsekunde',   /animation:blattRein \.34s var\(--ease-blatt\)/.test(roh)],
   ['Der Inhalt kommt einen Hauch spaeter', /@keyframes blattInhalt/.test(roh)],
   /* Das Team steht in eigenen Tabellen — records bleibt privat. */
   ['Das Team kommt nicht aus records',
    /from\('mitglieder'\)/.test(roh) && !/from\('records'\)[\s\S]{0,200}mitglieder/.test(roh)],
   ['Senden laeuft ueber die Datenbank', /sb\.rpc\('tee_senden'/.test(roh)],
   ['Zuletzt online wird gemeldet',      /sb\.rpc\('moji_gesehen'\)/.test(roh)],
   ['Hinauswischen ist verdrahtet',      /wireWischRaus\('v-firma', firmaZu\)/.test(roh)],
   /* Die Leseregel darf sich nicht selbst abfragen. */
   ['Die Leseregel fragt nicht sich selbst',
    !/using \(\s*\n?\s*firma = \(select m\.firma from public\.mitglieder/.test(policy)],
   ['Sich selbst sieht man immer',  /user_id = auth\.uid\(\)\s*--/.test(policy)],
   /* Die Teamkarte hat ein eigenes Praefix, damit sie nicht in die
      Regeln der Mitarbeiterkarte faellt. */
   ['Die Teamkarte heisst tm, nicht mk',
    /'<article class="tm'/.test(roh) && !/class="mk-t"/.test(roh.slice(roh.indexOf('function malTeam'), roh.indexOf('function malFirma')))],
   ['Und die Mitarbeiterkarte behaelt ihr mk', /\.mk\{position:relative;overflow:hidden/.test(roh)],
   ['Die Firma kommt aus einer eigenen Funktion',
    /create or replace function public\.meine_firma\(\)/.test(policy)
    && /security definer/.test(policy)],
   /* Bestehende Konten kommen ueber einen Ausloeser an records ins
      Team — nicht erst, wenn jemand die Ansicht aufmacht. */
   ['Ein Ausloeser zieht das Team nach', /create trigger records_mitglied/.test(policy)],
   ['Und er darf das Sichern nie aufhalten',
    /exception when others then/.test(policy) && /raise warning 'mitglied_nachziehen/.test(policy)],
   ['Die Stufe rechnet die Datenbank wie die App',
    /create or replace function public\.moji_stufe/.test(policy)
    && /\/ 4\s*\n?\s*\) \+ 1/.test(policy)],
   ['Ohne Namen kein Eintrag', /if vn = '' then/.test(policy)],
   ['Der Nachzug prueft sich selbst', /Nachzug unvollstaendig/.test(policy)],
   /* Die Zeile aus dem Menue brachte margin:26px 20px mit und machte die
      Seite breiter als den Schirm. */
   ['Die Firmenansicht laeuft nicht ueber', /#v-firma\{ overflow-x:hidden \}/.test(roh)
    && /#v-firma \.fi-sek\{ margin-top:26px/.test(roh)],
   /* Die spaetere Regel .mi > .miico gewaenne bei gleicher Spezifitaet. */
   ['Die Firmenkachel im Menue setzt sich durch',
    /\.mi\.mi-firma > \.miico\{ padding:0; background:#030B21/.test(roh)],
   ['Die Getraenkeleiste kann schmaler werden als ihr laengstes Wort',
    /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/.test(roh)],
   ['Der Zaehler haengt an der Symbolkachel',
    /\.mi \.miico > \.zaehler\{position:absolute;top:-7px;right:-7px/.test(roh)],
   /* overflow:hidden auf der Kachel schnitt den Zaehler an der Ecke ab —
      ueber dem Firmenlogo blieb nur eine violette Sichel ohne Zahl. */
   ['Die Firmenkachel schneidet den Zaehler nicht ab',
    !/\.mi\.mi-firma > \.miico\{[^}]*overflow:hidden/.test(roh)
    && /\.mi\.mi-firma > \.miico img\{[^}]*border-radius:inherit/.test(roh)],
   ['Der Zaehler liegt ueber dem Logo',
    /\.mi \.miico > \.zaehler\{[^}]*z-index:2\}/.test(roh)],
   ['Halb rot, halb violett gibt es wirklich',
    /\.zaehler\.beides\{background:linear-gradient\(90deg,#FF453A 0 50%,var\(--butter\) 50% 100%\)\}/.test(roh)]
  ];
  /* Manche Pruefungen sind ein Muster, manche schon ein Ja/Nein. */
  css.forEach(([n, re]) => {
    const gut = (typeof re === 'boolean') ? re : re.test(roh);
    E.push({ n, ok: gut, z: gut ? '' : 'Regel fehlt' });
  });

  let schlecht = 0;
  console.log('');
  E.forEach(e => {
    if (!e.ok) schlecht++;
    console.log((e.ok ? '  ok   ' : '  FEHL ') + e.n + (e.ok || !e.z ? '' : '  → ' + e.z));
  });
  console.log('');
  console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
  process.exit(schlecht || !dom.window.__FERTIG ? 1 : 0);
}, 1400);
