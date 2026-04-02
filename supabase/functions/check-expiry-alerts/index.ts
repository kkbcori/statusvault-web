// ═══════════════════════════════════════════════════════════════
// StatusVault — Expiry Alert Edge Function
// Alert windows: 180d · 90d · 30d · 15d · 7d before expiry
// Sends: Email (Resend) + WhatsApp (Twilio) + SMS (Twilio)
//
// DEPLOY:  supabase functions deploy check-expiry-alerts
//
// SCHEDULE — run once daily in Supabase SQL Editor:
//   SELECT cron.schedule(
//     'daily-expiry-alerts', '0 9 * * *',
//     $$ SELECT net.http_post(
//       url := 'https://gekhrdqkaadqeeebzvlu.supabase.co/functions/v1/check-expiry-alerts',
//       headers := '{"Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//     ); $$
//   );
//
// REQUIRED SECRETS (Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY           from resend.com
//   FROM_EMAIL               e.g. alerts@yourdomain.com (or onboarding@resend.dev for test)
//   TWILIO_SID               from console.twilio.com
//   TWILIO_TOKEN             from console.twilio.com
//   TWILIO_WHATSAPP_FROM     e.g. whatsapp:+14155238886 (Twilio sandbox)
//   TWILIO_SMS_FROM          e.g. +15005550006 (Twilio test) or your purchased number
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Alert windows in days — matches the user's spec
const ALERT_WINDOWS = [180, 90, 30, 15, 7];

function daysUntil(dateStr: string): number {
  const expiry = new Date(dateStr);
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyLabel(days: number): string {
  if (days < 0)    return '🔴 EXPIRED';
  if (days <= 7)   return '🔴 CRITICAL — Act Now';
  if (days <= 15)  return '🔴 URGENT';
  if (days <= 30)  return '🟡 30 Days Left';
  if (days <= 90)  return '🟠 3 Months Left';
  return '🟢 6 Months Left';
}

function urgencyColor(days: number): string {
  if (days <= 15) return '#DC2626';
  if (days <= 30) return '#D97706';
  if (days <= 90) return '#EA580C';
  return '#059669';
}

// ── Email via Resend ──────────────────────────────────────────
async function sendEmail(to: string, docs: any[]): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev';
  if (!key) return false;

  const criticalCount = docs.filter(d => d.days <= 30).length;
  const subject = criticalCount > 0
    ? `🔴 ${criticalCount} document${criticalCount > 1 ? 's' : ''} expiring soon — StatusVault`
    : `⏰ Immigration document expiry reminder — StatusVault`;

  const rows = docs.map(d => `
    <tr>
      <td style="padding:12px 20px;border-bottom:1px solid #F3F4F6;">
        <div style="font-weight:600;color:#111827;font-size:14px;">${d.icon} ${d.label}</div>
        <div style="font-size:12px;color:#6B7280;margin-top:2px;">Expires ${d.expiryDate}</div>
      </td>
      <td style="padding:12px 20px;border-bottom:1px solid #F3F4F6;text-align:right;white-space:nowrap;">
        <span style="background:${urgencyColor(d.days)}18;color:${urgencyColor(d.days)};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">
          ${d.days < 0 ? 'EXPIRED' : d.days === 0 ? 'TODAY' : `${d.days} days`}
        </span>
      </td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F5FA;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#2F3349;padding:28px 32px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">StatusVault</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">Immigration Document Tracker</div>
          </td>
        </tr>
        <!-- Alert banner -->
        <tr>
          <td style="background:${criticalCount > 0 ? '#FEF2F2' : '#FEF3C7'};padding:16px 32px;border-bottom:1px solid ${criticalCount > 0 ? '#FECACA' : '#FDE68A'};">
            <div style="font-size:15px;font-weight:700;color:${criticalCount > 0 ? '#991B1B' : '#92400E'};">
              ${criticalCount > 0 ? '⚠️ Action Required' : '⏰ Upcoming Expiry Reminder'}
            </div>
            <div style="font-size:13px;color:${criticalCount > 0 ? '#B91C1C' : '#B45309'};margin-top:4px;">
              ${docs.length} document${docs.length > 1 ? 's' : ''} require${docs.length === 1 ? 's' : ''} your attention
            </div>
          </td>
        </tr>
        <!-- Document table -->
        <tr>
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr style="background:#F9FAFB;">
                <th style="text-align:left;padding:10px 20px;font-size:11px;font-weight:600;color:#6B7280;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #E5E7EB;">Document</th>
                <th style="text-align:right;padding:10px 20px;font-size:11px;font-weight:600;color:#6B7280;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid #E5E7EB;">Time Left</th>
              </tr>
              ${rows}
            </table>
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding:28px 32px;text-align:center;">
            <a href="https://kkbcori.github.io/statusvault-web"
               style="display:inline-block;background:#7367F0;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;">
              View & Update Documents →
            </a>
            <div style="font-size:12px;color:#9CA3AF;margin-top:16px;line-height:1.6;">
              Renew your documents before expiry to avoid visa complications.<br>
              Always verify renewal requirements with official USCIS and embassy sources.
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #F3F4F6;text-align:center;">
            <div style="font-size:11px;color:#9CA3AF;">
              StatusVault · AES-256 encrypted · 
              <a href="https://kkbcori.github.io/statusvault-web" style="color:#9CA3AF;text-decoration:none;">Manage alerts</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Email error:', err);
    return false;
  }
  return true;
}

// ── WhatsApp via Twilio ───────────────────────────────────────
async function sendWhatsApp(to: string, docs: any[]): Promise<boolean> {
  return sendTwilioMessage(`whatsapp:${to}`, docs, Deno.env.get('TWILIO_WHATSAPP_FROM') ?? '');
}

// ── SMS via Twilio ────────────────────────────────────────────
async function sendSMS(to: string, docs: any[]): Promise<boolean> {
  const smsFrom = Deno.env.get('TWILIO_SMS_FROM');
  if (!smsFrom) return false;
  return sendTwilioMessage(to, docs, smsFrom);
}

async function sendTwilioMessage(to: string, docs: any[], from: string): Promise<boolean> {
  const sid   = Deno.env.get('TWILIO_SID');
  const token = Deno.env.get('TWILIO_TOKEN');
  if (!sid || !token || !from) return false;

  const docLines = docs.map(d =>
    `${d.icon} *${d.label}*\n   Expires: ${d.expiryDate} · ${d.days < 0 ? 'EXPIRED' : d.days === 0 ? 'TODAY' : `${d.days} days left`}`
  ).join('\n\n');

  const body = `⏰ *StatusVault Alert*\n\n${docs.length} document${docs.length > 1 ? 's' : ''} need your attention:\n\n${docLines}\n\n👉 https://kkbcori.github.io/statusvault-web`;

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${sid}:${token}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Twilio error:', err);
    return false;
  }
  return true;
}

// ── Main handler ──────────────────────────────────────────────
serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: rows, error } = await supabase
    .from('user_alerts')
    .select('user_id, notification_email, whatsapp_phone, expiring_docs');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let emailsSent = 0, whatsappSent = 0, smsSent = 0, usersChecked = 0;

  for (const row of rows ?? []) {
    usersChecked++;
    const { notification_email, whatsapp_phone, expiring_docs } = row;

    if (!notification_email && !whatsapp_phone) continue;
    if (!expiring_docs || expiring_docs.length === 0) continue;

    // Find docs that are exactly at an alert window today
    const alertDocs = (expiring_docs as any[])
      .map(d => ({ ...d, days: daysUntil(d.expiryDate) }))
      .filter(d => ALERT_WINDOWS.includes(d.days) || d.days < 0);

    if (alertDocs.length === 0) continue;

    console.log(`User ${row.user_id}: ${alertDocs.length} docs at alert window`);

    // Send email
    if (notification_email) {
      const ok = await sendEmail(notification_email, alertDocs);
      if (ok) emailsSent++;
    }

    // Send WhatsApp
    if (whatsapp_phone) {
      const ok = await sendWhatsApp(whatsapp_phone, alertDocs);
      if (ok) whatsappSent++;
      // Also send SMS to same number
      const smsOk = await sendSMS(whatsapp_phone, alertDocs);
      if (smsOk) smsSent++;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    usersChecked,
    emailsSent,
    whatsappSent,
    smsSent,
    alertWindows: ALERT_WINDOWS,
    timestamp: new Date().toISOString(),
  }), { headers: { 'Content-Type': 'application/json' } });
});
