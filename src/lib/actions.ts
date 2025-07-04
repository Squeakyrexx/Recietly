'use server';

import { extractReceiptData as extractReceiptDataFlow } from '@/ai/flows/extract-receipt-data';
import { generateSpendingInsights as generateSpendingInsightsFlow } from '@/ai/flows/generate-spending-insights';
import { mockReceipts } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const uploadSchema = z.object({
  photo: z
    .instanceof(File, { message: 'A receipt image is required.' })
    .refine((file) => file.size > 0, 'A receipt image is required.')
    .refine((file) => file.size < 10 * 1024 * 1024, 'File size must be less than 10MB.')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      'Only .jpg, .png, .gif, and .webp formats are supported.'
    ),
});

export async function extractReceiptDataAction(prevState: any, formData: FormData) {
  const validatedFields = uploadSchema.safeParse({
    photo: formData.get('photo'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  const { photo } = validatedFields.data;

  try {
    const fileBuffer = await photo.arrayBuffer();
    const photoDataUri = `data:${photo.type};base64,${Buffer.from(fileBuffer).toString('base64')}`;

    // The AI flow handles undefined optional fields correctly.
    const extractedData = await extractReceiptDataFlow({
      photoDataUri,
    });
    
    return { message: 'Data extracted. Please review.', data: extractedData, errors: null };
  } catch (error) {
    console.error(error);
    return { message: 'An error occurred while processing the receipt.', data: null, errors: { _form: ['AI processing failed. Please try again or enter details manually.'] } };
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
    console.log("Saving receipt:", validated.data);

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
