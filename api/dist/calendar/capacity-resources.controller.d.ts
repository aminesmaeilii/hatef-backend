import { type CreateCapacityResource } from "@hatef/contracts";
import { CalendarService } from "./calendar.service";
export declare class CapacityResourcesController {
    private readonly calendar;
    constructor(calendar: CalendarService);
    list(): Promise<{
        id: string;
        operatorId: string;
        operatorName: string;
        capacityPerDay: number;
    }[]>;
    create(body: CreateCapacityResource): Promise<{
        id: string;
        operatorId: string;
        operatorName: string;
        capacityPerDay: number;
    }>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
//# sourceMappingURL=capacity-resources.controller.d.ts.map