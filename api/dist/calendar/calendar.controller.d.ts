import { type CreateCalendarEvent, type CreateDateNote } from "@hatef/contracts";
import type { RequestActor } from "../session/actor.types";
import { CalendarService } from "./calendar.service";
export declare class CalendarController {
    private readonly calendar;
    constructor(calendar: CalendarService);
    getFeed(from?: string, to?: string, channelId?: string): Promise<{
        kind: "TASK" | "PROMOTION_SCHEDULE" | "DATE_NOTE" | "EVENT";
        linkedId: string;
        title: string;
        startAt: string;
        endAt: string | null;
        allDay: boolean;
        channelId: string | null;
        channelTitle: string | null;
        status: string | null;
    }[]>;
    listDateNotes(from?: string, to?: string, channelId?: string): Promise<{
        id: string;
        date: string;
        note: string;
        channelId: string | null;
        createdBy: string;
        createdAt: string;
    }[]>;
    createDateNote(body: CreateDateNote, actor: RequestActor): Promise<{
        id: string;
        date: string;
        note: string;
        channelId: string | null;
        createdBy: string;
        createdAt: string;
    }>;
    deleteDateNote(id: string): Promise<{
        ok: boolean;
    }>;
    createEvent(body: CreateCalendarEvent, actor: RequestActor): Promise<{
        id: string;
        title: string;
        description: string | null;
        startAt: string;
        endAt: string | null;
        allDay: boolean;
        channelId: string | null;
        createdAt: string;
    }>;
    deleteEvent(id: string): Promise<{
        ok: boolean;
    }>;
}
//# sourceMappingURL=calendar.controller.d.ts.map