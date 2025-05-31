import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { apiRequest } from './api';
import { mockApiService } from './mockService';

// Flag to use mock data instead of real API
const USE_MOCK = true;

interface UploadResponse {
  url: string;
  key: string;
}

interface UploadProgress {
  progress: number;
  bytesWritten: number;
  bytesTotal: number;
}

export const uploadService = {
  uploadImage: async (
    uri: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> => {
    if (USE_MOCK) {
      // Simulate progress updates
      if (onProgress) {
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
          await new Promise(resolve => setTimeout(resolve, 150));
          onProgress({
            progress: i / steps,
            bytesWritten: i * 100,
            bytesTotal: steps * 100
          });
        }
      }
      
      return mockApiService.uploads.uploadImage(uri);
    }
    
    // For web platform, we need a different approach
    if (Platform.OS === 'web') {
      return uploadForWeb(uri);
    }
    
    // Get upload URL from server
    const uploadData = await apiRequest<UploadResponse>('/uploads/prepare', 'POST', {
      contentType: 'image/jpeg',
      filename: uri.split('/').pop(),
    });
    
    // Upload the file directly to the presigned URL
    const uploadResult = await FileSystem.uploadAsync(uploadData.url, uri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'image/jpeg',
      },
      sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
      uploadProgress: onProgress ? 
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          onProgress({
            progress: totalBytesWritten / totalBytesExpectedToWrite,
            bytesWritten: totalBytesWritten,
            bytesTotal: totalBytesExpectedToWrite
          });
        } : undefined
    });
    
    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      // Return the public URL for the uploaded file
      return uploadData.url.split('?')[0]; // Remove query params from presigned URL
    } else {
      throw new Error(`Upload failed with status ${uploadResult.status}`);
    }
  },
  
  uploadVideo: async (
    uri: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> => {
    if (USE_MOCK) {
      // Simulate progress updates
      if (onProgress) {
        const steps = 20; // More steps for video to simulate longer upload
        for (let i = 1; i <= steps; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          onProgress({
            progress: i / steps,
            bytesWritten: i * 500,
            bytesTotal: steps * 500
          });
        }
      }
      
      return mockApiService.uploads.uploadVideo(uri);
    }
    
    // Similar to uploadImage but with video content type
    if (Platform.OS === 'web') {
      return uploadForWeb(uri);
    }
    
    const uploadData = await apiRequest<UploadResponse>('/uploads/prepare', 'POST', {
      contentType: 'video/mp4',
      filename: uri.split('/').pop(),
    });
    
    const uploadResult = await FileSystem.uploadAsync(uploadData.url, uri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'video/mp4',
      },
      sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
      uploadProgress: onProgress ? 
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          onProgress({
            progress: totalBytesWritten / totalBytesExpectedToWrite,
            bytesWritten: totalBytesWritten,
            bytesTotal: totalBytesExpectedToWrite
          });
        } : undefined
    });
    
    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      return uploadData.url.split('?')[0];
    } else {
      throw new Error(`Upload failed with status ${uploadResult.status}`);
    }
  },
  
  uploadAudio: async (
    uri: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> => {
    if (USE_MOCK) {
      // Simulate progress updates
      if (onProgress) {
        const steps = 15;
        for (let i = 1; i <= steps; i++) {
          await new Promise(resolve => setTimeout(resolve, 80));
          onProgress({
            progress: i / steps,
            bytesWritten: i * 200,
            bytesTotal: steps * 200
          });
        }
      }
      
      return mockApiService.uploads.uploadAudio(uri);
    }
    
    // Similar to uploadImage but with audio content type
    if (Platform.OS === 'web') {
      return uploadForWeb(uri);
    }
    
    const uploadData = await apiRequest<UploadResponse>('/uploads/prepare', 'POST', {
      contentType: 'audio/mpeg',
      filename: uri.split('/').pop(),
    });
    
    const uploadResult = await FileSystem.uploadAsync(uploadData.url, uri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
      sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
      uploadProgress: onProgress ? 
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          onProgress({
            progress: totalBytesWritten / totalBytesExpectedToWrite,
            bytesWritten: totalBytesWritten,
            bytesTotal: totalBytesExpectedToWrite
          });
        } : undefined
    });
    
    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      return uploadData.url.split('?')[0];
    } else {
      throw new Error(`Upload failed with status ${uploadResult.status}`);
    }
  }
};

// Helper function for web uploads
const uploadForWeb = async (uri: string): Promise<string> => {
  // For web, we need to convert the file to a blob and use FormData
  try {
    // Convert data URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', blob);
    
    // Get upload URL and upload the file
    const uploadResponse = await apiRequest<UploadResponse>('/uploads/web', 'POST', formData);
    return uploadResponse.url;
  } catch (error) {
    console.error('Web upload error:', error);
    throw error;
  }
};