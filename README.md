# MOJI

**Mehr Zeit fürs Wesentliche.** · Eine App von Studio MARU 丸

Arbeitszeitaufzeichnung für **Miller Optik GmbH**. Eine einzige HTML-Datei auf GitHub Pages,
Supabase in Frankfurt als Datenspeicher, gebaut fürs Handy.

**Live:** https://moji-app.at

---

## Inhalt

**Die App**

1. [Überblick](#1--überblick)
2. [Anmelden](#2--anmelden)
3. [Rechnen](#3--rechnen)
4. [PDF-Export](#4--pdf-export)
5. [Mitgliedschaft und Stufen](#5--mitgliedschaft-und-stufen)
6. [Bedienung in Kurzform](#6--bedienung-in-kurzform)

**Technik und Betrieb**

7. [Wo die Daten liegen](#7--wo-die-daten-liegen)
8. [Veröffentlichen und Versionen](#8--veröffentlichen-und-versionen)
9. [Domain und DNS](#9--domain-und-dns)
10. [Datenschutz](#10--datenschutz)

**Einrichtung** *(einmalig, größtenteils erledigt)*

11. [Supabase-Projekt und Datenbank](#11--supabase-projekt-und-datenbank)
12. [Mailversand über Resend](#12--mailversand-über-resend-erledigt)
13. [Mailvorlagen und Code](#13--mailvorlagen-und-code-erledigt)
14. [Passkeys](#14--passkeys-erledigt)
15. [Monats-Erinnerung automatisch verschicken](#15--monats-erinnerung-automatisch-verschicken) *(läuft)*
16. [Mitarbeiter aufnehmen und Konten verwalten](#16--mitarbeiter-aufnehmen-und-konten-verwalten)

**Anhang**

17. [Dateien im Projekt](#17--dateien-im-projekt)
18. [Offene Punkte](#18--offene-punkte)
19. [Übergabe an einen anderen Rechner oder Account](#19--übergabe-an-einen-anderen-rechner-oder-account)

---

# Die App

## 1 · Überblick

MOJI ist eine reine Frontend-App: `index.html` enthält Aufbau, Gestaltung und Logik in einer
Datei, ohne Bauschritt. Wer die Datei hochlädt, hat veröffentlicht.

Die App läuft auch ohne Internet weiter — die Daten liegen zusätzlich im Browser. Ohne
Zugangsdaten im Block `CLOUD` arbeitet MOJI rein lokal, ganz ohne Konto.

Bewusst nur für Hochformat am Handy gebaut. Am Rechner erscheint ein Hinweis; `?desktop=1`
umgeht ihn für Tests.

---

## 2 · Anmelden

Adresse eintippen, Mail kommt, fertig — kein Passwort. In der Mail stehen ein Link **und** ein
sechsstelliger Code. Der Code ist wichtig: wer MOJI vom iPhone-Startbildschirm öffnet, kann den
Link nicht nutzen, weil er in Safari landet und eine Startbildschirm-App auf iOS einen eigenen
Speicher hat.

Beim ersten Mal läuft danach der Funnel: Vorname, Nachname, Geburtsdatum, Arbeitsort,
Dienstzeiten und die Einwilligung zur Monats-Erinnerung. Alles Weitere hängt am Konto.

**Passkey.** Im Profilmenü steht dafür **eine** Zeile: das Schlüsselsymbol in Normalgröße,
darunter der Zustand in Farbe.

| Farbe | Text | Ein Tipp fragt |
|---|---|---|
| grün | Anmelden ohne Code aktiv | *Passkey deaktivieren?* → Deaktivieren / Behalten |
| orange | Anmelden ohne Code – noch nicht aktiviert | *Passkey aktivieren?* → Aktivieren / Später |
| rot | Anmelden ohne Code – Problem | *Passkey neu einrichten?* → Neu versuchen / Abbrechen |

Gefragt wird in einem kleinen Balken am unteren Rand; ein Tipp daneben oder Escape schließt
ihn. Rot heißt: veraltet (Umzug), nicht abrufbar oder der letzte Versuch ist schiefgegangen —
der Grund steht im Balken. Ein Aussetzer beim Abruf lässt einen bekannten Passkey grün.
Ein Passkey gilt immer nur für **ein Gerät** und **eine Adresse**.

---

## 3 · Rechnen

- Zeiten in **15-Minuten-Schritten**, Stunden auf **0,25 h** gerundet
- **Pause** = Lücke zwischen Ende Vormittag und Beginn Nachmittag, automatisch erkannt
- **Dienstzeiten** Montag bis Samstag, Vormittag und Nachmittag einzeln abschaltbar
- **1 bis 4 Wochenintervalle.** Jede Woche hat eine eigene Farbe und einen eigenen Abschnitt,
  damit niemand versehentlich viermal Woche 1 ausfüllt. Wochenintervall und die Frage
  *welche Woche läuft gerade* sind je mit einem Schloss gesichert — zugesperrt sind die
  Knöpfe grau, offen leuchtet das Schloss gelb
- **Feiertage Österreich** werden inklusive Ostertermin selbst berechnet und überschreiben
  einen Urlaubseintrag am selben Tag
- **Getrennte Summen**: Arbeitszeit, Urlaub, Krankenstand, Feiertag, Sonstige, Gesamt
- Bei *Eigener Text* lässt sich festlegen, ob die Stunden als Arbeitszeit zählen (Schulung)
  oder nicht

### Farben, Schrift und Erscheinungsbild

MOJI trägt seit 13. September 2026 **Violett** statt Nachtblau und Gold. Die Marke ist
`#C643FE` — gemessen aus dem App-Symbol, nicht geschätzt.

**Hell ist die Vorgabe.** Für jeden, immer — nicht die Systemeinstellung. Wer im Profilmenü
unter *Erscheinungsbild* umschaltet, bekommt seine Wahl als `erscheinung` ins Profil
geschrieben und damit auf alle Geräte. Zusätzlich liegt sie unter `moji.erscheinung` im
Gerätespeicher, damit die Fassung schon beim ersten Anstrich steht — das Profil kommt erst
aus der Cloud, der Gerätespeicher ist sofort da.

**Jede Kategoriefarbe hat drei Werte**, weil sie drei Aufgaben erfüllt:

| Rolle | Token | Beispiel Urlaub hell |
|---|---|---|
| Fläche — luftig | `--c-urlaub-rgb-f` | `#F6D9AE` |
| Tinte — leuchtend | `--c-urlaub-rgb` | `#E1A01D` |
| Text — tief | `--c-urlaub-tx` | `#B07400` |

Ein dunkles Bernstein bei 13 % Deckkraft auf Weiß ergibt Schlamm, ein leuchtendes bei 34 px
Schrift nur 2,0:1 Kontrast. Deshalb drei Werte statt einem.

| Kategorie | Farbton | Dunkel | Hell |
|---|---|---|---|
| Arbeitszeit | 285° | `#A3A4AD` | `#7F7F8C` |
| Urlaub | 78° | `#F7C980` | `#E1A01D` |
| Krankenstand | 22° | `#F4A19E` | `#E54B52` |
| Feiertag | 215° | `#7ADFF7` | `#00A7CB` |
| Eigener Text | 148° | `#81C08A` | `#4EB864` |
| Zeitausgleich | 268° | `#9AB5FB` | `#4163E4` |
| **Heute** | 313° | `#C861FA` | `#9912CB` |

Gerechnet in **OKLCH**, nicht HSL: Dort heißt gleiche Helligkeit auch fürs Auge gleiche
Helligkeit. Geprüft ist dreierlei — Kontrast gegen den Untergrund, Abstand der Kategorien
untereinander (kleinster Wert 11) und Abstand zur Marke (alle ≥ 21).

Der **aktuelle Tag** trägt die Marke als atmenden Ring, 3 px bis 5 px über 6,5 Sekunden.
Er ist keine Kategorie, sondern ein Ort — *du bist hier*.

**Schriften:** `Bricolage Grotesque` für Überschriften, `Plus Jakarta Sans` für die Bedienung,
`Caveat` für die Unterschriftsleisten. Alle drei liegen als **`.woff2` im Repo**, nicht beim
Google-CDN — MOJI soll offline laufen, und es geht keine IP der Mitarbeiter an Google. Alle
sind OFL-lizenziert, Selbsthosten ist erlaubt.

Je Familie gibt es `latin` und `latin-ext`, gesteuert über `unicode-range`: Der Browser lädt
nur, was der Text wirklich braucht. Beim Aufruf der Anmeldeseite sind das drei Dateien,
nicht acht. Zusammen 313 KB, einmalig.

| Datei | Wofür |
|---|---|
| `moji-bricolage.woff2`, `-ext` | Überschriften, 300–800 variabel |
| `moji-jakarta.woff2`, `-ext`, `-italic`, `-italic-ext` | Bedienung |
| `moji-caveat.woff2`, `-ext` | Unterschriftsleisten |

Drei weitere Paare stehen als Regeln bereit — Schibsted Grotesk, Gabarito, Funnel — erreichbar
über `data-font="b"` bis `"d"` am `<html>`. **Ihre Dateien liegen nicht im Repo:** Wer
umschaltet, bekommt die Systemschrift, bis die betreffende `.woff2` dazukommt.

**Das Profilmenü ist Vollbild** und nach Themen gegliedert — Konto, Arbeitszeit, Einstellungen,
Sitzung. Das Menü blieb dabei dasselbe DOM: Alle Klick-Handler hängen delegiert an `#menu`, und
die Untermenüs liegen als Flächen darin. Kopiert man die Knöpfe woandershin, ist nichts mehr
verdrahtet.

**Beim Umfärben zu beachten:** Farben, die doppelt gedeutet wurden, fallen auseinander. Das alte
Gold war Marke *und* Urlaubsfarbe, ein Fast-Weiß war Schriftfarbe *und* Fläche, ein Blau war
Arbeitszeit *und* Zeitausgleich. Alle drei sind jetzt getrennt benannt. Und: `!important` schlägt
jede Animation — eine so übersteuerte Eigenschaft friert ein.

### Dienstzeiten mit Datum

Wer seine Arbeitszeiten ändert, bekommt alte Monate **nicht** mit dem neuen Plan gerechnet.
Ein im März abgegebenes Blatt zeigt im Dezember noch dieselben Stunden.

Gespeichert wird sparsam: `sched` bleibt der Plan, der **jetzt** gilt. Daneben liegen in
`schedAlt` die abgelösten Fassungen, jede mit dem Tag, an dem sie endete — aufsteigend und
lückenlos:

```
schedAlt: [ { bis:'2026-09-30', sched:{…} },      ← gilt bis einschließlich 30.09.2026
            { bis:'2026-12-31', sched:{…} } ]     ← gilt 01.10. bis 31.12.2026
sched:    {…}                                     ← gilt ab 01.01.2027
```

`schedFuer(profil, datum)` liefert den Plan dieses Tages; `evalDay()` fragt dort, und damit
auch Kalender, Summen und PDF-Export. Profile ohne `schedAlt` verhalten sich exakt wie vorher.

**Beim Speichern fragt MOJI**, weil sich die Absicht nicht erraten lässt:

| Antwort | Wirkung |
|---|---|
| *Nur korrigieren* | überschreibt den aktuellen Plan rückwirkend — für Tippfehler |
| *Ab einem Datum* | legt eine neue Fassung an, Vorschlag ist der nächste Monatserste |

Wer nur den Reiter umgestellt hat, sieht keine Frage: `schedGleich()` vergleicht nur Zeiten und
Rhythmus, keine Bedienspuren. Ein Wechseldatum **vor** einer bestehenden Grenze wird abgelehnt —
sonst wäre nicht mehr klar, welcher Plan dazwischen galt.

Unter *Dienstzeiten* steht der **Verlauf**: jede Fassung mit Zeitraum und Wochenstunden, die
aktuelle hervorgehoben. Eine Fassung lässt sich entfernen; ihre Zeit fällt dann an die
nächstjüngere, damit keine Lücke entsteht. Ohne diese Liste stünde ein versehentlich falsch
gesetztes Datum für immer fest.

Nicht betroffen ist `tagStunden()` — die Umrechnung von Urlaubsstunden in Tage nimmt bewusst
den **heutigen** Plan, denn der Anspruch gilt jetzt.

### Wochenrhythmus

Bei mehr als einer Woche muss MOJI für jeden Tag wissen, welche Woche des Rhythmus gilt.
Gerechnet wird das in **`wochenNr()`**: Wochen werden fortlaufend durchgezählt seit Montag,
1. Jänner 2024, in UTC und auf den Montag abgerundet, damit Sommerzeit nichts verschiebt.
Die eine Stelle, die daraus die Rhythmuswoche macht, ist `rhythmusWoche(sched, datum)` —
Kalender, Profilmenü und PDF-Export fragen alle dort.

**Nicht die Kalenderwoche.** Genau daran ist es bis September 2026 gescheitert: Jahre wie
2026 haben **53** Kalenderwochen, und auf KW 53 folgt KW 1. Bei zwei Wochen Rhythmus ergibt
`(53−1) % 2` dasselbe wie `(1−1) % 2` — dieselbe Woche zweimal hintereinander, und ab da läuft
alles um eine Woche verschoben. Aufgefallen an Samstag, 9. Jänner 2027, der frei anzeigte,
obwohl er Arbeitstag wäre. Der Versatz hätte bis 2033 gehalten, im Kalender wie im Export.
`isoWeek()` gibt es weiterhin, aber nur noch zum **Anzeigen** („gerade läuft KW 37").

**Der Versatz** steht als `sched.offset` im Profil und zählt gegen `wochenNr()`.
`sched.basis = 'lauf'` merkt sich, dass die Umrechnung schon gelaufen ist; Profile von vorher
werden in `normalize()` **einmalig** umgerechnet, so dass am Tag der Umstellung dieselbe Woche
läuft wie vorher. Bereits exportierte Monate werden nicht rückwirkend verändert — ein
abgegebenes Blatt nachträglich umzurechnen hilft niemandem.

### Zeitausgleich & Urlaubstage im Profilmenü

Der Menüpunkt unter *Dienstzeiten bearbeiten* färbt das Menü — dieselbe Fläche wie bei den
Profilbildern — und zeigt zwei Stände, die beim Öffnen hochzählen:

- **Zeitausgleich**: alle `zeit`-Einträge zusammen (jahresübergreifend) plus `konten.zaStart`.
  Grün bei plus, rot bei minus, verstellbar in 0,25-h-Schritten.
- **Urlaubstage**: der **Topf** minus alle genommenen Tage seit `konten.startJahr`
  (halbe Tage zählen 0,5). Die Kachel zeigt nur an — gepflegt wird der Anspruch im
  eigenen Menüpunkt.

### Urlaubsanspruch

Eigener Punkt im Profilmenü, gleiche blaue Fläche mit Riegel und gelbem Speichern-Knopf.
Der Jahresanspruch lässt sich in **Tagen oder Stunden** eintragen; Stunden werden über die
durchschnittlichen Stunden eines Diensttages aus dem Dienstplan in Tage umgerechnet
(`tagStunden()`).

Jeden **1. Jänner** wird der Anspruch dem Topf gutgeschrieben (`urlaubGutschreiben()`,
läuft beim Start und bei jedem `save()`, trägt verpasste Jahre nach und schreibt nie doppelt
gut). Reste verfallen also nicht, der Topf wächst weiter. Gespeichert:
`konten = { anspruch, anspruchEinheit, topf, gutJahr, startJahr, zaStart }`.

Gespeichert werden nur die beiden **Grundwerte** in `konten`. Der gerechnete Stand steht in
`stand = { za, zaRoh, urlaub, genommen, anspruch, jahr, ts }` und wird bei **jedem** `save()`
nachgezogen — er liegt damit auch in der Cloud-Zeile und ändert sich automatisch, sobald im
Kalender Urlaub oder Zeitausgleich eingetragen wird. Rechenzeit rund 2 ms.

### Zeitausgleich

Am Kalendertag antippen → **Zeitausgleich**. Sobald eine Art gewählt ist, treten die anderen
drei weg (Höhe animiert); ein Tipp auf die gewählte Art holt sie zurück — der kleine Pfeil im
Knopf zeigt das an. Dasselbe gilt für Urlaub, Krankenstand und Eigener Text.

- **Einlösen** (rot, Minus) oder **Sammeln** (grün, Plus) — zwei Knöpfe, Sammeln ist vorgewählt
- Die Menge nur über **−** und **+** in **0,25-h-Schritten**, Start bei **1,00 h**,
  Kleinstwert 0,25 h. Die Zahl selbst ist kein Eingabefeld, es gibt also keine Tastatur.
- **Halber Tag / Ganzer Tag** übernehmen die Stunden aus dem Dienstplan dieses Tages;
  ein zweiter Tipp auf den gewählten Knopf stellt wieder 1,00 h ein. An dienstfreien Tagen
  sind beide Knöpfe aus, und Einlösen wird abgelehnt.
- **Sammeln** legt die Stunden auf die Arbeitszeit dieses Tages, **Einlösen** nimmt sie weg,
  höchstens bis auf null
- Gespeichert wird `{ t:'zeit', za: <Zahl mit Vorzeichen> }`. Ein durchlaufendes Gesamtkonto
  führt MOJI nicht — jeder Monat steht für sich.

---

## 4 · PDF-Export

Ein Monat = eine A4-Seite: Name, Geburtsdatum, Dienstgeber, Zeitraum, alle Tage mit Vormittag,
Nachmittag, Pause, Arbeitsstunden und Vermerk, die getrennten Summen, dazu zwei
Unterschriftsleisten in Schreibschrift.

- **PDF erstellen** → alle gewählten Monate in einer Datei, ein Monat pro Seite
- **Lieber pro Monat eine eigene Datei** → eine PDF je Monat. Chrome fragt beim ersten Mal,
  ob mehrere Downloads erlaubt sind

**Künftige Monate sind gesperrt.** Wählbar ist alles bis einschließlich des laufenden Monats;
spätere Monate stehen blass und gestrichelt da. Am Monatsersten wird der abgeschlossene Monat
frei — und wer zugestimmt hat, bekommt dazu eine Mail
(→ [Abschnitt 15](#15--monats-erinnerung-automatisch-verschicken)).

Der Export lädt die PDF-Bibliothek von einem CDN, braucht also kurz Internet.

---

## 5 · Mitgliedschaft und Stufen

Jeder abgegebene Monat zählt. Vier Monate ergeben eine Stufe, zwölf Stufen von
*Frisch dabei* bis *MOJI-Legende*, jede mit eigenen Farben und Effekten. Im Profilmenü zeigt
eine Leiste den Stand; ein Tipp öffnet die Rangliste.

Die **Mitgliedschaftskarte** im Menü nennt Name, Stufe, Dienstgeber, Mitglied seit, Anzahl der
Exporte und die gesparte Zeit — letztere in Vergleichen, die mit der Menge wachsen
(„vier Kugeln Eis“ … „zwei Wochen Urlaub“). Die Karte lässt sich in 3D drehen; auf der
Rückseite steht die MOJI-Marke als Prägung. *Karte teilen* erzeugt ein Bild fürs Weitergeben.

Ein Stufenaufstieg meldet sich mit einem roten Punkt am Profilbild.

---

## 6 · Bedienung in Kurzform

| Aufgabe | Weg |
|---|---|
| Einzelnen Tag markieren | Im Kalender auf den Tag tippen |
| Längeren Urlaub eintragen | Oben *Zeitraum eintragen* → ersten und letzten Tag antippen → Art → *Eintragen* |
| Halben Tag | Im Tagesdialog oder im Zeitraum *Nur Vormittag* / *Nur Nachmittag* |
| Eintrag entfernen | Tag antippen → *Zurücksetzen*, oder Zeitraum → *Einträge entfernen* |
| Dienstzeiten ändern | Avatar oben rechts → *Dienstzeiten bearbeiten* |
| Erinnerungsmail ein/aus | Avatar → *Monats-Erinnerung* |
| Profilbild wechseln | Avatar → auf das große Bild tippen |
| Abmelden | Avatar → *Abmelden* |

Sonntage bleiben frei. Beim Zeitraum-Eintrag werden Sonntage, Feiertage und dienstfreie Tage
automatisch übersprungen.

---

# Technik und Betrieb

## 7 · Wo die Daten liegen

In einer Postgres-Datenbank bei **Supabase in Frankfurt**, eine Zeile pro Person in der Tabelle
`records`: `user_id`, `data` (das ganze Profil als JSON), `updated_at`. Row-Level-Security setzt
**in der Datenbank** durch, dass jede Person ausschließlich ihre eigene Zeile sieht — auch wer
den Quelltext liest und den öffentlichen Schlüssel kennt, kommt nicht an fremde Daten.

Im Browser liegt zusätzlich ein Zwischenspeicher, damit die App offline weiterläuft. Oben rechts
zeigt eine Anzeige den Stand: **Gesichert**, **Sichere …**, **Offline · wird nachgeholt** oder
**Nicht gesichert**. Änderungen werden nach kurzer Ruhe gesammelt hochgeschrieben und beim
Zurückkommen auf die Seite nachgeholt.

Warum überhaupt eine Datenbank: Safari löscht den Browserspeicher einer Website nach sieben
Tagen ohne Besuch. Bei monatlichem Eintragen wären die Aufzeichnungen regelmäßig verschwunden.

---

## 8 · Veröffentlichen und Versionen

Repository `marcoreimair1/simply`, Branch `main`, GitHub Pages aus dem Wurzelverzeichnis.
Hochladen über **Add file → Upload files** genügt; nach etwa 40 Sekunden ist die neue Fassung
draußen.

Ganz oben in `index.html` steht `const APP_STAND = 'JJJJ-MM-TT-hhmm'`. Die App holt sich die
eigene Datei im Hintergrund ohne Zwischenspeicher, vergleicht den Wert und zeigt bei Abweichung
die Kachel **Es gibt eine neue Version**. **Bei jeder Änderung diesen Wert hochsetzen** — sonst
merkt niemand, dass es etwas Neues gibt.

GitHub Pages liefert die Seite mit zehn Minuten Haltbarkeit aus. Kurz nach einer Änderung kann
der Browser noch die alte Fassung zeigen — dann hart neu laden oder `?x=1` anhängen.

---

## 9 · Domain und DNS

`moji-app.at` liegt bei GoDaddy, zeigt aber auf GitHub Pages:

| Typ | Name | Wert |
|---|---|---|
| A | @ | `185.199.108.153` |
| A | @ | `185.199.109.153` |
| A | @ | `185.199.110.153` |
| A | @ | `185.199.111.153` |
| CNAME | www | `marcoreimair1.github.io` |

Im Repository steht die Datei `CNAME` mit dem Inhalt `moji-app.at`; in den Pages-Einstellungen
ist **Enforce HTTPS** aktiv. Bei Supabase müssen **Site URL** (`https://moji-app.at`),
**Redirect URLs** sowie **WEBAUTHN_RP_ID** und **RP_ORIGINS** dazu passen.

---

## 10 · Datenschutz

Arbeitszeiten und besonders Krankenstände sind personenbezogene, teils Gesundheitsdaten. Sie
liegen in der EU, jede Person kommt ausschließlich an ihre eigenen. Erinnerungsmails gehen nur
an Leute, die im Funnel oder im Profilmenü ausdrücklich zugestimmt haben, und lassen sich
jederzeit abschalten — die Einwilligung steht als `mailOk` im Profil, Voreinstellung **aus**.

*Profil löschen* im Menü ruft die Funktion `konto_loeschen()` auf und entfernt Datenzeile und
Anmeldekonto in einem Schritt.

Das ist keine Rechtsberatung: für Miller Optik als Dienstgeber gehört das voraussichtlich ins
Verzeichnis der Verarbeitungstätigkeiten, und ein Auftragsverarbeitungsvertrag mit Supabase wäre
zu prüfen. Kurz mit der Datenschutzberatung abklopfen.

---

# Einrichtung

Alles gratis. Konten anlegen und Passwörter eintragen bleibt bei dir — Zugangsdaten gebe ich
grundsätzlich nirgends ein.

> **Stand:** Abschnitte 11 bis 15 sind erledigt und geprüft — Datenbank, Zugriffsregeln,
> Resend als Absender `no-reply@moji-app.at`, Mailvorlagen, Passkeys und die automatische
> Monats-Erinnerung. Der Zeitplan `moji-monatsmail` ist aktiv, der Testlauf lief mit Status 200.

## 11 · Supabase-Projekt und Datenbank

### 11.1 Projekt *(erledigt)*

Projekt `simply`, Region **Central EU (Frankfurt)**, Plan **Free**. Das Datenbank-Passwort liegt
im Passwortmanager — es ist nicht wiederherstellbar.

### 11.2 Tabelle und Zugriffsschutz *(erledigt)*

**SQL Editor** → **New query** → ausführen:

```sql
-- Eine Zeile pro Person, alles darin.
create table public.records (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Zugriffsschutz einschalten. Ohne das könnte jeder alles lesen.
alter table public.records enable row level security;

-- Jede Person sieht und ändert ausschließlich die eigene Zeile.
create policy "eigene Zeile lesen"    on public.records
  for select using (auth.uid() = user_id);
create policy "eigene Zeile anlegen"  on public.records
  for insert with check (auth.uid() = user_id);
create policy "eigene Zeile ändern"   on public.records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "eigene Zeile loeschen" on public.records
  for delete using (auth.uid() = user_id);

-- Profil löschen: Datenzeile und Anmeldekonto in einem Schritt.
-- security definer, weil auth.users sonst für niemanden erreichbar ist.
create or replace function public.konto_loeschen()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare wer uuid := auth.uid();
begin
  if wer is null then
    raise exception 'nicht angemeldet';
  end if;
  delete from public.records where user_id = wer;
  delete from auth.users where id = wer;
end;
$$;

revoke all on function public.konto_loeschen() from public, anon;
grant execute on function public.konto_loeschen() to authenticated;
```

Diese Regeln sind der eigentliche Datenschutz. Sie greifen in der Datenbank, nicht in der App.

### 11.3 Die zwei Werte in `index.html` *(erledigt)*

**Project Settings** → **API**: **Project URL** und der **anon public**-Schlüssel stehen oben in
`index.html` im Block `CLOUD`. Beide sind zur Veröffentlichung gedacht.

> ⚠️ Der **service_role**-Schlüssel darf **nie** in `index.html` oder in ein anderes Frontend.
> Er umgeht den Zugriffsschutz vollständig und gehört ausschließlich in die Secrets der
> Edge Functions. Ein Schlüssel, der einmal irgendwo im Chat oder in einer Datei gelandet ist,
> gilt als verbrannt und wird in Supabase neu erzeugt.

---

## 12 · Mailversand über Resend *(erledigt)*

Supabase verschickt selbst nur zwei Mails pro Stunde und nur an Adressen aus dem eigenen
Projektteam. Für echte Mitarbeiter braucht es einen eigenen Versand — MOJI nutzt **Resend**,
sowohl für die Anmeldecodes als auch für die Monats-Erinnerung.

**Absender: `MOJI <no-reply@moji-app.at>`.** Dahinter liegt kein Postfach — Senden und
Empfangen sind getrennt, für den Versand genügen die DNS-Einträge. Antworten laufen über
Reply-To auf eine echte Adresse.

### 12.1 Domain bei Resend

`moji-app.at` ist als Sending-Domain verifiziert, Region **Ireland (eu-west-1)**. Drei
DNS-Einträge bei GoDaddy, die Website bleibt davon unberührt:

| Typ | Name | Wert | Priorität |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqG…QwIDAQAB` (DKIM, 216 Zeichen) | — |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |

Dazu kommt der von GoDaddy vorgegebene `_dmarc`-Eintrag (`p=quarantine`, relaxed) — der passt
zu DKIM auf derselben Domain.

> **Der Gratis-Plan erlaubt nur eine Domain.** Deshalb wurde `studiomaru.at` bei Resend
> entfernt, als `moji-app.at` dazukam. Von `studiomaru.at` kann über Resend nichts mehr
> gesendet werden. Grenzen im Gratis-Plan: 3.000 Mails pro Monat, 100 pro Tag.

### 12.2 API-Schlüssel

**Schlüssel sind in Resend auf eine Domain beschränkt.** Ein Schlüssel für `studiomaru.at`
funktioniert nach dem Umzug nicht mehr — deshalb gibt es den Schlüssel **„MOJI moji-app.at"**
(Sending access, Domain `moji-app.at`). Er steckt an zwei Stellen:

- Supabase → Authentication → Emails → SMTP Settings → **Password**
- Supabase → Project Settings → Edge Functions → Secrets → **`RESEND_API_KEY`**

Resend zeigt einen Schlüssel nur einmal an. Wer ihn verliert, legt einen neuen an und tauscht
ihn an beiden Stellen.

### 12.3 SMTP in Supabase

**Authentication** → **Emails** → **SMTP Settings** → *Enable custom SMTP*:

| Feld | Wert |
|---|---|
| Sender email address | `no-reply@moji-app.at` |
| Sender name | `MOJI` |
| Host | `smtp.resend.com` |
| Port number | `587` |
| Minimum interval per user | `60` Sekunden |
| Username | `resend` |
| Password | der API-Schlüssel aus 12.2 |

Projekt-Ref: `kzduwbmiytusvlbotrrr`.

---

## 13 · Mailvorlagen und Code *(erledigt)*

Vorlagen lassen sich **erst nach dem Speichern des SMTP-Zugangs** bearbeiten.

**Authentication** → **Emails** → **Templates** → **Magic link or OTP**:

- Betreff: `{{ .Token }} ist dein MOJI-Code`

Der `{{ .Token }}` ist entscheidend: wer MOJI vom iPhone-Startbildschirm öffnet, kann den Link
nicht nutzen — der landet in Safari, und eine Startbildschirm-App hat auf iOS einen eigenen
Speicher. Mit dem Code funktioniert die Anmeldung auch dort.

Die gestalteten Fassungen liegen als `mail-anmeldung.html` und `mail-registrierung.html` im
Projekt.

---

## 14 · Passkeys *(erledigt)*

Passkeys laufen bei Supabase noch als Beta und liegen in `auth.webauthn_credentials`. Nötig:

| Einstellung | Wert |
|---|---|
| `WEBAUTHN_RP_ID` | `moji-app.at` |
| `WEBAUTHN_RP_ORIGINS` | `https://moji-app.at` |
| Anzeigename | `MOJI` |

Die RP ID muss ein registrierbares Suffix der Adresse sein, sonst lehnt der Browser stumm ab.
Beim Domainumzug wurden alle bestehenden Passkeys ungültig; die App merkt sich pro Konto im
Gerätespeicher, für welche Adresse ihr Passkey gilt, räumt bei `InvalidStateError` selbständig
auf und legt neu an.

Im Code hängt alles an `pkStand()` — `aktiv`, `aus`, `problem`, `laden`. Die Menüzeile nimmt
davon Farbe und Text (`pk-ok` / `pk-warn` / `pk-bad`), der Balken `#pkbar` seine Beschriftung
und die Aktion: `pkReset()`, `pkAdd()` oder `pkErneuern()`. Eine eigene Zeile
*Passkey zurücksetzen* gibt es nicht mehr — das erledigt der Balken.

---

## 15 · Monats-Erinnerung automatisch verschicken

**Ziel:** am Ersten jedes Monats bekommt jeder, der zugestimmt hat, eine kurze Mail —
*„wir erinnern dich, dass Juli jetzt zum Schreiben wäre“*. Wer den Monat schon abgegeben hat,
bekommt nichts. Nur per Mail, weil eine Nachricht im App-Postfach niemanden zurückholt.

Fertig im Projekt liegen:

- `monatsmail.ts` — die Edge Function samt Mailvorlage im MOJI-Design
- `monatsmail.sql` — Tabelle `mail_log` gegen Doppelmails und der Zeitplan

### 15.1 Absender *(erledigt)*

Domain, DNS-Einträge und Schlüssel stehen schon — siehe [Abschnitt 12](#12--mailversand-über-resend-erledigt).
Es fehlen nur noch die Secrets, die Function und der Zeitplan.

### 15.2 Schlüssel in Supabase hinterlegen *(erledigt)*

**Project Settings** → **Edge Functions** → **Secrets**:

| Name | Wert |
|---|---|
| `RESEND_API_KEY` | der Schlüssel „MOJI moji-app.at" aus 12.2 |
| `MAIL_VON` | `MOJI <no-reply@moji-app.at>` |
| `MAIL_ANTWORT` | eine Adresse, die du liest — Standard `maru.arbeitszeiten@gmail.com` |

`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` sind automatisch vorhanden. `MAIL_VON` und
`MAIL_ANTWORT` sind nur nötig, wenn du von den Standardwerten abweichen willst.

### 15.3 Funktion veröffentlichen *(erledigt)*

Läuft als `monatsmail` unter
`https://kzduwbmiytusvlbotrrr.supabase.co/functions/v1/monatsmail`, *Verify JWT with legacy
secret* eingeschaltet. Zusätzlich prüft die Funktion selbst, ob der Aufruf den
`service_role`-Schlüssel mitbringt — der öffentliche anon-Schlüssel genügt nicht.

Neu veröffentlichen im **Dashboard**: **Edge Functions** → `monatsmail` → **Code** → Inhalt von
`monatsmail.ts` einfügen → **Deploy updates**.

Oder auf dem Rechner mit der CLI:

```bash
mkdir -p supabase/functions/monatsmail
cp monatsmail.ts supabase/functions/monatsmail/index.ts
npx supabase login
npx supabase link --project-ref PROJEKT_REF
npx supabase functions deploy monatsmail
```

### 15.4 Tabelle und Zeitplan *(erledigt)*

Tabelle `mail_log`, `pg_cron`, `pg_net` und der Zeitplan `moji-monatsmail` sind angelegt und
aktiv. Der Plan steht auf `10 5 1 * *` — am Ersten um 05:10 UTC, im Sommer 07:10 Wiener Zeit.
Im Winter wird es 06:10; falls das stören sollte, zweimal im Jahr die Stunde anpassen.

Neu aufsetzen ginge über `monatsmail.sql`; darin ist nur `SERVICE_ROLE_KEY` zu ersetzen.

> **Der Schlüssel im Zeitplan ist der *legacy* `service_role`-JWT**
> (Settings → API Keys → *Legacy anon, service_role API keys*), nicht `sb_secret_…`.
> Er steht im Klartext in `cron.job.command` — dort kommt nur die `postgres`-Rolle hin.

**Diese zwei Einstellungen müssen bleiben, sonst steht die Automatik:**

- Function `monatsmail` → Settings → **Verify JWT with legacy secret** bleibt **an**.
  Sie prüft die Signatur; die Funktion prüft danach nur noch die Rolle.
- Settings → API Keys → **„Disable JWT-based API keys" nicht drücken.**

**Stolperstein, den wir hatten:** in der Umgebung der Edge Function liefert
`SUPABASE_SERVICE_ROLE_KEY` inzwischen den **neuen** `sb_secret`-Schlüssel (41 Zeichen), der
Zeitplan schickt aber den **Legacy-JWT** (219 Zeichen). Ein direkter Vergleich schlug deshalb
mit `401 nein` fehl. `darfRein()` in `monatsmail.ts` akzeptiert jetzt beide Formen.

### 15.5 Vorher einmal trocken prüfen

Im SQL Editor auslesen, wer eine Mail bekäme:

```sql
select r.user_id, u.email, r.data->>'vorname' as vorname
from public.records r join auth.users u on u.id = r.user_id
where r.data->>'mailOk' = 'true'
  and not (r.data->'exp' ? '2026-6');   -- 2026-6 = Juli 2026, Monat ab 0 gezählt
```

Danach die Funktion einmal von Hand anstoßen (**Edge Functions** → `monatsmail` → **Test**,
Header `Authorization: Bearer <service_role>`). Sie antwortet mit
`{ monat, lauf, gesendet, uebersprungen, fehler }`. Ein zweiter Aufruf im selben Monat schickt
nichts mehr — dafür ist `mail_log` da.

**Antworten der Funktion beim Prüfen:**

| Antwort | Bedeutung |
|---|---|
| `401 nein` | Aufruf ohne `service_role`-Rolle — Sperre greift, Code läuft |
| `500 SUPABASE_SERVICE_ROLE_KEY nicht verfuegbar` | Dienstschlüssel fehlt in der Umgebung |
| `500 RESEND_API_KEY fehlt` | Secret nicht gesetzt |
| `200` mit Bericht | alles in Ordnung |

### 15.6 Prüfstand vom 5. August 2026

Testlauf über denselben Befehl, den der Zeitplan ausführt:

```
{ "monat": "Juli", "lauf": "2026-07", "gesendet": 0, "uebersprungen": 6, "fehler": [] }
```

Status 200, keine Mail verschickt — richtig, denn **bei allen bestehenden Konten fehlt `mailOk`
im Profil**. Die Profile wurden gespeichert, bevor es die Einwilligung gab; die Funktion
überspringt alles, was nicht ausdrücklich `true` ist.

**Daraus folgt:** die fünf bestehenden Nutzer bekommen nichts, bis sie im Profilmenü
*Monats-Erinnerung* selbst einschalten. Das Häkchen im Funnel sehen nur neue Konten.

### 15.7 Die einmalige Frage für bestehende Konten *(erledigt, September 2026)*

Genau dafür gibt es jetzt die Ansicht `v-erinask`. Sie erscheint **einmal** nach dem Anmelden
und fragt geradeheraus, ob MOJI am Monatsersten erinnern soll — zwei gleichwertige Knöpfe,
*Ja, erinnere mich* und *Nein danke*. Kein kleiner Textlink für das Nein: bei einer
Einwilligung wäre das schief.

Möglich wird das durch ein zweites Feld im Profil, **`mailGefragt`**. Ohne es wäre
`mailOk = false` doppeldeutig — „nein gesagt" und „nie gefragt" sähen gleich aus. Gesetzt wird
es an vier Stellen: im Funnel, bei den beiden Knöpfen der neuen Ansicht und beim Umschalter im
Profilmenü. Wer den Punkt also selbst gefunden hat, wird nicht mehr gefragt.

Die Frage erscheint nur, wenn **alle vier** Bedingungen zutreffen — nachzulesen in
`erinFrageNoetig()`:

| Bedingung | Warum |
|---|---|
| `CLOUD_ON` und `UID` | ohne Konto gibt es niemanden zu erinnern |
| `MAIL` bekannt | ohne Adresse ginge die Mail nirgendwohin |
| `mailGefragt` nicht `true` | jeder wird genau einmal gefragt |
| `mailOk` nicht `true` | wer schon zugestimmt hat, wird nicht behelligt |

Die Antwort steht im Profil, nicht im Gerätespeicher — anders als beim Passkey, wo die
Ablehnung unter `maru.pkask.<UID>` lokal liegt. Grund: Safari räumt den Gerätespeicher nach
sieben Tagen ohne Besuch ab, die Frage käme sonst wieder. So gilt sie auf allen Geräten
derselben Person.

Eingehängt ist sie hinter `askPasskey()` an zwei der drei Stellen im Anmeldefluss. Der dritte
Aufruf führt in den Funnel — der fragt selbst. **Offline wird nicht gefragt**, weil die Antwort
nicht hochkäme und der Zeitplan nur die Cloud liest.

Dazu liegt im Postfach die Nachricht `erinnerung-2026-09` zum Nachschlagen.

### 15.8 Wie die Erinnerung abgeschaltet wird

Profilmenü → **Monats-Erinnerung**. Der Punkt zeigt *ein · per E-Mail an …* oder *aus* und
schreibt `mailOk` ins Profil; die Funktion überspringt beim nächsten Lauf alle mit `false`.
Voreinstellung für neue Konten ist **aus** — es gilt nur, was ausdrücklich angehakt wurde.

---

## 16 · Mitarbeiter aufnehmen und Konten verwalten

Es braucht keine Einladung. Jede Person tippt ihre Adresse in die App, bekommt Link und Code,
und beim ersten Mal läuft danach der Funnel. Wer sich angemeldet hat, erscheint unter
**Authentication** → **Users**.

**Wenn du zusperren willst:** sag Bescheid, dann kommt eine Liste erlaubter Adressen hinein —
dann nur `@miller.at` oder ausdrücklich freigegebene Personen. Ohne Schranke könnte theoretisch
jeder mit der Adresse der Seite ein Konto anlegen; er sähe nur seine eigenen leeren Daten,
aber sauberer ist eine Schranke.

**Konten löschen:** **Authentication** → **Users** → Zeile → *Delete user*. Alle Fremdschlüssel
auf `auth.users` stehen auf `cascade`, Profil und Passkeys gehen also mit. Vorher prüfen:

```sql
select u.email, r.user_id is not null as hat_profil
from auth.users u left join public.records r on r.user_id = u.id
order by u.created_at;
```

---

# Anhang

## 17 · Dateien im Projekt

Stand 13. September 2026, gegen `git ls-files` geprüft — 28 Dateien.

**Die App**

| Datei | Wofür |
|---|---|
| `index.html` | die ganze App: Aufbau, Gestaltung, Logik |
| `manifest.webmanifest` | Name und Symbol am Startbildschirm |
| `icon-180.png`, `icon-512.png` | ebendieses Symbol, zwei Größen |
| `av-1.png` … `av-12.png` | die zwölf Profilbilder |
| `firma-miller.png` | Logo Miller Optik, nur bei der Firmenauswahl |
| `schwein-troete.png` | Schwein mit Tröte. Erscheint im Block `#bleib`, wenn jemand das Löschen des Profils abbricht — „Schön, dass du dich nochmal umentschieden hast" |
| `wolken.mp4` | Hintergrund im Ladebild |
| `moji-bricolage*.woff2`, `moji-jakarta*.woff2`, `moji-caveat*.woff2` | die drei Schriften, selbst gehostet |

**Veröffentlichen**

| Datei | Wofür |
|---|---|
| `CNAME` | `moji-app.at` für GitHub Pages |
| `.nojekyll` | leer, schaltet die Jekyll-Verarbeitung bei Pages ab |
| `.gitignore` | hält `.DS_Store` und Arbeitsdateien aus dem Repo |

**Monats-Erinnerung**

| Datei | Wofür |
|---|---|
| `monatsmail.ts` | Code der Edge Function |
| `monatsmail.sql` | Tabelle `mail_log` und Zeitplan dazu |
| `monatsmail-deploy.sh` | veröffentlicht die Function vom Rechner aus |
| `supabase/config.toml` | bindet den Ordner an das Supabase-Projekt |
| `moji-mail-wortmarke.png` | Wortmarke im Mailkopf. Im Quelltext steht sie nirgends — die Mailvorlagen holen sie über `https://moji-app.at/moji-mail-wortmarke.png`. Nicht löschen |

**Dokumentation**

| Datei | Wofür |
|---|---|
| `README.md` | diese Datei, das Gedächtnis des Projekts |

Profilbilder haben ihre eigene Fassung: `AV_STAND` in `index.html` hochsetzen, sonst zeigen
Geräte die alten Bilder aus dem Zwischenspeicher.

> **Was hier früher stand und nicht stimmte:** `moji-favicon.svg`, `moji-wortmarke-*.svg` und
> `moji-icon-marke.svg` liegen nicht im Repo und werden auch nirgends aufgerufen — die Marke
> steckt als SVG direkt in `index.html`. Ebenso fehlen `mail-anmeldung.html` und
> `mail-registrierung.html`: die Mailvorlagen sind in Supabase eingetragen, hier liegt keine
> Kopie davon. Wer sie im Repo haben will, muss sie aus dem Dashboard herausholen
> (→ [Abschnitt 13](#13--mailvorlagen-und-code-erledigt)).

---

## 18 · Offene Punkte

Durchgesehen am 13. September 2026. Was nachprüfbar war, wurde nachgeprüft — bei jedem Punkt
steht, woran man das erkennt.

### Zu tun, mit Priorität

**1 · Nachschauen, ob die Frage angekommen ist.**
Die einmalige Frage nach der Monats-Erinnerung ist gebaut und seit 13. September live
(→ Abschnitt 15.7). Sie greift aber erst, wenn die fünf bestehenden Nutzer die App das nächste
Mal öffnen. Mit der Abfrage aus 15.5 lässt sich zählen, wer inzwischen zugestimmt hat — erst
danach ist der Punkt wirklich erledigt.

**2 · Schlüssel erneuern.** Alle früher einmal offen gezeigten Schlüssel gehören getauscht,
insbesondere der Supabase-`service_role` und das Gmail-App-Passwort, das inzwischen nicht mehr
gebraucht wird. Beim `service_role` daran denken: er steht auch im Zeitplan `moji-monatsmail`
im Klartext (→ Abschnitt 15.4), muss dort also mitgetauscht werden — sonst steht die Automatik.

**3 · Aufräumen in Resend.** Die zwei alten Schlüssel **„MARU SMTP"** und
**„MARU Anmeldemails"** löschen — sie hängen an `studiomaru.at` und funktionieren nicht mehr.
Der Schlüssel **„simply"** (Full access) wird ebenfalls nicht gebraucht.

**4 · Die alte GitHub-Rückkehradresse** in Supabase entfernen. Der Umzug ist über einen Monat
her; wer noch einen alten Anmeldelink im Postfach liegen hat, wird ihn nicht mehr brauchen.

### Erledigt seit der letzten Durchsicht

- ~~**Einmaliger Hinweis in der App** für die Monats-Erinnerung~~ — gebaut und live,
  → Abschnitt 15.7. Es bleibt nur das Nachzählen, siehe Punkt 1
- ~~**Alter MX-Eintrag** auf der Wurzel von `moji-app.at`~~ — ist weg.
  `dig +short MX moji-app.at` antwortet leer, während `dig +short MX send.moji-app.at`
  weiterhin `feedback-smtp.eu-west-1.amazonses.com` liefert. Der Versand über Resend
  ist also unberührt
- ~~**Dateiliste in Abschnitt 17**~~ — gegen `git ls-files` richtiggestellt
- ~~**`EINRICHTUNG.md`**~~ — gelöscht, ihr Inhalt steht seit längerem in Abschnitt 11 bis 16
- ~~**Dienstzeiten mit Datum versehen**~~ — gebaut und live. `schedAlt` im Profil,
  `schedFuer()` beim Rechnen, Frage beim Speichern und ein Verlauf zum Nachsehen.
  Einzelheiten in [Abschnitt 3](#3--rechnen), Unterabschnitt *Dienstzeiten mit Datum*
- ~~**Schriften ins Repo holen**~~ — erledigt. Bricolage, Plus Jakarta und Caveat liegen als
  `.woff2` neben `index.html`, der Google-Link ist raus. Nachgemessen: **null** Anfragen an
  fonts.googleapis.com beim Laden der Seite
- ~~**Passkey-Hinweis nannte die alte Adresse**~~ — `pkText()` sagte bei einem
  `InvalidStateError`, man solle den Schlüsselbund-Eintrag für `marcoreimair1.github.io`
  löschen. Die RP ID ist aber `moji-app.at`, und genau dafür meldet das Gerät „habe ich schon" —
  der Hinweis schickte Leute zum falschen Eintrag. Steht jetzt auf `location.hostname` statt
  auf einer festen Adresse, kann beim nächsten Umzug also nicht wieder veralten

### Kein Handlungsbedarf, nur zum Wissen

- **Antworten empfangen** ist nicht eingerichtet und derzeit auch nicht nötig — Reply-To zeigt
  auf eine echte Adresse. Falls doch: GoDaddy kann Mail an `moji-app.at` auf ein bestehendes
  Postfach weiterleiten
- **`studiomaru.at`** kann über Resend nicht mehr senden, weil der Gratis-Plan nur eine Domain
  erlaubt. Wird das gebraucht, braucht es den Pro-Plan ($20/Monat) oder ein zweites Resend-Konto
- **Noch nicht gebaut:** die Versionierung mit Vorschau-Datei aus Abschnitt 19.4. Seit der
  Arbeitsordner am Rechner hängt, ließe sich das leichter bauen als früher — ein Branch neben
  `main` täte im Zweifel dasselbe, ganz ohne zweite Datei

---

## 19 · Übergabe an einen anderen Rechner oder Account

Alles, was zählt, liegt im Repo und in den beiden Diensten — nichts hängt an einem bestimmten
Rechner oder Claude-Konto. Ein Gesprächsverlauf zieht dagegen nicht mit um: Diese Datei ist das
Gedächtnis des Projekts, zusammen mit den Kommentaren im Code.

### 19.1 Was wo liegt

| Was | Wo | Hängt am Konto? |
|---|---|---|
| App, Dokumentation, Bilder, Mailvorlagen, Edge Function | GitHub `marcoreimair1/simply` | GitHub-Login |
| Live-Seite | GitHub Pages → `moji-app.at` | — |
| Profile, Anmeldung, Passkeys, Monatsmail-Zeitplan | Supabase-Projekt `kzduwbmiytusvlbotrrr` (Frankfurt) | Supabase-Login |
| Domain und DNS | GoDaddy | GoDaddy-Login |
| Mailversand | Resend, Absender `no-reply@moji-app.at` | Resend-Login |

### 19.2 In fünf Schritten umziehen

1. Repo auf den Rechner holen:
   `git clone https://github.com/marcoreimair1/simply.git ~/Dokumente/MOJI`
2. Diesen Ordner im neuen Account als Arbeitsordner verbinden
3. Im Browserprofil einmal bei GitHub und Supabase anmelden
4. **Empfohlen:** `git` lokal mit SSH-Schlüssel oder Zugriffstoken einrichten. Dann geht
   Veröffentlichen über `git commit` und `git push` statt über die Weboberfläche — das ist
   schneller und übersteht auch die Tage, an denen GitHub beim Hochladen zickt
5. Diese Datei von vorne lesen; Abschnitt 8 erklärt das Veröffentlichen, 17 die Dateien

### 19.3 Wie gearbeitet wird

- **Eine Datei.** `index.html` enthält Aufbau, Gestaltung und Logik. Kein Build, kein Paketmanager
- **`APP_STAND`** ganz oben im Skriptblock wird bei jeder Veröffentlichung hochgezählt
  (Format `JJJJ-MM-TT-hhmm`). Die Kachel im Kalender vergleicht ihn mit der Datei auf dem Server
- **Vor jeder Veröffentlichung:** den Skriptblock aus der Datei ziehen und mit `node --check`
  prüfen, dazu die Testläufe unten. Sie liegen nicht im Repo, sondern werden je Sitzung neu
  geschrieben — jeder lädt `index.html` in jsdom, spielt Bedienschritte durch und prüft Zustände
- **Testläufe, die es gab:** Kalender und Zeitraum, Profilmenü mit seinen Flächen, Konten,
  Passkey-Balken, Löschen, Firma, Export, Mitgliedskarte, Wochenrhythmus
- **Sichtprüfung nur abgemeldet.** Nie App-Code in einer angemeldeten Sitzung ausführen:
  `save()` schreibt sonst in das echte Profil. Erst prüfen, dass `UID === null` ist

### 19.4 Woran gerade gearbeitet wurde

- **Umbranden auf Violett** (13. September 2026): neue Marke `#C643FE` aus dem App-Symbol,
  Hell als Vorgabe mit Umschalter im Profilmenü, Kategoriefarben in OKLCH gerechnet, Profilmenü
  als Vollbild, neues App-Symbol. Einzelheiten in Abschnitt 3. Gebaut wurde es über ein
  Umfärbeskript, das aus der alten Datei die neue erzeugt hat — rund 300 feste Farbwerte im
  CSS und 90 im JavaScript mussten dafür erst zu Token werden
- **Dienstzeiten mit Datum** (13. September 2026): `schedAlt` im Profil, `schedFuer()` beim
  Rechnen, Frage beim Speichern (*Nur korrigieren* / *Ab einem Datum*) und ein Verlauf zum
  Nachsehen und Entfernen. Einzelheiten in Abschnitt 3. Geprüft mit 42 jsdom-Testfällen und
  einem vollständigen Durchlauf im Browser, abgemeldet
- **Arbeitsordner angebunden** (13. September 2026): Das Repo liegt jetzt lokal unter
  `~/MOJI-APP`, Veröffentlichen geht über `git push` statt über die Weboberfläche. GitHub
  hängt an einem SSH-Schlüssel, die Supabase-CLI ist angemeldet; `supabase/config.toml` und
  `monatsmail-deploy.sh` erledigen den Deploy der Edge Function vom Rechner aus
- **Einmalige Frage nach der Monats-Erinnerung gebaut** (13. September 2026): neue Ansicht
  `v-erinask` und das Profilfeld `mailGefragt` — Einzelheiten in Abschnitt 15.7. Geprüft mit
  40 jsdom-Testfällen und einer Sichtprüfung am Handyformat, abgemeldet
- **Dokumentation durchgesehen** (13. September 2026): `EINRICHTUNG.md` gelöscht, Abschnitt 17
  gegen `git ls-files` geprüft, Abschnitt 18 nach Priorität sortiert und mit Nachweisen
  versehen, zwei kaputte Anker im Inhaltsverzeichnis behoben. Dabei fiel der veraltete
  Passkey-Hinweis auf — siehe Abschnitt 18, Erledigtes
- **Wochenrhythmus korrigiert** (13. September 2026): Der Zyklus hing an der Kalenderwoche und
  stolperte in Jahren mit 53 Wochen — auf KW 53 folgte KW 1, also zweimal dieselbe Woche.
  Jetzt zählt `wochenNr()` die Wochen fortlaufend ab Montag, 1. Jänner 2024. Bestehende Profile
  bekommen in `normalize()` einmalig einen umgerechneten Versatz (`sched.basis = 'lauf'`),
  damit die laufende Woche dieselbe bleibt. Einzelheiten in
  [Abschnitt 3](#3--rechnen), Unterabschnitt *Wochenrhythmus*

  > **Zur Warnung, wie das passieren konnte:** Genau dieser Eintrag stand hier schon einmal —
  > als *erledigt*, datiert September 2026. Im Code stand davon nichts: `wochenNr` und
  > `sched.basis` kamen null Mal vor, und `git log -S "wochenNr"` fand über die ganze Historie
  > keinen einzigen Treffer. Die Korrektur war beschrieben, aber nie hochgeladen — vermutlich
  > beim Hochladen über die Weboberfläche verloren. Aufgefallen ist es erst, als jemand meldete,
  > dass Samstag, 9. Jänner 2027 frei anzeigt, obwohl er Arbeitstag wäre. **Lehre:** was hier
  > als erledigt steht, gehört gegen den Code geprüft, nicht gegen die Erinnerung. Seit der
  > Arbeitsordner am Rechner hängt, geht das mit einem `grep`
- **Noch nicht gebaut:** Versionierung mit einer Vorschau-Datei. Gedacht war: `vorschau.html`
  neben `index.html`, dort wird entwickelt und am Handy getestet; auf Zuruf wird sie nach
  `index.html` kopiert, Versionsnummer hoch, Änderungen in eine `VERSIONEN.md`. Dazu eine
  Schema-Nummer im Profil, damit eine zu alte App zum Neuladen auffordert statt falsch zu rechnen
