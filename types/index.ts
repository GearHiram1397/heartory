export interface Memory {
    id: string;
    type: 'photo' | 'video' | 'audio' | 'text' | 'quote';
    content: string; // URL for media, text content for text/quote
    caption?: string;
    date: string; // ISO date string
    tags?: string[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface MemoryVault {
    id: string;
    name: string;
    coverImage?: string;
    description?: string;
    memories: Memory[];
    sharedWith: string[]; // Array of user IDs
    createdAt: string;
    updatedAt: string;
    ownerId: string; // ID of the user who created the vault
  }
  
  export interface SharedUser {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }
  
  // API response types
  export interface ApiError {
    message: string;
    code?: string;
    status?: number;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }