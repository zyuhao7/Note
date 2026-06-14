import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Share, Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { listEntriesForExport, today } from '../db/queries';
import { toMarkdown, toJson } from '../lib/exporter';

type RangeKey = '7' | '30' | 'all';
const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7', label: '最近7天' },
  { key: '30', label: '最近30天' },
  { key: 'all', label: '全部' },
];

function sinceDay(range: RangeKey): string {
  if (range === 'all') return '0000-00-00';
  const days = range === '7' ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ExportScreen() {
  const [range, setRange] = useState<RangeKey>('7');
  const [format, setFormat] = useState<'md' | 'json'>('md');

  const output = useMemo(() => {
    const entries = listEntriesForExport(sinceDay(range));
    return format === 'md' ? toMarkdown(entries) : toJson(entries);
  }, [range, format]);

  async function copy() {
    await Clipboard.setStringAsync(output);
  }

  async function share() {
    try {
      await Share.share({ message: output });
    } catch {
      // 用户取消分享，忽略
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>时间范围</Text>
        <View style={styles.segRow}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.seg, range === r.key && styles.segActive]}
              onPress={() => setRange(r.key)}
            >
              <Text style={[styles.segText, range === r.key && styles.segTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>格式</Text>
        <View style={styles.segRow}>
          {(['md', 'json'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.seg, format === f && styles.segActive]}
              onPress={() => setFormat(f)}
            >
              <Text style={[styles.segText, format === f && styles.segTextActive]}>
                {f === 'md' ? '表格' : 'JSON'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>预览</Text>
        <View style={styles.preview}>
          <Text style={styles.previewText} selectable>{output}</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={copy}>
          <Text style={styles.btnGhostText}>📋 复制</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={share}>
          <Text style={styles.btnPrimaryText}>↗ 分享到…</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 20, paddingBottom: 100 },
  label: { fontSize: 15, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 8 },
  segRow: { flexDirection: 'row', gap: 8 },
  seg: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff',
    alignItems: 'center', borderWidth: 1, borderColor: '#eee',
  },
  segActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  segText: { color: '#666', fontSize: 14 },
  segTextActive: { color: '#3b82f6', fontWeight: '600' },
  preview: {
    backgroundColor: '#1e1e1e', borderRadius: 12, padding: 14, minHeight: 160,
  },
  previewText: { color: '#d4d4d4', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, lineHeight: 18 },
  actions: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28,
    backgroundColor: '#fafafa', borderTopWidth: 1, borderTopColor: '#eee',
  },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#3b82f6' },
  btnGhostText: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  btnPrimary: { backgroundColor: '#3b82f6' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
