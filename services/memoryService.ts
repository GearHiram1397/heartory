import { MemoryVault, Memory, SharedUser } from '@/types';
import { apiRequest, clearCache } from './api';
import { mockApiService } from './mockService';

// Flag to use mock data instead of real API
const USE_MOCK = true;

export const memoryService = {
  // Vault operations
  getVaults: async (): Promise<MemoryVault[]> => {
    if (USE_MOCK) {
      return mockApiService.vaults.getAll();
    }
    
    return apiRequest<MemoryVault[]>('/vaults', 'GET', undefined, 'vaults');
  },
  
  getVault: async (id: string): Promise<MemoryVault> => {
    if (USE_MOCK) {
      return mockApiService.vaults.getById(id);
    }
    
    return apiRequest<MemoryVault>(`/vaults/${id}`, 'GET', undefined, `vault_${id}`);
  },
  
  createVault: async (vault: Omit<MemoryVault, 'id' | 'memories' | 'sharedWith' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<MemoryVault> => {
    if (USE_MOCK) {
      return mockApiService.vaults.create(vault);
    }
    
    const newVault = await apiRequest<MemoryVault>('/vaults', 'POST', vault);
    // Clear vaults cache to ensure fresh data on next fetch
    await clearCache('vaults');
    return newVault;
  },
  
  updateVault: async (id: string, updates: Partial<Omit<MemoryVault, 'id' | 'memories'>>): Promise<MemoryVault> => {
    if (USE_MOCK) {
      return mockApiService.vaults.update(id, updates);
    }
    
    const updatedVault = await apiRequest<MemoryVault>(`/vaults/${id}`, 'PUT', updates);
    // Clear specific vault cache
    await clearCache(`vault_${id}`);
    await clearCache('vaults');
    return updatedVault;
  },
  
  deleteVault: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.vaults.delete(id);
    }
    
    await apiRequest<void>(`/vaults/${id}`, 'DELETE');
    // Clear caches
    await clearCache(`vault_${id}`);
    await clearCache('vaults');
  },
  
  // Memory operations
  getMemories: async (vaultId: string): Promise<Memory[]> => {
    if (USE_MOCK) {
      const vault = await mockApiService.vaults.getById(vaultId);
      return vault.memories;
    }
    
    return apiRequest<Memory[]>(`/vaults/${vaultId}/memories`, 'GET', undefined, `memories_${vaultId}`);
  },
  
  getMemory: async (vaultId: string, memoryId: string): Promise<Memory> => {
    if (USE_MOCK) {
      const vault = await mockApiService.vaults.getById(vaultId);
      const memory = vault.memories.find(m => m.id === memoryId);
      if (!memory) {
        throw new Error('Memory not found');
      }
      return memory;
    }
    
    return apiRequest<Memory>(
      `/vaults/${vaultId}/memories/${memoryId}`, 
      'GET', 
      undefined, 
      `memory_${vaultId}_${memoryId}`
    );
  },
  
  createMemory: async (
    vaultId: string, 
    memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Memory> => {
    if (USE_MOCK) {
      return mockApiService.memories.create(vaultId, memory);
    }
    
    const newMemory = await apiRequest<Memory>(`/vaults/${vaultId}/memories`, 'POST', memory);
    // Clear memories cache
    await clearCache(`memories_${vaultId}`);
    await clearCache(`vault_${vaultId}`);
    return newMemory;
  },
  
  updateMemory: async (
    vaultId: string, 
    memoryId: string, 
    updates: Partial<Omit<Memory, 'id'>>
  ): Promise<Memory> => {
    if (USE_MOCK) {
      return mockApiService.memories.update(vaultId, memoryId, updates);
    }
    
    const updatedMemory = await apiRequest<Memory>(
      `/vaults/${vaultId}/memories/${memoryId}`, 
      'PUT', 
      updates
    );
    // Clear caches
    await clearCache(`memory_${vaultId}_${memoryId}`);
    await clearCache(`memories_${vaultId}`);
    await clearCache(`vault_${vaultId}`);
    return updatedMemory;
  },
  
  deleteMemory: async (vaultId: string, memoryId: string): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.memories.delete(vaultId, memoryId);
    }
    
    await apiRequest<void>(`/vaults/${vaultId}/memories/${memoryId}`, 'DELETE');
    // Clear caches
    await clearCache(`memory_${vaultId}_${memoryId}`);
    await clearCache(`memories_${vaultId}`);
    await clearCache(`vault_${vaultId}`);
  },
  
  // Sharing operations
  shareVault: async (vaultId: string, email: string): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.vaults.share(vaultId, email);
    }
    
    await apiRequest<void>(`/vaults/${vaultId}/share`, 'POST', { email });
    await clearCache(`vault_${vaultId}`);
  },
  
  unshareVault: async (vaultId: string, userId: string): Promise<void> => {
    if (USE_MOCK) {
      return mockApiService.vaults.unshare(vaultId, userId);
    }
    
    await apiRequest<void>(`/vaults/${vaultId}/share/${userId}`, 'DELETE');
    await clearCache(`vault_${vaultId}`);
  },
  
  getSharedUsers: async (vaultId: string): Promise<SharedUser[]> => {
    if (USE_MOCK) {
      return mockApiService.vaults.getSharedUsers(vaultId);
    }
    
    return apiRequest<SharedUser[]>(`/vaults/${vaultId}/shared-users`, 'GET');
  }
};