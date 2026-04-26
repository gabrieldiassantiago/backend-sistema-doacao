import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfiguredRetryStrategy } from "@smithy/util-retry";
import pLimit from "p-limit";

export class S3StorageService {
  private readonly bucketName: string;
  private readonly endpoint: URL;
  private readonly storage: S3Client;
  private readonly signedUrlExpiresIn: number;
  private readonly uploadLimit = pLimit(5);


  constructor() {
    const bucketName = process.env.S3_BUCKET ?? process.env.AWS_S3_BUCKET;
    const endpoint = process.env.S3_ENDPOINT ?? process.env.AWS_S3_ENDPOINT;
    const region = process.env.S3_REGION ?? process.env.AWS_REGION ?? "auto";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
    const expiresIn = Number.parseInt(process.env.S3_SIGNED_URL_EXPIRES_IN ?? "3600", 10);

    if (!bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Missing S3 storage configuration. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY."
      );
    }

    this.bucketName = bucketName;
    this.endpoint = new URL(endpoint);
    this.signedUrlExpiresIn = Number.isFinite(expiresIn) && expiresIn > 0
      ? Math.min(expiresIn, 7_776_000)
      : 3600;
  this.storage = new S3Client({
  endpoint: this.endpoint.toString(),
  region,
  forcePathStyle: false,
  credentials: { accessKeyId, secretAccessKey },
  maxAttempts: 5,
  retryStrategy: new ConfiguredRetryStrategy(
    5,
    (attempt) => 200 + attempt * 500 
  ),
});
  }


async uploadImages(files: File[]): Promise<string[]> {
  return Promise.all(
    files.map((file) => this.uploadLimit(() => this.uploadSingleImage(file)))
  );
}

  async uploadDocument(file: File): Promise<{ fileKey: string, fileName: string }> {
    const fileExtension = this.getFileExtension(file.name);
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const objectKey = `documents/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await this.storage.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    return { fileKey: objectKey, fileName: file.name };
  }

  async getReadUrl(fileKeyOrUrl: string): Promise<string> {
    if (this.isHttpUrl(fileKeyOrUrl)) {
      const fileUrl = new URL(fileKeyOrUrl);

      if (!this.isManagedStorageUrl(fileUrl)) {
        return fileKeyOrUrl;
      }
    }

    const objectKey = this.extractObjectKey(fileKeyOrUrl);

    return getSignedUrl(
      this.storage as any,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      }) as any,
      { expiresIn: this.signedUrlExpiresIn }
    );
  }

  async getReadUrls(fileKeysOrUrls: string[]): Promise<string[]> {
    return Promise.all(fileKeysOrUrls.map((fileKeyOrUrl) => this.getReadUrl(fileKeyOrUrl)));
  }

  async deleteFile(fileKeyOrUrl: string): Promise<void> {
    if (this.isHttpUrl(fileKeyOrUrl)) {
      const fileUrl = new URL(fileKeyOrUrl);

      if (!this.isManagedStorageUrl(fileUrl)) {
        return;
      }
    }

    const objectKey = this.extractObjectKey(fileKeyOrUrl);

    await this.storage.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      })
    );
  }

  private async uploadSingleImage(file: File): Promise<string> {
    const fileExtension = this.getFileExtension(file.name);
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const objectKey = `causes/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await this.storage.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    return objectKey;
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split(".");
    if (parts.length < 2 || parts[parts.length - 1] === "") {
      throw new Error(`Cannot determine file extension for: "${filename}"`);
    }
    return parts[parts.length - 1];
  }

  private isHttpUrl(fileKeyOrUrl: string): boolean {
    return fileKeyOrUrl.startsWith("http://") || fileKeyOrUrl.startsWith("https://");
  }

  private isManagedStorageUrl(fileUrl: URL): boolean {
    const endpointHost = this.endpoint.host.toLowerCase();
    const bucketHost = `${this.bucketName.toLowerCase()}.${endpointHost}`;
    const fileHost = fileUrl.host.toLowerCase();

    return fileHost === endpointHost || fileHost === bucketHost;
  }

  private extractObjectKey(fileKeyOrUrl: string): string {
    if (this.isHttpUrl(fileKeyOrUrl)) {
      const fileUrl = new URL(fileKeyOrUrl);
      const pathWithoutSlash = decodeURIComponent(fileUrl.pathname.replace(/^\/+/, ""));

      if (!pathWithoutSlash) {
        throw new Error("Invalid S3 object URL: missing key path");
      }

      if (pathWithoutSlash.startsWith(`${this.bucketName}/`)) {
        return pathWithoutSlash.slice(this.bucketName.length + 1);
      }

      return pathWithoutSlash;
    }

    return fileKeyOrUrl;
  }
}