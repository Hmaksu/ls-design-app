// Load .env file from server directory
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const [key, ...rest] = line.split('=');
        if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    });
}

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { getDb } = require('./db.cjs');
const { generateToken, authMiddleware } = require('./auth.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

async function verifyTurnstileToken(token) {
    if (!token) return false;
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return true; // Skip if no secret configured
    try {
        const formData = new URLSearchParams();
        formData.append('secret', secret);
        formData.append('response', token);
        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();
        return data.success;
    } catch (err) {
        console.error('Turnstile verification error:', err);
        return false;
    }
}

// ═══════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, securityQuestion, securityAnswer, turnstileToken } = req.body;

        const isValidCaptcha = await verifyTurnstileToken(turnstileToken);
        if (!isValidCaptcha) {
            return res.status(403).json({ error: 'CAPTCHA verification failed. Please try again.' });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        if (!securityQuestion || !securityAnswer) {
            return res.status(400).json({ error: 'Security question and answer are required' });
        }

        const db = getDb();

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordHash = bcrypt.hashSync(password, 10);
        const answerHash = bcrypt.hashSync(securityAnswer.toLowerCase().trim(), 10);

        // First user becomes admin automatically
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim()).filter(Boolean);
        const role = (userCount === 0 || adminEmails.includes(email)) ? 'admin' : 'user';

        const result = db.prepare(
            'INSERT INTO users (name, email, password_hash, role, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(name, email, passwordHash, role, securityQuestion, answerHash);

        const user = { id: result.lastInsertRowid, name, email, role };
        const token = generateToken(user);

        res.status(201).json({ user, token });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, turnstileToken } = req.body;

        const isValidCaptcha = await verifyTurnstileToken(turnstileToken);
        if (!isValidCaptcha) {
            return res.status(403).json({ error: 'CAPTCHA verification failed. Please try again.' });
        }

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Auto-promote if this email matches ADMIN_EMAIL
        let role = user.role || 'user';
        const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim()).filter(Boolean);
        if (adminEmails.length > 0 && adminEmails.includes(email) && role !== 'admin') {
            db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
            role = 'admin';
        }

        const token = generateToken({ id: user.id, name: user.name, email: user.email });

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role },
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    // Auto-promote if ADMIN_EMAIL matches
    const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim()).filter(Boolean);
    if (adminEmails.length > 0 && adminEmails.includes(user.email) && user.role !== 'admin') {
        db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
        user.role = 'admin';
    }
    res.json({ user });
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email, securityAnswer, newPassword, turnstileToken } = req.body;

        const isValidCaptcha = await verifyTurnstileToken(turnstileToken);
        if (!isValidCaptcha) {
            return res.status(403).json({ error: 'CAPTCHA verification failed. Please try again.' });
        }

        if (!email || !securityAnswer || !newPassword) {
            return res.status(400).json({ error: 'Email, security answer, and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            return res.status(404).json({ error: 'No account found with that email' });
        }

        if (!user.security_answer) {
            return res.status(400).json({ error: 'No security question set for this account' });
        }

        const isCorrect = bcrypt.compareSync(securityAnswer.toLowerCase().trim(), user.security_answer);
        if (!isCorrect) {
            return res.status(401).json({ error: 'Incorrect security answer' });
        }

        const newPasswordHash = bcrypt.hashSync(newPassword, 10);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, user.id);

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/get-security-question — get the security question for an email
app.post('/api/auth/get-security-question', async (req, res) => {
    try {
        const { email, turnstileToken } = req.body;

        const isValidCaptcha = await verifyTurnstileToken(turnstileToken);
        if (!isValidCaptcha) {
            return res.status(403).json({ error: 'CAPTCHA verification failed. Please try again.' });
        }
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const db = getDb();
        const user = db.prepare('SELECT security_question FROM users WHERE email = ?').get(email);

        if (!user || !user.security_question) {
            return res.status(404).json({ error: 'No account found with that email' });
        }

        res.json({ securityQuestion: user.security_question });
    } catch (err) {
        console.error('Get security question error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ═══════════════════════════════════════════
// HELPER: Check if user can access station
// ═══════════════════════════════════════════
function getStationAccess(db, stationId, userId) {
    const station = db.prepare('SELECT * FROM learning_stations WHERE id = ?').get(stationId);
    if (!station) return { station: null, role: null };

    if (station.user_id === userId) return { station, role: 'owner' };

    const collab = db.prepare('SELECT * FROM station_collaborators WHERE station_id = ? AND user_id = ?').get(stationId, userId);
    if (collab) return { station, role: 'collaborator' };

    // Class instructor can view student workspaces
    if (station.class_id) {
        const cls = db.prepare('SELECT owner_id FROM classes WHERE id = ?').get(station.class_id);
        if (cls && cls.owner_id === userId) return { station, role: 'viewer' };
    }

    if (station.is_published === 1) return { station, role: 'viewer' };

    return { station: null, role: null };
}

// ═══════════════════════════════════════════
// LEARNING STATION ROUTES (Protected)
// ═══════════════════════════════════════════

// GET /api/ls — list user's own + shared learning stations
app.get('/api/ls', authMiddleware, (req, res) => {
    try {
        const db = getDb();

        // Own stations
        const owned = db.prepare(
            'SELECT id, title, code, class_id, created_at, updated_at FROM learning_stations WHERE user_id = ? ORDER BY updated_at DESC'
        ).all(req.user.id);

        const enrichOwned = owned.map(s => {
            try {
                const full = db.prepare('SELECT data FROM learning_stations WHERE id = ?').get(s.id);
                const parsed = JSON.parse(full.data);
                return { ...s, moduleCount: parsed.modules?.length || 0, level: parsed.level || '', role: 'owner' };
            } catch {
                return { ...s, moduleCount: 0, level: '', role: 'owner' };
            }
        });

        // Shared stations (Collaboration)
        const shared = db.prepare(`
            SELECT ls.id, ls.title, ls.code, ls.class_id, ls.created_at, ls.updated_at, u.name as owner_name
            FROM station_collaborators sc
            JOIN learning_stations ls ON sc.station_id = ls.id
            JOIN users u ON ls.user_id = u.id
            WHERE sc.user_id = ?
            ORDER BY ls.updated_at DESC
        `).all(req.user.id);

        const enrichShared = shared.map(s => {
            try {
                const full = db.prepare('SELECT data FROM learning_stations WHERE id = ?').get(s.id);
                const parsed = JSON.parse(full.data);
                return { ...s, moduleCount: parsed.modules?.length || 0, level: parsed.level || '', role: 'collaborator' };
            } catch {
                return { ...s, moduleCount: 0, level: '', role: 'collaborator' };
            }
        });

        res.json({ stations: [...enrichOwned, ...enrichShared] });
    } catch (err) {
        console.error('List LS error:', err.message, err.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/ls/published — get all published stations across the platform
app.get('/api/ls/published', authMiddleware, (req, res) => {
    try {
        const db = getDb();
        const published = db.prepare(`
            SELECT ls.id, ls.title, ls.code, ls.created_at, ls.updated_at, u.name as owner_name
            FROM learning_stations ls
            JOIN users u ON ls.user_id = u.id
            WHERE ls.is_published = 1
            ORDER BY ls.updated_at DESC
        `).all();

        const enrichPublished = published.map(s => {
            try {
                const full = db.prepare('SELECT data FROM learning_stations WHERE id = ?').get(s.id);
                const parsed = JSON.parse(full.data);
                return { ...s, moduleCount: parsed.modules?.length || 0, level: parsed.level || '', role: 'viewer' };
            } catch {
                return { ...s, moduleCount: 0, level: '', role: 'viewer' };
            }
        });

        res.json({ stations: enrichPublished });
    } catch (err) {
        console.error('List published error:', err.message, err.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/ls — create a new learning station
app.post('/api/ls', authMiddleware, (req, res) => {
    try {
        const { station } = req.body;
        if (!station || !station.id) {
            return res.status(400).json({ error: 'Station data is required' });
        }

        const db = getDb();
        const isPublished = station.isPublished ? 1 : 0;
        const classId = station.class_id || null;
        db.prepare(
            'INSERT INTO learning_stations (id, user_id, title, code, data, is_published, class_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(station.id, req.user.id, station.title || '', station.code || '', JSON.stringify(station), isPublished, classId);

        res.status(201).json({ success: true, id: station.id });
    } catch (err) {
        if (err.message?.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'A station with this ID already exists' });
        }
        console.error('Create LS error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/ls/:id — update a learning station (owner or collaborator)
app.put('/api/ls/:id', authMiddleware, (req, res) => {
    try {
        const { station } = req.body;
        if (!station) {
            return res.status(400).json({ error: 'Station data is required' });
        }

        const db = getDb();
        const { role } = getStationAccess(db, req.params.id, req.user.id);

        if (!role || role === 'viewer') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const isPublished = station.isPublished ? 1 : 0;
        db.prepare(
            "UPDATE learning_stations SET title = ?, code = ?, data = ?, is_published = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(station.title || '', station.code || '', JSON.stringify(station), isPublished, req.params.id);

        res.json({ success: true });
    } catch (err) {
        console.error('Update LS error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/ls/:id — delete a learning station (owner only)
app.delete('/api/ls/:id', authMiddleware, (req, res) => {
    try {
        const db = getDb();

        const existing = db.prepare('SELECT user_id FROM learning_stations WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Station not found' });
        }
        if (existing.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        db.prepare('DELETE FROM learning_stations WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete LS error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/ls/:id — get a single learning station (owner or collaborator)
app.get('/api/ls/:id', authMiddleware, (req, res) => {
    try {
        const db = getDb();
        const { station, role } = getStationAccess(db, req.params.id, req.user.id);

        if (!station || !role) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json({ station: { ...station, data: JSON.parse(station.data) }, role });
    } catch (err) {
        console.error('Get LS error:', err.message, err.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ═══════════════════════════════════════════
// CHAT / MESSAGES ROUTES
// ═══════════════════════════════════════════

// GET /api/ls/:id/messages — fetch messages for a station
app.get('/api/ls/:id/messages', authMiddleware, (req, res) => {
    try {
        const db = getDb();
        const { station, role } = getStationAccess(db, req.params.id, req.user.id);
        
        let isInstructor = false;
        if (station && station.class_id) {
            const cls = db.prepare('SELECT owner_id FROM classes WHERE id = ?').get(station.class_id);
            if (cls && cls.owner_id === req.user.id) isInstructor = true;
        }

        if (!station || (role === 'viewer' && !isInstructor)) {
            return res.status(403).json({ error: 'Not authorized to view messages' });
        }

        const afterId = req.query.afterId ? parseInt(req.query.afterId) : 0;
        
        const messages = db.prepare(`
            SELECT sm.id, sm.station_id, sm.user_id, sm.message, sm.reference_target, sm.created_at, u.name as user_name
            FROM station_messages sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.station_id = ? AND sm.id > ?
            ORDER BY sm.created_at ASC
        `).all(req.params.id, afterId);

        res.json({ messages });
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/ls/:id/messages — post a new message to a station
app.post('/api/ls/:id/messages', authMiddleware, (req, res) => {
    try {
        const { message, reference_target } = req.body;
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        const db = getDb();
        const { station, role } = getStationAccess(db, req.params.id, req.user.id);
        
        let isInstructor = false;
        if (station && station.class_id) {
            const cls = db.prepare('SELECT owner_id FROM classes WHERE id = ?').get(station.class_id);
            if (cls && cls.owner_id === req.user.id) isInstructor = true;
        }

        if (!station || (role === 'viewer' && !isInstructor)) {
            return res.status(403).json({ error: 'Not authorized to post messages' });
        }

        const result = db.prepare(
            'INSERT INTO station_messages (station_id, user_id, message, reference_target) VALUES (?, ?, ?, ?)'
        ).run(req.params.id, req.user.id, message.trim(), reference_target || null);

        const newMessage = db.prepare(`
            SELECT sm.id, sm.station_id, sm.user_id, sm.message, sm.reference_target, sm.created_at, u.name as user_name
            FROM station_messages sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json({ success: true, message: newMessage });
    } catch (err) {
        console.error('Post message error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/ls/:id/messages/:msgId — edit own message
app.put('/api/ls/:id/messages/:msgId', authMiddleware, (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }
        const db = getDb();
        const msg = db.prepare('SELECT * FROM station_messages WHERE id = ? AND station_id = ?').get(req.params.msgId, req.params.id);
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        if (msg.user_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own messages' });

        db.prepare('UPDATE station_messages SET message = ? WHERE id = ?').run(message.trim(), req.params.msgId);

        const updated = db.prepare(`
            SELECT sm.id, sm.station_id, sm.user_id, sm.message, sm.reference_target, sm.created_at, u.name as user_name
            FROM station_messages sm
            JOIN users u ON sm.user_id = u.id
            WHERE sm.id = ?
        `).get(req.params.msgId);

        res.json({ success: true, message: updated });
    } catch (err) {
        console.error('Edit message error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/ls/:id/messages/:msgId — delete own message
app.delete('/api/ls/:id/messages/:msgId', authMiddleware, (req, res) => {
    try {
        const db = getDb();
        const msg = db.prepare('SELECT * FROM station_messages WHERE id = ? AND station_id = ?').get(req.params.msgId, req.params.id);
        if (!msg) return res.status(404).json({ error: 'Message not found' });
        if (msg.user_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own messages' });

        db.prepare('DELETE FROM station_messages WHERE id = ?').run(req.params.msgId);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete message error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ═══════════════════════════════════════════
// COLLABORATION ROUTES
// ═══════════════════════════════════════════

// POST /api/ls/:id/share — share station with another user by email
app.post('/api/ls/:id/share', authMiddleware, (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const db = getDb();

        const station = db.prepare('SELECT user_id FROM learning_stations WHERE id = ?').get(req.params.id);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        if (station.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the owner can share' });
        }

        const targetUser = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
        if (!targetUser) {
            return res.status(404).json({ error: 'No user found with that email' });
        }
        if (targetUser.id === req.user.id) {
            return res.status(400).json({ error: 'Cannot share with yourself' });
        }

        const existing = db.prepare('SELECT * FROM station_collaborators WHERE station_id = ? AND user_id = ?').get(req.params.id, targetUser.id);
        if (existing) {
            return res.status(409).json({ error: 'Already shared with this user' });
        }

        db.prepare('INSERT INTO station_collaborators (station_id, user_id) VALUES (?, ?)').run(req.params.id, targetUser.id);

        res.json({ success: true, collaborator: { id: targetUser.id, name: targetUser.name, email: targetUser.email } });
    } catch (err) {
        console.error('Share error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/ls/:id/collaborators — list collaborators
app.get('/api/ls/:id/collaborators', authMiddleware, (req, res) => {
    try {
        const db = getDb();

        const station = db.prepare('SELECT user_id FROM learning_stations WHERE id = ?').get(req.params.id);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        if (station.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the owner can view collaborators' });
        }

        const collaborators = db.prepare(`
            SELECT u.id, u.name, u.email, sc.added_at
            FROM station_collaborators sc
            JOIN users u ON sc.user_id = u.id
            WHERE sc.station_id = ?
        `).all(req.params.id);

        res.json({ collaborators });
    } catch (err) {
        console.error('List collaborators error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/ls/:id/share/:userId — remove a collaborator
app.delete('/api/ls/:id/share/:userId', authMiddleware, (req, res) => {
    try {
        const db = getDb();

        const station = db.prepare('SELECT user_id FROM learning_stations WHERE id = ?').get(req.params.id);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        if (station.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the owner can remove collaborators' });
        }

        db.prepare('DELETE FROM station_collaborators WHERE station_id = ? AND user_id = ?').run(req.params.id, parseInt(req.params.userId));

        res.json({ success: true });
    } catch (err) {
        console.error('Unshare error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ═══════════════════════════════════════════
// CLASSES ROUTES
// ═══════════════════════════════════════════

// POST /api/classes — Create a new class
app.post('/api/classes', authMiddleware, (req, res) => {
    try {
        const { name, base_ls_id } = req.body;
        if (!name || !base_ls_id) {
            return res.status(400).json({ error: 'Name and base_ls_id are required' });
        }

        const db = getDb();
        // Check if base_ls_id is owned by the user (or they are an admin/collaborator)
        const baseStation = db.prepare('SELECT id FROM learning_stations WHERE id = ? AND user_id = ?').get(base_ls_id, req.user.id);
        if (!baseStation) {
            return res.status(403).json({ error: 'Not authorized to use this base station or it does not exist' });
        }

        const classId = crypto.randomUUID();
        db.prepare(
            'INSERT INTO classes (id, name, owner_id, base_ls_id) VALUES (?, ?, ?, ?)'
        ).run(classId, name, req.user.id, base_ls_id);

        res.status(201).json({ success: true, id: classId });
    } catch (err) {
        console.error('Create class error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/classes/me — Get classes owned by user and classes they are a member of
app.get('/api/classes/me', authMiddleware, (req, res) => {
    try {
        const db = getDb();

        const owned = db.prepare(`
            SELECT c.*, ls.title as base_ls_title, (SELECT COUNT(*) FROM class_members WHERE class_id = c.id) as student_count
            FROM classes c
            JOIN learning_stations ls ON c.base_ls_id = ls.id
            WHERE c.owner_id = ?
            ORDER BY c.created_at DESC
        `).all(req.user.id);

        const joined = db.prepare(`
            SELECT c.*, ls.title as base_ls_title, u.name as instructor_name, cm.joined_at,
                   (SELECT id FROM learning_stations WHERE class_id = c.id AND user_id = ?) as student_station_id
            FROM class_members cm
            JOIN classes c ON cm.class_id = c.id
            JOIN learning_stations ls ON c.base_ls_id = ls.id
            JOIN users u ON c.owner_id = u.id
            WHERE cm.user_id = ?
            ORDER BY cm.joined_at DESC
        `).all(req.user.id, req.user.id);

        res.json({ owned, joined });
    } catch (err) {
        console.error('Get classes error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/classes/:id — Get details of a single class
app.get('/api/classes/:id', authMiddleware, (req, res) => {
    try {
        const db = getDb();
        const classObj = db.prepare(`
            SELECT c.*, ls.title as base_ls_title, u.name as instructor_name
            FROM classes c
            JOIN learning_stations ls ON c.base_ls_id = ls.id
            JOIN users u ON c.owner_id = u.id
            WHERE c.id = ?
        `).get(req.params.id);

        if (!classObj) return res.status(404).json({ error: 'Class not found' });

        const isOwner = classObj.owner_id === req.user.id;
        const isMember = db.prepare('SELECT user_id FROM class_members WHERE class_id = ? AND user_id = ?').get(req.params.id, req.user.id);

        if (!isOwner && !isMember) {
            return res.status(403).json({ error: 'Not authorized to view this class' });
        }

        // Fetch students and their derived stations
        const members = db.prepare(`
            SELECT u.id, u.name, u.email, cm.joined_at, ls.id as station_id, ls.updated_at as station_updated_at
            FROM class_members cm
            JOIN users u ON cm.user_id = u.id
            LEFT JOIN learning_stations ls ON ls.class_id = cm.class_id AND ls.user_id = u.id
            WHERE cm.class_id = ?
            ORDER BY u.name ASC
        `).all(req.params.id);

        let myStationId = null;
        if (isMember) {
            const myStation = db.prepare('SELECT id FROM learning_stations WHERE class_id = ? AND user_id = ?').get(req.params.id, req.user.id);
            if (myStation) myStationId = myStation.id;
        }

        res.json({
            class: classObj,
            members,
            role: isOwner ? 'instructor' : 'student',
            studentStationId: myStationId
        });
    } catch (err) {
        console.error('Get class details error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/classes/:id/overview — Get all students' module data for comparison (instructor only)
app.get('/api/classes/:id/overview', authMiddleware, (req, res) => {
    try {
        const db = getDb();
        const classObj = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
        if (!classObj) return res.status(404).json({ error: 'Class not found' });
        if (classObj.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the instructor can view this' });

        const studentStations = db.prepare(`
            SELECT ls.id as station_id, ls.data, ls.updated_at, u.id as student_id, u.name as student_name, u.email as student_email
            FROM class_members cm
            JOIN users u ON cm.user_id = u.id
            LEFT JOIN learning_stations ls ON ls.class_id = cm.class_id AND ls.user_id = u.id
            WHERE cm.class_id = ?
            ORDER BY u.name ASC
        `).all(req.params.id);

        const students = studentStations.map(s => {
            let modules = [];
            try {
                if (s.data) {
                    const parsed = JSON.parse(s.data);
                    modules = parsed.modules || [];
                }
            } catch { }
            return {
                student_id: s.student_id,
                student_name: s.student_name,
                student_email: s.student_email,
                station_id: s.station_id,
                updated_at: s.updated_at,
                modules
            };
        });

        res.json({ class_name: classObj.name, students });
    } catch (err) {
        console.error('Class overview error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/classes/:id/members — Add student to class
app.post('/api/classes/:id/members', authMiddleware, (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const db = getDb();
        const classObj = db.prepare('SELECT id, owner_id, base_ls_id FROM classes WHERE id = ?').get(req.params.id);
        if (!classObj) return res.status(404).json({ error: 'Class not found' });

        if (classObj.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the instructor can add students' });
        }

        const studentUser = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
        if (!studentUser) return res.status(404).json({ error: 'No user found with that email' });

        if (studentUser.id === classObj.owner_id) {
            return res.status(400).json({ error: 'Instructor cannot be added as a student' });
        }

        const existingMember = db.prepare('SELECT * FROM class_members WHERE class_id = ? AND user_id = ?').get(req.params.id, studentUser.id);
        if (existingMember) return res.status(409).json({ error: 'User is already a student in this class' });

        // Generate student LS clone immediately
        const baseLS = db.prepare('SELECT data FROM learning_stations WHERE id = ?').get(classObj.base_ls_id);
        if (!baseLS) return res.status(404).json({ error: 'Base LS not found, cannot clone' });

        const baseLSData = JSON.parse(baseLS.data);
        const newStationId = crypto.randomUUID();

        // Overwrite ID to make it unique, keep everything else identical
        baseLSData.id = newStationId;
        baseLSData.class_id = classObj.id;

        // Start TX to insert both relationship and cloned station
        const addMemberTx = db.transaction(() => {
            db.prepare('INSERT INTO class_members (class_id, user_id) VALUES (?, ?)').run(req.params.id, studentUser.id);
            db.prepare(
                'INSERT INTO learning_stations (id, user_id, title, code, data, is_published, class_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).run(newStationId, studentUser.id, baseLSData.title || '', baseLSData.code || '', JSON.stringify(baseLSData), 0, req.params.id);
        });

        addMemberTx();

        res.json({ success: true, member: { id: studentUser.id, name: studentUser.name, email: studentUser.email, station_id: newStationId } });
    } catch (err) {
        console.error('Add class member error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/classes/:id/members/:userId — Remove student from class
app.delete('/api/classes/:id/members/:userId', authMiddleware, (req, res) => {
    try {
        const db = getDb();
        const classObj = db.prepare('SELECT owner_id FROM classes WHERE id = ?').get(req.params.id);
        if (!classObj) return res.status(404).json({ error: 'Class not found' });

        if (classObj.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the instructor can remove students' });
        }

        const studentId = parseInt(req.params.userId);

        const removeTx = db.transaction(() => {
            db.prepare('DELETE FROM class_members WHERE class_id = ? AND user_id = ?').run(req.params.id, studentId);
            // Optionally remove their private clone station as well
            db.prepare('DELETE FROM learning_stations WHERE class_id = ? AND user_id = ?').run(req.params.id, studentId);
        });

        removeTx();

        res.json({ success: true });
    } catch (err) {
        console.error('Remove class member error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ═══════════════════════════════════════════
// CONTACT / FEEDBACK
// ═══════════════════════════════════════════

// Simple rate limiter (1 message per 60s per IP)
const contactRateMap = new Map();

// Create SMTP transporter once at startup (if configured)
let mailTransporter = null;
const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const contactTo = process.env.CONTACT_TO_EMAIL;

if (smtpHost && smtpUser && smtpPass && contactTo) {
    mailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        requireTLS: true,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false }
    });

    // Verify SMTP connection on startup
    mailTransporter.verify()
        .then(() => console.log('✅ SMTP connected successfully —', smtpUser, '→', contactTo))
        .catch(err => {
            console.error('❌ SMTP verification failed:', err.message);
            console.error('   Check your .env credentials (SMTP_USER, SMTP_PASS)');
            mailTransporter = null;
        });
} else {
    console.log('⚠️  SMTP not configured. Contact messages will only be saved to DB.');
    console.log('   Set SMTP_HOST, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL in server/.env');
}

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message, turnstileToken } = req.body;

        const isValidCaptcha = await verifyTurnstileToken(turnstileToken);
        if (!isValidCaptcha) {
            return res.status(403).json({ error: 'CAPTCHA verification failed. Please try again.' });
        }

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        // Rate limit check
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const lastSent = contactRateMap.get(ip) || 0;
        if (now - lastSent < 60000) {
            return res.status(429).json({ error: 'Please wait a minute before sending another message' });
        }
        contactRateMap.set(ip, now);

        // Save to DB
        const db = getDb();
        db.prepare(
            'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)'
        ).run(name, email, subject || '', message);

        res.json({ success: true });
    } catch (err) {
        console.error('Contact error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ═══════════════════════════════════════════
// ADMIN MIDDLEWARE
// ═══════════════════════════════════════════
function adminMiddleware(req, res, next) {
    const db = getDb();
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Admin: view all contact messages
app.get('/api/admin/messages', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const db = getDb();
        const messages = db.prepare(
            'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100'
        ).all();
        res.json({ messages });
    } catch (err) {
        console.error('Admin messages error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: list all users
app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const db = getDb();
        const users = db.prepare(`
            SELECT u.id, u.name, u.email, u.role, u.created_at,
                   (SELECT COUNT(*) FROM learning_stations WHERE user_id = u.id) as station_count
            FROM users u
            ORDER BY u.created_at DESC
        `).all();
        res.json({ users });
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: list all stations with owner info
app.get('/api/admin/stations', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const db = getDb();
        const stations = db.prepare(`
            SELECT ls.id, ls.title, ls.code, ls.is_published, ls.created_at, ls.updated_at,
                   u.id as owner_id, u.name as owner_name, u.email as owner_email
            FROM learning_stations ls
            JOIN users u ON ls.user_id = u.id
            ORDER BY ls.updated_at DESC
        `).all();

        const enriched = stations.map(s => {
            try {
                const full = db.prepare('SELECT data FROM learning_stations WHERE id = ?').get(s.id);
                const parsed = JSON.parse(full.data);
                return { ...s, moduleCount: parsed.modules?.length || 0, level: parsed.level || '' };
            } catch {
                return { ...s, moduleCount: 0, level: '' };
            }
        });

        res.json({ stations: enriched });
    } catch (err) {
        console.error('Admin stations error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: delete multiple users
app.post('/api/admin/users/delete', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'User IDs array is required' });
        }

        const db = getDb();

        // Use a transaction for safe deletion of associated data
        const deleteUsersTx = db.transaction((ids) => {
            const placeholders = ids.map(() => '?').join(',');

            // 1. Delete station collaborators where user is the collaborator
            db.prepare(`DELETE FROM station_collaborators WHERE user_id IN (${placeholders})`).run(...ids);

            // 2. Delete collaborations for stations OWNED by these users
            db.prepare(`
                DELETE FROM station_collaborators 
                WHERE station_id IN (SELECT id FROM learning_stations WHERE user_id IN (${placeholders}))
            `).run(...ids);

            // 3. Delete learning stations owned by these users
            db.prepare(`DELETE FROM learning_stations WHERE user_id IN (${placeholders})`).run(...ids);

            // 4. Finally, delete the users themselves
            const result = db.prepare(`DELETE FROM users WHERE id IN (${placeholders})`).run(...ids);
            return result.changes;
        });

        const deletedCount = deleteUsersTx(userIds);

        res.json({ success: true, deletedCount });
    } catch (err) {
        console.error('Admin delete users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Toggle publish status
app.put('/api/admin/ls/:id/publish', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const { isPublished } = req.body;
        const db = getDb();

        const isPublishedInt = isPublished ? 1 : 0;
        db.prepare(
            "UPDATE learning_stations SET is_published = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(isPublishedInt, req.params.id);

        res.json({ success: true, is_published: isPublishedInt });
    } catch (err) {
        console.error('Admin publish error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: get collaborators for any station
app.get('/api/admin/stations/:id/collaborators', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const db = getDb();
        const station = db.prepare('SELECT id FROM learning_stations WHERE id = ?').get(req.params.id);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        const collaborators = db.prepare(`
            SELECT u.id, u.name, u.email, sc.added_at
            FROM station_collaborators sc
            JOIN users u ON sc.user_id = u.id
            WHERE sc.station_id = ?
        `).all(req.params.id);
        res.json({ collaborators });
    } catch (err) {
        console.error('Admin get collaborators error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: add collaborator to any station
app.post('/api/admin/stations/:id/share', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const db = getDb();
        const station = db.prepare('SELECT id, user_id FROM learning_stations WHERE id = ?').get(req.params.id);
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }
        const targetUser = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
        if (!targetUser) {
            return res.status(404).json({ error: 'No user found with that email' });
        }
        if (targetUser.id === station.user_id) {
            return res.status(400).json({ error: 'Cannot share with the owner' });
        }
        const existing = db.prepare('SELECT * FROM station_collaborators WHERE station_id = ? AND user_id = ?').get(req.params.id, targetUser.id);
        if (existing) {
            return res.status(409).json({ error: 'Already shared with this user' });
        }
        db.prepare('INSERT INTO station_collaborators (station_id, user_id) VALUES (?, ?)').run(req.params.id, targetUser.id);
        res.json({ success: true, collaborator: { id: targetUser.id, name: targetUser.name, email: targetUser.email } });
    } catch (err) {
        console.error('Admin share error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: remove collaborator from any station
app.delete('/api/admin/stations/:id/share/:userId', authMiddleware, adminMiddleware, (req, res) => {
    try {
        const db = getDb();
        db.prepare('DELETE FROM station_collaborators WHERE station_id = ? AND user_id = ?').run(req.params.id, parseInt(req.params.userId));
        res.json({ success: true });
    } catch (err) {
        console.error('Admin remove collaborator error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ═══════════════════════════════════════════
// SERVE FRONTEND (Production)
// ═══════════════════════════════════════════
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback: all non-API routes serve index.html (Express v5 syntax)
    app.get('{*path}', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📁 Serving frontend from', distPath);
}

// ═══════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 LS Designer running on http://0.0.0.0:${PORT}`);
    console.log(`   Database: ${path.join(__dirname, 'data.db')}\n`);
});
