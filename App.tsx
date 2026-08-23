import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { setAudioModeAsync } from 'expo-audio';

import HomeScreen from './src/screens/HomeScreen';
import TriggerScreen from './src/screens/TriggerScreen';
import type { TriggerId } from './src/data/triggers';
import { theme } from './src/theme';

export type RootStackParamList = {
  Home: undefined;
  Trigger: { id: TriggerId };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: theme.background, text: theme.textPrimary },
};

export default function App() {
  useEffect(() => {
    // Play nicely with silent mode / ringer switch so ASMR audio is never
    // unexpectedly muted, without hijacking background audio from other apps.
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(
      () => {}
    );
  }, []);

  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Trigger"
          component={TriggerScreen}
          options={{ animation: 'fade_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
