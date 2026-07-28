import { Injectable } from "@nestjs/common";
import { loadEnv, type Env } from "@hatef/config";

@Injectable()
export class AppConfigService {
  public readonly env: Env;

  constructor() {
    this.env = loadEnv(process.env);
  }
}
