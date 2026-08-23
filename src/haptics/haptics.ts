import * as Haptics from 'expo-haptics';

/**
 * Thin wrapper around expo-haptics. Every call is fire-and-forget and
 * swallows errors — haptics aren't available on web/simulators and a
 * missing buzz should never crash an interaction.
 */
function safe(fn: () => Promise<void>) {
  fn().catch(() => {});
}

export const haptics = {
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  soft: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  rigid: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)),
  selection: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};

/** Picks an impact style scaled by intensity in [0, 1] — handy for drag gestures. */
export function hapticForIntensity(intensity: number) {
  if (intensity > 0.75) return haptics.heavy();
  if (intensity > 0.4) return haptics.medium();
  return haptics.light();
}
