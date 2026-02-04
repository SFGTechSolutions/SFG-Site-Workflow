// Authentication Context Provider with Demo Mode

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from './types';
import { auth, googleProvider, db } from './firebase';
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser,
    GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { DEMO_MODE, MOCK_DELAY } from './demo-config';

// Demo user for testing
const DEMO_USER: User = {
    id: 'demo-user-001',
    email: 'demo@workflowagent.io',
    displayName: 'Demo User',
    photoURL: undefined,
    role: 'admin',
    tenantId: 'default',
    createdAt: new Date(),
    lastLogin: new Date(),
};

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
    isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (DEMO_MODE) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            setLoading(true);
            setFirebaseUser(authUser);

            if (authUser) {
                try {
                    const userRef = doc(db, 'users', authUser.uid);
                    const userSnap = await getDoc(userRef);
                    let userData: User;

                    if (userSnap.exists()) {
                        userData = {
                            id: authUser.uid,
                            ...userSnap.data(),
                            lastLogin: new Date(),
                        } as User;
                    } else {
                        userData = {
                            id: authUser.uid,
                            email: authUser.email || '',
                            displayName: authUser.displayName || 'User',
                            photoURL: authUser.photoURL || undefined,
                            role: 'office',
                            tenantId: 'default',
                            createdAt: new Date(),
                            lastLogin: new Date(),
                        };
                    }

                    await setDoc(userRef, {
                        ...userData,
                        lastLogin: serverTimestamp(),
                    }, { merge: true });

                    setUser(userData);
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    setError("Failed to fetch user profile.");
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        setError(null);

        if (DEMO_MODE) {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setUser(DEMO_USER);
            setLoading(false);
            return;
        }

        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            console.error("Error signing in with Google", err);
            setError(err.message || 'Failed to sign in');
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        setError(null);
        setLoading(true);

        if (DEMO_MODE) {
            await new Promise(resolve => setTimeout(resolve, 500));
            setUser(DEMO_USER);
            setLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // User state will be updated by onAuthStateChanged
        } catch (err: any) {
            console.error("Error signing in with email", err);
            setError(err.message || 'Failed to sign in');
            setLoading(false);
        }
    };

    const signUpWithEmail = async (email: string, password: string, displayName: string) => {
        setError(null);
        setLoading(true);

        if (DEMO_MODE) {
            await new Promise(resolve => setTimeout(resolve, 500));
            setUser(DEMO_USER);
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const authUser = userCredential.user;

            // Create user document in Firestore
            const userData: User = {
                id: authUser.uid,
                email: authUser.email || '',
                displayName: displayName,
                photoURL: undefined,
                role: 'office',
                tenantId: 'default',
                createdAt: new Date(),
                lastLogin: new Date(),
            };

            const userRef = doc(db, 'users', authUser.uid);
            await setDoc(userRef, {
                ...userData,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
            });

            // User state will be updated by onAuthStateChanged
        } catch (err: any) {
            console.error("Error signing up with email", err);
            setError(err.message || 'Failed to create account');
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        setError(null);

        if (DEMO_MODE) {
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err: any) {
            console.error("Error sending password reset email", err);
            setError(err.message || 'Failed to send reset email');
        }
    };

    const signOut = async () => {
        setError(null);
        if (DEMO_MODE) {
            setUser(null);
            return;
        }

        try {
            await firebaseSignOut(auth);
        } catch (err: any) {
            console.error("Error signing out", err);
            setError(err.message);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                loading,
                error,
                signInWithGoogle,
                signInWithEmail,
                signUpWithEmail,
                resetPassword,
                signOut,
                isDemoMode: DEMO_MODE,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
