"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveAntivirusProvider = void 0;
const common_1 = require("@nestjs/common");
/**
 * Production adapter interface. No real malware-scanning engine/credential
 * exists yet — wire a real vendor (ClamAV daemon, a cloud scanning API,
 * ...) here when one is selected. Fails closed (never reports clean) rather
 * than silently behaving like the dev provider.
 */
let LiveAntivirusProvider = class LiveAntivirusProvider {
    async scan(_buffer) {
        throw new Error("Live antivirus scanning is not configured. Set ANTIVIRUS_PROVIDER=dev until a vendor is wired up.");
    }
};
exports.LiveAntivirusProvider = LiveAntivirusProvider;
exports.LiveAntivirusProvider = LiveAntivirusProvider = __decorate([
    (0, common_1.Injectable)()
], LiveAntivirusProvider);
