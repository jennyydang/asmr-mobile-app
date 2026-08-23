import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { TRIGGERS, type TriggerMeta } from '../data/triggers';
import { haptics } from '../haptics/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  function openTrigger(trigger: TriggerMeta) {
    haptics.selection();
    navigation.navigate('Trigger', { id: trigger.id });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.headerBlock}>
        <Text style={styles.eyebrow}>TOUCH ASMR</Text>
        <Text style={styles.title}>Tap. Drag. Relax.</Text>
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
              { backgroundColor: item.colors[0], borderColor: item.colors[1] },
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
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
    backgroundColor: '#0b0b12',
  },
  headerBlock: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  eyebrow: {
    color: '#8f8fb3',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#b7b7d1',
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
    borderWidth: 1.5,
    padding: 18,
    justifyContent: 'flex-end',
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    lineHeight: 17,
  },
});
