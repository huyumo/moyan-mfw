export declare const ApiResponseUtil: {
    success: (data: unknown, message: string) => {
        code: number;
        data: unknown;
        message: string;
    };
    error: (message: string, code?: number) => {
        code: number;
        message: string;
    };
};
