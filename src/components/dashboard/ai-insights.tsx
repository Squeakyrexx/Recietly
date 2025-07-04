
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2 } from 'lucide-react';
import { generateSpendingInsightsAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

export function AiInsights() {
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
    startTransition(async () => {
      setError(null);
      setInsight(null);
      const result = await generateSpendingInsightsAction(user.uid);
      if (result.error) {
        setError(result.error);
      } else if (result.insight) {
        setInsight(result.insight);
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
          Let AI analyze your spending and provide personalized tips for saving money.
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
        <Button onClick={handleGenerateInsight} disabled={isPending} className="w-full">
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
