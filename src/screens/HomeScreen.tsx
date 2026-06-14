import React, { useState, useCallback } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { listEntries, today } from '../db/queries';
import { EntryWithCategory } from '../db/schema';

type Section = { title: string; day: string; data: EntryWithCategory[] };

function groupByDay(entries: EntryWithCategory[]): Section[] {
  const t = today();
  const map = new Map<string, EntryWithCategory[]>();
  for (const e of entries) {
    if (!map.has(e.day)) map.set(e.day, []);
    map.get(e.day)!.push(e);
  }
  return Array.from(map.entries()).map(([day, data]) => ({
    day,
    data,
    title: day === t ? `今天 ${day}` : day,
  }));
}

export default function HomeScreen({ navigation }: any) {
  const [sections, setSections] = useState<Section[]>([]);
  const insets = useSafeAreaInsets(); // 这页没有原生 header，自己避开状态栏

  const reload = useCallback(() => {
    setSections(groupByDay(listEntries()));
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>我的记录</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Export')}>
          <Text style={styles.headerBtn}>导出 ↗</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={sections.length === 0 && styles.emptyWrap}
        ListEmptyComponent={
          <Text style={styles.empty}>还没有记录{'\n'}点右下角 + 开始</Text>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>
            📅 {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate('Entry', { mode: 'edit', entryId: item.id })
            }
          >
            <Text style={styles.rowLabel}>
              {item.categoryIcon} {item.categoryName}
            </Text>
            <Text style={styles.rowValue}>
              {item.categoryKind === 'money' ? `¥${item.value}` : item.value}
            </Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Entry', { mode: 'new' })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  headerBtn: { fontSize: 15, color: '#3b82f6', fontWeight: '600' },
  sectionHeader: {
    fontSize: 14, fontWeight: '600', color: '#666',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 4,
    padding: 16, borderRadius: 12,
  },
  rowLabel: { fontSize: 16, color: '#1a1a1a' },
  rowValue: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#999', fontSize: 16, lineHeight: 26 },
  fab: {
    position: 'absolute', right: 24, bottom: 32,
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center', elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 32, lineHeight: 36 },
});
