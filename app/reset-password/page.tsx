"use client";
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function ResetPasswordPage() {
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRequestReset = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post('/api/auth/reset-password', { email });
            setMessage(response.data.message);
            // In development, show the token (remove in production!)
            if (response.data.resetToken) {
                setMessage(`Reset token: ${response.data.resetToken} (Copy this for testing)`);
                setToken(response.data.resetToken);
                setStep('reset');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to request password reset');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await axios.put('/api/auth/reset-password', { token, newPassword });
            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/loginscreen');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
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
                <h2 className="mb-8 text-xl font-semibold">
                    {step === 'request' ? 'Reset Password' : 'Enter New Password'}
                </h2>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">
                        {message}
                    </div>
                )}

                {step === 'request' ? (
                    <form onSubmit={handleRequestReset} className="space-y-6">
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
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full rounded-2xl bg-primary py-3 text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-lg">Reset Token</label>
                            <input
                                type="text"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full border-b border-black py-2 text-base focus:outline-none"
                                placeholder="Enter reset token"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-lg">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border-b border-black py-2 text-base focus:outline-none"
                                placeholder="Enter new password (min 8 characters)"
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
                                placeholder="Confirm new password"
                                required
                                minLength={8}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full rounded-2xl bg-primary py-3 text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center text-sm">
                    <Link href="/loginscreen" className="cursor-pointer font-semibold text-blue-700 hover:underline">
                        Back to Login
                    </Link>
                </div>
            </div>

            {/* Bottom Decoration */}
            <div className="absolute bottom-0 left-0 size-24 translate-y-1/2 rotate-[-20deg] rounded-tr-xl bg-secondary sm:size-32 md:size-40" />
        </div>
    );
}

