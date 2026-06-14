import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listCategories, aggregateByDay, DayPoint } from '../db/queries';
import { Category } from '../db/schema';
import LineChart from '../components/LineChart';

type RangeKey = '7' | '30';
const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: '7', label: '近7天', days: 7 },
  { key: '30', label: '近30天', days: 30 },
];

function sinceDay(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function TrendScreen() {
  const { width } = useWindowDimensions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [catId, setCatId] = useState<number | null>(null);
  const [range, setRange] = useState<RangeKey>('7');

  useFocusEffect(
    useCallback(() => {
      const cats = listCategories();
      setCategories(cats);
      setCatId((prev) => prev ?? cats[0]?.id ?? null);
    }, [])
  );

  const days = RANGES.find((r) => r.key === range)!.days;
  const data: DayPoint[] = useMemo(
    () => (catId == null ? [] : aggregateByDay(catId, sinceDay(days))),
    [catId, days, range]
  );

  const selectedCat = categories.find((c) => c.id === catId);
  const total = data.reduce((s, d) => s + d.total, 0);
  const count = data.reduce((s, d) => s + d.count, 0);
  const isMoney = selectedCat?.kind === 'money';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>类别</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, catId === c.id && styles.chipActive]}
            onPress={() => setCatId(c.id)}
          >
            <Text style={[styles.chipText, catId === c.id && styles.chipTextActive]}>
              {c.icon} {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.segRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.seg, range === r.key && styles.segActive]}
            onPress={() => setRange(r.key)}
          >
            <Text style={[styles.segText, range === r.key && styles.segTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{isMoney ? `¥${total.toFixed(0)}` : total.toFixed(0)}</Text>
          <Text style={styles.statLabel}>合计</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{count}</Text>
          <Text style={styles.statLabel}>记录数</Text>
        </View>
      </View>

      <View style={styles.card}>
        <LineChart data={data} width={width - 64} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#444', marginBottom: 8 },
  chipRow: { flexDirection: 'row', marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff',
    marginRight: 8, borderWidth: 1, borderColor: '#eee',
  },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  chipText: { color: '#666', fontSize: 14 },
  chipTextActive: { color: '#3b82f6', fontWeight: '600' },
  segRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  seg: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff',
    alignItems: 'center', borderWidth: 1, borderColor: '#eee',
  },
  segActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  segText: { color: '#666', fontSize: 14 },
  segTextActive: { color: '#3b82f6', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stat: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  statLabel: { fontSize: 13, color: '#999', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, paddingLeft: 4 },
});
