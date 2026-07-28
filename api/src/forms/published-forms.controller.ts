import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { FormsService } from "./forms.service";

/** Any authenticated user (internal or partner) may read a published form's structure — it's what gets rendered to fill out, not sensitive. */
@Controller("forms-published")
@UseGuards(SessionAuthGuard)
export class PublishedFormsController {
  constructor(private readonly forms: FormsService) {}

  @Get(":key")
  async getPublished(@Param("key") key: string) {
    return this.forms.getPublishedDefinition(key);
  }
}
