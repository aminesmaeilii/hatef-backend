"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermission = exports.REQUIRE_PERMISSION_METADATA = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRE_PERMISSION_METADATA = "require_permission";
const RequirePermission = (permission, options) => (0, common_1.SetMetadata)(exports.REQUIRE_PERMISSION_METADATA, { permission, ...options });
exports.RequirePermission = RequirePermission;
