'use client';

import { useState, useEffect } from 'react';
import { type Receipt } from '@/lib/types';
import { ReceiptCard } from './receipt-card';
import { ReceiptDetailsDialog } from './receipt-details-dialog';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, FileText } from 'lucide-react';

export function ReceiptsList({ initialReceipts }: { initialReceipts: Receipt[] }) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [filter, setFilter] = useState('all');

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

  const filteredReceipts = receipts.filter(receipt => {
    if (filter === 'business') {
      return receipt.isBusinessExpense;
    }
    return true;
  });

  const businessExpenseCount = receipts.filter(r => r.isBusinessExpense).length;

  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <h3 className="text-xl font-semibold">No receipts yet</h3>
        <p className="text-sm text-muted-foreground mb-4">Upload your first receipt to get started.</p>
        <Link href="/upload">
          <Button>Upload Receipt</Button>
        </Link>
      </div>
    );
  }

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

      <div className="space-y-6">
        <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
                <TabsTrigger value="all">
                    <FileText className="mr-2 h-4 w-4"/> All Receipts ({receipts.length})
                </TabsTrigger>
                <TabsTrigger value="business">
                    <Briefcase className="mr-2 h-4 w-4"/> Business ({businessExpenseCount})
                </TabsTrigger>
            </TabsList>
        </Tabs>
        
        {filteredReceipts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredReceipts.map((receipt) => (
                <div key={receipt.id} onClick={() => setSelectedReceipt(receipt)} className="cursor-pointer">
                <ReceiptCard receipt={receipt} />
                </div>
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">No business expenses found</h3>
                <p className="text-sm text-muted-foreground">Receipts you mark as 'Business Expense' will appear here.</p>
            </div>
        )}
      </div>
    </>
  );
}
