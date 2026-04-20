// ═══════════════════════════════════════════════════════════════
// StatusVault — Travel PDF Generator
// Produces N-400-aligned HTML for expo-print export
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import { TravelTrip } from '../types';
import {
  getTripDays, getTotalDaysAbroad, filterLast5Years,
  sortByDateDesc, formatDateFull,
} from './travel';

// ─── Table Row Builder ────────────────────────────────────────
function buildRows(trips: TravelTrip[]): string {
  if (trips.length === 0) {
    return `<tr><td colspan="5" style="text-align:center;color:#0F172A;padding:20px 12px;font-style:italic;">No trips recorded in this period</td></tr>`;
  }
  return trips.map((trip, i) => {
    const days = getTripDays(trip);
    const isLong = days >= 180;
    const bg = i % 2 === 0 ? '#F8F7F2' : '#FFFFFF';
    return `
      <tr style="background:${bg};">
        <td style="padding:9px 12px;color:#0F172A;font-size:11px;width:32px;">${i + 1}</td>
        <td style="padding:9px 12px;font-weight:600;color:#0F172A;">${formatDateFull(trip.departureDate)}</td>
        <td style="padding:9px 12px;font-weight:600;color:#0F172A;">${formatDateFull(trip.returnDate)}</td>
        <td style="padding:9px 12px;color:#0F172A;">${trip.country}</td>
        <td style="padding:9px 12px;font-weight:800;color:#0F172A;">
          ${days} day${days !== 1 ? 's' : ''}${isLong ? ' &nbsp;<span style="background:#FEE2E2;color:#DC2626;font-size:9px;padding:1px 6px;border-radius:4px;font-weight:700;">LONG</span>' : ''}
        </td>
      </tr>`;
  }).join('');
}

function totalRow(label: string, days: number): string {
  return `
    <tr style="background:#0A1628;">
      <td colspan="4" style="padding:11px 12px;color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${label}</td>
      <td style="padding:11px 12px;color:#C9A351;font-size:16px;font-weight:900;letter-spacing:-0.5px;">${days} days</td>
    </tr>`;
}

// ─── HTML Template ────────────────────────────────────────────
export function generateTravelHtml(allTrips: TravelTrip[]): string {
  const sorted   = sortByDateDesc(allTrips);
  const last5    = sortByDateDesc(filterLast5Years(allTrips));
  const abroad5  = getTotalDaysAbroad(last5);
  const abroadAll = getTotalDaysAbroad(sorted);
  const inUS5    = Math.max(0, 5 * 365 - abroad5);
  const hasLong5 = last5.some((t) => getTripDays(t) >= 180);
  const genDate  = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  /* Remove browser print header/footer (date, URL) */
  @page { size: A4; margin: 0; }
  /* Force background colors/gradients to print */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#0F172A; background:#fff; }
  .page { padding:20mm 18mm; max-width:100%; }

  .hdr { background:linear-gradient(135deg,#0A1628 0%,#1B3A65 100%); border-radius:10px; padding:26px 28px; margin-bottom:24px; position:relative; overflow:hidden; }
  .hdr-trim { position:absolute; top:0; left:0; right:0; height:3px; background:#C9A351; }
  .hdr-ttl { font-size:22px; font-weight:900; color:#fff; margin-bottom:3px; letter-spacing:-0.3px; }
  .hdr-sub { font-size:11px; color:rgba(255,255,255,0.7); }
  .hdr-meta { margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.15); font-size:10px; color:rgba(255,255,255,0.6); }

  .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:22px; }
  .stat { background:#F8F7F2; border:1px solid #E2E8F0; border-radius:8px; padding:14px; text-align:center; }
  .stat-n { font-size:24px; font-weight:900; color:#0F172A; letter-spacing:-1px; }
  .stat-l { font-size:9px; font-weight:700; color:#0F172A; text-transform:uppercase; letter-spacing:0.5px; margin-top:3px; }
  .stat-p { font-size:9px; color:#0F172A; font-weight:600; margin-top:2px; }

  .alert-box { border-radius:7px; padding:10px 14px; margin-bottom:20px; font-size:11px; line-height:18px; }
  .alert-warn { background:#FEF3C7; border:1px solid #F59E0B; color:#0F172A; }
  .alert-info  { background:#EFF6FF; border:1px solid #BFDBFE; color:#0F172A; }

  .sec-ttl { font-size:11px; font-weight:800; color:#0F172A; text-transform:uppercase; letter-spacing:1.2px; padding-bottom:8px; border-bottom:2px solid #C9A351; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
  .sec-badge { background:#C9A351; color:#0A1628; font-size:8px; font-weight:800; padding:2px 8px; border-radius:20px; letter-spacing:0.3px; }

  table { width:100%; border-collapse:collapse; margin-bottom:28px; font-size:12px; }
  thead tr { background:#0A1628; }
  th { padding:9px 12px; color:#C9A351; font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:0.8px; text-align:left; }
  td { border-bottom:1px solid #F1F5F9; color:#0F172A; }

  .footer { margin-top:28px; padding-top:16px; border-top:1px solid #E2E8F0; font-size:10px; color:#0F172A; line-height:17px; }
  .footer strong { color:#0F172A; }
</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="hdr-trim"></div>
    <div class="hdr-ttl">Travel History Report</div>
    <div class="hdr-sub">Prepared for N-400 Naturalization Application — Part 8</div>
    <div class="hdr-meta">Generated: ${genDate} &nbsp;|&nbsp; Verify all records at i94.cbp.dhs.gov</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-n">${last5.length}</div><div class="stat-l">Trips</div><div class="stat-p">Last 5 Years</div></div>
    <div class="stat"><div class="stat-n">${abroad5}</div><div class="stat-l">Days Abroad</div><div class="stat-p">Last 5 Years</div></div>
    <div class="stat"><div class="stat-n">${inUS5}</div><div class="stat-l">Days in US</div><div class="stat-p">Last 5 Years (est.)</div></div>
    <div class="stat"><div class="stat-n">${sorted.length}</div><div class="stat-l">Total Trips</div><div class="stat-p">All Time</div></div>
  </div>

  ${hasLong5 ? `
  <div class="alert-box alert-warn">
    ⚠️ <strong>Long Absence Warning:</strong> At least one trip in the last 5 years exceeded 180 days.
    This may have disrupted your continuous residence period required for naturalization. Consult an immigration attorney before filing N-400.
  </div>` : ''}

  <div class="alert-box alert-info">
    ℹ️ <strong>N-400 Reference — Part 8:</strong> List all trips outside the US in the last 5 years (or since becoming a Permanent Resident,
    whichever is shorter). Include trips of any duration. Totals are estimates based on your StatusVault records only.
  </div>

  <!-- 5-Year Table -->
  <div class="sec-ttl">5-Year Travel History <span class="sec-badge">N-400 PART 8</span></div>
  <table>
    <thead><tr>
      <th>#</th><th>Departure Date</th><th>Return Date</th><th>Destination Country</th><th>Duration Outside US</th>
    </tr></thead>
    <tbody>
      ${buildRows(last5)}
      ${last5.length > 0 ? totalRow('Total Days Outside US — Last 5 Years', abroad5) : ''}
    </tbody>
  </table>

  <!-- All-Time Table -->
  <div class="sec-ttl">Complete Travel History <span class="sec-badge">ALL TIME</span></div>
  <table>
    <thead><tr>
      <th>#</th><th>Departure Date</th><th>Return Date</th><th>Destination Country</th><th>Duration Outside US</th>
    </tr></thead>
    <tbody>
      ${buildRows(sorted)}
      ${sorted.length > 0 ? totalRow('Total Days Outside US — All Time', abroadAll) : ''}
    </tbody>
  </table>

  <div class="footer">
    <strong>StatusVault</strong> · statusvault.org · 100% private — data stored on your device only<br><br>
    <strong>⚠️ Disclaimer:</strong> This report is generated by StatusVault for personal record-keeping only. It is not an official government document and must not be submitted to USCIS without independent verification against CBP I-94 records at <strong>i94.cbp.dhs.gov</strong>. Days-in-US figures are estimates. Always consult a licensed immigration attorney for naturalization advice.
  </div>

</div>
</body>
</html>`;
}

// ─── Export Entry Point ───────────────────────────────────────
export async function exportTravelPdf(trips: TravelTrip[]): Promise<void> {
  const html = generateTravelHtml(trips);

  if (Platform.OS === 'web') {
    const win = window.open('', '_blank');
    if (!win) {
      // Popup blocked — fallback: create a data URI link
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'statusvault-export.html';
      a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
    return;
  }

  let Print: any, Sharing: any;
  try {
    Print   = require('expo-print');
    Sharing = require('expo-sharing');
  } catch {
    console.warn('expo-print or expo-sharing not available');
    return;
  }
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Travel History — N-400',
      UTI: 'com.adobe.pdf',
    });
  }
}
