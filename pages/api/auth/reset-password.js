// pages/api/auth/reset-password.js
import bcrypt from 'bcryptjs';
import { findUserByEmail, updateUser } from '../../../app/lib/userStorage';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Request password reset
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = findUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists for security
        return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      updateUser(user.id, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires.toISOString(),
      });

      // In production, send email with reset link
      // For now, return the token (remove this in production!)
      res.status(200).json({ 
        message: 'Password reset token generated',
        resetToken, // Remove this in production - only for development
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    // Reset password with token
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      // Find user by reset token
      const users = require('../../../app/lib/userStorage').getUsers();
      const user = users.find(
        u => u.resetPasswordToken === token && 
        u.resetPasswordExpires && 
        new Date(u.resetPasswordExpires) > new Date()
      );

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update user
      updateUser(user.id, {
        passwordHash,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined,
      });

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

