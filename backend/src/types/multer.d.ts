// backend/src/types/multer.d.ts
// Module declaration for multer v2 (no bundled types)
declare module 'multer' {
  import { RequestHandler } from 'express';

  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  interface FileFilterCallback {
    (error: Error | null, acceptFile?: boolean): void;
  }

  interface StorageEngine {
    _handleFile(req: any, file: any, callback: (error?: any, info?: Partial<File>) => void): void;
    _removeFile(req: any, file: any, callback: (error: Error | null) => void): void;
  }

  interface DiskStorageOptions {
    destination?: string | ((req: any, file: File, callback: (error: Error | null, destination: string) => void) => void);
    filename?: (req: any, file: File, callback: (error: Error | null, filename: string) => void) => void;
  }

  interface Options {
    dest?: string;
    storage?: StorageEngine;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    fileFilter?: (req: any, file: File, callback: FileFilterCallback) => void;
  }

  interface Multer {
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler;
    none(): RequestHandler;
    any(): RequestHandler;
  }

  function multer(options?: Options): Multer;

  namespace multer {
    function diskStorage(options: DiskStorageOptions): StorageEngine;
    function memoryStorage(): StorageEngine;
  }

  export = multer;
}
