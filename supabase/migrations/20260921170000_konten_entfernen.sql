-- ══════════════════════════════════════════════════════════════════
--  Zwei Konten entfernen
--
--  noah.zinic@icloud.com     — Doppelkonto, dieselbe Person hat
--                              seit 16.09. noah.zinic@miller.at
--  nopaintedmedia@gmail.com  — "Marco Test", ein Testkonto
--
--  Nachgesehen vor dem Loeschen: beide seit August nicht mehr
--  angemeldet, je 5 Monate im Buch und NULL abgegebene Monate. Es
--  geht also kein Nachweis verloren, nur Dienstzeiten, die nie zu
--  einem PDF geworden sind.
--
--  Geloescht wird von den Blaettern zur Wurzel: erst die Becher, dann
--  die oeffentliche Zeile, dann das Profil, zuletzt das Konto. Die
--  Fremdschluessel haetten das Meiste mitgenommen, aber eine Loeschung
--  soll man lesen koennen, nicht erraten muessen.
--
--  Die Selbstpruefung am Ende laesst die Migration scheitern, falls
--  etwas stehen bleibt — dann wird alles zurueckgerollt.
-- ══════════════════════════════════════════════════════════════════

do $$
declare
  ids uuid[];
  n   integer;
begin
  select array_agg(id) into ids
    from auth.users
   where email in ('noah.zinic@icloud.com', 'nopaintedmedia@gmail.com');

  if ids is null then
    raise notice 'Beide Konten sind bereits weg.';
    return;
  end if;

  delete from public.tee        where a = any(ids) or b = any(ids);
  delete from public.mitglieder where user_id = any(ids);
  delete from public.records    where user_id = any(ids);
  delete from auth.users        where id = any(ids);

  select count(*) into n from auth.users where id = any(ids);
  if n > 0 then
    raise exception 'Konten liessen sich nicht loeschen (% uebrig)', n;
  end if;

  select count(*) into n
    from public.mitglieder m where m.user_id = any(ids);
  if n > 0 then
    raise exception 'Zeilen in mitglieder uebrig (%)', n;
  end if;

  raise notice 'Zwei Konten entfernt.';
end $$;
