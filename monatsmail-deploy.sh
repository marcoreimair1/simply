#!/bin/bash
# MOJI · Monats-Erinnerung veröffentlichen
#
# Kopiert monatsmail.ts an die Stelle, an der die Supabase-CLI sie erwartet,
# und schickt sie ins Projekt. Quelle bleibt immer monatsmail.ts im
# Wurzelverzeichnis — die Kopie unter supabase/functions/ ist Wegwerfware.
#
# Voraussetzung, einmalig:
#   npx supabase login
set -e
cd "$(dirname "$0")"

mkdir -p supabase/functions/monatsmail
cp monatsmail.ts supabase/functions/monatsmail/index.ts

npx supabase functions deploy monatsmail --project-ref kzduwbmiytusvlbotrrr

echo
echo "Fertig. Testen: Dashboard → Edge Functions → monatsmail → Test,"
echo "Header 'Authorization: Bearer <service_role>'. Antwort 200 mit Bericht = gut."
