import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALERT_WINDOWS = [180, 90, 60, 30, 15, 7]; // must match app template alertDays

function daysUntil(dateStr: string): number {
  const expiry = new Date(dateStr);
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

serve(async (req) => {
  // ── 0. Verify caller is Supabase cron or authorised internal call ──
  const cronSecret = Deno.env.get('CRON_SECRET');
  const reqSecret  = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '');
  if (cronSecret && reqSecret !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const debug: any = { steps: [], errors: [] };

  // Support single-user immediate invocation (when app calls after doc add)
  let filterUserId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    filterUserId = body?.userId ?? null;
  } catch {}

  // ── 1. Check secrets ────────────────────────────────────────
  const RESEND_KEY   = Deno.env.get('RESEND_API_KEY');
  const FROM_EMAIL   = Deno.env.get('FROM_EMAIL');
  const TWILIO_SID   = Deno.env.get('TWILIO_SID');
  const TWILIO_TOKEN = Deno.env.get('TWILIO_TOKEN');
  const WA_FROM      = Deno.env.get('TWILIO_WHATSAPP_FROM');

  debug.secrets = {
    RESEND_API_KEY:   RESEND_KEY   ? `set (${RESEND_KEY.slice(0,8)}...)` : 'MISSING',
    FROM_EMAIL:       FROM_EMAIL   ?? 'MISSING',
    TWILIO_SID:       TWILIO_SID   ? `set (${TWILIO_SID.slice(0,8)}...)` : 'MISSING',
    TWILIO_TOKEN:     TWILIO_TOKEN ? 'set' : 'MISSING',
    TWILIO_WA_FROM:   WA_FROM      ?? 'MISSING',
  };
  debug.steps.push('secrets_checked');

  // ── 2. Read user_alerts ──────────────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  let query = supabase.from('user_alerts').select('user_id, notification_email, whatsapp_phone, expiring_docs');
  if (filterUserId) query = query.eq('user_id', filterUserId);
  const { data: rows, error: dbErr } = await query;

  if (dbErr) {
    debug.errors.push(`DB error: ${dbErr.message}`);
    return new Response(JSON.stringify({ success: false, debug }), { status: 500 });
  }

  debug.rowsFound = rows?.length ?? 0;
  debug.steps.push('db_read');

  let emailsSent = 0, whatsappSent = 0, smsSent = 0;

  for (const row of rows ?? []) {
    const rowDebug: any = {
      user_id: row.user_id.slice(0, 8) + '...',
      email:   row.notification_email,
      phone:   row.whatsapp_phone,
      docCount: (row.expiring_docs ?? []).length,
      docs: [],
    };

    // Show each doc and its days remaining
    for (const doc of row.expiring_docs ?? []) {
      const days = daysUntil(doc.expiryDate);
      rowDebug.docs.push({
        label: doc.label,
        expiryDate: doc.expiryDate,
        daysUntil: days,
        hitsWindow: ALERT_WINDOWS.includes(days),
      });
    }

    // Alert docs: exact window for scheduled runs, all <180d for immediate single-user invocations
    const isImmediate = filterUserId !== null;
    const alertDocs = (row.expiring_docs ?? [])
      .map((d: any) => ({ ...d, days: daysUntil(d.expiryDate) }))
      .filter((d: any) => isImmediate
        ? d.days <= 180   // immediate: send for any doc within 180 days
        : ALERT_WINDOWS.includes(d.days) || d.days < 0  // scheduled: exact windows only
      );

    rowDebug.alertDocsToday = alertDocs.length;

    // ── Send email ────────────────────────────────────────────
    if (row.notification_email && alertDocs.length > 0 && RESEND_KEY) {
      const body = {
        from: FROM_EMAIL ?? 'onboarding@resend.dev',
        to: row.notification_email,
        subject: `⏰ Document expiry alert — StatusVault`,
        html: `<h2>StatusVault Expiry Alert</h2>
          <p>${alertDocs.length} document(s) need your attention:</p>
          ${alertDocs.map((d: any) => `<p>• <b>${d.icon} ${d.label}</b> — expires ${d.expiryDate} (${d.days < 0 ? 'EXPIRED' : d.days + ' days left'})</p>`).join('')}
          <p><a href="https://www.statusvault.org">View in StatusVault →</a></p>`,
      };

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const resBody = await res.json();
        rowDebug.emailResult = { status: res.status, body: resBody };
        if (res.ok) emailsSent++;
        else rowDebug.emailError = resBody;
      } catch (e: any) {
        rowDebug.emailError = e.message;
        debug.errors.push(`Email exception: ${e.message}`);
      }
    } else {
      rowDebug.emailSkipped = !row.notification_email ? 'no_email' : !RESEND_KEY ? 'no_api_key' : 'no_alert_docs';
    }

    // ── Send WhatsApp ─────────────────────────────────────────
    if (row.whatsapp_phone && alertDocs.length > 0 && TWILIO_SID && TWILIO_TOKEN && WA_FROM) {
      const msgBody = `⏰ StatusVault Alert\n\n${alertDocs.map((d: any) => `• ${d.label}: expires ${d.expiryDate} (${d.days < 0 ? 'EXPIRED' : d.days + 'd left'})`).join('\n')}\n\nhttps://www.statusvault.org`;
      try {
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: WA_FROM, To: `whatsapp:${row.whatsapp_phone}`, Body: msgBody }).toString(),
        });
        const resBody = await res.json();
        rowDebug.whatsappResult = { status: res.status, body: resBody };
        if (res.ok) whatsappSent++;
        else rowDebug.whatsappError = resBody;
      } catch (e: any) {
        rowDebug.whatsappError = e.message;
      }
    } else {
      rowDebug.whatsappSkipped = !row.whatsapp_phone ? 'no_phone' : !TWILIO_SID ? 'no_twilio' : 'no_alert_docs';
    }

    debug.steps.push(rowDebug);
  }

  return new Response(JSON.stringify({
    success: true,
    usersChecked: rows?.length ?? 0,
    emailsSent,
    whatsappSent,
    smsSent,
    alertWindows: ALERT_WINDOWS,
    timestamp: new Date().toISOString(),
    debug,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } });
});
