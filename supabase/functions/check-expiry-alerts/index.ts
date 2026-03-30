// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function — Expiry Alert Sender
// Checks all users' docs and sends email + WhatsApp for expiring ones
//
// DEPLOY:  supabase functions deploy check-expiry-alerts
//
// SCHEDULE (run daily at 9am UTC):
//   In Supabase Dashboard → Database → Extensions → enable pg_cron
//   Then run in SQL Editor:
//
//   SELECT cron.schedule(
//     'daily-expiry-check',
//     '0 9 * * *',
//     $$
//       SELECT net.http_post(
//         url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-expiry-alerts',
//         headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//       );
//     $$
//   );
//
// ENV VARS needed in Supabase Dashboard → Settings → Edge Functions:
//   RESEND_API_KEY      — from resend.com (free tier: 3000 emails/month)
//   TWILIO_SID          — from twilio.com console
//   TWILIO_TOKEN        — from twilio.com console  
//   TWILIO_WHATSAPP_FROM — e.g. whatsapp:+14155238886 (Twilio sandbox number)
//   FROM_EMAIL          — e.g. alerts@yourdomain.com
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALERT_WINDOWS = [180, 90, 60, 30, 14, 7, 1]; // days before expiry

function daysUntil(dateStr: string): number {
  const expiry = new Date(dateStr);
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLabel(days: number): string {
  if (days < 0)   return '🔴 EXPIRED';
  if (days <= 7)  return '🔴 CRITICAL';
  if (days <= 30) return '🟡 URGENT';
  if (days <= 90) return '🟢 UPCOMING';
  return '✅ ACTIVE';
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return { ok: false, error: 'No RESEND_API_KEY' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('FROM_EMAIL') ?? 'noreply@statusvault.app',
      to, subject, html,
    }),
  });
  return { ok: res.ok, status: res.status };
}

async function sendWhatsApp(to: string, body: string) {
  const sid   = Deno.env.get('TWILIO_SID');
  const token = Deno.env.get('TWILIO_TOKEN');
  const from  = Deno.env.get('TWILIO_WHATSAPP_FROM') ?? 'whatsapp:+14155238886';
  if (!sid || !token) return { ok: false, error: 'No Twilio credentials' };
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${sid}:${token}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: from,
        To: `whatsapp:${to}`,
        Body: body,
      }).toString(),
    }
  );
  return { ok: res.ok, status: res.status };
}

function buildEmailHtml(docs: any[], userEmail: string): string {
  const rows = docs.map(d => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #E5E7EB;">
        <strong style="color:#111827">${d.icon} ${d.label}</strong>
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #E5E7EB;color:#6B7280;">${d.expiryDate}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #E5E7EB;">
        <span style="background:${d.days <= 30 ? '#FEE2E2' : '#FEF3C7'};color:${d.days <= 30 ? '#991B1B' : '#92400E'};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">
          ${d.days < 0 ? 'EXPIRED' : `${d.days}d left`}
        </span>
      </td>
    </tr>
  `).join('');

  return `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#F4F6FA;padding:24px;">
      <div style="background:#0A1628;border-radius:16px;padding:24px;text-align:center;margin-bottom:20px;">
        <h1 style="color:#fff;font-size:22px;margin:0 0 6px;">StatusVault</h1>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">Immigration Document Tracker</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #E5E7EB;">
        <h2 style="color:#111827;font-size:17px;margin:0 0 16px;">⏰ Document Expiry Alert</h2>
        <p style="color:#374151;font-size:14px;margin:0 0 16px;">The following documents require your attention:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr style="background:#F9FAFB;">
              <th style="text-align:left;padding:8px 16px;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Document</th>
              <th style="text-align:left;padding:8px 16px;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Expiry</th>
              <th style="text-align:left;padding:8px 16px;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <a href="https://kkbcori.github.io/statusvault-web"
           style="display:block;background:#0099A8;color:#fff;text-align:center;padding:13px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
          View & Update Documents →
        </a>
      </div>
      <p style="color:#9CA3AF;font-size:11px;text-align:center;margin-top:16px;">
        Sent to ${userEmail} · 
        <a href="https://kkbcori.github.io/statusvault-web" style="color:#9CA3AF;">Manage alerts</a>
      </p>
    </div>
  `;
}

function buildWhatsAppMessage(docs: any[]): string {
  const lines = docs.map(d =>
    `${d.icon} *${d.label}*\n  Expires: ${d.expiryDate} (${d.days < 0 ? 'EXPIRED' : d.days + 'd left'})`
  ).join('\n\n');
  return `⏰ *StatusVault Alert*\n\nYour immigration documents need attention:\n\n${lines}\n\n👉 Update at: https://kkbcori.github.io/statusvault-web`;
}

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: rows, error } = await supabase
    .from('user_data')
    .select('user_id, data_encrypted, updated_at');

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let emailsSent = 0, whatsappSent = 0, usersChecked = 0;

  for (const row of rows ?? []) {
    try {
      // Get auth user for email
      const { data: { user } } = await supabase.auth.admin.getUserById(row.user_id);
      if (!user) continue;

      usersChecked++;

      // NOTE: Data is AES-256 encrypted — we cannot decrypt server-side
      // Instead, we rely on a separate 'user_alerts' table that the client
      // writes notification preferences to (unencrypted contact info only)
      // For now, check if user_alerts table has contact info
      const { data: alertPrefs } = await supabase
        .from('user_alerts')
        .select('notification_email, whatsapp_phone, expiring_docs')
        .eq('user_id', row.user_id)
        .single();

      if (!alertPrefs) continue;

      const { notification_email, whatsapp_phone, expiring_docs } = alertPrefs;
      if (!notification_email && !whatsapp_phone) continue;
      if (!expiring_docs || expiring_docs.length === 0) continue;

      // Filter docs that are at an alert window
      const alertDocs = (expiring_docs as any[]).filter(d => {
        const days = daysUntil(d.expiryDate);
        return ALERT_WINDOWS.includes(days) || days < 0;
      });

      if (alertDocs.length === 0) continue;

      const docsWithDays = alertDocs.map(d => ({ ...d, days: daysUntil(d.expiryDate) }));

      // Send email
      if (notification_email) {
        const subject = `⏰ ${alertDocs.length} document${alertDocs.length > 1 ? 's' : ''} expiring — StatusVault`;
        const result = await sendEmail(notification_email, subject, buildEmailHtml(docsWithDays, notification_email));
        if (result.ok) emailsSent++;
      }

      // Send WhatsApp
      if (whatsapp_phone) {
        const result = await sendWhatsApp(whatsapp_phone, buildWhatsAppMessage(docsWithDays));
        if (result.ok) whatsappSent++;
      }

    } catch (e) {
      console.error('Error processing user:', row.user_id, e);
    }
  }

  return new Response(JSON.stringify({
    success: true, usersChecked, emailsSent, whatsappSent,
    timestamp: new Date().toISOString(),
  }), { headers: { 'Content-Type': 'application/json' } });
});
