import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  createRateCardItemSchema,
  respondToObligationProposalSchema,
  reviewRateCardItemSchema,
  submitDeliverableSchema,
  type CreateRateCardItem,
  type RespondToObligationProposal,
  type ReviewRateCardItem,
  type SubmitDeliverable,
} from "@hatef/contracts";
import { PERMISSIONS } from "@hatef/auth";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SessionAuthGuard } from "../session/session-auth.guard";
import { PermissionGuard } from "../rbac/permission.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CurrentActor } from "../session/current-actor.decorator";
import type { RequestActor } from "../session/actor.types";
import { ObligationsService } from "./obligations.service";
import { RateCardsService } from "./rate-cards.service";

const CHANNEL_SCOPE = { resourceType: "channel", resourceIdParam: "channelId" } as const;

/** Partner-facing — same channel-nested ABAC shape as SupportRequestsController. */
@Controller("channels/:channelId/obligations")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ObligationsPartnerController {
  constructor(private readonly obligations: ObligationsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.OBLIGATION_READ, CHANNEL_SCOPE)
  async list(@Param("channelId") channelId: string) {
    return this.obligations.list({ channelId });
  }

  @Get(":obligationId")
  @RequirePermission(PERMISSIONS.OBLIGATION_READ, CHANNEL_SCOPE)
  async getOne(@Param("obligationId") obligationId: string) {
    return this.obligations.getDetail(obligationId);
  }

  @Post(":obligationId/respond")
  @RequirePermission(PERMISSIONS.OBLIGATION_NEGOTIATE, CHANNEL_SCOPE)
  async respond(
    @Param("obligationId") obligationId: string,
    @Body(new ZodValidationPipe(respondToObligationProposalSchema)) body: RespondToObligationProposal,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.obligations.respondToProposal(obligationId, body, actor);
  }

  @Post(":obligationId/deliverables")
  @RequirePermission(PERMISSIONS.DELIVERABLE_SUBMIT, CHANNEL_SCOPE)
  async submitDeliverable(
    @Param("obligationId") obligationId: string,
    @Body(new ZodValidationPipe(submitDeliverableSchema)) body: SubmitDeliverable,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.obligations.submitDeliverable(obligationId, body, actor);
  }

  @Get(":obligationId/deliverables")
  @RequirePermission(PERMISSIONS.OBLIGATION_READ, CHANNEL_SCOPE)
  async listDeliverables(@Param("obligationId") obligationId: string) {
    return this.obligations.listDeliverables(obligationId);
  }
}

@Controller("channels/:channelId/rate-card")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class RateCardPartnerController {
  constructor(private readonly rateCards: RateCardsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.RATE_CARD_READ, CHANNEL_SCOPE)
  async getCurrent(@Param("channelId") channelId: string) {
    return this.rateCards.getCurrent(channelId);
  }

  @Post("items")
  @RequirePermission(PERMISSIONS.RATE_CARD_MANAGE_OWN, CHANNEL_SCOPE)
  async addItem(
    @Param("channelId") channelId: string,
    @Body(new ZodValidationPipe(createRateCardItemSchema)) body: CreateRateCardItem,
    @CurrentActor() actor: RequestActor,
  ) {
    return this.rateCards.addItem(channelId, body, actor);
  }

  @Post("submit")
  @RequirePermission(PERMISSIONS.RATE_CARD_MANAGE_OWN, CHANNEL_SCOPE)
  async submit(@Param("channelId") channelId: string, @CurrentActor() actor: RequestActor) {
    return this.rateCards.submit(channelId, actor);
  }
}

@Controller("rate-cards")
@UseGuards(SessionAuthGuard, PermissionGuard)
export class RateCardOpsController {
  constructor(private readonly rateCards: RateCardsService) {}

  @Get("submitted")
  @RequirePermission(PERMISSIONS.RATE_CARD_REVIEW)
  async listSubmitted() {
    return this.rateCards.listSubmitted();
  }

  @Post("items/:itemId/review")
  @RequirePermission(PERMISSIONS.RATE_CARD_REVIEW)
  async reviewItem(
    @Param("itemId") itemId: string,
    @Body(new ZodValidationPipe(reviewRateCardItemSchema)) body: ReviewRateCardItem,
    @CurrentActor() actor: RequestActor,
  ) {
    await this.rateCards.reviewItem(itemId, body, actor);
    return { ok: true };
  }
}
