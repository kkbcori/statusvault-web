import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { calculateDaysRemaining } from '../utils/dates';

export interface AppNotification {
  id: string; docId: string; docLabel: string; docIcon: string;
  daysRemaining: number; expiryDate: string; createdAt: string;
  read: boolean; isFamilyDoc?: boolean; memberName?: string;
}

const ALERT_WINDOWS = [180, 90, 60, 30, 15, 7];

function getSeverity(days: number) {
  if (days < 0)   return { label: 'EXPIRED',  color: '#FF6B6B', bg: 'rgba(255,107,107,0.10)', border: 'rgba(255,107,107,0.30)' };
  if (days < 30)  return { label: 'CRITICAL', color: '#FF6B6B', bg: 'rgba(255,107,107,0.10)', border: 'rgba(255,107,107,0.30)' };
  if (days < 60)  return { label: 'HIGH',     color: '#F5C053', bg: 'rgba(245,192,83,0.10)', border: 'rgba(245,192,83,0.35)' };
  if (days < 180) return { label: 'MEDIUM',   color: '#6FAFF2', bg: 'rgba(59,139,232,0.14)', border: 'rgba(111,175,242,0.30)' };
  return                  { label: 'INFO',    color: '#4CD98A', bg: 'rgba(76,217,138,0.10)', border: 'rgba(76,217,138,0.35)' };
}

function getMessage(days: number, label: string): string {
  if (days < 0)   return `${label} expired ${Math.abs(days)} days ago`;
  if (days === 0) return `${label} expires TODAY`;
  if (days <= 7)  return `${label} expires in ${days} day${days !== 1 ? 's' : ''}`;
  return `${label} expires in ${days} days`;
}

export function generateAlerts(docs: any[], family: any[], existing: AppNotification[]): AppNotification[] {
  const alerts: AppNotification[] = [];
  const existingIds = new Set(existing.map(n => n.id));
  const processDoc = (doc: any, memberName?: string) => {
    const days = calculateDaysRemaining(doc.expiryDate);
    if (days >= 180 && !ALERT_WINDOWS.some(w => Math.abs(days - w) <= 2)) return;
    const id = `${doc.id}-${memberName ?? 'self'}-${Math.floor(days / 3)}`;
    if (existingIds.has(id)) return;
    alerts.push({ id, docId: doc.id, docLabel: doc.label, docIcon: doc.icon, daysRemaining: days,
      expiryDate: doc.expiryDate, createdAt: new Date().toISOString(), read: false,
      isFamilyDoc: !!memberName, memberName });
  };
  docs.forEach(d => processDoc(d));
  family.forEach(m => docs.filter(d => m.documentIds?.includes(d.id)).forEach(d => processDoc(d, m.name)));
  return alerts;
}

export const NotificationBell: React.FC = () => {
  const documents      = useStore(s => s.documents);
  const familyMembers  = useStore(s => s.familyMembers);
  const notifications         = useStore(s => s.notifications ?? []) as AppNotification[];
  const setInAppNotifications   = useStore(s => s.setInAppNotifications);
  const setNotifs              = (n: AppNotification[]) => setInAppNotifications(n);

  const [open, setOpen]   = useState(false);
  const [pos,  setPos]    = useState({ top: 56, right: 8 });
  const bellRef           = useRef<any>(null);
  const panelRef          = useRef<any>(null);

  useEffect(() => {
    const newAlerts = generateAlerts(documents, familyMembers, notifications);
    if (newAlerts.length > 0) setNotifs([...newAlerts, ...notifications].slice(0, 50));
  }, [documents.length, familyMembers.length]);

  const handleBell = () => {
    if (!open && bellRef.current) {
      if (typeof bellRef.current.getBoundingClientRect === 'function') {
        const r = bellRef.current.getBoundingClientRect();
        // Guard window.innerWidth — native has no window object
        const winWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
        setPos({ top: r.bottom + 6, right: winWidth - r.right });
      }
    }
    setOpen(v => !v);
  };

  const unread     = notifications.filter(n => !n.read).length;
  const markRead   = (id: string) => setNotifs(notifications.map(n => n.id === id ? { ...n, read: true }  : n));
  const markUnread = (id: string) => setNotifs(notifications.map(n => n.id === id ? { ...n, read: false } : n));
  const remove     = (id: string) => setNotifs(notifications.filter(n => n.id !== id));
  const markAll    = ()           => setNotifs(notifications.map(n => ({ ...n, read: true })));
  const clearAll   = ()           => setNotifs([]);

  return (
    <View>
      {/* Bell button */}
      <TouchableOpacity ref={bellRef} style={s.bellBtn} onPress={handleBell} activeOpacity={0.8}>
        <Ionicons name={open ? 'notifications' : 'notifications-outline'} size={18}
          color={open ? '#6FAFF2' : 'rgba(240,244,255,0.55)'} />
        {unread > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Dropdown — renders in Modal so it's always above everything */}
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        {/* Backdrop closes on tap */}
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />

        {/* Panel */}
        <View style={[s.panel, { top: pos.top, right: pos.right }]}>
          {/* Header */}
          <View style={s.hdr}>
            <View>
              <Text style={s.hdrTitle}>Notifications</Text>
              {unread > 0 && <Text style={s.hdrSub}>{unread} unread</Text>}
            </View>
            <View style={{ flexDirection: 'row', gap: 6 } as any}>
              {unread > 0 && (
                <TouchableOpacity onPress={markAll} style={s.hdrBtn}>
                  <Text style={s.hdrBtnTxt}>Mark all read</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity onPress={clearAll} style={s.hdrBtn}>
                  <Ionicons name="trash-outline" size={13} color="rgba(240,244,255,0.45)" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Empty state */}
          {notifications.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="checkmark-circle-outline" size={32} color="rgba(240,244,255,0.35)" />
              <Text style={s.emptyTxt}>All caught up!</Text>
              <Text style={s.emptySub}>No document expiry alerts</Text>
            </View>
          )}

          {/* List */}
          {notifications.length > 0 && (
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {notifications.map(n => {
                const sev = getSeverity(n.daysRemaining);
                return (
                  <View key={n.id} style={[s.item, n.read && s.itemRead]}>
                    {!n.read && <View style={[s.dot, { backgroundColor: sev.color }]} />}
                    <View style={[s.icon, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                      <Text style={{ fontSize: 16 }}>{n.docIcon}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 3 } as any}>
                      <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' } as any}>
                        <View style={[s.chip, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                          <Text style={[s.chipTxt, { color: sev.color }]}>{sev.label}</Text>
                        </View>
                        {n.isFamilyDoc && (
                          <View style={s.famChip}>
                            <Ionicons name="people-outline" size={9} color="#3B8BE8" />
                            <Text style={s.famTxt}>{n.memberName}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[s.msg, n.read && { color: 'rgba(240,244,255,0.45)' }]} numberOfLines={2}>
                        {getMessage(n.daysRemaining, n.docLabel)}
                      </Text>
                      <Text style={s.date}>Expires {n.expiryDate}</Text>
                    </View>
                    <View style={{ flexDirection: 'column', gap: 2 } as any}>
                      <TouchableOpacity onPress={() => n.read ? markUnread(n.id) : markRead(n.id)} style={s.actBtn}>
                        <Ionicons name={n.read ? 'mail-outline' : 'mail-open-outline'} size={14} color="rgba(240,244,255,0.45)" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => remove(n.id)} style={s.actBtn}>
                        <Ionicons name="close" size={14} color="rgba(240,244,255,0.45)" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  bellBtn:   { width: 34, height: 34, backgroundColor: 'rgba(59,139,232,0.14)', borderWidth: 1, borderColor: 'rgba(111,175,242,0.30)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badge:     { position: 'absolute' as any, top: -4, right: -4, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)' },
  badgeTxt:  { fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: '#fff', lineHeight: 12 },
  backdrop:  { position: 'absolute' as any, inset: 0 } as any,
  panel:     { position: 'absolute' as any, width: 340, maxHeight: 480, backgroundColor: '#0C1A34', borderRadius: 16, ...Platform.select({ web: { boxShadow: '0 16px 48px rgba(0,0,0,0.55)' } as any }), borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' } as any,
  hdr:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  hdrTitle:  { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#F0F4FF' },
  hdrSub:    { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', marginTop: 1 },
  hdrBtn:    { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'transparent', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  hdrBtnTxt: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#6FAFF2' },
  empty:     { alignItems: 'center', paddingVertical: 36, gap: 6 } as any,
  emptyTxt:  { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.80)' },
  emptySub:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.45)' },
  item:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'transparent', position: 'relative' as any },
  itemRead:  { backgroundColor: '#FAFAFA' },
  dot:       { position: 'absolute' as any, left: 4, top: 16, width: 6, height: 6, borderRadius: 3 },
  icon:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  chip:      { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  chipTxt:   { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  famChip:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(167,139,250,0.14)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#DDD6FE' },
  famTxt:    { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#3B8BE8' },
  msg:       { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#F0F4FF', lineHeight: 17 },
  date:      { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.45)' },
  actBtn:    { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
});
