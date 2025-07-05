'use server';

/**
 * @fileOverview A flow for generating a spoken narration of a receipt.
 *
 * - generateReceiptNarration - A function that converts receipt text into speech.
 * - GenerateReceiptNarrationInput - The input type for the function.
 * - GenerateReceiptNarrationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import wav from 'wav';

const GenerateReceiptNarrationInputSchema = z.string().describe('The text to be converted to speech.');
export type GenerateReceiptNarrationInput = z.infer<typeof GenerateReceiptNarrationInputSchema>;

const GenerateReceiptNarrationOutputSchema = z.object({
  media: z.string().describe("A data URI of the generated audio in WAV format. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type GenerateReceiptNarrationOutput = z.infer<typeof GenerateReceiptNarrationOutputSchema>;


export async function generateReceiptNarration(
  input: GenerateReceiptNarrationInput
): Promise<GenerateReceiptNarrationOutput> {
  return generateReceiptNarrationFlow(input);
}


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const generateReceiptNarrationFlow = ai.defineFlow(
  {
    name: 'generateReceiptNarrationFlow',
    inputSchema: GenerateReceiptNarrationInputSchema,
    outputSchema: GenerateReceiptNarrationOutputSchema,
  },
  async (query) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: query,
    });

    if (!media) {
      throw new Error('No media was returned from the text-to-speech model.');
    }

    // The media URL from Gemini is a Base64 encoded PCM string.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    // We need to convert it to a proper WAV file to play in the browser.
    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
