import { useState } from "react";

export default function Login({ onLogin }: { onLogin: (arg0: string) => void }) {
    const [password, setPassword] = useState("");

    return <div>
        <form onSubmit={(e) => {
            e.preventDefault();
            if (password.trim() === "") return;
            onLogin(password.trim());
        }}>
            <input
                value={password}
                type="password"
                placeholder="Admin key"
                aria-label="Admin key"
                className="w-72 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                onChange={(e) => {
                    setPassword(e.target.value);
                }}
                id="admin-key"
                name="adminKey"
                autoComplete="new-password"
            ></input>
            <button
                type="submit"
                className="ml-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >Connect</button>
        </form>
    </div>
}