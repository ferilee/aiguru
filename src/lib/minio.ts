import { Client } from "minio";

type UploadInput = {
  bucket: string;
  objectName: string;
  body: Buffer;
  contentType: string;
};

function normalizeEndpoint(value: string): string {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function getMinioPublicUrl(bucket: string, objectName: string): string {
  const endpoint = process.env.MINIO_PUBLIC_ENDPOINT ?? "http://localhost:9000";
  return `${endpoint.replace(/\/$/, "")}/${bucket}/${objectName}`;
}

function createMinioClient(): Client {
  const endpoint = normalizeEndpoint(process.env.MINIO_ENDPOINT ?? "localhost");
  const useSSL = (process.env.MINIO_USE_SSL ?? "false") === "true";
  const port = Number(process.env.MINIO_PORT ?? (useSSL ? 443 : 9000));
  const accessKey = process.env.MINIO_ACCESS_KEY ?? "";
  const secretKey = process.env.MINIO_SECRET_KEY ?? "";

  return new Client({
    endPoint: endpoint,
    port,
    useSSL,
    accessKey,
    secretKey
  });
}

export async function uploadToMinio(input: UploadInput): Promise<string> {
  const client = createMinioClient();
  const bucketExists = await client.bucketExists(input.bucket).catch(() => false);
  if (!bucketExists) {
    await client.makeBucket(input.bucket, "us-east-1");
  }

  await client.putObject(input.bucket, input.objectName, input.body, undefined, {
    "Content-Type": input.contentType
  });

  return getMinioPublicUrl(input.bucket, input.objectName);
}
