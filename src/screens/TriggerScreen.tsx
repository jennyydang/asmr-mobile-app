import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { getTrigger } from '../data/triggers';
import { ScreenHeader } from '../components/ScreenHeader';
import { haptics } from '../haptics/haptics';

import WaxCracking from '../triggers/WaxCracking';
import NailTapping from '../triggers/NailTapping';
import Slime from '../triggers/Slime';
import Keyboard from '../triggers/Keyboard';
import BubbleWrap from '../triggers/BubbleWrap';
import SoapCutting from '../triggers/SoapCutting';

export interface TriggerComponentProps {
  resetSignal: number;
}

const TRIGGER_COMPONENTS: Record<string, React.ComponentType<TriggerComponentProps>> = {
  wax: WaxCracking,
  nails: NailTapping,
  slime: Slime,
  keyboard: Keyboard,
  bubbleWrap: BubbleWrap,
  soap: SoapCutting,
};

type Props = NativeStackScreenProps<RootStackParamList, 'Trigger'>;

export default function TriggerScreen({ route }: Props) {
  const trigger = getTrigger(route.params.id);
  const [resetSignal, setResetSignal] = useState(0);
  const Component = TRIGGER_COMPONENTS[trigger.id];

  return (
    <View style={[styles.screen, { backgroundColor: trigger.colors[0] }]}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <ScreenHeader
          title={trigger.title}
          onReset={() => {
            haptics.medium();
            setResetSignal((n) => n + 1);
          }}
        />
      </SafeAreaView>

      <View style={styles.content}>
        <Component resetSignal={resetSignal} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeTop: {
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
});
