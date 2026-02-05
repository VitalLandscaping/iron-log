import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { theme } from '@/constants/colors';
import { ProgressPhoto } from '@/services/api';

interface PhotoGridProps {
  photos: ProgressPhoto[];
  onPress: (photo: ProgressPhoto) => void;
  onDelete: (photo: ProgressPhoto) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMN_GAP = 4;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - 32 - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function PhotoGrid({ photos, onPress, onDelete }: PhotoGridProps) {
  const handleLongPress = (photo: ProgressPhoto) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(photo),
      },
    ]);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }: { item: ProgressPhoto }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => onPress(item)}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.photo} resizeMode="cover" />
      <View style={styles.dateOverlay}>
        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No photos yet</Text>
        <Text style={styles.emptySubtext}>Take your first progress photo</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={photos}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={styles.row}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    gap: COLUMN_GAP,
    marginBottom: COLUMN_GAP,
  },
  photoItem: {
    width: ITEM_WIDTH,
    aspectRatio: 3 / 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.card,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  dateText: {
    fontSize: 10,
    color: '#fff',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
  emptyContainer: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: theme.textDim,
    fontFamily: 'SpaceMono',
  },
});
