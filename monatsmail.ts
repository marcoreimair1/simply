/* ══════════════════════════════════════════════════════════════
   MOJI · Monats-Erinnerung
   Läuft am Ersten jedes Monats und schreibt allen, die im Profil
   zugestimmt haben, eine kurze Mail: der Vormonat ist jetzt zum
   Abgeben frei.

   Wer keine Zustimmung gegeben hat, bekommt nichts.
   Wer den Monat schon exportiert hat, bekommt nichts.
   Wer die Mail für diesen Monat schon hat, bekommt nichts —
   dafür sorgt die Tabelle mail_log.

   Nötige Secrets in Supabase:
     RESEND_API_KEY      Schlüssel von resend.com
     MAIL_VON            Absender, z. B. "MOJI <hallo@moji-app.at>"
   Automatisch vorhanden:
     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
   ══════════════════════════════════════════════════════════════ */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MONATE = ['Jänner','Februar','März','April','Mai','Juni',
                'Juli','August','September','Oktober','November','Dezember'];
const LINK = 'https://moji-app.at/';

/* Der Monat, an den erinnert wird: der gerade abgeschlossene. */
function vormonat(heute: Date){
  const y = heute.getUTCFullYear(), m = heute.getUTCMonth();
  return m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 };
}

function betreff(name: string){
  return name + ' ist bereit zum Abgeben';
}

/* Kurze, warme Ansprache — kein Werbeton. */
function textFassung(vorname: string, monat: string){
  return 'Hallo ' + vorname + ',\n\n'
    + 'wir erinnern dich, dass ' + monat + ' jetzt zum Schreiben wäre.\n'
    + 'Ein Blick in MOJI, Export drücken, fertig.\n\n'
    + LINK + '\n\n'
    + 'Mehr Zeit fürs Wesentliche.\n'
    + 'Eine App von Studio MARU 丸\n\n'
    + '— Diese Erinnerung kommt einmal im Monat. Im Profilmenü der App '
    + 'kannst du sie jederzeit abschalten.';
}

function htmlFassung(vorname: string, monat: string){
  return `<!doctype html><html lang="de"><body style="margin:0;padding:0;background:#050d24;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050d24;padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#0b1533;border:1px solid rgba(255,255,255,.10);border-radius:22px;overflow:hidden;">
    <tr><td style="padding:30px 28px 6px;">
      <div style="font:700 13px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:.16em;color:#F7D774;text-transform:uppercase;">MOJI</div>
    </td></tr>
    <tr><td style="padding:14px 28px 0;">
      <div style="font:600 23px/1.28 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#F4F6FF;">
        Hallo ${vorname},
      </div>
      <div style="font:400 16px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#AEB8D8;padding-top:10px;">
        wir erinnern dich, dass <b style="color:#F4F6FF;font-weight:600;">${monat}</b> jetzt zum
        Schreiben wäre. Ein Blick in MOJI, Export drücken, fertig.
      </div>
    </td></tr>
    <tr><td style="padding:24px 28px 4px;">
      <a href="${LINK}" style="display:block;text-align:center;background:#F7D774;color:#0B1533;text-decoration:none;font:600 16px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:16px 20px;border-radius:16px;">
        ${monat} abgeben
      </a>
    </td></tr>
    <tr><td style="padding:22px 28px 28px;">
      <div style="height:1px;background:rgba(255,255,255,.09);margin-bottom:16px;"></div>
      <div style="font:400 12px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#7E89AD;">
        Mehr Zeit fürs Wesentliche. Eine App von Studio MARU 丸<br><br>
        Diese Erinnerung kommt einmal im Monat, weil du sie erlaubt hast.
        Im Profilmenü der App schaltest du sie jederzeit wieder ab.
      </div>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  /* Nur mit Service-Rolle oder Cron-Geheimnis aufrufbar. */
  const auth = req.headers.get('authorization') || '';
  const dienst = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if(!dienst || auth !== 'Bearer ' + dienst){
    return new Response('nein', { status: 401 });
  }

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, dienst);
  const key = Deno.env.get('RESEND_API_KEY');
  const von = Deno.env.get('MAIL_VON') || 'MOJI <hallo@moji-app.at>';
  if(!key) return new Response('RESEND_API_KEY fehlt', { status: 500 });

  const heute = new Date();
  const vm = vormonat(heute);
  const monat = MONATE[vm.m];                       /* "Juli" */
  const expKey = vm.y + '-' + vm.m;                 /* "2026-6" */
  const lauf = vm.y + '-' + String(vm.m + 1).padStart(2, '0'); /* "2026-07" */

  /* Alle Profile holen. Klein genug für einen Zug; bei Wachstum
     kommt hier ein Filter auf data->>'mailOk' dazu. */
  const { data: reihen, error } = await sb
    .from('records').select('user_id, data');
  if(error) return new Response(error.message, { status: 500 });

  const bericht = { gesendet: 0, uebersprungen: 0, fehler: [] as string[] };

  for(const r of (reihen || [])){
    const p = r.data || {};
    if(p.mailOk !== true){ bericht.uebersprungen++; continue; }
    if(p.exp && p.exp[expKey]){ bericht.uebersprungen++; continue; }

    /* Schon geschrieben? Der eindeutige Index in mail_log fängt
       Doppelläufe ohnehin ab, aber wir fragen vorher, um die
       Zustellung nicht unnötig anzustoßen. */
    const { data: alt } = await sb.from('mail_log')
      .select('user_id').eq('user_id', r.user_id).eq('lauf', lauf).maybeSingle();
    if(alt){ bericht.uebersprungen++; continue; }

    const { data: u } = await sb.auth.admin.getUserById(r.user_id);
    const mail = u && u.user && u.user.email;
    if(!mail){ bericht.uebersprungen++; continue; }

    const vorname = (p.vorname || '').trim() || 'du';

    try{
      const antwort = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: von, to: [mail],
          subject: betreff(monat),
          text: textFassung(vorname, monat),
          html: htmlFassung(vorname, monat)
        })
      });
      if(!antwort.ok) throw new Error(await antwort.text());
      await sb.from('mail_log').insert({ user_id: r.user_id, lauf: lauf, art: 'monat' });
      bericht.gesendet++;
    }catch(e){
      bericht.fehler.push(mail + ': ' + String(e));
    }
  }

  return new Response(JSON.stringify({ monat, lauf, ...bericht }, null, 2),
    { headers: { 'Content-Type': 'application/json' } });
});
