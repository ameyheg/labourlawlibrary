// API Client for India Labour Law Library
const API = {
  getToken() {
    return localStorage.getItem('labour_law_jwt_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('labour_law_jwt_token', token);
    } else {
      localStorage.removeItem('labour_law_jwt_token');
    }
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('labour_law_user_cache') || 'null');
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('labour_law_user_cache', JSON.stringify(user));
    } else {
      localStorage.removeItem('labour_law_user_cache');
    }
  },

  getHeaders(custom = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...custom,
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const headers = this.getHeaders(options.headers);
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      // Non-json response
    }

    if (!response.ok) {
      const err = new Error(data?.message || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  },

  // Auth Endpoints
  async login(email, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    this.setUser(res.user);
    return res;
  },

  async register(email, password, full_name, subscription_tier = 'free') {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, subscription_tier }),
    });
    this.setToken(res.token);
    this.setUser(res.user);
    return res;
  },

  async getMe() {
    const res = await this.request('/api/auth/me');
    this.setUser(res.user);
    return res.user;
  },

  async updateSubscription(tier, status = 'active') {
    const res = await this.request('/api/auth/subscription', {
      method: 'PATCH',
      body: JSON.stringify({ tier, status }),
    });
    this.setToken(res.token);
    this.setUser(res.user);
    return res.user;
  },

  logout() {
    this.setToken(null);
    this.setUser(null);
  },

  // Document Endpoints
  async getDocuments(params = {}) {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        query.set(key, val);
      }
    }
    const qs = query.toString();
    return this.request(`/api/documents${qs ? '?' + qs : ''}`);
  },

  async getDocument(idOrSlug) {
    return this.request(`/api/documents/${encodeURIComponent(idOrSlug)}`);
  },

  async getStats() {
    return this.request('/api/stats');
  },

  // Admin Endpoints
  async createDocument(docData) {
    return this.request('/api/admin/documents', {
      method: 'POST',
      body: JSON.stringify(docData),
    });
  },

  async updateDocument(id, docData) {
    return this.request(`/api/admin/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(docData),
    });
  },

  async verifyDocument(id, status = 'verified', notes = '') {
    return this.request(`/api/admin/documents/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    });
  },

  async publishDocument(id) {
    return this.request(`/api/admin/documents/${id}/publish`, {
      method: 'POST',
    });
  },

  async supersedeDocument(id, superseded_by_id) {
    return this.request(`/api/admin/documents/${id}/supersede`, {
      method: 'POST',
      body: JSON.stringify({ superseded_by_id }),
    });
  },

  async deleteDocument(id) {
    return this.request(`/api/admin/documents/${id}`, {
      method: 'DELETE',
    });
  },

  async triggerBackup() {
    return this.request('/api/admin/backup', {
      method: 'POST',
    });
  },
};
