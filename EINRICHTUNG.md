# Simply — Cloud einrichten

Vier Schritte, etwa 20 Minuten. Alles gratis. Ich kann keine Konten anlegen und keine Passwörter eintragen, das musst du selbst machen — den Code baue ich parallel.

Am Ende brauche ich von dir **zwei Werte** (Punkt 1.3). Die sind öffentlich und dürfen im Quelltext stehen.

---

## 1 · Supabase — die Datenbank

### 1.1 Projekt anlegen

1. [supabase.com](https://supabase.com) → **Start your project** → mit GitHub anmelden (das Konto hast du schon)
2. **New project**
   - Name: `simply`
   - Database Password: eines vergeben und **im Passwortmanager speichern** — du brauchst es später kaum, aber es ist nicht wiederherstellbar
   - Region: **Central EU (Frankfurt)** — wichtig, damit die Daten in der EU bleiben
   - Plan: **Free**
3. **Create new project** → zwei bis drei Minuten warten

### 1.2 Tabelle und Zugriffsschutz

Links im Menü **SQL Editor** → **New query** → das Folgende komplett hineinkopieren → **Run**:

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
```

Es sollte **Success. No rows returned** erscheinen.

> Diese vier Regeln sind der eigentliche Datenschutz. Sie werden in der Datenbank durchgesetzt, nicht in der App — auch wer den Quelltext liest und den öffentlichen Schlüssel kennt, kommt an fremde Zeilen nicht heran.

### 1.3 Die zwei Werte für mich

**Project Settings** (Zahnrad unten links) → **API**:

- **Project URL** — sieht aus wie `https://abcdefgh.supabase.co`
- **anon public** — ein langer Schlüssel, beginnt mit `eyJ...`

Beide sind zur Veröffentlichung gedacht. Schick sie mir, oder trag sie selbst in `index.html` ein — ich markiere die zwei Zeilen im Code deutlich.

⚠️ Den **service_role**-Schlüssel darunter brauche ich **nicht** und du darfst ihn nirgends hineinschreiben. Der umgeht den Zugriffsschutz.

---

## 2 · Resend — der Mailversand

Supabase verschickt selbst nur zwei Mails pro Stunde und nur an Adressen aus dem Projektteam. Für echte Mitarbeiter braucht es einen eigenen Versand.

1. [resend.com](https://resend.com) → **Sign up** (gratis, 3.000 Mails pro Monat)
2. Links **API Keys** → **Create API Key** → Name `simply`, Permission **Sending access** → **Add**
3. Den Schlüssel (`re_...`) **sofort kopieren**, er wird nur einmal gezeigt

**Optional, aber empfohlen:** unter **Domains** → **Add Domain** deine Domain `miller.at` hinterlegen und die angezeigten DNS-Einträge setzen. Dann kommt die Anmeldemail von `simply@miller.at` statt von einer fremden Adresse. Ohne das funktioniert der Versand auch, nur mit Resends Absenderdomain.

---

## 3 · Beide verbinden

Zurück in Supabase → **Authentication** → **Emails** → Reiter **SMTP Settings** → **Enable Custom SMTP**:

| Feld | Wert |
|---|---|
| Sender email | `simply@miller.at` (oder die Resend-Adresse, falls du keine Domain hinterlegt hast) |
| Sender name | `Simply · Miller Optik` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | dein Resend-Schlüssel `re_...` |

**Save**. Diesen Schlüssel trägst du selbst ein — ich sehe ihn nicht und brauche ihn nicht.

### Rückkehradresse festlegen

**Authentication** → **URL Configuration**:

- **Site URL**: `https://marcoreimair1.github.io/simply/`
- **Redirect URLs** → **Add URL**: `https://marcoreimair1.github.io/simply/`

Ohne das landet der Klick auf den Anmeldelink im Nichts.

### Mailtext eindeutschen

**Authentication** → **Emails** → **Magic Link** — dort steht englischer Standardtext. Vorschlag:

- Betreff: `Deine Anmeldung bei Simply`
- Inhalt:

```html
<h2>Anmeldung bei Simply</h2>
<p>Tippe auf den Link, dann bist du drin — es gibt kein Passwort zu merken.</p>
<p><a href="{{ .ConfirmationURL }}">Jetzt anmelden</a></p>
<p>Der Link gilt eine Stunde und funktioniert einmal. Hast du das nicht angefordert, ignoriere diese Mail einfach.</p>
<p>Simply · Arbeitszeitaufzeichnung für Miller Optik GmbH</p>
```

---

## 4 · Mitarbeiter aufnehmen

Es braucht keine Einladung. Jede Person tippt ihre E-Mail-Adresse in die App, bekommt den Link, und beim ersten Mal läuft danach der gewohnte Funnel mit Name, Geburtsdatum und Dienstzeiten. Alles Weitere liegt dann auf dem Server.

Wer sich anmeldet, erscheint in Supabase unter **Authentication** → **Users**.

**Wenn du es zusperren willst:** sag mir Bescheid, dann baue ich eine Liste erlaubter Adressen ein — dann kommen nur `@miller.at`-Adressen oder von dir freigegebene Personen hinein. Ohne das könnte theoretisch jeder mit der Adresse der Seite ein Konto anlegen. Er sähe zwar nur seine eigenen leeren Daten, aber sauberer ist eine Schranke.

---

## Was das für die Datensicherheit bedeutet

**Vorher:** alles nur im Browser des Geräts. Safari löscht diesen Speicher nach sieben Tagen ohne Besuch — bei monatlichem Eintragen wären die Daten regelmäßig weg.

**Danach:** die Daten liegen in Frankfurt in der Datenbank. Safari kann höchstens die Anmeldung vergessen, dann kommt eine neue Mail. Verloren geht nichts, und dieselbe Person kann am Handy, am Geschäfts-PC und auf einem neuen Telefon weiterarbeiten.

**Datenschutz:** Arbeitszeiten und besonders Krankenstände sind personenbezogene, teils Gesundheitsdaten. Sie liegen in der EU, jede Person kommt ausschließlich an ihre eigenen. Ich bin kein Anwalt — für Miller Optik als Dienstgeber gehört das voraussichtlich ins Verzeichnis der Verarbeitungstätigkeiten, und ein Auftragsverarbeitungsvertrag mit Supabase wäre zu prüfen. Das würde ich mit eurer Datenschutzberatung kurz abklopfen.
