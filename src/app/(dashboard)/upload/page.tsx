
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { listenToReceipts } from '@/lib/mock-data';
import type { Receipt } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

// A skeleton loader to show while the UploadForm is loading.
const UploadFormSkeleton = () => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
        </div>
        <div className="text-center">
            <Skeleton className="h-4 w-48 mx-auto" />
        </div>
    </div>
);

// Dynamically import UploadForm and disable Server-Side Rendering (SSR).
// This ensures the component only renders on the client.
const UploadForm = dynamic(() => import('@/components/upload/upload-form').then(mod => mod.UploadForm), {
  ssr: false,
  loading: () => <UploadFormSkeleton />,
});

const SCAN_LIMIT = 10;

export default function UploadPage() {
  const { user, loading, isPremium } = useAuth();
  const { toast } = useToast();
  const [receiptCount, setReceiptCount] = useState<number | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    if (loading || !user) {
        setReceiptCount(null);
        return;
    }
    const unsubscribe = listenToReceipts(user.uid, (receipts) => {
        setReceiptCount(receipts.length);
    }, (error) => {
        console.error("Failed to fetch receipt count:", error);
        toast({
            title: 'Error Loading Data',
            description: 'Could not verify your upload limit. Please try again later.',
            variant: 'destructive'
        });
    });
    return () => unsubscribe();
  }, [user, loading, toast]);
  
  const pageIsLoading = loading || !isClientReady || receiptCount === null;
  const scansLeft = SCAN_LIMIT - (receiptCount ?? 0);
  
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Upload Receipt</h1>
        <p className="text-muted-foreground">Add a new expense by uploading a receipt image.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Process a New Receipt</CardTitle>
          <CardDescription>
            Upload a photo of your receipt. Our AI will extract the details.
          </CardDescription>
           {!pageIsLoading && !isPremium && receiptCount !== null && (
            <div className="pt-2 text-sm space-y-1">
                <Progress value={(receiptCount / SCAN_LIMIT) * 100} className="h-2" />
                <div className="flex justify-between text-muted-foreground">
                    <span>You have {scansLeft < 0 ? 0 : scansLeft} scans left.</span>
                    <span>{receiptCount}/{SCAN_LIMIT} used</span>
                </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {pageIsLoading ? (
            <UploadFormSkeleton />
          ) : user ? (
            <UploadForm user={user} receiptCount={receiptCount!} />
          ) : (
            <div className="text-center p-8 space-y-4 text-muted-foreground">
                <p>Please log in to upload receipts.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
