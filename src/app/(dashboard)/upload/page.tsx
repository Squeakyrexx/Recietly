'use client';

import { UploadForm } from '@/components/upload/upload-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function UploadPage() {
  const { user, loading } = useAuth();

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
            Upload a photo of your receipt. Our AI will extract the details. You can also manually enter or correct the information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || !user ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-40 rounded-lg" />
                  <Skeleton className="h-40 rounded-lg" />
              </div>
              <div className="text-center">
                  <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </div>
          ) : (
            <UploadForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
