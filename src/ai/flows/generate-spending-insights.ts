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
import { CATEGORIES } from '@/lib/types';

const GenerateSpendingInsightsInputSchema = z.object({
  spendingData: z
    .string()
    .describe(
      'A stringified JSON array containing the user spending data. Each object in array has keys like merchant, amount, date, category, and description'
    ),
});
export type GenerateSpendingInsightsInput = z.infer<typeof GenerateSpendingInsightsInputSchema>;

const GenerateSpendingInsightsOutputSchema = z.object({
  summary: z.string().describe("A one-sentence overall summary of the user's spending habits for the period."),
  positiveInsight: z.string().describe("A positive observation or encouragement about their spending."),
  areasForImprovement: z.array(z.object({
    category: z.enum(CATEGORIES).optional().describe("The spending category this insight relates to, if applicable."),
    observation: z.string().describe("A specific observation about an area where the user could save money or improve their habits."),
    suggestion: z.string().describe("A concrete, actionable suggestion for the user."),
  })).describe("A list of 2-3 specific areas where the user can improve their spending habits.")
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
  prompt: `You are a friendly and encouraging personal finance advisor. Analyze the user's spending data and provide insights in the structured JSON format requested.

- The 'summary' should be a single, concise sentence that gives an overview of their spending for the period.
- The 'positiveInsight' should be something they are doing well. Be encouraging! For example, "You're doing a great job keeping your Utilities spending consistent."
- The 'areasForImprovement' should be a list of 2 or 3 actionable tips. For each tip:
  - If it's about a specific spending category, specify the 'category'.
  - The 'observation' should state what you see in the data (e.g., "Your 'Dining' spending is higher than other categories.").
  - The 'suggestion' should be a clear, easy-to-follow tip (e.g., "Try cooking at home for one extra meal this week.").

Spending Data: {{{spendingData}}}

Provide concise and actionable insights. Do not be overly verbose.`,
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
