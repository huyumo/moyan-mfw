"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => ({
    defaultPassword: {
        type: process.env.ADMIN_DEFAULT_PASSWORD_TYPE || 'fixed',
        value: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123',
    },
});
//# sourceMappingURL=user.config.js.map