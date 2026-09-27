import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import type {
  ObjectStorage,
  StoredObject,
} from './object-storage.interface.js';

@Injectable()
export class LocalObjectStorage implements ObjectStorage, OnModuleInit {
  private readonly logger = new Logger(LocalObjectStorage.name);
  private readonly rootDir = join(process.cwd(), 'uploads');

  async onModuleInit(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true });
    this.logger.log(`Local object storage ready at ${this.rootDir}`);
  }

  async upload(input: {
    buffer: Buffer;
    mimeType: string;
    folder: string;
    fileName: string;
  }): Promise<StoredObject> {
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${input.folder}/${randomUUID()}-${safeName}`;
    const absolutePath = join(this.rootDir, storageKey);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.buffer);

    const baseUrl =
      process.env.PUBLIC_BASE_URL ??
      `http://localhost:${process.env.PORT ?? 3000}`;

    const publicUrl = `${baseUrl}/media/${storageKey.replace(/\\/g, '/')}`;
    return {
      storageKey,
      publicUrl,
      downloadUrl: publicUrl,
    };
  }

  async delete(storageKeyOrUrl: string): Promise<void> {
    let key = storageKeyOrUrl;
    const marker = '/media/';
    const idx = storageKeyOrUrl.indexOf(marker);
    if (idx >= 0) {
      key = storageKeyOrUrl.slice(idx + marker.length);
    }
    try {
      await unlink(join(this.rootDir, key));
    } catch {
      // ignore missing files
    }
  }

  async resolveDownloadUrl(storageKeyOrUrl: string): Promise<string> {
    return storageKeyOrUrl;
  }
}
