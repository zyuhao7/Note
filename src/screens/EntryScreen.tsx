import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import {
  listCategories, addEntry, updateEntry, deleteEntry, today, listEntries,
} from '../db/queries';
import { Category } from '../db/schema';

export default function EntryScreen({ navigation, route }: any) {
  const mode: 'new' | 'edit' = route.params?.mode ?? 'new';
  const entryId: number | undefined = route.params?.entryId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const cats = listCategories();
    setCategories(cats);
    if (mode === 'edit' && entryId != null) {
      const e = listEntries().find((x) => x.id === entryId);
      if (e) {
        setSelected(cats.find((c) => c.id === e.categoryId) ?? null);
        setValue(e.value);
        setNote(e.note);
      }
    }
  }, [mode, entryId]);

  const placeholder = (() => {
    if (!selected) return '值';
    switch (selected.kind) {
      case 'money': return '金额，如 12';
      case 'rating': return '涨跌/评分，如 +2.3%';
      case 'number': return '数字';
      default: return '内容';
    }
  })();

  function save() {
    if (!selected) { Alert.alert('请先选择一个类别'); return; }
    if (!value.trim()) { Alert.alert('请填写值'); return; }
    if (mode === 'edit' && entryId != null) {
      updateEntry(entryId, value.trim(), note.trim());
    } else {
      // 当日锁定：新记录只能归属今天，杜绝补填旧账
      addEntry(selected.id, today(), value.trim(), note.trim());
    }
    navigation.goBack();
  }

  function remove() {
    if (entryId == null) return;
    Alert.alert('删除这条记录？', '', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => { deleteEntry(entryId); navigation.goBack(); } },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>选择类别</Text>
      <View style={styles.grid}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, selected?.id === c.id && styles.chipActive]}
            onPress={() => setSelected(c)}
            disabled={mode === 'edit'}
          >
            <Text style={styles.chipIcon}>{c.icon}</Text>
            <Text style={[styles.chipText, selected?.id === c.id && styles.chipTextActive]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected && (
        <View style={styles.form}>
          <Text style={styles.label}>{selected.icon} {selected.name}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            keyboardType={selected.kind === 'money' || selected.kind === 'number' ? 'numeric' : 'default'}
            autoFocus
          />
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="备注（可选）"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>
              {mode === 'edit' ? '保存修改' : `保存今天 ${today().slice(5)}`}
            </Text>
          </TouchableOpacity>
          {mode === 'edit' && (
            <TouchableOpacity onPress={remove}>
              <Text style={styles.deleteText}>删除</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { padding: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#444', marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    width: 88, height: 88, borderRadius: 16, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  chipActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  chipIcon: { fontSize: 28 },
  chipText: { fontSize: 14, color: '#444', marginTop: 4 },
  chipTextActive: { color: '#3b82f6', fontWeight: '600' },
  form: { marginTop: 24 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee',
  },
  saveBtn: {
    backgroundColor: '#3b82f6', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteText: { color: '#ef4444', textAlign: 'center', marginTop: 16, fontSize: 15 },
});
