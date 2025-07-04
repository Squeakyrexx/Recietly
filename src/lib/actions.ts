'use server';

import { extractReceiptData as extractReceiptDataFlow } from '@/ai/flows/extract-receipt-data';
import { generateSpendingInsights as generateSpendingInsightsFlow } from '@/ai/flows/generate-spending-insights';
import { addReceipt, getReceipts, updateReceipt, deleteReceipt, setBudget } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type ExtractedReceiptData, CATEGORIES, type Receipt, type Category } from './types';

export async function extractReceiptDataAction({photoDataUri}: {photoDataUri: string}) {
  if (!photoDataUri) {
    return {
      message: 'A receipt image is required. Please select a file.',
      data: null,
      error: 'File not provided.',
    }
  }

  // Basic validation for data URI
  if (!photoDataUri.startsWith('data:image/')) {
    return {
      message: 'Invalid file type. Please upload an image.',
      data: null,
      error: 'Invalid file type.',
    }
  }

  try {
    const extractedData = await extractReceiptDataFlow({
      photoDataUri,
    });
    return { message: 'Data extracted. Please review.', data: extractedData, error: null };
  } catch (error) {
    console.error('Error in extractReceiptDataAction:', error);
    return {
      message: 'An error occurred while processing the receipt.',
      data: null,
      error: 'AI processing failed. The image might be unreadable or a server error occurred. Please try again.',
    };
  }
}

const receiptDataSchema = z.object({
  merchant: z.string().min(1, 'Merchant is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  date: z.string().min(1, 'Date is required.'),
  category: z.enum(CATEGORIES),
  description: z.string().optional(),
});

const saveSchema = z.object({
  receiptData: receiptDataSchema,
  photoDataUri: z.string().nullable(), // Allow null for manual entry
});


export async function saveReceiptAction({ receiptData, photoDataUri }: { receiptData: ExtractedReceiptData, photoDataUri: string | null }) {
  const validated = receiptDataSchema.safeParse(receiptData);

  if (!validated.success) {
    const errorMessages = validated.error.errors.map(e => e.message).join(', ');
    return { success: false, message: `Invalid data: ${errorMessages}` };
  }
  
  const receiptToSave = {
    ...validated.data,
    description: validated.data.description || '', // Ensure description is a string
  }

  // Use a placeholder if no image was provided (manual entry)
  const imageDataUri = photoDataUri || `https://placehold.co/600x400.png`;
  
  addReceipt({ ...receiptToSave, imageDataUri });
  
  revalidatePath('/receipts');
  revalidatePath('/dashboard');

  return { success: true, message: 'Receipt saved successfully!' };
}

const updateSchema = z.object({
    id: z.string(),
    imageDataUri: z.string(),
}).merge(receiptDataSchema);


export async function updateReceiptAction(receiptData: Receipt) {
  const validated = updateSchema.safeParse(receiptData);

  if (!validated.success) {
    const errorMessages = validated.error.errors.map(e => e.message).join(', ');
    return { success: false, message: `Invalid data: ${errorMessages}` };
  }
  
  const receiptToUpdate = {
    ...validated.data,
    description: validated.data.description || '',
  }
  
  updateReceipt(receiptToUpdate);
  
  revalidatePath('/receipts');
  revalidatePath('/dashboard');

  return { success: true, message: 'Receipt updated successfully!' };
}

export async function deleteReceiptAction(id: string) {
    if (!id) {
        return { success: false, message: 'No ID provided for deletion.' };
    }
    deleteReceipt(id);
    revalidatePath('/receipts');
    revalidatePath('/dashboard');
    return { success: true, message: 'Receipt deleted.' };
}


export async function generateSpendingInsightsAction() {
  try {
    const spendingData = JSON.stringify(getReceipts());
    const result = await generateSpendingInsightsFlow({ spendingData });
    return { insight: result.insights, error: null };
  } catch (error) {
    console.error(error);
    return { insight: null, error: 'Failed to generate insights. Please try again.' };
  }
}

const budgetSchema = z.object({
    category: z.enum(CATEGORIES),
    amount: z.coerce.number().min(0, 'Budget amount cannot be negative.')
});

export async function setBudgetAction({ category, amount }: { category: Category, amount: number }) {
    const validated = budgetSchema.safeParse({ category, amount });

    if (!validated.success) {
        const errorMessages = validated.error.errors.map(e => e.message).join(', ');
        return { success: false, message: `Invalid data: ${errorMessages}` };
    }

    setBudget(validated.data);
    
    revalidatePath('/budgets');
    revalidatePath('/dashboard');
    
    return { success: true, message: 'Budget updated!' };
}
