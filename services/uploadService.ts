import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

export interface UploadProgress {
  progress: number;
  bytesWritten: number;
  bytesTotal: number;
}

export interface UploadResult {
  // Storage object path within the 'memories' bucket, e.g. "<vaultId>/<id>.jpg".
  // Stored as the memory's `content`; resolved to a signed URL on read.
  path: string;
  bytes: number;
  contentType: string;
}

const EXT_CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  m4a: 'audio/x-m4a',
  mp3: 'audio/mpeg',
  aac: 'audio/aac',
  wav: 'audio/wav',
};

const extensionFor = (uri: string, fallback: string): string => {
  const clean = uri.split('?')[0].split('#')[0];
  const ext = clean.includes('.') ? clean.split('.').pop()!.toLowerCase() : '';
  return ext && EXT_CONTENT_TYPE[ext] ? ext : fallback;
};

const randomId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Upload a local file URI to the private `memories` bucket under the given
 * vault's folder. Returns the storage path + byte size (for quota accounting).
 */
const uploadToVault = async (
  vaultId: string,
  uri: string,
  fallbackExt: string,
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> => {
  onProgress?.({ progress: 0.05, bytesWritten: 0, bytesTotal: 1 });

  const ext = extensionFor(uri, fallbackExt);
  const contentType = EXT_CONTENT_TYPE[ext] ?? 'application/octet-stream';
  const path = `${vaultId}/${randomId()}.${ext}`;

  let body: ArrayBuffer | Blob;
  let bytes: number;

  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    body = blob;
    bytes = blob.size;
  } else {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const arrayBuffer = decodeBase64(base64);
    body = arrayBuffer;
    bytes = arrayBuffer.byteLength;
  }

  onProgress?.({ progress: 0.4, bytesWritten: 0, bytesTotal: bytes });

  const { error } = await supabase.storage
    .from('memories')
    .upload(path, body, { contentType, upsert: false });

  if (error) {
    // Surface the storage-policy / quota errors in a friendly way.
    throw new Error(error.message || 'Upload failed. Please try again.');
  }

  onProgress?.({ progress: 1, bytesWritten: bytes, bytesTotal: bytes });
  return { path, bytes, contentType };
};

const readBinary = async (uri: string): Promise<{ body: ArrayBuffer | Blob; bytes: number }> => {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    return { body: blob, bytes: blob.size };
  }
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = decodeBase64(base64);
  return { body: arrayBuffer, bytes: arrayBuffer.byteLength };
};

export const uploadService = {
  uploadImage: (
    vaultId: string,
    uri: string,
    onProgress?: (p: UploadProgress) => void
  ): Promise<UploadResult> => uploadToVault(vaultId, uri, 'jpg', onProgress),

  /**
   * Upload a vault cover image to the public `avatars` bucket (scoped to the
   * user's folder) and return its public URL. Used before a vault exists.
   */
  uploadCoverImage: async (
    uri: string,
    onProgress?: (p: UploadProgress) => void
  ): Promise<string> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be signed in to upload an image.');

    onProgress?.({ progress: 0.1, bytesWritten: 0, bytesTotal: 1 });
    const ext = extensionFor(uri, 'jpg');
    const contentType = EXT_CONTENT_TYPE[ext] ?? 'image/jpeg';
    const path = `${user.id}/${randomId()}.${ext}`;
    const { body } = await readBinary(uri);

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, body, { contentType, upsert: false });
    if (error) throw new Error(error.message || 'Upload failed. Please try again.');

    onProgress?.({ progress: 1, bytesWritten: 1, bytesTotal: 1 });
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  },

  uploadVideo: (
    vaultId: string,
    uri: string,
    onProgress?: (p: UploadProgress) => void
  ): Promise<UploadResult> => uploadToVault(vaultId, uri, 'mp4', onProgress),

  uploadAudio: (
    vaultId: string,
    uri: string,
    onProgress?: (p: UploadProgress) => void
  ): Promise<UploadResult> => uploadToVault(vaultId, uri, 'm4a', onProgress),
};
