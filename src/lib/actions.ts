'use server';

import { extractReceiptData as extractReceiptDataFlow } from '@/ai/flows/extract-receipt-data';
import { generateSpendingInsights as generateSpendingInsightsFlow } from '@/ai/flows/generate-spending-insights';
import { mockReceipts } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// We are replacing Zod validation for the upload with manual checks to debug a persistent issue.
export async function extractReceiptDataAction(prevState: any, formData: FormData) {
  const photo = formData.get('photo');

  // Manual validation
  if (!photo || !(photo instanceof File) || photo.size === 0) {
    return {
      message: 'A receipt image is required.',
      errors: { photo: ['A receipt image is required.'] },
      data: null,
    };
  }

  if (photo.size > 10 * 1024 * 1024) {
    return {
      message: 'File size must be less than 10MB.',
      errors: { photo: ['File size must be less than 10MB.'] },
      data: null,
    };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(photo.type)) {
    return {
      message: 'Only .jpg, .png, .gif, and .webp formats are supported.',
      errors: { photo: ['Only .jpg, .png, .gif, and .webp formats are supported.'] },
      data: null,
    };
  }

  try {
    const fileBuffer = await photo.arrayBuffer();
    const photoDataUri = `data:${photo.type};base64,${Buffer.from(fileBuffer).toString('base64')}`;

    const extractedData = await extractReceiptDataFlow({
      photoDataUri,
    });

    return { message: 'Data extracted. Please review.', data: extractedData, errors: null };
  } catch (error) {
    console.error(error);
    return {
      message: 'An error occurred while processing the receipt.',
      data: null,
      errors: { _form: ['AI processing failed. Please try again or enter details manually.'] },
    };
  }
}

const saveSchema = z.object({
  merchant: z.string().min(1, 'Merchant is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  date: z.string().min(1, 'Date is required.'),
  category: z.string().min(1, 'Category is required.'),
  description: z.string().optional(),
});

export async function saveReceiptAction(data: z.infer<typeof saveSchema>) {
  const validated = saveSchema.safeParse(data);

  if (!validated.success) {
    return { success: false, message: 'Invalid data provided for saving.' };
  }

  // In a real app, you would save this to a database.
  // For now, we just log it and revalidate to simulate the data being added.
  console.log('Saving receipt:', validated.data);

  revalidatePath('/receipts');
  revalidatePath('/dashboard');

  return { success: true, message: 'Receipt saved successfully!' };
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
