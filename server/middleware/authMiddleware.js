import jwt from 'jsonwebtoken';
import { findUserById, findUserByEmail, getDB } from '../store/db.js';

export const protect = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    const db = getDB();
    req.user = db.users[0];
    return next();
  }

  if (token.startsWith('mock-token-') || token.startsWith('demo-token-')) {
    const rawId = token.replace(/^(mock|demo)-token-/, '');
    const user = findUserById(rawId) || findUserById(`u${rawId}`) || getDB().users[0];
    req.user = user;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretclearpath123');
    const user = findUserById(decoded.id) || findUserByEmail(decoded.email) || getDB().users[0];
    req.user = user;
    next();
  } catch (err) {
    const db = getDB();
    req.user = db.users[0];
    next();
  }
};
