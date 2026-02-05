import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { theme } from '@/constants/colors';

const RPE_REFERENCE = [
  { rpe: 10, meaning: 'Max effort, couldn\'t do another rep', rir: '0 RIR' },
  { rpe: 9.5, meaning: 'Maybe could do 1 more, not sure', rir: '0-1 RIR' },
  { rpe: 9, meaning: 'Could do 1 more rep', rir: '1 RIR' },
  { rpe: 8.5, meaning: 'Could definitely do 1, maybe 2', rir: '1-2 RIR' },
  { rpe: 8, meaning: 'Could do 2 more reps', rir: '2 RIR' },
  { rpe: 7.5, meaning: 'Could definitely do 2, maybe 3', rir: '2-3 RIR' },
  { rpe: 7, meaning: 'Could do 3 more reps', rir: '3 RIR' },
  { rpe: 6, meaning: 'Light effort, 4+ reps in reserve', rir: '4+ RIR' },
];

interface RPEInfoProps {
  visible: boolean;
  onClose: () => void;
}

export function RPEInfo({ visible, onClose }: RPEInfoProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>RPE Reference</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Rate of Perceived Exertion (RPE) measures how hard a set felt.
          </Text>

          <ScrollView style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.rpeColumn]}>RPE</Text>
              <Text style={[styles.headerCell, styles.meaningColumn]}>Meaning</Text>
              <Text style={[styles.headerCell, styles.rirColumn]}>RIR</Text>
            </View>

            {/* Table Rows */}
            {RPE_REFERENCE.map((row, index) => (
              <View
                key={row.rpe}
                style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
              >
                <View style={[styles.cell, styles.rpeColumn]}>
                  <Text style={styles.rpeValue}>{row.rpe}</Text>
                </View>
                <View style={[styles.cell, styles.meaningColumn]}>
                  <Text style={styles.meaningText}>{row.meaning}</Text>
                </View>
                <View style={[styles.cell, styles.rirColumn]}>
                  <Text style={styles.rirText}>{row.rir}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              RIR = Reps In Reserve (how many more you could have done)
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: theme.bg,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  closeButton: {
    fontSize: 28,
    color: theme.textMuted,
    padding: 4,
  },
  subtitle: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 16,
  },
  tableContainer: {
    maxHeight: 300,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 8,
    marginBottom: 4,
  },
  headerCell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderRadius: 6,
  },
  tableRowAlt: {
    backgroundColor: theme.card + '44',
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  rpeColumn: {
    width: 50,
    alignItems: 'center',
  },
  meaningColumn: {
    flex: 1,
  },
  rirColumn: {
    width: 60,
    alignItems: 'center',
  },
  rpeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.accent,
    fontFamily: 'SpaceMono',
  },
  meaningText: {
    fontSize: 12,
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  rirText: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  footerText: {
    fontSize: 11,
    color: theme.textDim,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
});
