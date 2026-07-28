import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionsService } from "./permissions.service";
/** Must run after SessionAuthGuard (needs req.actor already populated). */
export declare class PermissionGuard implements CanActivate {
    private readonly reflector;
    private readonly permissions;
    constructor(reflector: Reflector, permissions: PermissionsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
//# sourceMappingURL=permission.guard.d.ts.map