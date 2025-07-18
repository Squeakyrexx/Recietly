
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
import { CATEGORIES, Category, TAX_CATEGORIES } from '@/lib/types';

const ExtractReceiptDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
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
  category: z.enum(CATEGORIES).describe('The most appropriate general spending category for the expense.'),
  isBusinessExpense: z.boolean().describe('Whether this is likely a business-related expense.'),
  taxCategory: z.enum(TAX_CATEGORIES).optional().describe('If this is a business expense, the specific tax category it falls into. If not a business expense, this should be omitted.'),
  description: z.string().describe('A short, one-sentence summary of the purchase. The description MUST NOT be the same as the category name. For example, if the category is \'Groceries\', a good description is \'Weekly grocery shopping at a supermarket\'.'),
  items: z.array(z.object({
    name: z.string().describe('The name of the individual item.'),
    price: z.number().describe('The price of the item.')
  })).optional().describe('A list of significant line items from the receipt. Only include up to 5 of the most expensive or important items. If no clear line items are visible, omit this field.'),
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
  - The most appropriate general spending category from the following list: ${CATEGORIES.join(', ')}.
  - A brief, one-sentence summary of the purchase. The description MUST NOT be the same as the category name. For example, if the category is 'Groceries', a good description is 'Weekly grocery shopping at a supermarket'.
  - A list of up to 5 of the most significant or expensive line items from the receipt, including their name and price. If there are no clear line items, omit the items field.
  - Based on the merchant and items, determine if this is likely a business expense. Set isBusinessExpense to true or false.
  - If you determine this is a business expense, you MUST classify it into one of the following tax categories: ${TAX_CATEGORIES.join(', ')}. If it is not a business expense, you MUST omit the taxCategory field.

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
    // User data takes precedence. The frontend action doesn't pass user overrides,
    // so this effectively just passes the AI output through, which is what we want.
    const finalData: ExtractReceiptDataOutput = {
      merchant: input.userMerchant || aiOutput.merchant,
      amount: input.userAmount || aiOutput.amount,
      date: input.userDate || aiOutput.date,
      category: (input.userCategory as Category) || aiOutput.category,
      description: input.userDescription || aiOutput.description,
      isBusinessExpense: aiOutput.isBusinessExpense,
      taxCategory: aiOutput.taxCategory,
      items: aiOutput.items,
    };
    
    return finalData;
  }
);
