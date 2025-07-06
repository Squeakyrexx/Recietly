
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { type Receipt } from '@/lib/types';
import { format, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ReceiptDetailsDialog } from '@/components/receipts/receipt-details-dialog';
import { FileText } from 'lucide-react';
import { getIconForCategory } from '../icons';

interface InteractiveCalendarViewProps {
  receipts: Receipt[];
  setAllReceipts: React.Dispatch<React.SetStateAction<Receipt[] | null>>;
}

export function InteractiveCalendarView({ receipts, setAllReceipts }: InteractiveCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const daysWithSpending = useMemo(() => {
    const dates = new Set<string>();
    receipts.forEach(r => dates.add(format(new Date(r.date.replace(/-/g, '/')), 'yyyy-MM-dd')));
    return Array.from(dates).map(d => new Date(d.replace(/-/g, '/')));
  }, [receipts]);

  const receiptsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return receipts
      .filter(r => isSameDay(new Date(r.date.replace(/-/g, '/')), selectedDay))
      .sort((a,b) => b.amount - a.amount);
  }, [receipts, selectedDay]);

  const handleReceiptUpdate = (updatedReceipt: Receipt) => {
    setAllReceipts((prevReceipts) => 
        prevReceipts ? prevReceipts.map(r => r.id === updatedReceipt.id ? updatedReceipt : r) : null
    );
  };
  
  const handleReceiptDelete = (deletedReceiptId: string) => {
    setAllReceipts((prevReceipts) => 
        prevReceipts ? prevReceipts.filter(r => r.id !== deletedReceiptId) : null
    );
    setSelectedReceipt(null);
  };

  return (
    <>
      <ReceiptDetailsDialog
        open={!!selectedReceipt}
        onOpenChange={(open) => { if (!open) setSelectedReceipt(null); }}
        receipt={selectedReceipt}
        onReceiptUpdate={handleReceiptUpdate}
        onReceiptDelete={handleReceiptDelete}
      />
      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2">
              <Calendar
                  mode="single"
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  showOutsideDays
                  fixedWeeks
                  modifiers={{
                      spending: daysWithSpending,
                  }}
                  modifiersClassNames={{
                      spending: 'day-with-spending',
                  }}
                  className="rounded-md border not-prose w-full"
              />
          </div>
          <div className="lg:col-span-1">
              <h2 className="font-semibold text-lg mb-2">
                  {selectedDay ? `Expenses for ${format(selectedDay, 'MMM d, yyyy')}` : 'Select a day'}
              </h2>
              <ScrollArea className="h-[520px] pr-4 -mr-4">
                  {selectedDay && receiptsForSelectedDay.length > 0 ? (
                      <div className="space-y-4">
                          {receiptsForSelectedDay.map(receipt => {
                            const Icon = getIconForCategory(receipt.category);
                            return (
                              <Card key={receipt.id} className="overflow-hidden cursor-pointer transition-shadow hover:shadow-lg" onClick={() => setSelectedReceipt(receipt)}>
                                  <CardContent className="p-3">
                                    <div className="flex gap-3">
                                        <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 flex items-center justify-center">
                                            <Icon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div className="flex-grow space-y-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-medium leading-tight">{receipt.merchant}</p>
                                                <Badge variant="secondary">${receipt.amount.toFixed(2)}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                              {receipt.description}
                                            </p>
                                        </div>
                                    </div>
                                  </CardContent>
                              </Card>
                          )})}
                      </div>
                  ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-center">
                          <p>{selectedDay ? 'No expenses recorded for this day.' : 'Select a day from the calendar to see details.'}</p>
                      </div>
                  )}
              </ScrollArea>
          </div>
        </div>
      </Card>
    </>
  );
}
