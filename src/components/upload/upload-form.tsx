'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
import { extractReceiptDataAction, revalidateAllAction } from '@/lib/actions';
import { addReceipt } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, RefreshCw, Sparkles, Upload, Gem } from 'lucide-react';
import { type ExtractedReceiptData, CATEGORIES, TAX_CATEGORIES, type TaxCategory, type LineItem } from '@/lib/types';
import Image from 'next/image';
import { ConfirmationDialog } from './confirmation-dialog';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';

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

export function UploadForm({ user, receiptCount }: { user: User; receiptCount: number }) {
  const [isExtracting, startExtractionTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const { isPremium, upgradeToPro } = useAuth();
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [receiptData, setReceiptData] = useState<EditableReceiptData | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const chooseFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Camera API not supported by this browser.');
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    // Cleanup: stop video stream when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
          const dataUri = reader.result as string;
          setPreviewUrl(dataUri);
          setPhotoDataUri(dataUri);
      };
      reader.readAsDataURL(selectedFile);
    }
    // Reset file input value to allow re-uploading the same file
    if(e.target) e.target.value = "";
  };
  
  const handleSnapPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setPreviewUrl(dataUri);
        setPhotoDataUri(dataUri);
      }
    }
  };

  const handleProcessReceipt = () => {
    if (!photoDataUri) {
      toast({
        title: 'Processing Error',
        description: 'No photo to process.',
        variant: 'destructive',
      });
      return;
    }

    startExtractionTransition(async () => {
      const result = await extractReceiptDataAction({ photoDataUri });

      if (result.data) {
        setReceiptData({ ...result.data });
        setIsConfirming(true);
        toast({
          title: 'Data Extracted',
          description: 'Please review the information below and save.',
        });
      } else {
        toast({
          title: 'Extraction Error',
          description: result.error || 'Could not extract data from the image.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSave = () => {
    if (!receiptData || !user) {
        toast({ title: 'You must be logged in.', variant: 'destructive'});
        return;
    };
    
    const validated = receiptDataSchema.safeParse(receiptData);

    if (!validated.success) {
      const errorMessages = validated.error.errors.map(e => e.message).join(', ');
      toast({ title: 'Invalid Data', description: errorMessages, variant: 'destructive' });
      return;
    }

    startSavingTransition(async () => {
        try {
            const receiptToSave = {
                ...validated.data,
                description: validated.data.description || '',
            };

            const imageDataUri = photoDataUri || `https://placehold.co/600x400.png`;
            
            await addReceipt(user.uid, { ...receiptToSave, imageDataUri });
            await revalidateAllAction();

            toast({
                title: 'Success!',
                description: "Receipt saved successfully!",
            });
            resetForm();
            router.push('/receipts');
        } catch (e) {
            const err = e as Error;
            toast({
                title: 'Error Saving',
                description: err.message || "An unexpected error occurred.",
                variant: 'destructive',
            });
        }
    });
  };

  const resetForm = () => {
    setPreviewUrl(null);
    setPhotoDataUri(null);
    setReceiptData(null);
    setIsConfirming(false);
    if (chooseFileInputRef.current) {
        chooseFileInputRef.current.value = "";
    }
  }

  const handleManualEntry = () => {
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
    setPhotoDataUri(null);
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

  if (limitReached) {
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
                <p className="text-muted-foreground">To continue scanning unlimited receipts and unlock other Pro features like tax reporting, please upgrade your account.</p>
                <Button onClick={handleUpgrade} size="lg">Upgrade to Pro</Button>
            </CardContent>
        </Card>
      );
  }

  return (
    <>
      <ConfirmationDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        receiptData={receiptData}
        setReceiptData={setReceiptData}
        previewUrl={previewUrl}
        onSave={handleSave}
        isSaving={isSaving}
      />
      <div className="space-y-4">
        <canvas ref={canvasRef} className="hidden" />

        {previewUrl ? (
          <div className="space-y-4 text-center">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                <Image src={previewUrl} alt="Receipt preview" fill className="object-contain" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleProcessReceipt} disabled={isExtracting} size="lg">
                    {isExtracting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing with AI</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" /> Process with AI</>
                    )}
                </Button>
                <Button variant="outline" onClick={() => resetForm()} size="lg">
                    <RefreshCw className="mr-2 h-4 w-4" /> Retake or Upload
                </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="relative aspect-video w-full overflow-hidden flex items-center justify-center bg-black">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
                  <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                  <Alert variant="destructive" className="text-destructive-foreground border-destructive/50 bg-destructive/80">
                      <AlertTitle>Camera Access Denied</AlertTitle>
                      <AlertDescription>
                        Enable camera permissions in your browser to use this feature.
                        You can still upload a file from your library.
                      </AlertDescription>
                  </Alert>
                </div>
              )}
               {hasCameraPermission === null && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-8 w-8 animate-spin text-white"/>
                 </div>
               )}
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={handleSnapPhoto} disabled={!hasCameraPermission} size="lg">
                <Camera className="mr-2 h-4 w-4" /> Snap Photo
              </Button>
              
              <Button variant="secondary" size="lg" onClick={() => chooseFileInputRef.current?.click()}>
                 <Upload className="mr-2 h-4 w-4" /> Upload from Library
              </Button>
              <Input
                id="choose-file"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleFileChange}
                ref={chooseFileInputRef}
              />
            </div>
            <p className="text-sm text-center text-muted-foreground">
                No photo? <Button variant="link" onClick={handleManualEntry} className="p-0 h-auto">Enter details manually</Button>.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
