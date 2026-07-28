"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADVANCE_TARGET = exports.evaluationStateMachine = void 0;
exports.toPartnerFacingStatus = toPartnerFacingStatus;
const domain_1 = require("@hatef/domain");
const contracts_1 = require("@hatef/contracts");
/** Exact transition table from the product spec's channel-assessment workflow. */
exports.evaluationStateMachine = new domain_1.StateMachine(contracts_1.EVALUATION_TRANSITIONS);
/** The single, unambiguous "move the queue forward" target for administrative checkpoints (no extra data needed, unlike decide()/requestCorrection()). */
exports.ADVANCE_TARGET = {
    SUBMITTED: "IDENTITY_CHECK",
    IDENTITY_CHECK: "UNDER_REVIEW",
    RESUBMITTED: "UNDER_REVIEW",
    WAITLISTED: "UNDER_REVIEW",
};
const PARTNER_STATUS_MAP = {
    DRAFT: "IN_REVIEW",
    SUBMITTED: "IN_REVIEW",
    IDENTITY_CHECK: "IN_REVIEW",
    UNDER_REVIEW: "IN_REVIEW",
    RESUBMITTED: "IN_REVIEW",
    NEEDS_CHANGES: "NEEDS_CHANGES",
    APPROVED: "APPROVED",
    CONDITIONALLY_APPROVED: "CONDITIONALLY_APPROVED",
    WAITLISTED: "WAITLISTED",
    REJECTED: "REJECTED",
};
/** The partner only ever sees this simplified set, never the internal 10-status workflow. */
function toPartnerFacingStatus(status) {
    return PARTNER_STATUS_MAP[status];
}
