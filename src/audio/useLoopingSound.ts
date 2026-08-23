import { useEffect, useRef } from 'react';
import { createAudioPlayer, type AudioPlayer, type AudioSource } from 'expo-audio';

/**
 * A single looping AudioPlayer for continuous textures (slime squish, soap
 * scraping) that should start on touch-down and stop on touch-release.
 */
export function useLoopingSound(source: AudioSource) {
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    const player = createAudioPlayer(source);
    player.loop = true;
    playerRef.current = player;

    return () => {
      try {
        player.remove();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function start(volume = 1) {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.volume = volume;
      if (!player.playing) player.play();
    } catch {
      // ignore
    }
  }

  function stop() {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.pause();
      player.seekTo(0);
    } catch {
      // ignore
    }
  }

  function setVolume(volume: number) {
    const player = playerRef.current;
    if (!player) return;
    try {
      player.volume = volume;
    } catch {
      // ignore
    }
  }

  return { start, stop, setVolume };
}
