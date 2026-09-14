/* Testlauf: Einstieg und Funnel.

   Geprueft wird der Weg von der ersten Sekunde bis zum Kalender:
   Startbildschirm, die zwei Blaetter fuer Adresse und Code, die
   Sperre von 60 Sekunden beim erneuten Senden und die vier Schritte
   des Funnels samt Schaltern und Dienstplanfrage.

   Ohne ?desktop=1 — dann ist AM_HANDY false, boot() kehrt sofort
   zurueck und es wird nichts aus der Cloud geladen.                  */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

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
const el = id => document.getElementById(id);

/* ── 0 · Sicherheit ── */
ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

/* ── 1 · Der Startbildschirm steht im Markup ── */
ok('Einstieg vorhanden',            !!el('lg-start'));
ok('Fassungsschalter vorhanden',    !!el('lg-fassung'));
ok('Sonne und Mond liegen darin',   !!document.querySelector('#lg-fassung .fa-sonne')
                                 && !!document.querySelector('#lg-fassung .fa-mond'));
ok('Face-ID-Knopf vorhanden',       !!el('ein-pk'));
ok('Anmelden oder registrieren',    !!el('ein-mail'));
ok('Blatt fuer die Adresse',        !!el('lg-mailstep'));
ok('Blatt fuer den Code',           !!el('lg-codestep'));

/* Was weg ist, muss weg bleiben — sonst kommt die alte Werbeseite zurueck. */
ok('Keine Musterbilder mehr',       document.querySelectorAll('.wfeat').length === 0);
ok('Kein Weichenbalken mehr',       !el('lg-bar'));
ok('Kein Kartenkarussell mehr',     !el('feat-track'));
ok('Keine A4-Vorschau mehr',        !el('pdfprev'));
ok('Kein Haekchen-Kaestchen mehr',  !el('mailok'));
ok('Keine Arbeitsort-Seite mehr',   !el('go-ort'));

/* ── 2 · loginScreen mit Cloud zeigt den Einstieg ── */
CLOUD_ON = true; PASSKEY = true;
loginScreen();
ok('Einstieg ist an',        el('lg-start').classList.contains('on'));
ok('Oertlicher Weg ist aus', el('lg-local').style.display === 'none', el('lg-local').style.display);
ok('Face ID wird gezeigt',   el('ein-pk').style.display === 'flex', el('ein-pk').style.display);
ok('Ohne Kopfleiste',        document.body.classList.contains('nobar'));

/* Ohne Passkey-Unterstuetzung bleibt der Knopf weg */
PASSKEY = false; loginScreen();
ok('Ohne Passkey kein Face ID', el('ein-pk').style.display === 'none', el('ein-pk').style.display);
PASSKEY = true;

/* ── 3 · Ohne Cloud der oertliche Weg, mit Kopfleiste ── */
CLOUD_ON = false; loginScreen();
ok('Ohne Cloud: Einstieg aus',   !el('lg-start').classList.contains('on'));
ok('Ohne Cloud: oertlich an',    el('lg-local').style.display === 'block');
ok('Ohne Cloud: Kopfleiste da',  !document.body.classList.contains('nobar'));
CLOUD_ON = true; loginScreen();

/* ── 4 · Die Blaetter gehen auf und zu ── */
blattAuf('lg-mailstep');
ok('Blatt Adresse offen',   el('lg-mailstep').classList.contains('on'));
ok('Seite ist gesperrt',    document.body.classList.contains('locked'));
blattZu('lg-mailstep');
ok('Blatt Adresse zu',      !el('lg-mailstep').classList.contains('on'));
ok('Sperre wieder weg',     !document.body.classList.contains('locked'));

/* ── 5 · Adresse pruefen, bevor irgendetwas rausgeht ── */
let gesendet = 0, letzteAdresse = '';
sb = { auth: { signInWithOtp: async o => { gesendet++; letzteAdresse = o.email; return { data:{}, error:null }; } } };
blattAuf('lg-mailstep');
el('lg-mail').value = 'keine-adresse';
el('lg-mail').dispatchEvent(new Event('input'));
ok('Weiter bleibt gesperrt', el('lg-send').disabled === true);
weiterZumCode();
ok('Nichts verschickt',      gesendet === 0, gesendet);
ok('Fehler steht da',        el('lg-err2').classList.contains('da'));
ok('Blatt Code bleibt zu',   !el('lg-codestep').classList.contains('on'));

el('lg-mail').value = 'anna@example.org';
el('lg-mail').dispatchEvent(new Event('input'));
ok('Weiter wird frei',       el('lg-send').disabled === false);

/* ── 6 · Der Uebergang steht sofort, die Mail geht daneben raus ── */
weiterZumCode();
ok('Blatt Code offen',       el('lg-codestep').classList.contains('on'));
ok('Blatt Adresse zu',       !el('lg-mailstep').classList.contains('on'));
ok('Adresse steht im Text',  el('lg-sent-t').textContent === 'anna@example.org', el('lg-sent-t').textContent);
ok('Code-Feld hat den Fokus', document.activeElement === el('lg-otp'),
   document.activeElement && document.activeElement.id);

/* ── 7 · Sechzig Sekunden Ruhe ── */
ok('Erneut senden gesperrt',  el('lg-again').disabled === true);
ok('Sekunden stehen im Knopf', /Erneut senden in \\d+ s/.test(el('lg-again').textContent),
   el('lg-again').textContent);
ok('Sperre liegt bei rund 60 s', /in (59|60) s/.test(el('lg-again').textContent),
   el('lg-again').textContent);
el('lg-again').click();
ok('Gesperrter Knopf schickt nichts', gesendet === 1, gesendet);
cooldownStopp();
ok('Nach Ablauf wieder frei',  el('lg-again').disabled === false);
ok('Und traegt wieder den Text', el('lg-again').textContent === 'E-Mail erneut senden',
   el('lg-again').textContent);
el('lg-again').click();
ok('Dann geht die zweite Mail', gesendet === 2, gesendet);
ok('An dieselbe Adresse',       letzteAdresse === 'anna@example.org', letzteAdresse);
blattAllesZu();

/* ── 8 · Der Funnel hat vier Schritte ── */
ok('STEPS ist 4', STEPS === 4, STEPS);
UID = 'uTest'; MAIL = 'anna@example.org';
obInit();
ok('Startet bei 1',        el('ob-step').textContent === 'Schritt 1 von 4', el('ob-step').textContent);
ok('Balken auf 25 %',      el('ob-bar').style.width === '25%', el('ob-bar').style.width);
ok('Zurueck ist versteckt', el('ob-back').classList.contains('hide'));
ok('Kein Weiter-Knopf beim Namen', el('ob-nav').classList.contains('hide'));

el('in-vn').value = 'Anna'; el('in-vn').dispatchEvent(new Event('input'));
el('in-nn').value = 'Muster'; el('in-nn').dispatchEvent(new Event('input'));
ok('Name ist vollstaendig', stepValid(0) === true);
el('go-name').click();
ok('Jetzt Schritt 2',      el('ob-step').textContent === 'Schritt 2 von 4', el('ob-step').textContent);
ok('Balken auf 50 %',      el('ob-bar').style.width === '50%', el('ob-bar').style.width);
ok('Zurueck ist sichtbar', !el('ob-back').classList.contains('hide'));

const d = document.querySelectorAll('[data-dob="ob"] input');
d[0].value = '14'; d[1].value = '03'; d[2].value = '1994';
ok('Geburtsdatum gilt', stepValid(1) === true);

/* ── 9 · Die zwei Schalter ── */
obGo(2);
ok('Schritt 3 steht',        el('ob-step').textContent === 'Schritt 3 von 4', el('ob-step').textContent);
ok('Beide Schalter moeglich', obSchalterAnzahl() === 2, obSchalterAnzahl());
ok('Ueberschrift passt',     el('ob-sw-h').textContent === 'Zwei Schalter', el('ob-sw-h').textContent);
ok('Erinnerung steht auf aus', el('sw-mail').getAttribute('aria-pressed') === 'false');
ok('Weiter-Knopf ist da',    !el('ob-nav').classList.contains('hide'));
el('sw-mail').click();
ok('Erinnerung an',          OB.mailOk === true);
ok('Regler zeigt an',        el('sw-mail').getAttribute('aria-pressed') === 'true');
ok('Adresse steht darunter', el('sw-mail-s').textContent.indexOf('anna@example.org') > -1,
   el('sw-mail-s').textContent);
ok('Einer allein reicht nicht', obSchalterFertig() === false);
PK_LISTE = [{ id:'k1' }]; OB.pkOk = true; obSchalterMalen();
ok('Face ID zeigt an',       el('sw-pk').getAttribute('aria-pressed') === 'true');
ok('Jetzt sind beide gesetzt', obSchalterFertig() === true);

/* Ohne Konto und ohne Passkey faellt der Schritt weg */
const merkCloud = CLOUD_ON, merkPk = PASSKEY, merkUid = UID, merkMail = MAIL;
CLOUD_ON = false; PASSKEY = false; UID = null; MAIL = '';
obGo(1); obGo(2);
ok('Leerer Schalterschritt wird uebersprungen',
   el('ob-step').textContent === 'Schritt 4 von 4', el('ob-step').textContent);
CLOUD_ON = merkCloud; PASSKEY = merkPk; UID = merkUid; MAIL = merkMail;

/* ── 10 · Die Dienstplanfrage ── */
obGo(3);
ok('Schritt 4 steht',         el('ob-step').textContent === 'Schritt 4 von 4', el('ob-step').textContent);
ok('Balken ist voll',         el('ob-bar').style.width === '100%', el('ob-bar').style.width);
ok('Frage ist sichtbar',      el('ob-plan-frage').style.display !== 'none');
ok('Kein Weiter bei der Frage', el('ob-nav').classList.contains('hide'));
obPlanAuf();
ok('Dienstzeiten offen',      el('ob-plan-edit').style.display !== 'none');
ok('Plan ist gebaut',         el('sched-onboard').innerHTML.length > 100);
ok('Jetzt gibt es Fertig',    !el('ob-nav').classList.contains('hide'));
ok('Knopf heisst Fertig',     el('ob-next').innerHTML.indexOf('Fertig') === 0, el('ob-next').textContent);
el('ob-back').click();
ok('Zurueck fuehrt zur Frage', el('ob-plan-frage').style.display !== 'none' && OB.plan === false);
ok('Und bleibt auf Schritt 4', el('ob-step').textContent === 'Schritt 4 von 4');

/* ── 11 · Spaeter heisst: mit der Vorgabe weiter ── */
ok('Vorgabe traegt Stunden', weekTotal(OB.sched, 0) > 0, weekTotal(OB.sched, 0));
ok('Ohne Plan gilt der Schritt', stepValid(3) === true);

/* ── 12 · Der Schluss hat eine eigene Fassung des Grusses ── */
ok('GRUSS kennt fertig',      !!GRUSS.fertig);
ok('Fertig traegt Konfetti',  GRUSS.fertig.konfetti === true);
ok('Ring liegt im Markup',    !!document.querySelector('#hallo .hallo-ring .rg')
                           && !!document.querySelector('#hallo .hallo-ring .hk'));
/* Der Gruss braucht jemanden zum Gruessen — sonst kehrt er sofort um. */
ME = normalize({ id:'pGruss', vorname:'Anna', nachname:'Muster', dob:'1994-03-14' });
zeigeGruss('fertig');
ok('Buehne traegt fertig',    el('hallo').classList.contains('fertig'));
ok('Name steht im Gruss',     el('hallo-t').textContent.indexOf('Anna') > -1, el('hallo-t').textContent);
grussEnde();

/* ── 13 · Das Profil kommt aus dem Funnel ── */
ME = null; _funnelId = null; OB.mailOk = true;
const p = sichereProfil();
ok('Profil angelegt',      !!p && p.vorname === 'Anna' && p.nachname === 'Muster');
ok('Geburtsdatum steht',   !!p && p.dob === '1994-03-14', p && p.dob);
ok('Arbeitsort gesetzt',   !!p && p.ort === EMPLOYER, p && p.ort);
ok('Erinnerung uebernommen', !!p && p.mailOk === true, p && p.mailOk);
ok('Gefragt wurde',        !!p && p.mailGefragt === true, p && p.mailGefragt);

/* ── 14 · Die Fassung wird beim ersten Profil uebernommen ── */
sessionStorage.setItem('moji.fassung.wahl', 'dark');
ME.erscheinung = 'light';
erscheinungAusProfil();
ok('Wahl vom Einstieg gilt', ME.erscheinung === 'dark', ME.erscheinung);
ok('Vermerk ist verbraucht', sessionStorage.getItem('moji.fassung.wahl') === null);
ok('Seite ist dunkel',       document.documentElement.dataset.theme === 'dark',
   document.documentElement.dataset.theme);
erscheinungAusProfil();
ok('Ohne Vermerk bleibt das Profil massgeblich', ME.erscheinung === 'dark');

/* ── 15 · Der Schriftzug, der sich selbst schreibt ── */
ok('Logo liegt in der Zeile',   !!document.querySelector('#ein-h #ms-logo img'));
/* In der Zeile steht nur noch, was die Schleife hineinschreibt. */
/* Nicht gegen document.body pruefen: dort steht dieses Skript selbst mit drin. */
ok('Kein fester Text mehr', el('v-login').innerHTML.indexOf('Los ' + 'geht') < 0);
ok('Die Zeile traegt einen Namen fuer Vorleseprogramme',
   document.getElementById('ein-h').getAttribute('aria-label') === 'MOJI');
ok('Zwei Woerter in der Schleife', MS_WOERTER.length === 2 && MS_WOERTER[0] === 'MOJI'
   && MS_WOERTER[1] === '文字', MS_WOERTER.join(' '));
const kinder = msBau('MOJI');
ok('Vier Buchstaben gebaut',    kinder.length === 4, kinder.length);
ok('Sie fangen geschlossen an', kinder.every(i => i.style.width === '0px'));
ok('Und tragen ihre Breite',    kinder.every(i => i.dataset.w !== undefined));
const jp = msBau('文字');
ok('Japanisch bekommt die Ersatzschrift', jp.every(i => i.className.indexOf('cjk') > -1),
   jp.map(i => i.className).join('|'));
ok('Klopfen bricht nichts',     (msKlopf(), true));
ok('Geklopft wird nur am Anfang', MS_KLOPF_RUNDEN === 2, MS_KLOPF_RUNDEN);
ok('Das Maennchen wackelt',     (msWackeln(), document.getElementById('ms-logo').classList.contains('wackelt')));
ok('Ohne Einstieg keine Schleife', (msStop(), _msAus === true));

/* ── 16 · Hinunterschieben zum Schliessen ── */
ok('Griff im Adressblatt', !!document.querySelector('#lg-mailstep .sheet-grab .grip'));
ok('Griff im Codeblatt',   !!document.querySelector('#lg-codestep .sheet-grab .grip'));
ok('Zug am Adressblatt verdrahtet', typeof window.__mailReset === 'function');
ok('Zug am Codeblatt verdrahtet',   typeof window.__codeReset === 'function');

/* ── 17 · Das Maennchen steht auch ueber den Blaettern ── */
CLOUD_ON = true; loginScreen();
const marken = Array.from(document.querySelectorAll('.blatt-mark img'));
ok('Beide Blaetter tragen das Bild', marken.length === 2
   && marken.every(i => (i.getAttribute('src') || '').indexOf('data:image/png') === 0),
   marken.length);

window.__FERTIG = true;
`;

const s = dom.window.document.createElement('script');
s.textContent = pruef;
dom.window.document.body.appendChild(s);

const E = dom.window.__E || [];
let schlecht = 0;
console.log('');
E.forEach(e => {
  if (!e.ok) schlecht++;
  console.log((e.ok ? '  ok   ' : '  FEHL ') + e.name + (e.ok || !e.zusatz ? '' : '  → ' + e.zusatz));
});
console.log('');
console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
/* Ohne diesen Vermerk ist der Lauf unterwegs abgebrochen — dann sagen die
   bestandenen Prüfungen nichts aus. Genau das ist hier einmal passiert und
   sah in der Übersicht wie ein Haken aus. */
if (!dom.window.__FERTIG) console.log('  FEHL  Der Testlauf ist vorzeitig abgebrochen.');
process.exit(schlecht || !dom.window.__FERTIG ? 1 : 0);
