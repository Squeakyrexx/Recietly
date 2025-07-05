
'use server';

import { extractReceiptData as extractReceiptDataFlow } from '@/ai/flows/extract-receipt-data';
import { generateSpendingInsights as generateSpendingInsightsFlow } from '@/ai/flows/generate-spending-insights';
import { generateReceiptNarration as generateReceiptNarrationFlow } from '@/ai/flows/generate-receipt-narration';
import { revalidatePath } from 'next/cache';
import type { Receipt } from '@/lib/types';
import { format } from 'date-fns';

// This action is fine as it only uses Genkit and does not interact with Firestore.
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

// This action is now modified to accept spending data directly,
// instead of fetching it from Firestore on the server.
export async function generateSpendingInsightsAction(spendingData: string) {
  if (!spendingData || spendingData === '[]') {
      return { insight: "You don't have any spending data yet. Upload some receipts to get started!", error: null };
  }
  try {
    const result = await generateSpendingInsightsFlow({ spendingData });
    return { insight: result.insights, error: null };
  } catch (error) {
    console.error(error);
    return { insight: null, error: 'Failed to generate insights. Please try again.' };
  }
}

// This new, dedicated action handles cache revalidation from the client.
export async function revalidateAllAction() {
  revalidatePath('/', 'layout');
}

export async function generateReceiptNarrationAction(receipt: Receipt) {
  try {
    const formattedDate = format(new Date(receipt.date.replace(/-/g, '/')), 'MMMM do, yyyy');
    let narrationText = `This is a receipt from ${receipt.merchant} for $${receipt.amount.toFixed(2)}, dated ${formattedDate}.`;

    if (receipt.items && receipt.items.length > 0) {
      const itemsText = receipt.items.map(item => `${item.name} for $${item.price.toFixed(2)}`).join(', ');
      narrationText += ` The main items are: ${itemsText}.`;
    }
    
    if(receipt.isBusinessExpense) {
        narrationText += ` This was marked as a business expense under the category ${receipt.taxCategory || 'Business'}.`
    }

    const result = await generateReceiptNarrationFlow(narrationText);
    return { narrationUrl: result.media, error: null };
  } catch (error) {
    console.error('Error in generateReceiptNarrationAction:', error);
    return {
      narrationUrl: null,
      error: 'Could not generate audio for this receipt.',
    };
  }
}
