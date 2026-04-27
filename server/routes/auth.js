/**
 * Moov OS — Auth API
 *
 * POST /api/auth/login   — email + password → JWT
 * GET  /api/auth/me      — verify JWT, return current staff member
 * POST /api/auth/bypass  — returns true if no passwords have been set yet
 *                          (allows first-time setup without being locked out)
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

const router = express.Router();

const JWT_SECRET  = process.env.JWT_SECRET  || 'moov-os-dev-secret-change-in-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d';

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      `SELECT id, full_name, email, role, is_active, is_admin, password_hash, page_permissions
       FROM staff
       WHERE LOWER(email) = LOWER($1) AND is_active = true`,
      [email.trim()]
    );

    const staff = result.rows[0];
    if (!staff || !staff.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, staff.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        sub:              staff.id,
        email:            staff.email,
        full_name:        staff.full_name,
        role:             staff.role,
        is_admin:         staff.is_admin,
        page_permissions: staff.page_permissions || [],
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id:               staff.id,
        full_name:        staff.full_name,
        email:            staff.email,
        role:             staff.role,
        is_admin:         staff.is_admin,
        page_permissions: staff.page_permissions || [],
      },
    });
  } catch (err) {
    console.error('[auth] login error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res) => {
  try {
    // Re-fetch from DB so permissions changes take effect without re-login
    const result = await query(
      `SELECT id, full_name, email, role, is_active, is_admin, page_permissions
       FROM staff WHERE id = $1 AND is_active = true`,
      [req.staffId]
    );
    if (!result.rows[0]) {
      return res.status(401).json({ error: 'Account no longer active' });
    }
    const s = result.rows[0];
    return res.json({
      id:               s.id,
      full_name:        s.full_name,
      email:            s.email,
      role:             s.role,
      is_admin:         s.is_admin,
      page_permissions: s.page_permissions || [],
    });
  } catch (err) {
    console.error('[auth] /me error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/auth/bypass-check ──────────────────────────────────────────────
// Returns { bypass: true } if no staff accounts have a password set yet.
// Used on first load — if bypass is true, skip the login screen so Ross can
// set passwords from Settings before locking himself out.

router.get('/bypass-check', async (_req, res) => {
  try {
    const result = await query(
      `SELECT COUNT(*) AS cnt FROM staff WHERE password_hash IS NOT NULL AND is_active = true`
    );
    const count = parseInt(result.rows[0].cnt, 10);
    return res.json({ bypass: count === 0 });
  } catch (err) {
    console.error('[auth] bypass-check error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Middleware: requireAuth ──────────────────────────────────────────────────

export function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.staffId   = payload.sub;
    req.staffUser = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
}

export default router;
