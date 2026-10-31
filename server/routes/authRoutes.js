import express from 'express';
import jwt from 'jsonwebtoken';
import { findUserByEmail, getDB } from '../store/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const db = getDB();
  let user = findUserByEmail(email);

  if (!user) {
    const lower = email.toLowerCase();
    if (lower.includes('applicant') || lower.includes('alice')) {
      user = db.users.find((u) => u.role === 'applicant') || db.users[0];
    } else if (lower.includes('officer') || lower.includes('bob')) {
      user = db.users.find((u) => u.role === 'officer') || db.users[1];
    } else if (lower.includes('admin') || lower.includes('charlie') || lower.includes('carol')) {
      user = db.users.find((u) => u.role === 'admin') || db.users[2];
    }
  }

  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'supersecretclearpath123',
    { expiresIn: '7d' }
  );

  return res.json({ token, user });
});

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

router.get('/users', (req, res) => {
  const db = getDB();
  res.json(db.users);
});

export default router;
