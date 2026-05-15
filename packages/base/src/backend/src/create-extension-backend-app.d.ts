export interface ExtensionManifest {
    name: string;
    version: string;
    displayName: string;
    description: string;
    routePrefix: string;
    permCodeNodes: Array<{
        permCode: string;
        permName: string;
        nodeType: string;
        group: string;
    }>;
    requiredExtensions: string[];
    optionalExtensions: string[];
    appTypes: string[];
    minFrameworkVersion: string;
    provides?: Record<string, unknown>;
}
export interface CreateExtensionBackendAppOptions {
    manifest: ExtensionManifest;
    name: string;
    module: any;
    entities?: any[];
    port?: number;
}
export type { BaseBackendAppInstance as ExtensionBackendAppInstance } from './types/app-config.types';
export declare function createExtensionBackendApp(options: CreateExtensionBackendAppOptions): Promise<import("./create-base-backend-app").BaseBackendAppInstance>;
