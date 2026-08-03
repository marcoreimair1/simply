# Simply · by Marco

Arbeitszeitaufzeichnung für **Miller Optik GmbH**. Eine einzige Datei, kein Server, keine Datenbank, keine Kosten.

---

## Gratis hosten auf GitHub Pages

1. Auf [github.com](https://github.com) einloggen → **New repository**
   - Name z. B. `simply`
   - **Public** wählen (Pages ist bei privaten Repos zahlungspflichtig)
   - Erstellen
2. Im leeren Repo auf **uploading an existing file** klicken und `index.html` hineinziehen → **Commit changes**
3. **Settings** → links **Pages** → unter *Branch* `main` und `/ (root)` wählen → **Save**
4. Nach ein bis zwei Minuten ist die App online:
   `https://DEIN-BENUTZERNAME.github.io/simply/`

Diese Adresse funktioniert auf Handy und Desktop. Am iPhone über *Teilen → Zum Home-Bildschirm* wird daraus eine App-Kachel.

**Alternativen, wenn GitHub zu umständlich ist:** `index.html` auf [app.netlify.com/drop](https://app.netlify.com/drop) ziehen — fertig, ebenfalls gratis. Oder die Datei einfach lokal per Doppelklick öffnen.

---

## Wo liegen die Daten?

Ausschließlich im Browser des jeweiligen Geräts (`localStorage`). Es wird nichts hochgeladen, nichts protokolliert, nichts an Dritte übertragen.

Gespeichert werden: Vorname, Nachname, Geburtsdatum, Dienstzeiten, die gewählten Monate und die eingetragenen Ausnahmen (Urlaub, Krankenstand, eigene Vermerke).

**Wichtig:** Jedes Gerät und jeder Browser hat seinen eigenen Speicher. Wer die App am Handy und am PC nutzt, legt zweimal an. Wer den Browser-Speicher löscht, verliert die Einträge.

---

## Wiedererkennung

Beim zweiten Besuch genügen **Vorname + Geburtsdatum** — die App kennt dann Judith wieder und weiß ihre Arbeitszeiten. Mehrere Personen können denselben Browser nutzen; die bekannten Profile erscheinen als Kacheln zum Antippen.

---

## Rechnen

- Zeiten in **15-Minuten-Schritten**, Stunden auf **0,25 h** gerundet
- **Pause** = Lücke zwischen Ende Vormittag und Beginn Nachmittag, automatisch erkannt
- **Dienstzeiten** Montag bis Samstag, Vormittag und Nachmittag einzeln abschaltbar
- **1 bis 4 Wochenintervalle** mit Rotation nach Kalenderwoche (Rotation verschiebbar)
- **Feiertage Österreich** werden inklusive Ostertermin selbst berechnet und automatisch als Feiertag gezählt — sie überschreiben einen Urlaubseintrag am selben Tag
- **Getrennte Summen**: Arbeitszeit, Urlaub, Krankenstand, Feiertag, Sonstige, Gesamt
- Bei *Eigener Text* lässt sich pro Eintrag festlegen, ob die Stunden als Arbeitszeit zählen (z. B. Schulung) oder nicht (z. B. Zeitausgleich)

---

## PDF-Export

Ein Monat = eine A4-Seite. Enthalten sind Name, Geburtsdatum, Dienstgeber, Zeitraum, alle Tage mit Vormittag, Nachmittag, Pause, Arbeitsstunden und Vermerk, die getrennten Summen sowie zwei Unterschriftsleisten in Schreibschrift (Dienstnehmer/in und Miller Optik).

- **PDF erstellen** → alle gewählten Monate in einer Datei, ein Monat pro Seite
- **Einzeldateien** → pro Monat eine eigene PDF. Chrome fragt beim ersten Mal, ob mehrere Downloads erlaubt sind — bestätigen.

Der Export braucht kurz Internet, weil die PDF-Bibliothek von einem CDN geladen wird. Alles andere läuft offline.

---

## Bedienung in Kurzform

| Aufgabe | Weg |
|---|---|
| Einzelnen Tag markieren | Im Kalender auf den Tag tippen |
| Längeren Urlaub eintragen | Oben *Zeitraum eintragen* → von / bis → Art → *Eintragen* |
| Halben Tag | Im Tages-Dialog oder im Zeitraum *Nur Vormittag* / *Nur Nachmittag* |
| Eintrag entfernen | Tag antippen → *Zurücksetzen*, oder Zeitraum → *Zeitraum leeren* |
| Dienstzeiten ändern | Avatar oben rechts → *Dienstzeiten bearbeiten* |
| Intro nochmal | Avatar → *Intro nochmal ansehen* |

Sonntage bleiben frei und werden nicht gezählt. Beim Zeitraum-Eintrag werden Sonntage, Feiertage und dienstfreie Tage automatisch übersprungen.
