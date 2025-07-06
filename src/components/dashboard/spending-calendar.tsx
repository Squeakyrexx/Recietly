
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Receipt } from '@/lib/types';
import { format, startOfMonth } from 'date-fns';

interface SpendingCalendarProps {
  receipts: Receipt[];
  month: Date;
}

const getSpendingLevelClass = (amount: number, maxAmount: number): string => {
  if (amount <= 0 || maxAmount <= 0) return '';
  const percentage = (amount / maxAmount) * 100;
  if (percentage > 75) return 'spending-very-high';
  if (percentage > 50) return 'spending-high';
  if (percentage > 25) return 'spending-medium';
  return 'spending-low';
};

export function SpendingCalendar({ receipts, month }: SpendingCalendarProps) {
  const { dailySpending, maxSpending } = useMemo(() => {
    const spendingMap = new Map<string, number>();
    receipts.forEach(receipt => {
      const day = receipt.date.split('T')[0];
      const currentAmount = spendingMap.get(day) || 0;
      spendingMap.set(day, currentAmount + receipt.amount);
    });
    const max = Math.max(0, ...Array.from(spendingMap.values()));
    return { dailySpending: spendingMap, maxSpending: max };
  }, [receipts]);
  
  const modifiers = useMemo(() => {
    const mods: Record<string, Date[]> = {
      'spending-low': [], 'spending-medium': [], 'spending-high': [], 'spending-very-high': [],
    };
    dailySpending.forEach((amount, day) => {
      const level = getSpendingLevelClass(amount, maxSpending);
      if (level) {
        mods[level].push(new Date(day.replace(/-/g, '/')));
      }
    });
    return mods;
  }, [dailySpending, maxSpending]);

  const displayedMonth = startOfMonth(month);

  // A wrapper component to make Tooltip happy inside Calendar
  const DayWithTooltip = ({ date }: { date: Date; }) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const spending = dailySpending.get(dayKey);
    const dayNumber = format(date, 'd');

    if (!spending) {
      return <span>{dayNumber}</span>;
    }

    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
            <span>{dayNumber}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Spent: ${spending.toFixed(2)}</p>
        </TooltipContent>
      </Tooltip>
    );
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Spending Calendar</CardTitle>
        <CardDescription>
          Your daily spending at a glance. Darker days mean higher spending.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pt-0">
        <TooltipProvider>
          <Calendar
            month={displayedMonth}
            defaultMonth={displayedMonth}
            showOutsideDays
            fixedWeeks
            modifiers={modifiers}
            modifiersClassNames={{
              'spending-low': 'spending-low',
              'spending-medium': 'spending-medium',
              'spending-high': 'spending-high',
              'spending-very-high': 'spending-very-high',
            }}
            components={{
              DayContent: DayWithTooltip
            }}
            className="p-0"
          />
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
