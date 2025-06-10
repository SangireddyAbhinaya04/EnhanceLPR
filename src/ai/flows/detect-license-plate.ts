
'use server';

/**
 * @fileOverview An AI agent for detecting license plates in images, cropping them, and assessing blurriness.
 *
 * - detectLicensePlate - A function that handles the license plate detection, cropping, and blur assessment.
 * - DetectLicensePlateInput - The input type for the detectLicensePlate function.
 * - DetectLicensePlateOutput - The return type for the detectLicensePlate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectLicensePlateInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo containing a vehicle, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectLicensePlateInput = z.infer<typeof DetectLicensePlateInputSchema>;

const DetectLicensePlateOutputSchema = z.object({
  licensePlateRegion: z
    .string()
    .describe("A data URI of the detected and tightly CROPPED license plate region. This must be the image of the plate itself, not the whole vehicle. If detection/cropping fails, this may be the original photoDataUri."),
  isBlurry: z.boolean().describe('Whether the detected and CROPPED license plate region appears blurry and needs enhancement. False if detection/cropping failed or if the original image is returned.'),
});
export type DetectLicensePlateOutput = z.infer<typeof DetectLicensePlateOutputSchema>;

export async function detectLicensePlate(input: DetectLicensePlateInput): Promise<DetectLicensePlateOutput> {
  return detectLicensePlateFlow(input);
}

const detectLicensePlatePrompt = ai.definePrompt({
  name: 'detectLicensePlatePrompt',
  model: 'googleai/gemini-2.0-flash-exp', 
  input: {schema: DetectLicensePlateInputSchema},
  // output: {schema: DetectLicensePlateOutputSchema}, // Removed to avoid JSON mode error with image output
  prompt: `You are an AI expert in license plate detection and image analysis.
Analyze the vehicle image provided via {{media url=photoDataUri}}.

Your tasks are:
1.  **Detect License Plate**: Identify the primary license plate in the image. The plate might be at various angles, skewed, or rotated. Aim to detect it even if it's not perfectly horizontal.
2.  **Crop License Plate**: Generate a new image that is a tight crop of *only* the detected license plate. This cropped image will be the primary image output from the model. If the plate is rotated, try to "deskew" or straighten it in the crop if possible, otherwise crop it as is.
3.  **Assess Blurriness**: Determine if this *cropped* license plate image is blurry, out of focus, or has low resolution/clarity.

In your TEXTUAL response, provide *only* the blurriness assessment for the CROPPED plate. Respond with "BLURRY: TRUE" if it's blurry, or "BLURRY: FALSE" if it's clear or if cropping failed. Do not add any other text or explanation.

**Important Fallback Behavior for Cropped Image**:
- If you are highly confident in the detection and successful cropping, the primary image output should be the cropped data URI.
- If no license plate is detected, OR if you CANNOT reliably crop the license plate region, the primary image output should be the original input image. In this case, your textual response for blurriness MUST be "BLURRY: FALSE".
`,
  config: {
    responseModalities: ['TEXT', 'IMAGE'], 
  },
});

const detectLicensePlateFlow = ai.defineFlow(
  {
    name: 'detectLicensePlateFlow',
    inputSchema: DetectLicensePlateInputSchema,
    outputSchema: DetectLicensePlateOutputSchema, // The flow itself still adheres to this output
  },
  async (input): Promise<DetectLicensePlateOutput> => {
    const llmResponse = await detectLicensePlatePrompt(input);
    
    let licensePlateRegion: string = input.photoDataUri; 
    let isBlurry: boolean = false; 

    if (llmResponse.media?.url) {
      licensePlateRegion = llmResponse.media.url;
    } else {
        console.warn("Detection model did not return a media URL for the cropped image. Falling back to original image.");
    }

    const textOutput = llmResponse.text?.trim().toUpperCase();
    if (textOutput?.includes("BLURRY: TRUE")) {
      isBlurry = true;
    } else if (textOutput?.includes("BLURRY: FALSE")) {
      isBlurry = false;
    } else {
      console.warn(`Unexpected textual output for blurriness: '${llmResponse.text}'. Defaulting to isBlurry=false.`);
      // If using original image (fallback), it's not considered blurry *by this step* for enhancement purposes.
      if (licensePlateRegion === input.photoDataUri) { 
        isBlurry = false;
      }
    }
    
    // If the model did not crop (returned original image) but text somehow says blurry, ensure isBlurry is false.
    // This prevents enhancing the full original image if cropping failed.
    // This check is crucial if the model fails to crop but still assesses the (full) image as blurry.
    if (licensePlateRegion === input.photoDataUri && isBlurry) {
        console.warn("Fallback to original image occurred, but blurriness was reported as true by the model for the full image. Overriding isBlurry to false to prevent unintended enhancement of the original image.");
        isBlurry = false;
    }

    return {
      licensePlateRegion,
      isBlurry,
    };
  }
);

