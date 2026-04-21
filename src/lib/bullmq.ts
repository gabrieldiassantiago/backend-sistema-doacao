export type BullMqConnection = {
    host: string;
    port: number;
    username?: string;
    password?: string;
    maxRetriesPerRequest: null;
    enableReadyCheck: false;
    tls?: Record<string, never>;
};

export function createBullMqConnection(): BullMqConnection {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
        const parsed = new URL(redisUrl);

        return {
            host: parsed.hostname,
            port: Number(parsed.port || 6379),
            username: parsed.username || undefined,
            password: parsed.password || undefined,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            ...(parsed.protocol === "rediss:" ? { tls: {} } : {}),
        };
    }

    return {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    };
}
