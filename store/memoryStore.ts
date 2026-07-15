import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemoryVault, Memory } from '@/types';
import { memoryService } from '@/services/memoryService';

interface MemoryState {
  vaults: MemoryVault[];
  selectedVaultId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchVaults: () => Promise<void>;
  fetchVault: (id: string) => Promise<MemoryVault | undefined>;
  addVault: (vault: Omit<MemoryVault, 'id' | 'memories' | 'sharedWith' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<void>;
  updateVault: (id: string, updates: Partial<Omit<MemoryVault, 'id' | 'memories'>>) => Promise<void>;
  deleteVault: (id: string) => Promise<void>;
  selectVault: (id: string | null) => void;

  addMemory: (vaultId: string, memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>, storageBytes?: number) => Promise<void>;
  updateMemory: (vaultId: string, memoryId: string, updates: Partial<Omit<Memory, 'id'>>) => Promise<void>;
  deleteMemory: (vaultId: string, memoryId: string) => Promise<void>;
  
  shareVault: (vaultId: string, email: string) => Promise<void>;
  unshareVault: (vaultId: string, userId: string) => Promise<void>;
  
  clearError: () => void;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      vaults: [],
      selectedVaultId: null,
      isLoading: false,
      error: null,
      
      fetchVaults: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const vaults = await memoryService.getVaults();
          set({ vaults, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch vaults",
            isLoading: false 
          });
        }
      },
      
      fetchVault: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const vault = await memoryService.getVault(id);
          
          // Update the vault in the store
          set(state => ({
            vaults: state.vaults.map(v => v.id === id ? vault : v),
            isLoading: false
          }));
          
          return vault;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to fetch vault",
            isLoading: false 
          });
        }
      },
      
      addVault: async (vault) => {
        set({ isLoading: true, error: null });
        
        try {
          const newVault = await memoryService.createVault(vault);
          
          set(state => ({
            vaults: [...state.vaults, newVault],
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to create vault",
            isLoading: false 
          });
        }
      },
      
      updateVault: async (id, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedVault = await memoryService.updateVault(id, updates);
          
          set(state => ({
            vaults: state.vaults.map(vault => 
              vault.id === id ? updatedVault : vault
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to update vault",
            isLoading: false 
          });
        }
      },
      
      deleteVault: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          await memoryService.deleteVault(id);
          
          set(state => ({
            vaults: state.vaults.filter(vault => vault.id !== id),
            selectedVaultId: state.selectedVaultId === id ? null : state.selectedVaultId,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to delete vault",
            isLoading: false 
          });
        }
      },
      
      selectVault: (id) => set({ selectedVaultId: id }),
      
      addMemory: async (vaultId, memory, storageBytes) => {
        set({ isLoading: true, error: null });

        try {
          const newMemory = await memoryService.createMemory(vaultId, memory, storageBytes);
          
          set(state => ({
            vaults: state.vaults.map(vault => 
              vault.id === vaultId 
                ? { 
                    ...vault, 
                    memories: [...vault.memories, newMemory],
                    updatedAt: new Date().toISOString(),
                  } 
                : vault
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to add memory",
            isLoading: false 
          });
        }
      },
      
      updateMemory: async (vaultId, memoryId, updates) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedMemory = await memoryService.updateMemory(vaultId, memoryId, updates);
          
          set(state => ({
            vaults: state.vaults.map(vault => 
              vault.id === vaultId 
                ? { 
                    ...vault, 
                    memories: vault.memories.map(memory => 
                      memory.id === memoryId ? updatedMemory : memory
                    ),
                    updatedAt: new Date().toISOString(),
                  } 
                : vault
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to update memory",
            isLoading: false 
          });
        }
      },
      
      deleteMemory: async (vaultId, memoryId) => {
        set({ isLoading: true, error: null });
        
        try {
          await memoryService.deleteMemory(vaultId, memoryId);
          
          set(state => ({
            vaults: state.vaults.map(vault => 
              vault.id === vaultId 
                ? { 
                    ...vault, 
                    memories: vault.memories.filter(memory => memory.id !== memoryId),
                    updatedAt: new Date().toISOString(),
                  } 
                : vault
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to delete memory",
            isLoading: false 
          });
        }
      },
      
      shareVault: async (vaultId, email) => {
        set({ isLoading: true, error: null });
        
        try {
          await memoryService.shareVault(vaultId, email);
          
          // Refresh the vault to get updated sharing info
          const updatedVault = await memoryService.getVault(vaultId);
          
          set(state => ({
            vaults: state.vaults.map(vault => 
              vault.id === vaultId ? updatedVault : vault
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to share vault",
            isLoading: false 
          });
        }
      },
      
      unshareVault: async (vaultId, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          await memoryService.unshareVault(vaultId, userId);
          
          set(state => ({
            vaults: state.vaults.map(vault => 
              vault.id === vaultId 
                ? { 
                    ...vault, 
                    sharedWith: vault.sharedWith.filter(id => id !== userId),
                    updatedAt: new Date().toISOString(),
                  } 
                : vault
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to unshare vault",
            isLoading: false 
          });
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'heartory-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        vaults: state.vaults,
        selectedVaultId: state.selectedVaultId,
      }),
    }
  )
);