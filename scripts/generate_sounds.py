#!/usr/bin/env python3
"""
Procedurally synthesizes every ASMR trigger sound the app uses and writes
them as 16-bit mono PCM WAV files into assets/sounds/.

Everything here is generated from noise + oscillators with simple filters
and envelopes (stdlib only: wave/struct/math/random) — no external audio
assets or licensing concerns, and it's easy to re-run with different
seeds/params to get new variants.

Usage: python3 scripts/generate_sounds.py
"""
import math
import os
import random
import struct
import wave

SAMPLE_RATE = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "sounds")


def write_wav(path, samples):
    """samples: list of floats roughly in [-1, 1]."""
    peak = max(0.0001, max(abs(s) for s in samples))
    scale = 0.92 / peak
    frames = bytearray()
    for s in samples:
        v = max(-1.0, min(1.0, s * scale))
        frames += struct.pack("<h", int(v * 32767))
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(bytes(frames))
    print(f"wrote {path} ({len(samples) / SAMPLE_RATE:.3f}s)")


def n_samples(duration):
    return int(SAMPLE_RATE * duration)


def low_pass(x, alpha):
    """One-pole low-pass filter. Smaller alpha = darker/smoother."""
    y = [0.0] * len(x)
    prev = 0.0
    for i, v in enumerate(x):
        prev = prev + alpha * (v - prev)
        y[i] = prev
    return y


def high_pass(x, alpha):
    """One-pole high-pass filter. Larger alpha = brighter/crackly."""
    y = [0.0] * len(x)
    prev_x = 0.0
    prev_y = 0.0
    for i, v in enumerate(x):
        cur = alpha * (prev_y + v - prev_x)
        y[i] = cur
        prev_x = v
        prev_y = cur
    return y


def white_noise(n, rng):
    return [rng.uniform(-1.0, 1.0) for _ in range(n)]


def exp_decay_env(n, tau_samples, attack_samples=1):
    env = []
    for i in range(n):
        a = min(1.0, i / max(1, attack_samples))
        d = math.exp(-i / tau_samples)
        env.append(a * d)
    return env


def sine_sweep(n, f_start, f_end, curve="linear"):
    out = [0.0] * n
    phase = 0.0
    for i in range(n):
        t = i / max(1, n - 1)
        if curve == "exp":
            f = f_start * (f_end / f_start) ** t
        else:
            f = f_start + (f_end - f_start) * t
        phase += 2 * math.pi * f / SAMPLE_RATE
        out[i] = math.sin(phase)
    return out


def fade_edges(x, fade_samples):
    n = len(x)
    fade_samples = min(fade_samples, n // 2)
    for i in range(fade_samples):
        g = i / fade_samples
        x[i] *= g
        x[n - 1 - i] *= g
    return x


# ---------------------------------------------------------------- wax ----
def crack_pop(seed, duration=0.13):
    rng = random.Random(seed)
    n = n_samples(duration)
    noise = white_noise(n, rng)
    crackle = high_pass(noise, 0.88)
    env = exp_decay_env(n, tau_samples=SAMPLE_RATE * 0.02, attack_samples=8)
    body = [crackle[i] * env[i] for i in range(n)]

    # sharp "snap" transient at the very start
    snap_n = n_samples(0.006)
    snap = [rng.uniform(-1, 1) * math.exp(-i / (SAMPLE_RATE * 0.0015)) for i in range(snap_n)]
    for i in range(min(snap_n, n)):
        body[i] += snap[i] * 1.4

    return body


# ---------------------------------------------------------------- nail ---
def nail_tap(seed, freq=3400):
    rng = random.Random(seed)
    n = n_samples(0.06)
    noise = white_noise(n, rng)
    tick_noise = high_pass(low_pass(noise, 0.5), 0.6)
    env = exp_decay_env(n, tau_samples=SAMPLE_RATE * 0.007, attack_samples=4)

    tone = sine_sweep(n, freq, freq * 0.55)
    tone_env = exp_decay_env(n, tau_samples=SAMPLE_RATE * 0.009, attack_samples=2)

    return [tick_noise[i] * env[i] * 0.7 + tone[i] * tone_env[i] * 0.6 for i in range(n)]


# ------------------------------------------------------------- keyboard --
def key_click(seed, freq=2600):
    rng = random.Random(seed)
    n = n_samples(0.03)
    noise = white_noise(n, rng)
    body = high_pass(noise, 0.75)
    env = exp_decay_env(n, tau_samples=SAMPLE_RATE * 0.004, attack_samples=2)

    tone = sine_sweep(n, freq, freq * 0.8)
    tone_env = exp_decay_env(n, tau_samples=SAMPLE_RATE * 0.005, attack_samples=1)

    return [body[i] * env[i] * 0.65 + tone[i] * tone_env[i] * 0.5 for i in range(n)]


# --------------------------------------------------------------- bubble --
def bubble_pop(seed, f_start=950, f_end=170, duration=0.1):
    rng = random.Random(seed)
    n = n_samples(duration)
    tone = sine_sweep(n, f_start, f_end, curve="exp")
    env = exp_decay_env(n, tau_samples=SAMPLE_RATE * 0.022, attack_samples=6)

    noise = white_noise(n_samples(0.01), rng)
    click_env = exp_decay_env(len(noise), tau_samples=SAMPLE_RATE * 0.0025, attack_samples=1)

    out = [tone[i] * env[i] * 0.85 for i in range(n)]
    for i in range(len(noise)):
        out[i] += noise[i] * click_env[i] * 0.5
    return out


# --------------------------------------------------------------- slime ---
def slime_squish_loop(seed, duration=1.7):
    rng = random.Random(seed)
    n = n_samples(duration)
    noise = white_noise(n, rng)
    wet = low_pass(noise, 0.09)

    out = [0.0] * n
    for i in range(n):
        t = i / SAMPLE_RATE
        lfo = (
            0.5
            + 0.3 * math.sin(2 * math.pi * 2.1 * t)
            + 0.2 * math.sin(2 * math.pi * 3.7 * t + 1.3)
        )
        lfo = max(0.05, lfo)
        out[i] = wet[i] * lfo * 1.6
    return fade_edges(out, n_samples(0.03))


def slime_pop(seed):
    rng = random.Random(seed)
    n = n_samples(0.16)
    tone = sine_sweep(n, 320, 85, curve="exp")
    env = exp_decay_env(n, tau_samples=SAMPLE_RATE * 0.035, attack_samples=10)
    noise = low_pass(white_noise(n, rng), 0.2)
    return [tone[i] * env[i] * 0.8 + noise[i] * env[i] * 0.5 for i in range(n)]


# ---------------------------------------------------------------- soap ---
def soap_cut_loop(seed, duration=1.5):
    rng = random.Random(seed)
    n = n_samples(duration)
    noise = white_noise(n, rng)
    smooth = low_pass(noise, 0.16)

    out = [0.0] * n
    for i in range(n):
        t = i / SAMPLE_RATE
        lfo = 0.55 + 0.45 * math.sin(2 * math.pi * 1.4 * t)
        out[i] = smooth[i] * lfo

    # occasional soft scratch transients
    period = n_samples(0.28)
    for start in range(0, n, period):
        scratch_n = min(n_samples(0.04), n - start)
        scratch = high_pass(white_noise(scratch_n, rng), 0.5)
        env = exp_decay_env(scratch_n, tau_samples=SAMPLE_RATE * 0.012, attack_samples=3)
        for i in range(scratch_n):
            out[start + i] += scratch[i] * env[i] * 0.35

    return fade_edges(out, n_samples(0.03))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    for i, seed in enumerate([1, 2, 3], start=1):
        write_wav(os.path.join(OUT_DIR, f"crack_pop_{i}.wav"), crack_pop(seed))

    for i, seed in enumerate([11, 12, 13], start=1):
        write_wav(os.path.join(OUT_DIR, f"nail_tap_{i}.wav"), nail_tap(seed, freq=3200 + i * 250))

    for i, seed in enumerate([21, 22, 23, 24], start=1):
        write_wav(os.path.join(OUT_DIR, f"key_click_{i}.wav"), key_click(seed, freq=2400 + i * 200))

    for i, seed in enumerate([31, 32, 33], start=1):
        write_wav(os.path.join(OUT_DIR, f"bubble_pop_{i}.wav"), bubble_pop(seed, f_start=900 + i * 60))

    write_wav(os.path.join(OUT_DIR, "slime_squish_loop.wav"), slime_squish_loop(41))
    write_wav(os.path.join(OUT_DIR, "slime_pop.wav"), slime_pop(42))

    write_wav(os.path.join(OUT_DIR, "soap_cut_loop.wav"), soap_cut_loop(51))


if __name__ == "__main__":
    main()
