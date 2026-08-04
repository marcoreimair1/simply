# MARU

**Eine App von Studio MARU 丸**

Arbeitszeitaufzeichnung für **Miller Optik GmbH**. Eine einzige HTML-Datei, gehostet auf GitHub Pages, mit Supabase als Datenspeicher.

**Live:** https://marcoreimair1.github.io/simply/

> Die Adresse enthält noch den alten Projektnamen. Sie umzubenennen würde auch die Rückkehradresse in Supabase betreffen — sag Bescheid, wenn es dir wichtig ist.

---

## Anmelden

Jede Person tippt ihre E-Mail-Adresse ein und bekommt eine Mail mit einem Link. Kein Passwort. Der Link funktioniert auf jedem Gerät — Handy, Geschäfts-PC, neues Telefon.

Beim ersten Mal läuft danach der Funnel: Vorname, Nachname, Geburtsdatum, Dienstzeiten. Alles Weitere liegt am Konto.

---

## Wo liegen die Daten?

In einer Postgres-Datenbank bei **Supabase in Frankfurt**, eine Zeile pro Person. Row-Level-Security setzt in der Datenbank durch, dass jede Person ausschließlich ihre eigene Zeile sieht — auch wer den Quelltext liest und den öffentlichen Schlüssel kennt, kommt nicht an fremde Daten.

Im Browser liegt zusätzlich ein Zwischenspeicher, damit die App offline weiterläuft. Oben rechts zeigt eine Anzeige den Stand: **Gesichert**, **Sichere …**, **Offline · wird nachgeholt** oder **Nicht gesichert**.

Warum überhaupt eine Datenbank: Safari löscht den Browserspeicher einer Website nach sieben Tagen ohne Besuch. Bei monatlichem Eintragen wären die Aufzeichnungen regelmäßig verschwunden.

**Datenschutz:** Arbeitszeiten und besonders Krankenstände sind personenbezogene, teils Gesundheitsdaten. Für Miller Optik als Dienstgeber gehört das voraussichtlich ins Verzeichnis der Verarbeitungstätigkeiten, und ein Auftragsverarbeitungsvertrag mit Supabase wäre zu prüfen. Das ist keine Rechtsberatung — kurz mit der Datenschutzberatung abklopfen.

---

## Einrichtung

Siehe **[EINRICHTUNG.md](EINRICHTUNG.md)** — Supabase-Projekt, SQL für Tabelle und Zugriffsregeln, Resend für den Mailversand.

Die Zugangsdaten stehen oben in `index.html` im Block `CLOUD`. Bleiben sie leer, läuft MARU rein lokal weiter.

---

## Rechnen

- Zeiten in **15-Minuten-Schritten**, Stunden auf **0,25 h** gerundet
- **Pause** = Lücke zwischen Ende Vormittag und Beginn Nachmittag, automatisch erkannt
- **Dienstzeiten** Montag bis Samstag, Vormittag und Nachmittag einzeln abschaltbar
- **1 bis 4 Wochenintervalle**; du tippst an, nach welcher Woche du gerade arbeitest
- **Feiertage Österreich** werden inklusive Ostertermin selbst berechnet und überschreiben einen Urlaubseintrag am selben Tag
- **Getrennte Summen**: Arbeitszeit, Urlaub, Krankenstand, Feiertag, Sonstige, Gesamt
- Bei *Eigener Text* lässt sich festlegen, ob die Stunden als Arbeitszeit zählen (Schulung) oder nicht (Zeitausgleich)

---

## PDF-Export

Ein Monat = eine A4-Seite: Name, Geburtsdatum, Dienstgeber, Zeitraum, alle Tage mit Vormittag, Nachmittag, Pause, Arbeitsstunden und Vermerk, die getrennten Summen, dazu zwei Unterschriftsleisten in Schreibschrift.

- **PDF erstellen** → alle gewählten Monate in einer Datei, ein Monat pro Seite
- **Lieber pro Monat eine eigene Datei** → eine PDF je Monat. Chrome fragt beim ersten Mal, ob mehrere Downloads erlaubt sind

Der Export lädt die PDF-Bibliothek von einem CDN, braucht also kurz Internet.

---

## Bedienung in Kurzform

| Aufgabe | Weg |
|---|---|
| Einzelnen Tag markieren | Im Kalender auf den Tag tippen |
| Längeren Urlaub eintragen | Oben *Zeitraum eintragen* → ersten und letzten Tag antippen → Art → *Eintragen* |
| Halben Tag | Im Tagesdialog oder im Zeitraum *Nur Vormittag* / *Nur Nachmittag* |
| Eintrag entfernen | Tag antippen → *Zurücksetzen*, oder Zeitraum → *Einträge entfernen* |
| Dienstzeiten ändern | Avatar oben rechts → *Dienstzeiten bearbeiten* |
| Abmelden | Avatar → *Abmelden* |

Sonntage bleiben frei. Beim Zeitraum-Eintrag werden Sonntage, Feiertage und dienstfreie Tage automatisch übersprungen.

---

## Nach einem Update

GitHub Pages liefert die Seite mit zehn Minuten Haltbarkeit aus. Kurz nach einer Änderung kann der Browser noch die alte Fassung zeigen — dann einmal hart neu laden oder `?x=1` an die Adresse hängen.
