-- ══════════════════════════════════════════════════════════════════
-- MOJI · Team: Rechte nachziehen
--
-- An der laufenden Datenbank nachgemessen: die Rolle "anon" — also
-- jeder, der den oeffentlichen Schluessel aus index.html hat — durfte
-- tee_senden() und moji_gesehen() aufrufen. Beide haben zwar selbst
-- geprueft, ob jemand angemeldet ist (tee_senden wirft "nicht
-- angemeldet", moji_gesehen aendert null Zeilen), aber eine Funktion,
-- die niemand ohne Konto aufrufen koennen soll, sollte gar nicht erst
-- ausfuehrbar sein.
--
-- Der Grund: "revoke ... from public" nimmt nur die Sammelberechtigung
-- weg. Supabase legt fuer neue Funktionen im Schema public zusaetzlich
-- ein direktes Recht fuer anon und authenticated an — das bleibt dabei
-- stehen und muss eigens entzogen werden.
-- ══════════════════════════════════════════════════════════════════

revoke all on function public.tee_senden(uuid)   from anon;
revoke all on function public.moji_gesehen()     from anon;
revoke all on function public.tee_level(integer) from anon;

-- Dasselbe fuer die Tabellen. Die Regeln (RLS) gelten nur fuer
-- Angemeldete, anon saehe also ohnehin nichts — aber ein Recht, das
-- niemand braucht, gehoert nicht vergeben.
revoke all on table public.mitglieder from anon;
revoke all on table public.tee        from anon;

-- Und sicherstellen, dass die Angemeldeten haben, was sie brauchen.
grant execute on function public.tee_senden(uuid)   to authenticated;
grant execute on function public.moji_gesehen()     to authenticated;
grant execute on function public.tee_level(integer) to authenticated;
grant select on table public.mitglieder to authenticated;
grant insert, update on table public.mitglieder to authenticated;
grant select on table public.tee to authenticated;
