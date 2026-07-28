"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const app_config_service_1 = require("../config/app-config.service");
let StorageService = StorageService_1 = class StorageService {
    config;
    logger = new common_1.Logger(StorageService_1.name);
    client;
    constructor(config) {
        this.config = config;
        const env = this.config.env;
        this.client = new client_s3_1.S3Client({
            endpoint: env.STORAGE_ENDPOINT,
            region: env.STORAGE_REGION,
            forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
            credentials: {
                accessKeyId: env.STORAGE_ACCESS_KEY_ID,
                secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
            },
        });
    }
    async onModuleInit() {
        // Local/dev convenience — a real S3 bucket would normally be
        // pre-provisioned by infra, but MinIO doesn't auto-create one.
        const bucket = this.config.env.STORAGE_BUCKET;
        try {
            await this.client.send(new client_s3_1.HeadBucketCommand({ Bucket: bucket }));
        }
        catch {
            try {
                await this.client.send(new client_s3_1.CreateBucketCommand({ Bucket: bucket }));
                this.logger.log(`Created storage bucket "${bucket}"`);
            }
            catch (error) {
                this.logger.warn(`Could not ensure storage bucket "${bucket}" exists: ${error.message}`);
            }
        }
    }
    async putObject(key, body, contentType) {
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.config.env.STORAGE_BUCKET,
            Key: key,
            Body: body,
            ContentType: contentType,
        }));
    }
    async getSignedDownloadUrl(key) {
        const command = new client_s3_1.GetObjectCommand({ Bucket: this.config.env.STORAGE_BUCKET, Key: key });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn: this.config.env.STORAGE_SIGNED_URL_TTL_SECONDS });
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_config_service_1.AppConfigService])
], StorageService);
