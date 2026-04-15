// ═══════════════════════════════════════════════════════════════
// TravelScreen — I-94 Travel History & N-400 PDF Export
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Platform, FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { IS_WEB } from '../utils/responsive';
import { useDialog } from '../components/ConfirmDialog';
import { useStore } from '../store';
import { TravelTrip, TripPurpose } from '../types';
import {
  getTripDays, getTotalDaysAbroad, filterLast5Years, sortByDateDesc,
  formatDateShort, getTripColor, isLongAbsence, PURPOSE_LABELS, PURPOSE_ICONS,
} from '../utils/travel';
import { exportTravelPdf } from '../utils/travelPdf';
import { exportAddressPdf } from '../utils/addressPdf';
import { AddressEntry } from '../types';

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
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {IS_WEB ? (
      <input
        type="date"
        value={value.toISOString().split('T')[0]}
        onChange={(e: any) => {
          if (e.target.value && onChange) onChange(new Date(e.target.value + 'T12:00:00'));
        }}
        style={{
          width: '100%', padding: '12px 14px', fontSize: '15px',
          fontFamily: 'Inter_400Regular', color: '#111827',
          border: '1.5px solid #E5E7EB', borderRadius: '10px',
          backgroundColor: '#fff', outline: 'none', cursor: 'pointer',
          boxSizing: 'border-box',
        } as any}
      />
    ) : (
      <TouchableOpacity style={styles.dateButton} onPress={onPress}>
        <Text style={styles.dateButtonText}>
          {value.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={'#7367F0'} />
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

  return (
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
            <Ionicons name="warning-outline" size={12} color="#DC2626" />
            <Text style={styles.longAbsenceText}>Long absence — may affect continuous residence</Text>
          </View>
        )}

        <View style={styles.tripActions}>
          <TouchableOpacity style={styles.tripActionBtn} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={13} color={'#7367F0'} />
            <Text style={styles.tripActionEdit}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tripActionBtn, styles.tripActionDel]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={13} color={colors.danger} />
            <Text style={styles.tripActionDelText}>Remove</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────
export const TravelScreen: React.FC = () => {
  const trips     = useStore((s) => s.trips);
  const addTrip   = useStore((s) => s.addTrip);
  const removeTrip = useStore((s) => s.removeTrip);
  const updateTrip = useStore((s) => s.updateTrip);

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
  const dialog = useDialog();

  // ── Address History ────────────────────────────────────────
  const addressHistory = useStore((s) => s.addressHistory);
  const addAddress     = useStore((s) => s.addAddress);
  const removeAddress  = useStore((s) => s.removeAddress);

  const [showAddrModal,    setShowAddrModal]    = useState(false);
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

  const resetAddrForm = () => {
    setAddrStreet(''); setAddrApt(''); setAddrCity('');
    setAddrState(''); setAddrZip(''); setAddrCountry('United States');
    setAddrFrom(new Date()); setAddrTo(new Date());
    setAddrCurrent(false); setEditingAddrId(null); setAddrActivePicker(null);
  };

  const handleSaveAddress = () => {
    if (!addrStreet.trim() || !addrCity.trim() || !addrState.trim()) {
      dialog.alert('Missing Fields', 'Please fill in street, city, and state.');
      return;
    }
    const entry: AddressEntry = {
      id:               editingAddrId ?? `addr_${Date.now()}`,
      street:           addrStreet.trim(),
      apt:              addrApt.trim() || undefined,
      city:             addrCity.trim(),
      state:            addrState.trim(),
      zipCode:          addrZip.trim(),
      country:          addrCountry.trim() || 'United States',
      dateFrom:         addrFrom.toISOString().split('T')[0],
      dateTo:           addrCurrent ? 'present' : addrTo.toISOString().split('T')[0],
      isCurrentAddress: addrCurrent,
      createdAt:        new Date().toISOString(),
    };
    addAddress(entry);
    setShowAddrModal(false);
    resetAddrForm();
  };

  const handleExportAddressPdf = () => {
    if (addressHistory.length === 0) {
      dialog.alert('No Addresses', 'Add at least one address before exporting.');
      return;
    }
    setExportingAddr(true);
    try { exportAddressPdf(addressHistory); } finally { setExportingAddr(false); }
  };

  const sorted    = sortByDateDesc(trips);
  const last5     = filterLast5Years(trips);
  const abroad5   = getTotalDaysAbroad(last5);
  const abroadAll = getTotalDaysAbroad(trips);
  const inUS5     = Math.max(0, 5 * 365 - abroad5);
  const hasLong   = last5.some(isLongAbsence);
  const displayed = showAll ? sorted : sortByDateDesc(last5);

  const resetForm = () => {
    setCountry(''); setPortOfEntry(''); setNotes('');
    setPurpose('vacation');
    setDeparture(new Date()); setReturnDate(new Date());
    setEditingId(null); setActivePicker(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

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
    if (!country.trim()) { dialog.alert('Country required', 'Please enter the destination country.'); return; }
    if (returnDate < departure) { dialog.alert('Invalid dates', 'Return date must be on or after departure date.'); return; }

    const entry = {
      country:       country.trim(),
      portOfEntry:   portOfEntry.trim(),
      notes:         notes.trim(),
      purpose,
      departureDate: departure.toISOString().split('T')[0],
      returnDate:    returnDate.toISOString().split('T')[0],
    };

    if (editingId) {
      updateTrip(editingId, entry);
    } else {
      addTrip({ id: Date.now().toString(), createdAt: new Date().toISOString(), ...entry });
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string, country: string) => {
    dialog.confirm({ title: 'Remove Trip', message: `Remove trip to ${country}?`,
      type: 'danger', confirmLabel: 'Remove', onConfirm: () => removeTrip(id) });
  };

  const handleExport = async () => {
    if (trips.length === 0) { dialog.alert('No trips', 'Add at least one trip before exporting.'); return; }
    setExporting(true);
    try {
      await exportTravelPdf(trips);
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
    <View style={{ flex: 1, backgroundColor: '#F4F5FA' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={true}>

        {/* Header */}
        <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={styles.headerGradient}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>TRAVEL HISTORY</Text>
              <Text style={styles.headerTitle}>I-94 Tracker</Text>
              <Text style={styles.headerSub}>{trips.length} trip{trips.length !== 1 ? 's' : ''} recorded · N-400 ready</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
              <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.addBtnGrad}>
                <Text style={styles.addBtnText}>+ Trip</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

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
            <Ionicons name="warning-outline" size={16} color="#92400E" />
            <Text style={styles.warningText}>
              A trip in the last 5 years exceeded 180 days. This may affect continuous residence for naturalization. Consult an immigration attorney.
            </Text>
          </View>
        )}

        {/* N-400 info banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIcon}>
            <Ionicons name="information-circle-outline" size={18} color={'#7367F0'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoBannerTitle}>N-400 Part 8 — Travel Outside the US</Text>
            <Text style={styles.infoBannerDesc}>
              Record all trips abroad for the last 5 years, then export as PDF to attach to your naturalization application.
            </Text>
          </View>
        </View>

        {/* Export button */}
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExport}
          activeOpacity={0.8}
          disabled={exporting}
        >
          <LinearGradient colors={['#0E2137', '#0A1628']} style={styles.exportBtnGrad}>
            <Ionicons name={exporting ? 'hourglass-outline' : 'document-text-outline'} size={18} color={'#7367F0'} />
            <Text style={styles.exportBtnText}>{exporting ? 'Generating PDF…' : 'Export PDF — N-400 Ready'}</Text>
            {!exporting && <Ionicons name="share-outline" size={16} color={'#7367F0'} />}
          </LinearGradient>
        </TouchableOpacity>

        {/* Trip list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLeft}>
              <View style={styles.sectionIconBox}>
                <Ionicons name="airplane-outline" size={15} color={'#7367F0'} />
              </View>
              <Text style={styles.sectionTitle}>
                {showAll ? 'All Trips' : 'Last 5 Years'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowAll(!showAll)} style={styles.toggleChip}>
              <Text style={styles.toggleChipText}>{showAll ? 'Show 5-yr' : 'Show all'}</Text>
            </TouchableOpacity>
          </View>

          {displayed.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Text style={{ fontSize: 28 }}>✈️</Text>
              </View>
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
        </View>

        {/* ══ ADDRESS HISTORY — I-485 Part 3 ══ */}
        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginHorizontal: spacing.screen, marginVertical: spacing.xl }} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLeft}>
              <View style={[styles.sectionIconBox, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name="home-outline" size={14} color="#0891B2" />
              </View>
              <Text style={styles.sectionTitle}>Address History</Text>
            </View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0891B2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 } as any}
              onPress={() => { resetAddrForm(); setShowAddrModal(true); }}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={styles.addBtnText}>Add Address</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.infoBanner, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <Ionicons name="document-text-outline" size={16} color="#0891B2" style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoBannerTitle, { color: '#0C4A6E' }]}>I-485 Part 3 — Address History</Text>
              <Text style={[styles.infoBannerText, { color: '#0369A1' }]}>
                List all addresses where you have lived for the last 5 years (or since age 14). Required for Form I-485 Adjustment of Status.
              </Text>
            </View>
          </View>

          {addressHistory.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="home-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyBoxTitle}>No addresses yet</Text>
              <Text style={styles.emptyBoxSub}>Add your current and past addresses for I-485 filing</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {[...addressHistory]
                .sort((a, b) => (a.isCurrentAddress ? -1 : b.isCurrentAddress ? 1 : b.dateFrom.localeCompare(a.dateFrom)))
                .map((entry) => (
                  <View key={entry.id} style={styles.addrCard}>
                    <View style={[styles.addrStrip, { backgroundColor: entry.isCurrentAddress ? '#059669' : '#0891B2' }]} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {entry.isCurrentAddress && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeTxt}>Current</Text>
                          </View>
                        )}
                        <Text style={styles.addrStreet} numberOfLines={1}>
                          {entry.street}{entry.apt ? `, ${entry.apt}` : ''}
                        </Text>
                      </View>
                      <Text style={styles.addrCity}>{entry.city}, {entry.state} {entry.zipCode}</Text>
                      {entry.country !== 'United States' && (
                        <Text style={styles.addrCountryTxt}>{entry.country}</Text>
                      )}
                      <Text style={styles.addrDates}>
                        {entry.dateFrom.slice(5,7)}/{entry.dateFrom.slice(0,4)} → {entry.isCurrentAddress ? 'Present' : `${entry.dateTo.slice(5,7)}/${entry.dateTo.slice(0,4)}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addrDeleteBtn}
                      onPress={() => dialog.confirm({ title: 'Delete Address', message: 'Remove this address entry?', type: 'danger', confirmLabel: 'Delete', cancelLabel: 'Cancel', onConfirm: () => removeAddress(entry.id) })}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))
              }
            </View>
          )}

          {addressHistory.length > 0 && (
            <TouchableOpacity style={[styles.exportBtn, { marginTop: 16 }]} onPress={handleExportAddressPdf} activeOpacity={0.85}>
              <LinearGradient colors={['#0891B2', '#06B6D4']} style={styles.exportBtnGrad}>
                <Ionicons name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.exportBtnText}>{exportingAddr ? 'Generating PDF…' : 'Export PDF — I-485 Ready'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* ═══ ADD / EDIT TRIP MODAL ═══ */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Gold trim */}
            <View style={styles.modalTrim} />

            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Trip' : 'Add Trip'}</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Dates */}
              <DateField label="Departure Date" value={departure} onPress={() => setActivePicker('departure')} onChange={setDeparture} />
              <DateField label="Return Date"    value={returnDate} onPress={() => setActivePicker('return')} onChange={setReturnDate} />

              {!IS_WEB && activePicker && (
                <DateTimePicker
                  value={activePicker === 'departure' ? departure : returnDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}
              {Platform.OS === 'ios' && activePicker && (
                <TouchableOpacity style={styles.pickerDone} onPress={() => setActivePicker(null)}>
                  <Text style={{ color: '#7367F0', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Done</Text>
                </TouchableOpacity>
              )}

              {/* Country */}
              <Text style={styles.fieldLabel}>Destination Country *</Text>
              <TextInput
                style={styles.fieldInput}
                value={country}
                onChangeText={setCountry}
                placeholder="e.g., India, Mexico, Canada"
                placeholderTextColor={colors.text3}
                autoCapitalize="words"
              />

              {/* Port of Entry */}
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Port of Entry (on return)</Text>
              <TextInput
                style={styles.fieldInput}
                value={portOfEntry}
                onChangeText={setPortOfEntry}
                placeholder="e.g., JFK, LAX, Chicago O'Hare"
                placeholderTextColor={colors.text3}
                autoCapitalize="characters"
              />

              {/* Purpose */}
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Purpose of Trip</Text>
              <View style={styles.purposeRow}>
                {PURPOSES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.purposeChip, purpose === p && styles.purposeChipActive]}
                    onPress={() => setPurpose(p)}
                  >
                    <Text style={styles.purposeIcon}>{PURPOSE_ICONS[p]}</Text>
                    <Text style={[styles.purposeLabel, purpose === p && styles.purposeLabelActive]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 72, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g., Extended family visit, work project in London"
                placeholderTextColor={colors.text3}
                multiline
                maxLength={200}
              />

              {/* Duration preview */}
              {returnDate >= departure && (
                <View style={styles.durationPreview}>
                  <Ionicons name="timer-outline" size={14} color={'#7367F0'} />
                  <Text style={styles.durationText}>
                    {getTripDays({ departureDate: departure.toISOString().split('T')[0], returnDate: returnDate.toISOString().split('T')[0] } as TravelTrip)} days outside the US
                    {getTripDays({ departureDate: departure.toISOString().split('T')[0], returnDate: returnDate.toISOString().split('T')[0] } as TravelTrip) >= 180
                      ? ' ⚠️ Long absence'
                      : ''}
                  </Text>
                </View>
              )}

              {/* Save button */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>{editingId ? 'Update Trip' : 'Add Trip'}</Text>
                </LinearGradient>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ ADD ADDRESS MODAL ═══ */}
      <Modal visible={showAddrModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Cyan trim matching I-485 theme */}
            <View style={[styles.modalTrim, { backgroundColor: '#0891B2' }]} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Address</Text>
              <TouchableOpacity onPress={() => { setShowAddrModal(false); resetAddrForm(); }} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={colors.text2} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: spacing.screen, paddingTop: 12, gap: 10 } as any}>

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
                    color={addrCurrent ? '#fff' : colors.text3}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.addrToggleLabel, addrCurrent && { color: '#0891B2' }]}>
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

              {/* Save */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAddress}>
                <LinearGradient colors={['#0891B2', '#06B6D4']} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>Save Address</Text>
                </LinearGradient>
              </TouchableOpacity>

            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
  statCard:        { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#DBDADE', ...shadows.sm },
  statNum:         { fontSize: 18, fontFamily: 'Inter_900Black', color: colors.text1, letterSpacing: -0.5 },
  statLbl:         { fontSize: 9,  fontFamily: 'Inter_700Bold',  color: colors.text3, marginTop: 1, textAlign: 'center' },
  statSub:         { fontSize: 8,  fontFamily: 'Inter_500Medium',color: colors.text3, marginTop: 1, textAlign: 'center' },

  // Banners
  warningBanner:   { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#FEF3C7', borderRadius: radius.lg, marginHorizontal: spacing.screen, marginBottom: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: '#F59E0B' },
  warningText:     { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', color: '#78350F', lineHeight: 18 },
  infoBanner:      { flexDirection: 'row', gap: 10, backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.screen, marginBottom: spacing.md, padding: spacing.lg, borderWidth: 1, borderColor: '#DBDADE', ...shadows.sm },
  infoBannerIcon:  { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  infoBannerTitle: { ...typography.captionBold, color: colors.text1, marginBottom: 3 },
  infoBannerDesc:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text3, lineHeight: 17 },

  // Export
  exportBtn:       { marginHorizontal: spacing.screen, marginBottom: spacing.lg, borderRadius: radius.lg, overflow: 'hidden', ...shadows.sm },
  exportBtnGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, paddingHorizontal: 20, borderRadius: radius.lg },
  exportBtnText:   { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  // Section
  section:         { paddingHorizontal: spacing.screen },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionLeft:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIconBox:  { width: 26, height: 26, borderRadius: 8, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  sectionTitle:    { ...typography.h2, color: colors.text1, fontSize: 17 },
  toggleChip:      { backgroundColor: '#F0EEFF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  toggleChipText:  { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#7367F0' },

  // Empty
  emptyCard:       { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xxxl, alignItems: 'center', borderWidth: 1, borderColor: '#DBDADE', ...shadows.sm },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  emptyTitle:      { ...typography.bodySemibold, color: colors.text2 },
  emptySubtitle:   { ...typography.caption, color: colors.text3, textAlign: 'center', marginTop: 4, maxWidth: 260 },

  // Trip card
  tripCard:        { backgroundColor: colors.card, borderRadius: radius.xl, marginBottom: spacing.md, overflow: 'hidden', flexDirection: 'row', borderWidth: 1, borderColor: '#DBDADE', ...shadows.sm },
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
  longAbsenceChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8, borderWidth: 1, borderColor: '#FECACA' },
  longAbsenceText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#DC2626', flex: 1 },
  tripActions:     { flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  tripActionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)', backgroundColor: '#F0EEFF' },
  tripActionEdit:  { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#7367F0' },
  tripActionDel:   { borderColor: colors.dangerLight, backgroundColor: colors.dangerLight },
  tripActionDelText:{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.danger },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: colors.overlay, justifyContent: IS_WEB ? 'center' : 'flex-end', alignItems: IS_WEB ? 'center' as any : 'stretch' as any },
  modalSheet:      { backgroundColor: '#F4F5FA', borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: IS_WEB ? '80%' as any : '92%', maxWidth: IS_WEB ? 520 : undefined, width: IS_WEB ? 520 : '100%' as any, paddingBottom: 40, overflow: 'hidden', borderRadius: IS_WEB ? radius.xl : undefined, display: IS_WEB ? 'flex' as any : undefined, flexDirection: 'column' } as any,
  modalTrim:       { height: 3, backgroundColor: '#7367F0' },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalCancel:     { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text3 },
  modalTitle:      { ...typography.h3, color: colors.text1, fontSize: 16 },
  modalSave:       { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#7367F0' },
  modalBody:       { padding: spacing.screen, paddingBottom: 20 },

  // Form
  fieldLabel:      { ...typography.captionBold, color: colors.text2, marginBottom: 6, letterSpacing: 0.3 },
  fieldInput:      { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: '#DBDADE', padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text1 },
  dateButton:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: '#DBDADE' },
  dateButtonText:  { ...typography.bodySemibold, color: colors.text1 },
  pickerDone:      { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  purposeRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  purposeChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: '#DBDADE', backgroundColor: colors.card },
  purposeChipActive:{ borderColor: '#7367F0', backgroundColor: '#F0EEFF' },
  purposeIcon:     { fontSize: 14 },
  purposeLabel:    { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.text2 },
  purposeLabelActive:{ color: '#7367F0' },
  durationPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0EEFF', borderRadius: radius.md, padding: 12, marginTop: 12, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  durationText:    { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#7367F0' },
  saveBtn:         { borderRadius: radius.md, overflow: 'hidden', marginTop: 20 },
  saveBtnGrad:     { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  saveBtnText:     { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF' },
  addrFieldLabel:      { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.text2, marginBottom: 4, letterSpacing: 0.2 },
  addrFieldInput:      { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 9, fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text1 },
  addrCurrentToggle:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFF', borderRadius: 12, padding: 14, marginTop: 16, marginBottom: 4, borderWidth: 1.5, borderColor: '#E2E8F0' },
  addrCurrentToggleActive:{ backgroundColor: '#F0F9FF', borderColor: '#67E8F9' },
  addrToggleBox:         { width: 26, height: 26, borderRadius: 8, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  addrToggleBoxActive:   { backgroundColor: '#0891B2' },
  addrToggleLabel:       { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text2 },
  addrToggleSub:         { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#0891B2', marginTop: 2 },
  addrCard:        { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' as any } as any,
  addrStrip:       { width: 3, borderRadius: 2, position: 'absolute' as any, left: 0, top: 0, bottom: 0 } as any,
  addrStreet:      { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#0F172A', flex: 1 },
  addrCity:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#475569', marginTop: 2 },
  addrCountryTxt:  { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#94A3B8', marginTop: 1 },
  addrDates:       { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#0891B2', marginTop: 4 },
  addrDeleteBtn:   { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  currentBadge:    { backgroundColor: '#ECFDF5', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#A7F3D0' },
  currentBadgeTxt: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#059669' },
  emptyBox:        { alignItems: 'center', paddingVertical: 28, gap: 6 } as any,
  emptyBoxTitle:   { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  emptyBoxSub:     { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#94A3B8', textAlign: 'center' as any, lineHeight: 18 },
});
