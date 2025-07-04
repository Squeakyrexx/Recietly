import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { type Receipt } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getIconForCategory } from '@/components/icons';
import { format } from 'date-fns';

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const Icon = getIconForCategory(receipt.category);
  const formattedDate = format(new Date(receipt.date), 'MMM d, yyyy');

  return (
    <Card className="flex flex-col overflow-hidden transition-transform hover:scale-105 hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={receipt.imageUrl}
            alt={`Receipt from ${receipt.merchant}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            data-ai-hint="receipt scan"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{receipt.merchant}</h3>
            <Badge variant="secondary" className="whitespace-nowrap flex-shrink-0">
                ${receipt.amount.toFixed(2)}
            </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{receipt.description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
            <Icon className="h-4 w-4" />
            <span>{receipt.category}</span>
        </div>
        <time dateTime={receipt.date}>{formattedDate}</time>
      </CardFooter>
    </Card>
  );
}
