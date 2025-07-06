import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { type Receipt } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getIconForCategory } from '@/components/icons';
import { format } from 'date-fns';
import { FileText, Briefcase, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryBorderStyle } from '@/lib/utils';

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const Icon = getIconForCategory(receipt.category);
  // By replacing hyphens with slashes, we parse the date in the local timezone,
  // which avoids "off-by-one-day" errors across different timezones.
  const formattedDate = format(new Date(receipt.date.replace(/-/g, '/')), 'MMM d, yyyy');
  const categoryBorderStyle = getCategoryBorderStyle(receipt.category);


  return (
    <Card className={cn("flex flex-col overflow-hidden transition-transform duration-200 hover:scale-105 hover:shadow-lg border-t-4", categoryBorderStyle)}>
      <CardContent className="flex-1 p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{receipt.merchant}</h3>
            <Badge variant="secondary" className="whitespace-nowrap flex-shrink-0">
                ${receipt.amount.toFixed(2)}
            </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{receipt.description || 'No description provided.'}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                <span>{receipt.category}</span>
            </div>
            {receipt.isBusinessExpense && (
                <Badge variant="outline" className="flex items-center gap-1 border-accent text-accent">
                    <Briefcase className="h-3 w-3" />
                    <span>{receipt.taxCategory || 'Business'}</span>
                </Badge>
            )}
            {receipt.items && receipt.items.length > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground" title="This receipt is itemized">
                    <ClipboardList className="h-3 w-3" />
                </div>
            )}
        </div>
        <time dateTime={receipt.date}>{formattedDate}</time>
      </CardFooter>
    </Card>
  );
}
