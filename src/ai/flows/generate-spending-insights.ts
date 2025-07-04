'use server';

/**
 * @fileOverview A flow for generating spending insights based on user's spending data.
 *
 * - generateSpendingInsights - A function that generates spending insights.
 * - GenerateSpendingInsightsInput - The input type for the generateSpendingInsights function.
 * - GenerateSpendingInsightsOutput - The return type for the generateSpendingInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSpendingInsightsInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'A stringified JSON array containing the user spending data. Each object in array has keys like merchant, amount, date, category, and description'
    ),
});
export type GenerateSpendingInsightsInput = z.infer<typeof GenerateSpendingInsightsInputSchema>;

const GenerateSpendingInsightsOutputSchema = z.object({
  insights: z
    .string()
    .describe(
      'AI-generated insights on spending patterns, identifying areas for potential savings.'
    ),
});
export type GenerateSpendingInsightsOutput = z.infer<typeof GenerateSpendingInsightsOutputSchema>;

export async function generateSpendingInsights(
  input: GenerateSpendingInsightsInput
): Promise<GenerateSpendingInsightsOutput> {
  return generateSpendingInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSpendingInsightsPrompt',
  input: {schema: GenerateSpendingInsightsInputSchema},
  output: {schema: GenerateSpendingInsightsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's spending data and provide insights on their spending patterns, identifying areas where they can save money.

  Spending Data: {{{spendingData}}}
  
  Provide concise and actionable insights.`,
});

const generateSpendingInsightsFlow = ai.defineFlow(
  {
    name: 'generateSpendingInsightsFlow',
    inputSchema: GenerateSpendingInsightsInputSchema,
    outputSchema: GenerateSpendingInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
