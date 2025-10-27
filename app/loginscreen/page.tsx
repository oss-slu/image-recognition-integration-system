"use client";
import React, { useState, FormEvent } from 'react';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        alert("submitted.");
        console.log('Email:', email);
        console.log('Password:', password);
    };

    return (
        <div 
            data-testid="login-container"
            className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 sm:px-8 md:px-16 lg:px-32"
        >
            {/* Top Circle */}
            <div 
                data-testid="top-circle"
                className="absolute right-0 top-0 w-40 h-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary sm:w-48 sm:h-48 md:w-64 md:h-64"
            />

            {/* Card */}
            <div data-testid="login-card" className="z-10 w-full sm:max-w-md">
                <h1 className="mb-2 text-4xl font-bold">Irls</h1>
                <h2 className="mb-8 text-xl font-semibold">Login</h2>

                <form onSubmit={handleSubmit} className="space-y-6" aria-label="Sign in form">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-lg">Email</label>
                        <input
                            id="email"
                            data-testid="email-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-b border-black py-2 text-base focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300"
                            placeholder="Enter your email"
                            required
                            aria-required="true"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-2 block text-lg">Password</label>
                        <input
                            id="password"
                            data-testid="password-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border-b border-black py-2 text-base focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-300"
                            placeholder="Enter your password"
                            required
                            aria-required="true"
                        />
                    </div>
                    <div 
                        data-testid="forgot-password-text"
                        className="text-right text-sm text-gray-700"
                    >
                        <button type="button" className="text-sm text-blue-600 underline focus:outline-none" aria-label="Forgot password">Forgot Password?</button>
                    </div>
                    <button
                        data-testid="sign-in-button"
                        type="submit"
                        className="mt-4 w-full rounded-2xl bg-primary py-3 text-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
                        aria-label="Sign in"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <button
                        data-testid="signup-text"
                        className="cursor-pointer font-semibold text-blue-700 focus:outline-none"
                        type="button"
                        aria-label="Sign up"
                    >
                        Sign Up
                    </button>
                </div>
            </div>

            {/* Bottom Decoration */}
            <div 
                data-testid="bottom-decor"
                className="absolute bottom-0 left-0 w-24 h-24 translate-y-1/2 rotate-[-20deg] rounded-tr-xl bg-secondary sm:w-32 md:w-40"
            />
        </div>
    );
};

export default LoginScreen;
