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

export const addReceipt = (receipt: Omit<Receipt, 'id'>) => {
    const d = new Date(receipt.date);
    // The `.toISOString()` method will throw a RangeError for an invalid date.
    // We check if the date is valid. If not, we default to the current date to avoid a crash.
    const isValidDate = !isNaN(d.getTime());
    
    const newReceipt: Receipt = {
        id: (receipts.length + 1).toString() + Date.now(), // Make ID more unique
        ...receipt,
        // The date from the form is a string like 'YYYY-MM-DD'.
        // To make it a valid ISO string that doesn't shift based on timezone, we can add T00:00:00.000Z
        // However, this can cause "day behind" issues in some timezones.
        // A simple approach is to just store the YYYY-MM-DD and parse it carefully on the client.
        // For this demo, we'll assume the date string is sufficient and just store it.
        date: isValidDate ? receipt.date : new Date().toISOString().split('T')[0],
    };
    receipts.unshift(newReceipt); // Add to the beginning of the array
};

export const updateReceipt = (updatedReceipt: Receipt) => {
    const index = receipts.findIndex(r => r.id === updatedReceipt.id);
    if (index !== -1) {
        receipts[index] = updatedReceipt;
    }
}

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
