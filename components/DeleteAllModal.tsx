'use client';

interface DeleteAllModalProps {
    onConfirm: () => void;
    onCancel: () => void;
    assetCount: number;
}

export function DeleteAllModal({ onConfirm, onCancel, assetCount }: DeleteAllModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="text-4xl">⚠️</div>
                        <div>
                            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Delete All Assets?</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This action cannot be undone!</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                        <p className="text-gray-900 dark:text-white font-semibold mb-2">
                            You are about to permanently delete:
                        </p>
                        <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                            <li className="flex items-center gap-2">
                                <span className="text-red-600 dark:text-red-400">✗</span>
                                <span><strong>{assetCount}</strong> {assetCount === 1 ? 'asset' : 'assets'}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-red-600 dark:text-red-400">✗</span>
                                <span>All crypto holdings</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-red-600 dark:text-red-400">✗</span>
                                <span>All stock positions</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-red-600 dark:text-red-400">✗</span>
                                <span>All real estate properties</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-red-600 dark:text-red-400">✗</span>
                                <span>All cash accounts</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-900 dark:text-blue-200">
                            <strong>💡 Tip:</strong> Consider exporting your data as a backup before deleting.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <span>🗑️</span>
                        <span>Delete All</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

