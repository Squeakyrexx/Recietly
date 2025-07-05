
'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
import { extractReceiptDataAction, revalidateAllAction } from '@/lib/actions';
import { addReceipt } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Sparkles, Upload, Gem, X } from 'lucide-react';
import { type ExtractedReceiptData, CATEGORIES, TAX_CATEGORIES, type TaxCategory, type LineItem } from '@/lib/types';
import Image from 'next/image';
import { ConfirmationDialog } from './confirmation-dialog';
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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, startExtractionTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();
  const { isPremium, upgradeToPro } = useAuth();
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [receiptData, setReceiptData] = useState<EditableReceiptData | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const chooseFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Cleanup object URL to prevent memory leaks
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, []);

  const handleFileSelected = (selectedFile: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
    if(e.target) e.target.value = ""; // Reset input to allow same file selection
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
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFileSelected(file);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleProcessReceipt = () => {
    if (!file) return;

    startExtractionTransition(async () => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        if (!dataUri) {
          toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive'});
          return;
        }
        
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
      }
    });
  };

  const resetForm = () => {
      setIsConfirming(false);
      setReceiptData(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl(null);
  };

  const handleSave = () => {
    if (!receiptData || !user || !previewUrl) {
        toast({ title: 'An error occurred.', variant: 'destructive'});
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
            
            const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = error => reject(error);
              reader.readAsDataURL(file);
            });
            
            // If it's the manual entry placeholder, use it, otherwise use the actual file.
            const imageDataUri = previewUrl === 'https://placehold.co/600x400.png' 
                ? previewUrl 
                : await fileToDataUri(file!);

            await addReceipt(user.uid, { ...receiptToSave, imageDataUri });
            await revalidateAllAction();

            toast({
                title: 'Success!',
                description: "Receipt saved successfully!",
            });
            
            resetForm(); // Reset form for next upload
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
        <canvas ref={canvasRef} className="hidden" />

        {previewUrl ? (
          // PREVIEW VIEW
          <div className="space-y-4">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                <Image src={previewUrl} alt="Receipt preview" fill className="object-contain" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={resetForm}>
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
            <Card className="relative aspect-video w-full overflow-hidden flex items-center justify-center bg-black">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
                    <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                    <Alert variant="destructive" className="text-destructive-foreground border-destructive/50 bg-destructive/80">
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <AlertDescription>
                            Enable camera permissions to use this feature, or upload a file.
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
          </div>
        )}
        <p className="text-sm text-center text-muted-foreground">
            No photo? <Button variant="link" onClick={handleManualEntry} className="p-0 h-auto">Enter details manually</Button>.
        </p>
      </div>
    </>
  );
}
