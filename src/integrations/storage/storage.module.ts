import { Module } from '@nestjs/common';
import { LocalObjectStorage } from './local-object.storage.js';
import { OBJECT_STORAGE } from './object-storage.interface.js';
import { S3ObjectStorage } from './s3-object.storage.js';

const storageDriver = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();

@Module({
  providers: [
    {
      provide: OBJECT_STORAGE,
      useClass: ['s3', 'minio', 'b2', 'backblaze'].includes(storageDriver)
        ? S3ObjectStorage
        : LocalObjectStorage,
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}
