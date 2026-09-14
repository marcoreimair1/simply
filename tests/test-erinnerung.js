/* Testlauf: einmalige Frage nach der Monats-Erinnerung.
   Lädt index.html in jsdom, spielt die Zustände durch und prüft.
   Ohne ?desktop=1 — dann ist AM_HANDY false, boot() kehrt sofort zurück
   und es wird nichts aus der Cloud geladen. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

/* Zu pruefen ist index.html im Projekt — oder, als Argument
   uebergeben, eine andere Fassung. Nach jedem Push ist das die
   heruntergeladene Datei von moji-app.at. */
const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');

const HTML = fs.readFileSync(DATEI, 'utf8');

const vc = new VirtualConsole();          /* Rauschen aus: canvas, video, CDN */
vc.on('jsdomError', () => {});
vc.on('error', () => {});
vc.on('warn', () => {});

const dom = new JSDOM(HTML, {
  url: 'https://moji-app.at/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc
});

const pruef = `
window.__E = [];
function ok(name, bedingung, zusatz){
  window.__E.push({ name: name, ok: !!bedingung, zusatz: zusatz === undefined ? '' : String(zusatz) });
}

/* ── 0 · Sicherheit: nie in einer angemeldeten Sitzung rechnen ── */
ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

/* ── 1 · normalize: altes Profil bekommt mailGefragt = false ── */
const alt = normalize({ id:'pTest1', vorname:'Alt', nachname:'Profil', dob:'1990-01-01' });
ok('normalize setzt mailGefragt = false', alt.mailGefragt === false, alt.mailGefragt);
ok('normalize setzt mailOk = false',      alt.mailOk === false,      alt.mailOk);

/* Ein Profil, das schon geantwortet hat, wird nicht zurückgesetzt */
const schon = normalize({ id:'pTest2', vorname:'Schon', dob:'1990-01-01', mailGefragt:true, mailOk:true });
ok('normalize lässt mailGefragt = true stehen', schon.mailGefragt === true);
ok('normalize lässt mailOk = true stehen',      schon.mailOk === true);

/* ── 2 · erinFrageNoetig: die vier Bedingungen ── */
CLOUD_ON = true; UID = 'test-uid'; MAIL = 'test@moji-app.at';
ME = normalize({ id:'pTest3', vorname:'Frage', dob:'1990-01-01' });
ok('Altes Profil wird gefragt', erinFrageNoetig() === true);

ME.mailOk = true;
ok('Wer schon zugestimmt hat, wird nicht gefragt', erinFrageNoetig() === false);

ME.mailOk = false; ME.mailGefragt = true;
ok('Wer schon geantwortet hat, wird nicht gefragt', erinFrageNoetig() === false);

ME.mailGefragt = false;
MAIL = '';
ok('Ohne Adresse wird nicht gefragt', erinFrageNoetig() === false);
MAIL = 'test@moji-app.at';

CLOUD_ON = false;
ok('Ohne Cloud wird nicht gefragt', erinFrageNoetig() === false);
CLOUD_ON = true;

const merkeME = ME; ME = null;
ok('Ohne Profil wird nicht gefragt', erinFrageNoetig() === false);
ME = merkeME;

/* ── 3 · Die Ansicht ── */
ok('Ansicht v-erinask vorhanden',  !!document.getElementById('v-erinask'));
ok('Knopf Ja vorhanden',           !!document.getElementById('erin-ask-ja'));
ok('Knopf Nein vorhanden',         !!document.getElementById('erin-ask-no'));
ok('Platzhalter Adresse vorhanden',!!document.getElementById('erin-ask-mail'));

/* Beide Knöpfe sind echte Knöpfe, keiner ist ein Textlink */
const bJa = document.getElementById('erin-ask-ja');
const bNo = document.getElementById('erin-ask-no');
ok('Ja-Knopf ist ein .btn',   bJa.classList.contains('btn'), bJa.className);
ok('Nein-Knopf ist ein .btn', bNo.classList.contains('btn'), bNo.className);
ok('Nein-Knopf ist kein linkbtn', !bNo.classList.contains('linkbtn'), bNo.className);

/* ── 4 · askErinnerung zeigt die Ansicht und trägt die Adresse ein ── */
let weiterGelaufen = 0;
ME.mailGefragt = false; ME.mailOk = false;
askErinnerung(() => { weiterGelaufen++; });
ok('Ansicht wird gezeigt', document.getElementById('v-erinask').classList.contains('on'));
ok('weiter() läuft noch nicht', weiterGelaufen === 0, weiterGelaufen);
ok('Adresse steht in der Ansicht',
   document.getElementById('erin-ask-mail').textContent === 'test@moji-app.at',
   document.getElementById('erin-ask-mail').textContent);

/* ── 5 · Ja drücken ── */
bJa.dispatchEvent(new window.Event('click', { bubbles:true }));
ok('Ja setzt mailOk',           ME.mailOk === true,      ME.mailOk);
ok('Ja setzt mailGefragt',      ME.mailGefragt === true, ME.mailGefragt);
ok('Ja läuft weiter',           weiterGelaufen === 1,    weiterGelaufen);

/* ── 6 · Nein drücken, frisches Profil ── */
ME = normalize({ id:'pTest4', vorname:'Nein', dob:'1990-01-01' });
weiterGelaufen = 0;
askErinnerung(() => { weiterGelaufen++; });
bNo.dispatchEvent(new window.Event('click', { bubbles:true }));
ok('Nein lässt mailOk aus',     ME.mailOk === false,     ME.mailOk);
ok('Nein setzt mailGefragt',    ME.mailGefragt === true, ME.mailGefragt);
ok('Nein läuft weiter',         weiterGelaufen === 1,    weiterGelaufen);

/* ── 7 · Zweites Mal wird durchgereicht, ohne Ansicht ── */
weiterGelaufen = 0;
askErinnerung(() => { weiterGelaufen++; });
ok('Beim zweiten Mal keine Frage mehr', weiterGelaufen === 1, weiterGelaufen);

/* ── 8 · Postfach-Nachricht ── */
const neu = NACHRICHTEN.filter(n => n.id === 'erinnerung-2026-09');
ok('Nachricht angelegt', neu.length === 1);
ok('Nachricht nutzt die Glocke', neu[0] && neu[0].art === 'glocke', neu[0] && neu[0].art);
ok('Glocke ist in POST_ZEICHEN definiert', !!POST_ZEICHEN['glocke']);
const kennungen = NACHRICHTEN.map(n => n.id);
ok('Keine doppelten Kennungen', new Set(kennungen).size === kennungen.length, kennungen.join(', '));

/* ── 8b · Das Postfach: Liste statt Textwand ──
   Bis 14.09.2026 stand jede Nachricht sofort in voller Laenge da, und ob
   eine gelesen war, sah man kaum. */
ME = normalize({ id:'pPost', vorname:'Post', dob:'1990-01-01' });
ME.gelesen = [];
_pfOffen = undefined;
malPostfach();
const karten = document.querySelectorAll('#pf-liste .pfm');
ok('Je Nachricht eine Karte', karten.length === NACHRICHTEN.length, karten.length);
ok('Nur eine steht offen', document.querySelectorAll('#pf-liste .pfm.auf').length === 1);
ok('Und zwar die neueste', _pfOffen === NACHRICHTEN[0].id, _pfOffen);
ok('Aufgeklappt heisst gelesen', ME.gelesen.indexOf(NACHRICHTEN[0].id) > -1);
ok('Gelesene tragen einen Haken', !!karten[0].querySelector('.pfm-haken'));
ok('Ungelesene tragen die Pille', !!karten[1].querySelector('.pfm-marke'),
   karten[1].className);
ok('Zugeklappt steht kein Text da', !karten[1].querySelector('.pfm-text'));
ok('Die Zahl oben stimmt schon',
   document.getElementById('pf-sub').textContent === (NACHRICHTEN.length - 1) + ' neue Nachrichten',
   document.getElementById('pf-sub').textContent);
/* Antippen klappt auf und vermerkt. */
karten[1].querySelector('[data-pf]').dispatchEvent(new window.MouseEvent('click', { bubbles:true }));
ok('Ein Tipp klappt die naechste auf', _pfOffen === NACHRICHTEN[1].id, _pfOffen);
ok('Und vermerkt sie',           ME.gelesen.indexOf(NACHRICHTEN[1].id) > -1);
ok('Die erste ist wieder zu',    document.querySelectorAll('#pf-liste .pfm.auf').length === 1);

/* ── 8c · MOJI stellt sich vor ── */
const vor = NACHRICHTEN.filter(n => n.id === 'moji-stellt-sich-vor-2026-09')[0];
ok('Die Vorstellung liegt im Postfach', !!vor);
ok('Sie steht ganz oben',        NACHRICHTEN[0] === vor);
ok('Und bringt ein Bild mit',    vor.bild === true);
_pfOffen = vor.id; malPostfach();
const bild = document.querySelector('#pf-liste .pfm.auf .pfm-bild img');
ok('Das Bild ist MOJI selbst',
   !!bild && (bild.getAttribute('src') || '').indexOf('data:image/webp') === 0);
ok('Aufzaehlungen werden zur Liste',
   document.querySelectorAll('#pf-liste .pfm.auf li').length === 5,
   document.querySelectorAll('#pf-liste .pfm.auf li').length);
ok('Und Betontes wird fett',
   document.querySelectorAll('#pf-liste .pfm.auf li b').length === 5);
ok('Kein Sternchen bleibt im Text stehen',
   document.querySelector('#pf-liste .pfm.auf').textContent.indexOf('*') === -1);

/* ── 9 · Der Umschalter im Profilmenü setzt mailGefragt mit ──
   erinUmschalten() wartet 760 ms auf seine Animation, darum asynchron. */
(async function(){
  ME = normalize({ id:'pTest5', vorname:'Menue', dob:'1990-01-01' });
  ok('Vor dem Umschalten steht mailGefragt auf false', ME.mailGefragt === false);
  erinUmschalten();
  await new Promise(r => setTimeout(r, 1100));
  ok('Umschalten setzt mailOk',      ME.mailOk === true,      ME.mailOk);
  ok('Umschalten setzt mailGefragt', ME.mailGefragt === true, ME.mailGefragt);
  ok('Danach wird nicht mehr gefragt', erinFrageNoetig() === false);

  /* ── 10 · Funnel: wer den Funnel durchläuft, gilt als gefragt ──
     sichereProfil() liest die Funnel-Felder direkt aus dem DOM. */
  ME = null; _funnelId = null;
  document.getElementById('in-vn').value = 'Funnel';
  document.getElementById('in-nn').value = 'Person';
  const dobFelder = document.querySelectorAll('[data-dob="ob"] input');
  dobFelder[0].value = '01'; dobFelder[1].value = '01'; dobFelder[2].value = '1990';
  OB.months = new Set(); OB.mailOk = false;
  const p = sichereProfil();
  ok('Funnel legt ein Profil an', !!p, p && p.vorname);
  ok('Funnel setzt mailGefragt', !!p && p.mailGefragt === true, p && p.mailGefragt);
  ok('Funnel lässt mailOk ohne Häkchen aus', !!p && p.mailOk === false, p && p.mailOk);

  /* Ohne Cloud zeigt der Funnel kein Häkchen — dann wurde auch nichts gefragt */
  CLOUD_ON = false; ME = null; _funnelId = null;
  const p2 = sichereProfil();
  ok('Ohne Cloud bleibt mailGefragt false', !!p2 && p2.mailGefragt === false, p2 && p2.mailGefragt);
  CLOUD_ON = true;

  window.__FERTIG = true;
})();
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

/* Der asynchrone Teil braucht gut eine Sekunde — abwarten, nicht raten. */
(async function(){
  const bis = Date.now() + 8000;
  while (!dom.window.__FERTIG && Date.now() < bis) {
    await new Promise(r => setTimeout(r, 100));
  }
  if (!dom.window.__FERTIG) {
    console.log('\n  FEHL  Testlauf wurde nicht fertig — der asynchrone Teil hängt.');
    process.exit(1);
  }

  const E = dom.window.__E || [];
  let schlecht = 0;
  console.log('');
  E.forEach(e => {
    if (!e.ok) schlecht++;
    console.log((e.ok ? '  ok   ' : '  FEHL ') + e.name + (e.ok || !e.zusatz ? '' : '  → ' + e.zusatz));
  });
  console.log('');
  console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
  process.exit(schlecht ? 1 : 0);
})();
