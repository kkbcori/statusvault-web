// ═══════════════════════════════════════════════════════════════
// TravelScreen — I-94 Travel History & N-400 PDF Export
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Platform, FlatList, KeyboardAvoidingView, Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { toLocalDateString } from '../utils/dates';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { IS_WEB } from '../utils/responsive';
import { useWindowDimensions } from 'react-native';
import { useDialog } from '../components/ConfirmDialog';
import { useStore } from '../store';
import { FamilyMember } from '../types';
import { useEntrance, usePressScale } from '../hooks/useAnimations';
import { TravelTrip, TripPurpose } from '../types';
import {
  getTripDays, getTotalDaysAbroad, filterLast5Years, sortByDateDesc,
  formatDateShort, getTripColor, isLongAbsence, PURPOSE_LABELS, PURPOSE_ICONS,
} from '../utils/travel';
import { exportTravelPdf } from '../utils/travelPdf';
import { exportAddressPdf } from '../utils/addressPdf';
import { AddressEntry } from '../types';
import { AnimatedEmptyIcon } from '../components/AnimatedEmptyIcon';

// ─── Purpose Picker ──────────────────────────────────────────
const PURPOSES: TripPurpose[] = ['vacation', 'business', 'family', 'medical', 'other'];

// ─── Date Field ──────────────────────────────────────────────
interface DateFieldProps {
  label: string;
  value: Date;
  onPress: () => void;
  onChange?: (date: Date) => void;
}
const DateField: React.FC<DateFieldProps> = ({ label, value, onPress, onChange }) => (
  <View style={{ marginBottom: 4 }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {IS_WEB ? (
      <input
        type="date"
        value={toLocalDateString(value)}
        onChange={(e: any) => {
          if (e.target.value && onChange) onChange(new Date(e.target.value + 'T12:00:00'));
        }}
        style={{
          width: '100%', padding: '10px 14px', fontSize: '14px',
          fontFamily: 'Inter_400Regular', color: '#F0F4FF',
          border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px',
          backgroundColor: 'rgba(255,255,255,0.05)', outline: 'none', cursor: 'pointer',
          boxSizing: 'border-box',
        } as any}
      />
    ) : (
      <TouchableOpacity style={styles.dateButton} onPress={onPress}>
        <Text style={styles.dateButtonText}>
          {value.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={'#6FAFF2'} />
      </TouchableOpacity>
    )}
  </View>
);

// ─── Trip Card ───────────────────────────────────────────────
interface TripCardProps {
  trip: TravelTrip;
  index: number;
  onDelete: () => void;
  onEdit: () => void;
}
const TripCard: React.FC<TripCardProps> = ({ trip, index, onDelete, onEdit }) => {
  const days     = getTripDays(trip);
  const col      = getTripColor(days);
  const longTrip = isLongAbsence(trip);
  const press    = usePressScale(0.97);
  const entrance = useEntrance(index * 60);

  return (
    <Animated.View style={[entrance, { transform: [...(entrance.transform || []), { scale: press.scale }] }]}>
    <View style={styles.tripCard}>
      <View style={[styles.tripStrip, { backgroundColor: col }]} />
      <View style={styles.tripContent}>

        <View style={styles.tripTopRow}>
          <View style={[styles.tripIconBox, { backgroundColor: col + '15', borderColor: col + '25' }]}>
            <Text style={{ fontSize: 18 }}>{PURPOSE_ICONS[trip.purpose]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tripCountry}>{trip.country}</Text>
            <Text style={styles.tripPurpose}>{PURPOSE_LABELS[trip.purpose]}</Text>
          </View>
          <View style={[styles.tripDaysBadge, { backgroundColor: col + '15', borderColor: col + '25' }]}>
            <Text style={[styles.tripDaysNum, { color: col }]}>{days}</Text>
            <Text style={[styles.tripDaysLabel, { color: col }]}>days</Text>
          </View>
        </View>

        <View style={styles.tripDateRow}>
          <View style={styles.tripDateItem}>
            <Text style={styles.tripDateHint}>DEPARTED</Text>
            <Text style={styles.tripDateVal}>{formatDateShort(trip.departureDate)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={14} color={colors.text3} style={{ marginTop: 14 }} />
          <View style={styles.tripDateItem}>
            <Text style={styles.tripDateHint}>RETURNED</Text>
            <Text style={styles.tripDateVal}>{formatDateShort(trip.returnDate)}</Text>
          </View>
        </View>

        {trip.portOfEntry ? (
          <View style={styles.tripMeta}>
            <Ionicons name="location-outline" size={12} color={colors.text3} />
            <Text style={styles.tripMetaText}>Port of Entry: {trip.portOfEntry}</Text>
          </View>
        ) : null}

        {trip.notes ? (
          <Text style={styles.tripNotes} numberOfLines={2}>{trip.notes}</Text>
        ) : null}

        {longTrip && (
          <View style={styles.longAbsenceChip}>
            <Ionicons name="warning-outline" size={12} color="#FF6B6B" />
            <Text style={styles.longAbsenceText}>Long absence — may affect continuous residence</Text>
          </View>
        )}

        <View style={styles.tripActions}>
          <TouchableOpacity style={styles.tripActionBtn} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={13} color={'#6FAFF2'} />
            <Text style={styles.tripActionEdit}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tripActionBtn, styles.tripActionDel]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={13} color={colors.danger} />
            <Text style={styles.tripActionDelText}>Remove</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────
export const TravelScreen: React.FC = () => {
  // ── Entrance animations ──────────────────────────────────────
  const col1Anim  = useEntrance(0);
  const col2Anim  = useEntrance(80);
  const statsAnim = useEntrance(40);
  const trips     = useStore((s) => s.trips);
  const addTrip   = useStore((s) => s.addTrip);
  const removeTrip = useStore((s) => s.removeTrip);
  const updateTrip = useStore((s) => s.updateTrip);
  const canAddTrip    = useStore((s) => s.canAddTrip);
  const canAddAddress = useStore((s) => s.canAddAddress);
  const isPremium     = useStore((s) => s.isPremium);
  const openPaywall   = useStore((s) => s.openPaywall);
  const isGuestMode   = useStore((s) => s.isGuestMode);
  const authUser      = useStore((s) => s.authUser);
  const openAuthModal = useStore((s) => s.openAuthModal);

  // Centralized "guest hits limit → auth, free hits limit → paywall" helper.
  // Returns true when the user is allowed to proceed; otherwise opens the
  // appropriate upsell modal and returns false.
  // Note: activeMember is declared further down; this arrow function closes over
  // it lexically and reads its current value at call time, so the ordering is fine.
  const enforceLimit = (kind: 'trip' | 'address'): boolean => {
    const memberId = activeMember?.id;
    const allowed = kind === 'trip' ? canAddTrip(memberId) : canAddAddress(memberId);
    if (allowed) return true;
    // Limit reached. Decide which CTA to show.
    if (!authUser || isGuestMode) {
      openAuthModal(
        kind === 'trip'
          ? 'Create a free account to track more trips'
          : 'Create a free account to track more addresses'
      );
    } else {
      // Free user — upgrade is the path forward
      openPaywall();
    }
    return false;
  };

  // ── Member selector ────────────────────────────────────────
  const familyMembers       = useStore((s) => s.familyMembers);
  const addMemberTrip       = useStore((s) => s.addMemberTrip);
  const removeMemberTrip    = useStore((s) => s.removeMemberTrip);
  const updateMemberTrip    = useStore((s) => s.updateMemberTrip);
  const addMemberAddress    = useStore((s) => s.addMemberAddress);
  const removeMemberAddress = useStore((s) => s.removeMemberAddress);
  const updateMemberAddress = useStore((s) => s.updateMemberAddress);
  const [selectedMemberId,  setSelectedMemberId] = useState<string | null>(null);
  // null = owner; string = family member id
  const activeMember = selectedMemberId ? familyMembers.find(m => m.id === selectedMemberId) ?? null : null;

  const [showModal,      setShowModal]      = useState(false);
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [country,        setCountry]        = useState('');
  const [portOfEntry,    setPortOfEntry]    = useState('');
  const [notes,          setNotes]          = useState('');
  const [purpose,        setPurpose]        = useState<TripPurpose>('vacation');
  const [departure,      setDeparture]      = useState(new Date());
  const [returnDate,     setReturnDate]     = useState(new Date());
  const [activePicker,   setActivePicker]   = useState<'departure' | 'return' | null>(null);
  const [showAll,        setShowAll]        = useState(false);
  const [exporting,      setExporting]      = useState(false);
  const [tripError,      setTripError]      = useState('');
  const dialog = useDialog();
  const { width: screenWidth } = useWindowDimensions();
  const isWideScreen = IS_WEB && screenWidth >= 1024;

  // ── Address History ────────────────────────────────────────
  const addressHistory = useStore((s) => s.addressHistory);
  const addAddress     = useStore((s) => s.addAddress);
  const removeAddress  = useStore((s) => s.removeAddress);
  const updateAddress  = useStore((s) => s.updateAddress);

  const [showAddrModal,    setShowAddrModal]    = useState(false);
  const [showAllAddr,      setShowAllAddr]      = useState(false);
  const [editingAddrId,    setEditingAddrId]    = useState<string|null>(null);
  const [addrStreet,       setAddrStreet]       = useState('');
  const [addrApt,          setAddrApt]          = useState('');
  const [addrCity,         setAddrCity]         = useState('');
  const [addrState,        setAddrState]        = useState('');
  const [addrZip,          setAddrZip]          = useState('');
  const [addrCountry,      setAddrCountry]      = useState('United States');
  const [addrFrom,         setAddrFrom]         = useState(new Date());
  const [addrTo,           setAddrTo]           = useState(new Date());
  const [addrCurrent,      setAddrCurrent]      = useState(false);
  const [addrActivePicker, setAddrActivePicker] = useState<'from'|'to'|null>(null);
  const [exportingAddr,    setExportingAddr]    = useState(false);
  const [addrError,       setAddrError]       = useState('');

  const resetAddrForm = () => {
    setAddrStreet(''); setAddrApt(''); setAddrCity('');
    setAddrState(''); setAddrZip(''); setAddrCountry('United States');
    setAddrFrom(new Date()); setAddrTo(new Date());
    setAddrCurrent(false); setEditingAddrId(null); setAddrActivePicker(null);
  };

  const handleSaveAddress = () => {
    setAddrError('');
    if (!addrStreet.trim() || !addrCity.trim() || !addrState.trim()) {
      setAddrError('Please fill in street address, city, and state.');
      return;
    }
    const entry: AddressEntry = {
      id:               editingAddrId ?? `addr_${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      street:           addrStreet.trim(),
      apt:              addrApt.trim() || undefined,
      city:             addrCity.trim(),
      state:            addrState.trim(),
      zipCode:          addrZip.trim(),
      country:          addrCountry.trim() || 'United States',
      dateFrom:         toLocalDateString(addrFrom),
      dateTo:           addrCurrent ? 'present' : toLocalDateString(addrTo),
      isCurrentAddress: addrCurrent,
      createdAt:        editingAddrId
        ? (activeAddressHistory.find((a: AddressEntry) => a.id === editingAddrId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };
    if (editingAddrId) {
      if (activeMember) updateMemberAddress(activeMember.id, editingAddrId, entry);
      else updateAddress(editingAddrId, entry);
    } else {
      // Defense-in-depth: re-check the limit at save time too.
      // Routes to auth modal for guests, paywall for free users.
      if (!enforceLimit('address')) {
        setShowAddrModal(false);
        resetAddrForm();
        return;
      }
      if (activeMember) addMemberAddress(activeMember.id, entry);
      else addAddress(entry);
    }
    setShowAddrModal(false);
    resetAddrForm();
  };

  const openEditAddr = (entry: AddressEntry) => {
    setEditingAddrId(entry.id);
    setAddrStreet(entry.street);
    setAddrApt(entry.apt || '');
    setAddrCity(entry.city);
    setAddrState(entry.state);
    setAddrZip(entry.zipCode);
    setAddrCountry(entry.country);
    setAddrFrom(new Date(entry.dateFrom + 'T12:00:00'));
    setAddrTo(entry.dateTo === 'present' ? new Date() : new Date(entry.dateTo + 'T12:00:00'));
    setAddrCurrent(entry.isCurrentAddress);
    setAddrError('');
    setShowAddrModal(true);
  };

  const handleExportAddressPdf = () => {
    if (!isPremium) {
      // Guests need account first; free users get paywall
      if (!authUser || isGuestMode) {
        useStore.getState().openAuthModal('Create a free account, then upgrade to export PDFs');
      } else {
        openPaywall();
      }
      return;
    }
    if (activeAddressHistory.length === 0) {
      dialog.alert('No Addresses', 'Add at least one address before exporting.');
      return;
    }
    setExportingAddr(true);
    try { exportAddressPdf(activeAddressHistory); } finally { setExportingAddr(false); }
  };

  // Active trips/addresses — owner or selected member
  const activeTrips       = activeMember ? (activeMember.trips ?? []) : trips;
  const activeAddressHistory = activeMember ? (activeMember.addressHistory ?? []) : addressHistory;

  const sorted    = sortByDateDesc(activeTrips);
  const last5     = filterLast5Years(activeTrips);
  const abroad5   = getTotalDaysAbroad(last5);
  const abroadAll = getTotalDaysAbroad(activeTrips);
  const inUS5     = Math.max(0, 5 * 365 - abroad5);
  const hasLong   = last5.some(isLongAbsence);
  const displayed = showAll ? sorted : sortByDateDesc(last5);

  // ── Gap detection helpers ──────────────────────────────────
  // Returns number of days gap between two consecutive date strings
  const daysBetween = (dateA: string, dateB: string): number => {
    const a = new Date(dateA + 'T00:00:00');
    const b = new Date(dateB + 'T00:00:00');
    return Math.round(Math.abs(b.getTime() - a.getTime()) / 86_400_000);
  };

  // Addresses: sort newest-first (current first, then by dateFrom desc)
  const sortedAddresses = [...activeAddressHistory].sort((a, b) =>
    a.isCurrentAddress ? -1 : b.isCurrentAddress ? 1 : b.dateFrom.localeCompare(a.dateFrom)
  );
  const addrGapDays = (() => {
    if (sortedAddresses.length < 2) return 0;
    let maxGap = 0;
    for (let i = 0; i < sortedAddresses.length - 1; i++) {
      const newer = sortedAddresses[i];
      const older = sortedAddresses[i + 1];
      const newerFrom = newer.dateFrom;
      const olderTo   = older.isCurrentAddress ? toLocalDateString(new Date()) : older.dateTo;
      if (olderTo === 'present') continue;
      const gap = daysBetween(olderTo, newerFrom) - 1;
      if (gap > 1) maxGap = Math.max(maxGap, gap);
    }
    return maxGap;
  })();
  const addrHasGap = addrGapDays > 1;

  const resetForm = () => {
    setCountry(''); setPortOfEntry(''); setNotes('');
    setPurpose('vacation');
    setDeparture(new Date()); setReturnDate(new Date());
    setEditingId(null); setActivePicker(null); setTripError('');
  };

  const openAdd = () => {
    if (!enforceLimit('trip')) return;
    resetForm();
    setShowModal(true);
  };

  const openAddAddr = () => {
    if (!enforceLimit('address')) return;
    resetAddrForm();
    setShowAddrModal(true);
  };

  const openEdit = (trip: TravelTrip) => {
    setEditingId(trip.id);
    setCountry(trip.country);
    setPortOfEntry(trip.portOfEntry);
    setNotes(trip.notes || '');
    setPurpose(trip.purpose);
    setDeparture(new Date(trip.departureDate + 'T00:00:00'));
    setReturnDate(new Date(trip.returnDate + 'T00:00:00'));
    setShowModal(true);
  };

  const handleSave = () => {
    setTripError('');
    if (!country.trim()) { setTripError('Please enter the destination country.'); return; }
    if (returnDate < departure) { setTripError('Return date must be on or after departure date.'); return; }

    const entry = {
      country:       country.trim(),
      portOfEntry:   portOfEntry.trim(),
      notes:         notes.trim(),
      purpose,
      departureDate: toLocalDateString(departure),
      returnDate:    toLocalDateString(returnDate),
    };

    if (editingId) {
      if (activeMember) updateMemberTrip(activeMember.id, editingId, entry);
      else updateTrip(editingId, entry);
    } else {
      // Defense-in-depth: re-check the limit at save time too
      // (covers any race / programmatic add). Routes to auth modal
      // for guests, paywall for free users.
      if (!enforceLimit('trip')) {
        setShowModal(false);
        resetForm();
        return;
      }
      const newTrip = { id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, createdAt: new Date().toISOString(), ...entry };
      if (activeMember) addMemberTrip(activeMember.id, newTrip);
      else addTrip(newTrip);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string, country: string) => {
    dialog.confirm({ title: 'Remove Trip', message: `Remove trip to ${country}?`,
      type: 'danger', confirmLabel: 'Remove', onConfirm: () => {
        if (activeMember) removeMemberTrip(activeMember.id, id);
        else removeTrip(id);
      }});
  };

  const handleExport = async () => {
    if (!isPremium) {
      if (!authUser || isGuestMode) {
        useStore.getState().openAuthModal('Create a free account, then upgrade to export PDFs');
      } else {
        openPaywall();
      }
      return;
    }
    if (activeTrips.length === 0) { dialog.alert('No trips', 'Add at least one trip before exporting.'); return; }
    setExporting(true);
    try {
      await exportTravelPdf(activeTrips);
    } catch (e) {
      dialog.alert('Export Failed', 'Could not generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDateChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (!date) return;
    if (activePicker === 'departure') setDeparture(date);
    else setReturnDate(date);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={true}>

        {/* Header */}
        <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']} style={styles.headerGradient}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>RESIDENCY & TRAVEL</Text>
              <Text style={styles.headerTitle}>Travel & Address History</Text>
              <Text style={styles.headerSub}>Ready for N-400 and I-485 applications</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Member Picker — owner + family members */}
        {familyMembers.length > 0 && (
          <View style={styles.memberPickerRow}>
            <TouchableOpacity
              style={[styles.memberChip, selectedMemberId === null && styles.memberChipActive]}
              onPress={() => { setSelectedMemberId(null); setShowAll(false); setShowAllAddr(false); }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={13} color={selectedMemberId === null ? 'rgba(255,255,255,0.05)' : '#6FAFF2'} />
              <Text style={[styles.memberChipText, selectedMemberId === null && styles.memberChipTextActive]}>You</Text>
            </TouchableOpacity>
            {familyMembers.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.memberChip, selectedMemberId === m.id && styles.memberChipActive]}
                onPress={() => { setSelectedMemberId(m.id); setShowAll(false); setShowAllAddr(false); }}
                activeOpacity={0.7}
              >
                <Ionicons name="people-outline" size={13} color={selectedMemberId === m.id ? 'rgba(255,255,255,0.05)' : '#6FAFF2'} />
                <Text style={[styles.memberChipText, selectedMemberId === m.id && styles.memberChipTextActive]} numberOfLines={1}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{last5.length}</Text>
            <Text style={styles.statLbl}>Trips</Text>
            <Text style={styles.statSub}>Last 5 yrs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, abroad5 > 913 && { color: colors.danger }]}>{abroad5}</Text>
            <Text style={styles.statLbl}>Days Abroad</Text>
            <Text style={styles.statSub}>Last 5 yrs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: colors.success }]}>{inUS5}</Text>
            <Text style={styles.statLbl}>Days in US</Text>
            <Text style={styles.statSub}>Est. last 5 yrs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{abroadAll}</Text>
            <Text style={styles.statLbl}>Total Abroad</Text>
            <Text style={styles.statSub}>All time</Text>
          </View>
        </View>

        {/* Long absence warning */}
        {hasLong && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={16} color="#F5C053" />
            <Text style={styles.warningText}>
              A trip in the last 5 years exceeded 180 days. This may affect continuous residence for naturalization. Consult an immigration attorney.
            </Text>
          </View>
        )}

        {/* ══ TWO-COLUMN LAYOUT: I-94 Tracker | Address History ══ */}
        <View style={[styles.twoColRow, isWideScreen && styles.twoColRowWide]}>

          {/* ── LEFT COL: I-94 / N-400 Tracker ── */}
          <Animated.View style={[col1Anim, styles.twoColCard as any, isWideScreen && { flex: 1 } as any]}>

            {/* ── Card header — mirrored with Address card ── */}
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconBox}>
                <Ionicons name="airplane-outline" size={16} color="#6FAFF2" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{activeMember ? `${activeMember.name}'s I-94` : 'I-94 Travel History'}</Text>
                <Text style={styles.cardSub}>N-400 Part 8 · Naturalization</Text>
              </View>
              <TouchableOpacity style={styles.miniExportBtn} onPress={handleExport} activeOpacity={0.8} disabled={exporting}>
                <Ionicons name="document-text-outline" size={12} color="#6FAFF2" />
                <Text style={styles.miniExportTxt}>{exporting ? '…' : 'Export N-400'}</Text>
              </TouchableOpacity>
            </View>

            {/* Add Trip button — always full width */}
            <TouchableOpacity
              style={styles.cardAddBtn}
              onPress={openAdd}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={15} color="#6FAFF2" />
              <Text style={[styles.cardAddBtnTxt, { color: '#6FAFF2' }]}>Add Trip</Text>
            </TouchableOpacity>

        {/* Trip list */}
        <View style={{ gap: 8 }}>
          {trips.length > 0 && (
            <TouchableOpacity onPress={() => setShowAll(!showAll)} style={[styles.toggleChip, { alignSelf: 'flex-end', marginBottom: 4 }]}>
              <Text style={styles.toggleChipText}>{showAll ? 'Show 5-yr' : 'Show all'}</Text>
            </TouchableOpacity>
          )}

          {displayed.length === 0 ? (
            <View style={styles.emptyCard}>
              <AnimatedEmptyIcon name="airplane" size={36} color={colors.primaryLight} haloSize={100} style={{ marginBottom: spacing.md } as any} />
              <Text style={styles.emptyTitle}>No trips recorded</Text>
              <Text style={styles.emptySubtitle}>
                Tap "+ Trip" to log your first international trip for N-400 tracking
              </Text>
            </View>
          ) : (
            displayed.map((trip, i) => (
              <TripCard
                key={trip.id}
                trip={trip}
                index={i}
                onDelete={() => handleDelete(trip.id, trip.country)}
                onEdit={() => openEdit(trip)}
              />
            ))
          )}

          </View>{/* end trip list */}
          </Animated.View>{/* end left col */}

          {/* ── RIGHT COL: Address History / I-485 ── */}
          <Animated.View style={[col2Anim, styles.twoColCard as any, isWideScreen && { flex: 1 } as any]}>

            {/* ── Card header — mirrored with I-94 card ── */}
            <View style={styles.cardTopRow}>
              <View style={[styles.cardIconBox, { backgroundColor: '#E0F7FA' }]}>
                <Ionicons name="home-outline" size={16} color="#0891B2" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{activeMember ? `${activeMember.name}'s Addresses` : 'Address History'}</Text>
                <Text style={styles.cardSub}>I-485 Part 3 · Adjustment of Status</Text>
              </View>
              <TouchableOpacity style={[styles.miniExportBtn, { borderColor: '#67E8F9' }]} onPress={handleExportAddressPdf} activeOpacity={0.8}>
                <Ionicons name="document-text-outline" size={12} color="#0891B2" />
                <Text style={[styles.miniExportTxt, { color: '#5B9AF5' }]}>{exportingAddr ? '…' : 'Export I-485'}</Text>
              </TouchableOpacity>
            </View>

            {/* Gap warning — shown above Add Address button when gap exists */}
            {addrHasGap && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Ionicons name="warning-outline" size={13} color="#FF6B6B" />
                <Text style={{ fontSize: 11, color: '#FF6B6B', fontFamily: 'Inter_500Medium' }}>
                  {addrGapDays}-day gap detected in address history
                </Text>
              </View>
            )}
            {/* Add Address button — always full width */}
            <TouchableOpacity
              style={[styles.cardAddBtn, { borderColor: '#67E8F9' }]}
              onPress={openAddAddr}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={15} color="#0891B2" />
              <Text style={[styles.cardAddBtnTxt, { color: '#5B9AF5' }]}>Add Address</Text>
            </TouchableOpacity>

          {/* Show all toggle — mirrored with trip card */}
          <View style={{ gap: 8 }}>
            {activeAddressHistory.length > 0 && (
              <TouchableOpacity onPress={() => setShowAllAddr(!showAllAddr)} style={[styles.toggleChip, { alignSelf: 'flex-end', marginBottom: 4, borderColor: 'rgba(91,154,245,0.35)', backgroundColor: showAllAddr ? 'rgba(91,154,245,0.22)' : 'rgba(91,154,245,0.10)' }]}>
                <Text style={[styles.toggleChipText, { color: '#5B9AF5' }]}>{showAllAddr ? 'Show recent' : 'Show all'}</Text>
              </TouchableOpacity>
            )}

          {sortedAddresses.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(91,154,245,0.14)', borderColor: 'rgba(91,154,245,0.28)' }]}>
                <Text style={{ fontSize: 28 }}>🏠</Text>
              </View>
              <Text style={styles.emptyTitle}>No addresses yet</Text>
              <Text style={styles.emptySubtitle}>Tap "+ Add Address" to log your US addresses for I-485 filing</Text>
            </View>
          ) : (
            sortedAddresses
              .slice(0, showAllAddr ? undefined : 5)
              .map((entry: AddressEntry) => (
                <View key={entry.id} style={styles.tripCard}>
                  <View style={[styles.tripStrip, { backgroundColor: entry.isCurrentAddress ? '#4CD98A' : '#5B9AF5' }]} />
                  <View style={styles.tripContent}>
                    <View style={styles.tripTopRow}>
                      <View style={[styles.tripIconBox, { backgroundColor: (entry.isCurrentAddress ? '#4CD98A' : '#5B9AF5') + '18', borderColor: (entry.isCurrentAddress ? '#4CD98A' : '#5B9AF5') + '30' }]}>
                        <Ionicons name="home-outline" size={18} color={entry.isCurrentAddress ? '#4CD98A' : '#5B9AF5'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tripCountry} numberOfLines={1}>{entry.street}{entry.apt ? `, ${entry.apt}` : ''}</Text>
                        <Text style={styles.tripPurpose}>{entry.city}, {entry.state} {entry.zipCode}{entry.country !== 'United States' ? ` · ${entry.country}` : ''}</Text>
                      </View>
                      {entry.isCurrentAddress && (
                        <View style={[styles.tripDaysBadge, { backgroundColor: 'rgba(76,217,138,0.10)', borderColor: '#A7F3D0', paddingHorizontal: 8 }]}>
                          <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: '#4CD98A' }}>Current</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.tripDateRow}>
                      <View style={styles.tripDateItem}>
                        <Text style={styles.tripDateHint}>FROM</Text>
                        <Text style={styles.tripDateVal}>{entry.dateFrom.slice(5,7)}/{entry.dateFrom.slice(0,4)}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={14} color={colors.text3} style={{ marginTop: 14 }} />
                      <View style={styles.tripDateItem}>
                        <Text style={styles.tripDateHint}>TO</Text>
                        <Text style={styles.tripDateVal}>{entry.isCurrentAddress ? 'Present' : `${entry.dateTo.slice(5,7)}/${entry.dateTo.slice(0,4)}`}</Text>
                      </View>
                    </View>
                    <View style={styles.tripActions}>
                      <TouchableOpacity
                        style={[styles.tripActionBtn, styles.tripActionEdit]}
                        onPress={() => openEditAddr(entry)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil-outline" size={13} color="#0891B2" />
                        <Text style={[styles.tripActionEditText, { color: '#5B9AF5' }]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.tripActionBtn, styles.tripActionDel]}
                        onPress={() => dialog.confirm({ title: 'Delete Address', message: 'Remove this address?', type: 'danger', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: () => {
                        if (activeMember) removeMemberAddress(activeMember.id, entry.id);
                        else removeAddress(entry.id);
                      } })}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={13} color={colors.danger} />
                        <Text style={styles.tripActionDelText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
          )}
          </View>{/* end addr list */}

          </Animated.View>{/* end right col */}
        </View>{/* end twoColRow */}

      </ScrollView>

      {/* ═══ ADD / EDIT TRIP MODAL ═══ */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Purple trim — N-400 theme */}
            <View style={styles.modalTrim} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Trip' : 'Add Trip'}</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={colors.text2} />
              </TouchableOpacity>
            </View>

            {/* Context card — purple I-94 theme */}
            <View style={[styles.addrInfoCard, { backgroundColor: 'rgba(167,139,250,0.14)', borderColor: 'rgba(167,139,250,0.32)' }]}>
              <View style={[styles.addrInfoIconCircle, { backgroundColor: '#EDE9FE', borderColor: 'rgba(115,103,240,0.25)' }]}>
                <Ionicons name="airplane-outline" size={18} color="#6FAFF2" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.addrInfoTitle, { color: '#4C3D99' }]}>I-94 Travel History</Text>
                <Text style={[styles.addrInfoSub, { color: '#6FAFF2' }]}>Required for N-400 — log all international trips for the past 5 years</Text>
              </View>
            </View>

            <View style={{ padding: spacing.screen, paddingTop: 8, gap: 7 } as any}>

              {/* Dates — side by side */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addrFieldLabel}>Departure *</Text>
                  {IS_WEB ? (
                    <input type="date" value={toLocalDateString(departure)}
                      onChange={(e:any) => { if(e.target.value) setDeparture(new Date(e.target.value+'T12:00:00')); }}
                      style={{ width:'100%', padding:'12px 14px', fontSize:'15px', fontFamily:'Inter_400Regular', color:'#F0F4FF', border:'1px solid rgba(255,255,255,0.14)', borderRadius:'10px', backgroundColor:'rgba(255,255,255,0.05)', outline:'none', cursor:'pointer', boxSizing:'border-box' } as any} />
                  ) : (
                    <TouchableOpacity style={styles.dateButton} onPress={() => setActivePicker('departure')}>
                      <Text style={styles.dateButtonText}>{departure.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addrFieldLabel}>Return *</Text>
                  {IS_WEB ? (
                    <input type="date" value={toLocalDateString(returnDate)}
                      onChange={(e:any) => { if(e.target.value) setReturnDate(new Date(e.target.value+'T12:00:00')); }}
                      style={{ width:'100%', padding:'12px 14px', fontSize:'15px', fontFamily:'Inter_400Regular', color:'#F0F4FF', border:'1px solid rgba(255,255,255,0.14)', borderRadius:'10px', backgroundColor:'rgba(255,255,255,0.05)', outline:'none', cursor:'pointer', boxSizing:'border-box' } as any} />
                  ) : (
                    <TouchableOpacity style={styles.dateButton} onPress={() => setActivePicker('return')}>
                      <Text style={styles.dateButtonText}>{returnDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {!IS_WEB && activePicker && (
                <DateTimePicker value={activePicker==='departure'?departure:returnDate} mode="date"
                  display={Platform.OS==='ios'?'spinner':'default'} onChange={handleDateChange} />
              )}

              {/* Country + Port on same row */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 3 }}>
                  <Text style={styles.addrFieldLabel}>Country *</Text>
                  <TextInput style={styles.addrFieldInput} value={country} onChangeText={setCountry} placeholder="India, Mexico…" placeholderTextColor={colors.text3} autoCapitalize="words" maxLength={60} />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.addrFieldLabel}>Port of Entry</Text>
                  <TextInput style={styles.addrFieldInput} value={portOfEntry} onChangeText={setPortOfEntry} placeholder="JFK, LAX…" placeholderTextColor={colors.text3} autoCapitalize="characters" />
                </View>
              </View>

              {/* Purpose chips */}
              <Text style={styles.addrFieldLabel}>Purpose</Text>
              <View style={[styles.purposeRow, { marginBottom: 0 }]}>
                {PURPOSES.map((pu) => (
                  <TouchableOpacity key={pu} style={[styles.purposeChip, purpose===pu && styles.purposeChipActive]} onPress={() => setPurpose(pu)}>
                    <Text style={styles.purposeIcon}>{PURPOSE_ICONS[pu]}</Text>
                    <Text style={[styles.purposeLabel, purpose===pu && styles.purposeLabelActive]}>{pu.charAt(0).toUpperCase()+pu.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration preview */}
              {returnDate >= departure && (
                <View style={styles.durationPreview}>
                  <Ionicons name="timer-outline" size={13} color="#6FAFF2" />
                  <Text style={styles.durationText}>
                    {getTripDays({ departureDate: toLocalDateString(departure), returnDate: toLocalDateString(returnDate) } as TravelTrip)} days outside the US
                    {getTripDays({ departureDate: toLocalDateString(departure), returnDate: toLocalDateString(returnDate) } as TravelTrip) >= 180 ? ' ⚠️ Long absence' : ''}
                  </Text>
                </View>
              )}

              {/* Error — fixed-height slot so Save button never moves */}
              <View style={styles.errorSlot}>
                {tripError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle-outline" size={15} color="#FF6B6B" />
                    <Text style={styles.errorBannerText}>{tripError}</Text>
                  </View>
                ) : null}
              </View>

              {/* Save */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>{editingId ? 'Update Trip' : 'Add Trip'}</Text>
                </LinearGradient>
              </TouchableOpacity>

            </View>{/* end form */}
          </View>{/* end modalSheet */}
        </View>{/* end modalOverlay */}
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ ADD / EDIT ADDRESS MODAL ═══ */}
      <Modal visible={showAddrModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Cyan trim — I-485 theme */}
            <View style={[styles.modalTrim, { backgroundColor: '#5B9AF5' }]} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAddrId ? 'Edit Address' : 'Add Address'}</Text>
              <TouchableOpacity onPress={() => { setShowAddrModal(false); resetAddrForm(); setAddrError(''); }} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={colors.text2} />
              </TouchableOpacity>
            </View>

            {/* Context card — mirrors trip modal */}
            <View style={styles.addrInfoCard}>
              <View style={styles.addrInfoIconCircle}>
                <Ionicons name="home-outline" size={18} color="#0891B2" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addrInfoTitle}>Address History</Text>
                <Text style={styles.addrInfoSub}>Required for I-485 — list all US addresses for the past 5 years</Text>
              </View>
            </View>

            <View style={{ padding: spacing.screen, paddingTop: 8, gap: 7 } as any}>

              {/* Street + Apt on same row */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 3 }}>
                  <Text style={styles.addrFieldLabel}>Street *</Text>
                  <TextInput style={styles.addrFieldInput} value={addrStreet} onChangeText={setAddrStreet} placeholder="123 Main Street" placeholderTextColor={colors.text3} autoCapitalize="words" />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.addrFieldLabel}>Apt / Unit</Text>
                  <TextInput style={styles.addrFieldInput} value={addrApt} onChangeText={setAddrApt} placeholder="4B" placeholderTextColor={colors.text3} />
                </View>
              </View>

              {/* City + State + ZIP on same row */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 3 }}>
                  <Text style={styles.addrFieldLabel}>City *</Text>
                  <TextInput style={styles.addrFieldInput} value={addrCity} onChangeText={setAddrCity} placeholder="Dallas" placeholderTextColor={colors.text3} autoCapitalize="words" />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.addrFieldLabel}>State *</Text>
                  <TextInput style={styles.addrFieldInput} value={addrState} onChangeText={setAddrState} placeholder="TX" placeholderTextColor={colors.text3} autoCapitalize="characters" maxLength={2} />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.addrFieldLabel}>ZIP</Text>
                  <TextInput style={styles.addrFieldInput} value={addrZip} onChangeText={setAddrZip} placeholder="75001" placeholderTextColor={colors.text3} keyboardType="numeric" maxLength={10} />
                </View>
              </View>

              {/* Country */}
              <View>
                <Text style={styles.addrFieldLabel}>Country</Text>
                <TextInput style={styles.addrFieldInput} value={addrCountry} onChangeText={setAddrCountry} placeholder="United States" placeholderTextColor={colors.text3} />
              </View>

              {/* Current address toggle */}
              <TouchableOpacity
                style={[styles.addrCurrentToggle, addrCurrent && styles.addrCurrentToggleActive]}
                onPress={() => setAddrCurrent(!addrCurrent)}
                activeOpacity={0.8}
              >
                <View style={[styles.addrToggleBox, addrCurrent && styles.addrToggleBoxActive]}>
                  <Ionicons
                    name={addrCurrent ? 'checkmark' : 'home-outline'}
                    size={14}
                    color={addrCurrent ? 'rgba(255,255,255,0.05)' : colors.text3}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addrToggleLabel, addrCurrent && { color: '#5B9AF5' }]}>
                    This is my current address
                  </Text>
                  {addrCurrent && (
                    <Text style={styles.addrToggleSub}>Date To will be set to "Present"</Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Dates */}
              <DateField label="Date From *" value={addrFrom} onPress={() => setAddrActivePicker('from')} onChange={(d) => setAddrFrom(d)} />
              {!addrCurrent && (
                <DateField label="Date To *" value={addrTo} onPress={() => setAddrActivePicker('to')} onChange={(d) => setAddrTo(d)} />
              )}

              {!IS_WEB && addrActivePicker && (
                <DateTimePicker
                  value={addrActivePicker === 'from' ? addrFrom : addrTo}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    if (date) { addrActivePicker === 'from' ? setAddrFrom(date) : setAddrTo(date); }
                    setAddrActivePicker(null);
                  }}
                />
              )}

              {/* Error — fixed-height slot so Save button never moves */}
              <View style={styles.errorSlot}>
                {addrError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle-outline" size={15} color="#FF6B6B" />
                    <Text style={styles.errorBannerText}>{addrError}</Text>
                  </View>
                ) : null}
              </View>

              {/* Save */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAddress}>
                <LinearGradient colors={['#5B9AF5', '#06B6D4']} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>{editingAddrId ? 'Update Address' : 'Save Address'}</Text>
                </LinearGradient>
              </TouchableOpacity>

            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  memberPickerRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.screen, paddingVertical: spacing.md, backgroundColor: 'rgba(255,255,255,0.05)', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  memberChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1.5, borderColor: 'rgba(111,175,242,0.30)', backgroundColor: 'rgba(59,139,232,0.14)' },
  memberChipActive: { backgroundColor: '#6FAFF2', borderColor: '#6FAFF2' },
  memberChipText:   { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#6FAFF2' },
  memberChipTextActive: { color: '#fff' },
  // Header
  headerGradient:  { paddingBottom: 8 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.xxl + 20, paddingBottom: spacing.md },
  headerLabel:     { ...typography.micro, color: colors.text3, letterSpacing: 1.5, marginBottom: 3, fontSize: 10 },
  headerTitle:     { ...typography.h1, color: colors.text1, fontSize: 22 },
  headerSub:       { ...typography.caption, color: colors.text3, marginTop: 2 },
  addBtn:          { borderRadius: radius.md, overflow: 'hidden' },
  addBtnGrad:      { paddingHorizontal: 18, paddingVertical: 11, borderRadius: radius.md },
  addBtnText:      { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#fff' },

  // Stats
  statsRow:        { flexDirection: 'row', paddingHorizontal: spacing.screen, gap: 8, marginTop: spacing.md, marginBottom: spacing.md },
  statCard:        { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', ...shadows.sm },
  statNum:         { fontSize: 18, fontFamily: 'Inter_900Black', color: colors.text1, letterSpacing: -0.5 },
  statLbl:         { fontSize: 9,  fontFamily: 'Inter_700Bold',  color: colors.text3, marginTop: 1, textAlign: 'center' },
  statSub:         { fontSize: 8,  fontFamily: 'Inter_500Medium',color: colors.text3, marginTop: 1, textAlign: 'center' },

  // Banners
  warningBanner:   { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: 'rgba(245,192,83,0.12)', borderRadius: radius.lg, marginHorizontal: spacing.screen, marginBottom: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: '#F59E0B' },
  warningText:     { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(245,192,83,0.85)', lineHeight: 18 },
  infoBanner:      { flexDirection: 'row', gap: 10, backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.screen, marginBottom: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', ...shadows.sm },
  infoBannerIcon:  { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(59,139,232,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  infoBannerTitle: { ...typography.captionBold, color: colors.text1, marginBottom: 3 },
  infoBannerDesc:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text3, lineHeight: 17 },

  // Export
  cardTopRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 } as any,
  cardIconBox:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitle:        { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#F0F4FF', lineHeight: 19 },
  cardSub:          { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', marginTop: 1 },
  cardAddBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: 'rgba(115,103,240,0.3)', borderRadius: 10, paddingVertical: 9, marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.04)', alignSelf: 'stretch' } as any,
  cardAddBtnTxt:    { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  twoColRow:        { flexDirection: 'column', gap: 16, paddingHorizontal: spacing.screen, paddingBottom: 24 } as any,
  twoColRowWide:    { flexDirection: 'row' as any, alignItems: 'stretch' as any } as any,
  twoColCard:       { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', minWidth: 0, ...Platform.select({ web: { boxShadow: '0 2px 12px rgba(15,23,42,0.06)' } as any }) } as any,
  twoColCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' as any } as any,
  twoColCardTitle:  { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#F0F4FF', flex: 1 },
  miniExportBtn:    { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: 'rgba(115,103,240,0.3)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.04)' } as any,
  miniExportTxt:    { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#6FAFF2' },
  exportBtn:       { marginHorizontal: spacing.screen, marginBottom: spacing.lg, borderRadius: radius.lg, overflow: 'hidden', ...shadows.sm },
  exportBtnGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, paddingHorizontal: 20, borderRadius: radius.lg },
  exportBtnText:   { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  // Section
  section:         { paddingHorizontal: spacing.screen },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionLeft:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIconBox:  { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(59,139,232,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  sectionTitle:    { ...typography.h2, color: colors.text1, fontSize: 17 },
  toggleChip:      { backgroundColor: 'rgba(59,139,232,0.14)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  toggleChipText:  { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#6FAFF2' },

  // Empty
  emptyCard:       { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xxxl, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', ...shadows.sm },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(59,139,232,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  emptyTitle:      { ...typography.bodySemibold, color: colors.text2 },
  emptySubtitle:   { ...typography.caption, color: colors.text3, textAlign: 'center', marginTop: 4, maxWidth: 260 },

  // Trip card
  tripCard:        { backgroundColor: colors.card, borderRadius: radius.xl, marginBottom: spacing.md, overflow: 'hidden', flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', ...shadows.sm },
  tripStrip:       { width: 4 },
  tripContent:     { flex: 1, padding: spacing.lg },
  tripTopRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  tripIconBox:     { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tripCountry:     { ...typography.h3, color: colors.text1, fontSize: 15 },
  tripPurpose:     { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text3, marginTop: 2 },
  tripDaysBadge:   { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md, borderWidth: 1, minWidth: 52 },
  tripDaysNum:     { fontSize: 18, fontFamily: 'Inter_900Black', lineHeight: 20 },
  tripDaysLabel:   { fontSize: 9,  fontFamily: 'Inter_700Bold' },
  tripDateRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  tripDateItem:    { flex: 1 },
  tripDateHint:    { fontSize: 9,  fontFamily: 'Inter_700Bold', color: colors.text3, letterSpacing: 0.5 },
  tripDateVal:     { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text1, marginTop: 2 },
  tripMeta:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  tripMetaText:    { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text3 },
  tripNotes:       { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text3, fontStyle: 'italic', marginBottom: 8 },
  longAbsenceChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,107,107,0.14)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,107,107,0.30)' },
  longAbsenceText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#FF6B6B', flex: 1 },
  tripActions:     { flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  tripActionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)', backgroundColor: 'rgba(59,139,232,0.14)' },
  tripActionEdit:  { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#6FAFF2' },
  tripActionEditText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#6FAFF2' },
  tripActionDel:   { borderColor: colors.dangerLight, backgroundColor: colors.dangerLight },
  tripActionDelText:{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.danger },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(3,8,18,0.80)', justifyContent: IS_WEB ? 'center' : 'flex-end', alignItems: IS_WEB ? 'center' as any : 'stretch' as any },
  modalSheet:      { backgroundColor: '#0C1A34', borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: IS_WEB ? '90%' as any : '92%', height: IS_WEB ? 620 : undefined, maxWidth: IS_WEB ? 520 : undefined, width: IS_WEB ? 520 : '100%' as any, paddingBottom: 8, overflow: 'hidden', borderRadius: IS_WEB ? radius.xl : undefined, display: IS_WEB ? 'flex' as any : undefined, flexDirection: 'column', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', ...(Platform.OS === 'web' ? ({ boxShadow: '0 24px 64px rgba(0,0,0,0.55)' } as any) : {}) } as any,
  modalTrim:       { height: 3, backgroundColor: '#6FAFF2' },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalClose:      { padding: 4 },
  modalCancel:     { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text3 },
  modalTitle:      { ...typography.h3, color: colors.text1, fontSize: 16 },
  modalSave:       { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#6FAFF2' },
  modalBody:       { padding: spacing.screen, paddingBottom: 20 },

  // Form
  fieldLabel:      { ...typography.captionBold, color: colors.text2, marginBottom: 6, letterSpacing: 0.3 },
  fieldInput:      { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.20)', padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text1 },
  dateButton:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.20)' },
  dateButtonText:  { ...typography.bodySemibold, color: colors.text1 },
  pickerDone:      { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  purposeRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  purposeChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.20)', backgroundColor: colors.card },
  purposeChipActive:{ borderColor: '#6FAFF2', backgroundColor: 'rgba(59,139,232,0.14)' },
  purposeIcon:     { fontSize: 14 },
  purposeLabel:    { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.text2 },
  purposeLabelActive:{ color: '#6FAFF2' },
  durationPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(59,139,232,0.14)', borderRadius: radius.md, padding: 12, marginTop: 12, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  durationText:    { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#6FAFF2' },
  errorSlot:       { minHeight: 24, justifyContent: 'center' } as any,
  errorBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,107,107,0.10)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,107,107,0.30)' },
  errorBannerText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#FF6B6B', flex: 1 },
  saveBtn:         { borderRadius: radius.md, overflow: 'hidden', marginTop: 4 },
  saveBtnGrad:     { paddingVertical: 12, alignItems: 'center', borderRadius: radius.md },
  saveBtnText:     { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  addrInfoCard:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(91,154,245,0.10)', borderRadius: 12, padding: 10, marginHorizontal: 16, marginTop: 2, borderWidth: 1, borderColor: 'rgba(91,154,245,0.28)' },
  addrInfoIconCircle:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(91,154,245,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(91,154,245,0.32)', flexShrink: 0 },
  addrInfoTitle:       { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#0E7490', marginBottom: 1 },
  addrInfoSub:         { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#5B9AF5', lineHeight: 14 },
  addrFieldLabel:      { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.text2, marginBottom: 2, letterSpacing: 0.2 },
  addrFieldInput:      { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text1 },
  addrCurrentToggle:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'transparent', borderRadius: 10, padding: 8, marginTop: 4, marginBottom: 0, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)' },
  addrCurrentToggleActive:{ backgroundColor: 'rgba(91,154,245,0.15)', borderColor: 'rgba(91,154,245,0.35)' },
  addrToggleBox:         { width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  addrToggleBoxActive:   { backgroundColor: '#5B9AF5' },
  addrToggleLabel:       { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.text2 },
  addrToggleSub:         { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#5B9AF5', marginTop: 2 },
  addrCard:        { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' as any } as any,
  addrStrip:       { width: 3, borderRadius: 2, position: 'absolute' as any, left: 0, top: 0, bottom: 0 } as any,
  addrStreet:      { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF', flex: 1 },
  addrCity:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.75)', marginTop: 2 },
  addrCountryTxt:  { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.45)', marginTop: 1 },
  addrDates:       { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#5B9AF5', marginTop: 4 },
  addrDeleteBtn:   { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,107,107,0.10)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  currentBadge:    { backgroundColor: 'rgba(76,217,138,0.10)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#A7F3D0' },
  currentBadgeTxt: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#4CD98A' },
  emptyBox:        { alignItems: 'center', paddingVertical: 28, gap: 6 } as any,
  emptyBoxTitle:   { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#F0F4FF' },
  emptyBoxSub:     { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.45)', textAlign: 'center' as any, lineHeight: 18 },
});
