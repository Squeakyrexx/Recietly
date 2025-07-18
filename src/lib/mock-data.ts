
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  setDoc,
  getDoc,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { type Receipt, type SpendingByCategory, type Category, CATEGORIES, type TaxCategory } from '@/lib/types';

// NOTE: All functions now require a userId to operate on user-specific data.

export const getReceipts = async (userId: string): Promise<Receipt[]> => {
  if (!userId) {
    console.error("getReceipts called without a userId.");
    return [];
  };
  try {
    const receiptsCollection = collection(db, 'users', userId, 'receipts');
    const q = query(receiptsCollection, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    const receipts: Receipt[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      receipts.push({ 
          id: doc.id,
          ...data,
          // Ensure amount is always a number right after fetching
          amount: Number(data.amount || 0),
      } as Receipt);
    });
    return receipts;
  } catch (error) {
    console.error(`Error fetching receipts for user ${userId}:`, error);
    // Re-throw the error so the calling component knows something went wrong.
    throw error;
  }
};

export const addReceipt = async (userId: string, receipt: Omit<Receipt, 'id'>) => {
  if (!userId) {
    throw new Error('User not authenticated. Cannot add receipt.');
  }
  const d = new Date(receipt.date.replace(/-/g, '/'));
  const isValidDate = !isNaN(d.getTime());

  // This is the definitive fix. We are creating a brand new object
  // to guarantee no accidental image data can be passed to the database.
  const newReceipt: Omit<Receipt, 'id'> = {
    merchant: receipt.merchant,
    amount: Number(receipt.amount || 0),
    date: isValidDate ? receipt.date : new Date().toISOString().split('T')[0],
    category: receipt.category,
    description: receipt.description || '',
    isBusinessExpense: receipt.isBusinessExpense || false,
    taxCategory: receipt.isBusinessExpense ? receipt.taxCategory : undefined,
    items: receipt.items || [],
  };

  const receiptsCollection = collection(db, 'users', userId, 'receipts');
  await addDoc(receiptsCollection, newReceipt);
};

export const updateReceipt = async (userId: string, updatedReceipt: Receipt) => {
  if (!userId) {
    throw new Error('User not authenticated. Cannot update receipt.');
  }
  const receiptDoc = doc(db, 'users', userId, 'receipts', updatedReceipt.id);
  const { id, ...data } = updatedReceipt;

  const dataToUpdate: Omit<Receipt, 'id' | 'taxCategory'> & { taxCategory?: TaxCategory } = { 
      ...data, 
      // Ensure amount is a number before saving
      amount: Number(data.amount || 0),
      items: data.items || [],
    };
  if (!dataToUpdate.isBusinessExpense) {
    delete dataToUpdate.taxCategory;
  }

  await updateDoc(receiptDoc, dataToUpdate as { [x: string]: any });
};

export const deleteReceipt = async (userId: string, id: string) => {
  if (!userId) {
    throw new Error('User not authenticated. Cannot delete receipt.');
  }
  const receiptDoc = doc(db, 'users', userId, 'receipts', id);
  await deleteDoc(receiptDoc);
};

export const getSpendingByCategory = async (userId: string, { month }: { month: 'current' | 'all' }): Promise<SpendingByCategory[]> => {
  if (!userId) {
    console.error("getSpendingByCategory called without a userId.");
    return [];
  };
  const allReceipts = await getReceipts(userId);
  const spendingMap: { [key in Category]?: number } = {};
  
  for (const receipt of allReceipts) {
    const amount = Number(receipt.amount) || 0;
    const category = receipt.category;
    spendingMap[category] = (spendingMap[category] || 0) + amount;
  }

  return Object.entries(spendingMap).map(([category, total]) => ({
      category: category as Category,
      total: parseFloat(total!.toFixed(2)),
  }));
};

export const getTotalSpending = async (userId: string): Promise<number> => {
    if (!userId) {
      console.error("getTotalSpending called without a userId.");
      return 0;
    };
    const allReceipts = await getReceipts(userId);
    let total = 0;
    for (const receipt of allReceipts) {
        total += Number(receipt.amount) || 0;
    }
    return total;
};

export const getBudgets = async (userId: string): Promise<{ [key in Category]?: number }> => {
    if (!userId) {
      console.error("getBudgets called without a userId.");
      return {};
    };
    try {
        const budgetsDocRef = doc(db, 'users', userId, 'budgets', 'data');
        const docSnap = await getDoc(budgetsDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as { [key in Category]?: number };
        } else {
            // Return default budgets if none are set
            return CATEGORIES.reduce((acc, cat) => ({...acc, [cat]: 0}), {} as { [key in Category]?: number });
        }
    } catch (error) {
        console.error(`Error fetching budgets for user ${userId}:`, error);
        throw error;
    }
}

export const setBudget = async (userId: string, { category, amount }: { category: Category, amount: number }) => {
    if (!userId) {
      throw new Error('User not authenticated. Cannot set budget.');
    }
    const budgetsDocRef = doc(db, 'users', userId, 'budgets', 'data');
    // We use setDoc with merge: true to create or update the document
    await setDoc(budgetsDocRef, { [category]: amount }, { merge: true });
}

// REAL-TIME LISTENERS

export const listenToReceipts = (
  userId: string,
  callback: (receipts: Receipt[]) => void,
  onError: (error: Error) => void
) => {
  if (!userId) return () => {}; // Return an empty unsubscribe function if no user
  const receiptsCollection = collection(db, 'users', userId, 'receipts');
  const q = query(receiptsCollection, orderBy('date', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const receipts: Receipt[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Sanitize amount on read to prevent calculation errors.
      // This converts any value to a number, and treats invalid numbers (NaN) as 0.
      const amount = Number(data.amount);
      const receipt: Receipt = {
        id: doc.id,
        merchant: data.merchant,
        amount: isNaN(amount) ? 0 : amount,
        date: data.date,
        category: data.category,
        description: data.description,
        isBusinessExpense: data.isBusinessExpense,
        taxCategory: data.taxCategory,
        items: data.items,
      };
      receipts.push(receipt);
    });
    callback(receipts);
  }, (error) => {
      console.error(`Error listening to receipts for user ${userId}:`, error);
      onError(error);
  });

  return unsubscribe;
};

export const listenToBudgets = (
  userId: string,
  callback: (budgets: { [key in Category]?: number }) => void,
  onError: (error: Error) => void
) => {
  if (!userId) return () => {}; // Return an empty unsubscribe function if no user
  const budgetsDocRef = doc(db, 'users', userId, 'budgets', 'data');

  const unsubscribe = onSnapshot(budgetsDocRef, (docSnap) => {
     if (docSnap.exists()) {
        callback(docSnap.data() as { [key in Category]?: number });
    } else {
        // If no document exists, provide a default object
        callback(CATEGORIES.reduce((acc, cat) => ({...acc, [cat]: 0}), {} as { [key in Category]?: number }));
    }
  }, (error) => {
      console.error(`Error listening to budgets for user ${userId}:`, error);
      onError(error);
  });

  return unsubscribe;
}
