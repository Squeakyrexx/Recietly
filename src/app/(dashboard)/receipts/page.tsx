
'use client';

import { useState, useEffect } from 'react';
import { getReceipts } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ReceiptsList } from '@/components/receipts/receipts-list';
import { useAuth } from '@/context/auth-context';
import type { Receipt } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function ReceiptsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[] | null>(null);

  useEffect(() => {
    if (loading || !user) {
        return;
    }

    const fetchReceipts = async () => {
        try {
            const data = await getReceipts(user.uid);
            setReceipts(data);
        } catch (error) {
            console.error("Failed to fetch receipts:", error);
            toast({
                title: 'Error Loading Receipts',
                description: 'Could not load your receipts. Please try again later.',
                variant: 'destructive'
            });
        }
    };
    
    fetchReceipts();
  }, [user, loading, toast]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">My Receipts</h1>
          <p className="text-muted-foreground">All your uploaded receipts in one place.</p>
        </div>
        <Link href="/upload">
          <Button>Upload New Receipt</Button>
        </Link>
      </header>
      {receipts === null ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : (
        <ReceiptsList initialReceipts={receipts} />
      )}
    </div>
  );
}
