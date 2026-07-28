import { type CreateServiceCatalogItem, type CreateServiceCatalogVersion } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { ServiceCatalogService } from "./service-catalog.service";
export declare class ServiceCatalogController {
    private readonly catalog;
    constructor(catalog: ServiceCatalogService);
    create(body: CreateServiceCatalogItem, actor: RequestActor): Promise<{
        id: string;
        key: string;
        name: string;
        serviceType: "PUBLICATION" | "REPOST" | "CONTENT_PRODUCTION" | "EVENT_COVERAGE" | "CAMPAIGN_PARTICIPATION" | "FIELD_OPERATION" | "NETWORKING" | "RESEARCH" | "SURVEY" | "OTHER";
        description: string | null;
        activeVersion: {
            id: string;
            versionNumber: number;
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            unit: string;
            valuationMethod: string;
            defaultAcceptanceCriteria: string | null;
            defaultEvidence: string | null;
            priceGuidanceRial: string | null;
            publishedAt: string | null;
        } | null;
    }>;
    list(): Promise<{
        id: string;
        key: string;
        name: string;
        serviceType: "PUBLICATION" | "REPOST" | "CONTENT_PRODUCTION" | "EVENT_COVERAGE" | "CAMPAIGN_PARTICIPATION" | "FIELD_OPERATION" | "NETWORKING" | "RESEARCH" | "SURVEY" | "OTHER";
        description: string | null;
        activeVersion: {
            id: string;
            versionNumber: number;
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            unit: string;
            valuationMethod: string;
            defaultAcceptanceCriteria: string | null;
            defaultEvidence: string | null;
            priceGuidanceRial: string | null;
            publishedAt: string | null;
        } | null;
    }[]>;
    getOne(itemId: string): Promise<{
        id: string;
        key: string;
        name: string;
        serviceType: "PUBLICATION" | "REPOST" | "CONTENT_PRODUCTION" | "EVENT_COVERAGE" | "CAMPAIGN_PARTICIPATION" | "FIELD_OPERATION" | "NETWORKING" | "RESEARCH" | "SURVEY" | "OTHER";
        description: string | null;
        activeVersion: {
            id: string;
            versionNumber: number;
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            unit: string;
            valuationMethod: string;
            defaultAcceptanceCriteria: string | null;
            defaultEvidence: string | null;
            priceGuidanceRial: string | null;
            publishedAt: string | null;
        } | null;
    }>;
    addVersion(itemId: string, body: CreateServiceCatalogVersion): Promise<{
        id: string;
        key: string;
        name: string;
        serviceType: "PUBLICATION" | "REPOST" | "CONTENT_PRODUCTION" | "EVENT_COVERAGE" | "CAMPAIGN_PARTICIPATION" | "FIELD_OPERATION" | "NETWORKING" | "RESEARCH" | "SURVEY" | "OTHER";
        description: string | null;
        activeVersion: {
            id: string;
            versionNumber: number;
            status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
            unit: string;
            valuationMethod: string;
            defaultAcceptanceCriteria: string | null;
            defaultEvidence: string | null;
            priceGuidanceRial: string | null;
            publishedAt: string | null;
        } | null;
    }>;
}
//# sourceMappingURL=service-catalog.controller.d.ts.map