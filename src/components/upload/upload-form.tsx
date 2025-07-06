
'use client';

import { useState, useEffect, useTransition } from 'react';
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
import imageCompression from 'browser-image-compression';

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

const fileToDataUri = (file: File | Blob): Promise<string> => {
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
  
  const compressImage = async (inputFile: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: 0.7, // Target size under 1MB DB limit
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      return await imageCompression(inputFile, options);
    } catch (error) {
      console.error('Image compression failed:', error);
      throw new Error('Failed to compress image. The file might be corrupted or in an unsupported format.');
    }
  };
  
  const handleProcessReceipt = async () => {
    if (!file) {
      toast({ title: 'No File Selected', description: 'Please select an image file to process.', variant: 'destructive'});
      return;
    }
  
    startExtractingTransition(async () => {
      try {
        const compressedFile = await compressImage(file);
        const dataUri = await fileToDataUri(compressedFile);
        
        const result = await extractReceiptDataAction({ photoDataUri: dataUri });
  
        if (result && result.data) {
          // Create a full receipt object, providing defaults for any missing fields
          const aiData = result.data;
          const fullReceiptData: EditableReceiptData = {
            merchant: aiData.merchant || 'Unknown Merchant',
            amount: aiData.amount || 0,
            date: aiData.date || new Date().toISOString().split('T')[0],
            category: aiData.category || 'Other',
            description: aiData.description || '',
            isBusinessExpense: aiData.isBusinessExpense || false,
            taxCategory: aiData.taxCategory,
            items: aiData.items || [],
          };
          setReceiptData(fullReceiptData);
          setIsConfirming(true);
        } else {
          toast({
            title: 'Extraction Error',
            description: result?.error || 'Could not extract data from the image.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error("Error during receipt processing:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during processing.';
        toast({
          title: 'Processing Failed',
          description: errorMessage,
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
    if (!receiptData || !user) {
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
        // **FIX:** Explicitly create the object to be saved, ensuring ONLY text data is included.
        // This prevents any image data from being sent to the database.
        const receiptToSave: Omit<Receipt, 'id'> = {
          merchant: validated.data.merchant,
          amount: validated.data.amount,
          date: validated.data.date,
          category: validated.data.category,
          description: validated.data.description || '',
          isBusinessExpense: validated.data.isBusinessExpense || false,
          taxCategory: validated.data.taxCategory,
          items: validated.data.items || [],
        };
        
        await addReceipt(user.uid, receiptToSave);
        await revalidateAllAction();

        toast({
          title: 'Success!',
          description: 'Receipt saved successfully!',
        });

        resetForm();
      } catch (e) {
        console.error('Error during save:', e);
        const errorMessage = e instanceof Error ? e.message : 'Could not save the receipt. Please try again.';
        toast({
          title: 'Error Saving',
          description: errorMessage,
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
    setPreviewUrl(null);
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
