'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Gem, CheckCircle, Loader2, Palette, Trash2, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, updateUserProfile, isPremium, upgradeToPro, deleteUserAccount } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  const [isSaving, startSavingTransition] = useTransition();
  const [isDeleting, startDeletingTransition] = useTransition();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSaveProfile = () => {
    if (!user) return;
    
    startSavingTransition(async () => {
      try {
        await updateUserProfile(name);
        toast({
          title: 'Profile Updated',
          description: 'Your changes have been saved successfully.',
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update profile.',
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleDeleteAccount = () => {
    startDeletingTransition(async () => {
        try {
            await deleteUserAccount();
            toast({
                title: 'Account Deleted',
                description: 'You have been logged out. Your account has been successfully deleted.',
            });
            router.push('/'); // Redirect to landing page
        } catch (error: any) {
            toast({
                title: 'Error Deleting Account',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        }
    });
  };

  const handleUpgrade = () => {
    upgradeToPro();
    toast({
        title: 'Upgrade Successful!',
        description: 'You now have access to all ReceiptWise Pro features.',
    });
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account, plan, and app preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5"/> Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} disabled />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={isSaving || !name}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gem className="h-5 w-5 text-primary"/> Plan & Billing</CardTitle>
            <CardDescription>Manage your subscription and features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className={`rounded-lg p-6 ${isPremium ? 'bg-primary/10' : 'bg-muted/50'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg">{isPremium ? 'ReceiptWise Pro' : 'Free Plan'}</h3>
                        <p className="text-muted-foreground">{isPremium ? 'You have access to all premium features.' : 'Upgrade to unlock more power.'}</p>
                    </div>
                    {isPremium ? (
                        <span className="flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck className="h-5 w-5"/> Active</span>
                    ) : (
                        <Button onClick={handleUpgrade}>Upgrade Now</Button>
                    )}
                </div>
            </div>
             {!isPremium && (
                <div>
                    <h4 className="font-semibold mb-4">Pro Features:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span><strong>Unlimited</strong> receipt uploads and storage.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span><strong>Advanced AI insights</strong> and trend analysis.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span>Generate and export <strong>tax-ready reports</strong>.</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span>Set and track <strong>monthly budgets</strong>.</span>
                        </div>
                    </div>
                </div>
             )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5"/> Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                  <RadioGroupItem value="light" id="light" className="peer sr-only" />
                  <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Light
                  </Label>
              </div>
              <div>
                  <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                  <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Dark
                  </Label>
              </div>
              <div>
                  <RadioGroupItem value="system" id="system" className="peer sr-only" />
                  <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    System
                  </Label>
              </div>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5"/> Danger Zone</CardTitle>
          <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and all of your data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                        ) : (
                            'Yes, delete my account'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
