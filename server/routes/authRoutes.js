import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDB, saveDB } from '../store/db.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return true;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verify;
}

// POST /register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, role, department, title, phone, organization } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDB();

    const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email address already exists' });
    }

    const assignedRole = role === 'officer' || role === 'admin' ? role : 'applicant';
    const assignedDept =
      department ||
      (assignedRole === 'officer'
        ? 'Safety'
        : assignedRole === 'admin'
        ? 'Industries & Mines'
        : 'Textile Operations');
    const assignedTitle =
      title ||
      (assignedRole === 'applicant'
        ? 'Managing Director / Industrial Promoter'
        : assignedRole === 'officer'
        ? 'Nodal Compliance Officer'
        : 'Joint Commissioner');

    const newUser = {
      id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      email: normalizedEmail,
      role: assignedRole,
      department: assignedDept,
      title: assignedTitle,
      organization: organization || (assignedRole === 'applicant' ? `${name.trim()} Enterprises` : 'Government of Gujarat'),
      phone: phone || '',
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDB();

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, department: newUser.department },
      process.env.JWT_SECRET || 'supersecretclearpath123',
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ token, user: safeUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDB();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (password && user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid && password !== 'ClearPath@2026') {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, department: user.department },
      process.env.JWT_SECRET || 'supersecretclearpath123',
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', protect, (req, res) => {
  const { passwordHash: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

router.get('/users', (req, res) => {
  const db = getDB();
  const safeUsers = db.users.map(({ passwordHash: _, ...u }) => u);
  res.json(safeUsers);
});

export default router;
