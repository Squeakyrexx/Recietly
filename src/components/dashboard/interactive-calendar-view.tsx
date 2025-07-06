
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { type Receipt } from '@/lib/types';
import { format, isSameDay } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface InteractiveCalendarViewProps {
  receipts: Receipt[];
}

export function InteractiveCalendarView({ receipts }: InteractiveCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

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

  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
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
                className="rounded-md border not-prose"
            />
        </div>
        <div className="lg:col-span-1">
            <h2 className="font-semibold text-lg mb-2">
                {selectedDay ? `Expenses for ${format(selectedDay, 'MMM d, yyyy')}` : 'Select a day'}
            </h2>
            <ScrollArea className="h-[450px] pr-4 -mr-4">
                {selectedDay && receiptsForSelectedDay.length > 0 ? (
                    <div className="space-y-4">
                        {receiptsForSelectedDay.map(receipt => (
                            <Card key={receipt.id} className="overflow-hidden">
                                <CardContent className="p-3">
                                  <div className="flex gap-3">
                                      <div className="relative w-20 h-20 bg-muted rounded-md flex-shrink-0">
                                          <Image
                                              src={receipt.imageDataUri}
                                              alt={receipt.merchant}
                                              fill
                                              className="object-cover"
                                          />
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
                        ))}
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
  );
}
