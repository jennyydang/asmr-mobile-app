import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
import { glossyShadow, pillShadow, theme } from '../theme';
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
const GAP = 7;
const H_PADDING = 14;

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
      <View style={styles.keyTopHalf} />
      <View style={styles.keyCornerGlow} />
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
      <View style={[styles.display, pillShadow]}>
        <Text style={styles.displayText} numberOfLines={2}>
          {typed}
          <Text style={styles.cursor}>|</Text>
        </Text>
        {typed.length === 0 && <Text style={styles.displayHint}>TYPE ANYTHING — IT'S JUST FOR THE SOUND</Text>}
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
    padding: 16,
  },
  display: {
    ...glossyShadow,
    minHeight: 96,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: theme.surface,
    borderRadius: 22,
  },
  displayText: {
    color: theme.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  cursor: {
    color: '#5064c9',
    fontWeight: '300',
  },
  displayHint: {
    position: 'absolute',
    left: 18,
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    height: 48,
    borderRadius: 12,
    backgroundColor: '#c2cbf7',
    borderBottomWidth: 4,
    borderBottomColor: '#9aa5e8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  keyPressed: {
    backgroundColor: '#c7d0fb',
    borderBottomWidth: 0,
    transform: [{ translateY: 4 }],
  },
  // Two-tone vertical fill fakes a gradient without needing a per-key SVG —
  // combined with the corner glow and bottom "skirt" border, it reads as a
  // domed, glossy keycap rather than a flat tinted rectangle.
  keyTopHalf: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
    backgroundColor: '#eef1ff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  keyCornerGlow: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  keyLabel: {
    color: '#33397a',
    fontSize: 15,
    fontWeight: '800',
  },
});
