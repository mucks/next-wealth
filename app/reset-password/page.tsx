'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ResetPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Check if we have a valid password recovery session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsValidSession(true);
            } else {
                setError('Invalid or expired password reset link. Please request a new one.');
            }
        });
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const inputClassName = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent";
    const labelClassName = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Password Reset Successful!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Your password has been updated. Redirecting to home page...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Set New Password
                    </h2>
                </div>

                {!isValidSession ? (
                    <div className="p-6">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                        >
                            Back to Home
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        )}

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Enter your new password below.
                            </p>
                        </div>

                        <div>
                            <label className={labelClassName}>New Password</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className={inputClassName}
                                disabled={loading}
                                minLength={6}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Minimum 6 characters
                            </p>
                        </div>

                        <div>
                            <label className={labelClassName}>Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className={inputClassName}
                                disabled={loading}
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

