
'use client';

import { useState, useEffect } from 'react';
import { extractReceiptDataAction, revalidateAllAction } from '@/lib/actions';
import { addReceipt } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Upload, Gem, X } from 'lucide-react';
import { type ExtractedReceiptData, CATEGORIES, TAX_CATEGORIES, type TaxCategory, type LineItem, Receipt } from '@/lib/types';
import Image from 'next/image';
import { ConfirmationDialog } from './confirmation-dialog';
import type { User } from 'firebase/auth';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Label } from '@/components/ui/label';

type EditableReceiptData = ExtractedReceiptData & { isBusinessExpense?: boolean; taxCategory?: TaxCategory; items?: LineItem[] };

const receiptDataSchema = z.object({
  merchant: z.string().min(1, 'Merchant is required.'),
  amount: z.coerce.number().positive('Amount must be positive.'),
  date: z.string().min(1, 'Date is required.'),
  category: z.enum(CATEGORIES),
  description: z.string().optional(),
  isBusinessExpense: z.boolean().optional(),
  taxCategory: z.enum(TAX_CATEGORIES).optional(),
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
  })).optional(),
});

const SCAN_LIMIT = 10;

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

export function UploadForm({ user, receiptCount }: { user: User; receiptCount: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, startExtractingTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();
  const { isPremium, upgradeToPro } = useAuth();
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [receiptData, setReceiptData] = useState<EditableReceiptData | null>(null);

  useEffect(() => {
    // Cleanup object URL to prevent memory leaks
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        if (e.target) e.target.value = ""; // Reset input to allow same file selection
    }
  };
  
  const handleProcessReceipt = async () => {
    if (!file) {
        toast({ title: 'No File Selected', description: 'Please select an image file to process.', variant: 'destructive'});
        return;
    }

    startExtractingTransition(async () => {
      try {
        const dataUri = await fileToDataUri(file);
        const result = await extractReceiptDataAction({ photoDataUri: dataUri });

        if (result.data) {
          setReceiptData({ ...result.data });
          setIsConfirming(true);
        } else {
          toast({
            title: 'Extraction Error',
            description: result.error || 'Could not extract data from the image.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error("Error during receipt processing:", error);
        toast({
          title: 'File Read Error',
          description: 'There was a problem reading your file. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const resetForm = () => {
      setIsConfirming(false);
      setReceiptData(null);
      if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
      }
      setFile(null);
      setPreviewUrl(null);
  };

  const handleSave = async () => {
    if (!receiptData || !user || !previewUrl) {
      toast({ title: 'An error occurred.', variant: 'destructive' });
      return;
    }

    const validated = receiptDataSchema.safeParse(receiptData);
    if (!validated.success) {
      const errorMessages = validated.error.errors.map(e => e.message).join(', ');
      toast({ title: 'Invalid Data', description: errorMessages, variant: 'destructive' });
      return;
    }
    
    startSavingTransition(async () => {
      try {
        const dataUri = file ? await fileToDataUri(file) : previewUrl;
        if (!dataUri) throw new Error("Image data is missing.");
        
        const receiptToSave = {
          ...validated.data,
          description: validated.data.description || '',
          imageUrl: dataUri,
        };

        await addReceipt(user.uid, receiptToSave as Omit<Receipt, 'id'>);
        await revalidateAllAction();

        toast({
          title: 'Success!',
          description: 'Receipt saved successfully!',
        });

        resetForm();
      } catch (e) {
        const err = e as Error;
        console.error('Error during save:', err);
        toast({
          title: 'Error Saving',
          description: err.message || 'An unexpected error occurred while saving.',
          variant: 'destructive',
        });
      }
    });
  };


  const handleManualEntry = () => {
    resetForm();
    setReceiptData({
        merchant: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'Other',
        description: '',
        isBusinessExpense: false,
        items: [],
    });
    setPreviewUrl('https://placehold.co/600x400.png'); // Placeholder for manual entry
    setIsConfirming(true);
  };
  
  const handleUpgrade = () => {
    upgradeToPro();
    toast({
        title: 'Upgrade Successful!',
        description: 'You now have access to all Recietly Pro features.',
    });
  };

  const limitReached = !isPremium && receiptCount >= SCAN_LIMIT;

  if (limitReached && !file) {
      return (
        <Card className="border-primary/50 text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    <Gem className="h-8 w-8 text-primary"/>
                </div>
                <CardTitle>Free Limit Reached</CardTitle>
                <CardDescription>You've used {receiptCount} of your {SCAN_LIMIT} free receipt scans.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">To continue scanning unlimited receipts and unlock other Pro features, please upgrade your account.</p>
                <Button onClick={handleUpgrade} size="lg">Upgrade to Pro</Button>
            </CardContent>
        </Card>
      );
  }

  return (
    <>
      <ConfirmationDialog
        open={isConfirming}
        onOpenChange={(open) => {
          if(!open) {
            resetForm();
          }
        }}
        receiptData={receiptData}
        setReceiptData={setReceiptData}
        previewUrl={previewUrl}
        onSave={handleSave}
        isSaving={isSaving}
      />
      <div className="space-y-4">
        {previewUrl ? (
          // PREVIEW VIEW
          <div className="space-y-4">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                <Image src={previewUrl} alt="Receipt preview" fill className="object-contain" />
                <Button variant="destructive" size="icon" className="absolute right-2 top-2 h-8 w-8" onClick={resetForm}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <Button
              onClick={handleProcessReceipt}
              disabled={isExtracting}
              className="w-full"
              size="lg"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Extract Receipt Data
                </>
              )}
            </Button>
          </div>
        ) : (
          // UPLOAD VIEW
          <div className="space-y-4">
            <Label htmlFor="choose-file" className="cursor-pointer">
              <Card 
                  className="relative aspect-video w-full overflow-hidden flex flex-col items-center justify-center bg-muted/50 border-2 border-dashed hover:bg-muted/80 transition-colors"
              >
                  <div className="text-center text-muted-foreground p-4">
                      <Upload className="h-12 w-12 mx-auto mb-4" />
                      <p className="font-semibold text-lg">Upload Receipt</p>
                      <p className="text-sm">Click here to select a file or take a photo.</p>
                  </div>
              </Card>
            </Label>
            <Input
                id="choose-file"
                type="file"
                className="sr-only"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
            />
          </div>
        )}
        <p className="text-sm text-center text-muted-foreground">
            No photo? <Button variant="link" onClick={handleManualEntry} className="p-0 h-auto">Enter details manually</Button>.
        </p>
      </div>
    </>
  );
}
