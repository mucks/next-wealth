'use client';

import { useState } from 'react';

export default function SetupPage() {
    const [copied, setCopied] = useState(false);

    const hasEnvVars =
        typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key...

# Supabase Database Connection (for Drizzle)
# Get from: Supabase → Project Settings → Database → Connection String → Transaction pooler
# Format: postgres://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
DATABASE_URL=postgres://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

    const handleCopy = () => {
        navigator.clipboard.writeText(envTemplate);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        🚀 Supabase + Drizzle Setup
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Automatic database setup - no manual SQL required!
                    </p>

                    {/* Step 1 */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                1
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Create Supabase Project
                            </h2>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <ol className="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
                                <li>1. Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Supabase Dashboard</a></li>
                                <li>2. Click <strong>New project</strong></li>
                                <li>3. Name: "next-wealth" (or your choice)</li>
                                <li>4. Choose region closest to you</li>
                                <li>5. Set a <strong>database password</strong> (save it!)</li>
                                <li>6. Click "Create new project" - wait ~2 minutes</li>
                            </ol>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${hasEnvVars ? 'bg-green-500' : 'bg-blue-600'}`}>
                                {hasEnvVars ? '✓' : '2'}
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Configure Environment Variables
                            </h2>
                        </div>

                        {hasEnvVars ? (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-green-800 dark:text-green-200">
                                    ✓ Supabase credentials detected! (DATABASE_URL still needed)
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                    <p className="text-blue-800 dark:text-blue-200 mb-3 font-semibold">
                                        Get 3 values from Supabase:
                                    </p>
                                    <ol className="text-blue-800 dark:text-blue-200 space-y-2 text-sm ml-4">
                                        <li><strong>Project URL</strong>: Settings → API → Project URL</li>
                                        <li><strong>Anon Key</strong>: Settings → API → anon public key</li>
                                        <li><strong>Database URL</strong>: Settings → Database → Connection string → <strong>Transaction pooler</strong></li>
                                    </ol>
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={handleCopy}
                                        className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all z-10"
                                    >
                                        {copied ? '✓ Copied!' : '📋 Copy Template'}
                                    </button>
                                    <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
                                        <p className="text-gray-400 mb-2"># Add to .env.local:</p>
                                        <pre className="text-green-400">{envTemplate}</pre>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                        ⚠️ <strong>Important</strong>: Replace <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">xxxxx</code> and <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">[YOUR-PASSWORD]</code> with your actual values!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 3 */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                3
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Push Schema to Database
                            </h2>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <p className="text-green-800 dark:text-green-200 mb-3 font-semibold">
                                ✨ This is the magic part - ONE command creates everything!
                            </p>
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-3">
                                pnpm db:push
                            </div>
                            <p className="text-green-800 dark:text-green-200 text-sm">
                                This will automatically create:
                            </p>
                            <ul className="text-green-800 dark:text-green-200 text-sm ml-6 mt-2 space-y-1">
                                <li>• Assets table with all fields</li>
                                <li>• Indexes for performance</li>
                                <li>• All constraints and validations</li>
                            </ul>
                            <p className="text-green-700 dark:text-green-300 text-xs mt-3 italic">
                                No SQL to copy, no manual table creation. Drizzle handles it all! 🎉
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                4
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                (Optional) Disable Email Confirmation
                            </h2>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                            <p className="text-gray-800 dark:text-gray-200 mb-2 text-sm">
                                For faster development testing:
                            </p>
                            <ol className="text-gray-700 dark:text-gray-300 text-sm space-y-1 ml-4">
                                <li>• Supabase → Authentication → Providers → Email</li>
                                <li>• Toggle OFF "Confirm email"</li>
                                <li>• Now you can sign up instantly without email confirmation</li>
                            </ol>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                                ✓
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                You're Done!
                            </h2>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <p className="text-green-800 dark:text-green-200 mb-4">
                                Your database is ready! Start tracking your wealth.
                            </p>
                            <a
                                href="/"
                                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                            >
                                Go to App →
                            </a>
                        </div>
                    </div>

                    {/* Bonus */}
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            💡 Bonus: Drizzle Studio
                        </h3>
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                            <p className="text-purple-800 dark:text-purple-200 mb-2 text-sm">
                                Want to view/edit your database visually?
                            </p>
                            <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm mb-2">
                                pnpm db:studio
                            </div>
                            <p className="text-purple-700 dark:text-purple-300 text-xs">
                                Opens a beautiful web UI at http://local.drizzle.studio to browse your data!
                            </p>
                        </div>
                    </div>

                    {/* Troubleshooting */}
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            🔧 Troubleshooting
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p><strong>"Environment variable not found"?</strong> Make sure .env.local has all 3 values filled in</p>
                            <p><strong>"Connection refused"?</strong> Check your DATABASE_URL - make sure you used the Transaction pooler connection string (port 6543, not 5432)</p>
                            <p><strong>"Permission denied"?</strong> Verify your database password in the DATABASE_URL</p>
                            <p><strong>Need to restart?</strong> After adding .env.local, restart dev server: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">pnpm dev</code></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
