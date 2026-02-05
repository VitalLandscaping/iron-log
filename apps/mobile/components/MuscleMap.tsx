import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { theme, MUSCLE_COLORS } from '@/constants/colors';

interface MuscleMapProps {
  activity: Record<string, number>; // muscle group -> number of sets
  maxActivity?: number;
}

// Simplified muscle paths for front and back views
// These are scaled to fit in a 120x200 viewBox

const FRONT_MUSCLES = {
  Chest: 'M40,55 Q60,50 80,55 L80,75 Q60,80 40,75 Z',
  Shoulders: 'M30,50 Q35,45 40,50 L40,65 Q35,70 30,65 Z M80,50 Q85,45 90,50 L90,65 Q85,70 80,65 Z',
  Biceps: 'M25,70 Q28,68 30,70 L30,95 Q28,97 25,95 Z M90,70 Q92,68 95,70 L95,95 Q92,97 90,95 Z',
  Forearms: 'M22,100 Q25,98 28,100 L28,130 Q25,132 22,130 Z M92,100 Q95,98 98,100 L98,130 Q95,132 92,130 Z',
  Abs: 'M45,80 L75,80 L75,125 L45,125 Z',
  Quads: 'M40,130 L55,130 L55,175 L40,175 Z M65,130 L80,130 L80,175 L65,175 Z',
};

const BACK_MUSCLES = {
  Back: 'M40,55 Q60,50 80,55 L80,90 Q60,95 40,90 Z',
  Shoulders: 'M30,50 Q35,45 40,50 L40,65 Q35,70 30,65 Z M80,50 Q85,45 90,50 L90,65 Q85,70 80,65 Z',
  Triceps: 'M25,70 Q28,68 30,70 L30,95 Q28,97 25,95 Z M90,70 Q92,68 95,70 L95,95 Q92,97 90,95 Z',
  Forearms: 'M22,100 Q25,98 28,100 L28,130 Q25,132 22,130 Z M92,100 Q95,98 98,100 L98,130 Q95,132 92,130 Z',
  Glutes: 'M42,95 L58,95 L58,115 Q50,120 42,115 Z M62,95 L78,95 L78,115 Q70,120 62,115 Z',
  Hamstrings: 'M40,120 L55,120 L55,165 L40,165 Z M65,120 L80,120 L80,165 L65,165 Z',
  Calves: 'M42,170 L53,170 L53,195 Q47.5,198 42,195 Z M67,170 L78,170 L78,195 Q72.5,198 67,195 Z',
};

// Body outline paths
const BODY_OUTLINE = 'M60,10 Q75,10 75,25 Q80,30 80,40 L90,45 Q100,50 100,70 L98,100 L95,135 Q95,140 90,140 L85,140 Q80,140 80,145 L75,200 L65,200 L60,140 L55,200 L45,200 L40,145 Q40,140 35,140 L30,140 Q25,140 25,135 L22,100 L20,70 Q20,50 30,45 L40,40 Q40,30 45,25 Q45,10 60,10';

export default function MuscleMap({ activity, maxActivity }: MuscleMapProps) {
  const totalActivity = Object.values(activity).reduce((sum, val) => sum + val, 0);
  const max = maxActivity || Math.max(...Object.values(activity), 1);

  const getOpacity = (muscle: string): number => {
    const sets = activity[muscle] || 0;
    if (sets === 0) return 0.1;
    return Math.min(0.3 + (sets / max) * 0.7, 1);
  };

  const getMuscleColor = (muscle: string): string => {
    return MUSCLE_COLORS[muscle] || theme.textMuted;
  };

  const renderMuscles = (muscles: Record<string, string>, side: 'front' | 'back') => {
    return Object.entries(muscles).map(([muscle, path]) => (
      <Path
        key={`${side}-${muscle}`}
        d={path}
        fill={getMuscleColor(muscle)}
        opacity={getOpacity(muscle)}
        stroke={getMuscleColor(muscle)}
        strokeWidth={0.5}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.bodyContainer}>
        {/* Front View */}
        <View style={styles.bodyView}>
          <Text style={styles.viewLabel}>Front</Text>
          <Svg width={100} height={160} viewBox="10 5 100 200">
            <G>
              <Path d={BODY_OUTLINE} fill={theme.card} stroke={theme.border} strokeWidth={1} />
              {renderMuscles(FRONT_MUSCLES, 'front')}
            </G>
          </Svg>
        </View>

        {/* Back View */}
        <View style={styles.bodyView}>
          <Text style={styles.viewLabel}>Back</Text>
          <Svg width={100} height={160} viewBox="10 5 100 200">
            <G>
              <Path d={BODY_OUTLINE} fill={theme.card} stroke={theme.border} strokeWidth={1} />
              {renderMuscles(BACK_MUSCLES, 'back')}
            </G>
          </Svg>
        </View>
      </View>

      {/* Legend */}
      {totalActivity > 0 && (
        <View style={styles.legend}>
          {Object.entries(activity)
            .filter(([_, sets]) => sets > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([muscle, sets]) => (
              <View key={muscle} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: getMuscleColor(muscle) },
                  ]}
                />
                <Text style={styles.legendText}>
                  {muscle}: {sets}
                </Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  bodyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  bodyView: {
    alignItems: 'center',
  },
  viewLabel: {
    fontSize: 10,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
});
