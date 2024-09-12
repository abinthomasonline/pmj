async function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${refreshToken}`
            }
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('accessToken', data.access_token);
            return true;
        }
        throw new Error('Refresh failed');
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
}

function logout(redirect = true, redirect_url = '/login-signup.html', redirect_delay = 0) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('email');
    if (redirect) { 
        setTimeout(() => {
            if (window.location.pathname !== redirect_url) {
            window.location.href = redirect_url;
        }
        }, redirect_delay);
    }
}

async function fetchWithAuth(url, options = {}) {
    const accessToken = localStorage.getItem('accessToken');
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
    };

    try {
        let response = await fetch(url, options);
        let data = await response.json();

        if (data?.result === 'access_token_expired') {
            if (await refreshToken()) {
                options.headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
                response = await fetch(url, options);
                data = await response.json();
            } else {
                return { response: null, data: null };
            }
        }
        return { response, data };
    } catch (error) {
        console.error('Error in fetchWithAuth:', error);
        return { response: null, data: null };
    }
}

async function fetchWithAuthOrLogout(url, options = {}) {
    const { response, data } = await fetchWithAuth(url, options);
    if (!response || !data) {
        logout();
    }
    return { response, data };
}

async function checkAuth() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const email = localStorage.getItem('email');
    try {
        if (accessToken && refreshToken && email) {
            const { response, data } = await fetchWithAuthOrLogout(`${CONFIG.API_BASE_URL}/auth/check-auth`);
            if (data?.authenticated) { 
                return;
            }
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
    logout();
}

async function checkNoAuth() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const email = localStorage.getItem('email');
    try {
        if (accessToken && refreshToken && email) {
            const { response, data } = await fetchWithAuth(`${CONFIG.API_BASE_URL}/auth/check-auth`);
            if (data?.authenticated) { 
                window.location.href = '/app.html';
                return;
            }
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
    logout(false);
}

export {refreshToken, logout, fetchWithAuth, fetchWithAuthOrLogout, checkAuth, checkNoAuth};
