/* Testlauf: Dienstzeiten mit Datum.
   Abgemeldet — ohne ?desktop=1 kehrt boot() sofort zurück. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ZIEL = process.argv[2] || path.join(__dirname, '..', 'index.html');
const vc = new VirtualConsole();
['jsdomError','error','warn'].forEach(e => vc.on(e, () => {}));

const dom = new JSDOM(fs.readFileSync(ZIEL, 'utf8'), {
  url: 'https://moji-app.at/', runScripts: 'dangerously',
  pretendToBeVisual: true, virtualConsole: vc
});

const pruef = `
window.__E = [];
function ok(n, b, z){ window.__E.push({ n:n, ok:!!b, z: z===undefined?'':String(z) }); }

ok('Abgemeldet (UID === null)', UID === null, 'UID=' + UID);

/* Ein Plan mit frei waehlbaren Stunden pro Tag Mo–Fr. */
function planMit(von, bis){
  const s = defaultSched();
  for(let dow = 1; dow <= 5; dow++)
    s.weeks[0][dow] = { vmOn:true, vmFrom:von, vmTo:bis, nmOn:false, nmFrom:'13:00', nmTo:'17:00' };
  for(let dow = 6; dow <= 6; dow++)
    s.weeks[0][dow] = { vmOn:false, vmFrom:von, vmTo:bis, nmOn:false, nmFrom:'13:00', nmTo:'17:00' };
  return s;
}
const VIER  = planMit('08:00','12:00');   /* 4 h am Tag */
const ACHT  = planMit('08:00','16:00');   /* 8 h am Tag */

/* ── 1 · Ohne Verlauf verhaelt sich alles wie vorher ── */
const p0 = normalize({ id:'pA', vorname:'A', dob:'1990-01-01', sched: JSON.parse(JSON.stringify(VIER)) });
ok('normalize legt schedAlt als leere Liste an', Array.isArray(p0.schedAlt) && p0.schedAlt.length === 0);
ok('Ohne Verlauf liefert schedFuer den aktuellen Plan',
   schedFuer(p0, new Date(2020,0,15)) === p0.sched);
ok('schedGiltAb ist null ohne Verlauf', schedGiltAb(p0) === null);
/* Montag, 13.01.2020 — kein Feiertag (der 6. waere Heilige Drei Koenige) */
ok('Alter Monat rechnet mit dem einzigen Plan',
   evalDay(p0, 2020, 0, 13).work === 4, evalDay(p0, 2020, 0, 13).work);
/* Und die Gegenprobe: der Feiertag wird weiterhin als solcher erkannt */
ok('Heilige Drei Koenige bleibt Feiertag',
   evalDay(p0, 2020, 0, 6).type === 'feier' && evalDay(p0, 2020, 0, 6).work === 0,
   evalDay(p0, 2020, 0, 6).type);

/* ── 2 · Wechsel ab einem Datum ── */
const p = normalize({ id:'pB', vorname:'B', dob:'1990-01-01', sched: JSON.parse(JSON.stringify(VIER)) });
ok('Wechsel ab 01.10.2026 wird angenommen', schedWechsel(p, '2026-10-01', ACHT) === true);
ok('Verlauf hat jetzt eine Fassung', p.schedAlt.length === 1, p.schedAlt.length);
ok('Die alte Fassung endet am 30.09.2026', p.schedAlt[0].bis === '2026-09-30', p.schedAlt[0].bis);
ok('schedGiltAb sagt 01.10.2026', schedGiltAb(p) === '2026-10-01', schedGiltAb(p));

/* Montag 28.09.2026 → noch 4 h. Montag 05.10.2026 → schon 8 h. */
ok('Tag vor dem Wechsel rechnet mit dem alten Plan',
   evalDay(p, 2026, 8, 28).work === 4, evalDay(p, 2026, 8, 28).work);
ok('Tag nach dem Wechsel rechnet mit dem neuen Plan',
   evalDay(p, 2026, 9, 5).work === 8, evalDay(p, 2026, 9, 5).work);
/* Genau die Grenze: 30.09. ist ein Mittwoch, 01.10. ein Donnerstag */
ok('30.09.2026 gehoert noch zum alten Plan',
   evalDay(p, 2026, 8, 30).work === 4, evalDay(p, 2026, 8, 30).work);
ok('01.10.2026 gehoert schon zum neuen Plan',
   evalDay(p, 2026, 9, 1).work === 8, evalDay(p, 2026, 9, 1).work);

/* ── 3 · Ein zweiter Wechsel ── */
const ZWEI = planMit('08:00','10:00');    /* 2 h */
ok('Zweiter Wechsel ab 01.01.2027', schedWechsel(p, '2027-01-01', ZWEI) === true);
ok('Verlauf hat zwei Fassungen', p.schedAlt.length === 2, p.schedAlt.length);
ok('Drei Zeitraeume rechnen verschieden', (function(){
  return evalDay(p, 2026, 8, 28).work === 4      /* vor 01.10.26 */
      && evalDay(p, 2026, 10, 2).work === 8      /* dazwischen */
      && evalDay(p, 2027, 0, 4).work === 2;      /* ab 01.01.27 */
})(), evalDay(p,2026,8,28).work + ' / ' + evalDay(p,2026,10,2).work + ' / ' + evalDay(p,2027,0,4).work);

/* ── 4 · Rueckdatieren vor eine bestehende Grenze wird abgelehnt ── */
const vorher = JSON.stringify(p.schedAlt.map(e => e.bis));
ok('Wechsel vor die letzte Grenze wird abgelehnt',
   schedWechsel(p, '2026-06-01', VIER) === false);
ok('Der Verlauf bleibt dabei unangetastet',
   JSON.stringify(p.schedAlt.map(e => e.bis)) === vorher);

/* ── 5 · Fassung entfernen: keine Luecke ── */
const q = normalize({ id:'pC', vorname:'C', dob:'1990-01-01', sched: JSON.parse(JSON.stringify(VIER)) });
schedWechsel(q, '2026-10-01', ACHT);
schedWechsel(q, '2027-01-01', ZWEI);
/* Die mittlere Fassung (bis 2026-12-31, Plan ACHT) entfernen */
ok('Mittlere Fassung entfernen klappt', schedFassungWeg(q, 1) === true);
ok('Danach noch eine Fassung', q.schedAlt.length === 1, q.schedAlt.length);
ok('Die Zeit faellt an die naechstjuengere Fassung',
   evalDay(q, 2026, 10, 2).work === 2, evalDay(q, 2026, 10, 2).work);
ok('Vor der ersten Grenze bleibt es beim alten Plan',
   evalDay(q, 2026, 8, 28).work === 4, evalDay(q, 2026, 8, 28).work);

/* ── 6 · normalize raeumt kaputte Eintraege weg ── */
const r = normalize({ id:'pD', vorname:'D', dob:'1990-01-01',
  sched: JSON.parse(JSON.stringify(VIER)),
  schedAlt: [
    { bis:'kein-datum', sched: JSON.parse(JSON.stringify(ACHT)) },
    { bis:'2026-09-30' },
    null,
    { bis:'2026-03-31', sched: JSON.parse(JSON.stringify(ACHT)) }
  ]});
ok('Kaputte Eintraege fliegen raus', r.schedAlt.length === 1, r.schedAlt.length);
ok('Der brauchbare Eintrag bleibt', r.schedAlt[0].bis === '2026-03-31', r.schedAlt[0].bis);

/* Doppeltes Enddatum: nur eines bleibt uebrig */
const r2 = normalize({ id:'pE', vorname:'E', dob:'1990-01-01',
  sched: JSON.parse(JSON.stringify(VIER)),
  schedAlt: [
    { bis:'2026-09-30', sched: JSON.parse(JSON.stringify(ACHT)) },
    { bis:'2026-09-30', sched: JSON.parse(JSON.stringify(ZWEI)) }
  ]});
ok('Doppeltes Enddatum wird entdoppelt', r2.schedAlt.length === 1, r2.schedAlt.length);

/* Unsortiert hereingegeben → sortiert heraus */
const r3 = normalize({ id:'pF', vorname:'F', dob:'1990-01-01',
  sched: JSON.parse(JSON.stringify(VIER)),
  schedAlt: [
    { bis:'2027-03-31', sched: JSON.parse(JSON.stringify(ACHT)) },
    { bis:'2026-09-30', sched: JSON.parse(JSON.stringify(ZWEI)) }
  ]});
ok('Verlauf kommt sortiert heraus',
   r3.schedAlt[0].bis === '2026-09-30' && r3.schedAlt[1].bis === '2027-03-31',
   r3.schedAlt.map(e => e.bis).join(', '));

/* ── 7 · Mehrfaches normalize aendert nichts mehr ── */
const vorN = JSON.stringify(p.schedAlt.map(e => e.bis));
normalize(p); normalize(p);
ok('normalize ist wiederholbar', JSON.stringify(p.schedAlt.map(e => e.bis)) === vorN);

/* ── 8 · schedGleich erkennt echte Aenderungen ── */
ok('Gleicher Plan gilt als gleich', schedGleich(VIER, JSON.parse(JSON.stringify(VIER))));
ok('Andere Zeiten gelten als verschieden', !schedGleich(VIER, ACHT));
const nurReiter = JSON.parse(JSON.stringify(VIER)); nurReiter.tab = 2; nurReiter.wcLock = false;
ok('Nur Reiter oder Schloss geaendert gilt als gleich', schedGleich(VIER, nurReiter));
const andererVersatz = JSON.parse(JSON.stringify(VIER)); andererVersatz.weekCount = 2; andererVersatz.offset = 1;
ok('Anderer Rhythmus gilt als verschieden', !schedGleich(VIER, andererVersatz));

/* ── 9 · Die Bedienteile sind da ── */
['sab','sab-korr','sab-wechsel','sab-ab','sab-ok','sab-zurueck','sched-hist']
  .forEach(id => ok('Element #' + id + ' vorhanden', !!document.getElementById(id)));

/* ── 10 · Der Zeitraum-Eintrag nutzt den Plan von damals ── */
ME = q;
ok('qTouched nutzt den Plan des jeweiligen Tages',
   qTouched(new Date(2026, 8, 28)) === true && qTouched(new Date(2026, 8, 26)) === false,
   'Mo 28.09. ' + qTouched(new Date(2026,8,28)) + ' · Sa 26.09. ' + qTouched(new Date(2026,8,26)));

/* ── 11 · Verlauf zeichnen ── */
malSchedHist();
const host = document.getElementById('sched-hist');
ok('Verlauf wird gezeichnet', host.innerHTML.indexOf('Frühere Dienstzeiten') >= 0);
ok('Die aktuelle Fassung ist hervorgehoben', !!host.querySelector('.shist-z.jetzt'));
ME = null;
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
  console.log((e.ok ? '  ok   ' : '  FEHL ') + e.n + (e.ok || !e.z ? '' : '  → ' + e.z));
});
console.log('');
console.log(E.length + ' Prüfungen, ' + (E.length - schlecht) + ' bestanden, ' + schlecht + ' gescheitert');
process.exit(schlecht || !dom.window.__FERTIG ? 1 : 0);
