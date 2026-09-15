-- ══════════════════════════════════════════════════════════════════
-- MOJI · Team: die Leseregel war in sich selbst verschraubt
--
-- Die erste Fassung lautete:
--   using (firma = (select m.firma from public.mitglieder m
--                   where m.user_id = auth.uid()))
--
-- Die Unterabfrage liest wieder aus mitglieder — und wird dabei selbst
-- von genau dieser Regel geprueft. Postgres dreht sich im Kreis: je
-- nach Fall kommt "infinite recursion detected in policy" oder schlicht
-- nichts zurueck. Sichtbar war das als "Noch niemand sonst da" —
-- nicht einmal die eigene Zeile kam durch.
--
-- Die Loesung ist eine Funktion mit security definer: sie liest die
-- eigene Firma an der Regel vorbei, gibt aber nur diesen einen Wert
-- heraus. Und die eigene Zeile darf man ohnehin immer sehen, damit ein
-- frisches Konto sich selbst findet, bevor sonst jemand da ist.
-- ══════════════════════════════════════════════════════════════════

create or replace function public.meine_firma()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select firma from public.mitglieder where user_id = auth.uid();
$$;

revoke all on function public.meine_firma() from public, anon;
grant execute on function public.meine_firma() to authenticated;

drop policy if exists mitglieder_lesen on public.mitglieder;
create policy mitglieder_lesen on public.mitglieder
  for select to authenticated
  using (
    user_id = auth.uid()                 -- sich selbst immer
    or firma = public.meine_firma()      -- und alle in derselben Firma
  );
