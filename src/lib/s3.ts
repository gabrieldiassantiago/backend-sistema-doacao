import { S3Client, type S3File } from "bun";
import pLimit from "p-limit";

/**
 * Tamanho a partir do qual usamos multipart upload (writer com partes paralelas).
 * Abaixo disso fazemos um único PUT, que é mais rápido para arquivos pequenos.
 */
const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5 MB

export class S3StorageService {
  private readonly bucketName: string;
  private readonly endpoint: URL;
  private readonly storage: S3Client;
  private readonly signedUrlExpiresIn: number;
  private readonly uploadLimit: ReturnType<typeof pLimit>;

  constructor() {
    const bucketName = process.env.S3_BUCKET ?? process.env.AWS_S3_BUCKET;
    const endpoint = process.env.S3_ENDPOINT ?? process.env.AWS_S3_ENDPOINT;
    const region = process.env.S3_REGION ?? process.env.AWS_REGION ?? "auto";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;
    const expiresIn = Number.parseInt(process.env.S3_SIGNED_URL_EXPIRES_IN ?? "3600", 10);
    const concurrency = Number.parseInt(process.env.S3_UPLOAD_CONCURRENCY ?? "10", 10);

    if (!bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Missing S3 storage configuration. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.",
      );
    }

    this.bucketName = bucketName;
    this.endpoint = new URL(endpoint);
    this.signedUrlExpiresIn =
      Number.isFinite(expiresIn) && expiresIn > 0 ? Math.min(expiresIn, 7_776_000) : 3600;
    this.uploadLimit = pLimit(Number.isFinite(concurrency) && concurrency > 0 ? concurrency : 10);

    this.storage = new S3Client({
      bucket: bucketName,
      endpoint: this.endpoint.toString(),
      region,
      accessKeyId,
      secretAccessKey,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // UPLOAD
  // ──────────────────────────────────────────────────────────────────────────

  async uploadImages(files: File[]): Promise<string[]> {
    return Promise.all(
      files.map((file) =>
        this.uploadLimit(() => this.uploadSingle(file, "causes")),
      ),
    );
  }

  async uploadSuggestionImages(files: File[]): Promise<string[]> {
    return Promise.all(
      files.map((file) =>
        this.uploadLimit(() => this.uploadSingle(file, "suggestions")),
      ),
    );
  }

  async uploadDocument(file: File): Promise<{ fileKey: string; fileName: string }> {
    const fileKey = await this.uploadSingle(file, "documents");
    return { fileKey, fileName: file.name };
  }

  async uploadUserAvatar(file: File): Promise<string> {
    return this.uploadSingle(file, "users");
  }

  /**
   * Gera uma URL presigned para upload direto do browser (PUT).
   * Permite que o browser envie o arquivo direto pro S3/R2 sem passar
   * pelo servidor — é o caminho mais rápido para uploads grandes.
   */
  presignUpload(
    filename: string,
    contentType: string,
    folder: "causes" | "documents" | "suggestions" | "users" = "causes",
    expiresIn = 300,
  ): { url: string; key: string } {
    const ext = this.getFileExtension(filename);
    const key = `${folder}/${crypto.randomUUID()}.${ext}`;
    const url = this.storage.presign(key, {
      method: "PUT",
      expiresIn,
      type: contentType,
    });
    return { url, key };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // READ
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Versão síncrona da geração de URL de leitura.
   * `Bun.S3Client.presign()` é síncrono e baratíssimo, então pode ser chamado
   * em loops e map() sem custo perceptível.
   */
  presignRead(fileKeyOrUrl: string, expiresIn = this.signedUrlExpiresIn): string {
    if (this.isHttpUrl(fileKeyOrUrl)) {
      const fileUrl = new URL(fileKeyOrUrl);
      if (!this.isManagedStorageUrl(fileUrl)) {
        return fileKeyOrUrl;
      }
    }

    const objectKey = this.extractObjectKey(fileKeyOrUrl);
    return this.storage.presign(objectKey, { method: "GET", expiresIn });
  }

  /** Mantida assíncrona para compatibilidade com chamadas existentes. */
  async getReadUrl(fileKeyOrUrl: string): Promise<string> {
    return this.presignRead(fileKeyOrUrl);
  }

  async getReadUrls(fileKeysOrUrls: string[]): Promise<string[]> {
    return fileKeysOrUrls.map((k) => this.presignRead(k));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────────────────

  async deleteFile(fileKeyOrUrl: string): Promise<void> {
    if (this.isHttpUrl(fileKeyOrUrl)) {
      const fileUrl = new URL(fileKeyOrUrl);
      if (!this.isManagedStorageUrl(fileUrl)) return;
    }

    const objectKey = this.extractObjectKey(fileKeyOrUrl);
    await this.storage.delete(objectKey);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNALS
  // ──────────────────────────────────────────────────────────────────────────

  private async uploadSingle(
    file: File,
    folder: "causes" | "documents" | "suggestions" | "users",
  ): Promise<string> {
    const ext = this.getFileExtension(file.name);
    const objectKey = `${folder}/${crypto.randomUUID()}.${ext}`;
    const contentType = file.type || "application/octet-stream";
    const s3file: S3File = this.storage.file(objectKey);

    if (file.size <= MULTIPART_THRESHOLD) {
      // Caminho rápido para arquivos pequenos: um único PUT.
      // O Bun aceita File/Blob direto, sem precisar materializar o ArrayBuffer.
      await s3file.write(file, { type: contentType });
      return objectKey;
    }

    // Multipart com partes paralelas para arquivos grandes.
    // Streaming evita carregar o arquivo inteiro na RAM.
    const writer = s3file.writer({
      type: contentType,
      partSize: 5 * 1024 * 1024,
      queueSize: 4,
      retry: 3,
    });

    const reader = file.stream().getReader();
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        writer.write(value);
      }
      await writer.end();
    } catch (err) {
      try {
        await writer.end();
      } catch {
        /* ignore */
      }
      throw err;
    }

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