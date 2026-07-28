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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CalendarService = class CalendarService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * The unified calendar/Gantt read-model: every item is read live from its
     * real owning table (Task, PromotionSchedule, DateNote, CalendarEvent) —
     * nothing here is copied or cached, which is what makes "calendar and
     * Gantt render the same backing data" true by construction.
     */
    async getFeed(from, to, channelId) {
        const [tasks, schedules, dateNotes, events] = await Promise.all([
            this.prisma.task.findMany({
                where: {
                    channelId,
                    OR: [
                        { startDate: { gte: from, lte: to } },
                        { dueDate: { gte: from, lte: to } },
                    ],
                },
                include: { channel: { select: { title: true } } },
            }),
            this.prisma.promotionSchedule.findMany({
                where: {
                    scheduledStartAt: { gte: from, lte: to },
                    ...(channelId ? { promotionOrder: { channelId } } : {}),
                },
                include: {
                    promotionOrder: {
                        include: { channel: { select: { title: true } }, supportRequest: { include: { promotionType: { select: { name: true } } } } },
                    },
                },
            }),
            this.prisma.dateNote.findMany({ where: { date: { gte: from, lte: to }, channelId } }),
            this.prisma.calendarEvent.findMany({
                where: { startAt: { gte: from, lte: to }, channelId },
                include: { channel: { select: { title: true } } },
            }),
        ]);
        const items = [];
        for (const task of tasks) {
            const startAt = task.startDate ?? task.dueDate;
            if (!startAt)
                continue;
            items.push({
                kind: "TASK",
                linkedId: task.id,
                title: task.title,
                startAt: startAt.toISOString(),
                endAt: task.dueDate && task.dueDate.getTime() !== startAt.getTime() ? task.dueDate.toISOString() : null,
                allDay: true,
                channelId: task.channelId,
                channelTitle: task.channel?.title ?? null,
                status: task.status,
            });
        }
        for (const schedule of schedules) {
            items.push({
                kind: "PROMOTION_SCHEDULE",
                // The support request id — not the promotion-order id — since that's
                // what /support-requests/:id/reschedule and the admin detail page
                // both key on. Drag-to-reschedule in the Gantt calls that exact
                // endpoint, so the id here must already be the one it needs.
                linkedId: schedule.promotionOrder.supportRequest.id,
                title: schedule.promotionOrder.supportRequest.promotionType.name,
                startAt: schedule.scheduledStartAt.toISOString(),
                endAt: schedule.scheduledEndAt?.toISOString() ?? null,
                allDay: false,
                channelId: schedule.promotionOrder.channelId,
                channelTitle: schedule.promotionOrder.channel.title,
                status: null,
            });
        }
        for (const note of dateNotes) {
            items.push({
                kind: "DATE_NOTE",
                linkedId: note.id,
                title: note.note,
                startAt: note.date.toISOString(),
                endAt: null,
                allDay: true,
                channelId: note.channelId,
                channelTitle: null,
                status: null,
            });
        }
        for (const event of events) {
            items.push({
                kind: "EVENT",
                linkedId: event.id,
                title: event.title,
                startAt: event.startAt.toISOString(),
                endAt: event.endAt?.toISOString() ?? null,
                allDay: event.allDay,
                channelId: event.channelId,
                channelTitle: event.channel?.title ?? null,
                status: null,
            });
        }
        return items.sort((a, b) => a.startAt.localeCompare(b.startAt));
    }
    async listDateNotes(from, to, channelId) {
        const notes = await this.prisma.dateNote.findMany({ where: { date: { gte: from, lte: to }, channelId }, orderBy: { date: "asc" } });
        return notes.map(toDateNoteDto);
    }
    async createDateNote(input, actor) {
        const note = await this.prisma.dateNote.create({
            data: { date: new Date(input.date), note: input.note, channelId: input.channelId, createdBy: actor.userId },
        });
        return toDateNoteDto(note);
    }
    async deleteDateNote(id) {
        await this.prisma.dateNote.delete({ where: { id } });
    }
    async createEvent(input, actor) {
        const event = await this.prisma.calendarEvent.create({
            data: {
                title: input.title,
                description: input.description,
                startAt: new Date(input.startAt),
                endAt: input.endAt ? new Date(input.endAt) : undefined,
                allDay: input.allDay,
                channelId: input.channelId,
                createdBy: actor.userId,
            },
        });
        return {
            id: event.id,
            title: event.title,
            description: event.description,
            startAt: event.startAt.toISOString(),
            endAt: event.endAt?.toISOString() ?? null,
            allDay: event.allDay,
            channelId: event.channelId,
            createdAt: event.createdAt.toISOString(),
        };
    }
    async deleteEvent(id) {
        await this.prisma.calendarEvent.delete({ where: { id } });
    }
    async listCapacityResources() {
        const resources = await this.prisma.capacityResource.findMany({ include: { operator: { select: { displayName: true } } } });
        return resources.map((r) => ({ id: r.id, operatorId: r.operatorId, operatorName: r.operator.displayName, capacityPerDay: r.capacityPerDay }));
    }
    async createCapacityResource(input) {
        const resource = await this.prisma.capacityResource.create({
            data: { operatorId: input.operatorId, capacityPerDay: input.capacityPerDay },
            include: { operator: { select: { displayName: true } } },
        });
        return { id: resource.id, operatorId: resource.operatorId, operatorName: resource.operator.displayName, capacityPerDay: resource.capacityPerDay };
    }
    async deleteCapacityResource(id) {
        await this.prisma.capacityResource.delete({ where: { id } });
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CalendarService);
function toDateNoteDto(note) {
    return {
        id: note.id,
        date: note.date.toISOString().slice(0, 10),
        note: note.note,
        channelId: note.channelId,
        createdBy: note.createdBy,
        createdAt: note.createdAt.toISOString(),
    };
}
