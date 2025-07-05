
'use server';

import { extractReceiptData as extractReceiptDataFlow } from '@/ai/flows/extract-receipt-data';
import { generateSpendingInsights as generateSpendingInsightsFlow } from '@/ai/flows/generate-spending-insights';
import { revalidatePath } from 'next/cache';

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
