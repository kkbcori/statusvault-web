// ═══════════════════════════════════════════════════════════════
// ScannerScreen — Document OCR via Claude Vision API
// Upload photo of visa/EAD/passport → auto-extract expiry date
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { IS_WEB } from '../utils/responsive';
import { useStore } from '../store';
import { DOCUMENT_TEMPLATES } from '../utils/templates';
import { UserDocument } from '../types';

interface ScanResult {
  documentType: string;
  expiryDate: string | null;
  documentNumber: string | null;
  name: string | null;
  confidence: string;
  notes: string;
}

export const ScannerScreen: React.FC = () => {
  const addDocument  = useStore((s) => s.addDocument);
  const [scanning,   setScanning]   = useState(false);
  const [result,     setResult]     = useState<ScanResult | null>(null);
  const [imageData,  setImageData]  = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleFileSelect = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      // Extract base64 data (remove data:image/xxx;base64, prefix)
      setImageData(dataUrl.split(',')[1]);
      setResult(null); setSaved(false); setError(null);
    };
    reader.readAsDataURL(file);
  };


  const handleScan = async () => { return; // DISABLED — scanner not yet production-ready
    if (!imageData) return;
    setScanning(true); setError(null);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: imageData },
              },
              {
                type: 'text',
                text: `You are an immigration document scanner. Extract information from this document image.

Return ONLY a JSON object with these fields (no other text, no markdown):
{
  "documentType": "type of document (e.g. H-1B Visa, OPT EAD Card, Passport, I-20, etc)",
  "expiryDate": "expiry date in YYYY-MM-DD format, or null if not found",
  "documentNumber": "document/receipt number if visible, or null",
  "name": "person's name if visible, or null",
  "confidence": "high/medium/low",
  "notes": "any important notes about the document"
}

If you cannot read the document clearly, still return the JSON with null values and low confidence.
Do not include any PII warnings or disclaimers — just the JSON.`,
              },
            ],
          }],
        }),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      // Strip markdown fences if present
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: ScanResult = JSON.parse(clean);
      setResult(parsed);
    } catch (e: any) {
      setError('Could not read document. Make sure the image is clear and try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveDoc = async () => { return; // DISABLED
    if (!result?.expiryDate) return;
    // Find best matching template
    const lower = result.documentType.toLowerCase();
    const templateId =
      lower.includes('h-1b') || lower.includes('h1b') ? 'h1b-visa' :
      lower.includes('opt') ? 'opt-ead' :
      lower.includes('stem') ? 'stem-opt' :
      lower.includes('passport') ? 'passport' :
      lower.includes('i-20') || lower.includes('i20') ? 'i20' :
      lower.includes('ead') ? 'general-ead' :
      lower.includes('green card') ? 'green-card' :
      lower.includes('h-4') || lower.includes('h4') ? 'h4-visa' :
      lower.includes('f-1') || lower.includes('f1') ? 'f1-visa' :
      'custom';

    const template = DOCUMENT_TEMPLATES.find((t) => t.id === templateId)
      ?? DOCUMENT_TEMPLATES.find((t) => t.id === 'custom')!;

    const doc: UserDocument = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      templateId: template.id,
      label: result.documentType || template.label,
      category: template.category,
      expiryDate: result.expiryDate,
      alertDays: template.alertDays,
      icon: template.icon,
      documentNumber: result.documentNumber ?? undefined,
      notes: [result.notes || '', 'Added via document scanner'].filter(Boolean).join(' · '),
      notificationIds: [],
      createdAt: new Date().toISOString(),
    };

    // Bug 21 fix: check return value — addDocument returns false if tier limit hit
    const saved = await addDocument(doc);
    if (saved) {
      setSaved(true);
    } else {
      setError('Document limit reached. Upgrade to Premium to add more documents.');
    }
  };

  // SCANNER DISABLED — API key cannot be in client bundle; needs edge function proxy
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, IS_WEB && styles.contentWeb]}
      showsVerticalScrollIndicator={true}
    >
      <View style={{ margin: 20, padding: 20, backgroundColor: 'rgba(245,192,83,0.12)', borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B', alignItems: 'center', gap: 10 } as any}>
        <Ionicons name="construct-outline" size={28} color="#D97706" />
        <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#F5C053', textAlign: 'center' }}>Scanner Coming Soon</Text>
        <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: '#CC9628', textAlign: 'center', lineHeight: 20 }}>
          Document scanning is being upgraded. In the meantime, add documents manually from the Documents tab.
        </Text>
      </View>
      {!IS_WEB && (
        <View style={styles.header}>
          <Text style={styles.headerEye}>AI-POWERED</Text>
          <Text style={styles.headerTitle}>Document Scanner</Text>
          <Text style={styles.headerSub}>Photo your visa or permit to auto-extract dates</Text>
        </View>
      )}
      {IS_WEB && (
        <View style={styles.webHero}>
          <Text style={styles.webTitle}>Document Scanner</Text>
          <Text style={styles.webSub}>Upload a photo of your visa, EAD, or passport — AI extracts the expiry date automatically</Text>
        </View>
      )}

      {/* Privacy note */}
      <View style={styles.privacyNote}>
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
        <Text style={styles.privacyText}>
          Images are sent to Claude AI for OCR only and are not stored. No data is retained after processing.
        </Text>
      </View>

      {/* Upload area */}
      <View style={styles.uploadCard}>
        {IS_WEB ? (
          <View style={styles.uploadArea}>
            {imagePreview ? (
              <View style={styles.previewWrap}>
                <img src={imagePreview} style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 10, objectFit: 'contain' } as any} alt="document preview" />
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={48} color={colors.text3} />
                <Text style={styles.uploadTitle}>Drop your document here</Text>
                <Text style={styles.uploadSub}>or click to browse · JPG, PNG, HEIC supported</Text>
              </View>
            )}
            <label style={{ cursor: 'pointer', display: 'block', marginTop: 12 } as any}>
              <View style={styles.browseBtn}>
                <Ionicons name="folder-open-outline" size={16} color={'#6FAFF2'} />
                <Text style={styles.browseBtnText}>{imagePreview ? 'Change photo' : 'Select photo'}</Text>
              </View>
              <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' } as any} />
            </label>
          </View>
        ) : (
          <View style={styles.nativeUpload}>
            <Ionicons name="camera-outline" size={48} color={colors.text3} />
            <Text style={styles.uploadTitle}>Camera / gallery</Text>
            <Text style={styles.uploadSub}>Document scanning works on web version</Text>
          </View>
        )}
      </View>

      {/* Scan button */}
      {imageData && !scanning && !result && (
        <TouchableOpacity style={styles.scanBtn} onPress={handleScan} activeOpacity={0.85}>
          <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.scanBtnGrad}>
            <Ionicons name="scan-outline" size={20} color="#fff" />
            <Text style={styles.scanBtnText}>Scan with AI</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {scanning && (
        <View style={styles.scanningWrap}>
          <ActivityIndicator size="large" color={'#6FAFF2'} />
          <Text style={styles.scanningText}>Reading document...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.resultTitle}>Scan Complete</Text>
            <View style={[styles.confidenceBadge, {
              backgroundColor: result.confidence === 'high' ? colors.successLight :
                result.confidence === 'medium' ? colors.warningLight : colors.dangerLight
            }]}>
              <Text style={[styles.confidenceText, {
                color: result.confidence === 'high' ? colors.success :
                  result.confidence === 'medium' ? colors.warning : colors.danger
              }]}>{result.confidence} confidence</Text>
            </View>
          </View>

          {[
            { label: 'Document Type', value: result.documentType },
            { label: 'Expiry Date', value: result.expiryDate ?? 'Not detected' },
            { label: 'Document #', value: result.documentNumber ?? '—' },
            { label: 'Notes', value: result.notes || '—' },
          ].map((row, i) => (
            <View key={i} style={styles.resultRow}>
              <Text style={styles.resultLabel}>{row.label}</Text>
              <Text style={[styles.resultValue, row.label === 'Expiry Date' && { color: colors.danger, fontFamily: 'Inter_700Bold' }]}>
                {row.value}
              </Text>
            </View>
          ))}

          {result.expiryDate && !saved && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDoc} activeOpacity={0.85}>
              <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save to StatusVault</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {saved && (
            <View style={styles.savedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.savedText}>Saved to your documents! Update the expiry date if needed.</Text>
            </View>
          )}

          <TouchableOpacity style={styles.rescanBtn} onPress={() => { setResult(null); setSaved(false); setImageData(null); setImagePreview(null); }}>
            <Text style={styles.rescanText}>Scan another document</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: 'transparent' },
  content:         { paddingBottom: 40 },
  contentWeb:      { paddingHorizontal: 28, paddingTop: 24 },
  header:          { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, padding: spacing.xl, paddingTop: spacing.xxl + 16 },
  headerEye:       { ...typography.micro, color: colors.text3, letterSpacing: 1.5, marginBottom: 3 },
  headerTitle:     { ...typography.h1, color: colors.text1, fontSize: 22 },
  headerSub:       { ...typography.caption, color: colors.text3, marginTop: 3 },
  webHero:         { marginBottom: spacing.lg },
  webTitle:        { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#F0F4FF', letterSpacing: -0.5 },
  webSub:          { ...typography.caption, color: colors.text3, marginTop: 4, maxWidth: 500 },
  privacyNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.successLight, borderRadius: radius.md, marginHorizontal: IS_WEB ? 0 : spacing.screen, marginVertical: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.success + '30' },
  privacyText:     { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#4CD98A', lineHeight: 18 },
  uploadCard:      { backgroundColor: colors.card, borderRadius: radius.xl, marginHorizontal: IS_WEB ? 0 : spacing.screen, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', overflow: 'hidden', ...shadows.sm },
  uploadArea:      { padding: spacing.xxl, alignItems: 'center' },
  previewWrap:     { width: '100%', alignItems: 'center', marginBottom: 8 },
  uploadPlaceholder:{ alignItems: 'center', gap: 10, paddingVertical: 30 },
  uploadTitle:     { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.text1 },
  uploadSub:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text3 },
  browseBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1.5, borderColor: '#6FAFF2', backgroundColor: 'rgba(59,139,232,0.14)', alignSelf: 'center' },
  browseBtnText:   { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#6FAFF2' },
  nativeUpload:    { padding: 40, alignItems: 'center', gap: 10 },
  scanBtn:         { marginHorizontal: IS_WEB ? 0 : spacing.screen, marginTop: spacing.lg, borderRadius: radius.lg, overflow: 'hidden' },
  scanBtnGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  scanBtnText:     { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  scanningWrap:    { alignItems: 'center', gap: 12, paddingVertical: 30 },
  scanningText:    { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text2 },
  errorCard:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.dangerLight, borderRadius: radius.lg, marginHorizontal: IS_WEB ? 0 : spacing.screen, marginTop: spacing.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.danger + '30' },
  errorText:       { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.danger, lineHeight: 20 },
  resultCard:      { backgroundColor: colors.card, borderRadius: radius.xl, marginHorizontal: IS_WEB ? 0 : spacing.screen, marginTop: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', overflow: 'hidden', ...shadows.md },
  resultHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  resultTitle:     { flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text1 },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  confidenceText:  { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  resultRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 16 },
  resultLabel:     { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text3 },
  resultValue:     { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text1, textAlign: 'right', flex: 1 },
  saveBtn:         { margin: spacing.lg, borderRadius: radius.lg, overflow: 'hidden' },
  saveBtnGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  saveBtnText:     { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  savedBadge:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.successLight, margin: spacing.lg, padding: spacing.md, borderRadius: radius.md },
  savedText:       { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.success, lineHeight: 19 },
  rescanBtn:       { alignItems: 'center', paddingVertical: spacing.lg },
  rescanText:      { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#6FAFF2' },
});
