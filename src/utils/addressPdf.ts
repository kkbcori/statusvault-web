// ═══════════════════════════════════════════════════════════════
// StatusVault — I-485 Address History PDF Generator
// Part 3: Address History for Green Card Application
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import { AddressEntry } from '../types';

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'present') return 'Present';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function calcDuration(from: string, to: string): string {
  const start = new Date(from + 'T00:00:00');
  const end   = to === 'present' ? new Date() : new Date(to + 'T00:00:00');
  const days  = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (days < 31)  return `${days} days`;
  if (days < 365) return `${Math.round(days/30)} months`;
  const yrs = Math.floor(days/365);
  const mos = Math.round((days % 365) / 30);
  return mos > 0 ? `${yrs} yr${yrs>1?'s':''} ${mos} mo${mos>1?'s':''}` : `${yrs} yr${yrs>1?'s':''}`;
}

function buildAddressRows(entries: AddressEntry[]): string {
  if (entries.length === 0) {
    return `<tr><td colspan="5" style="text-align:center;color:#0F172A;padding:20px;font-style:italic;">No addresses recorded</td></tr>`;
  }
  return entries.map((e, i) => {
    const bg = i % 2 === 0 ? '#F8F7F2' : '#FFFFFF';
    const isCurrent = e.isCurrentAddress || e.dateTo === 'present';
    const fullAddr = [e.street, e.apt, e.city, e.state, e.zipCode, e.country].filter(Boolean).join(', ');
    return `
      <tr style="background:${bg}">
        <td style="padding:9px 12px;color:#0F172A;font-size:11px;width:28px;">${i+1}</td>
        <td style="padding:9px 12px;font-weight:600;color:#0F172A;">${fullAddr}${isCurrent ? ' <span style="background:#ECFDF5;color:#059669;font-size:9px;font-weight:700;padding:2px 7px;border-radius:12px;margin-left:6px;">CURRENT</span>' : ''}</td>
        <td style="padding:9px 12px;color:#0F172A;">${formatDate(e.dateFrom)}</td>
        <td style="padding:9px 12px;color:#0F172A;">${formatDate(e.dateTo)}</td>
        <td style="padding:9px 12px;color:#0F172A;">${calcDuration(e.dateFrom, e.dateTo)}</td>
      </tr>`;
  }).join('');
}

export function generateAddressHtml(entries: AddressEntry[]): string {
  const sorted  = [...entries].sort((a, b) => {
    if (a.isCurrentAddress) return -1;
    if (b.isCurrentAddress) return 1;
    return b.dateFrom.localeCompare(a.dateFrom);
  });
  const genDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const currentAddr = sorted.find(e => e.isCurrentAddress || e.dateTo === 'present');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  /* Remove browser print header/footer (date, URL) */
  @page { size: A4; margin: 0; }
  /* Force background colors/gradients to print */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#0F172A;background:#fff;}
  .page{padding:20mm 18mm;max-width:100%;}
  .hdr{background:linear-gradient(135deg,#0A1628 0%,#1B3A65 100%);border-radius:10px;padding:26px 28px;margin-bottom:24px;position:relative;overflow:hidden;}
  .hdr-trim{position:absolute;top:0;left:0;right:0;height:3px;background:#C9A351;}
  .hdr-ttl{font-size:22px;font-weight:900;color:#fff;margin-bottom:3px;letter-spacing:-0.3px;}
  .hdr-sub{font-size:11px;color:rgba(255,255,255,0.7);}
  .hdr-meta{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:10px;color:rgba(255,255,255,0.6);}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px;}
  .stat{background:#F8F7F2;border:1px solid #E2E8F0;border-radius:8px;padding:14px;text-align:center;}
  .stat-n{font-size:24px;font-weight:900;color:#0F172A;letter-spacing:-1px;}
  .stat-l{font-size:9px;font-weight:700;color:#0F172A;text-transform:uppercase;letter-spacing:0.5px;margin-top:3px;}
  .stat-p{font-size:9px;color:#0F172A;font-weight:600;margin-top:2px;}
  .alert-box{border-radius:7px;padding:10px 14px;margin-bottom:20px;font-size:11px;line-height:18px;}
  .alert-info{background:#EFF6FF;border:1px solid #BFDBFE;color:#0F172A;}
  .alert-warn{background:#FEF3C7;border:1px solid #F59E0B;color:#0F172A;}
  .sec-ttl{font-size:11px;font-weight:800;color:#0F172A;text-transform:uppercase;letter-spacing:1.2px;padding-bottom:8px;border-bottom:2px solid #C9A351;margin-bottom:14px;}
  .sec-badge{background:#C9A351;color:#0A1628;font-size:8px;font-weight:800;padding:2px 8px;border-radius:20px;letter-spacing:0.3px;margin-left:8px;}
  .current-box{background:#F0FDF4;border:1px solid #86EFAC;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:11px;line-height:18px;}
  .current-label{font-size:9px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;}
  .current-addr{font-weight:700;color:#0F172A;font-size:13px;}
  table{width:100%;border-collapse:collapse;margin-bottom:28px;font-size:12px;}
  thead tr{background:#0A1628;}
  th{padding:9px 12px;color:#C9A351;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.8px;text-align:left;}
  td{border-bottom:1px solid #F1F5F9;color:#0F172A;}
  .footer{margin-top:28px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:10px;color:#0F172A;line-height:17px;}
  .footer strong{color:#0F172A;}
</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="hdr-trim"></div>
    <div class="hdr-ttl">Address History Report</div>
    <div class="hdr-sub">Prepared for I-485 Green Card Application — Part 3 (Address History)</div>
    <div class="hdr-meta">Generated: ${genDate} &nbsp;|&nbsp; For reference only — verify all information before submission</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-n">${sorted.length}</div><div class="stat-l">Addresses</div><div class="stat-p">Total recorded</div></div>
    <div class="stat"><div class="stat-n">${sorted.filter(e => e.country === 'United States' || e.country === 'US' || e.country === 'USA').length}</div><div class="stat-l">US Addresses</div><div class="stat-p">Recorded</div></div>
    <div class="stat"><div class="stat-n">${sorted.filter(e => e.country !== 'United States' && e.country !== 'US' && e.country !== 'USA').length}</div><div class="stat-l">Foreign Addresses</div><div class="stat-p">Recorded</div></div>
  </div>

  ${currentAddr ? `
  <div class="current-box">
    <div class="current-label">✓ Current Address</div>
    <div class="current-addr">${[currentAddr.street, currentAddr.apt, currentAddr.city, currentAddr.state, currentAddr.zipCode, currentAddr.country].filter(Boolean).join(', ')}</div>
  </div>` : ''}

  <div class="alert-box alert-info">
    ℹ️ <strong>I-485 Part 3 Reference:</strong> List all addresses where you have lived for the past 5 years
    (or since birth if less than 5 years). Start with your current address and work backwards.
    Include all US and foreign addresses. Do not include P.O. Boxes.
  </div>

  ${sorted.length < 1 ? `<div class="alert-box alert-warn">⚠️ No addresses recorded. Add at least your current address for I-485 filing.</div>` : ''}

  <div class="sec-ttl">Complete Address History <span class="sec-badge">I-485 PART 3</span></div>
  <table>
    <thead><tr>
      <th>#</th>
      <th>Full Address</th>
      <th>Date From</th>
      <th>Date To</th>
      <th>Duration</th>
    </tr></thead>
    <tbody>
      ${buildAddressRows(sorted)}
    </tbody>
  </table>

  <div class="footer">
    <strong>StatusVault</strong> · statusvault.org · 100% private — data stored on your device only<br><br>
    <strong>⚠️ Disclaimer:</strong> This report is generated by StatusVault for personal record-keeping only.
    It is <strong>not</strong> an official government document. This information must be independently verified
    before submitting Form I-485 to USCIS. Always consult a licensed immigration attorney for green card application advice.<br><br>
    <strong>I-485 Instructions:</strong> You must disclose all addresses for the past 5 years.
    Failure to disclose all addresses may be considered misrepresentation and could affect your application.
  </div>

</div>
</body>
</html>`;
}

export async function exportAddressPdf(entries: AddressEntry[]): Promise<void> {
  const html = generateAddressHtml(entries);

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
      dialogTitle: 'Export Address History — I-485',
      UTI: 'com.adobe.pdf',
    });
  }
}
