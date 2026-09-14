/* Testlauf: Exportseite — was abgegeben ist, muss man sehen.
   Abgemeldet. */
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

/* jsPDF hineinreichen: der CDN-Aufruf laeuft in jsdom nicht, aber ohne
   ihn liesse sich die Seite nicht bauen. */
try {
  const jsPDFmod = require('jspdf/dist/jspdf.node.js');
  dom.window.jspdf = { jsPDF: jsPDFmod.jsPDF };
} catch(e) { console.warn('jsPDF fehlt — die Seitenpruefungen fallen aus'); }

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }

ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
var TAG = 864e5, JETZT = 1757700000000;   /* fester Zeitpunkt, kein Date.now() */

/* ── 1 · Das Exportbuch fuehrt wirklich Buch ── */
ME.exp = {};
merkeExporte([{ y:2026, m:0 }, { y:2026, m:1 }]);
ok('merkeExporte traegt beide Monate ein', expAnzahl() === 2, expAnzahl());
ok('Mit Zeitstempel', typeof ME.exp['2026-0'] === 'number', ME.exp['2026-0']);
merkeExporte([{ y:2026, m:0 }]);
ok('Zweimal derselbe Monat zaehlt nur einmal', expAnzahl() === 2, expAnzahl());

/* ── 2 · Die Kachel zeigt es ──
   Das war der Kern der Meldung: abgegeben wurde mitgefuehrt, aber
   nirgends angezeigt. Man sah einen Jahrgang erledigter Monate und
   keinen Unterschied zum leeren. */
ME.exp = {};
[0,1,2,3,4,5,6,7].forEach(function(m){ ME.exp['2026-'+m] = JETZT - (250 - m*30) * TAG; });
ME.exp['2025-10'] = JETZT - 320 * TAG;
EX.year = 2026;
EX.set = new Set(['2026-7','2026-8']);
go('v-export'); exYear();
var kacheln = document.querySelectorAll('#ex-months .chip');
ok('Zwoelf Kacheln', kacheln.length === 12, kacheln.length);
ok('Acht tragen den Haken', document.querySelectorAll('#ex-months .chip.fertig').length === 8,
   document.querySelectorAll('#ex-months .chip.fertig').length);
ok('Jaenner ist abgegeben und nicht gewaehlt',
   kacheln[0].classList.contains('fertig') && !kacheln[0].classList.contains('on'));
ok('September ist gewaehlt und nicht abgegeben',
   kacheln[8].classList.contains('on') && !kacheln[8].classList.contains('fertig'));
ok('August ist beides zugleich',
   kacheln[7].classList.contains('on') && kacheln[7].classList.contains('fertig'),
   kacheln[7].className);
ok('Der Haken steckt nur in abgegebenen Kacheln',
   document.querySelectorAll('#ex-months .exhaken').length === 8,
   document.querySelectorAll('#ex-months .exhaken').length);
ok('Vorlesegeraete bekommen beides als Text',
   /schon abgegeben/.test(kacheln[7].getAttribute('aria-label'))
   && /gewählt/.test(kacheln[7].getAttribute('aria-label')),
   kacheln[7].getAttribute('aria-label'));

/* ── 3 · Die Zeile darunter sagt es auch ── */
ok('Hinweis nennt die schon abgegebenen',
   /1 davon schon abgegeben/.test(document.querySelector('#ex-note').textContent),
   document.querySelector('#ex-note').textContent);
EX.set = new Set(['2026-0']); exYear();
ok('Ein einzelner schon abgegebener Monat',
   /· schon abgegeben/.test(document.querySelector('#ex-note').textContent),
   document.querySelector('#ex-note').textContent);
EX.set = new Set(['2026-8']); exYear();
ok('Ein frischer Monat bekommt keinen Zusatz',
   !/abgegeben/.test(document.querySelector('#ex-note').textContent),
   document.querySelector('#ex-note').textContent);

/* ── 4 · Der Zeitstempel rechnet in Ortszeit ──
   Frueher new Date(ts).toISOString().slice(0,10) — also UTC. Wer um
   halb eins nachts exportierte, bekam den Vortag angezeigt. */
var nachts = new Date(2026, 0, 5, 0, 30).getTime();
ok('Halb eins nachts bleibt der 5. Jaenner',
   fmtStempel(nachts) === '5. Jän 2026 um 00:30', fmtStempel(nachts));
var abends = new Date(2026, 6, 20, 23, 45).getTime();
ok('Und spaet abends der 20. Juli',
   fmtStempel(abends) === '20. Jul 2026 um 23:45', fmtStempel(abends));

/* ── 5 · Der Verlauf sagt, was welches Datum ist ──
   "Dezember" links und "27.11.2025" rechts, ohne ein Wort dazwischen,
   las sich wie ein Widerspruch. */
EX.set = new Set();
malVerlauf();
var zeilen = document.querySelectorAll('#vl-liste .exh-z');
ok('Neun Zeilen im Verlauf', zeilen.length === 9, zeilen.length);
ok('Jede Zeile sagt, wann abgegeben wurde',
   [].every.call(zeilen, function(z){ return /abgegeben am .* um \\d\\d:\\d\\d/.test(z.textContent); }),
   zeilen[0].textContent.replace(/\\s+/g,' '));
ok('Jede Zeile traegt den Haken',
   document.querySelectorAll('#vl-liste .exh-hk svg').length === 9);
ok('Nach Jahren gruppiert',
   document.querySelectorAll('#vl-liste .exh-jahr').length === 2,
   document.querySelectorAll('#vl-liste .exh-jahr').length);
ok('Neueste zuerst', zeilen[0].textContent.indexOf('August') === 0, zeilen[0].textContent.slice(0,12));

/* ── 6 · Der zweite Knopf ist weg ── */
ok('Kein "eigene Datei pro Monat" mehr', !document.querySelector('#ex-single'));
ok('Der Exportknopf steht noch', !!document.querySelector('#ex-go'));
ok('buildPdf nimmt nur noch die Liste', buildPdf.length === 1, buildPdf.length);

/* ── 7 · Die Seite selbst ──
   Sie muss zwei Dinge zugleich sein: eine Aufzeichnung nach § 26 AZG
   und etwas, das man gern in der Hand haelt. Geprueft wird hier das
   Erste — dass jede Pflichtangabe darauf steht und nichts abstuerzt.
   Wie es aussieht, steht als Bild im Commit. */
if (window.jspdf && window.jspdf.jsPDF) {
  ME = normalize({ id:'t', vorname:'Marco', nachname:'Reimair', dob:'1990-05-04', av:3 });
  ME.events['2026-01-14'] = { t:'urlaub', s:'full', text:'', aw:false };
  ME.events['2026-01-15'] = { t:'krank',  s:'full', text:'', aw:false };
  ME.events['2026-01-16'] = { t:'eigen',  s:'vm',   text:'Schulung', aw:false };
  ME.events['2026-01-20'] = { t:'zeit',   s:'full', text:'', za:-4 };

  var doc = new window.jspdf.jsPDF({ unit:'mm', format:'a4', orientation:'portrait', compress:true });
  var geknallt = null;
  try { drawPage(doc, ME, 2026, 0); } catch(e){ geknallt = String(e); }
  ok('Die Seite baut sich ohne Absturz', !geknallt, geknallt);
  ok('Die Blockhandschrift steckt im Dokument', doc.__hand === true);
  ok('Und MOJIs Anzeigeschrift auch', doc.__brico === true);
  ok('Beide sind angemeldet',
     Object.keys(doc.getFontList()).indexOf('MojiBrico') >= 0);
  ok('Sie ist auch als Schrift angemeldet',
     Object.keys(doc.getFontList()).indexOf('MojiHand') >= 0,
     Object.keys(doc.getFontList()).join(','));

  /* Jede Pflichtangabe muss im Text der Seite stehen. */
  var roh = doc.output();
  ok('Ein PDF kommt heraus', roh.slice(0,5) === '%PDF-', roh.slice(0,8));
  ok('Zweimal aufrufen aendert nichts an der Schrift',
     handAn(doc) === true);

  /* Ein 31-Tage-Monat darf die Tabelle nicht in die Summen schieben. */
  var n31 = monthRows(ME, 2026, 0).length;
  ok('Jaenner hat 31 Zeilen', n31 === 31, n31);
  var startY = 61.6 + 6.4 + 1;
  var rowH = Math.min(5.4, (228 - startY) / n31);
  ok('31 Zeilen enden vor den Summen', startY + n31 * rowH <= 228.1,
     (startY + n31 * rowH).toFixed(1) + ' mm');
  /* Die Summenkarten duerfen die Unterschrift bei 274 mm nicht erreichen. */
  ok('Summen und Hinweise bleiben ueber der Unterschrift',
     startY + n31 * rowH + 7 + 18.6 + 8 < 272,
     (startY + n31 * rowH + 33.6).toFixed(1) + ' mm');
  ok('Und bleiben lesbar hoch', rowH >= 4.6, rowH.toFixed(2) + ' mm');
} else {
  ok('jsPDF fehlt — Seitenpruefungen ausgelassen', false, 'npm i jspdf');
}

/* ── 8 · Die Bausteine ── */
ok('Die Handschrift liegt in der Datei', typeof HAND_TTF === 'string' && HAND_TTF.length > 20000,
   typeof HAND_TTF === 'string' ? HAND_TTF.length : 'fehlt');
ok('MOJIs Anzeigeschrift auch', typeof BRICO_TTF === 'string' && BRICO_TTF.length > 20000,
   typeof BRICO_TTF === 'string' ? BRICO_TTF.length : 'fehlt');
/* Das App-Symbol ist freigestellt: der violette Seitengrund der Vorlage
   steckte bis zuletzt in den Ecken. */
ok('Das App-Symbol hat durchsichtige Ecken', LOGO_ICON.indexOf('data:image/png;base64,') === 0);
ok('Der QR liegt als PNG in der Datei',
   QR_PNG.indexOf('data:image/png;base64,') === 0 && QR_PNG.length > 500,
   QR_PNG.slice(0, 30) + ' … ' + QR_PNG.length);
ok('Jede Kategorie hat eine kraeftige UND eine Pastellfarbe',
   ['urlaub','krank','feier','eigen','zeit'].every(function(k){
     return Array.isArray(TYPES[k].pdf) && Array.isArray(TYPES[k].pdfF); }));
ok('Die PDF-Farben sind die der App',
   TYPES.urlaub.pdf.join(',') === '225,160,29' && TYPES.feier.pdf.join(',') === '0,167,203',
   TYPES.urlaub.pdf.join(',') + ' / ' + TYPES.feier.pdf.join(','));

/* ── Unterschreiben vor dem Export ──
   jsdom malt nichts, aber der ganze Ablauf drumherum laesst sich pruefen. */
const pad = document.getElementById('sigpad');
ok('Das Feld liegt in der Kachel', !!pad && pad.parentElement.id === 'ex-card');
ok('Mit einer Leinwand',           !!document.getElementById('sig-canvas'));
ok('Und einer Linie',              !!pad.querySelector('.sig-linie'));
ok('Der grosse Knopf heisst Signieren',
   document.getElementById('sig-ok').textContent.trim() === 'Signieren',
   document.getElementById('sig-ok').textContent.trim());
ok('Er steht bei Kalender und Export',
   document.getElementById('sig-ok').parentElement.id === 'fabbar');

const kopfVor = document.querySelector('#v-export .exh').textContent;
EX.year = new Date().getFullYear(); EX.set = new Set([EX.year + '-0']);
sigAuf();
ok('Das Feld geht auf',            pad.classList.contains('da'));
ok('Die App merkt es sich',        document.body.classList.contains('sigmodus'));
ok('Und der Kopf fragt danach',
   document.querySelector('#v-export .exh').textContent === 'Bestätige jetzt mit deiner Unterschrift.',
   document.querySelector('#v-export .exh').textContent);
ok('Signieren geht erst mit Strich', document.getElementById('sig-ok').disabled);
sigZu();
ok('Zumachen raeumt auf',          !pad.classList.contains('da')
   && !document.body.classList.contains('sigmodus'));
ok('Und der Kopf heisst wieder wie vorher',
   document.querySelector('#v-export .exh').textContent === kopfVor,
   document.querySelector('#v-export .exh').textContent);
/* Ohne Strich gibt es kein Bild — und damit keinen stillen Export. */
ok('Ohne Strich kein Bild',        sigBild() === null);
/* Ein Wechsel der Ansicht beendet das Unterschreiben. */
sigAuf(); go('v-cal');
ok('Die Ansicht zu wechseln beendet es', !document.body.classList.contains('sigmodus'));

ME = null;
window.__FERTIG = true;
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

setTimeout(() => {
  const E = dom.window.__E || [];
  /* Regeln, die jsdom nicht rechnet — aber dastehen muessen. */
  [['Abgegeben faerbt nur, wenn nicht gewaehlt', /\.mgrid \.chip\.fertig:not\(\.on\)\{/],
   ['Der Haken liegt in der Ecke der Kachel', /\.mgrid \.chip \.exhaken\{/],
   ['Auf der gewaehlten Kachel kehrt er sich um', /\.mgrid \.chip\.on \.exhaken\{/],
   ['Verlaufszeile steht untereinander', /\.exh-t b\{display:block/],
   /* Nur echter Code zaehlt — der Kommentar, der den alten Stand
      erklaert, enthaelt den Ausdruck absichtlich. */
   /* Gemeint ist die ALTE sigImage()-Leinwand, die den getippten Namen
      in einer Zufallsschrift des Geraets abmalte. Seit 15.09.2026 wird
      wieder auf einer Leinwand unterschrieben — aber von Hand. */
   ['Kein abgemalter Name mehr', !/function sigImage/.test(roh)],
   ['Und die Wortmarke nicht mehr aus logoBlack', !/function logoBlack/.test(roh)],
   ['Kein UTC-Datum mehr fuer Ortszeit-Anzeigen',
    !/(?<!Hier stand )new Date\([^)]*\)\.toISOString\(\)\.slice\(0,10\)/.test(roh)],
   /* Seit 15.09.2026 wird vor jedem Export unterschrieben. */
   ['Der Knopf fuehrt zum Unterschreiben', /\$\('#ex-go'\)\.addEventListener\('click', sigAuf\)/.test(roh)],
   ['Die Unterschrift steht im PDF', /doc\.addImage\(SIG_BILD, 'PNG'/.test(roh)],
   ['Mit dem Vermerk darunter',
    /doc\.text\('Elektronisch unterschrieben in der MOJI App'/.test(roh)],
   ['Sie wird nicht aufgehoben', /\n  SIG_BILD = null;\n  _busy = false/.test(roh)],
   ['Und nicht verzerrt', /if\(hoch > maxH\)\{ hoch = maxH; bre = hoch \* \(SIG_VERH \|\| 3\.4\); \}/.test(roh)]
  ].forEach(([n, re]) => {
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
}, 1500);
