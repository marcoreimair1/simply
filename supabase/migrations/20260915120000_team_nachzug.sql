-- ══════════════════════════════════════════════════════════════════
-- MOJI · Alle bestehenden Konten ins Team
--
-- Bisher legte nur die App selbst eine Zeile in mitglieder an, und auch
-- das erst, wenn jemand "Meine Firma" aufmachte. Wer MOJI seit Monaten
-- benutzt und dort nie hineingeschaut hat, fehlte im Team.
--
-- Zwei Teile:
--   1) Ein Auslöser an records. Jedes Sichern zieht die oeffentliche
--      Zeile nach — Name, Anfangsbuchstabe, Bild, Stufe, zuletzt aktiv.
--      Damit stimmt es ab jetzt von selbst, ohne Zutun der App.
--   2) Ein einmaliger Nachzug fuer alles, was schon da ist.
--
-- Uebertragen wird nur, was Kollegen ohnehin voneinander sehen duerfen.
-- Dienstzeiten, Urlaub und Krankenstaende bleiben in records.
-- ══════════════════════════════════════════════════════════════════


-- ─── 1 · Die Stufe aus den abgegebenen Monaten ────────────────────
-- Dieselbe Rechnung wie stufe() in der App: vier Monate je Stufe,
-- hoechstens zwoelf.
create or replace function public.moji_stufe(d jsonb)
returns smallint
language sql
immutable
as $$
  select least(12, (
    coalesce((select count(*) from jsonb_object_keys(
      case when jsonb_typeof(d->'exp') = 'object' then d->'exp' else '{}'::jsonb end)), 0) / 4
  ) + 1)::smallint;
$$;


-- ─── 2 · Der Auslöser ─────────────────────────────────────────────
create or replace function public.mitglied_nachziehen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb := new.data::jsonb;
  vn text := btrim(coalesce(d->>'vorname', ''));
begin
  -- Wer noch keinen Namen hat, hat den Funnel nie beendet. Solche
  -- Zeilen gehoeren nicht in eine Namensliste.
  if vn = '' then
    return new;
  end if;

  insert into public.mitglieder (user_id, vorname, kuerzel, avatar, filiale, stufe, zuletzt)
  values (
    new.user_id,
    vn,
    upper(left(btrim(coalesce(d->>'nachname', '')), 1)),
    coalesce(nullif(d->>'avatar', '')::smallint, 1),
    btrim(coalesce(d->>'filiale', '')),
    public.moji_stufe(d),
    now()
  )
  on conflict (user_id) do update set
    vorname = excluded.vorname,
    kuerzel = excluded.kuerzel,
    avatar  = excluded.avatar,
    filiale = excluded.filiale,
    stufe   = excluded.stufe,
    zuletzt = greatest(public.mitglieder.zuletzt, excluded.zuletzt);
  return new;
end;
$$;

drop trigger if exists records_mitglied on public.records;
create trigger records_mitglied
  after insert or update on public.records
  for each row execute function public.mitglied_nachziehen();


-- ─── 3 · Der einmalige Nachzug ────────────────────────────────────
insert into public.mitglieder (user_id, vorname, kuerzel, avatar, filiale, stufe, zuletzt)
select
  r.user_id,
  btrim(r.data::jsonb->>'vorname'),
  upper(left(btrim(coalesce(r.data::jsonb->>'nachname', '')), 1)),
  coalesce(nullif(r.data::jsonb->>'avatar', '')::smallint, 1),
  btrim(coalesce(r.data::jsonb->>'filiale', '')),
  public.moji_stufe(r.data::jsonb),
  coalesce(r.updated_at, now())
from public.records r
where btrim(coalesce(r.data::jsonb->>'vorname', '')) <> ''
on conflict (user_id) do update set
  vorname = excluded.vorname,
  kuerzel = excluded.kuerzel,
  avatar  = excluded.avatar,
  stufe   = excluded.stufe;


-- ─── 4 · Der Nachzug prueft sich selbst ───────────────────────────
-- Ohne das waere ein leeres Ergebnis nicht von einem gelungenen zu
-- unterscheiden — und genau solche stillen Fehlschlaege haben in
-- diesem Projekt schon Zeit gekostet.
do $$
declare
  n_rec int;
  n_mit int;
begin
  select count(*) into n_rec from public.records
    where btrim(coalesce(data::jsonb->>'vorname', '')) <> '';
  select count(*) into n_mit from public.mitglieder;
  raise notice 'MOJI: % Profile mit Namen, % Zeilen in mitglieder', n_rec, n_mit;
  if n_rec > 0 and n_mit < n_rec then
    raise exception 'Nachzug unvollstaendig: % von % Profilen angekommen', n_mit, n_rec;
  end if;
end;
$$;
