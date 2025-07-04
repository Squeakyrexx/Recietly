import { type Receipt, type SpendingByCategory, type Category } from '@/lib/types';

/**
 * In-memory store for receipts.
 * This is a simple solution for this demo application.
 * In a real-world application, you would use a database.
 *
 * We use a global object to persist the data across hot reloads in development.
 */
const globalForReceipts = global as unknown as {
    receipts: Receipt[] | undefined
}

// Initialize receipts only once. Start with an empty array.
const receipts: Receipt[] = globalForReceipts.receipts ?? [];

if (process.env.NODE_ENV !== 'production') {
    globalForReceipts.receipts = receipts;
}


export const getReceipts = (): Receipt[] => {
  // Return receipts sorted by date, newest first.
  return [...receipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addReceipt = (receipt: Omit<Receipt, 'id' | 'imageUrl'>) => {
    const d = new Date(receipt.date);
    // The `.toISOString()` method will throw a RangeError for an invalid date.
    // We check if the date is valid. If not, we default to the current date to avoid a crash.
    const isValidDate = !isNaN(d.getTime());
    
    const newReceipt: Receipt = {
        id: (receipts.length + 1).toString() + Date.now(), // Make ID more unique
        ...receipt,
        date: isValidDate ? d.toISOString() : new Date().toISOString(),
        // Assign a random placeholder image
        imageUrl: `https://placehold.co/${Math.floor(Math.random() * 200) + 400}x${Math.floor(Math.random() * 400) + 400}.png`,
    };
    receipts.unshift(newReceipt); // Add to the beginning of the array
};

export const getSpendingByCategory = (): SpendingByCategory[] => {
  const spendingMap: { [key: string]: number } = {};
  getReceipts().forEach((receipt) => {
    if (spendingMap[receipt.category]) {
      spendingMap[receipt.category] += receipt.amount;
    } else {
      spendingMap[receipt.category] = receipt.amount;
    }
  });

  return Object.entries(spendingMap).map(([category, total]) => ({
    category: category as Category,
    total: parseFloat(total.toFixed(2)),
  }));
};

export const getTotalSpending = (): number => {
  return getReceipts().reduce((total, receipt) => total + receipt.amount, 0);
};