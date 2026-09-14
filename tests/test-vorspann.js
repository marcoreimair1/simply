/* Testlauf: Vorspann — Ladebalken und die Reihenfolge Symbol → Profilbild.
   Abgemeldet. Geprueft werden die gesetzten Werte, nicht das Aussehen:
   jsdom rechnet keine CSS-Uebergaenge, aber die Inline-Werte am Balken
   sagen genau, was der Browser animieren wuerde. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const DATEI = process.argv[2] || path.join(__dirname, '..', 'index.html');
const vc = new VirtualConsole();
['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));

const dom = new JSDOM(fs.readFileSync(DATEI, 'utf8'), {
  url: 'https://moji-app.at/', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: vc
});

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }

ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

/* ── 1 · Zeiten stehen und sind plausibel ── */
ok('INTRO_MIN 4,4 s', INTRO_MIN === 4400, INTRO_MIN);
ok('INTRO_LANG laenger als INTRO_MIN', INTRO_LANG > INTRO_MIN, INTRO_LANG + ' > ' + INTRO_MIN);
ok('Notbremse liegt hinter beiden', INTRO_MAX > INTRO_LANG, INTRO_MAX);
ok('Der Balken wird vor dem Ausblenden voll', BALKEN_VOR > 0 && BALKEN_VOR < INTRO_MIN, BALKEN_VOR);

/* ── 2 · Der Balken im Markup ── */
ok('Balken liegt im Vorspann', !!document.querySelector('#splash .sp-lade #sp-bar'));
ok('Balken steht auch im gesicherten Markup', INTRO_HTML.indexOf('sp-bar') > -1);

/* ── 3 · playIntro setzt den ersten Zug ── */
ME = null;
playIntro();
var b = document.querySelector('#sp-bar');
ok('Erster Zug auf 86 %', b.style.width === '86%', b.style.width);
ok('Erster Zug dauert 2,9 s', b.style.transitionDuration === '2900ms', b.style.transitionDuration);
ok('Vorspann laeuft', window.__introLaeuft === true);

/* ── 4 · Ohne Anmeldung die lange Fassung ── */
introAppSteht();
var langDauer = parseInt(b.style.transitionDuration, 10);
ok('Ohne Anmeldung: Balken voll', b.style.width === '100%', b.style.width);
ok('Ohne Anmeldung: rund INTRO_LANG minus Vorlauf',
   Math.abs(langDauer - (INTRO_LANG - BALKEN_VOR)) < 200, langDauer + ' ms');
endIntro();

/* ── 5 · Angemeldet die kuerzere Fassung ── */
playIntro();
b = document.querySelector('#sp-bar');
ME = { vorname: 'Test', nachname: 'Fall', dob: '1990-01-01' };
introAppSteht();
var kurzDauer = parseInt(b.style.transitionDuration, 10);
ok('Angemeldet: kuerzer als ohne Anmeldung', kurzDauer < langDauer,
   kurzDauer + ' ms < ' + langDauer + ' ms');
ok('Angemeldet: rund INTRO_MIN minus Vorlauf',
   Math.abs(kurzDauer - (INTRO_MIN - BALKEN_VOR)) < 200, kurzDauer + ' ms');
ok('Letzter Zug nie unter BALKEN_MIN', kurzDauer >= BALKEN_MIN, kurzDauer);

/* ── 6 · Zweimal melden aendert nichts ── */
var vorher = b.style.transitionDuration;
introAppSteht();
ok('Zweite Meldung laesst den Balken in Ruhe', b.style.transitionDuration === vorher);

/* ── 7 · Der Gruss wartet, statt sich darueberzulegen ── */
var hallo = document.querySelector('#hallo');
var sp = document.querySelector('#splash');
hallo.classList.remove('on','weg','ab','neu');
zeigeGruss('an');
ok('Waehrend des Vorspanns liegt kein Profilbild oben', !hallo.classList.contains('on'));
ok('Der Gruss steht in der Schlange', _nachIntro.length === 1, _nachIntro.length);

/* ── 8 · Uebergabe: der Gruss kommt sofort, der Vorspann bleibt stehen ──
   Frueher blendete der Vorspann erst ganz aus, gab dabei den Kalender frei
   und der Gruss legte sich danach wieder darueber. Genau diese Luecke
   wird hier ausgeschlossen. */
endIntro();
ok('Der Gruss ist sofort da', hallo.classList.contains('on'), 'Klassen: ' + hallo.className);
ok('Der Vorspann blendet dabei NICHT aus', !sp.classList.contains('done'));
ok('Der Vorspann steht noch', sp.style.display !== 'none', sp.style.display || '(leer)');
ok('Der Vorspann ist als Uebergabe vermerkt', sp.dataset.uebergabe === '1');
ok('Schlange ist leer', _nachIntro.length === 0, _nachIntro.length);
ok('Vorspann gilt als aus', window.__introLaeuft === false);
ok('Die App kommt darunter hoch', document.querySelector('#app').classList.contains('on'));

window.__WEITER = function(){
  ok('Vorspann ist danach abgeraeumt', sp.style.display === 'none', sp.style.display);
  ok('Uebergabe-Vermerk ist weg', !sp.dataset.uebergabe);
  ok('Der Gruss liegt immer noch oben', hallo.classList.contains('on'));

  /* ── 9 · Ohne Gruss der normale Weg: ausblenden, App freigeben ── */
  playIntro();
  ok('playIntro raeumt den Uebergabe-Vermerk weg', !sp.dataset.uebergabe);
  ME = null;
  introAppSteht();
  endIntro();
  ok('Ohne Gruss blendet der Vorspann aus', sp.classList.contains('done'));
  ok('Ausblenden dauert INTRO_WEG', INTRO_WEG >= 900, INTRO_WEG);
  ok('Der Gruss blendet mindestens so lang aus wie frueher', GRUSS_WEG >= 560, GRUSS_WEG);
  ok('Uebergabe ist kuerzer als das Ausblenden', UEBERGABE < INTRO_WEG,
     UEBERGABE + ' < ' + INTRO_WEG);

  /* ── 10 · Die Kopfleiste wartet auf den freien Schirm ──
     Das Tier rutscht nach unten und die rote Zahl poppt auf. Frueher
     lief das stur 4,5 s nach dem Betreten — also genau hinter dem
     Gruss, und niemand sah es. */
  var echtPfNeu = window.pfNeu;
  window.pfNeu = function(){ return [{ id:'x' }]; };
  ME = { vorname:'Test', nachname:'Fall', dob:'1990-01-01' };
  var w = document.querySelector('#avwrap');
  playIntro();
  zaehlerAnlauf();
  ok('Waehrend des Vorspanns keine Meldung', !w.classList.contains('meldung'));
  ok('Der Anlauf steht in der Warteschlange', _wennFrei.length === 1, _wennFrei.length);
  var hallo2 = document.querySelector('#hallo');
  hallo2.classList.add('on');
  endIntro();
  /* Der Vorspann raeumt sich erst nach INTRO_WEG ab. Hier geht es um die
     zweite Sperre — den Gruss —, also den Vorspann von Hand beenden. */
  window.__introLaeuft = false;
  schirmPruefen();
  ok('Mit dem Gruss oben gilt der Schirm als belegt', schirmBelegt());
  ok('Und der Anlauf wartet weiter', _wennFrei.length === 1, _wennFrei.length);
  hallo2.classList.remove('on');
  schirmPruefen();
  ok('Schirm frei -> Warteschlange geleert', _wennFrei.length === 0);
  ok('Der Atemzug laeuft noch', !w.classList.contains('meldung'));
  ok('Atemzug ist kurz genug zum Wahrnehmen', ZAEHLER_ATEM <= 1000, ZAEHLER_ATEM);

  setTimeout(function(){
    ok('Nach dem Atemzug ist die Meldung da', w.classList.contains('meldung'),
       'Klassen: ' + w.className);

    /* ── 11 · Anmelden: erst der Vorhang, dann der Wechsel ──
       Frueher: enterApp(); zeigeHallo(); — also Kalender aufbauen und
       ihn dann zudecken. Man sah ihn kurz aufblitzen, und der Anlauf
       der Kopfleiste lief hinter dem Gruss ab, weil der Schirm zum
       Zeitpunkt von enterApp() noch frei war. */
    _wennFrei = [];
    w.classList.remove('meldung');
    /* Vollstaendig normalisiert: enterApp() rechnet Urlaub, Konten und
       Kalender durch — ein halbes Profil bricht dabei ab. */
    ME = normalize({ id:'t2', vorname:'Test', nachname:'Fall', dob:'1990-01-01' });
    loginScreen();
    var hallo3 = document.querySelector('#hallo');
    hallo3.classList.remove('on','weg','ab','neu');
    ok('Vor dem Anmelden steht die Anmeldeseite',
       document.querySelector('#v-login').classList.contains('on'));

    appBetreten(true);
    ok('Der Gruss ist sofort oben', hallo3.classList.contains('on'));
    ok('Die Ansicht hat NOCH nicht gewechselt',
       !document.querySelector('#v-cal').classList.contains('on'));
    ok('Und die Kopfleiste laeuft noch nicht an', !w.classList.contains('meldung'));

    setTimeout(function(){
      ok('Unter dem deckenden Gruss wechselt die Ansicht',
         document.querySelector('#v-cal').classList.contains('on'));
      ok('Der Anlauf der Kopfleiste steht jetzt an', _wennFrei.length === 1, _wennFrei.length);

      /* ── 12 · Waehrend des Vorspanns bleibt die alte Reihenfolge ──
         Sonst meldete go() dem Vorspann nie, dass der Start durch ist,
         und er stuende bis zur Notbremse. */
      _wennFrei = [];
      hallo3.classList.remove('on','weg','ab','neu');
      playIntro();
      loginScreen();
      appBetreten(true);
      ok('Bei laufendem Vorspann wechselt die Ansicht sofort',
         document.querySelector('#v-cal').classList.contains('on'));
      ok('Und der Vorspann weiss, dass der Start durch ist', _appSteht === true);
      endIntro();

      window.pfNeu = echtPfNeu;
      ME = null;
      window.__FERTIG = true;
    }, GRUSS_REIN + 250);
  }, ZAEHLER_ATEM + 300);
};
setTimeout(window.__WEITER, UEBERGABE + 400);
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

setTimeout(() => {
  const E = dom.window.__E || [];
  /* Abmelden laesst sich hier nicht durchspielen — signOut() ginge ins
     Netz. Geprueft wird deshalb am Quelltext, dass der sichtbare Teil
     hinter der Uhr liegt, die den Gruss decken laesst. */
  const roh = fs.readFileSync(DATEI, 'utf8');
  [['Abmelden wartet, bis der Gruss deckt', /const gedeckt = wait\(GRUSS_REIN\);/],
   ['Und wechselt die Seite erst danach', /await gedeckt;[\s\S]{0,400}loginScreen\(\);/],
   ['GRUSS_REIN passt zu halloRein', /\.hallo\.on\{display:grid;animation:halloRein \.62s/],
   /* Seit 14.09.2026 stehen auf dem Vorspann nur Symbol und Balken. */
   ['Der Glanz liegt auf der Kachel', /\.mark-tile::after\{[\s\S]{0,600}kartenGlanz/],
   ['Er wandert in der gedrehten Achse', /@keyframes kartenGlanz\{[\s\S]{0,200}rotate\(45deg\) translateX/],
   ['Balken und Kachel im selben Takt',
    /animation:ladeGlanz 3\.4s 1\.2s var\(--ease\) infinite/],
   ['Der Balken hat ein Licht an der Spitze', /\.sp-lade i::before\{/],
   ['Weniger Bewegung schaltet beides ab',
    /prefers-reduced-motion:reduce\)\{\s*\n\s*\.sp-lade i::after, \.mark-tile::after\{ animation:none \}/]
  ].forEach(([n, re]) => E.push({ n, ok: re.test(roh), z: re.test(roh) ? '' : 'fehlt' }));
  /* Die Wortmarke darf im Vorspann-Markup nicht mehr vorkommen. */
  const splash = (roh.match(/<div id="splash"[\s\S]*?\n<\/div>/) || [''])[0];
  [['Keine Unterzeile im Vorspann', splash.indexOf('subline') < 0],
   ['Keine Wortmarke im Vorspann',  splash.indexOf('mark-wort') < 0],
   ['Symbol und Balken sind da',    splash.indexOf('mark-img') > -1 && splash.indexOf('sp-bar') > -1]
  ].forEach(([n, gut]) => E.push({ n, ok: gut, z: gut ? '' : 'siehe #splash' }));
  let schlecht = 0;
  console.log('');
  E.forEach(e => {
    if (!e.ok) schlecht++;
    console.log((e.ok ? '  ok   ' : '  FEHL ') + e.n + (e.ok || !e.z ? '' : '  → ' + e.z));
  });
  console.log('');
  console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
  process.exit(schlecht || !dom.window.__FERTIG ? 1 : 0);
}, 6200);
