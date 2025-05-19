/**
 * Enhanced logger utility following industry best practices
 * Features:
 * - Structured JSON logging
 * - Log levels with severity
 * - Error handling with stack traces
 * - Environment-aware logging
 * - Request context support
 * - Backward compatible with existing usage
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    ADMIN: 4
};

const currentLogLevel = process.env.LOG_LEVEL || 
    (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

const shouldLog = (level) => {
    return LOG_LEVELS[level] <= LOG_LEVELS[currentLogLevel];
};

const formatLog = (level, source, message, error = null) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        source,
        message,
        ...(process.env.NODE_ENV === 'development' && { pid: process.pid })
    };

    if (error) {
        logEntry.error = {
            name: error.name,
            message: error.message,
            stack: error.stack
        };
    }

    return JSON.stringify(logEntry);
};

// Enhanced logger with structured logging
export const logger = {
    info: (source, message) => {
        if (shouldLog('INFO')) {
            console.log(formatLog('INFO', source, message));
        }
    },
    
    warn: (source, message) => {
        if (shouldLog('WARN')) {
            console.warn(formatLog('WARN', source, message));
        }
    },
    
    error: (source, message, error) => {
        if (shouldLog('ERROR')) {
            console.error(formatLog('ERROR', source, message, error));
        }
    },
    
    debug: (source, message, data) => {
        if (shouldLog('DEBUG') && process.env.NODE_ENV !== 'production') {
            const logData = formatLog('DEBUG', source, message);
            console.log(logData);
            if (data) {
                console.log(JSON.stringify({ debugData: data }, null, 2));
            }
        }
    },
    
    // Enhanced admin logging with structured data
    admin: (adminId, adminEmail, action, details) => {
        if (shouldLog('ADMIN')) {
            const adminInfo = {
                adminId,
                adminEmail,
                action,
                details: details || ''
            };
            console.log(formatLog('ADMIN', 'ADMIN_ACTION', JSON.stringify(adminInfo)));
        }
    },
    
    // New method for request context logging
    request: (req, res, message) => {
        if (shouldLog('INFO')) {
            const requestInfo = {
                method: req.method,
                path: req.path,
                status: res.statusCode,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                message
            };
            console.log(formatLog('INFO', 'REQUEST', JSON.stringify(requestInfo)));
        }
    }
};
