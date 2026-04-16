// ═══════════════════════════════════════════════════════════════
// Supabase Edge Function — Document Expiry Reminder Emails
// Deploy: supabase functions deploy send-reminders
// Schedule: via Supabase Dashboard → Database → Extensions → pg_cron
//   SELECT cron.schedule('daily-reminders', '0 9 * * *', $$
//     SELECT net.http_post(
//       url := 'https://gekhrdqkaadqeeebzvlu.supabase.co/functions/v1/send-reminders',
//       headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
//     );
//   $$);
// ═══════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const REMINDER_WINDOWS = [180, 90, 60, 30, 15, 7]; // must match app template alertDays // days before expiry

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all user data
    const { data: rows, error } = await supabase
      .from('user_data')
      .select('user_id, data_encrypted, updated_at');

    if (error) throw error;

    const today = new Date();
    let emailsSent = 0;

    for (const row of rows ?? []) {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.admin.getUserById(row.user_id);
      if (!user?.email) continue;

      // Note: data is encrypted — we can't read documents server-side
      // Instead, we send a general reminder based on last sync date
      const lastSync = new Date(row.updated_at);
      const daysSinceSync = Math.floor((today.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));

      // Only email users who haven't opened app in 7+ days
      if (daysSinceSync < 7) continue;

      // Send reminder email via Resend (or any email provider)
      const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
      if (!RESEND_KEY) continue;

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'StatusVault <noreply@yourdomain.com>',
          to: user.email,
          subject: '⏰ Check your immigration document deadlines',
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #F4F6FA;">
              <div style="background: #0A1628; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
                <h1 style="color: #fff; font-size: 24px; margin: 0 0 8px;">StatusVault</h1>
                <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Immigration Document Tracker</p>
              </div>
              <div style="background: #fff; border-radius: 16px; padding: 28px; border: 1px solid #E5E7EB;">
                <h2 style="color: #111827; font-size: 18px; margin: 0 0 12px;">Don't miss a deadline ⚠️</h2>
                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                  You haven't checked your immigration documents in ${daysSinceSync} days. 
                  Missing a visa or permit expiry can have serious consequences.
                </p>
                <a href="https://www.statusvault.org" 
                   style="display: block; background: #0099A8; color: #fff; text-align: center; 
                          padding: 14px; border-radius: 10px; text-decoration: none; 
                          font-weight: 600; font-size: 15px;">
                  Check My Documents →
                </a>
              </div>
              <p style="color: #9CA3AF; font-size: 11px; text-align: center; margin-top: 20px;">
                StatusVault · AES-256 encrypted · 
                <a href="https://www.statusvault.org" style="color: #9CA3AF;">Unsubscribe</a>
              </p>
            </div>
          `,
        }),
      });

      if (emailRes.ok) emailsSent++;
    }

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
