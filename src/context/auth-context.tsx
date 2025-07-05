
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { revalidateAllAction } from '@/lib/actions';

const auth = getAuth(app);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, name: string) => Promise<any>;
  logout: () => Promise<any>;
  updateUserProfile: (name: string) => Promise<void>;
  upgradeToPro: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremium: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  upgradeToPro: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // Check local storage for premium status when user logs in
        const premiumStatus = localStorage.getItem(`premium_${user.uid}`);
        setIsPremium(premiumStatus === 'true');
      } else {
        setIsPremium(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: name,
      });
      // Force a user state update to reflect the new display name immediately
      setUser({ ...userCredential.user, displayName: name });
      await revalidateAllAction();
    }
    return userCredential;
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const updateUserProfile = async (name: string) => {
    if (!auth.currentUser) {
      throw new Error("No user is currently signed in.");
    }
    await updateProfile(auth.currentUser, {
        displayName: name,
    });
    // Update local state to immediately reflect the change
    setUser(auth.currentUser);
    await revalidateAllAction();
  };
  
  const upgradeToPro = () => {
    if (user) {
        localStorage.setItem(`premium_${user.uid}`, 'true');
        setIsPremium(true);
    }
  };

  const value = {
    user,
    loading,
    isPremium,
    signup,
    login,
    logout,
    updateUserProfile,
    upgradeToPro,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
