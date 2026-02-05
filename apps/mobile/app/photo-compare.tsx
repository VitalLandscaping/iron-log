import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/colors';
import { api, ProgressPhoto } from '@/services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PhotoCompareScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [leftPhoto, setLeftPhoto] = useState<ProgressPhoto | null>(null);
  const [rightPhoto, setRightPhoto] = useState<ProgressPhoto | null>(null);
  const [selectingFor, setSelectingFor] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const data = await api.getPhotos();
      setPhotos(data);
      // Default: oldest on left, newest on right
      if (data.length >= 2) {
        setLeftPhoto(data[data.length - 1]); // oldest
        setRightPhoto(data[0]); // newest
      } else if (data.length === 1) {
        setLeftPhoto(data[0]);
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPhoto = (photo: ProgressPhoto) => {
    if (selectingFor === 'left') {
      setLeftPhoto(photo);
    } else if (selectingFor === 'right') {
      setRightPhoto(photo);
    }
    setSelectingFor(null);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'‹'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Compare Progress</Text>
      </View>

      {/* Comparison View */}
      <View style={styles.compareContainer}>
        {/* Left Photo (Before) */}
        <TouchableOpacity
          style={styles.photoSlot}
          onPress={() => setSelectingFor('left')}
        >
          {leftPhoto ? (
            <>
              <Image
                source={{ uri: leftPhoto.imageUrl }}
                style={styles.comparisonPhoto}
                resizeMode="cover"
              />
              <View style={styles.photoLabel}>
                <Text style={styles.photoLabelText}>Before</Text>
                <Text style={styles.photoDate}>{formatDate(leftPhoto.date)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.emptySlot}>
              <Text style={styles.emptySlotText}>Tap to select</Text>
              <Text style={styles.emptySlotLabel}>Before</Text>
            </View>
          )}
          <View style={styles.tapOverlay}>
            <Text style={styles.tapText}>Tap to change</Text>
          </View>
        </TouchableOpacity>

        {/* Right Photo (After) */}
        <TouchableOpacity
          style={styles.photoSlot}
          onPress={() => setSelectingFor('right')}
        >
          {rightPhoto ? (
            <>
              <Image
                source={{ uri: rightPhoto.imageUrl }}
                style={styles.comparisonPhoto}
                resizeMode="cover"
              />
              <View style={styles.photoLabel}>
                <Text style={styles.photoLabelText}>After</Text>
                <Text style={styles.photoDate}>{formatDate(rightPhoto.date)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.emptySlot}>
              <Text style={styles.emptySlotText}>Tap to select</Text>
              <Text style={styles.emptySlotLabel}>After</Text>
            </View>
          )}
          <View style={styles.tapOverlay}>
            <Text style={styles.tapText}>Tap to change</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Time Difference */}
      {leftPhoto && rightPhoto && (
        <View style={styles.timeDiffContainer}>
          <Text style={styles.timeDiffText}>
            {calculateTimeDiff(leftPhoto.date, rightPhoto.date)}
          </Text>
        </View>
      )}

      {/* Photo Picker Modal */}
      <Modal visible={selectingFor !== null} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectingFor === 'left' ? 'Before' : 'After'} Photo
              </Text>
              <TouchableOpacity onPress={() => setSelectingFor(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.photoPickerGrid}>
              {photos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    styles.pickerPhoto,
                    (photo.id === leftPhoto?.id || photo.id === rightPhoto?.id) &&
                      styles.pickerPhotoSelected,
                  ]}
                  onPress={() => handleSelectPhoto(photo)}
                >
                  <Image
                    source={{ uri: photo.imageUrl }}
                    style={styles.pickerImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.pickerDate}>{formatDate(photo.date)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function calculateTimeDiff(date1: string, date2: string): string {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Same day';
  if (diffDays === 1) return '1 day apart';
  if (diffDays < 7) return `${diffDays} days apart`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} apart`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} month${months > 1 ? 's' : ''} apart`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },

  // Header
  header: {
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: theme.accent,
    fontFamily: 'SpaceMono',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },

  // Compare Container
  compareContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 4,
  },
  photoSlot: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  comparisonPhoto: {
    width: '100%',
    height: '100%',
  },
  photoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    alignItems: 'center',
  },
  photoLabelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'SpaceMono',
  },
  photoDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'SpaceMono',
    marginTop: 2,
  },
  tapOverlay: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'SpaceMono',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  emptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 14,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  emptySlotLabel: {
    fontSize: 12,
    color: theme.textDim,
    fontFamily: 'SpaceMono',
    marginTop: 8,
  },

  // Time Diff
  timeDiffContainer: {
    padding: 16,
    alignItems: 'center',
  },
  timeDiffText: {
    fontSize: 14,
    color: theme.accentBlue,
    fontFamily: 'SpaceMono',
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  modalClose: {
    fontSize: 24,
    color: theme.textMuted,
    padding: 4,
  },
  photoPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  pickerPhoto: {
    width: (SCREEN_WIDTH - 48) / 3,
    aspectRatio: 3 / 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.card,
  },
  pickerPhotoSelected: {
    borderWidth: 2,
    borderColor: theme.accent,
  },
  pickerImage: {
    width: '100%',
    height: '100%',
  },
  pickerDate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    fontSize: 10,
    color: '#fff',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    paddingVertical: 4,
  },
});
