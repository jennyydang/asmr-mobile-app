import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface Props {
  title: string;
  onReset?: () => void;
  resetLabel?: string;
}

export function ScreenHeader({ title, onReset, resetLabel = 'Reset' }: Props) {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={12}
        style={({ pressed }) => [styles.sideBtn, pressed && styles.pressed]}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {onReset ? (
        <Pressable
          onPress={onReset}
          hitSlop={12}
          style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
        >
          <Text style={styles.resetText}>{resetLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.sideBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 52,
  },
  sideBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  backText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 32,
    marginTop: -2,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  resetBtn: {
    paddingHorizontal: 12,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  resetText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
