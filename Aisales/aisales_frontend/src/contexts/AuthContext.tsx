import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  workspaceId?: number | null;
  companyId?: number | null;
  companyName?: string | null;
  customRoleId?: number | null;
  customRoleName?: string | null;
  permissions?: Record<string, boolean>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for stored token on initialization
  useEffect(() => {
    const storedToken = localStorage.getItem('finsight_token');
    const storedUser = localStorage.getItem('finsight_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const token = await response.text();
      
      // Decode JWT to get user info (basic decoding - in production use a proper JWT library)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const userData: User = {
        id: payload.userId || 0,
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        email: payload.sub || email,
        role: payload.role || 'USER',
        createdAt: new Date().toISOString(),
        workspaceId: typeof payload.workspaceId === 'number' ? payload.workspaceId : (payload.workspaceId ?? null),
        companyId: typeof payload.companyId === 'number' ? payload.companyId : (payload.companyId ?? null),
        companyName: payload.companyName || null,
        customRoleId: typeof payload.customRoleId === 'number' ? payload.customRoleId : (payload.customRoleId ?? null),
        customRoleName: payload.customRoleName || null,
        permissions: payload.permissions || {},
      };

      setToken(token);
      setUser(userData);
      
      localStorage.setItem('finsight_token', token);
      localStorage.setItem('finsight_user', JSON.stringify(userData));
      
      if (userData.role === 'ADMIN' && (userData.companyId === null || userData.companyId === undefined)) {
        navigate('/workspace-setup');
      } else {
        // Check if user has any permissions beyond Dashboard
        const hasOtherPermissions = userData.permissions && Object.entries(userData.permissions)
          .some(([key, value]) => key !== 'Dashboard' && value === true);
        
        // If user has no custom role or only Dashboard permission, show a message
        if (!userData.customRoleId && !hasOtherPermissions) {
          // User can only access dashboard until admin assigns a role
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const newUser = await response.json();
      
      // Auto-login after registration
      await login(userData.email, userData.password);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('finsight_token');
    localStorage.removeItem('finsight_user');
    navigate('/login');
  };

  const refreshUser = () => {
    const storedUser = localStorage.getItem('finsight_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin always has all permissions
    if (user.role === 'ADMIN') return true;
    
    // Check custom role permissions
    if (user.permissions && user.permissions[permission] !== undefined) {
      return user.permissions[permission];
    }
    
    // Default permissions for regular users
    const defaultPermissions: Record<string, boolean> = {
      'Dashboard': true,
      'Analytics': false,
      'Sentiment': false,
      'History': false,
      'Settings': false
    };
    
    return defaultPermissions[permission] || false;
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    isLoading,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};