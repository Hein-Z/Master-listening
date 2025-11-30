
/**
 * Decodes a base64 string into a Uint8Array.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM data into an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  // Respect byteOffset and ensure we have an even number of bytes for Int16
  const byteLength = data.byteLength;
  const alignedLength = byteLength - (byteLength % 2);
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, alignedLength / 2);

  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Plays a "Pin-Pon" (Correct) sound effect using an oscillator.
 */
export const playCorrectSound = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  // "Pin" (High note)
  osc.frequency.setValueAtTime(880, ctx.currentTime); 
  // "Pon" (Lower note)
  osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15); 
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.5);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);

  osc.start();
  osc.stop(ctx.currentTime + 0.6);
};

/**
 * Plays a "Bu-Bu" (Wrong) sound effect using an oscillator.
 */
export const playWrongSound = () => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sawtooth';
  // "Bu"
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  // "Bu" (Second pulse simulated by amplitude or slight freq drop, simple continuous buzz here)
  osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.3);
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

  osc.start();
  osc.stop(ctx.currentTime + 0.4);
};
