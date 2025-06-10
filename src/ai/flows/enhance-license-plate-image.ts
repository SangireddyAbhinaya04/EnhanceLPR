
// src/ai/flows/enhance-license-plate-image.ts
'use server';
/**
 * @fileOverview Conditionally enhances a license plate image using Real ESRGAN.
 *
 * - enhanceLicensePlateImage - A function that enhances the license plate image if blurry.
 * - EnhanceLicensePlateImageInput - The input type for the enhanceLicensePlateImage function.
 * - EnhanceLicensePlateImageOutput - The return type for the enhanceLicensePlateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceLicensePlateImageInputSchema = z.object({
  licensePlateDataUri: z
    .string()
    .describe(
      "A photo of a detected license plate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  isDetectedPlateBlurry: z.boolean().describe("Whether the detected license plate is blurry and needs enhancement."),
});
export type EnhanceLicensePlateImageInput = z.infer<typeof EnhanceLicensePlateImageInputSchema>;

const EnhanceLicensePlateImageOutputSchema = z.object({
  processedLicensePlateDataUri: z
    .string()
    .describe("The processed license plate image as a data URI (enhanced if it was blurry, otherwise the original detected plate URI)."),
});
export type EnhanceLicensePlateImageOutput = z.infer<typeof EnhanceLicensePlateImageOutputSchema>;

export async function enhanceLicensePlateImage(input: EnhanceLicensePlateImageInput): Promise<EnhanceLicensePlateImageOutput> {
  return enhanceLicensePlateImageFlow(input);
}

const enhanceLicensePlateImageFlow = ai.defineFlow(
  {
    name: 'enhanceLicensePlateImageFlow',
    inputSchema: EnhanceLicensePlateImageInputSchema,
    outputSchema: EnhanceLicensePlateImageOutputSchema,
  },
  async (input) => {
    if (!input.isDetectedPlateBlurry) {
      // Not blurry (or detection failed to crop), return the original detected plate URI
      return { processedLicensePlateDataUri: input.licensePlateDataUri };
    }

    // Blurry, so enhance it
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        {media: {url: input.licensePlateDataUri}},
        {text: 'Enhance this license plate image for maximum clarity of characters, suitable for OCR. Use techniques similar to Real ESRGAN if possible.'},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    if (!media?.url) {
        // Fallback if enhancement somehow fails to produce an image
        console.warn("Image enhancement failed to return a media URL. Falling back to unenhanced image.");
        return { processedLicensePlateDataUri: input.licensePlateDataUri };
    }

    return {processedLicensePlateDataUri: media.url};
  }
);
