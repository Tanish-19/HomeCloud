import fs from 'fs/promises';
import path from 'path';

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Gets the configured storage root path.
 */
export function getStorageRoot(): string {
  const root = process.env.STORAGE_PATH;
  if (!root) {
    throw new StorageError('STORAGE_PATH environment variable is not configured.');
  }
  return path.resolve(root);
}

/**
 * Ensures the configured storage directory and common subdirectories exist.
 */
export async function initializeStorage(): Promise<void> {
  const root = getStorageRoot();
  try {
    await fs.mkdir(root, { recursive: true });
    
    // Create base directories if they don't exist
    const usersDir = path.join(root, 'users');
    const systemDir = path.join(root, 'system');
    
    await fs.mkdir(usersDir, { recursive: true });
    await fs.mkdir(systemDir, { recursive: true });
  } catch (error) {
    throw new StorageError(`Failed to initialize storage at ${root}: ${error}`);
  }
}

/**
 * Safely resolves a path and ensures it stays within the storage root to prevent path traversal.
 * @param requestedPath The relative path requested by the client.
 * @param userId Optional userId to restrict the path to the user's specific folder.
 * @returns The resolved absolute path.
 */
export function resolveSafePath(requestedPath: string, userId?: string): string {
  const root = getStorageRoot();
  const baseDir = userId ? path.join(root, 'users', userId) : root;
  
  // Resolve the requested path relative to the base directory
  const resolvedPath = path.resolve(baseDir, requestedPath);
  
  // Ensure the resolved path starts with the base directory
  if (!resolvedPath.startsWith(baseDir)) {
    throw new StorageError('Path traversal detected.');
  }
  
  return resolvedPath;
}

/**
 * Safely creates a directory within the storage, preventing path traversal.
 */
export async function createSafeDirectory(requestedPath: string, userId: string): Promise<string> {
  const safePath = resolveSafePath(requestedPath, userId);
  await fs.mkdir(safePath, { recursive: true });
  return safePath;
}
