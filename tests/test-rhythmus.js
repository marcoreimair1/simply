/* Testlauf: Wochenrhythmus ohne Kalenderwoche.
   Abgemeldet — ohne ?desktop=1 kehrt boot() sofort zurück. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

/* Zu pruefen ist index.html im Projekt — oder, als Argument
   uebergeben, eine andere Fassung. Nach jedem Push ist das die
   heruntergeladene Datei von moji-app.at. */
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

/* ── 1 · Der gemeldete Fall: zwei Wochen Rhythmus, Samstage ── */
function plan2(){
  /* Woche 1: Samstag frei. Woche 2: Samstag Dienst. */
  const s = defaultSched();
  s.weekCount = 2;
  s.offset = 0;
  s.basis = 'lauf';
  s.weeks[0][6] = { vmOn:false, vmFrom:'08:00', vmTo:'12:00', nmOn:false, nmFrom:'13:00', nmTo:'17:00' };
  s.weeks[1][6] = { vmOn:true,  vmFrom:'08:00', vmTo:'12:00', nmOn:false, nmFrom:'13:00', nmTo:'17:00' };
  return s;
}
const S = plan2();
const sa = t => new Date(t);
const w = d => rhythmusWoche(S, d);

const a = sa('2027-01-02T12:00:00'), b = sa('2027-01-09T12:00:00');
ok('02.01.27 und 09.01.27 sind verschiedene Rhythmuswochen', w(a) !== w(b),
   'Woche ' + (w(a)+1) + ' vs Woche ' + (w(b)+1));

/* Genau einer der beiden Samstage ist Arbeitstag */
const pa = dayPlan(S, a), pb = dayPlan(S, b);
ok('Genau einer der beiden Samstage ist Dienst',
   (pa.vm + pa.nm > 0) !== (pb.vm + pb.nm > 0),
   '02.01. ' + (pa.vm+pa.nm) + ' h · 09.01. ' + (pb.vm+pb.nm) + ' h');

/* ── 2 · Kein Jahreswechsel darf den Takt brechen ──
   Über 20 Jahre darf nie zweimal hintereinander dieselbe Woche kommen. */
let brueche = [], vorher = null;
for(let t = Date.UTC(2024,0,1); t <= Date.UTC(2044,0,1); t += 7*864e5){
  const d = new Date(t);
  const cur = rhythmusWoche(S, d);
  if(vorher !== null && cur === vorher) brueche.push(d.toISOString().slice(0,10));
  vorher = cur;
}
ok('20 Jahre ohne doppelte Woche (2 Wochen Rhythmus)', brueche.length === 0,
   brueche.slice(0,3).join(', '));

/* Dasselbe für 3 und 4 Wochen: der Takt muss stur durchlaufen */
[3,4].forEach(n => {
  const s = defaultSched(); s.weekCount = n; s.offset = 0; s.basis = 'lauf';
  let fehler = 0, vor = null;
  for(let t = Date.UTC(2024,0,1); t <= Date.UTC(2044,0,1); t += 7*864e5){
    const cur = rhythmusWoche(s, new Date(t));
    if(vor !== null && cur !== (vor + 1) % n) fehler++;
    vor = cur;
  }
  ok(n + ' Wochen: Takt laeuft 20 Jahre durch', fehler === 0, fehler + ' Bruecke');
});

/* ── 3 · wochenNr zaehlt sauber ── */
ok('wochenNr(Montag 1.1.2024) === 0', wochenNr(new Date('2024-01-01T12:00:00')) === 0,
   wochenNr(new Date('2024-01-01T12:00:00')));
ok('Sonntag 7.1.2024 gehoert noch zu Woche 0',
   wochenNr(new Date('2024-01-07T12:00:00')) === 0);
ok('Montag 8.1.2024 ist Woche 1',
   wochenNr(new Date('2024-01-08T12:00:00')) === 1);
ok('Alle sieben Tage einer Woche haben dieselbe Nummer', (function(){
  const basis = wochenNr(new Date('2027-01-04T12:00:00'));
  for(let i = 0; i < 7; i++){
    const d = new Date(Date.UTC(2027,0,4+i,12));
    if(wochenNr(d) !== basis) return false;
  }
  return true;
})());

/* ── 4 · Migration: heute muss dieselbe Woche laufen wie vorher ── */
function altWi(sched, d){
  const wc = Math.max(1, Math.min(4, sched.weekCount||1));
  return (((isoWeek(d) - 1 + (sched.offset||0)) % wc) + wc) % wc;
}
let migFehler = 0, geprueft = 0;
for(let wc = 1; wc <= 4; wc++){
  for(let off = 0; off < wc; off++){
    const alt = { weekCount:wc, offset:off, weeks:[defaultWeek(),defaultWeek(),defaultWeek(),defaultWeek()] };
    const vorherWi = altWi(alt, new Date());
    const p = normalize({ id:'pMig'+wc+off, vorname:'M', dob:'1990-01-01', sched: JSON.parse(JSON.stringify(alt)) });
    const nachherWi = rhythmusWoche(p.sched, new Date());
    geprueft++;
    if(vorherWi !== nachherWi) migFehler++;
  }
}
ok('Migration haelt die laufende Woche fest', migFehler === 0,
   migFehler + ' von ' + geprueft + ' falsch');

/* ── 5 · Migration laeuft nur einmal ── */
const einmal = normalize({ id:'pEin', vorname:'E', dob:'1990-01-01',
  sched:{ weekCount:2, offset:1, weeks:[defaultWeek(),defaultWeek(),defaultWeek(),defaultWeek()] } });
ok('basis steht nach der Migration auf lauf', einmal.sched.basis === 'lauf', einmal.sched.basis);
const nachEins = einmal.sched.offset;
normalize(einmal); normalize(einmal); normalize(einmal);
ok('Mehrfaches normalize aendert den Versatz nicht mehr',
   einmal.sched.offset === nachEins, nachEins + ' → ' + einmal.sched.offset);

/* ── 6 · Neue Plaene starten schon richtig ── */
ok('defaultSched bringt basis = lauf', defaultSched().basis === 'lauf');
const frisch = normalize({ id:'pFrisch', vorname:'F', dob:'1990-01-01' });
ok('Neues Profil behaelt offset 0', frisch.sched.offset === 0, frisch.sched.offset);

/* ── 7 · Sonntag bleibt frei ── */
const so = dayPlan(S, new Date('2027-01-03T12:00:00'));
ok('Sonntag bleibt frei', so.vm === 0 && so.nm === 0 && so.cfg === null);

/* ── 8 · Ein-Wochen-Rhythmus kennt nur Woche 1 ── */
const eins = defaultSched(); eins.weekCount = 1; eins.basis = 'lauf';
let immerNull = true;
for(let t = Date.UTC(2026,0,1); t <= Date.UTC(2030,0,1); t += 864e5){
  if(rhythmusWoche(eins, new Date(t)) !== 0) immerNull = false;
}
ok('Bei 1 Woche ist immer Woche 1 dran', immerNull);
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
