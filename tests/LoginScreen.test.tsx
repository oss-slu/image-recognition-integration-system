import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // For better assertions
import LoginScreen from '@/app/loginscreen/page';

// Mock alert function globally
beforeAll(() => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('LoginScreen Component', () => {
    beforeEach(() => {
        render(<LoginScreen />);
    });

    test('renders login container and card', () => {
        expect(screen.getByTestId('login-container')).toBeInTheDocument();
        expect(screen.getByTestId('login-card')).toBeInTheDocument();
    });

    test('renders email and password inputs', () => {
        expect(screen.getByTestId('email-input')).toBeInTheDocument();
        expect(screen.getByTestId('password-input')).toBeInTheDocument();
    });

    test('renders forgot password and signup texts', () => {
        expect(screen.getByTestId('forgot-password-text')).toHaveTextContent('Forgot Password?');
        expect(screen.getByTestId('signup-text')).toHaveTextContent("Sign Up");
    });

    test('allows user to type into email and password fields', () => {
        const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
        const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    });

    test('form submission triggers alert and logs email/password', () => {
        const emailInput = screen.getByTestId('email-input');
        const passwordInput = screen.getByTestId('password-input');
        const submitButton = screen.getByTestId('sign-in-button');

        fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

        // Mock console.log
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        fireEvent.click(submitButton);

        expect(window.alert).toHaveBeenCalledWith('submitted.');
        expect(consoleSpy).toHaveBeenCalledWith('Email:', 'user@test.com');
        expect(consoleSpy).toHaveBeenCalledWith('Password:', 'mypassword');

        consoleSpy.mockRestore();
    });

    test('renders top and bottom decorative elements', () => {
        expect(screen.getByTestId('top-circle')).toBeInTheDocument();
        expect(screen.getByTestId('bottom-decor')).toBeInTheDocument();
    });
});
