import Admin from '../models/adminModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';
import { setForceLogout } from '../utils/sessionManager.js';

// Generate JWT
const generateToken = (id, isAdmin, lastUpdated) => {
    return jwt.sign({ id, isAdmin, lastUpdated }, process.env.JWT_SECRET || 'admin-secret-key', {
        expiresIn: '30d', // Token expires in 30 days
    });
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find admin by email
        const admin = await Admin.findOne({ email });

        // Check if admin exists and password matches
        if (admin && (await bcrypt.compare(password, admin.password))) {
            // Update lastUpdated timestamp before generating token
            admin.lastUpdated = new Date();
            await admin.save();

            const token = generateToken(admin._id, true, admin.lastUpdated.getTime());

            // Set token in cookie
            res.cookie('adminToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
                sameSite: 'strict', // Prevent CSRF attacks
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                path: '/'
            });

            logger.info('AdminController', `Admin ${admin.email} logged in successfully`);

            res.status(200).json({
                success: true,
                message: 'Admin logged in successfully',
                admin: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                },
                token: token // Optionally send token in body for client-side storage fallback
            });
        } else {
            logger.warn('AdminController', `Invalid login attempt for email: ${email}`);
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        logger.error('AdminController', 'Error during admin login', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

// @desc    Logout admin
// @route   POST /api/admin/logout
// @access  Private
export const adminLogout = (req, res) => {
    // Clear the cookie
    res.cookie('adminToken', '', {
        httpOnly: true,
        expires: new Date(0),
        path: '/'
    });

    // Optionally invalidate session on server side if needed
    // setForceLogout(req.admin.id); // Example if using session invalidation

    logger.info('AdminController', `Admin ${req.admin?.email || 'unknown'} logged out`);

    res.status(200).json({ success: true, message: 'Admin logged out successfully' });
};

// @desc    Validate admin token
// @route   GET /api/admin/validate-token
// @access  Private
export const validateToken = (req, res) => {
    // If the protectAdmin middleware successfully authenticated the request,
    // the token is valid and the admin is available in req.admin
    logger.debug('AdminController', `Token validated for admin ${req.admin.email}`);
    res.status(200).json({ success: true, message: 'Token is valid', admin: req.admin });
};

// @desc    Get admin sessions (example - might need actual session tracking logic)
// @route   GET /api/admin/sessions
// @access  Private
export const getAdminSessions = async (req, res) => {
    // This is a placeholder. Implement actual session tracking if needed.
    // For now, it just confirms the admin is authenticated.
    logger.debug('AdminController', `Fetching sessions for admin ${req.admin.email}`);
    res.status(200).json({ success: true, message: 'Admin session is active', admin: req.admin });
};