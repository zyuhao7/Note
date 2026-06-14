import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { initDb } from './src/db/queries';
import HomeScreen from './src/screens/HomeScreen';
import EntryScreen from './src/screens/EntryScreen';
import ExportScreen from './src/screens/ExportScreen';
import TrendScreen from './src/screens/TrendScreen';
import AnalyzeScreen from './src/screens/AnalyzeScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerOpts = {
  headerStyle: { backgroundColor: '#fafafa' },
  headerShadowVisible: false,
  headerTintColor: '#1a1a1a',
};

// 「记录」标签内部是个栈：列表 → 新建/编辑 → 导出。
function RecordStack() {
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Entry" component={EntryScreen} options={{ title: '记录' }} />
      <Stack.Screen name="Export" component={ExportScreen} options={{ title: '导出分析' }} />
    </Stack.Navigator>
  );
}

// 用 emoji 当 Tab 图标，免额外图标库依赖。
function tabIcon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    try {
      initDb();
      setReady(true);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }, []);

  if (err !== '') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#ef4444', fontSize: 15, lineHeight: 22 }}>启动失败：{err}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          ...headerOpts,
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#999',
        }}
      >
        <Tab.Screen
          name="记录"
          component={RecordStack}
          options={{ headerShown: false, tabBarIcon: tabIcon('📝') }}
        />
        <Tab.Screen name="趋势" component={TrendScreen} options={{ tabBarIcon: tabIcon('📊') }} />
        <Tab.Screen name="分析" component={AnalyzeScreen} options={{ title: 'AI 分析', tabBarIcon: tabIcon('✨') }} />
        <Tab.Screen name="设置" component={SettingsScreen} options={{ tabBarIcon: tabIcon('⚙️') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
