-- ══════════════════════════════════════════════════════════════════
--  Der Becher wird ein Wechselspiel
--
--  Bisher galt nur: einer pro Tag und Person. Wer wollte, konnte damit
--  jeden Tag in dieselbe Richtung schicken, ohne je eine Antwort zu
--  bekommen — aus dem Zuruf wurde eine Einbahn.
--
--  Neu: nach dem eigenen Becher ist die andere Seite dran. Erst wenn
--  sie geschickt hat, geht wieder einer hinaus. Die Tagesregel bleibt
--  daneben bestehen.
--
--  Erkennbar ist das an den beiden Datumsspalten, die es schon gibt:
--  steht mein Datum und das der anderen Seite fehlt oder ist aelter,
--  dann warte ich. Gleicher Tag heisst, wir haben beide geschickt —
--  dann greift die Tagesregel.
--
--  Die Funktion gibt das als eigenes Feld zurueck (wartet), damit die
--  App den Grund nennen kann. Ein grauer Knopf ohne Grund liest sich
--  wie ein Fehler. Weil sich der Rueckgabetyp aendert, muss die alte
--  Fassung zuerst weg.
-- ══════════════════════════════════════════════════════════════════

drop function if exists public.tee_senden(uuid);

create or replace function public.tee_senden(an uuid)
returns table (punkte integer, level integer, schon_heute boolean, wartet boolean)
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
  dran   boolean := false;   -- true = die andere Seite ist am Zug
  meins  date;
  seins  date;
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

  if ich = klein then
    meins := z.letzt_a; seins := z.letzt_b;
  else
    meins := z.letzt_b; seins := z.letzt_a;
  end if;

  -- Habe ich heute schon? Dann bleibt alles, wie es ist.
  war := (meins is not null and meins >= heute);

  -- Bin ich zuletzt drangewesen und die andere Seite seither nicht?
  dran := (meins is not null and (seins is null or seins < meins));

  if not war and not dran then
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
    war,
    dran;
end;
$$;

revoke all on function public.tee_senden(uuid) from public;
revoke all on function public.tee_senden(uuid) from anon;
grant execute on function public.tee_senden(uuid) to authenticated;

-- Selbstpruefung: die Funktion muss das neue Feld tragen. Faellt sie
-- weg, merkt man es sonst erst, wenn jemand einen Becher schickt.
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'tee_senden'
      and 'wartet' = any(p.proargnames)
  ) then
    raise exception 'tee_senden gibt kein wartet zurueck';
  end if;
end $$;
