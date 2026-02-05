import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { theme } from '@/constants/colors';

interface DataPoint {
  date: string;
  weight: number;
}

interface WeightChartProps {
  data: DataPoint[];
}

const CHART_HEIGHT = 180;
const CHART_PADDING = { top: 20, right: 20, bottom: 30, left: 50 };

export default function WeightChart({ data }: WeightChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width - 32; // Account for parent padding
  const chartWidth = screenWidth - CHART_PADDING.left - CHART_PADDING.right;
  const chartHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const weights = data.map((d) => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;

  // Add padding to the range
  const paddedMin = Math.floor(minWeight - weightRange * 0.1);
  const paddedMax = Math.ceil(maxWeight + weightRange * 0.1);
  const paddedRange = paddedMax - paddedMin || 1;

  // Calculate points
  const points = data.map((d, i) => {
    const x = CHART_PADDING.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y =
      CHART_PADDING.top + chartHeight - ((d.weight - paddedMin) / paddedRange) * chartHeight;
    return { x, y, ...d };
  });

  // Create path
  const pathData = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  // Y-axis labels (3 labels)
  const yLabels = [paddedMin, Math.round((paddedMin + paddedMax) / 2), paddedMax];

  // X-axis labels (first and last date)
  const xLabels =
    data.length > 1
      ? [
          { x: CHART_PADDING.left, label: formatDate(data[0].date) },
          { x: CHART_PADDING.left + chartWidth, label: formatDate(data[data.length - 1].date) },
        ]
      : [{ x: CHART_PADDING.left + chartWidth / 2, label: formatDate(data[0].date) }];

  return (
    <View style={styles.container}>
      <Svg width={screenWidth} height={CHART_HEIGHT}>
        {/* Grid lines */}
        {yLabels.map((label, i) => {
          const y =
            CHART_PADDING.top + chartHeight - ((label - paddedMin) / paddedRange) * chartHeight;
          return (
            <Line
              key={i}
              x1={CHART_PADDING.left}
              y1={y}
              x2={CHART_PADDING.left + chartWidth}
              y2={y}
              stroke={theme.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Y-axis labels */}
        {yLabels.map((label, i) => {
          const y =
            CHART_PADDING.top + chartHeight - ((label - paddedMin) / paddedRange) * chartHeight;
          return (
            <SvgText
              key={i}
              x={CHART_PADDING.left - 8}
              y={y + 4}
              fill={theme.textMuted}
              fontSize={10}
              textAnchor="end"
            >
              {label}
            </SvgText>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((item, i) => (
          <SvgText
            key={i}
            x={item.x}
            y={CHART_HEIGHT - 8}
            fill={theme.textMuted}
            fontSize={10}
            textAnchor={i === 0 ? 'start' : data.length > 1 ? 'end' : 'middle'}
          >
            {item.label}
          </SvgText>
        ))}

        {/* Line */}
        <Path d={pathData} stroke={theme.accent} strokeWidth={2} fill="none" />

        {/* Data points */}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={theme.accent} />
        ))}
      </Svg>
    </View>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
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
  },
});
