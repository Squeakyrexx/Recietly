import { type Receipt, type SpendingByCategory } from '@/lib/types';
import { subDays, formatISO } from 'date-fns';

export const mockReceipts: Receipt[] = [
  {
    id: '1',
    merchant: 'FreshMart',
    amount: 75.42,
    date: formatISO(subDays(new Date(), 2)),
    category: 'Groceries',
    description: 'Weekly groceries',
    imageUrl: 'https://placehold.co/600x800.png',
  },
  {
    id: '2',
    merchant: 'City Transit',
    amount: 25.0,
    date: formatISO(subDays(new Date(), 3)),
    category: 'Transport',
    description: 'Metro pass top-up',
    imageUrl: 'https://placehold.co/600x400.png',
  },
  {
    id: '3',
    merchant: 'Cineplex',
    amount: 42.5,
    date: formatISO(subDays(new Date(), 5)),
    category: 'Entertainment',
    description: 'Movie tickets and snacks',
    imageUrl: 'https://placehold.co/400x600.png',
  },
  {
    id: '4',
    merchant: 'Spark Energy',
    amount: 120.99,
    date: formatISO(subDays(new Date(), 10)),
    category: 'Utilities',
    description: 'Monthly electricity bill',
    imageUrl: 'https://placehold.co/800x600.png',
  },
  {
    id: '5',
    merchant: 'The Corner Bistro',
    amount: 55.8,
    date: formatISO(subDays(new Date(), 1)),
    category: 'Dining',
    description: 'Dinner with friends',
    imageUrl: 'https://placehold.co/600x600.png',
  },
  {
    id: '6',
    merchant: 'Book Haven',
    amount: 29.95,
    date: formatISO(subDays(new Date(), 15)),
    category: 'Other',
    description: 'New novel',
    imageUrl: 'https://placehold.co/400x500.png',
  },
  {
    id: '7',
    merchant: 'Green Grocers',
    amount: 32.15,
    date: formatISO(subDays(new Date(), 4)),
    category: 'Groceries',
    description: 'Fruits and vegetables',
    imageUrl: 'https://placehold.co/500x700.png',
  },
  {
    id: '8',
    merchant: 'Gas & Go',
    amount: 60.21,
    date: formatISO(subDays(new Date(), 7)),
    category: 'Transport',
    description: 'Fuel for car',
    imageUrl: 'https://placehold.co/700x500.png',
  },
];

export const getSpendingByCategory = (): SpendingByCategory[] => {
  const spendingMap: { [key: string]: number } = {};
  mockReceipts.forEach((receipt) => {
    if (spendingMap[receipt.category]) {
      spendingMap[receipt.category] += receipt.amount;
    } else {
      spendingMap[receipt.category] = receipt.amount;
    }
  });

  return Object.entries(spendingMap).map(([category, total]) => ({
    category,
    total: parseFloat(total.toFixed(2)),
  }));
};

export const getTotalSpending = (): number => {
  return mockReceipts.reduce((total, receipt) => total + receipt.amount, 0);
};
