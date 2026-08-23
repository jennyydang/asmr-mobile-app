export type TriggerId = 'wax' | 'nails' | 'slime' | 'keyboard' | 'bubbleWrap' | 'soap';

export interface TriggerMeta {
  id: TriggerId;
  title: string;
  subtitle: string;
  emoji: string;
  /** [background, accent] */
  colors: [string, string];
}

export const TRIGGERS: TriggerMeta[] = [
  {
    id: 'wax',
    title: 'Wax Cracking',
    subtitle: 'Snap warm wax into shards',
    emoji: '🕯️',
    colors: ['#3a2313', '#f2a93b'],
  },
  {
    id: 'nails',
    title: 'Nail Tapping',
    subtitle: 'Tap tap tap on the desk',
    emoji: '💅',
    colors: ['#341522', '#ef7fb0'],
  },
  {
    id: 'slime',
    title: 'Slime',
    subtitle: 'Stretch, squish, and pop',
    emoji: '🟢',
    colors: ['#0f3320', '#59d17f'],
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    subtitle: 'Clicky mechanical keys',
    emoji: '⌨️',
    colors: ['#141a33', '#7c93ff'],
  },
  {
    id: 'bubbleWrap',
    title: 'Bubble Wrap',
    subtitle: 'Pop every last bubble',
    emoji: '🫧',
    colors: ['#0d2b3a', '#5cc8f2'],
  },
  {
    id: 'soap',
    title: 'Soap Cutting',
    subtitle: 'Smooth, soft slicing',
    emoji: '🧼',
    colors: ['#2a1f3d', '#b98cf2'],
  },
];

export function getTrigger(id: TriggerId): TriggerMeta {
  const trigger = TRIGGERS.find((t) => t.id === id);
  if (!trigger) throw new Error(`Unknown trigger id: ${id}`);
  return trigger;
}
