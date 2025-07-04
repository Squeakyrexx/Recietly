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
  category: z.string().describe('The category of the expense.'),
  description: z.string().describe('A short description of the purchase.'),
});
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  return extractReceiptDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractReceiptDataPrompt',
  input: {schema: ExtractReceiptDataInputSchema},
  output: {schema: ExtractReceiptDataOutputSchema},
  prompt: `You are an expert accounting assistant specializing in extracting data from receipts.

  You will use this information to extract the merchant, amount, date, category, and description from the receipt.
  The category must be one of the following: Groceries, Transport, Entertainment, Utilities, Dining, Other.
  The date should be in YYYY-MM-DD format.
  The description MUST be a brief, one-sentence summary of the purchase and should NOT be the same as the category name. For example, if the category is 'Groceries', a good description would be 'Weekly grocery shopping' or 'Purchase of fresh produce'. A bad description would be 'Groceries'.

  If the user has provided values for any of these fields, you must use those values instead of the values you extract from the receipt.

  Here is the receipt:
  Photo: {{media url=photoDataUri}}

  Here is the information provided by the user:
  Merchant: {{userMerchant}}
  Amount: {{userAmount}}
  Date: {{userDate}}
  Category: {{userCategory}}
  Description: {{userDescription}}`,
});

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
