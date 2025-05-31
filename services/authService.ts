import { User } from '@/types/auth';
import { apiRequest } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockApiService } from './mockService';

// Flag to use mock data instead of real API
const USE_MOCK = true;

interface LoginResponse {
  user: User;
  token: string;
}

interface RegisterResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    if (USE_MOCK) {
      return mockApiService.auth.login(email, password);
    }
    
    try {
      const response = await apiRequest<LoginResponse>('/auth/login', 'POST', {
        email,
        password,
      });
      
      // Store the auth token
      await AsyncStorage.setItem('auth_token', response.token);
      
      return response.user;
    } catch (error) {
      throw error;
    }
  },
  
  register: async (name: string, email: string, password: string): Promise<User> => {
    if (USE_MOCK) {
      return mockApiService.auth.register(name, email, password);
    }
    
    try {
      const response = await apiRequest<RegisterResponse>('/auth/register', 'POST', {
        name,
        email,
        password,
      });
      
      // Store the auth token
      await AsyncStorage.setItem('auth_token', response.token);
      
      return response.user;
    } catch (error) {
      throw error;
    }
  },
  
  resetPassword: async (email: string): Promise<void> => {
    if (USE_MOCK) {
      // Mock implementation - just delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }
    
    await apiRequest('/auth/reset-password', 'POST', { email });
  },
  
  logout: async (): Promise<void> => {
    if (USE_MOCK) {
      // Mock implementation - just clear token
      await AsyncStorage.removeItem('auth_token');
      return;
    }
    
    try {
      // Call logout endpoint to invalidate token on server
      await apiRequest('/auth/logout', 'POST');
    } catch (error) {
      // Even if the API call fails, we still want to clear local storage
      console.error('Logout API error:', error);
    } finally {
      // Clear the auth token
      await AsyncStorage.removeItem('auth_token');
    }
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    if (USE_MOCK) {
      return mockApiService.auth.getCurrentUser();
    }
    
    try {
      return await apiRequest<User>('/auth/me', 'GET', undefined, 'current_user');
    } catch (error) {
      return null;
    }
  },
  
  updateProfile: async (userData: Partial<User>): Promise<User> => {
    if (USE_MOCK) {
      return mockApiService.auth.updateProfile(userData);
    }
    
    return apiRequest<User>('/auth/profile', 'PUT', userData, 'current_user');
  }
};