-- ══════════════════════════════════════════════════════════════════
-- MOJI · Team und Bubble Tea
-- Im SQL-Editor von Supabase ausführen. Läuft mehrfach durch, ohne
-- Schaden anzurichten — jede Anweisung ist "if not exists" oder
-- "create or replace".
--
-- Was hier entsteht:
--   mitglieder   Wer arbeitet in derselben Firma, mit Name, Bild,
--                Filiale, MOJI-Stufe und wann zuletzt online.
--   tee          Der gemeinsame Punktetopf je Paar.
--   tee_senden() Ein Getränk verschicken — einmal pro Tag und Richtung.
--
-- Warum das nicht im Browser geht: die Regel „einmal am Tag" wäre dort
-- in zehn Sekunden ausgehebelt. Sie muss am Server stehen.
-- ══════════════════════════════════════════════════════════════════


-- ─── 1 · Die öffentliche Zeile je Mitglied ────────────────────────
-- Absichtlich NICHT die ganze records-Zeile freigeben: dort stehen
-- Dienstzeiten, Urlaub und Krankenstände. Hier steht nur, was Kollegen
-- voneinander sehen dürfen.
create table if not exists public.mitglieder (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  firma     text not null default 'miller-optik',
  vorname   text not null default '',
  kuerzel   text not null default '',      -- Anfangsbuchstabe des Nachnamens
  avatar    smallint not null default 1,   -- 1..12, die Bilddatei
  filiale   text not null default '',
  stufe     smallint not null default 1,   -- MOJI-Stufe, 1..12
  zuletzt   timestamptz not null default now(),
  angelegt  timestamptz not null default now()
);

create index if not exists mitglieder_firma_idx on public.mitglieder (firma);

alter table public.mitglieder enable row level security;

-- Lesen: alle Angemeldeten, die in derselben Firma sind.
drop policy if exists mitglieder_lesen on public.mitglieder;
create policy mitglieder_lesen on public.mitglieder
  for select to authenticated
  using (
    firma = (select m.firma from public.mitglieder m where m.user_id = auth.uid())
  );

-- Schreiben: nur die eigene Zeile. Die Firma setzt niemand selbst —
-- solange es keine Firmenregistrierung gibt, bleibt der Vorgabewert.
drop policy if exists mitglieder_anlegen on public.mitglieder;
create policy mitglieder_anlegen on public.mitglieder
  for insert to authenticated
  with check (user_id = auth.uid() and firma = 'miller-optik');

drop policy if exists mitglieder_aendern on public.mitglieder;
create policy mitglieder_aendern on public.mitglieder
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and firma = 'miller-optik');


-- ─── 2 · Der gemeinsame Topf ──────────────────────────────────────
-- Ein Eintrag je Paar, nicht je Richtung: das Level ist geteilt. Damit
-- ein Paar nur einmal vorkommt, steht immer die kleinere uuid in a.
create table if not exists public.tee (
  a        uuid not null references auth.users(id) on delete cascade,
  b        uuid not null references auth.users(id) on delete cascade,
  punkte   integer not null default 0,
  letzt_a  date,                 -- wann a zuletzt geschickt hat
  letzt_b  date,
  primary key (a, b),
  constraint tee_reihenfolge check (a < b)
);

alter table public.tee enable row level security;

-- Sehen darf man nur die eigenen Paare.
drop policy if exists tee_lesen on public.tee;
create policy tee_lesen on public.tee
  for select to authenticated
  using (a = auth.uid() or b = auth.uid());

-- Geschrieben wird ausschliesslich über tee_senden() — siehe unten.
revoke insert, update, delete on public.tee from authenticated;


-- ─── 3 · Ein Getränk verschicken ──────────────────────────────────
-- Gibt den neuen Stand zurück: punkte, level und ob es heute schon war.
-- security definer, damit die Funktion schreiben darf, der Aufrufer aber
-- nicht — sonst könnte jeder den Topf direkt hochsetzen.
create or replace function public.tee_senden(an uuid)
returns table (punkte integer, level integer, schon_heute boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  ich    uuid := auth.uid();
  klein  uuid;
  gross  uuid;
  heute  date := (now() at time zone 'Europe/Vienna')::date;
  z      public.tee%rowtype;
  war    boolean := false;
begin
  if ich is null then
    raise exception 'nicht angemeldet';
  end if;
  if an is null or an = ich then
    raise exception 'kein gueltiger Empfaenger';
  end if;

  -- Nur innerhalb derselben Firma.
  if not exists (
    select 1 from public.mitglieder m1, public.mitglieder m2
    where m1.user_id = ich and m2.user_id = an and m1.firma = m2.firma
  ) then
    raise exception 'nicht dieselbe Firma';
  end if;

  klein := least(ich, an);
  gross := greatest(ich, an);

  insert into public.tee (a, b) values (klein, gross)
    on conflict (a, b) do nothing;

  select * into z from public.tee t where t.a = klein and t.b = gross for update;

  -- Habe ich heute schon? Dann bleibt alles, wie es ist.
  if ich = klein then
    war := (z.letzt_a is not null and z.letzt_a >= heute);
  else
    war := (z.letzt_b is not null and z.letzt_b >= heute);
  end if;

  if not war then
    if ich = klein then
      update public.tee t set punkte = t.punkte + 1, letzt_a = heute
        where t.a = klein and t.b = gross returning * into z;
    else
      update public.tee t set punkte = t.punkte + 1, letzt_b = heute
        where t.a = klein and t.b = gross returning * into z;
    end if;
  end if;

  return query select
    z.punkte,
    public.tee_level(z.punkte),
    war;
end;
$$;

revoke all on function public.tee_senden(uuid) from public;
grant execute on function public.tee_senden(uuid) to authenticated;


-- ─── 4 · Aus Punkten wird ein Level ───────────────────────────────
-- 0 Punkte  = 0 (noch nichts)
-- 1 Punkt   = 1 (Ube Pop)
-- danach je 10 Getränke eine Stufe, höchstens 10 (Ruby Royale).
create or replace function public.tee_level(p integer)
returns integer
language sql
immutable
as $$
  select case
    when p <= 0 then 0
    else least(10, 1 + ((p - 1) / 10))
  end;
$$;


-- ─── 5 · Zuletzt online ───────────────────────────────────────────
-- Die App ruft das beim Start. Eigene Funktion statt update, damit die
-- Regel „nur die eigene Zeile" nicht an der Policy hängt.
create or replace function public.moji_gesehen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.mitglieder set zuletzt = now() where user_id = auth.uid();
$$;

revoke all on function public.moji_gesehen() from public;
grant execute on function public.moji_gesehen() to authenticated;


-- ─── 6 · Aufräumen beim Löschen des Kontos ────────────────────────
-- konto_loeschen() gibt es schon; die Fremdschlüssel oben räumen
-- mitglieder und tee automatisch mit ab (on delete cascade).


-- ══════════════════════════════════════════════════════════════════
-- Probe nach dem Ausführen (als angemeldete Person im SQL-Editor
-- funktioniert auth.uid() nicht — also lieber in der App testen):
--   select * from public.mitglieder;
--   select public.tee_level(0), public.tee_level(1), public.tee_level(11),
--          public.tee_level(91), public.tee_level(500);
--   -> 0, 1, 2, 10, 10
-- ══════════════════════════════════════════════════════════════════
