import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { TRIGGERS, type TriggerMeta } from '../data/triggers';
import { haptics } from '../haptics/haptics';
import { pillShadow, theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  function openTrigger(trigger: TriggerMeta) {
    haptics.selection();
    navigation.navigate('Trigger', { id: trigger.id });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>TOUCH ASMR</Text>
        <Text style={styles.title}>TAP. DRAG. RELAX.</Text>
        <Text style={styles.subtitle}>
          Pick a trigger below — everything responds to your touch with sound and haptics.
        </Text>
      </View>

      <FlatList
        data={TRIGGERS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openTrigger(item)}
            style={({ pressed }) => [
              styles.card,
              pillShadow,
              { backgroundColor: item.colors[0] },
              pressed && styles.cardPressed,
            ]}
          >
            <View style={[styles.iconBubble, { backgroundColor: item.colors[1] }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerBlock: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  eyebrow: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  row: {
    gap: 14,
    marginBottom: 14,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'flex-end',
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 22,
  },
  cardTitle: {
    color: theme.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: theme.textSecondary,
    fontSize: 12.5,
    lineHeight: 17,
  },
});
