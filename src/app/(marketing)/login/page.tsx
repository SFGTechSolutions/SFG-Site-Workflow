'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { signInWithGoogle, signInWithEmail, resetPassword, error, loading } = useAuth();
    const router = useRouter();
    const [isEmailMode, setIsEmailMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);

    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
        router.push('/dashboard');
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        await signInWithEmail(email, password);
        router.push('/dashboard');
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        await resetPassword(email);
        setResetEmailSent(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Branding */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-3xl font-bold text-white">SB</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Buddy</h1>
                    <p className="text-gray-600">Your intelligent construction workflow assistant</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {!showForgotPassword ? (
                        <>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            {!isEmailMode ? (
                                <div className="space-y-4">
                                    <button
                                        onClick={handleGoogleSignIn}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        <span className="font-medium text-gray-700">Sign in with Google</span>
                                    </button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsEmailMode(true)}
                                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Sign in with Email
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleEmailSignIn} className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="admin@admin.com"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <label className="flex items-center">
                                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            <span className="ml-2 text-gray-600">Remember me</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Signing in...' : 'Sign in'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsEmailMode(false)}
                                        className="w-full text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        ← Back to other options
                                    </button>
                                </form>
                            )}
                        </>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Reset your password</h2>

                            {resetEmailSent ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                        <p className="font-medium mb-1">Check your email</p>
                                        <p className="text-sm">We've sent password reset instructions to {email}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowForgotPassword(false);
                                            setResetEmailSent(false);
                                        }}
                                        className="w-full text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        ← Back to sign in
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handlePasswordReset} className="space-y-4">
                                    <p className="text-sm text-gray-600 mb-4">
                                        Enter your email address and we'll send you instructions to reset your password.
                                    </p>

                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email address
                                        </label>
                                        <input
                                            id="reset-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="admin@admin.com"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Send reset instructions
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(false)}
                                        className="w-full text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        ← Back to sign in
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
