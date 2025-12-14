import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Railway Storage Bucket Configuration
// Uses S3-compatible API with Railway's storage endpoint
function getRailwayStorageConfig() {
  const bucket = process.env.S3_BUCKET || process.env.BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;
  const endpoint = process.env.S3_ENDPOINT || "https://storage.railway.app";
  const region = process.env.S3_REGION || "auto";

  if (!bucket) {
    throw new Error("S3_BUCKET or BUCKET environment variable is not set");
  }
  if (!accessKeyId) {
    throw new Error("S3_ACCESS_KEY_ID or ACCESS_KEY_ID environment variable is not set");
  }
  if (!secretAccessKey) {
    throw new Error("S3_SECRET_ACCESS_KEY or SECRET_ACCESS_KEY environment variable is not set");
  }

  return { bucket, accessKeyId, secretAccessKey, endpoint, region };
}

// Create S3 client for Railway Storage
export function createRailwayStorageClient(): S3Client {
  const { accessKeyId, secretAccessKey, endpoint, region } = getRailwayStorageConfig();

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false, // Railway uses virtual-hosted-style URLs
  });
}

// Get the bucket name
export function getBucketName(): string {
  const { bucket } = getRailwayStorageConfig();
  return bucket;
}

// Storage helper class for Railway buckets
export class RailwayStorage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = createRailwayStorageClient();
    this.bucket = getBucketName();
  }

  /**
   * Upload a file to Railway Storage
   */
  async upload(
    path: string,
    data: Buffer | Uint8Array,
    options?: {
      contentType?: string;
      upsert?: boolean;
    }
  ): Promise<{ path: string; error: Error | null }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: data,
        ContentType: options?.contentType || "application/octet-stream",
      });

      await this.client.send(command);
      return { path, error: null };
    } catch (error) {
      console.error("Railway Storage upload error:", error);
      return { path: "", error: error as Error };
    }
  }

  /**
   * Download a file from Railway Storage
   */
  async download(path: string): Promise<{ data: Buffer | null; error: Error | null }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        return { data: null, error: new Error("No body in response") };
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      return { data: buffer, error: null };
    } catch (error) {
      console.error("Railway Storage download error:", error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a signed URL for accessing a file
   * Railway buckets are private, so we need presigned URLs for access
   */
  async createSignedUrl(
    path: string,
    expiresIn: number = 3600 // Default 1 hour
  ): Promise<{ signedUrl: string | null; error: Error | null }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return { signedUrl, error: null };
    } catch (error) {
      console.error("Railway Storage signed URL error:", error);
      return { signedUrl: null, error: error as Error };
    }
  }

  /**
   * Delete a single file from Railway Storage
   */
  async remove(path: string): Promise<{ error: Error | null }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.client.send(command);
      return { error: null };
    } catch (error) {
      console.error("Railway Storage delete error:", error);
      return { error: error as Error };
    }
  }

  /**
   * Delete multiple files from Railway Storage
   */
  async removeMany(paths: string[]): Promise<{ error: Error | null }> {
    if (paths.length === 0) {
      return { error: null };
    }

    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: paths.map((path) => ({ Key: path })),
        },
      });

      await this.client.send(command);
      return { error: null };
    } catch (error) {
      console.error("Railway Storage bulk delete error:", error);
      return { error: error as Error };
    }
  }

  /**
   * Check if a file exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<{
    contentType?: string;
    contentLength?: number;
    lastModified?: Date;
    error: Error | null;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      const response = await this.client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        error: null,
      };
    } catch (error) {
      return { error: error as Error };
    }
  }
}

// Singleton instance
let storageInstance: RailwayStorage | null = null;

/**
 * Get Railway Storage instance
 * Use this for all storage operations
 */
export function getRailwayStorage(): RailwayStorage {
  if (!storageInstance) {
    storageInstance = new RailwayStorage();
  }
  return storageInstance;
}

// Export types for convenience
export type { S3Client };
