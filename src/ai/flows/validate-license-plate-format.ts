'use server';
/**
 * @fileOverview Validates the extracted license plate text against Indian standard formats.
 *
 * - validateLicensePlateFormat - A function that validates the license plate format.
 * - ValidateLicensePlateFormatInput - The input type for the validateLicensePlateFormat function.
 * - ValidateLicensePlateFormatOutput - The return type for the validateLicensePlateFormat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateLicensePlateFormatInputSchema = z.object({
  licensePlateText: z
    .string()
    .describe('The extracted license plate text to validate.'),
});
export type ValidateLicensePlateFormatInput = z.infer<
  typeof ValidateLicensePlateFormatInputSchema
>;

const ValidateLicensePlateFormatOutputSchema = z.object({
  isValidFormat: z.boolean().describe('Whether the license plate format is valid.'),
  validationMessage: z.string().describe('The validation message for the license plate.'),
});
export type ValidateLicensePlateFormatOutput = z.infer<
  typeof ValidateLicensePlateFormatOutputSchema
>;

export async function validateLicensePlateFormat(
  input: ValidateLicensePlateFormatInput
): Promise<ValidateLicensePlateFormatOutput> {
  return validateLicensePlateFormatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateLicensePlateFormatPrompt',
  input: {schema: ValidateLicensePlateFormatInputSchema},
  output: {schema: ValidateLicensePlateFormatOutputSchema},
  prompt: `You are an expert in Indian license plate formats. Given the extracted text from a license plate, determine if it is in a valid Indian standard format.

License Plate Text: {{{licensePlateText}}}

Focus specifically on common Indian license plate formats. These formats generally consist of:
1. State Code: Two uppercase letters (e.g., MH, DL, KA, AP, TN).
2. RTO Code: Two digits (e.g., 01, 12, 37).
3. Series: One, two, or three uppercase letters (e.g., A, AB, ABC, X, AA).
4. Number: A four-digit number (e.g., 0001, 1234, 9999). Some older formats might have one, two, or three digits.

Examples of valid formats (spaces are optional and can vary, hyphens are also sometimes used):
- DL01AB1234
- MH 12 XY 3456
- KA-05-N-123
- AP37AY0001
- TN22CQ1111
- GJ 05 R 123
- HR26DQ5555

Be strict about the format. The text should predominantly consist of uppercase letters and digits, matching the described structure. Check that the letters and numbers are in the proper segments and quantities (e.g., state code must be two letters, RTO code two digits). Special characters other than an occasional space or hyphen should generally make the format invalid.

Respond in JSON format with the following fields:
- isValidFormat: true if the license plate is in a valid Indian format, false otherwise.
- validationMessage: A message explaining why the license plate is valid or invalid according to Indian standards. Be as specific as possible, detailing which part of the format is incorrect if it's invalid.
`,
});

const validateLicensePlateFormatFlow = ai.defineFlow(
  {
    name: 'validateLicensePlateFormatFlow',
    inputSchema: ValidateLicensePlateFormatInputSchema,
    outputSchema: ValidateLicensePlateFormatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
