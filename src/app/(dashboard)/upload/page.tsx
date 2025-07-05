'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { listenToReceipts } from '@/lib/mock-data';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Gem } from 'lucide-react';

const FREE_SCAN_LIMIT = 5;

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


export default function UploadPage() {
  const { user, loading } = useAuth();
  const [isClientReady, setIsClientReady] = useState(false);
  const [monthlyScans, setMonthlyScans] = useState<number | null>(null);

  useEffect(() => {
    setIsClientReady(true);
  }, []);
  
  useEffect(() => {
    if (!user) {
        setMonthlyScans(null);
        return;
    };

    const unsubscribe = listenToReceipts(user.uid, (receipts) => {
        const now = new Date();
        const currentYearMonth = now.toISOString().slice(0, 7);
        const currentMonthReceipts = receipts.filter(r => r.date && r.date.startsWith(currentYearMonth));
        setMonthlyScans(currentMonthReceipts.length);
    }, (error) => {
        console.error("Failed to fetch receipts for scan count:", error);
        setMonthlyScans(0); // Default to 0 on error
    });

    return () => unsubscribe();
  }, [user]);

  const isLoading = loading || monthlyScans === null || !isClientReady;
  const scansRemaining = monthlyScans !== null ? Math.max(0, FREE_SCAN_LIMIT - monthlyScans) : 0;
  const scansUsed = monthlyScans !== null ? monthlyScans : 0;
  const hasFreeScans = scansRemaining > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Upload Receipt</h1>
        <p className="text-muted-foreground">Add a new expense by uploading a receipt image.</p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Monthly Usage</CardTitle>
            <CardDescription>Your free plan includes {FREE_SCAN_LIMIT} AI receipt scans per month.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-2 w-full" />
                </div>
            ) : (
                <>
                    <div className="flex justify-between text-sm font-medium mb-1">
                        <span>{scansUsed} / {FREE_SCAN_LIMIT} scans used</span>
                        <span className="text-primary">{scansRemaining} remaining</span>
                    </div>
                    <Progress value={(scansUsed / FREE_SCAN_LIMIT) * 100} />
                </>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Process a New Receipt</CardTitle>
          <CardDescription>
            {hasFreeScans ? 
                "Upload a photo of your receipt. Our AI will extract the details." :
                "You've used all your free scans for this month."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <UploadFormSkeleton />
          ) : user && hasFreeScans ? (
            <UploadForm user={user} />
          ) : (
            <div className="text-center p-8 space-y-4">
                <Gem className="mx-auto h-12 w-12 text-primary" />
                <h3 className="text-xl font-semibold">Upgrade to Pro</h3>
                <p className="text-muted-foreground">You've reached your monthly limit of {FREE_SCAN_LIMIT} scans. Upgrade to Recietly Pro for unlimited uploads and more features.</p>
                <Link href="/settings">
                    <Button>Upgrade Now</Button>
                </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
