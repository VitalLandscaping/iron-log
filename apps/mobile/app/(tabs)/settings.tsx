import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { theme } from '@/constants/colors';
import { api, WorkoutTemplate, UserSettings } from '@/services/api';
import {
  registerForPushNotifications,
  getNotificationsEnabled,
  setNotificationsEnabled,
  getPlatform,
} from '@/services/notifications';

const PLATE_OPTIONS = [45, 35, 25, 10, 5, 2.5];

export default function SettingsScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingWorkouts, setExportingWorkouts] = useState(false);
  const [exportingBodyWeight, setExportingBodyWeight] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);

  // Local state for inputs (to avoid too many API calls)
  const [restTimerValue, setRestTimerValue] = useState(90);
  const [barWeightValue, setBarWeightValue] = useState('45');

  const loadData = async () => {
    try {
      const [templatesData, settingsData, notifEnabled] = await Promise.all([
        api.getTemplates(),
        api.getSettings(),
        getNotificationsEnabled(),
      ]);
      setTemplates(templatesData);
      setSettings(settingsData);
      setRestTimerValue(settingsData.defaultRestTimerSec);
      setBarWeightValue(settingsData.barWeight.toString());
      setNotificationsEnabledState(notifEnabled);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    try {
      const updated = await api.updateSettings({ [key]: value });
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleDeleteTemplate = (template: WorkoutTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteTemplate(template.id);
              setTemplates((prev) => prev.filter((t) => t.id !== template.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ],
    );
  };

  const togglePlate = (plate: number) => {
    if (!settings) return;
    const current = settings.availablePlates;
    const updated = current.includes(plate)
      ? current.filter((p) => p !== plate)
      : [...current, plate].sort((a, b) => b - a);
    updateSetting('availablePlates', updated);
  };

  const handleRestTimerChange = (value: number) => {
    setRestTimerValue(value);
  };

  const handleRestTimerComplete = () => {
    updateSetting('defaultRestTimerSec', restTimerValue);
  };

  const handleBarWeightChange = (text: string) => {
    setBarWeightValue(text);
  };

  const handleBarWeightComplete = () => {
    const value = parseFloat(barWeightValue) || 45;
    setBarWeightValue(value.toString());
    updateSetting('barWeight', value);
  };

  const exportCSV = async (type: 'workouts' | 'bodyweight') => {
    const setExporting = type === 'workouts' ? setExportingWorkouts : setExportingBodyWeight;
    setExporting(true);

    try {
      const csv = type === 'workouts'
        ? await api.exportWorkoutsCSV()
        : await api.exportBodyWeightCSV();

      const filename = type === 'workouts' ? 'iron-log-workouts.csv' : 'iron-log-bodyweight.csv';
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, csv);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `Export ${filename}`,
        });
      } else {
        Alert.alert('Export Complete', `File saved to ${fileUri}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    await setNotificationsEnabled(enabled);

    if (enabled) {
      // Re-register token
      const token = await registerForPushNotifications();
      if (token) {
        try {
          await api.registerDeviceToken(token, getPlatform());
        } catch (error) {
          console.error('Failed to register token:', error);
        }
      }
    } else {
      // Unregister token (optional - token will just not receive notifications from server)
      const token = await registerForPushNotifications();
      if (token) {
        try {
          await api.unregisterDeviceToken(token);
        } catch (error) {
          console.error('Failed to unregister token:', error);
        }
      }
    }
  };

  if (loading || !settings) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
    >
      {/* Workout Templates Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workout Templates</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/template-editor/new' as any)}
          >
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {templates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No templates yet</Text>
            <Text style={styles.emptySubtext}>
              Create templates for your favorite workouts
            </Text>
          </View>
        ) : (
          templates.map((template) => (
            <View key={template.id} style={styles.templateRow}>
              <TouchableOpacity
                style={styles.templateInfo}
                onPress={() => router.push(`/template-editor/${template.id}` as any)}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateMeta}>
                  {template.exerciseCount ?? template.exercises?.length ?? 0} exercises
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTemplate(template)}
              >
                <Text style={styles.deleteButtonText}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Nudge</Text>
            <Text style={styles.settingSubtext}>Random workout reminders 9am-9pm</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: theme.border, true: theme.accent + '66' }}
            thumbColor={notificationsEnabled ? theme.accent : theme.textMuted}
          />
        </View>
      </View>

      {/* Workout Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Preferences</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Default Rest Timer</Text>
            <Text style={styles.settingValue}>{restTimerValue}s</Text>
          </View>
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => {
                const newValue = Math.max(30, restTimerValue - 15);
                handleRestTimerChange(newValue);
                updateSetting('defaultRestTimerSec', newValue);
              }}
            >
              <Text style={styles.sliderButtonText}>-</Text>
            </TouchableOpacity>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  { width: `${((restTimerValue - 30) / 270) * 100}%` },
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.sliderButton}
              onPress={() => {
                const newValue = Math.min(300, restTimerValue + 15);
                handleRestTimerChange(newValue);
                updateSetting('defaultRestTimerSec', newValue);
              }}
            >
              <Text style={styles.sliderButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Keep Screen Awake</Text>
            <Text style={styles.settingSubtext}>During active workouts</Text>
          </View>
          <Switch
            value={settings.keepScreenAwake}
            onValueChange={(value) => updateSetting('keepScreenAwake', value)}
            trackColor={{ false: theme.border, true: theme.accent + '66' }}
            thumbColor={settings.keepScreenAwake ? theme.accent : theme.textMuted}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>RPE Tracking</Text>
            <Text style={styles.settingSubtext}>Show RPE column during workouts</Text>
          </View>
          <Switch
            value={settings.rpeTrackingEnabled}
            onValueChange={(value) => updateSetting('rpeTrackingEnabled', value)}
            trackColor={{ false: theme.border, true: theme.accent + '66' }}
            thumbColor={settings.rpeTrackingEnabled ? theme.accent : theme.textMuted}
          />
        </View>
      </View>

      {/* Plate Calculator Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plate Calculator</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Bar Weight (lbs)</Text>
          <TextInput
            style={styles.numberInput}
            value={barWeightValue}
            onChangeText={handleBarWeightChange}
            onBlur={handleBarWeightComplete}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Available Plates</Text>
        </View>
        <View style={styles.platesRow}>
          {PLATE_OPTIONS.map((plate) => {
            const isActive = settings.availablePlates.includes(plate);
            return (
              <TouchableOpacity
                key={plate}
                style={[styles.platePill, isActive && styles.platePillActive]}
                onPress={() => togglePlate(plate)}
              >
                <Text style={[styles.platePillText, isActive && styles.platePillTextActive]}>
                  {plate}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Data Export Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Export</Text>

        <TouchableOpacity
          style={[styles.exportButton, exportingWorkouts && styles.exportButtonDisabled]}
          onPress={() => exportCSV('workouts')}
          disabled={exportingWorkouts}
        >
          {exportingWorkouts ? (
            <ActivityIndicator color={theme.accent} size="small" />
          ) : (
            <>
              <Text style={styles.exportButtonText}>📊 Export Workouts CSV</Text>
              <Text style={styles.exportButtonSubtext}>All workout data with sets, weights, and PRs</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportButton, exportingBodyWeight && styles.exportButtonDisabled]}
          onPress={() => exportCSV('bodyweight')}
          disabled={exportingBodyWeight}
        >
          {exportingBodyWeight ? (
            <ActivityIndicator color={theme.accent} size="small" />
          ) : (
            <>
              <Text style={styles.exportButtonText}>⚖️ Export Body Weight CSV</Text>
              <Text style={styles.exportButtonSubtext}>All body weight entries</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
  },
  loadingText: {
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginTop: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  addButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: theme.bg,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
  emptyState: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 16,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  emptySubtext: {
    color: theme.textDim,
    fontSize: 12,
    fontFamily: 'SpaceMono',
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  templateMeta: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  settingSubtext: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: theme.accent,
    fontFamily: 'SpaceMono',
    marginTop: 4,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    fontSize: 18,
    color: theme.text,
    fontWeight: 'bold',
  },
  sliderTrack: {
    width: 80,
    height: 6,
    backgroundColor: theme.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 3,
  },
  numberInput: {
    backgroundColor: theme.border,
    color: theme.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'SpaceMono',
    width: 80,
    textAlign: 'center',
  },
  platesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  platePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  platePillActive: {
    backgroundColor: theme.accent + '22',
    borderColor: theme.accent,
  },
  platePillText: {
    fontSize: 14,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  platePillTextActive: {
    color: theme.accent,
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 15,
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  exportButtonSubtext: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  bottomSpacer: {
    height: 100,
  },
});
