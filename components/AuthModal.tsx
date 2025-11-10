'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuthModalProps {
    onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isResetPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });

                if (error) throw error;
                setMessage('Password reset email sent! Check your inbox.');
                setEmail('');
            } else if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });

                if (error) throw error;
                setMessage('Check your email to confirm your account!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
                onClose();
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClassName = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent";
    const labelClassName = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isResetPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Sign In')}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <form onSubmit={handleAuth} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
                        </div>
                    )}

                    {isResetPassword && !message && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className={labelClassName}>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={inputClassName}
                            disabled={loading}
                        />
                    </div>

                    {!isResetPassword && (
                        <div>
                            <label className={labelClassName}>Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={inputClassName}
                                disabled={loading}
                                minLength={6}
                            />
                            {isSignUp && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Minimum 6 characters
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Loading...' : (isResetPassword ? 'Send Reset Email' : (isSignUp ? 'Sign Up' : 'Sign In'))}
                    </button>

                    <div className="text-center space-y-2">
                        {!isResetPassword && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError(null);
                                    setMessage(null);
                                }}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline block w-full"
                                disabled={loading}
                            >
                                {isSignUp
                                    ? 'Already have an account? Sign in'
                                    : "Don't have an account? Sign up"}
                            </button>
                        )}

                        {!isSignUp && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsResetPassword(!isResetPassword);
                                    setError(null);
                                    setMessage(null);
                                    setPassword('');
                                }}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                                disabled={loading}
                            >
                                {isResetPassword ? '← Back to Sign In' : 'Forgot password?'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

