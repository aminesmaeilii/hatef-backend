import { z } from "zod";
export declare const serviceTypeSchema: z.ZodEnum<{
    PUBLICATION: "PUBLICATION";
    REPOST: "REPOST";
    CONTENT_PRODUCTION: "CONTENT_PRODUCTION";
    EVENT_COVERAGE: "EVENT_COVERAGE";
    CAMPAIGN_PARTICIPATION: "CAMPAIGN_PARTICIPATION";
    FIELD_OPERATION: "FIELD_OPERATION";
    NETWORKING: "NETWORKING";
    RESEARCH: "RESEARCH";
    SURVEY: "SURVEY";
    OTHER: "OTHER";
}>;
export type ServiceTypeKey = z.infer<typeof serviceTypeSchema>;
export declare const serviceCatalogVersionStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    PUBLISHED: "PUBLISHED";
    ARCHIVED: "ARCHIVED";
}>;
export declare const serviceCatalogVersionSchema: z.ZodObject<{
    id: z.ZodString;
    versionNumber: z.ZodNumber;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        PUBLISHED: "PUBLISHED";
        ARCHIVED: "ARCHIVED";
    }>;
    unit: z.ZodString;
    valuationMethod: z.ZodString;
    defaultAcceptanceCriteria: z.ZodNullable<z.ZodString>;
    defaultEvidence: z.ZodNullable<z.ZodString>;
    priceGuidanceRial: z.ZodNullable<z.ZodString>;
    publishedAt: z.ZodNullable<z.ZodISODateTime>;
}, z.core.$strip>;
export type ServiceCatalogVersion = z.infer<typeof serviceCatalogVersionSchema>;
export declare const serviceCatalogItemSchema: z.ZodObject<{
    id: z.ZodString;
    key: z.ZodString;
    name: z.ZodString;
    serviceType: z.ZodEnum<{
        PUBLICATION: "PUBLICATION";
        REPOST: "REPOST";
        CONTENT_PRODUCTION: "CONTENT_PRODUCTION";
        EVENT_COVERAGE: "EVENT_COVERAGE";
        CAMPAIGN_PARTICIPATION: "CAMPAIGN_PARTICIPATION";
        FIELD_OPERATION: "FIELD_OPERATION";
        NETWORKING: "NETWORKING";
        RESEARCH: "RESEARCH";
        SURVEY: "SURVEY";
        OTHER: "OTHER";
    }>;
    description: z.ZodNullable<z.ZodString>;
    activeVersion: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        versionNumber: z.ZodNumber;
        status: z.ZodEnum<{
            DRAFT: "DRAFT";
            PUBLISHED: "PUBLISHED";
            ARCHIVED: "ARCHIVED";
        }>;
        unit: z.ZodString;
        valuationMethod: z.ZodString;
        defaultAcceptanceCriteria: z.ZodNullable<z.ZodString>;
        defaultEvidence: z.ZodNullable<z.ZodString>;
        priceGuidanceRial: z.ZodNullable<z.ZodString>;
        publishedAt: z.ZodNullable<z.ZodISODateTime>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ServiceCatalogItem = z.infer<typeof serviceCatalogItemSchema>;
export declare const createServiceCatalogItemSchema: z.ZodObject<{
    key: z.ZodString;
    name: z.ZodString;
    serviceType: z.ZodEnum<{
        PUBLICATION: "PUBLICATION";
        REPOST: "REPOST";
        CONTENT_PRODUCTION: "CONTENT_PRODUCTION";
        EVENT_COVERAGE: "EVENT_COVERAGE";
        CAMPAIGN_PARTICIPATION: "CAMPAIGN_PARTICIPATION";
        FIELD_OPERATION: "FIELD_OPERATION";
        NETWORKING: "NETWORKING";
        RESEARCH: "RESEARCH";
        SURVEY: "SURVEY";
        OTHER: "OTHER";
    }>;
    description: z.ZodOptional<z.ZodString>;
    unit: z.ZodString;
    valuationMethod: z.ZodString;
    defaultAcceptanceCriteria: z.ZodOptional<z.ZodString>;
    defaultEvidence: z.ZodOptional<z.ZodString>;
    priceGuidanceRial: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateServiceCatalogItem = z.infer<typeof createServiceCatalogItemSchema>;
export declare const createServiceCatalogVersionSchema: z.ZodObject<{
    unit: z.ZodString;
    valuationMethod: z.ZodString;
    defaultAcceptanceCriteria: z.ZodOptional<z.ZodString>;
    defaultEvidence: z.ZodOptional<z.ZodString>;
    priceGuidanceRial: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateServiceCatalogVersion = z.infer<typeof createServiceCatalogVersionSchema>;
export declare const obligationStatusSchema: z.ZodEnum<{
    PROPOSED: "PROPOSED";
    NEGOTIATING: "NEGOTIATING";
    ACCEPTED: "ACCEPTED";
    SCHEDULED: "SCHEDULED";
    IN_PROGRESS: "IN_PROGRESS";
    SUBMITTED: "SUBMITTED";
    NEEDS_REVISION: "NEEDS_REVISION";
    PARTIALLY_APPROVED: "PARTIALLY_APPROVED";
    APPROVED: "APPROVED";
    DISPUTED: "DISPUTED";
    SETTLED: "SETTLED";
    CANCELLED: "CANCELLED";
}>;
export type ObligationStatusKey = z.infer<typeof obligationStatusSchema>;
export declare const createObligationSchema: z.ZodObject<{
    channelId: z.ZodString;
    supportRequestId: z.ZodOptional<z.ZodString>;
    serviceCatalogItemId: z.ZodString;
    brief: z.ZodString;
    output: z.ZodOptional<z.ZodString>;
    acceptanceCriteria: z.ZodOptional<z.ZodString>;
    valueRial: z.ZodString;
    startAt: z.ZodOptional<z.ZodISODateTime>;
    deadlineAt: z.ZodOptional<z.ZodISODateTime>;
    responsibleChannelMemberId: z.ZodOptional<z.ZodString>;
    responsibleHatefEmployeeId: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateObligation = z.infer<typeof createObligationSchema>;
export declare const obligationProposalStatusSchema: z.ZodEnum<{
    PROPOSED: "PROPOSED";
    ACCEPTED: "ACCEPTED";
    COUNTERED: "COUNTERED";
    REJECTED: "REJECTED";
}>;
export declare const obligationProposalSchema: z.ZodObject<{
    id: z.ZodString;
    versionNumber: z.ZodNumber;
    proposedById: z.ZodString;
    status: z.ZodEnum<{
        PROPOSED: "PROPOSED";
        ACCEPTED: "ACCEPTED";
        COUNTERED: "COUNTERED";
        REJECTED: "REJECTED";
    }>;
    valueRial: z.ZodString;
    brief: z.ZodNullable<z.ZodString>;
    deadlineAt: z.ZodNullable<z.ZodISODateTime>;
    note: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type ObligationProposal = z.infer<typeof obligationProposalSchema>;
export declare const createObligationProposalSchema: z.ZodObject<{
    valueRial: z.ZodString;
    brief: z.ZodOptional<z.ZodString>;
    deadlineAt: z.ZodOptional<z.ZodISODateTime>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateObligationProposal = z.infer<typeof createObligationProposalSchema>;
export declare const respondToObligationProposalSchema: z.ZodObject<{
    action: z.ZodEnum<{
        ACCEPT: "ACCEPT";
        REJECT: "REJECT";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RespondToObligationProposal = z.infer<typeof respondToObligationProposalSchema>;
export declare const obligationStatusEventSchema: z.ZodObject<{
    id: z.ZodString;
    fromStatus: z.ZodNullable<z.ZodEnum<{
        PROPOSED: "PROPOSED";
        NEGOTIATING: "NEGOTIATING";
        ACCEPTED: "ACCEPTED";
        SCHEDULED: "SCHEDULED";
        IN_PROGRESS: "IN_PROGRESS";
        SUBMITTED: "SUBMITTED";
        NEEDS_REVISION: "NEEDS_REVISION";
        PARTIALLY_APPROVED: "PARTIALLY_APPROVED";
        APPROVED: "APPROVED";
        DISPUTED: "DISPUTED";
        SETTLED: "SETTLED";
        CANCELLED: "CANCELLED";
    }>>;
    toStatus: z.ZodEnum<{
        PROPOSED: "PROPOSED";
        NEGOTIATING: "NEGOTIATING";
        ACCEPTED: "ACCEPTED";
        SCHEDULED: "SCHEDULED";
        IN_PROGRESS: "IN_PROGRESS";
        SUBMITTED: "SUBMITTED";
        NEEDS_REVISION: "NEEDS_REVISION";
        PARTIALLY_APPROVED: "PARTIALLY_APPROVED";
        APPROVED: "APPROVED";
        DISPUTED: "DISPUTED";
        SETTLED: "SETTLED";
        CANCELLED: "CANCELLED";
    }>;
    note: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type ObligationStatusEvent = z.infer<typeof obligationStatusEventSchema>;
export declare const transitionObligationSchema: z.ZodObject<{
    toStatus: z.ZodEnum<{
        PROPOSED: "PROPOSED";
        NEGOTIATING: "NEGOTIATING";
        ACCEPTED: "ACCEPTED";
        SCHEDULED: "SCHEDULED";
        IN_PROGRESS: "IN_PROGRESS";
        SUBMITTED: "SUBMITTED";
        NEEDS_REVISION: "NEEDS_REVISION";
        PARTIALLY_APPROVED: "PARTIALLY_APPROVED";
        APPROVED: "APPROVED";
        DISPUTED: "DISPUTED";
        SETTLED: "SETTLED";
        CANCELLED: "CANCELLED";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TransitionObligation = z.infer<typeof transitionObligationSchema>;
export declare const obligationSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodString;
    channelTitle: z.ZodString;
    supportRequestId: z.ZodNullable<z.ZodString>;
    serviceCatalogItemId: z.ZodString;
    serviceCatalogItemName: z.ZodString;
    status: z.ZodEnum<{
        PROPOSED: "PROPOSED";
        NEGOTIATING: "NEGOTIATING";
        ACCEPTED: "ACCEPTED";
        SCHEDULED: "SCHEDULED";
        IN_PROGRESS: "IN_PROGRESS";
        SUBMITTED: "SUBMITTED";
        NEEDS_REVISION: "NEEDS_REVISION";
        PARTIALLY_APPROVED: "PARTIALLY_APPROVED";
        APPROVED: "APPROVED";
        DISPUTED: "DISPUTED";
        SETTLED: "SETTLED";
        CANCELLED: "CANCELLED";
    }>;
    brief: z.ZodString;
    output: z.ZodNullable<z.ZodString>;
    acceptanceCriteria: z.ZodNullable<z.ZodString>;
    valueRial: z.ZodString;
    settledValueRial: z.ZodString;
    startAt: z.ZodNullable<z.ZodISODateTime>;
    deadlineAt: z.ZodNullable<z.ZodISODateTime>;
    responsibleChannelMemberId: z.ZodNullable<z.ZodString>;
    responsibleHatefEmployeeId: z.ZodNullable<z.ZodString>;
    terms: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
}, z.core.$strip>;
export type Obligation = z.infer<typeof obligationSchema>;
export declare const obligationDetailSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodString;
    channelTitle: z.ZodString;
    supportRequestId: z.ZodNullable<z.ZodString>;
    serviceCatalogItemId: z.ZodString;
    serviceCatalogItemName: z.ZodString;
    status: z.ZodEnum<{
        PROPOSED: "PROPOSED";
        NEGOTIATING: "NEGOTIATING";
        ACCEPTED: "ACCEPTED";
        SCHEDULED: "SCHEDULED";
        IN_PROGRESS: "IN_PROGRESS";
        SUBMITTED: "SUBMITTED";
        NEEDS_REVISION: "NEEDS_REVISION";
        PARTIALLY_APPROVED: "PARTIALLY_APPROVED";
        APPROVED: "APPROVED";
        DISPUTED: "DISPUTED";
        SETTLED: "SETTLED";
        CANCELLED: "CANCELLED";
    }>;
    brief: z.ZodString;
    output: z.ZodNullable<z.ZodString>;
    acceptanceCriteria: z.ZodNullable<z.ZodString>;
    valueRial: z.ZodString;
    settledValueRial: z.ZodString;
    startAt: z.ZodNullable<z.ZodISODateTime>;
    deadlineAt: z.ZodNullable<z.ZodISODateTime>;
    responsibleChannelMemberId: z.ZodNullable<z.ZodString>;
    responsibleHatefEmployeeId: z.ZodNullable<z.ZodString>;
    terms: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
    updatedAt: z.ZodISODateTime;
    proposals: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        versionNumber: z.ZodNumber;
        proposedById: z.ZodString;
        status: z.ZodEnum<{
            PROPOSED: "PROPOSED";
            ACCEPTED: "ACCEPTED";
            COUNTERED: "COUNTERED";
            REJECTED: "REJECTED";
        }>;
        valueRial: z.ZodString;
        brief: z.ZodNullable<z.ZodString>;
        deadlineAt: z.ZodNullable<z.ZodISODateTime>;
        note: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
    statusEvents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        fromStatus: z.ZodNullable<z.ZodEnum<{
            PROPOSED: "PROPOSED";
            NEGOTIATING: "NEGOTIATING";
            ACCEPTED: "ACCEPTED";
            SCHEDULED: "SCHEDULED";
            IN_PROGRESS: "IN_PROGRESS";
            SUBMITTED: "SUBMITTED";
            NEEDS_REVISION: "NEEDS_REVISION";
            PARTIALLY_APPROVED: "PARTIALLY_APPROVED";
            APPROVED: "APPROVED";
            DISPUTED: "DISPUTED";
            SETTLED: "SETTLED";
            CANCELLED: "CANCELLED";
        }>>;
        toStatus: z.ZodEnum<{
            PROPOSED: "PROPOSED";
            NEGOTIATING: "NEGOTIATING";
            ACCEPTED: "ACCEPTED";
            SCHEDULED: "SCHEDULED";
            IN_PROGRESS: "IN_PROGRESS";
            SUBMITTED: "SUBMITTED";
            NEEDS_REVISION: "NEEDS_REVISION";
            PARTIALLY_APPROVED: "PARTIALLY_APPROVED";
            APPROVED: "APPROVED";
            DISPUTED: "DISPUTED";
            SETTLED: "SETTLED";
            CANCELLED: "CANCELLED";
        }>;
        note: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ObligationDetail = z.infer<typeof obligationDetailSchema>;
export declare const deliverableStatusSchema: z.ZodEnum<{
    ACCEPTED: "ACCEPTED";
    SUBMITTED: "SUBMITTED";
    NEEDS_REVISION: "NEEDS_REVISION";
    DISPUTED: "DISPUTED";
    REJECTED: "REJECTED";
    PARTIALLY_ACCEPTED: "PARTIALLY_ACCEPTED";
}>;
export type DeliverableStatusKey = z.infer<typeof deliverableStatusSchema>;
export declare const submitDeliverableSchema: z.ZodObject<{
    description: z.ZodOptional<z.ZodString>;
    links: z.ZodDefault<z.ZodArray<z.ZodString>>;
    reachOrViews: z.ZodOptional<z.ZodNumber>;
    deliveredAt: z.ZodOptional<z.ZodISODateTime>;
    fileIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type SubmitDeliverable = z.infer<typeof submitDeliverableSchema>;
export declare const reviewDecisionSchema: z.ZodEnum<{
    REJECT: "REJECT";
    ACCEPT_FULL: "ACCEPT_FULL";
    ACCEPT_PARTIAL: "ACCEPT_PARTIAL";
    REQUEST_REVISION: "REQUEST_REVISION";
    DISPUTE: "DISPUTE";
}>;
export type ReviewDecisionKey = z.infer<typeof reviewDecisionSchema>;
export declare const reviewDeliverableSchema: z.ZodObject<{
    decision: z.ZodEnum<{
        REJECT: "REJECT";
        ACCEPT_FULL: "ACCEPT_FULL";
        ACCEPT_PARTIAL: "ACCEPT_PARTIAL";
        REQUEST_REVISION: "REQUEST_REVISION";
        DISPUTE: "DISPUTE";
    }>;
    acceptedValueRial: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ReviewDeliverable = z.infer<typeof reviewDeliverableSchema>;
export declare const deliverableReviewSchema: z.ZodObject<{
    id: z.ZodString;
    reviewerId: z.ZodString;
    decision: z.ZodEnum<{
        REJECT: "REJECT";
        ACCEPT_FULL: "ACCEPT_FULL";
        ACCEPT_PARTIAL: "ACCEPT_PARTIAL";
        REQUEST_REVISION: "REQUEST_REVISION";
        DISPUTE: "DISPUTE";
    }>;
    acceptedValueRial: z.ZodNullable<z.ZodString>;
    remainingValueRial: z.ZodNullable<z.ZodString>;
    note: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type DeliverableReview = z.infer<typeof deliverableReviewSchema>;
export declare const deliverableSchema: z.ZodObject<{
    id: z.ZodString;
    obligationId: z.ZodString;
    submittedById: z.ZodString;
    status: z.ZodEnum<{
        ACCEPTED: "ACCEPTED";
        SUBMITTED: "SUBMITTED";
        NEEDS_REVISION: "NEEDS_REVISION";
        DISPUTED: "DISPUTED";
        REJECTED: "REJECTED";
        PARTIALLY_ACCEPTED: "PARTIALLY_ACCEPTED";
    }>;
    description: z.ZodNullable<z.ZodString>;
    links: z.ZodArray<z.ZodString>;
    reachOrViews: z.ZodNullable<z.ZodNumber>;
    deliveredAt: z.ZodNullable<z.ZodISODateTime>;
    fileIds: z.ZodArray<z.ZodString>;
    reviews: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        reviewerId: z.ZodString;
        decision: z.ZodEnum<{
            REJECT: "REJECT";
            ACCEPT_FULL: "ACCEPT_FULL";
            ACCEPT_PARTIAL: "ACCEPT_PARTIAL";
            REQUEST_REVISION: "REQUEST_REVISION";
            DISPUTE: "DISPUTE";
        }>;
        acceptedValueRial: z.ZodNullable<z.ZodString>;
        remainingValueRial: z.ZodNullable<z.ZodString>;
        note: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodISODateTime;
    }, z.core.$strip>>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type Deliverable = z.infer<typeof deliverableSchema>;
export declare const disputeStatusSchema: z.ZodEnum<{
    OPEN: "OPEN";
    RESOLVED_REVERSED: "RESOLVED_REVERSED";
    RESOLVED_UPHELD: "RESOLVED_UPHELD";
}>;
export type DisputeStatusKey = z.infer<typeof disputeStatusSchema>;
export declare const raiseDisputeSchema: z.ZodObject<{
    deliverableId: z.ZodOptional<z.ZodString>;
    reason: z.ZodString;
}, z.core.$strip>;
export type RaiseDispute = z.infer<typeof raiseDisputeSchema>;
export declare const resolveObligationDisputeSchema: z.ZodObject<{
    outcome: z.ZodEnum<{
        REVERSE: "REVERSE";
        UPHOLD: "UPHOLD";
    }>;
    note: z.ZodString;
}, z.core.$strip>;
export type ResolveObligationDispute = z.infer<typeof resolveObligationDisputeSchema>;
export declare const disputeSchema: z.ZodObject<{
    id: z.ZodString;
    obligationId: z.ZodString;
    deliverableId: z.ZodNullable<z.ZodString>;
    raisedById: z.ZodString;
    reason: z.ZodString;
    status: z.ZodEnum<{
        OPEN: "OPEN";
        RESOLVED_REVERSED: "RESOLVED_REVERSED";
        RESOLVED_UPHELD: "RESOLVED_UPHELD";
    }>;
    resolutionNote: z.ZodNullable<z.ZodString>;
    resolvedById: z.ZodNullable<z.ZodString>;
    resolvedAt: z.ZodNullable<z.ZodISODateTime>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type Dispute = z.infer<typeof disputeSchema>;
export declare const rateCardStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    ARCHIVED: "ARCHIVED";
    NEGOTIATING: "NEGOTIATING";
    SUBMITTED: "SUBMITTED";
    APPROVED: "APPROVED";
}>;
export declare const rateCardItemStatusSchema: z.ZodEnum<{
    ARCHIVED: "ARCHIVED";
    NEGOTIATING: "NEGOTIATING";
    APPROVED: "APPROVED";
    PENDING: "PENDING";
}>;
export declare const rateCardItemSchema: z.ZodObject<{
    id: z.ZodString;
    serviceType: z.ZodEnum<{
        PUBLICATION: "PUBLICATION";
        REPOST: "REPOST";
        CONTENT_PRODUCTION: "CONTENT_PRODUCTION";
        EVENT_COVERAGE: "EVENT_COVERAGE";
        CAMPAIGN_PARTICIPATION: "CAMPAIGN_PARTICIPATION";
        FIELD_OPERATION: "FIELD_OPERATION";
        NETWORKING: "NETWORKING";
        RESEARCH: "RESEARCH";
        SURVEY: "SURVEY";
        OTHER: "OTHER";
    }>;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    priceUnit: z.ZodString;
    amountRial: z.ZodString;
    minimumOrder: z.ZodNullable<z.ZodNumber>;
    leadTimeDays: z.ZodNullable<z.ZodNumber>;
    monthlyCapacity: z.ZodNullable<z.ZodNumber>;
    terms: z.ZodNullable<z.ZodString>;
    sampleWorkUrl: z.ZodNullable<z.ZodString>;
    effectiveFrom: z.ZodNullable<z.ZodISODateTime>;
    expiresAt: z.ZodNullable<z.ZodISODateTime>;
    status: z.ZodEnum<{
        ARCHIVED: "ARCHIVED";
        NEGOTIATING: "NEGOTIATING";
        APPROVED: "APPROVED";
        PENDING: "PENDING";
    }>;
    adminComment: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type RateCardItem = z.infer<typeof rateCardItemSchema>;
export declare const createRateCardItemSchema: z.ZodObject<{
    serviceType: z.ZodEnum<{
        PUBLICATION: "PUBLICATION";
        REPOST: "REPOST";
        CONTENT_PRODUCTION: "CONTENT_PRODUCTION";
        EVENT_COVERAGE: "EVENT_COVERAGE";
        CAMPAIGN_PARTICIPATION: "CAMPAIGN_PARTICIPATION";
        FIELD_OPERATION: "FIELD_OPERATION";
        NETWORKING: "NETWORKING";
        RESEARCH: "RESEARCH";
        SURVEY: "SURVEY";
        OTHER: "OTHER";
    }>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priceUnit: z.ZodString;
    amountRial: z.ZodString;
    minimumOrder: z.ZodOptional<z.ZodNumber>;
    leadTimeDays: z.ZodOptional<z.ZodNumber>;
    monthlyCapacity: z.ZodOptional<z.ZodNumber>;
    terms: z.ZodOptional<z.ZodString>;
    sampleWorkUrl: z.ZodOptional<z.ZodString>;
    effectiveFrom: z.ZodOptional<z.ZodISODateTime>;
    expiresAt: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
export type CreateRateCardItem = z.infer<typeof createRateCardItemSchema>;
export declare const reviewRateCardItemSchema: z.ZodObject<{
    action: z.ZodEnum<{
        APPROVE: "APPROVE";
        NEGOTIATE: "NEGOTIATE";
        ARCHIVE: "ARCHIVE";
    }>;
    comment: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ReviewRateCardItem = z.infer<typeof reviewRateCardItemSchema>;
export declare const rateCardSchema: z.ZodObject<{
    id: z.ZodString;
    channelId: z.ZodString;
    versionNumber: z.ZodNumber;
    status: z.ZodEnum<{
        DRAFT: "DRAFT";
        ARCHIVED: "ARCHIVED";
        NEGOTIATING: "NEGOTIATING";
        SUBMITTED: "SUBMITTED";
        APPROVED: "APPROVED";
    }>;
    submittedAt: z.ZodNullable<z.ZodISODateTime>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        serviceType: z.ZodEnum<{
            PUBLICATION: "PUBLICATION";
            REPOST: "REPOST";
            CONTENT_PRODUCTION: "CONTENT_PRODUCTION";
            EVENT_COVERAGE: "EVENT_COVERAGE";
            CAMPAIGN_PARTICIPATION: "CAMPAIGN_PARTICIPATION";
            FIELD_OPERATION: "FIELD_OPERATION";
            NETWORKING: "NETWORKING";
            RESEARCH: "RESEARCH";
            SURVEY: "SURVEY";
            OTHER: "OTHER";
        }>;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        priceUnit: z.ZodString;
        amountRial: z.ZodString;
        minimumOrder: z.ZodNullable<z.ZodNumber>;
        leadTimeDays: z.ZodNullable<z.ZodNumber>;
        monthlyCapacity: z.ZodNullable<z.ZodNumber>;
        terms: z.ZodNullable<z.ZodString>;
        sampleWorkUrl: z.ZodNullable<z.ZodString>;
        effectiveFrom: z.ZodNullable<z.ZodISODateTime>;
        expiresAt: z.ZodNullable<z.ZodISODateTime>;
        status: z.ZodEnum<{
            ARCHIVED: "ARCHIVED";
            NEGOTIATING: "NEGOTIATING";
            APPROVED: "APPROVED";
            PENDING: "PENDING";
        }>;
        adminComment: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    createdAt: z.ZodISODateTime;
}, z.core.$strip>;
export type RateCard = z.infer<typeof rateCardSchema>;
//# sourceMappingURL=barter.d.ts.map