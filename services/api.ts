import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API configuration
const API_URL = 'https://api.memora.app/v1'; // Replace with your actual API URL

// Helper to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

// Helper to check network connection
const isNetworkAvailable = async (): Promise<boolean> => {
  // In a real app, you would use NetInfo or similar
  try {
    // Simple connectivity check
    const response = await fetch('https://api.memora.app/health', { 
      method: 'HEAD',
      cache: 'no-cache',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Get auth token from storage
const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem('auth_token');
};

// Create headers with auth token
const createAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Generic API request function with offline support
export const apiRequest = async <T>(
  endpoint: string, 
  method: string = 'GET', 
  data?: any, 
  offlineKey?: string
): Promise<T> => {
  const isOnline = await isNetworkAvailable();
  
  // If offline and we have a cache key, try to return cached data
  if (!isOnline && offlineKey) {
    const cachedData = await AsyncStorage.getItem(`offline_${offlineKey}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    throw new Error('You are offline and no cached data is available');
  }
  
  // Proceed with online request
  const headers = await createAuthHeaders();
  
  const options: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, options);
  const result = await handleResponse(response);
  
  // Cache successful GET responses for offline use
  if (method === 'GET' && offlineKey) {
    await AsyncStorage.setItem(`offline_${offlineKey}`, JSON.stringify(result));
  }
  
  return result;
};

// Clear cached data for a specific key
export const clearCache = async (offlineKey: string): Promise<void> => {
  await AsyncStorage.removeItem(`offline_${offlineKey}`);
};

// Clear all cached API data
export const clearAllCache = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  const offlineKeys = keys.filter(key => key.startsWith('offline_'));
  if (offlineKeys.length > 0) {
    await AsyncStorage.multiRemove(offlineKeys);
  }
};