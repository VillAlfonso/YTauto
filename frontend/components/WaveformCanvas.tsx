"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  audioFile: File | null;
  duration: number;
  pixelsPerSecond: number;
  height?: number;
};

const PEAKS_PER_SECOND = 60;

/** Decodes the audio once via Web Audio API and draws downsampled peaks to a
 * canvas. Re-decodes when audioFile changes. Re-renders when ppx changes. */
export function WaveformCanvas({
  audioFile,
  duration,
  pixelsPerSecond,
  height = 56,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [decoding, setDecoding] = useState(false);

  useEffect(() => {
    if (!audioFile) {
      setPeaks(null);
      return;
    }
    let cancelled = false;
    setDecoding(true);
    (async () => {
      try {
        const AC = window.AudioContext ?? (window as any).webkitAudioContext;
        const ctx = new AC();
        const buf = await audioFile.arrayBuffer();
        const decoded = await ctx.decodeAudioData(buf);
        if (cancelled) return;
        const channel = decoded.getChannelData(0);
        const targetSamples = Math.max(
          1,
          Math.floor(decoded.duration * PEAKS_PER_SECOND),
        );
        const samplesPerBin = Math.max(1, Math.floor(channel.length / targetSamples));
        const bins = new Float32Array(targetSamples);
        for (let i = 0; i < targetSamples; i++) {
          let max = 0;
          const base = i * samplesPerBin;
          for (let j = 0; j < samplesPerBin; j++) {
            const v = Math.abs(channel[base + j] ?? 0);
            if (v > max) max = v;
          }
          bins[i] = max;
        }
        setPeaks(bins);
        try {
          await ctx.close();
        } catch {}
      } catch (e) {
        console.error("waveform decode failed", e);
      } finally {
        if (!cancelled) setDecoding(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audioFile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const totalWidth = Math.max(1, duration * pixelsPerSecond);
    canvas.width = Math.floor(totalWidth * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, totalWidth, height);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, 0, totalWidth, height);

    if (!peaks || peaks.length === 0) return;

    const mid = height / 2;
    const pixelsPerPeak = pixelsPerSecond / PEAKS_PER_SECOND;
    const barWidth = Math.max(1, pixelsPerPeak * 0.7);

    ctx.fillStyle = "#8a8a93";
    for (let i = 0; i < peaks.length; i++) {
      const x = i * pixelsPerPeak;
      if (x > totalWidth) break;
      const h = peaks[i] * (height * 0.9);
      ctx.fillRect(x, mid - h / 2, barWidth, h);
    }
  }, [peaks, pixelsPerSecond, duration, height]);

  return (
    <div className="relative" style={{ height }}>
      <canvas ref={canvasRef} className="block" />
      {decoding && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-text-muted">
          decoding waveform…
        </div>
      )}
    </div>
  );
}
