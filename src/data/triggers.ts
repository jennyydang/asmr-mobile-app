export type TriggerId = 'wax' | 'nails' | 'slime' | 'keyboard' | 'bubbleWrap' | 'soap';

export interface TriggerMeta {
  id: TriggerId;
  title: string;
  subtitle: string;
  emoji: string;
  /** [light pastel card tint, deeper accent for gloss/shadow] */
  colors: [string, string];
}

export const TRIGGERS: TriggerMeta[] = [
  {
    id: 'wax',
    title: 'Wax Pop',
    subtitle: 'Snap warm wax into shards',
    emoji: '🕯️',
    colors: ['#fff3d6', '#e0a72e'],
  },
  {
    id: 'nails',
    title: 'Nail Tapping',
    subtitle: 'Tap tap tap on the desk',
    emoji: '💅',
    colors: ['#ffe3ee', '#e0678f'],
  },
  {
    id: 'slime',
    title: 'Slime',
    subtitle: 'Stretch, squish, and pop',
    emoji: '🟢',
    colors: ['#e3f9e5', '#2f9e57'],
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    subtitle: 'Clicky mechanical keys',
    emoji: '⌨️',
    colors: ['#e8ecff', '#5064c9'],
  },
  {
    id: 'bubbleWrap',
    title: 'Bubble Wrap',
    subtitle: 'Pop every last heart',
    emoji: '🫧',
    colors: ['#f1e6ff', '#9b6fd6'],
  },
  {
    id: 'soap',
    title: 'Soap Cutting',
    subtitle: 'Smooth, soft slicing',
    emoji: '🧼',
    colors: ['#f4ecff', '#9868d9'],
  },
];

export function getTrigger(id: TriggerId): TriggerMeta {
  const trigger = TRIGGERS.find((t) => t.id === id);
  if (!trigger) throw new Error(`Unknown trigger id: ${id}`);
  return trigger;
}
