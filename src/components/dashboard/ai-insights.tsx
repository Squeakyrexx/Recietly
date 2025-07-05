
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2 } from 'lucide-react';
import { generateSpendingInsightsAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Receipt } from '@/lib/types';

export function AiInsights({ receiptsForInsight }: { receiptsForInsight: Receipt[] }) {
  const [isPending, startTransition] = useTransition();
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleGenerateInsight = () => {
    if (!user) {
        toast({ title: 'Please log in to use this feature.', variant: 'destructive'});
        return;
    }
    if (receiptsForInsight.length === 0) {
        toast({ title: 'No Data', description: 'There is no spending data in this period to analyze.'});
        return;
    }

    startTransition(async () => {
      setError(null);
      setInsight(null);
      try {
        // We need to remove the image data before sending it to the AI.
        // It's very large and not needed for this flow, and can cause errors.
        const dataForInsight = receiptsForInsight.map(({ imageDataUri, ...rest }) => rest);
        const spendingData = JSON.stringify(dataForInsight);
        const result = await generateSpendingInsightsAction(spendingData);

        if (result.error) {
          setError(result.error);
        } else if (result.insight) {
          setInsight(result.insight);
        }
      } catch (e) {
          const err = e as Error;
          console.error("Error generating insights:", err);
          setError(err.message || "Could not generate insights. Please try again.");
          toast({
              title: 'Error',
              description: err.message || "Could not generate insights.",
              variant: 'destructive'
          });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" /> AI Spending Insights
        </CardTitle>
        <CardDescription>
          Let AI analyze your spending for the selected period and provide personalized tips.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insight && !isPending && (
          <Alert>
            <AlertTitle>Your Insight</AlertTitle>
            <AlertDescription>{insight}</AlertDescription>
          </Alert>
        )}
        {error && !isPending && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <Button onClick={handleGenerateInsight} disabled={isPending || receiptsForInsight.length === 0} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate New Insight'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
