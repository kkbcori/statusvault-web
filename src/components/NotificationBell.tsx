// ═══════════════════════════════════════════════════════════════
// NotificationBell — Topbar bell with dropdown alert center
// Generates alerts from document expiry windows
// Mark read / unread / delete per alert
// ═══════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { calculateDaysRemaining } from '../utils/dates';

export interface AppNotification {
  id: string;
  docId: string;
  docLabel: string;
  docIcon: string;
  daysRemaining: number;
  expiryDate: string;
  createdAt: string;
  read: boolean;
  isFamilyDoc?: boolean;
  memberName?: string;
}

const ALERT_WINDOWS = [180, 90, 60, 30, 15, 7];

function getSeverity(days: number) {
  if (days < 0)   return { label: 'EXPIRED',  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
  if (days < 30)  return { label: 'CRITICAL', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };
  if (days < 60)  return { label: 'HIGH',     color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
  if (days < 180) return { label: 'MEDIUM',   color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' };
  return                  { label: 'INFO',    color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' };
}

function getMessage(days: number, label: string): string {
  if (days < 0)  return `${label} expired ${Math.abs(days)} days ago`;
  if (days === 0) return `${label} expires TODAY`;
  if (days <= 7)  return `${label} expires in ${days} day${days !== 1 ? 's' : ''}`;
  return `${label} expires in ${days} days`;
}

// ── Generate alerts from current document state ───────────────
export function generateAlerts(
  documents: any[],
  familyMembers: any[],
  existing: AppNotification[]
): AppNotification[] {
  const alerts: AppNotification[] = [];
  const existingIds = new Set(existing.map(n => n.id));

  const processDoc = (doc: any, memberName?: string) => {
    const days = calculateDaysRemaining(doc.expiryDate);
    // Always include expired docs and docs within 180 days
    const shouldAlert = days < 0 || ALERT_WINDOWS.some(w => Math.abs(days - w) <= 2 || days <= w);
    if (!shouldAlert) return;

    const id = `${doc.id}-${memberName ?? 'self'}-${Math.floor(days / 3)}`; // bucket by 3-day windows
    if (existingIds.has(id)) return;

    alerts.push({
      id,
      docId: doc.id,
      docLabel: doc.label,
      docIcon: doc.icon,
      daysRemaining: days,
      expiryDate: doc.expiryDate,
      createdAt: new Date().toISOString(),
      read: false,
      isFamilyDoc: !!memberName,
      memberName,
    });
  };

  documents.forEach(d => processDoc(d));
  familyMembers.forEach(m => {
    documents
      .filter(d => m.documentIds?.includes(d.id))
      .forEach(d => processDoc(d, m.name));
  });

  return alerts;
}

// ── Component ─────────────────────────────────────────────────
export const NotificationBell: React.FC = () => {
  const documents     = useStore(s => s.documents);
  const familyMembers = useStore(s => s.familyMembers);
  const notifications  = useStore(s => (s as any).notifications ?? []) as AppNotification[];
  const setNotifications = (n: AppNotification[]) => useStore.setState({ notifications: n } as any);

  const [open, setOpen] = useState(false);
  const panelRef = useRef<any>(null);

  // Generate/refresh alerts whenever documents change
  useEffect(() => {
    const newAlerts = generateAlerts(documents, familyMembers, notifications);
    if (newAlerts.length > 0) {
      setNotifications([...newAlerts, ...notifications].slice(0, 50));
    }
  }, [documents.length, familyMembers.length]);

  // Close on outside click
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notifications.filter(n => !n.read).length;

  const markRead   = (id: string) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const markUnread = (id: string) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: false } : n));
  const remove     = (id: string) => setNotifications(notifications.filter(n => n.id !== id));
  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));
  const clearAll    = () => setNotifications([]);

  return (
    <View ref={panelRef} style={s.wrap}>
      {/* Bell button */}
      <TouchableOpacity style={s.bellBtn} onPress={() => setOpen(v => !v)} activeOpacity={0.8}>
        <Ionicons name={open ? 'notifications' : 'notifications-outline'} size={18} color={open ? '#4F46E5' : '#64748B'} />
        {unread > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Dropdown panel */}
      {open && (
        <View style={s.panel}>
          {/* Header */}
          <View style={s.panelHeader}>
            <View>
              <Text style={s.panelTitle}>Notifications</Text>
              {unread > 0 && <Text style={s.panelSub}>{unread} unread</Text>}
            </View>
            <View style={s.headerActions}>
              {unread > 0 && (
                <TouchableOpacity onPress={markAllRead} style={s.headerBtn}>
                  <Text style={s.headerBtnTxt}>Mark all read</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity onPress={clearAll} style={[s.headerBtn, { marginLeft: 4 }]}>
                  <Ionicons name="trash-outline" size={13} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          {notifications.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#CBD5E1" />
              <Text style={s.emptyTxt}>All caught up!</Text>
              <Text style={s.emptySub}>No document expiry alerts</Text>
            </View>
          ) : (
            <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
              {notifications.map(n => {
                const sev = getSeverity(n.daysRemaining);
                return (
                  <View key={n.id} style={[s.item, n.read && s.itemRead]}>
                    {/* Unread dot */}
                    {!n.read && <View style={[s.unreadDot, { backgroundColor: sev.color }]} />}

                    {/* Icon */}
                    <View style={[s.itemIcon, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                      <Text style={{ fontSize: 16 }}>{n.docIcon}</Text>
                    </View>

                    {/* Content */}
                    <View style={s.itemContent}>
                      <View style={s.itemTopRow}>
                        <View style={[s.severityChip, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                          <Text style={[s.severityTxt, { color: sev.color }]}>{sev.label}</Text>
                        </View>
                        {n.isFamilyDoc && (
                          <View style={s.familyChip}>
                            <Ionicons name="people-outline" size={9} color="#7C3AED" />
                            <Text style={s.familyTxt}>{n.memberName}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[s.itemMsg, n.read && { color: '#94A3B8' }]} numberOfLines={2}>
                        {getMessage(n.daysRemaining, n.docLabel)}
                      </Text>
                      <Text style={s.itemDate}>Expires {n.expiryDate}</Text>
                    </View>

                    {/* Actions */}
                    <View style={s.itemActions}>
                      <TouchableOpacity
                        onPress={() => n.read ? markUnread(n.id) : markRead(n.id)}
                        style={s.actionBtn}
                      >
                        <Ionicons
                          name={n.read ? 'mail-outline' : 'mail-open-outline'}
                          size={14}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => remove(n.id)} style={s.actionBtn}>
                        <Ionicons name="close" size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  wrap:         { position: 'relative' as any },
  bellBtn:      { width: 34, height: 34, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badge:        { position: 'absolute' as any, top: -4, right: -4, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: '#fff' },
  badgeTxt:     { fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: '#fff', lineHeight: 12 },

  panel:        { position: 'absolute' as any, top: 42, right: 0, width: 340, maxHeight: 480, backgroundColor: '#fff', borderRadius: 16, zIndex: 9999, ...Platform.select({ web: { boxShadow: '0 8px 40px rgba(15,23,42,0.15)' } as any }), borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' } as any,

  panelHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  panelTitle:   { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  panelSub:     { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 1 },
  headerActions:{ flexDirection: 'row', alignItems: 'center' },
  headerBtn:    { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F8FAFF', borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  headerBtnTxt: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#4F46E5' },

  empty:        { alignItems: 'center', paddingVertical: 36, gap: 6 } as any,
  emptyTxt:     { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#334155' },
  emptySub:     { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#94A3B8' },

  list:         { maxHeight: 400 },
  item:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFF', position: 'relative' as any },
  itemRead:     { backgroundColor: '#FAFAFA' },
  unreadDot:    { position: 'absolute' as any, left: 4, top: 16, width: 6, height: 6, borderRadius: 3 },
  itemIcon:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  itemContent:  { flex: 1, gap: 3 } as any,
  itemTopRow:   { flexDirection: 'row', gap: 5, flexWrap: 'wrap' } as any,
  severityChip: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  severityTxt:  { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  familyChip:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F5F3FF', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#DDD6FE' },
  familyTxt:    { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#7C3AED' },
  itemMsg:      { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#0F172A', lineHeight: 17 },
  itemDate:     { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#94A3B8' },
  itemActions:  { flexDirection: 'column', gap: 2, flexShrink: 0 },
  actionBtn:    { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFF' },
});
