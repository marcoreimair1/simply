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
   ['Der Inhalt kommt einen Hauch spaeter', /@keyframes blattInhalt/.test(roh)]
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
