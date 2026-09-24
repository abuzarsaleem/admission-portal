export interface StoredObject {
  storageKey: string;
  /** Durable URL/path safe to store in DB (not a long-lived signed query string). */
  publicUrl: string;
  /** Immediately usable URL (signed for private buckets). */
  downloadUrl: string;
}

/**
 * Object storage contract (S3 / Backblaze B2 / MinIO / local).
 * Persist publicUrl (or storageKey); use downloadUrl for immediate client use.
 */
export interface ObjectStorage {
  upload(input: {
    buffer: Buffer;
    mimeType: string;
    folder: string;
    fileName: string;
  }): Promise<StoredObject>;

  delete(storageKey: string): Promise<void>;

  resolveDownloadUrl(storageKeyOrUrl: string): Promise<string>;
}

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');
