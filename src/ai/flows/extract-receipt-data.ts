'use server';

/**
 * @fileOverview A receipt data extraction AI agent.
 *
 * - extractReceiptData - A function that handles the receipt data extraction process.
 * - ExtractReceiptDataInput - The input type for the extractReceiptData function.
 * - ExtractReceiptDataOutput - The return type for the extractReceiptData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CATEGORIES, Category } from '@/lib/types';

const ExtractReceiptDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  userMerchant: z.string().optional().describe('The merchant provided by the user, if any.'),
  userAmount: z.number().optional().describe('The amount provided by the user, if any.'),
  userDate: z.string().optional().describe('The date provided by the user, if any.'),
  userCategory: z.string().optional().describe('The category provided by the user, if any.'),
  userDescription: z.string().optional().describe('The description provided by the user, if any.'),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

const ExtractReceiptDataOutputSchema = z.object({
  merchant: z.string().describe('The name of the merchant.'),
  amount: z.number().describe('The total amount of the receipt.'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format.'),
  category: z.enum(CATEGORIES).describe('The category of the expense.'),
  description: z.string().describe('A short description of the purchase.'),
});
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  return extractReceiptDataFlow(input);
}

const AIExtractionPromptInputSchema = z.object({
    photoDataUri: z.string(),
});

const AIExtractionPrompt = ai.definePrompt({
  name: 'AIExtractionPrompt',
  input: {schema: AIExtractionPromptInputSchema},
  output: {schema: ExtractReceiptDataOutputSchema},
  prompt: `You are an expert accounting assistant specializing in extracting data from receipts.

  Your task is to analyze the provided receipt image and extract the following information:
  - The merchant's name.
  - The total transaction amount.
  - The date of the transaction in YYYY-MM-DD format.
  - The most appropriate category for the expense from the following list: ${CATEGORIES.join(', ')}.
  - A brief, one-sentence summary of the purchase. The description MUST NOT be the same as the category name. For example, if the category is 'Groceries', a good description is 'Weekly grocery shopping at a supermarket'.

  Please return only the structured data as requested.

  Here is the receipt image to analyze:
  Photo: {{media url=photoDataUri}}`,
});

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async (input) => {
    // 1. Let the AI extract data from the image.
    const { output: aiOutput } = await AIExtractionPrompt({ photoDataUri: input.photoDataUri });

    if (!aiOutput) {
      throw new Error('AI failed to extract data from the receipt image.');
    }

    // 2. Merge AI output with user-provided overrides.
    // User data takes precedence.
    const finalData: ExtractReceiptDataOutput = {
      merchant: input.userMerchant || aiOutput.merchant,
      amount: input.userAmount || aiOutput.amount,
      date: input.userDate || aiOutput.date,
      category: (input.userCategory as Category) || aiOutput.category,
      description: input.userDescription || aiOutput.description,
    };
    
    return finalData;
  }
);
