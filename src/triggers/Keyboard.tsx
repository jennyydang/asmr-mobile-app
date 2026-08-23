import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
import type { TriggerComponentProps } from '../screens/TriggerScreen';

const KEY_SOURCES = [
  require('../../assets/sounds/key_click_1.wav'),
  require('../../assets/sounds/key_click_2.wav'),
  require('../../assets/sounds/key_click_3.wav'),
  require('../../assets/sounds/key_click_4.wav'),
];

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const MAX_DISPLAY_CHARS = 60;
const GAP = 6;
const H_PADDING = 12;

interface KeyProps {
  label: string;
  width: number;
  flexGrow?: number;
  onPress: () => void;
}

function Key({ label, width, flexGrow, onPress }: KeyProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        { width: flexGrow ? undefined : width, flexGrow },
        pressed && styles.keyPressed,
      ]}
    >
      <Text style={styles.keyLabel}>{label}</Text>
    </Pressable>
  );
}

export default function Keyboard({ resetSignal }: TriggerComponentProps) {
  const [width, setWidth] = useState(0);
  const [typed, setTyped] = useState('');
  const { playRandom } = useSoundPool(KEY_SOURCES, 5);

  useEffect(() => {
    setTyped('');
  }, [resetSignal]);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  function pressKey(char: string) {
    playRandom(0.9);
    haptics.light();
    setTyped((t) => (t + char).slice(-MAX_DISPLAY_CHARS));
  }

  function pressBackspace() {
    playRandom(0.9);
    haptics.rigid();
    setTyped((t) => t.slice(0, -1));
  }

  function pressSpace() {
    playRandom(0.9);
    haptics.medium();
    setTyped((t) => (t + ' ').slice(-MAX_DISPLAY_CHARS));
  }

  const keyWidth = width > 0 ? (width - H_PADDING * 2 - GAP * 9) / 10 : 0;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.display}>
        <Text style={styles.displayText} numberOfLines={2}>
          {typed}
          <Text style={styles.cursor}>|</Text>
        </Text>
        {typed.length === 0 && <Text style={styles.displayHint}>Type anything — it's just for the sound</Text>}
      </View>

      {width > 0 && (
        <View style={styles.keys}>
          {ROWS.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={[
                styles.row,
                { marginLeft: rowIndex === 1 ? keyWidth * 0.5 : rowIndex === 2 ? keyWidth * 1.1 : 0 },
              ]}
            >
              {row.map((char) => (
                <Key key={char} label={char} width={keyWidth} onPress={() => pressKey(char)} />
              ))}
            </View>
          ))}

          <View style={styles.row}>
            <Key label="⌫" width={keyWidth * 1.6} onPress={pressBackspace} />
            <Key label="space" width={0} flexGrow={1} onPress={pressSpace} />
            <Key label="⏎" width={keyWidth * 1.6} onPress={pressSpace} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#141a33',
    padding: 12,
  },
  display: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  displayText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
  },
  cursor: {
    color: '#7c93ff',
    fontWeight: '300',
  },
  displayHint: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  keys: {
    gap: GAP,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  key: {
    height: 46,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    backgroundColor: 'rgba(124,147,255,0.55)',
    transform: [{ translateY: 2 }],
  },
  keyLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
