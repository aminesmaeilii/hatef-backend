"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPORT_DATASETS = void 0;
exports.getReportDataset = getReportDataset;
exports.listReportDatasets = listReportDatasets;
function dateRange(filters) {
    if (!filters.dateFrom && !filters.dateTo)
        return undefined;
    return {
        gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        lte: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };
}
/**
 * The full set of queries any report/dashboard is allowed to run (spec 20:
 * "approved semantic datasets, not unrestricted direct SQL"). A dataset key
 * from user input is only ever used to look up an entry here — never
 * interpolated into a query string. Each `run()` is a plain, reviewable
 * Prisma query (manual group-by-reduce, same style TasksService.
 * workloadByAssignee already uses, rather than Prisma's groupBy — simpler to
 * reason about for BigInt sums and small result sets). Both `backend/api`
 * (synchronous preview / definition CRUD) and `backend/worker` (the actual
 * async ReportRun execution) import this same registry, so there is exactly
 * one implementation of "what a report query does."
 */
exports.REPORT_DATASETS = {
    support_request_funnel: {
        key: "support_request_funnel",
        name: "قیف درخواست‌های پشتیبانی",
        description: "تعداد درخواست‌های پشتیبانی به تفکیک وضعیت.",
        dimensions: ["status"],
        metrics: ["count"],
        async run(prisma, filters) {
            const requests = await prisma.supportRequest.findMany({
                where: { createdAt: dateRange(filters), channelId: filters.channelId },
                select: { status: true },
            });
            const counts = new Map();
            for (const r of requests)
                counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
            return {
                columns: [
                    { key: "status", label: "وضعیت", type: "string" },
                    { key: "count", label: "تعداد", type: "number" },
                ],
                rows: [...counts.entries()].map(([status, count]) => ({ status, count })),
            };
        },
    },
    promotion_estimate_vs_actual: {
        key: "promotion_estimate_vs_actual",
        name: "برآورد در برابر تحقق‌یافته پروموشن",
        description: "مقایسه مبلغ نهایی برآوردشده هر سفارش پروموشن با ارزش تحقق‌یافته آن پس از تکمیل.",
        dimensions: ["supportRequestId", "channelId"],
        metrics: ["estimatedAmountRial", "realizedValueRial", "varianceRial"],
        async run(prisma, filters) {
            const orders = await prisma.promotionOrder.findMany({
                where: { createdAt: dateRange(filters), channelId: filters.channelId },
                include: { executionResult: true },
            });
            const rows = orders
                .filter((o) => o.executionResult?.realizedValueRial !== null && o.executionResult?.realizedValueRial !== undefined)
                .map((o) => {
                const estimated = o.finalAmountRial;
                const realized = o.executionResult.realizedValueRial;
                return {
                    supportRequestId: o.supportRequestId,
                    channelId: o.channelId,
                    estimatedAmountRial: estimated.toString(),
                    realizedValueRial: realized.toString(),
                    varianceRial: (realized - estimated).toString(),
                };
            });
            return {
                columns: [
                    { key: "supportRequestId", label: "درخواست پشتیبانی", type: "string" },
                    { key: "channelId", label: "کانال", type: "string" },
                    { key: "estimatedAmountRial", label: "مبلغ برآوردشده (ریال)", type: "number" },
                    { key: "realizedValueRial", label: "ارزش تحقق‌یافته (ریال)", type: "number" },
                    { key: "varianceRial", label: "اختلاف (ریال)", type: "number" },
                ],
                rows,
            };
        },
    },
    obligations_due_and_overdue: {
        key: "obligations_due_and_overdue",
        name: "تعهدات سررسید و عقب‌افتاده",
        description: "تعداد تعهدات خدمت متقابل به تفکیک وضعیت، و شمار موارد عقب‌افتاده از مهلت.",
        dimensions: ["status"],
        metrics: ["count", "overdueCount"],
        async run(prisma, filters) {
            const obligations = await prisma.serviceObligation.findMany({
                where: { createdAt: dateRange(filters), channelId: filters.channelId },
                select: { status: true, deadlineAt: true },
            });
            const now = new Date();
            const byStatus = new Map();
            for (const o of obligations) {
                const entry = byStatus.get(o.status) ?? { count: 0, overdueCount: 0 };
                entry.count += 1;
                const isOpen = o.status !== "SETTLED" && o.status !== "CANCELLED";
                if (isOpen && o.deadlineAt && o.deadlineAt < now)
                    entry.overdueCount += 1;
                byStatus.set(o.status, entry);
            }
            return {
                columns: [
                    { key: "status", label: "وضعیت", type: "string" },
                    { key: "count", label: "تعداد", type: "number" },
                    { key: "overdueCount", label: "عقب‌افتاده", type: "number" },
                ],
                rows: [...byStatus.entries()].map(([status, v]) => ({ status, ...v })),
            };
        },
    },
    service_debt_aging: {
        key: "service_debt_aging",
        name: "بدهی جاری خدمت متقابل به تفکیک کانال",
        description: "مانده جاری حساب بدهی خدمت متقابل هر کانال، بازسازی‌شده زنده از ردیف‌های دفتر کل.",
        dimensions: ["channelId"],
        metrics: ["outstandingObligationRial"],
        async run(prisma, filters) {
            const accounts = await prisma.ledgerAccount.findMany({
                where: { accountType: "CHANNEL_SERVICE_OBLIGATION", channelId: filters.channelId ?? { not: null } },
                include: { entries: true },
            });
            const rows = accounts
                .map((a) => {
                const balance = a.entries.reduce((sum, e) => (e.direction === "DEBIT" ? sum + e.amountRial : sum - e.amountRial), 0n);
                return { channelId: a.channelId, outstandingObligationRial: balance.toString() };
            })
                .filter((r) => r.outstandingObligationRial !== "0");
            return {
                columns: [
                    { key: "channelId", label: "کانال", type: "string" },
                    { key: "outstandingObligationRial", label: "بدهی جاری (ریال)", type: "number" },
                ],
                rows,
            };
        },
    },
    settlement_by_channel: {
        key: "settlement_by_channel",
        name: "تسویه به تفکیک کانال",
        description: "مجموع مبلغ تسویه‌های تکمیل‌شده هر کانال.",
        dimensions: ["channelId"],
        metrics: ["totalSettledRial", "settlementCount"],
        async run(prisma, filters) {
            const settlements = await prisma.settlement.findMany({
                where: { status: "COMPLETED", completedAt: dateRange(filters), channelId: filters.channelId },
                select: { channelId: true, totalAmountRial: true },
            });
            const byChannel = new Map();
            for (const s of settlements) {
                const entry = byChannel.get(s.channelId) ?? { total: 0n, count: 0 };
                entry.total += s.totalAmountRial;
                entry.count += 1;
                byChannel.set(s.channelId, entry);
            }
            return {
                columns: [
                    { key: "channelId", label: "کانال", type: "string" },
                    { key: "totalSettledRial", label: "مجموع تسویه‌شده (ریال)", type: "number" },
                    { key: "settlementCount", label: "تعداد تسویه", type: "number" },
                ],
                rows: [...byChannel.entries()].map(([channelId, v]) => ({
                    channelId,
                    totalSettledRial: v.total.toString(),
                    settlementCount: v.count,
                })),
            };
        },
    },
    ticket_sla: {
        key: "ticket_sla",
        name: "وضعیت SLA تیکت‌ها",
        description: "تعداد تیکت‌ها به تفکیک وضعیت و شمار موارد نقض SLA.",
        dimensions: ["status"],
        metrics: ["count", "slaBreachCount"],
        async run(prisma, filters) {
            const tickets = await prisma.ticket.findMany({
                where: { createdAt: dateRange(filters), channelId: filters.channelId },
                select: { status: true, slaDueAt: true, resolvedAt: true },
            });
            const now = new Date();
            const byStatus = new Map();
            for (const t of tickets) {
                const entry = byStatus.get(t.status) ?? { count: 0, slaBreachCount: 0 };
                entry.count += 1;
                const breached = t.slaDueAt ? (t.resolvedAt ? t.resolvedAt > t.slaDueAt : t.slaDueAt < now) : false;
                if (breached)
                    entry.slaBreachCount += 1;
                byStatus.set(t.status, entry);
            }
            return {
                columns: [
                    { key: "status", label: "وضعیت", type: "string" },
                    { key: "count", label: "تعداد", type: "number" },
                    { key: "slaBreachCount", label: "نقض SLA", type: "number" },
                ],
                rows: [...byStatus.entries()].map(([status, v]) => ({ status, ...v })),
            };
        },
    },
};
function getReportDataset(key) {
    return exports.REPORT_DATASETS[key];
}
function listReportDatasets() {
    return Object.values(exports.REPORT_DATASETS);
}
