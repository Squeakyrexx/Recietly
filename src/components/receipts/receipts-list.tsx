'use client';

import { useState, useEffect } from 'react';
import { type Receipt } from '@/lib/types';
import { ReceiptCard } from './receipt-card';
import { ReceiptDetailsDialog } from './receipt-details-dialog';
import Link from 'next/link';
import { Button } from '../ui/button';

export function ReceiptsList({ initialReceipts }: { initialReceipts: Receipt[] }) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    setReceipts(initialReceipts);
  }, [initialReceipts]);

  const handleReceiptUpdate = (updatedReceipt: Receipt) => {
    setReceipts(receipts.map(r => r.id === updatedReceipt.id ? updatedReceipt : r));
  };
  
  const handleReceiptDelete = (deletedReceiptId: string) => {
    setReceipts(receipts.filter(r => r.id !== deletedReceiptId));
    setSelectedReceipt(null);
  };


  return (
    <>
      <ReceiptDetailsDialog
        open={!!selectedReceipt}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReceipt(null);
          }
        }}
        receipt={selectedReceipt}
        onReceiptUpdate={handleReceiptUpdate}
        onReceiptDelete={handleReceiptDelete}
      />
      {receipts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {receipts.map((receipt) => (
            <div key={receipt.id} onClick={() => setSelectedReceipt(receipt)} className="cursor-pointer">
              <ReceiptCard receipt={receipt} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <h3 className="text-xl font-semibold">No receipts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload your first receipt to get started.</p>
          <Link href="/upload">
            <Button>Upload Receipt</Button>
          </Link>
        </div>
      )}
    </>
  );
}
