"use client";
import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, isAuthenticated } = useAuth();
    const router = useRouter();

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            router.push('/profile');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await register(email, password, name);
            router.push('/profile');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 sm:px-8 md:px-16 lg:px-32">
            {/* Top Circle */}
            <div className="absolute right-0 top-0 size-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary sm:size-48 md:size-64" />

            {/* Card */}
            <div className="z-10 w-full sm:max-w-md">
                <h1 className="mb-2 text-4xl font-bold">Irls</h1>
                <h2 className="mb-8 text-xl font-semibold">Sign Up</h2>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="mb-2 block text-lg">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border-b border-black py-2 text-base focus:outline-none"
                            placeholder="Enter your name"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-lg">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-b border-black py-2 text-base focus:outline-none"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-lg">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border-b border-black py-2 text-base focus:outline-none"
                            placeholder="Enter your password (min 8 characters)"
                            required
                            minLength={8}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-lg">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border-b border-black py-2 text-base focus:outline-none"
                            placeholder="Confirm your password"
                            required
                            minLength={8}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 w-full rounded-2xl bg-primary py-3 text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    Already have an account?{' '}
                    <Link href="/loginscreen" className="cursor-pointer font-semibold text-blue-700 hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>

            {/* Bottom Decoration */}
            <div className="absolute bottom-0 left-0 size-24 translate-y-1/2 rotate-[-20deg] rounded-tr-xl bg-secondary sm:size-32 md:size-40" />
        </div>
    );
}

