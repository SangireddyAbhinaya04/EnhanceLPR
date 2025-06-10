'use server';
/**
 * @fileOverview Flow to extract text from an enhanced license plate image using EasyOCR.
 *
 * - extractLicensePlateText - A function that handles the text extraction process.
 * - ExtractLicensePlateTextInput - The input type for the extractLicensePlateText function.
 * - ExtractLicensePlateTextOutput - The return type for the extractLicensePlateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractLicensePlateTextInputSchema = z.object({
  enhancedPlateDataUri: z
    .string()
    .describe(
      "A data URI of the enhanced license plate image, must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractLicensePlateTextInput = z.infer<typeof ExtractLicensePlateTextInputSchema>;

const ExtractLicensePlateTextOutputSchema = z.object({
  extractedText: z.string().describe('The extracted text from the license plate image.'),
});
export type ExtractLicensePlateTextOutput = z.infer<typeof ExtractLicensePlateTextOutputSchema>;

export async function extractLicensePlateText(input: ExtractLicensePlateTextInput): Promise<ExtractLicensePlateTextOutput> {
  return extractLicensePlateTextFlow(input);
}

const extractLicensePlateTextPrompt = ai.definePrompt({
  name: 'extractLicensePlateTextPrompt',
  input: {schema: ExtractLicensePlateTextInputSchema},
  output: {schema: ExtractLicensePlateTextOutputSchema},
  prompt: `Extract the text from the following license plate image.

   {{media url=enhancedPlateDataUri}}
  `,
});

const extractLicensePlateTextFlow = ai.defineFlow(
  {
    name: 'extractLicensePlateTextFlow',
    inputSchema: ExtractLicensePlateTextInputSchema,
    outputSchema: ExtractLicensePlateTextOutputSchema,
  },
  async input => {
    const {output} = await extractLicensePlateTextPrompt(input);
    return output!;
  }
);
