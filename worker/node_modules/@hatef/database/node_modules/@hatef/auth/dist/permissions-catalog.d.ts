/**
 * Phase 1 role and permission catalog. Permission keys use a `noun:action`
 * convention (matches the existing PermissionChecker tests). This catalog is
 * additive-only — later phases add more permissions/roles here, never
 * rename or remove Phase 1 entries, since RoleAssignment rows reference
 * these keys by string.
 */
export declare const PERMISSIONS: {
    readonly SESSION_READ_OWN: "session:read-own";
    readonly SESSION_REVOKE_OWN: "session:revoke-own";
    readonly USER_MANAGE: "user:manage";
    readonly ROLE_MANAGE: "role:manage";
    readonly CHANNEL_CREATE: "channel:create";
    readonly CHANNEL_READ: "channel:read";
    readonly CHANNEL_MEMBERSHIP_MANAGE: "channel:membership-manage";
    readonly FILE_UPLOAD: "file:upload";
    readonly FILE_READ: "file:read";
    readonly AUDIT_READ: "audit:read";
    readonly FORM_MANAGE: "form:manage";
    readonly FORM_SUBMISSION_READ: "form-submission:read";
    readonly FORM_SUBMISSION_MANAGE: "form-submission:manage";
    readonly EVALUATION_READ: "evaluation:read";
    readonly EVALUATION_ASSIGN: "evaluation:assign";
    readonly EVALUATION_SCORE: "evaluation:score";
    readonly EVALUATION_DECIDE: "evaluation:decide";
    readonly EVALUATION_NOTE: "evaluation:note";
    readonly PROMOTION_TYPE_MANAGE: "promotion-type:manage";
    readonly SUPPORT_REQUEST_READ: "support-request:read";
    readonly SUPPORT_REQUEST_MANAGE: "support-request:manage";
    readonly SUPPORT_REQUEST_VALIDATE: "support-request:validate";
    readonly SUPPORT_REQUEST_PRICE: "support-request:price";
    readonly SUPPORT_REQUEST_QUOTE: "support-request:quote";
    readonly SUPPORT_REQUEST_APPROVE: "support-request:approve";
    readonly TASK_READ: "task:read";
    readonly TASK_MANAGE: "task:manage";
    readonly CALENDAR_READ: "calendar:read";
    readonly CALENDAR_MANAGE: "calendar:manage";
    readonly CAPACITY_MANAGE: "capacity:manage";
    readonly SERVICE_CATALOG_MANAGE: "service-catalog:manage";
    readonly OBLIGATION_READ: "obligation:read";
    readonly OBLIGATION_MANAGE: "obligation:manage";
    readonly OBLIGATION_NEGOTIATE: "obligation:negotiate";
    readonly DELIVERABLE_SUBMIT: "deliverable:submit";
    readonly DELIVERABLE_REVIEW: "deliverable:review";
    readonly DISPUTE_MANAGE: "dispute:manage";
    readonly LEDGER_READ: "ledger:read";
    readonly LEDGER_ADJUST: "ledger:adjust";
    readonly SETTLEMENT_MANAGE: "settlement:manage";
    readonly FINANCIAL_APPROVAL_DECIDE: "financial-approval:decide";
    readonly RATE_CARD_READ: "rate-card:read";
    readonly RATE_CARD_MANAGE_OWN: "rate-card:manage-own";
    readonly RATE_CARD_REVIEW: "rate-card:review";
    readonly TICKET_READ: "ticket:read";
    readonly TICKET_MANAGE: "ticket:manage";
    readonly NOTIFICATION_READ_OWN: "notification:read-own";
    readonly NOTIFICATION_TEMPLATE_MANAGE: "notification-template:manage";
    readonly SURVEY_READ: "survey:read";
    readonly SURVEY_MANAGE: "survey:manage";
    readonly REPORT_READ: "report:read";
    readonly REPORT_MANAGE: "report:manage";
    readonly REPORT_EXPORT: "report:export";
};
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export declare const INTERNAL_ROLES: readonly ["SUPER_ADMIN", "SYSTEM_ADMIN", "OPERATIONS_MANAGER", "EVALUATOR", "EVALUATION_SUPERVISOR", "PROMOTION_OPERATOR", "FINANCE_MANAGER", "FINANCE_APPROVER", "SUPPORT_AGENT", "FORM_MANAGER", "REPORT_ANALYST", "AUDITOR", "INTERNAL_STAFF"];
export declare const PARTNER_ROLES: readonly ["CHANNEL_OWNER", "CHANNEL_ADMIN", "CHANNEL_FINANCE_VIEWER", "CHANNEL_TEAM_MEMBER"];
export type InternalRoleKey = (typeof INTERNAL_ROLES)[number];
export type PartnerRoleKey = (typeof PARTNER_ROLES)[number];
export type RoleKey = InternalRoleKey | PartnerRoleKey;
/** Role -> permission grants. Whether a grant is global or channel-scoped is decided by the RoleAssignment row, not this table. */
export declare const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]>;
//# sourceMappingURL=permissions-catalog.d.ts.map