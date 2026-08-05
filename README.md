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
12. [Mailversand](#12--mailversand)
13. [Mailvorlagen und Code](#13--mailvorlagen-und-code)
14. [Passkeys](#14--passkeys)
15. [Monats-Erinnerung automatisch verschicken](#15--monats-erinnerung-automatisch-verschicken)
16. [Mitarbeiter aufnehmen und Konten verwalten](#16--mitarbeiter-aufnehmen-und-konten-verwalten)

**Anhang**

17. [Dateien im Projekt](#17--dateien-im-projekt)
18. [Offene Punkte](#18--offene-punkte)

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

**Passkey.** Im Profilmenü lässt sich ein Passkey anlegen — danach genügt Face ID oder
Fingerabdruck. Ein Passkey gilt immer nur für **ein Gerät** und **eine Adresse**; nach dem
Umzug auf `moji-app.at` musste jeder seinen neu anlegen. Die App erkennt das selbst und
bietet im Menü *Passkey neu anlegen* an.

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
  oder nicht (Zeitausgleich)

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

> **Stand:** Abschnitte 11 bis 14 sind erledigt. Offen ist allein Abschnitt 15,
> die automatische Monats-Erinnerung.

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

## 12 · Mailversand *(erledigt)*

Supabase verschickt selbst nur zwei Mails pro Stunde und nur an Adressen aus dem eigenen
Projektteam. Für echte Mitarbeiter braucht es einen eigenen Versand — derzeit Gmail über
`maru.arbeitszeiten@gmail.com`.

**Authentication** → **Emails** → **SMTP Settings** → **Enable custom SMTP**:

| Feld | Wert |
|---|---|
| Sender email address | `maru.arbeitszeiten@gmail.com` |
| Sender name | `MOJI` |
| Host | `smtp.gmail.com` |
| Port number | `587` |
| Username | `maru.arbeitszeiten@gmail.com` |
| Password | App-Passwort, 16 Zeichen, ohne Leerzeichen |

Absender und Benutzername **müssen dieselbe Adresse** sein — Gmail erlaubt nur die Adresse des
angemeldeten Kontos. Das App-Passwort entsteht unter
[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) und setzt die
Zwei-Faktor-Bestätigung im **selben** Konto voraus.

**Warum nicht Resend für die Anmeldemails?** Resend liefert ohne verifizierte Domain nur ans
eigene Kontopostfach. Und `miller.at` hat den SPF-Eintrag
`v=spf1 include:spf.protection.outlook.com -all` — das `-all` weist jeden fremden Versandserver
hart ab. Als `@miller.at` über Resend zu senden würde im Spam landen. Sauber wäre später der
Firmen-Mailserver oder Resend mit freigeschalteter eigener Domain — `moji-app.at` gehört uns
inzwischen, das wäre der nächste Schritt.

Gmail-Grenze: etwa 500 Mails pro Tag. Für den Dauerbetrieb ist der Firmen-Mailserver besser.

---

## 13 · Mailvorlagen und Code *(erledigt)*

Vorlagen lassen sich **erst nach dem Speichern des SMTP-Zugangs** bearbeiten.

**Authentication** → **Emails** → **Templates** → **Magic link or OTP**:

- Betreff: `Deine Anmeldung bei MOJI`

```html
<h2>Anmeldung bei MOJI</h2>
<p>Tippe auf den Link — kein Passwort nötig:</p>
<p><a href="{{ .ConfirmationURL }}">Jetzt anmelden</a></p>
<p>Oder gib diesen Code in der App ein:</p>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
<p>Gültig eine Stunde, einmal verwendbar. Nicht angefordert? Einfach ignorieren.</p>
<p>MOJI — Mehr Zeit fürs Wesentliche.</p>
```

Der `{{ .Token }}` ist der Grund, warum die Anmeldung auch vom iPhone-Startbildschirm
funktioniert. Die gestalteten Fassungen liegen als `mail-anmeldung.html` und
`mail-registrierung.html` im Projekt.

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

---

## 15 · Monats-Erinnerung automatisch verschicken

**Ziel:** am Ersten jedes Monats bekommt jeder, der zugestimmt hat, eine kurze Mail —
*„wir erinnern dich, dass Juli jetzt zum Schreiben wäre“*. Wer den Monat schon abgegeben hat,
bekommt nichts. Nur per Mail, weil eine Nachricht im App-Postfach niemanden zurückholt.

Fertig im Projekt liegen:

- `monatsmail.ts` — die Edge Function samt Mailvorlage im MOJI-Design
- `monatsmail.sql` — Tabelle `mail_log` gegen Doppelmails und der Zeitplan

### 15.1 Absender bei Resend freischalten

1. Bei [resend.com](https://resend.com) anmelden → **Domains** → **Add Domain** → `moji-app.at`
2. Resend zeigt drei DNS-Einträge (DKIM, SPF, optional DMARC) → bei GoDaddy eintragen
3. Nach der Prüfung **Verified** → **API Keys** → neuen Schlüssel erzeugen und kopieren

### 15.2 Schlüssel in Supabase hinterlegen

**Project Settings** → **Edge Functions** → **Secrets**:

| Name | Wert |
|---|---|
| `RESEND_API_KEY` | der Schlüssel aus 15.1 |
| `MAIL_VON` | `MOJI <hallo@moji-app.at>` |

`SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` sind automatisch vorhanden.

### 15.3 Funktion veröffentlichen

Im **Dashboard**: **Edge Functions** → **Deploy a new function** → Name `monatsmail` → den
Inhalt von `monatsmail.ts` einfügen → **Deploy**.

Oder auf dem Rechner mit der CLI:

```bash
mkdir -p supabase/functions/monatsmail
cp monatsmail.ts supabase/functions/monatsmail/index.ts
npx supabase login
npx supabase link --project-ref PROJEKT_REF
npx supabase functions deploy monatsmail
```

### 15.4 Tabelle und Zeitplan

`monatsmail.sql` im **SQL Editor** ausführen. Vorher die zwei Platzhalter ersetzen:
`PROJEKT_REF` und `SERVICE_ROLE_KEY`. Der Zeitplan steht auf `10 5 1 * *` — am Ersten um
05:10 UTC, im Sommer 07:10 Wiener Zeit. Im Winter wird es 06:10; falls das stören sollte,
zweimal im Jahr die Stunde anpassen.

### 15.5 Vorher einmal trocken prüfen

Im SQL Editor auslesen, wer eine Mail bekäme:

```sql
select r.user_id, u.email, r.data->>'vorname' as vorname
from public.records r join auth.users u on u.id = r.user_id
where r.data->>'mailOk' = 'true'
  and not (r.data->'exp' ? '2026-6');   -- 2026-6 = Juli 2026, Monat ab 0 gezählt
```

Danach die Funktion einmal von Hand anstoßen (**Edge Functions** → `monatsmail` → **Invoke**).
Sie antwortet mit `{ monat, lauf, gesendet, uebersprungen, fehler }`. Ein zweiter Aufruf im
selben Monat schickt nichts mehr — dafür ist `mail_log` da.

### 15.6 Wie die Erinnerung abgeschaltet wird

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

| Datei | Wofür |
|---|---|
| `index.html` | die ganze App |
| `CNAME` | `moji-app.at` für GitHub Pages |
| `manifest.webmanifest`, `icon-180.png`, `icon-512.png` | Symbol und Name am Startbildschirm |
| `moji-favicon.svg`, `moji-wortmarke-*.svg`, `moji-icon-marke.svg` | Marke |
| `av-1.png` … `av-12.png` | die zwölf Profilbilder |
| `firma-miller.png` | Logo Miller Optik, nur bei der Firmenauswahl |
| `wolken.mp4` | Hintergrund im Ladebild |
| `mail-anmeldung.html`, `mail-registrierung.html` | Vorlagen für Supabase |
| `monatsmail.ts` | Monats-Erinnerung, Code der Edge Function |
| `monatsmail.sql` | Tabelle und Zeitplan dazu |

Profilbilder haben ihre eigene Fassung: `AV_STAND` in `index.html` hochsetzen, sonst zeigen
Geräte die alten Bilder aus dem Zwischenspeicher.

---

## 18 · Offene Punkte

- **Abschnitt 15** einrichten: Resend-Domain, Secrets, Funktion, Zeitplan
- Alter **MX-Eintrag** auf der Wurzel von `moji-app.at` ist verwaist und kann weg
- Zwei **unbenutzte Resend-Schlüssel** löschen
- Die alte **GitHub-Rückkehradresse** in Supabase in einigen Wochen entfernen
- **Dienstzeiten mit Datum versehen**, damit alte Monate mit dem damals gültigen Plan gerechnet
  werden — heute gilt immer der aktuelle Plan
- Eigene **Absenderdomain** auch für die Anmeldemails, statt Gmail
- Der **Gmail-Zugang** und alle früher einmal offen gezeigten Schlüssel gehören erneuert
