import type { CalendarItem, CapacityResource, CreateCalendarEvent, CreateCapacityResource, CreateDateNote, DateNote } from "@hatef/contracts";
import { PrismaService } from "../prisma/prisma.service";
export declare class CalendarService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    /**
     * The unified calendar/Gantt read-model: every item is read live from its
     * real owning table (Task, PromotionSchedule, DateNote, CalendarEvent) —
     * nothing here is copied or cached, which is what makes "calendar and
     * Gantt render the same backing data" true by construction.
     */
    getFeed(from: Date, to: Date, channelId?: string): Promise<CalendarItem[]>;
    listDateNotes(from: Date, to: Date, channelId?: string): Promise<DateNote[]>;
    createDateNote(input: CreateDateNote, actor: {
        userId: string;
    }): Promise<DateNote>;
    deleteDateNote(id: string): Promise<void>;
    createEvent(input: CreateCalendarEvent, actor: {
        userId: string;
    }): Promise<{
        id: string;
        title: string;
        description: string | null;
        startAt: string;
        endAt: string | null;
        allDay: boolean;
        channelId: string | null;
        createdAt: string;
    }>;
    deleteEvent(id: string): Promise<void>;
    listCapacityResources(): Promise<CapacityResource[]>;
    createCapacityResource(input: CreateCapacityResource): Promise<CapacityResource>;
    deleteCapacityResource(id: string): Promise<void>;
}
//# sourceMappingURL=calendar.service.d.ts.map