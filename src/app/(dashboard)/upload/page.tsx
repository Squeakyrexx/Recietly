import { UploadForm } from '@/components/upload/upload-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UploadPage() {
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
          <UploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
