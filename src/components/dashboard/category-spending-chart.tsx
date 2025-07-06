
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { type Category } from '@/lib/types';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { getCategoryColor } from '@/lib/utils';

interface ChartData {
  category: Category;
  total: number;
  previousTotal: number;
}

export function CategorySpendingChart({ data, showComparison }: { data: ChartData[], showComparison: boolean }) {
  
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      fill: getCategoryColor(item.category),
    }));
  }, [data]);
  
  const chartConfig = {
    total: { label: 'Current' },
    previousTotal: { label: 'Previous' },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>A breakdown of your expenses compared to the previous period.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart 
            data={chartData} 
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <XAxis
              dataKey="category"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<ChartTooltipContent />}
            />
            {showComparison && <Legend verticalAlign="top" height={36} />}
            {showComparison && (
              <Bar 
                dataKey="previousTotal" 
                fill="hsl(var(--muted))" 
                radius={[4, 4, 0, 0]} 
                name="Previous Period"
              />
            )}
            <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Current Period">
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

    