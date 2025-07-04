import { ReceiptCard } from '@/components/receipts/receipt-card';
import { mockReceipts } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReceiptsPage() {
  // In a real app, this data would be fetched for the logged-in user
  const receipts = mockReceipts;

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

      {receipts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {receipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
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
    </div>
  );
}
