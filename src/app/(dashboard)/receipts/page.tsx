import { getReceipts } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ReceiptsList } from '@/components/receipts/receipts-list';
import { noStore } from 'next/cache';

export default function ReceiptsPage() {
  noStore();
  // In a real app, this data would be fetched for the logged-in user
  const receipts = getReceipts();

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
      <ReceiptsList initialReceipts={receipts} />
    </div>
  );
}
