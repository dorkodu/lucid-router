declare function run(use: "hash" | "history", cb?: () => void): void;
declare function to(url?: string): void;
declare function route(pattern: string, cb: (...args: any[]) => void): void;
declare function redirect(pattern: string, to: string, cb: (...args: any[]) => void): void;
declare function fallback(cb: () => void): void;
export declare const superpage: {
    run: typeof run;
    to: typeof to;
    route: typeof route;
    redirect: typeof redirect;
    fallback: typeof fallback;
};
export {};
