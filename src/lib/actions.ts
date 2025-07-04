'use server';

import { extractReceiptData as extractReceiptDataFlow } from '@/ai/flows/extract-receipt-data';
import { generateSpendingInsights as generateSpendingInsightsFlow } from '@/ai/flows/generate-spending-insights';
import { mockReceipts } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function extractReceiptDataAction(prevState: any, formData: FormData) {
  const photo = formData.get('photo') as File | null;

  // More robust validation
  if (!photo || photo.size === 0) {
    return {
      message: 'Validation failed.',
      errors: { photo: ['A receipt image is required. Please select a file.'] },
      data: null,
    };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(photo.type)) {
    return {
      message: 'Invalid file type.',
      errors: { photo: ['Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.'] },
      data: null,
    };
  }

  const MAX_FILE_SIZE_MB = 10;
  if (photo.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return {
      message: 'File size limit exceeded.',
      errors: { photo: [`The image must be less than ${MAX_FILE_SIZE_MB}MB.`] },
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
    console.error('Error in extractReceiptDataAction:', error);
    return {
      message: 'An error occurred while processing the receipt.',
      data: null,
      errors: { _form: ['AI processing failed. The image might be unreadable or a server error occurred. Please try again.'] },
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
