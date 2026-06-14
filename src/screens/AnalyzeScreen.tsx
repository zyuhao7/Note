import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { listEntriesForExport } from '../db/queries';
import { toMarkdown } from '../lib/exporter';
import { loadAiConfig, chat, AiConfig } from '../lib/ai';

function sinceDay(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const SYSTEM_PROMPT =
  '你是一个贴心的个人数据分析助手。用户会给你一段他的日常记录，请用中文分析消费/行为趋势，指出值得注意的地方，并给出 2-4 条具体、可执行的建议。回答简洁，用要点。';

export default function AnalyzeScreen({ navigation }: any) {
  const [cfg, setCfg] = useState<AiConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAiConfig().then(setCfg);
  }, []);

  async function run() {
    if (!cfg) return;
    setLoading(true);
    setError('');
    setResult('');
    try {
      const entries = listEntriesForExport(sinceDay(30));
      if (entries.length === 0) {
        setError('最近30天还没有记录，先去记几条吧。');
        return;
      }
      const data = toMarkdown(entries);
      const reply = await chat(cfg, [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: data },
      ]);
      setResult(reply);
    } catch (e: any) {
      setError(e?.message ?? '调用失败');
    } finally {
      setLoading(false);
    }
  }

  if (cfg === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>还没配置 AI 服务</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('设置')}
        >
          <Text style={styles.primaryText}>去设置 API Key</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>让 AI 分析最近30天</Text>
      <Text style={styles.hint}>当前服务：{cfg.provider} · {cfg.model}</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={run} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>✨ 开始分析</Text>
        )}
      </TouchableOpacity>

      {error !== '' && <Text style={styles.error}>{error}</Text>}

      {result !== '' && (
        <View style={styles.resultCard}>
          <Text style={styles.resultText} selectable>{result}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fafafa' },
  title: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  hint: { fontSize: 14, color: '#999', marginBottom: 20 },
  primaryBtn: {
    backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#ef4444', marginTop: 16, fontSize: 14, lineHeight: 20 },
  resultCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 18, marginTop: 20,
    borderWidth: 1, borderColor: '#eee',
  },
  resultText: { fontSize: 15, color: '#1a1a1a', lineHeight: 24 },
});
