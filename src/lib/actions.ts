'use server';

import { extractReceiptData as extractReceiptDataFlow } from '@/ai/flows/extract-receipt-data';
import { generateSpendingInsights as generateSpendingInsightsFlow } from '@/ai/flows/generate-spending-insights';
import { mockReceipts } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const receiptSchema = z.object({
  photo: z.any(),
  merchant: z.string().optional(),
  amount: z.coerce.number().optional(),
  date: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
});

export async function extractReceiptDataAction(prevState: any, formData: FormData) {
  const validatedFields = receiptSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  const { photo, ...userFields } = validatedFields.data;

  if (!photo || photo.size === 0) {
    return { message: 'A receipt image is required.', data: null };
  }

  try {
    const fileBuffer = await photo.arrayBuffer();
    const photoDataUri = `data:${photo.type};base64,${Buffer.from(fileBuffer).toString('base64')}`;

    const extractedData = await extractReceiptDataFlow({
      photoDataUri,
      userMerchant: userFields.merchant,
      userAmount: userFields.amount,
      userDate: userFields.date,
      userCategory: userFields.category,
      userDescription: userFields.description,
    });
    
    // In a real app, you would save this to a database.
    // Here we just revalidate to show the "new" data if it were dynamic.
    revalidatePath('/receipts');
    revalidatePath('/dashboard');

    return { message: 'Receipt processed successfully!', data: extractedData };
  } catch (error) {
    console.error(error);
    return { message: 'An error occurred while processing the receipt.', data: null };
  }
}

export async function generateSpendingInsightsAction() {
  try {
    const spendingData = JSON.stringify(mockReceipts);
    const result = await generateSpendingInsightsFlow({ spendingData });
    return { insight: result.insights, error: null };
  } catch (error) {
    console.error(error);
    return { insight: null, error: 'Failed to generate insights. Please try again.' };
  }
}
