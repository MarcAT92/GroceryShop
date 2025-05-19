// Get admin token from localStorage with validation
export const getAdminToken = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return null;
    
    // Check token expiration before returning
    try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            removeAdminToken();
            return null;
        }
        return token;
    } catch {
        return null;
    }
};

// Check admin login state with token validation
export const isAdminLoggedIn = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return false;
    
    try {
        // Verify token expiration without verifying signature (client-side only check)
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            removeAdminToken();
            return false;
        }
        return true;
    } catch {
        return false;
    }
};

// Remove admin token2
export const removeAdminToken = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
};

// Get admin data
export const getAdminData = () => {
    const adminDataStr = localStorage.getItem('adminData');
    if (!adminDataStr) return null;

    try {
        return JSON.parse(adminDataStr);
    } catch (error) {
        console.error('Error parsing admin data:', error);
        return null;
    }
};

// Admin logout
export const adminLogout = async () => {
    try {
        // Call backend API for admin logout
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
        const token = getAdminToken();
        console.log('Logging out admin');

        if (token) {
            try {
                const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

                const response = await fetch(`${apiUrl}/admin/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': formattedToken
                    },
                    credentials: 'include'
                });

                console.log('Logout response status:', response.status);

                // Try to parse the response, but don't block on errors
                try {
                    const data = await response.json();
                    console.log('Logout response:', data);
                } catch (parseError) {
                    console.warn('Error parsing logout response:', parseError);
                    // Still ignore JSON parsing errors for logout flow to continue
                }
            } catch (apiError) {
                console.error('API error during logout:', apiError);
                // Continue with logout process even if API call fails
            }
        }

        // Always remove the token from localStorage
        console.log('Removing admin token from localStorage');
        removeAdminToken();

        // Clear any related storage
        sessionStorage.removeItem('adminData');

        return true; // Consider logout successful if we removed the token
    } catch (error) {
        console.error('Logout error:', error);
        // Still remove the token even if there's an error
        removeAdminToken();
        return true;
    }
};
