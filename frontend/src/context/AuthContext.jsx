import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const deriveRole = (userData) => {
  if (!userData) return 'customer';
  
  const roles = userData.roles || [];
  if (roles.includes('admin')) return 'admin';
  
  if (userData.role && ['admin', 'customer'].includes(userData.role)) {
    return userData.role;
  }
  
  return 'customer';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── helpers ─────────────────────────────────────────────────────────────────
  /**
   * Returns true if the logged-in user has at least one of the given roles.
   * Usage: hasRole('admin')  |  hasRole('admin', 'seller')
   */
  const hasRole = useCallback((...roles) => {
    if (!user) return false;
    return roles.some(r => r === user.role || (user.roles || []).includes(r));
  }, [user]);

  const isAdmin    = useCallback(() => hasRole('admin'),          [hasRole]);
  const isCustomer = useCallback(() => hasRole('customer'), [hasRole]);

  // ── session restore ──────────────────────────────────────────────────────────
  useEffect(() => {
    checkAuth();

    const handleAuthChange = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth-token-removed', handleAuthChange);
    return () => window.removeEventListener('auth-token-removed', handleAuthChange);
  }, []);

  // ── Sync guest cart to backend ─────────────────────────────────────────────
  const syncGuestCart = async () => {
    const guestCartStr = localStorage.getItem('guestCart');
    if (!guestCartStr) return;
    try {
      const guestCart = JSON.parse(guestCartStr);
      if (guestCart.items?.length > 0) {
        // Sync items one by one (simplest without new backend endpoint)
        for (const item of guestCart.items) {
          if (item.isCombo) {
            const comboId = typeof item.comboId === 'object' ? item.comboId._id : item.comboId;
            await api.post('/cart/combo', { comboId, quantity: item.quantity });
          } else {
            await api.post('/cart/add', { productId: item.product, quantity: item.quantity });
          }
        }
        localStorage.removeItem('guestCart');
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (err) {
      console.error('Failed to sync guest cart:', err);
    }
  };

  const checkAuth = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success && data.user) {
        const userData = data.user;
        const role     = deriveRole(userData);
        setUser({ ...userData, role });
        setIsAuthenticated(true);
        // Sync guest cart if exists
        syncGuestCart();
      } else {
        // Handled gracefully from backend when not logged in
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // ── login ────────────────────────────────────────────────────────────────────
  const loginWithGoogle = async (credential) => {
    try {
      const { data } = await api.post('/auth/google', { credential });
      if (data.success) {
        const userData = data.user;
        const role = deriveRole(userData);
        setUser({ ...userData, role });
        setIsAuthenticated(true);
        if (data.token) localStorage.setItem('token', data.token);
        await syncGuestCart();
        window.dispatchEvent(new Event('form-data-reload'));
        return { success: true, user: { ...userData, role } };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Google Login failed' };
    }
  };

  const loginWithPhone = async (idToken) => {
    try {
      const { data } = await api.post('/auth/phone', { idToken });
      if (data.success) {
        const userData = data.user;
        const role = deriveRole(userData);
        setUser({ ...userData, role });
        setIsAuthenticated(true);
        if (data.token) localStorage.setItem('token', data.token);
        await syncGuestCart();
        window.dispatchEvent(new Event('form-data-reload'));
        return { success: true, user: { ...userData, role } };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Phone Login failed' };
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        const userData = data.user;
        const role     = deriveRole(userData);
        setUser({ ...userData, role });
        setIsAuthenticated(true);
        // Keep token in localStorage for axios interceptor fallback
        if (data.token) localStorage.setItem('token', data.token);
        
        // Sync guest cart
        await syncGuestCart();

        window.dispatchEvent(new Event('form-data-reload'));
        return { success: true, user: { ...userData, role } };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  // ── register ─────────────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      if (data.success) {
        return { success: true, email: data.email, message: data.message };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  // ── logout ───────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      window.dispatchEvent(new Event('auth-token-removed'));
      window.dispatchEvent(new Event('form-data-reset'));
    }
  };

  // ── refreshUser ──────────────────────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        const userData = data.user;
        const role     = deriveRole(userData);
        setUser({ ...userData, role });
      }
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  // ── merge partial updates (e.g. profile picture) ─────────────────────────────
  const updateUser = (partialUser) =>
    setUser((prev) => prev ? { ...prev, ...partialUser } : prev);

  const value = {
    user,
    loading,
    isAuthenticated,
    // core actions
    login,
    loginWithGoogle,
    loginWithPhone,
    register,
    logout,
    checkAuth,
    updateUser,
    refreshUser,
    // role helpers
    hasRole,
    isAdmin,
    isCustomer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
