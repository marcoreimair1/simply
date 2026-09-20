-- ══════════════════════════════════════════════════════════════════
-- MOJI · Das Profilbild in der oeffentlichen Zeile stimmt wieder
--
-- Befund vom 20.09.2026: in der Firmenansicht stand bei acht Leuten ein
-- anderes Motiv als in ihrer eigenen App. Nachgesehen in den Daten —
-- bei genau diesen acht steht in records ueberhaupt keine Bildnummer.
--
-- Warum: wer sich nie eines aussucht, bekommt eines ZUGETEILT, gerechnet
-- aus Vorname und Geburtsdatum. Diese Zahl wurde bisher bei jedem
-- Zeichnen neu gerechnet und nirgends hinterlegt. Die Datenbank kann sie
-- nicht nachrechnen, also schrieb der Ausloeser in die oeffentliche
-- Zeile den Vorgabewert 1 — und ueberschrieb damit bei jedem Sichern
-- auch das, was die App selbst schon eingetragen hatte.
--
-- Zwei Haelften, eine Ursache:
--   * Die App hinterlegt die zugeteilte Zahl ab jetzt EINMAL im Profil
--     (normalize()), damit es ueberhaupt etwas nachzuziehen gibt.
--   * Der Ausloeser hier ueberschreibt das Bild nur noch dann, wenn in
--     records wirklich eine Nummer steht. Sonst laesst er stehen, was da
--     ist. Eine fehlende Angabe ist keine Angabe und darf keine werden.
-- ══════════════════════════════════════════════════════════════════

create or replace function public.mitglied_nachziehen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d  jsonb;
  vn text;
  av smallint;
begin
  begin
    d  := new.data::jsonb;
    vn := btrim(coalesce(d->>'vorname', ''));
    -- Ohne Namen kein Eintrag: wer den Funnel nie beendet hat, gehoert
    -- nicht in eine Namensliste.
    if vn = '' then
      return new;
    end if;

    -- Fehlt die Nummer, bleibt sie NULL — und unten stehen lassen statt
    -- ueberschreiben. Frueher stand hier coalesce(..., 1).
    av := nullif(d->>'avatar', '')::smallint;

    insert into public.mitglieder (user_id, vorname, kuerzel, avatar, filiale, stufe, zuletzt)
    values (
      new.user_id,
      vn,
      upper(left(btrim(coalesce(d->>'nachname', '')), 1)),
      coalesce(av, 1),              -- eine neue Zeile braucht irgendeinen Wert
      btrim(coalesce(d->>'filiale', '')),
      public.moji_stufe(d),
      now()
    )
    on conflict (user_id) do update set
      vorname = excluded.vorname,
      kuerzel = excluded.kuerzel,
      avatar  = coalesce(av, public.mitglieder.avatar),
      filiale = excluded.filiale,
      stufe   = excluded.stufe,
      zuletzt = greatest(public.mitglieder.zuletzt, excluded.zuletzt);
  exception when others then
    -- Der Ausloeser darf das Sichern der Arbeitszeit niemals blockieren.
    raise warning 'mitglied_nachziehen: %', sqlerrm;
  end;
  return new;
end;
$$;


-- ─── Einmalig angleichen, wo records eine Nummer traegt ───────────
update public.mitglieder m
   set avatar = nullif(r.data::jsonb->>'avatar','')::smallint
  from public.records r
 where r.user_id = m.user_id
   and nullif(r.data::jsonb->>'avatar','') is not null
   and nullif(r.data::jsonb->>'avatar','')::smallint is distinct from m.avatar;


-- ─── Und nachsehen, dass nichts mehr auseinanderlaeuft ────────────
-- Zeilen ohne Nummer in records sind kein Fehler: dort holt die App sie
-- beim naechsten Sichern nach.
do $$
declare rest int;
begin
  select count(*) into rest
    from public.mitglieder m
    join public.records r on r.user_id = m.user_id
   where nullif(r.data::jsonb->>'avatar','') is not null
     and nullif(r.data::jsonb->>'avatar','')::smallint is distinct from m.avatar;
  if rest > 0 then
    raise exception 'Abgleich unvollstaendig: % Zeilen weichen weiter ab', rest;
  end if;
end;
$$;
