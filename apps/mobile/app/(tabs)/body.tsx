import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '@/constants/colors';
import { api, BodyWeight, ProgressPhoto } from '@/services/api';
import WeightChart from '@/components/WeightChart';
import PhotoGrid from '@/components/PhotoGrid';

type TimeFrame = '2W' | '1M' | '3M' | 'All';
const TIME_FRAME_DAYS: Record<TimeFrame, number | undefined> = {
  '2W': 14,
  '1M': 30,
  '3M': 90,
  All: undefined,
};

export default function BodyScreen() {
  const router = useRouter();
  const [weights, setWeights] = useState<BodyWeight[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [logging, setLogging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1M');
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);

  const loadData = async () => {
    try {
      const [weightsData, photosData] = await Promise.all([
        api.getBodyWeights(TIME_FRAME_DAYS[timeFrame]),
        api.getPhotos(),
      ]);
      setWeights(weightsData);
      setPhotos(photosData);
    } catch (error) {
      console.error('Failed to load body data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [timeFrame]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const latestWeight = weights[0];
  const today = new Date().toISOString().split('T')[0];
  const hasTodayEntry = latestWeight?.date === today;

  const handleLogWeight = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight');
      return;
    }

    setLogging(true);
    try {
      await api.logBodyWeight(weight);
      setWeightInput('');
      loadData();
    } catch (error) {
      console.error('Failed to log weight:', error);
      Alert.alert('Error', 'Failed to log weight');
    } finally {
      setLogging(false);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto(result.assets[0].uri);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    setUploading(true);
    try {
      await api.uploadPhoto(uri);
      loadData();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: ProgressPhoto) => {
    try {
      await api.deletePhoto(photo.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete photo:', error);
      Alert.alert('Error', 'Failed to delete photo');
    }
  };

  // Chart data
  const chartData = weights
    .map((w) => ({ date: w.date, weight: w.weight }))
    .reverse();

  // Stats
  const weightValues = weights.map((w) => w.weight);
  const minWeight = weightValues.length > 0 ? Math.min(...weightValues) : 0;
  const maxWeight = weightValues.length > 0 ? Math.max(...weightValues) : 0;
  const avgWeight =
    weightValues.length > 0
      ? (weightValues.reduce((a, b) => a + b, 0) / weightValues.length).toFixed(1)
      : '0';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      {/* Weight Logger Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight Logger</Text>

        <View style={styles.currentWeightCard}>
          {latestWeight ? (
            <>
              <Text style={styles.currentWeight}>{latestWeight.weight}</Text>
              <Text style={styles.currentWeightUnit}>lbs</Text>
              <Text style={styles.currentWeightDate}>
                {latestWeight.date === today ? 'Today' : formatDate(latestWeight.date)}
              </Text>
            </>
          ) : (
            <Text style={styles.noWeightText}>No weight logged yet</Text>
          )}
        </View>

        <View style={styles.logRow}>
          <TextInput
            style={styles.weightInput}
            value={weightInput}
            onChangeText={setWeightInput}
            placeholder="185.0"
            placeholderTextColor={theme.textDim}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity
            style={[styles.logButton, logging && styles.logButtonDisabled]}
            onPress={handleLogWeight}
            disabled={logging}
          >
            {logging ? (
              <ActivityIndicator color={theme.bg} size="small" />
            ) : (
              <Text style={styles.logButtonText}>{hasTodayEntry ? 'Update' : 'Log'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Weight Chart Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weight Trend</Text>
          <View style={styles.timeFrameToggle}>
            {(['2W', '1M', '3M', 'All'] as TimeFrame[]).map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[styles.timeFrameButton, timeFrame === tf && styles.timeFrameButtonActive]}
                onPress={() => setTimeFrame(tf)}
              >
                <Text
                  style={[styles.timeFrameText, timeFrame === tf && styles.timeFrameTextActive]}
                >
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <WeightChart data={chartData} />

        {weightValues.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{minWeight}</Text>
              <Text style={styles.statLabel}>Min</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{avgWeight}</Text>
              <Text style={styles.statLabel}>Avg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{maxWeight}</Text>
              <Text style={styles.statLabel}>Max</Text>
            </View>
          </View>
        )}
      </View>

      {/* Progress Photos Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress Photos</Text>
          <View style={styles.photoButtons}>
            {photos.length >= 2 && (
              <TouchableOpacity
                style={styles.compareButton}
                onPress={() => router.push('/photo-compare' as any)}
              >
                <Text style={styles.compareButtonText}>Compare</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.photoActions}>
          <TouchableOpacity
            style={[styles.photoActionButton, uploading && styles.photoActionButtonDisabled]}
            onPress={handleTakePhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={theme.accent} size="small" />
            ) : (
              <Text style={styles.photoActionText}>📸 Take Photo</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoActionButton, uploading && styles.photoActionButtonDisabled]}
            onPress={handlePickPhoto}
            disabled={uploading}
          >
            <Text style={styles.photoActionText}>🖼️ Choose</Text>
          </TouchableOpacity>
        </View>

        <PhotoGrid
          photos={photos}
          onPress={(photo) => setSelectedPhoto(photo)}
          onDelete={handleDeletePhoto}
        />
      </View>

      <View style={styles.bottomSpacer} />

      {/* Full Screen Photo Modal */}
      <Modal visible={selectedPhoto !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedPhoto(null)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.imageUrl }}
                style={styles.fullScreenPhoto}
                resizeMode="contain"
              />
              <Text style={styles.modalDate}>{formatDate(selectedPhoto.date)}</Text>
            </>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },

  // Current Weight
  currentWeightCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  currentWeight: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.accent,
    fontFamily: 'SpaceMono',
  },
  currentWeightUnit: {
    fontSize: 16,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginTop: -4,
  },
  currentWeightDate: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginTop: 8,
  },
  noWeightText: {
    fontSize: 16,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },

  // Log Row
  logRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weightInput: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    color: theme.text,
    fontFamily: 'SpaceMono',
    borderWidth: 1,
    borderColor: theme.border,
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logButtonDisabled: {
    opacity: 0.6,
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.bg,
    fontFamily: 'SpaceMono',
  },

  // Time Frame Toggle
  timeFrameToggle: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: 8,
    padding: 2,
  },
  timeFrameButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeFrameButtonActive: {
    backgroundColor: theme.accent,
  },
  timeFrameText: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
  },
  timeFrameTextActive: {
    color: theme.bg,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  statLabel: {
    fontSize: 10,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Photo Buttons
  photoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  compareButton: {
    backgroundColor: theme.accentBlue + '33',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  compareButtonText: {
    fontSize: 12,
    color: theme.accentBlue,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },

  // Photo Actions
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  photoActionButton: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  photoActionButtonDisabled: {
    opacity: 0.6,
  },
  photoActionText: {
    fontSize: 14,
    color: theme.text,
    fontFamily: 'SpaceMono',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalCloseText: {
    fontSize: 28,
    color: '#fff',
  },
  fullScreenPhoto: {
    width: '90%',
    height: '70%',
  },
  modalDate: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'SpaceMono',
    marginTop: 16,
  },

  bottomSpacer: {
    height: 100,
  },
});
