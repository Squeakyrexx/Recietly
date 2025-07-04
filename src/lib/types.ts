import { type z } from 'zod';
import { type extractReceiptData } from '@/ai/flows/extract-receipt-data';

export const CATEGORIES = ['Groceries', 'Transport', 'Entertainment', 'Utilities', 'Dining', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Receipt = {
  id: string;
  merchant: string;
  amount: number;
  date: string; // ISO string for simplicity
  category: Category;
  description: string;
  imageUrl: string;
};

export type SpendingByCategory = {
  category: string;
  total: number;
};

export type ExtractedReceiptData = z.infer<typeof extractReceiptData.outputSchema>;
