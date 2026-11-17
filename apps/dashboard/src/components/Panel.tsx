import type { ReactNode } from "react";

export default function Panel({ title, children }: { title?: string, children: ReactNode }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            {title !== undefined ? (
                <h2 className="mb-3 text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h2>
            ) : null}
            {children}
        </div>
    );
}