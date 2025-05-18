// Base API URL from environment variables
const isDevelopment = import.meta.env.DEV;
const API_URL = import.meta.env.VITE_API_URL || (isDevelopment ? '/api' : 'http://localhost:4000/api');

// Debug logging
console.log('API Configuration:', {
  isDevelopment,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_URL,
  NODE_ENV: import.meta.env.MODE
});

// Helper to create URL based on environment
const createApiUrl = (endpoint) => {
  try {
    if (!endpoint) {
      throw new Error('Endpoint is required');
    }

    // Ensure endpoint is a string
    const endpointStr = String(endpoint);
    
    // Remove leading slash if present
    const normalizedEndpoint = endpointStr.startsWith('/') ? endpointStr.substring(1) : endpointStr;
    
    if (isDevelopment) {
      // In development, always use the /api prefix for the proxy
      const url = `/api/${normalizedEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
      console.log('Development URL:', url);
      return url;
    } else {
      // In production, use the full URL from environment
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const url = `${baseUrl}/${normalizedEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
      console.log('Production URL:', url);
      return url;
    }
  } catch (error) {
    console.error('Error creating API URL:', {
      endpoint,
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to create API URL: ${error.message}`);
  }
};

/**
 * Make a fetch request with the base URL automatically prefixed
 * @param {string} endpoint - The API endpoint (e.g., '/products')
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} - The fetch response
 */
const apiRequest = async (endpoint, options = {}) => {
  // Validate endpoint
  if (!endpoint) {
    throw new Error('API endpoint is required');
  }

  let finalUrl;
  try {
    finalUrl = createApiUrl(endpoint);
    
    // Log the actual URL being called
    console.log('Making request to:', finalUrl);
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('API Request:', {
      method: options.method || 'GET',
      url: finalUrl,
      endpoint,
      headers,
      body: options.body
    });

    let response;
    try {
      response = await fetch(finalUrl, {
        ...options,
        headers,
        credentials: 'include' // Important for cookies
      });
    } catch (networkError) {
      console.error('Network Error:', networkError);
      throw new Error(`Network error: ${networkError.message}`);
    }

    console.log('API Response:', {
      url: finalUrl,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData;
      try {
        // Try to parse error response as JSON
        const errorText = await response.text();
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText || response.statusText };
        }
      } catch (e) {
        errorData = { message: response.statusText };
      }
      
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      console.error('API Error:', {
        url: finalUrl,
        status: response.status,
        error: errorData,
        response: errorData
      });
      throw error;
    }

    // Return response based on content type
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('API Request Error:', {
      url: finalUrl || 'Unknown URL',
      endpoint,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Create API instance with default config
const api = {
  /**
   * Send a GET request to the API
   * @param {string} endpoint - The API endpoint (e.g., '/products')
   * @param {Object} [params={}] - Query parameters
   * @returns {Promise<any>} - The response data
   */
  get: async (endpoint, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      return await apiRequest(url, { method: 'GET' });
    } catch (error) {
      console.error('GET request failed:', error);
      throw error;
    }
  },

  /**
   * Send a POST request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} [data={}] - The request body
   * @returns {Promise<any>} - The response data
   */
  post: async (endpoint, data = {}) => {
    try {
      return await apiRequest(endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
      });
    } catch (error) {
      console.error('POST request failed:', error);
      throw error;
    }
  },

  /**
   * Send a PUT request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} [data={}] - The request body
   * @returns {Promise<any>} - The response data
   */
  put: async (endpoint, data = {}) => {
    try {
      return await apiRequest(endpoint, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
      });
    } catch (error) {
      console.error('PUT request failed:', error);
      throw error;
    }
  },

  /**
   * Send a PATCH request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} [data={}] - The request body
   * @returns {Promise<any>} - The response data
   */
  patch: async (endpoint, data = {}) => {
    try {
      return await apiRequest(endpoint, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
      });
    } catch (error) {
      console.error('PATCH request failed:', error);
      throw error;
    }
  },

  /**
   * Send a DELETE request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} [data={}] - Optional request body
   * @returns {Promise<any>} - The response data
   */
  delete: async (endpoint, data = {}) => {
    try {
      return await apiRequest(endpoint, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        ...(Object.keys(data).length > 0 && { body: JSON.stringify(data) })
      });
    } catch (error) {
      console.error('DELETE request failed:', error);
      throw error;
    }
  },
};

export default api;
