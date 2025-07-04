'use client';

import { useRef, useState, useTransition } from 'react';
import { extractReceiptDataAction, saveReceiptAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { type ExtractedReceiptData } from '@/lib/types';
import Image from 'next/image';
import { ConfirmationDialog } from './confirmation-dialog';
import { useRouter } from 'next/navigation';

type EditableReceiptData = ExtractedReceiptData & { isBusinessExpense?: boolean };

export function UploadForm() {
  const [isExtracting, startExtractionTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [receiptData, setReceiptData] = useState<EditableReceiptData | null>(null);

  const takePictureInputRef = useRef<HTMLInputElement>(null);
  const chooseFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
          const dataUri = reader.result as string;
          setPreviewUrl(dataUri);
          setPhotoDataUri(dataUri);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleProcessReceipt = () => {
    if (!file || !photoDataUri) {
      toast({
        title: 'Upload Error',
        description: 'Please select a file to process.',
        variant: 'destructive',
      });
      return;
    }

    startExtractionTransition(async () => {
      const result = await extractReceiptDataAction({ photoDataUri });

      if (result.data) {
        setReceiptData({ ...result.data, isBusinessExpense: false });
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
    if (!receiptData) return;
    
    startSavingTransition(async () => {
        const result = await saveReceiptAction({ receiptData, photoDataUri });
        if (result.success) {
            toast({
                title: 'Success!',
                description: result.message,
            });
            resetForm();
            router.push('/receipts');
        } else {
            toast({
                title: 'Error Saving',
                description: result.message,
                variant: 'destructive',
            });
        }
    });
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setPhotoDataUri(null);
    setReceiptData(null);
    setIsConfirming(false);
    if (takePictureInputRef.current) {
        takePictureInputRef.current.value = "";
    }
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
    });
    setPreviewUrl(null);
    setPhotoDataUri(null);
    setIsConfirming(true);
  };

  const handleRemovePreview = () => {
    setFile(null);
    setPreviewUrl(null);
    setPhotoDataUri(null);
    if (takePictureInputRef.current) takePictureInputRef.current.value = "";
    if (chooseFileInputRef.current) chooseFileInputRef.current.value = "";
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
      <div className="space-y-6">
        {previewUrl ? (
          <div className="space-y-4 text-center">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border-2 border-primary/20 bg-muted/50 p-2">
                <Image src={previewUrl} alt="Receipt preview" fill className="object-contain" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleProcessReceipt} disabled={isExtracting}>
                    {isExtracting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                    ) : (
                    'Process Receipt'
                    )}
                </Button>
                <Button variant="outline" onClick={handleRemovePreview}>
                    <X className="mr-2 h-4 w-4" /> Change Photo
                </Button>
            </div>
            <p className="text-sm text-muted-foreground">
                Or, <Button variant="link" type="button" className="p-0 h-auto" onClick={handleManualEntry}>enter details manually</Button>
            </p>
          </div>
        ) : (
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Label htmlFor="take-picture" className="flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors text-center">
                        <Camera className="h-10 w-10 text-primary"/>
                        <span className="font-semibold text-foreground">Take a Picture</span>
                        <Input
                            id="take-picture"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            ref={takePictureInputRef}
                        />
                    </Label>
                    <Label htmlFor="choose-file" className="flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors text-center">
                        <ImageIcon className="h-10 w-10 text-primary"/>
                        <span className="font-semibold text-foreground">Choose from Library</span>
                        <Input
                            id="choose-file"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleFileChange}
                            ref={chooseFileInputRef}
                        />
                    </Label>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                      No camera? <Button variant="link" type="button" className="p-0 h-auto" onClick={handleManualEntry}>Enter details manually</Button>
                  </p>
                </div>
            </div>
        )}
      </div>
    </>
  );
}
