# MOJI — Cloud einrichten

> **Stand:** Schritt 1 ist erledigt — Projekt `simply` läuft in Frankfurt, Tabelle und
> Zugriffsregeln sind angelegt, Project URL und öffentlicher Schlüssel stehen in
> `index.html`, Site URL und Rückkehradresse sind gesetzt.
>
> **Erledigt:** Datenbank, Zugriffsregeln, Zugangsdaten in `index.html`, Rückkehradresse,
> SMTP über `maru.arbeitszeiten@gmail.com`, Mailvorlage mit Link **und** 6-stelligem Code.
>
> **Offen:** eine echte Anmeldung durchtesten — kommt die Mail an, und landet sie im
> Postfach oder im Spam?

Alles gratis. Konten anlegen und Passwörter eintragen kann ich nicht — das bleibt bei dir.

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

Es sollte **Success. No rows returned** erscheinen.

> Diese Regeln sind der eigentliche Datenschutz. Sie werden in der Datenbank durchgesetzt, nicht in der App — auch wer den Quelltext liest und den öffentlichen Schlüssel kennt, kommt an fremde Zeilen nicht heran.

### 1.3 Die zwei Werte für mich

**Project Settings** (Zahnrad unten links) → **API**:

- **Project URL** — sieht aus wie `https://abcdefgh.supabase.co`
- **anon public** — ein langer Schlüssel, beginnt mit `eyJ...`

Beide sind zur Veröffentlichung gedacht. Schick sie mir, oder trag sie selbst in `index.html` ein — ich markiere die zwei Zeilen im Code deutlich.

⚠️ Den **service_role**-Schlüssel darunter brauche ich **nicht** und du darfst ihn nirgends hineinschreiben. Der umgeht den Zugriffsschutz.

---

## 2 · Mailversand über Gmail

Supabase verschickt selbst nur zwei Mails pro Stunde und nur an Adressen aus dem eigenen
Projektteam. Für echte Mitarbeiter braucht es einen eigenen Versand.

**Warum nicht Resend?** Resend liefert ohne verifizierte Domain ausschließlich an das eigene
Kontopostfach. Und `miller.at` hat den SPF-Eintrag `v=spf1 include:spf.protection.outlook.com -all` —
das `-all` lehnt jeden fremden Versandserver hart ab. Als `@miller.at` über Resend zu senden
würde also im Spam landen. Miller Optik läuft über Microsoft 365; die saubere Lösung wäre
später der Firmen-Mailserver oder Resend mit freigeschalteter Domain.

### 2.1 App-Passwort bei Google erzeugen  *(erledigt)*

Ein App-Passwort ist ein 16-stelliger Code nur für diese eine App — nicht dein Kontopasswort.

0. Falls noch nicht vorhanden: das Google-Konto `maru.arbeitszeiten@gmail.com` anlegen
1. **Im neuen Konto** angemeldet sein, dann Zwei-Faktor-Bestätigung einschalten — ohne sie
   gibt es die App-Passwort-Seite nicht: [myaccount.google.com/security](https://myaccount.google.com/security)
2. [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) öffnen
3. Name `MOJI` eingeben → **Erstellen**
4. Den 16-stelligen Code **sofort kopieren**, er wird nur einmal gezeigt (Leerzeichen weglassen)

### 2.2 In Supabase eintragen  *(erledigt)*

**Authentication** → **Emails** → Reiter **SMTP Settings** → **Enable custom SMTP**:

| Feld | Wert |
|---|---|
| Sender email address | `maru.arbeitszeiten@gmail.com` |
| Sender name | `MOJI` |
| Host | `smtp.gmail.com` |
| Port number | `587` |
| Username | `maru.arbeitszeiten@gmail.com` |
| Password | dein App-Passwort (16 Zeichen, ohne Leerzeichen) |

**Save changes.** Das Passwort trägst du selbst ein — ich gebe grundsätzlich keine Zugangsdaten ein.

> Absender und Benutzername **müssen dieselbe Adresse** sein. Gmail erlaubt nur die Adresse des
> angemeldeten Kontos als Absender, sonst wird die Mail abgewiesen. Das App-Passwort muss aus
> genau diesem Konto stammen — nicht aus deinem privaten.
>
> Supabase warnt beim Speichern, Gmail sei für persönliche statt automatische Mails gedacht.
> Das ist korrekt und als Zwischenlösung in Ordnung: Grenze etwa 500 Mails pro Tag, und der
> Absender ist eine Gmail-Adresse. Für den Dauerbetrieb ist der Firmen-Mailserver besser.

---

## 3 · Mailtext und Code  *(erledigt)*

Die Vorlagen lassen sich **erst nach dem Speichern des SMTP-Zugangs** bearbeiten — das ist
der Grund für diese Reihenfolge. Gesetzt ist:

**Authentication** → **Emails** → **Templates** → **Magic link or OTP**:

- Betreff: `Deine Anmeldung bei MOJI`
- Inhalt:

```html
<h2>Anmeldung bei MOJI</h2>
<p>Tippe auf den Link — kein Passwort nötig:</p>
<p><a href="{{ .ConfirmationURL }}">Jetzt anmelden</a></p>
<p>Oder gib diesen Code in der App ein:</p>
<p style="font-size:28px;letter-spacing:6px"><strong>{{ .Token }}</strong></p>
<p>Gültig eine Stunde, einmal verwendbar. Nicht angefordert? Einfach ignorieren.</p>
<p>MOJI — Mehr Zeit fürs Wesentliche.</p>
```

Der `{{ .Token }}` ist wichtig: wer MOJI vom iPhone-Home-Bildschirm öffnet, kann den Link nicht
nutzen — der öffnet Safari, und eine Home-Bildschirm-App hat auf iOS einen eigenen Speicher.
Mit dem Code funktioniert die Anmeldung auch dort.

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
