/**
 * Converts an AudioBuffer to a base64-encoded PCM16 string.
 * @param buffer The AudioBuffer from the Web Audio API.
 * @returns A base64 string representing the PCM16 audio data.
 */
export function audioBufferToPcm16Base64(buffer: AudioBuffer): string {
  const pcm16 = convertToPcm16(buffer);
  const uint8Array = new Uint8Array(pcm16.buffer);
  let binaryString = '';
  // Avoid stack overflow with large buffers by using a loop
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

function convertToPcm16(buffer: AudioBuffer): Int16Array {
  const inputData = buffer.getChannelData(0); // Using mono channel
  const output = new Int16Array(inputData.length);
  for (let i = 0; i < inputData.length; i++) {
    const s = Math.max(-1, Math.min(1, inputData[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

/**
 * Downsamples an AudioBuffer to a target sample rate.
 * @param audioBuffer The original AudioBuffer.
 * @param targetSampleRate The desired sample rate (e.g., 16000).
 * @returns A new AudioBuffer with the target sample rate.
 */
export async function downsampleBuffer(
  audioBuffer: AudioBuffer,
  targetSampleRate: number
): Promise<AudioBuffer> {
  if (audioBuffer.sampleRate === targetSampleRate) {
    return audioBuffer;
  }

  const duration = audioBuffer.duration;
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    duration * targetSampleRate,
    targetSampleRate
  );

  const bufferSource = offlineContext.createBufferSource();
  bufferSource.buffer = audioBuffer;
  bufferSource.connect(offlineContext.destination);
  bufferSource.start(0);

  return await offlineContext.startRendering();
}