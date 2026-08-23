import { useEffect, useRef } from 'react';
import { createAudioPlayer, type AudioPlayer, type AudioSource } from 'expo-audio';

type Pool = { players: AudioPlayer[]; index: number };

/**
 * Manages a small round-robin pool of AudioPlayers per source so the same
 * short sound effect can be re-triggered rapidly (taps, pops, clicks)
 * without waiting for the previous instance to finish.
 */
export function useSoundPool(sources: AudioSource[], poolSizePerSource = 3) {
  const poolsRef = useRef<Pool[]>([]);

  useEffect(() => {
    poolsRef.current = sources.map((source) => ({
      players: Array.from({ length: poolSizePerSource }, () => createAudioPlayer(source)),
      index: 0,
    }));

    return () => {
      poolsRef.current.forEach((pool) =>
        pool.players.forEach((player) => {
          try {
            player.remove();
          } catch {
            // player may already be gone; nothing to do
          }
        })
      );
      poolsRef.current = [];
    };
    // sources is expected to be a stable, module-scoped array of require() results
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function playAt(sourceIndex: number, volume = 1) {
    const pool = poolsRef.current[sourceIndex];
    if (!pool) return;
    const player = pool.players[pool.index];
    pool.index = (pool.index + 1) % pool.players.length;
    try {
      player.volume = volume;
      player.seekTo(0);
      player.play();
    } catch {
      // ignore transient playback errors
    }
  }

  function playRandom(volume = 1) {
    if (!poolsRef.current.length) return;
    playAt(Math.floor(Math.random() * poolsRef.current.length), volume);
  }

  return { playAt, playRandom };
}
