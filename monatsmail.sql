-- ══════════════════════════════════════════════════════════════
-- MOJI · Monats-Erinnerung: Tabelle und Zeitplan
-- Im SQL-Editor von Supabase ausführen. Setzt voraus, dass die
-- Edge Function "monatsmail" schon veröffentlicht ist.
-- ══════════════════════════════════════════════════════════════

-- 1 · Merkzettel gegen doppelte Mails ---------------------------
create table if not exists public.mail_log (
  user_id  uuid not null references auth.users(id) on delete cascade,
  lauf     text not null,                 -- "2026-07" = Erinnerung an Juli
  art      text not null default 'monat',
  gesendet timestamptz not null default now(),
  primary key (user_id, lauf, art)
);

alter table public.mail_log enable row level security;
-- Kein Zugriff für Angemeldete: nur der Dienst schreibt hier hinein.
revoke all on public.mail_log from anon, authenticated;

-- 2 · Erweiterungen für den Zeitplan ---------------------------
create extension if not exists pg_cron  with schema extensions;
create extension if not exists pg_net   with schema extensions;

-- 3 · Alten Eintrag entfernen, falls schon einmal gesetzt -------
select cron.unschedule('moji-monatsmail')
where exists (select 1 from cron.job where jobname = 'moji-monatsmail');

-- 4 · Am Ersten jedes Monats um 07:10 Wien (= 05:10 UTC im Sommer)
--     Vor dem Ausführen nur noch SERVICE_ROLE_KEY ersetzen:
--       Settings → API → service_role (der geheime Schlüssel).
--     Die Projektadresse ist schon eingesetzt.
select cron.schedule(
  'moji-monatsmail',
  '10 5 1 * *',
  $$
  select net.http_post(
    url     := 'https://kzduwbmiytusvlbotrrr.supabase.co/functions/v1/monatsmail',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer SERVICE_ROLE_KEY'),
    body    := '{}'::jsonb
  );
  $$
);

-- 5 · Kontrolle ------------------------------------------------
select jobname, schedule, active from cron.job where jobname = 'moji-monatsmail';
