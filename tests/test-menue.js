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
/* Und einmal alle Migrationen zusammen, fuer Regeln, die nicht an einer
   bestimmten Datei haengen. Kommentare wieder heraus. */
const sql = (function(){
  try{
    const d = path.join(__dirname, '..', 'supabase', 'migrations');
    return fs.readdirSync(d).filter(f => /\.sql$/.test(f)).sort()
             .map(f => fs.readFileSync(path.join(d, f), 'utf8')).join('\n')
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
  /* ── Der Kopf ist die Karte ──
     Seit 20.09.2026 stehen Name, Bild, Stufe und das dunkle Band in
     einem Stueck. Vorher waren es zwei Kaesten und ein eigener
     Menuepunkt: dreimal dieselbe Person. */
  malRang();
  var kopf = document.getElementById('mausweis');
  ok('Der Kopf ist die Karte',      !!kopf);
  ok('Die alte Stufenleiste ist weg', !document.getElementById('mrang'));
  ok('Und der eigene Menuepunkt auch',
     !document.querySelector('#menu [data-act="karte"]'));
  ok('Er traegt die Farbe der Stufe',
     kopf.style.getPropertyValue('--pa') !== '' && kopf.style.getPropertyValue('--rf') !== '',
     kopf.getAttribute('style'));
  /* Kein Muster mit Backslash — diese Pruefungen stehen in einer
     Schablonenzeichenkette, dort wird aus \d ein d. */
  ok('Im Band steht der Stand der Sammlung',
     document.getElementById('ma-stand').textContent === stufe() + ' von ' + RAENGE.length + ' Karten',
     document.getElementById('ma-stand').textContent);
  ok('Die Flaeche darunter oeffnet die Karte', !!document.getElementById('ma-auf'));
  /* Knoepfe ineinander gibt es in HTML nicht — Bild und Postfach muessen
     eigene bleiben und duerfen nicht im Oeffnen-Knopf stecken. */
  ok('Bild und Postfach sind eigene Knoepfe',
     document.getElementById('avbig').tagName === 'BUTTON'
     && document.getElementById('postfach').tagName === 'BUTTON'
     && !document.getElementById('ma-auf').contains(document.getElementById('avbig')));
  /* Die Liste aller Stufen gab es dreimal: als Flaeche im Menue, als
     eigenes Blatt und als Knopf in der Karte. Jetzt gar nicht mehr —
     der Stapel zeigt alle zwoelf, die erreichten und die verschlossenen. */
  ok('Keine eigene Zeile fuer die Stufen mehr',
     !document.querySelector('#menu .mi[data-act="raenge"]'));
  ok('Keine Flaeche dafuer im Menue',  !document.getElementById('rangbox'));
  ok('Und kein Knopf in der Karte',    !document.getElementById('mk-stufen'));

  /* ── Der Stapel ──
     Fuer jede Stufe eine Karte. Drei Zustaende, immer derselbe Aufbau,
     damit beim Wischen nichts springt. */
  ME.months = []; for(var mi = 0; mi < 39; mi++) ME.months.push({ y:2026 + (mi/12|0), m:mi%12 });
  ME.exp = {}; ME.months.forEach(function(o){ ME.exp[o.y + '-' + o.m] = 1; });
  malKarte();
  var kt = document.querySelectorAll('#kt-bahn .kt');
  var st = stufe();
  ok('Fuer jede Stufe eine Karte',  kt.length === RAENGE.length, kt.length);
  ok('Und die Stufe stimmt',        st === 10, st);
  ok('Die erreichten sind frei',
     [].every.call(kt, function(k, i){ return (i + 1 <= st) === k.classList.contains('frei'); }));
  ok('Die kommenden sind zu',
     [].every.call(kt, function(k, i){ return (i + 1 > st) === k.classList.contains('zu'); }));
  ok('Genau eine ist die aktuelle',
     document.querySelectorAll('#kt-bahn .kt.jetzt').length === 1
     && +document.querySelector('#kt-bahn .kt.jetzt').dataset.n === st);
  ok('Nur die verschlossenen tragen ein Schloss',
     [].every.call(kt, function(k, i){ return (i + 1 > st) === !!k.querySelector('.kt-schloss'); }));
  /* Keine Leiter mehr: die naechste Karte sagt ohnehin, wie viel fehlt,
     und ohne sie sind alle zwoelf gleich gross — beim Wischen springt
     nichts. */
  ok('Keine Leiter mehr auf der Karte',
     document.querySelectorAll('#kt-bahn .kt-leiter').length === 0);
  ok('Alle Karten sind gleich gebaut',
     [].every.call(kt, function(k){
       return k.querySelectorAll('.kt-band, .kt-fenster, .kt-wer, .kt-fach, .kt-fuss').length === 5;
     }));
  ok('Die erreichten tragen einen Stempel, die aktuelle nicht',
     document.querySelectorAll('#kt-bahn .kt-stempel').length === st - 1);
  ok('Und er sitzt im Fenster, nicht ueber dem Band',
     [].every.call(document.querySelectorAll('#kt-bahn .kt-stempel'),
                   function(p){ return !!p.closest('.kt-fenster'); }));

  /* ── Auf, zu, auf ──
     Der Rueckflug haelt seinen Endzustand fest, sonst blitzten die
     Karten beim Schliessen wieder auf. Blieb er danach liegen, gewann
     er nach dem naechsten Hinflug wieder — Deckkraft 0, die Karten
     waren beim zweiten Oeffnen weg. jsdom rechnet keine Animationen,
     also wird animate() hier nachgebaut: geprueft wird, dass vor jedem
     Flug abgeraeumt wird und am Ende nichts Fertiges liegen bleibt. */
  (function(){
    var alle = [];
    Element.prototype.animate = function(kf, opt){
      var a = { weg:false, fill:(opt && opt.fill) || 'none',
                cancel:function(){ this.weg = true; } };
      this.__an = (this.__an || []).concat(a);
      alle.push(a);
      return a;
    };
    Element.prototype.getAnimations = function(){
      return (this.__an || []).filter(function(a){ return !a.weg; });
    };
    var kiste = document.querySelector('.mkv-in');
    var b = document.querySelector('#mkv');
    /* Der Timer beim Schliessen raeumt selbst auf — hier wird der
       haertere Fall gespielt: gleich wieder aufgemacht, bevor er
       feuert. Genau so kam es vor. */
    for(var runde = 0; runde < 3; runde++){
      karteAuf(); karteZu(); b.classList.remove('on', 'weg');
    }
    karteAuf();
    var offen = kiste.getAnimations();
    ok('Vier Fluege, jeder raeumt den vorigen ab', alle.length === 7, alle.length);
    ok('Nach dem Oeffnen laeuft genau einer', offen.length === 1, offen.length);
    ok('Und keiner haelt mehr einen alten Endzustand fest',
       offen.every(function(a){ return a.fill !== 'both'; }));
    karteZu();
  })();
  /* Im Fach steht bei jeder etwas anderes — das ist der einzige Teil,
     der wechselt. */
  ok('Im Fach der aktuellen steht die gesparte Zeit',
     document.querySelector('#kt-bahn .kt.jetzt .kt-fach u').textContent === 'Zeit gespart');
  ok('Bei einer verschlossenen steht, was fehlt',
     kt[st].querySelector('.kt-fach u').textContent.indexOf('Noch ') === 0,
     kt[st].querySelector('.kt-fach u').textContent);
  ok('Jede Karte traegt ihre Stufenfarbe',
     kt[0].style.getPropertyValue('--rf') === RAENGE[0].a
     && kt[11].style.getPropertyValue('--rf') === RAENGE[11].a,
     kt[11].style.getPropertyValue('--rf'));
  ok('Und einen dunkleren Grund dazu', /^#[0-9a-f]{6}$/.test(kt[0].style.getPropertyValue('--rtief')),
     kt[0].style.getPropertyValue('--rtief'));
  ok('Zwoelf Punkte, so viele wie Karten',
     document.querySelectorAll('#kt-punkte i').length === RAENGE.length);
  ok('Die erreichten Punkte sind eingefaerbt',
     document.querySelectorAll('#kt-punkte i.frei').length === st);

  /* ── Die Profilbilder ──
     Seit 15.09.2026 sind es 117 statt 12, als WebP in 288 x 384. */
  ok('116 Motive stehen zur Wahl',  AVATARE === 116, AVATARE);
  ok('Zu jedem ein Pastellgrund',   AV_GRUND.length === AVATARE, AV_GRUND.length);
  ok('Und alle sind Farbwerte',
     AV_GRUND.every(function(c){ return /^#[0-9A-F]{6}$/.test(c); }),
     AV_GRUND.filter(function(c){ return !/^#[0-9A-F]{6}$/.test(c); }).join(','));
  /* Kein Muster mit Backslash: diese Pruefungen stehen in einer
     Schablonenzeichenkette, dort wird aus \d ein d. */
  ok('Die Bilder sind WebP',        avDatei(1) === 'av-1.webp?v=' + AV_STAND, avDatei(1));
  malAvGitter();
  ok('Das Gitter zeigt alle',
     document.querySelectorAll('#avgrid .avopt').length === AVATARE,
     document.querySelectorAll('#avgrid .avopt').length);
  ok('Mit dem Zurueck-Knopf davor',
     document.querySelector('#avgrid').firstElementChild.classList.contains('zurueckbtn'));
  /* Ein Nachzuegler bekommt die naechste freie Nummer — eine mittendrin
     einzuschieben wuerde allen darueber das Bild wechseln, in jedem
     Profil steht ja nur die Zahl. Gezeigt wird er trotzdem mittendrin. */
  var reihe = avReihenfolge();
  ok('Die Reihe enthaelt jedes Motiv einmal',
     reihe.length === AVATARE && new Set(reihe).size === AVATARE, reihe.length);
  ok('Der Wackelpudding steht in der Mitte', reihe[56] === 116, reihe.indexOf(116) + 1);
  ok('Und das Gitter zeigt ihn dort',
     +document.querySelectorAll('#avgrid .avopt')[56].dataset.av === 116,
     document.querySelectorAll('#avgrid .avopt')[56].dataset.av);
  ok('Davor und danach laeuft es der Reihe nach',
     reihe[55] === 56 && reihe[57] === 57, reihe.slice(54, 59).join(','));
  /* 117 Bilder auf einmal zu laden waere ein Schwall — sie kommen, wenn
     man zu ihnen scrollt. */
  ok('Sie laden erst beim Scrollen',
     [].every.call(document.querySelectorAll('#avgrid .avopt img'),
                   function(i){ return i.getAttribute('loading') === 'lazy'; }));
  /* Das dritte Motiv ist ersetzt, nicht entfernt: die Nummer bleibt,
     damit sich bei niemandem das Bild verschiebt. */
  ok('Nummer 3 traegt jetzt ein neues', AV_GRUND[2] === '#D2EAFD', AV_GRUND[2]);
  /* normalize() hatte die Obergrenze als Zahl stehen: 12. Als aus zwoelf
     Motiven ueber hundert wurden, warf es jede hoehere Wahl beim Laden
     weg — man suchte sich eines aus und hatte nach dem Neuladen wieder
     das zugeteilte drin. */
  ok('Eine hohe Wahl ueberlebt das Laden',
     normalize({ id:'pAv', vorname:'Test', dob:'1990-01-01', avatar:AVATARE }).avatar === AVATARE,
     normalize({ id:'pAv', vorname:'Test', dob:'1990-01-01', avatar:AVATARE }).avatar);
  /* Seit 20.09.2026 bleibt das Feld nicht leer: eine unbrauchbare Zahl
     wird durch die zugeteilte ersetzt, nicht bloss entfernt. Sonst
     rechnete sie jedes Zeichnen neu und stuende nirgends — die Datenbank
     schrieb dann in die oeffentliche Zeile eine 1. */
  var ohne = { id:'pAv', vorname:'Test', dob:'1990-01-01' };
  var zu   = normalize({ id:'pAv', vorname:'Test', dob:'1990-01-01', avatar:AVATARE + 1 });
  var null0= normalize({ id:'pAv', vorname:'Test', dob:'1990-01-01', avatar:0 });
  ok('Eine zu hohe wird ersetzt',   zu.avatar === avZufall(ohne), zu.avatar + ' / ' + avZufall(ohne));
  ok('Und eine von null auch',      null0.avatar === avZufall(ohne), null0.avatar);
  ok('Wer keines hat, bekommt eines',
     normalize({ id:'pAv2', vorname:'Test', dob:'1990-01-01' }).avatar === avZufall(ohne));
  ok('Und es steht im Bereich',
     avZufall(ohne) >= 1 && avZufall(ohne) <= AVATARE, avZufall(ohne));
  /* Der Teiler ist fest: sonst wechselt jedem ohne eigene Wahl das Bild,
     sobald Motive dazukommen. */
  ok('Der Teiler haengt nicht an AVATARE', AV_ZUFALL_BIS === 116, AV_ZUFALL_BIS);
  ok('Zweimal dieselbe Person, dasselbe Bild',
     avZufall({ vorname:'Philipp', dob:'1988-03-04' }) === avZufall({ vorname:'Philipp', dob:'1988-03-04' }));
  ok('Andere Person, anderes Bild',
     avZufall({ vorname:'Philipp', dob:'1988-03-04' }) !== avZufall({ vorname:'Judith', dob:'1991-07-19' }));
  /* Eine getroffene Wahl bleibt unangetastet. */
  ok('Eine gueltige Wahl bleibt',
     normalize({ id:'pAv3', vorname:'Test', dob:'1990-01-01', avatar:42 }).avatar === 42);

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
  /* Auch hier laesst sich jeder Becher andruecken — und funkelt in
     seiner eigenen Farbe. */
  var kunde = document.querySelectorAll('#fi-zeilen .teek');
  ok('Jedes Getraenk ist ein Knopf',
     [].every.call(kunde, function(k){ return k.tagName === 'BUTTON'; }));
  ok('Mit drei Funken darin',
     [].every.call(kunde, function(k){ return k.querySelectorAll('.teekb i').length === 3; }));
  ok('Jedes traegt seine eigene Farbe',
     kunde[0].getAttribute('style').indexOf('--tee:' + TEE[0].f) > -1
     && kunde[9].getAttribute('style').indexOf('--tee:' + TEE[9].f) > -1,
     kunde[9].getAttribute('style'));
  kunde[4].dispatchEvent(new window.MouseEvent('pointerdown', { bubbles:true }));
  ok('Ein Tipp laesst genau den einen glitzern',
     kunde[4].classList.contains('glitzer') && !kunde[3].classList.contains('glitzer'));
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
  /* Seit 15.09.2026: die erste Stunde ist „kuerzlich", danach vier
     Stunden einzeln, dann erst der Tag. */
  ok('Bis eine Stunde: kuerzlich',    zuletztText(vor(0.5)) === 'kürzlich gesehen',
     zuletztText(vor(0.5)));
  ok('Eine Stunde im Singular',       zuletztText(vor(1.2)) === 'vor 1 Stunde',
     zuletztText(vor(1.2)));
  ok('Zwei bis vier im Plural',
     zuletztText(vor(2.3)) === 'vor 2 Stunden' && zuletztText(vor(3.1)) === 'vor 3 Stunden'
     && zuletztText(vor(4.6)) === 'vor 4 Stunden',
     [zuletztText(vor(2.3)), zuletztText(vor(3.1)), zuletztText(vor(4.6))].join(' | '));
  ok('Spaeter am selben Tag: heute',  zuletztText(vor(5.2)).indexOf('heute') === 0
     || zuletztText(vor(5.2)) === 'gestern', zuletztText(vor(5.2)));
  /* Der Punkt haelt mit dem Wort Schritt. */
  ok('Gruen nur, solange kuerzlich dasteht',
     zuletztArt(vor(0.5)) === 'frisch' && zuletztArt(vor(1.2)) !== 'frisch',
     zuletztArt(vor(0.5)) + ' / ' + zuletztArt(vor(1.2)));
  ok('Ein Tag: gestern',              zuletztText(vor(24 * 1 + 12)) === 'gestern'
     || zuletztText(vor(24 * 1 + 12)) === 'vor 2 Tagen', zuletztText(vor(36)));
  /* Ohne regulaeren Ausdruck: der Pruefteil steckt in einer Vorlage,
     dort waere \\d nur ein d. */
  ok('Mehrere Tage werden gezaehlt',  zuletztText(vor(24 * 12)) === 'vor 12 Tagen',
     zuletztText(vor(24 * 12)));
  /* Bis 90 Tage wird gezaehlt — vorher war bei 40 Schluss. */
  ok('Auch nach zwei Monaten noch',   zuletztText(vor(24 * 60)) === 'vor 60 Tagen',
     zuletztText(vor(24 * 60)));
  ok('Bei 89 Tagen noch die Zahl',    zuletztText(vor(24 * 89 + 2)) === 'vor 89 Tagen',
     zuletztText(vor(24 * 89 + 2)));
  ok('Ab 90 Tagen wird es vage',      zuletztText(vor(24 * 90 + 2)) === 'es ist schon ewig her',
     zuletztText(vor(24 * 90 + 2)));
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
  /* Seit 15.09.2026 eine Pille mit LVL und Zahl in einer Zeile, oben
     rechts in der Ecke — vorher eine eckige Box mit der Ziffer ueber
     dem Woertchen. */
  ok('Das geteilte Level steht rechts',
     karten[1].querySelector('.tm-lvl').textContent === 'Lvl 3',
     karten[1].querySelector('.tm-lvl').textContent);
  ok('Und zwar in der Ecke des Kopfes',
     karten[1].querySelector('.tm-rechts').parentNode.className === 'tm-kopf'
     && karten[1].querySelector('.tm-rechts').firstChild.classList.contains('tm-lvl'),
     karten[1].querySelector('.tm-rechts').parentNode.className);
  ok('Das Herz sitzt darunter in seinem Platz',
     !!karten[1].querySelector('.tm-rechts > .tm-herzplatz > .tm-herz'));
  ok('Bei null bleibt die Pille grau', karten[2].querySelector('.tm-lvl').textContent === 'Lvl 0'
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
  /* Vorher stand dort nur „Hat dir einen geschickt" — einen was? */
  ok('Und zwar, was geschickt wurde',
     bernd.querySelector('.tm-neu').textContent === 'Hat dir einen Bubble Tea geschickt',
     bernd.querySelector('.tm-neu').textContent);
  /* Der Satz ist zu lang fuer die schmale Spalte neben dem Namen und
     steht darum in einer eigenen Zeile unter dem Kopf. */
  ok('Und steht unter der Zeile, nicht daneben',
     bernd.querySelector('.tm-neu').previousSibling.className === 'tm-oben',
     bernd.querySelector('.tm-neu').previousSibling.className);
  /* Der Becher ist ein Knopf: antippen laesst ihn wackeln und funkeln. */
  var bec = bernd.querySelector('.tm-becher');
  ok('Der Becher laesst sich antippen', !!bec && bec.tagName === 'BUTTON');
  ok('Mit drei Funken darin',           bec && bec.querySelectorAll('i').length === 3);
  ok('Und dem Becher selbst',           !!bec.querySelector('img.becher'));
  bec.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles:true }));
  ok('Ein Tipp laesst ihn glitzern',    bec.classList.contains('glitzer'));
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
   /* ─── 15.09.2026: Schweben, Wackeln, Funkeln ─────────────────── */
   ['Wer mir einen geschickt hat, dessen Bild schwebt',
    /\.tm\.offen \.tm-bild\{ animation:mkWippe 3\.4s ease-in-out infinite alternate \}/.test(roh)],
   ['Und zwar genauso wie auf der Mitgliedschaftskarte',
    /\.mk-bild\{[\s\S]{0,260}animation:mkWippe 3\.4s ease-in-out infinite alternate/.test(roh)],
   /* Beide Orte teilen sich dieselben Regeln: der eine Becher in der
      Mitgliedskarte und alle zehn in der Getraenkekunde. */
   ['Der Becher wackelt beim Andruecken',
    /\.tm-becher\.glitzer \.becher, \.teek\.glitzer \.teekb img\{\s*\n\s*animation:teeWackel/.test(roh)
    && /@keyframes teeWackel\{/.test(roh)],
   ['Und es funkelt dazu',
    /\.tm-becher\.glitzer i, \.teek\.glitzer \.teekb i\{\s*\n\s*animation:teeFunke/.test(roh)
    && /@keyframes teeFunke\{/.test(roh)],
   ['Die Funken sind Sterne in der Farbe des Getraenks',
    /\.tm-becher i, \.teekb i\{[\s\S]{0,220}background:var\(--tee, var\(--butter\)\);[\s\S]{0,120}clip-path:polygon/.test(roh)],
   ['Der Becher kippt am Fuss, nicht um die Mitte',
    /\.tm-becher \.becher, \.teekb img\{ transform-origin:50% 88% \}/.test(roh)],
   ['Ein Weg fuer beide Orte',
    /\$\('#v-firma'\)\.addEventListener\('pointerdown', becherTipp\);/.test(roh)
    && /e\.target\.closest\('\.tm-becher, \.teek'\)/.test(roh)],
   ['Weniger Bewegung laesst beides weg',
    /prefers-reduced-motion:reduce\)\{[\s\S]{0,300}\.tm\.offen \.tm-bild\{ animation:none \}[\s\S]{0,240}\.teek\.glitzer \.teekb img, \.teek\.glitzer \.teekb i\{ animation:none \}/.test(roh)],
   ['Der Vermerk bricht nicht um',
    /\.tm-neu\{[\s\S]{0,260}white-space:nowrap/.test(roh)],
   /* ─── 15.09.2026: Level als Pille oben rechts ──────────────────── */
   ['Das Level ist eine Pille wie auf der Mitgliedschaftskarte',
    /\.tm-lvl\{[\s\S]{0,240}border-radius:99px;[\s\S]{0,200}text-transform:uppercase/.test(roh)],
   ['Die rechte Spalte haengt am Kopf',
    /\.tm-kopf\{ position:relative; padding-right:74px \}/.test(roh)
    && /\.tm-rechts\{ position:absolute; top:0; right:0; bottom:-11px;/.test(roh)],
   ['Die eigene Karte gibt den Platz nicht her',
    /\.tm\.ich \.tm-kopf\{ padding-right:0 \}/.test(roh)],
   ['Und reicht bis zur Linie, damit das Herz mittig sitzt',
    /\.tm-herzplatz\{ flex:1; display:flex; align-items:center \}/.test(roh)
    && /\.tm-tee\{[\s\S]{0,160}margin-top:11px/.test(roh)],
   ['Die Farben bleiben, wie sie waren',
    /\.tm-lvl\.an\{ color:var\(--tee\); background:color-mix\(in srgb, var\(--tee\) 16%, transparent\)/.test(roh)],
   ['Bis 90 Tage wird gezaehlt', /if\(tage < 90\) return 'vor ' \+ tage \+ ' Tagen';/.test(roh)],
   /* ─── 15.09.2026: 117 Profilbilder ────────────────────────────── */
   ['Das Bildgitter faengt oben an, nicht in der Mitte',
    /\.avgrid\{[\s\S]{0,200}align-content:start/.test(roh)],
   /* Nachgemessen: mit auto quetscht das Gitter alle 30 Reihen in den
      Kasten — 14,7 px hoch, die Kacheln uebereinander. */
   ['Und die Reihen behalten ihre Hoehe',
    /\.avgrid\{[\s\S]{0,600}grid-auto-rows:min-content;/.test(roh)],
   /* ─── 20.09.2026: der Kopf ist die Karte ──────────────────────── */
   ['Der Kopf traegt dieselben Pastelltoene wie die grosse Karte',
    /\.mausweis\{[\s\S]{0,700}background:linear-gradient\(168deg,var\(--pa[\s\S]{0,80}var\(--pb/.test(roh)],
   ['Und eine eigene Tinte, nicht --f-2',
    /--ma-ink:#1A1026;/.test(roh) && !/\.mausweis\{[\s\S]{0,700}color:var\(--f-2\)/.test(roh)],
   ['Die Flaeche liegt unter dem Inhalt',
    /\.ma-flaeche\{ position:absolute; inset:0; z-index:0;/.test(roh)
    && /\.ma-oben\{[\s\S]{0,160}pointer-events:none \}/.test(roh)],
   ['Bild und Postfach bleiben anfassbar',
    /\.ma-oben \.avbig, \.ma-oben \.mtile\{ pointer-events:auto \}/.test(roh)],
   /* Der Einlauf des Menues belegt transform — eine Animation schlaegt
      jede normale Regel. Der Druck muss darum ueber scale gehen. */
   ['Der Druck geht ueber scale, nicht ueber transform',
    /\.mausweis\.druck\{ scale:\.965;/.test(roh)
    && /transition:scale \.14s var\(--ease-out\)/.test(roh)],
   ['Und haelt, solange der Finger liegt',
    /\['pointerup','pointercancel','pointerleave'\]\.forEach/.test(roh)],
   /* ─── Der Stapel: Bewegung und Zustaende ───────────────────────── */
   ['Gewischt wird mit Einrasten',
    /\.kt-bahn\{[\s\S]{0,400}scroll-snap-type:x mandatory;/.test(roh)
    && /\.kt\{[\s\S]{0,120}scroll-snap-align:center; scroll-snap-stop:always;/.test(roh)],
   ['Die Tiefe kommt aus --nah und geht ueber scale',
    /scale:calc\(\.9 \+ \.1 \* var\(--nah, 1\)\);/.test(roh)
    && /k\.style\.setProperty\('--nah'/.test(roh)],
   ['Gerechnet wird einmal je Bild, nicht je Scroll-Ereignis',
    /_ktRaf = requestAnimationFrame\(\(\) => \{ _ktRaf = 0; kartenTiefe\(\); \}\);/.test(roh)],
   /* Die Farbe kommt jetzt fuer alle zwoelf aus demselben Schema um
      die Rangfarbe herum — vorher lief der Verlauf nach fast Schwarz
      und alle sahen aus der Entfernung gleich dunkel aus. */
   ['Der Verlauf bleibt bei der Rangfarbe',
    roh.includes('background:linear-gradient(168deg, var(--rhoch,#6E7CA8) 0%, var(--rf2,#5C6A94) 52%,')
    && roh.includes("k.style.setProperty('--rhoch', mischWeiss(rang(n).b, .12));")
    && roh.includes("k.style.setProperty('--rtief', mischSchwarz(rang(n).b, .26));")],
   ['Ein zarter Schatten traegt die weisse Schrift',
    roh.includes('text-shadow:0 1px 2px rgba(10,6,18,.30);')],
   ['Unten saeuft die Farbe nicht mehr ab',
    !roh.includes('mischSchwarz(rang(n).b, .58)')],
   /* Zwei Sonderregeln fuer die Legende sind weggefallen: eine goldene
      und eine graue, die sie fuer die verschlossene Karte wieder
      zurueckgenommen hat. Das Schema macht beides von selbst. */
   ['Keine Sonderregeln mehr fuer die Legende',
    !roh.includes('.kt.gold .kt-vorn') && !roh.includes('.kt.zu.gold .kt-vorn')],
   ['Das geteilte Bild nimmt dieselben drei Halte',
    roh.includes('kg.addColorStop(0, mischWeiss(r.b, .12)); kg.addColorStop(.52, r.b);')
    && roh.includes('kg.addColorStop(1, dunkel(r.b, .26));')],
   /* Umdrehen wie bisher — vorne wer und wie weit, hinten die Angaben. */
   ['Die Karte laesst sich umdrehen',
    /\.kt\.um \.kt-dreh\{ transform:rotateY\(180deg\) \}/.test(roh)
    && /k\.classList\.toggle\('um'\);/.test(roh)],
   ['Nur die vordere dreht sich, die anderen kommen erst in die Mitte',
    /if\(n !== _ktVorne\)\{ ktZeige\(n, true\); return; \}/.test(roh)],
   ['Der Glanz wandert, aber nur auf der vorderen',
    /\.kt\.vorn \.kt-glanz\{ animation:ktGlanz/.test(roh)
    && /@keyframes ktGlanz\{/.test(roh)],
   ['Und kein Uebergang auf der Groesse, der dem Finger nachlaeuft',
    !/\.kt\{[\s\S]{0,420}transition:scale/.test(roh)],
   ['Das Band sitzt unten und nimmt die Fassung auf',
    /\.kt-fuss\{[\s\S]{0,240}margin-top:auto;[\s\S]{0,120}background:var\(--kt-band/.test(roh)
    && /--kt-band:rgba\(255,255,255,\.20\);/.test(roh)
    && /--kt-band:rgba\(148,142,164,\.20\);/.test(roh)],
   ['Die Plakette traegt die Farbe der Stufe, kein Schwarz',
    /\.ma-lvl\{[\s\S]{0,200}background:var\(--rd, #5C6A94\);/.test(roh)],
   ['Weniger Bewegung laesst das Einrasten weg',
    /prefers-reduced-motion:reduce\)\{\s*\n\s*\.kt\{ scale:1; opacity:1 \}[\s\S]{0,200}\.kt-bahn\{ scroll-snap-type:none \}/.test(roh)],
   ['Die alte Drehbuehne ist weg',
    !/id="mk-dreh"/.test(roh) && !/function karteDreh/.test(roh)],
   /* Der Kopf IST die Karte — also wandert der Glanz auch dort. */
   ['Der Glanz wandert auch im Menue',
    /\.menu\.on:not\(\.zu\) \.mausweis \.ma-glanz\{ animation:maGlanz/.test(roh)
    && /@keyframes maGlanz\{/.test(roh)],
   /* Die Grundregel darf sie NICHT tragen — sonst liefe sie auch bei
      geschlossenem Menue weiter. Ein einfaches "kommt nicht vor" reicht
      als Pruefung nicht: die enge Regel endet selbst auf .ma-glanz{. */
   ['Aber nur, solange das Menue offen ist',
    /\.ma-glanz\{ position:absolute;[^}]*transform:translateX\(-85%\) \}/.test(roh)
    && (roh.match(/animation:maGlanz/g) || []).length === 1],
   /* Schwarz sass auf dem hellen Pastell wie ein Riegel und verschwand
      in der dunklen Fassung im Grund der Seite. */
   ['Das Band im Kopf traegt die Farbe der Stufe',
    /\.ma-band\{[\s\S]{0,260}background:var\(--rd, #5C6A94\)/.test(roh)],
   ['Die Vorderseite fuellt die Karte ganz aus',
    /\.kt-vorn\{ position:relative; flex:1; width:100%;/.test(roh)
    && /\.kt-dreh\{ position:relative; flex:1; display:flex;/.test(roh)],
   ['Im Fach bricht nichts um',
    /\.kt-fach b\{[\s\S]{0,160}white-space:nowrap; flex:none \}/.test(roh)],
   /* Die Karten drehen sich beim Wischen leicht mit — das sagt, dass sie
      eine Rueckseite haben. Ohne den Hinweis kam niemand darauf. */
   ['Beim Wischen drehen die Karten mit',
    /transform:rotateY\(calc\(var\(--seite, 0\) \* 16deg\)\);/.test(roh)
    && /k\.style\.setProperty\('--seite'/.test(roh)],
   ['Waehrend des Wischens ohne Uebergang',
    /\.kt-bahn\.wischt \.kt-dreh\{ transition:none \}/.test(roh)
    && /bahn\.classList\.add\('wischt'\);/.test(roh)],
   /* Das Aufschlagen war ein reines Aufblenden — die Karten standen
      schlagartig in voller Groesse da. Jetzt fahren sie aus der Karte
      im Menue heraus, gemessen aus beiden Rechtecken. */
   ['Der Stapel faehrt aus der Menuekarte heraus',
    roh.includes('function mkvFlug(auf){')
    && roh.includes("const von = _vonMenu ? $('#mausweis') : null;")
    && roh.includes('gr = Math.max(.55, Math.min(.96, q.width / z.width * .96));')],
   ['Aufschlagen mit Expo-Kurve, Schliessen kuerzer',
    roh.includes('const dauer = auf ? 620 : 300;')
    && roh.includes("easing: auf ? 'cubic-bezier(.16,1,.3,1)' : 'cubic-bezier(.4,0,.72,.2)'")],
   ['Wer Bewegung abgestellt hat, bekommt keine',
    roh.includes("try{ still = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}")],
   ['Beide Wege benutzen denselben Flug',
    roh.includes('  mkvFlug(true);\n  ktBahnHorchen();')
    && roh.includes('const dauer = mkvFlug(false);')
    && roh.includes("}, dauer + 20);")],
   ['Der Stapel blendet nicht mehr nur auf',
    !roh.includes('@keyframes mkvAuf')],
   /* Die Plakette sortierte sich mit z-index in den Kontext der
      Drehbuehne ein und stand dort als eigenes Objekt im Raum. */
   ['Jede Kartenseite hat ihren eigenen Stapelkontext',
    roh.includes('.kt-vorn, .kt-rueck{ border-radius:26px; overflow:hidden; color:#fff; isolation:isolate;')],
   ['Die Plakette sitzt im Fenster, nicht ueber dem Band',
    roh.includes('.kt-stempel{ position:absolute; top:10px; right:10px;')
    && !roh.includes('.kt-stempel{ position:absolute; top:17px; right:17px; z-index:4;')],
   ['Und steht im Markup hinter dem Schloss',
    roh.includes("+   (frei && !ist ? '<span class=\"kt-stempel\">Erreicht</span>' : '')")],
   /* Auf der Rueckseite klebte alles oben, darunter blieb ein Loch. */
   ['Der Datenblock fuellt die Rueckseite',
    roh.includes('.kt-zeilen{ flex:1; display:flex; flex-direction:column; justify-content:stretch;')
    && roh.includes('.kt-zeilen div{ flex:1; min-height:0; display:flex; align-items:center;')],
   ['Die letzte Zeile schwebt nicht mehr',
    roh.includes('.kt-zeilen div:last-child{ border-bottom:0 }')],
   ['Die Karten haben eine Kante',
    roh.includes('box-shadow:inset 0 0 0 1px rgba(255,255,255,.13), 0 26px 56px -24px rgba(var(--s-schatten),.8) }')],
   ['Der Satz unten sitzt an einer Linie',
    roh.includes('.kt-hinweis{ margin-top:0; border-top:1px solid rgba(255,255,255,.16);')],
   ['Beim Aufschlagen stupst die vordere Karte an',
    /\.kt\.stups \.kt-dreh\{ animation:ktStups/.test(roh) && /@keyframes ktStups\{/.test(roh)],
   ['Die Obergrenze in normalize steht nicht als Zahl da',
    /if\(!\(av >= 1 && av <= AVATARE\)\) delete p\.avatar;/.test(roh)],
   ['Das zugeteilte Bild wird hinterlegt',
    /if\(!p\.avatar && \(p\.vorname \|\| p\.dob\)\) p\.avatar = avZufall\(p\);/.test(roh)],
   ['Und gleich in die Cloud geschoben',
    /if\(push \|\| \(!hatteBild && ME\.avatar\)\) cloudQueue\(\);/.test(roh)],
   ['Der Ausloeser ueberschreibt das Bild nicht mit einer 1',
    /avatar  = coalesce\(av, public\.mitglieder\.avatar\),/.test(sql)
    && /av := nullif\(d->>'avatar', ''\)::smallint;/.test(sql)],
   ['Und gleicht einmalig an, wo records eine Nummer traegt',
    /update public\.mitglieder m[\s\S]{0,400}nullif\(r\.data::jsonb->>'avatar',''\) is not null/.test(sql)],
   ['Nur die ersten laufen gestaffelt ein',
    /\.menu-card\.avauf \.avopt:nth-child\(n\+14\)\{animation:none\}/.test(roh)],
   ['Und die Bilder laden erst beim Scrollen',
    /avDatei\(i\) \+ '" alt="" '\s*\n\s*\+ 'loading="lazy" decoding="async"/.test(roh)],
   ['Die Stunden gehen den Tagen vor',
    /if\(std === 1\) return 'vor 1 Stunde';\s*\n\s*if\(std <= 4\) return 'vor ' \+ std \+ ' Stunden';\s*\n\s*const h = new Date\(\)/.test(roh)],
   ['Halb rot, halb violett gibt es wirklich',
    /\.zaehler\.beides\{background:linear-gradient\(90deg,#FF453A 0 50%,var\(--butter\) 50% 100%\)\}/.test(roh)]
  ];
  /* Jedes Motiv braucht seine Datei — ohne diese Pruefung faende man
     eine vergessene erst als leeren Rahmen auf dem Telefon. */
  {
    const ordner = require('path').dirname(DATEI);
    const anz = +(roh.match(/const AVATARE = (\d+);/) || [])[1];
    const fehlen = [];
    for(let i = 1; i <= anz; i++)
      if(!fs.existsSync(require('path').join(ordner, 'av-' + i + '.webp'))) fehlen.push(i);
    E.push({ n: 'Zu jedem Motiv liegt eine Datei',
             ok: anz > 0 && fehlen.length === 0,
             z: fehlen.length ? 'es fehlen ' + fehlen.join(',') : '' });
    const png = fs.readdirSync(ordner).filter(f => /^av-\d+\.png$/.test(f));
    E.push({ n: 'Und kein altes PNG mehr daneben', ok: png.length === 0, z: png.join(',') });
  }
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
