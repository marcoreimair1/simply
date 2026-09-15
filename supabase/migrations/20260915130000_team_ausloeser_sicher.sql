-- ══════════════════════════════════════════════════════════════════
-- MOJI · Der Auslöser darf das Sichern nie verhindern
--
-- mitglied_nachziehen() haengt an jedem Schreibvorgang auf records.
-- Wirft die Funktion, faellt die ganze Transaktion — und dann kann
-- jemand seine Arbeitszeit nicht mehr speichern, weil eine Namensliste
-- klemmt. Das waere die falsche Reihenfolge: die Aufzeichnung ist der
-- Zweck der App, das Team ist Beiwerk.
--
-- Darum faengt die Funktion jetzt alles ab und laesst das Sichern
-- weiterlaufen. Sichtbar bleibt es als Warnung im Protokoll.
-- ══════════════════════════════════════════════════════════════════

create or replace function public.mitglied_nachziehen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb;
  vn text;
begin
  begin
    d := new.data::jsonb;
    vn := btrim(coalesce(d->>'vorname', ''));

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
  exception when others then
    -- Niemals das Sichern aufhalten.
    raise warning 'mitglied_nachziehen: %', sqlerrm;
  end;
  return new;
end;
$$;
