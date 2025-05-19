// Configure response interceptor
axios.interceptors.response.use(response => response, error => {
    const { response } = error;
    if (response && response.status === 401) {
        const { code } = response.data;
        const logoutReasons = [
            'TOKEN_EXPIRED',
            'FORCE_LOGOUT',
            'SESSION_EXPIRED',
            'INVALID_TOKEN'
        ];
        
        if (logoutReasons.includes(code)) {
            // Clear cookies and local state
            document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            store.dispatch(clearAdminSession());
            window.location.href = '/admin/login';
        }
    }
    return Promise.reject(error);
});

// Add periodic token validation (every 5 minutes)
setInterval(async () => {
    try {
        await axios.get('/api/admin/validate-token');
    } catch (error) {
        if (error.response?.status === 401) {
            document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            window.location.reload();
        }
    }
}, 300000);