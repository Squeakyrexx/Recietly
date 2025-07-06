
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2, Sparkles, CheckCircle, TrendingDown } from 'lucide-react';
import { generateSpendingInsightsAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Receipt } from '@/lib/types';
import type { GenerateSpendingInsightsOutput } from '@/ai/flows/generate-spending-insights';
import { getIconForCategory } from '@/components/icons';

export function AiInsights({ receiptsForInsight }: { receiptsForInsight: Receipt[] }) {
  const [isPending, startTransition] = useTransition();
  const [insight, setInsight] = useState<GenerateSpendingInsightsOutput | null>(null);
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
        // We need to remove image URLs before sending to the AI.
        // It's not needed for this flow and can cause errors.
        const dataForInsight = receiptsForInsight.map(({ imageUrl, ...rest }) => rest);
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
          <Lightbulb className="h-5 w-5 text-primary" /> AI-Powered Analysis
        </CardTitle>
        <CardDescription>
          Let AI analyze your spending for the selected period and provide personalized tips.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && (
            <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2 h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="font-medium">Analyzing your spending...</p>
                <p className="text-xs">The AI is thinking. This may take a moment.</p>
            </div>
        )}

        {!isPending && insight && (
          <div className="space-y-4 animate-in fade-in-50 duration-500">
            <p className="text-sm text-center text-muted-foreground italic">&quot;{insight.summary}&quot;</p>
            
            <Alert variant="success">
                <CheckCircle className="h-5 w-5" />
                <AlertTitle className="font-semibold">What&apos;s Going Well</AlertTitle>
                <AlertDescription>{insight.positiveInsight}</AlertDescription>
            </Alert>

            <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-center">Suggestions for Improvement</h4>
                {insight.areasForImprovement.map((item, index) => {
                    const Icon = item.category ? getIconForCategory(item.category) : TrendingDown;
                    return (
                        <div key={index} className="flex items-start gap-3 rounded-lg border p-3 bg-card">
                            <div className="p-2 bg-background rounded-full mt-1 border">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">{item.observation}</p>
                                <p className="text-muted-foreground text-sm">{item.suggestion}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
          </div>
        )}
        
        {!isPending && error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {(!insight && !error && !isPending) && (
            <div className="text-center text-muted-foreground py-8">
                <Lightbulb className="mx-auto h-10 w-10 mb-2"/>
                <p className="font-medium">Curious about your habits?</p>
                <p>Click the button to get personalized spending insights from AI.</p>
            </div>
        )}

        <Button onClick={handleGenerateInsight} disabled={isPending || receiptsForInsight.length === 0} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate New Insight
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
