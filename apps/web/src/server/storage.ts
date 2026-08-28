import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET_NAME ?? "voicex-audio-outputs";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_CUSTOM_DOMAIN = process.env.AWS_S3_CUSTOM_DOMAIN; // e.g., Cloudflare CDN / CloudFront

export function createS3Client(): S3Client | null {
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    // eslint-disable-next-line no-console
    console.warn(
      "[Storage] AWS S3 credentials missing. Operating in fallback mock storage mode for local development.",
    );
    return null;
  }

  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
}

const s3Client = createS3Client();

export async function uploadAudioBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string = "audio/mpeg",
): Promise<string> {
  const key = `generations/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${filename}`;

  if (!s3Client) {
    const base64Data = buffer.toString("base64");
    return `data:${contentType};base64,${base64Data}`;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    });

    await s3Client.send(command);

    if (S3_CUSTOM_DOMAIN) {
      const cleanDomain = S3_CUSTOM_DOMAIN.replace(/\/$/, "");
      return `${cleanDomain}/${key}`;
    }

    return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown S3 upload error";
    // eslint-disable-next-line no-console
    console.error("[Storage] S3 upload failed:", message);
    throw new Error(`Failed to upload audio file to storage: ${message}`);
  }
}
