
'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
import { extractReceiptDataAction, revalidateAllAction } from '@/lib/actions';
import { addReceipt } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Sparkles, Upload, Gem, X, Trash2 } from 'lucide-react';
import { type ExtractedReceiptData, CATEGORIES, TAX_CATEGORIES, type TaxCategory, type LineItem } from '@/lib/types';
import Image from 'next/image';
import { ConfirmationDialog } from './confirmation-dialog';
import type { User } from 'firebase/auth';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Separator } from '@/components/ui/separator';

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

// New type for staged files
type StagedFile = {
  id: string; // Use for react key and identification
  file: File;
  previewUrl: string;
};

export function UploadForm({ user, receiptCount }: { user: User; receiptCount: number }) {
  const [isExtracting, startExtractionTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();
  const { isPremium, upgradeToPro } = useAuth();
  
  // State for the new multi-file flow
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [activeFileForConfirmation, setActiveFileForConfirmation] = useState<StagedFile | null>(null);

  const [isConfirming, setIsConfirming] = useState(false);
  const [receiptData, setReceiptData] = useState<EditableReceiptData | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const chooseFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Cleanup object URLs to prevent memory leaks
    return () => {
      stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
    };
  }, [stagedFiles]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: StagedFile[] = Array.from(files).map(file => ({
        id: crypto.randomUUID(),
        file: file,
        previewUrl: URL.createObjectURL(file),
      }));
      setStagedFiles(prev => [...prev, ...newFiles]);
    }
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
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const newFile: StagedFile = {
              id: crypto.randomUUID(),
              file: file,
              previewUrl: URL.createObjectURL(file),
            };
            setStagedFiles(prev => [...prev, newFile]);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleProcessReceipt = (fileToProcess: StagedFile) => {
    if (!fileToProcess) return;

    startExtractionTransition(async () => {
      const reader = new FileReader();
      reader.readAsDataURL(fileToProcess.file);
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        if (!dataUri) {
          toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive'});
          return;
        }
        
        setActiveFileForConfirmation(fileToProcess);
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
          setActiveFileForConfirmation(null); // Clear active file on error
        }
      }
    });
  };

  const handleSave = () => {
    if (!receiptData || !user || !activeFileForConfirmation) {
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

            const imageDataUri = activeFileForConfirmation.id === 'manual'
                ? `https://placehold.co/600x400.png`
                : await fileToDataUri(activeFileForConfirmation.file);

            await addReceipt(user.uid, { ...receiptToSave, imageDataUri });
            await revalidateAllAction();

            toast({
                title: 'Success!',
                description: "Receipt saved successfully!",
            });
            
            if (activeFileForConfirmation.id !== 'manual') {
              setStagedFiles(prev => prev.filter(f => f.id !== activeFileForConfirmation!.id));
              URL.revokeObjectURL(activeFileForConfirmation!.previewUrl);
            }
            
            setIsConfirming(false);
            setReceiptData(null);
            setActiveFileForConfirmation(null);
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

  const handleRemoveStagedFile = (fileId: string) => {
    const fileToRemove = stagedFiles.find(f => f.id === fileId);
    if(fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setStagedFiles(prev => prev.filter(f => f.id !== fileId));
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
    setActiveFileForConfirmation({ 
        id: 'manual', 
        file: new File([], "manual.jpg", {type: "image/jpeg"}), 
        previewUrl: 'https://placehold.co/600x400.png'
    });
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

  if (limitReached && stagedFiles.length === 0) {
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
            setIsConfirming(false);
            setReceiptData(null);
            setActiveFileForConfirmation(null);
          }
        }}
        receiptData={receiptData}
        setReceiptData={setReceiptData}
        previewUrl={activeFileForConfirmation?.previewUrl || null}
        onSave={handleSave}
        isSaving={isSaving}
      />
      <div className="space-y-6">
        <canvas ref={canvasRef} className="hidden" />

        {/* STAGING AREA */}
        {stagedFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Ready to Process</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {stagedFiles.map(file => (
                <Card key={file.id} className="group relative overflow-hidden">
                  <div className="relative aspect-square w-full bg-muted">
                    <Image src={file.previewUrl} alt="Receipt preview" fill className="object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm"
                      onClick={() => handleProcessReceipt(file)}
                      disabled={isExtracting || isSaving || (isPremium ? false : (receiptCount + stagedFiles.length > SCAN_LIMIT))}
                    >
                      {(isExtracting || isSaving) && activeFileForConfirmation?.id === file.id ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Process'}
                    </Button>
                  </div>
                  <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-70 group-hover:opacity-100"
                      onClick={() => handleRemoveStagedFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
             <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{stagedFiles.length} file(s) staged.</p>
                <Button variant="outline" onClick={() => setStagedFiles([])}>
                    <Trash2 className="mr-2 h-4 w-4"/> Clear All
                </Button>
            </div>
            <Separator />
          </div>
        )}

        {/* UPLOAD VIEW - always visible now */}
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
                    multiple // Allow multiple file selection
                    onChange={handleFileChange}
                    ref={chooseFileInputRef}
                />
            </div>
            <p className="text-sm text-center text-muted-foreground">
                No photo? <Button variant="link" onClick={handleManualEntry} className="p-0 h-auto">Enter details manually</Button>.
            </p>
        </div>
      </div>
    </>
  );
}
