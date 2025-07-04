import { type z } from 'zod';
import { type extractReceiptData } from '@/ai/flows/extract-receipt-data';

export const CATEGORIES = ['Groceries', 'Transport', 'Entertainment', 'Utilities', 'Dining', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Receipt = {
  id: string;
  merchant: string;
  amount: number;
  date: string; // Storing as YYYY-MM-DD string
  category: Category;
  description: string;
  imageDataUri: string;
};

export type SpendingByCategory = {
  category: Category;
  total: number;
};

export type ExtractedReceiptData = z.infer<typeof extractReceiptData.outputSchema>;

export type Budget = {
    category: Category;
    amount: number;
}
