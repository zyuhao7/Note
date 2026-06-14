import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadAiConfig, saveAiConfig, clearAiConfig, PROVIDERS, AiConfig } from '../lib/ai';

type Provider = AiConfig['provider'];

export default function SettingsScreen() {
  const [provider, setProvider] = useState<Provider>('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<string>(PROVIDERS.deepseek.defaultModel);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAiConfig().then((cfg) => {
        if (cfg) {
          setProvider(cfg.provider);
          setApiKey(cfg.apiKey);
          setModel(cfg.model);
          setSaved(true);
        }
      });
    }, [])
  );

  function pickProvider(p: Provider) {
    setProvider(p);
    setModel(PROVIDERS[p].defaultModel);
  }

  async function save() {
    if (!apiKey.trim()) {
      Alert.alert('请填写 API Key');
      return;
    }
    await saveAiConfig({ provider, apiKey: apiKey.trim(), model: model.trim() });
    setSaved(true);
    Alert.alert('已保存', 'API Key 已安全存入本设备');
  }

  async function clear() {
    await clearAiConfig();
    setApiKey('');
    setSaved(false);
    Alert.alert('已清除');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.section}>AI 服务</Text>
      <Text style={styles.hint}>
        填入你的 API Key 后，可在「记录」页一键让 AI 直接分析。Key 只存本机安全存储，不上传。
      </Text>

      <Text style={styles.label}>服务商</Text>
      <View style={styles.segRow}>
        {(Object.keys(PROVIDERS) as Provider[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.seg, provider === p && styles.segActive]}
            onPress={() => pickProvider(p)}
          >
            <Text style={[styles.segText, provider === p && styles.segTextActive]}>
              {PROVIDERS[p].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>API Key</Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="sk-..."
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>模型</Text>
      <TextInput
        style={styles.input}
        value={model}
        onChangeText={setModel}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>保存</Text>
      </TouchableOpacity>

      {saved && (
        <TouchableOpacity onPress={clear}>
          <Text style={styles.clearText}>清除 API Key</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 20 },
  section: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  hint: { fontSize: 13, color: '#999', lineHeight: 20, marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 8 },
  segRow: { flexDirection: 'row', gap: 8 },
  seg: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff',
    alignItems: 'center', borderWidth: 1, borderColor: '#eee',
  },
  segActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  segText: { color: '#666', fontSize: 14 },
  segTextActive: { color: '#3b82f6', fontWeight: '600' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    fontSize: 16, borderWidth: 1, borderColor: '#eee',
  },
  saveBtn: {
    backgroundColor: '#3b82f6', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  clearText: { color: '#ef4444', textAlign: 'center', marginTop: 16, fontSize: 15 },
});
