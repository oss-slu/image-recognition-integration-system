// pages/api/auth/me.js
import { verifyToken } from '../../../app/lib/jwt';
import { findUserById } from '../../../app/lib/userStorage';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.authToken;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Find user
    const user = findUserById(payload.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data (without password hash)
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

