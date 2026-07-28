import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppConfigService } from "../config/app-config.service";

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;

  constructor(private readonly config: AppConfigService) {
    const env = this.config.env;
    this.client = new S3Client({
      endpoint: env.STORAGE_ENDPOINT,
      region: env.STORAGE_REGION,
      forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    // Local/dev convenience — a real S3 bucket would normally be
    // pre-provisioned by infra, but MinIO doesn't auto-create one.
    const bucket = this.config.env.STORAGE_BUCKET;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
        this.logger.log(`Created storage bucket "${bucket}"`);
      } catch (error) {
        this.logger.warn(`Could not ensure storage bucket "${bucket}" exists: ${(error as Error).message}`);
      }
    }
  }

  async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.env.STORAGE_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.config.env.STORAGE_BUCKET, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: this.config.env.STORAGE_SIGNED_URL_TTL_SECONDS });
  }
}
