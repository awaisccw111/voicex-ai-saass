export interface FishAudioTTSParams {
  readonly text: string;
  readonly voiceId: string;
  readonly format?: "mp3" | "wav" | "ogg" | undefined;
  readonly speed?: number | undefined;
}

export interface FishAudioTTSResult {
  readonly audioBuffer: Buffer;
  readonly durationSeconds: number;
  readonly contentType: string;
}

function createMockWavBuffer(durationSeconds: number): Buffer {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF Chunk
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);

  // fmt Chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  // data Chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  const freq = 440;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin(Math.min(Math.PI, (t / durationSeconds) * Math.PI));
    const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
    buffer.writeInt16LE(sample < 0 ? sample * 0x8000 : sample * 0x7fff, 44 + i * 2);
  }

  return buffer;
}

export async function generateFishAudioTTS(
  params: FishAudioTTSParams,
): Promise<FishAudioTTSResult> {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  const { text, voiceId, format = "mp3" } = params;

  const contentTypeMap: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
  };

  const contentType = contentTypeMap[format] ?? "audio/mpeg";

  if (!apiKey || apiKey === "mock_fish_audio_api_key_placeholder") {
    // eslint-disable-next-line no-console
    console.log(
      `[FishAudio:Mock] Synthesizing "${text.slice(0, 40)}..." using voice ${voiceId} in mock mode.`,
    );

    // Calculate approximate duration: ~15 characters per second
    const durationSeconds = Math.max(1.5, parseFloat((text.length * 0.065).toFixed(2)));
    const mockAudioBuffer = createMockWavBuffer(durationSeconds);

    return {
      audioBuffer: mockAudioBuffer,
      durationSeconds,
      contentType: "audio/wav",
    };
  }

  try {
    const model = process.env.FISH_AUDIO_MODEL ?? "s2.1-pro-free";

    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        model,
      },
      body: JSON.stringify({
        text,
        reference_id: voiceId,
        format,
        latency: "normal",
        model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText) as { message?: string; detail?: string };
        parsedMessage = errorJson.message ?? errorJson.detail ?? errorText;
      } catch {
        // use raw text
      }

      if (response.status === 429) {
        throw new Error(`Fish Audio API rate limit exceeded: ${parsedMessage}`);
      }

      throw new Error(
        `Fish Audio API failed with status ${response.status}: ${parsedMessage}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Duration estimation from character count / audio size
    const durationSeconds = Math.max(1.0, parseFloat((text.length * 0.065).toFixed(2)));

    return {
      audioBuffer,
      durationSeconds,
      contentType,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Fish Audio TTS error";
    // eslint-disable-next-line no-console
    console.error("[FishAudio] TTS generation error:", message);
    throw error;
  }
}
