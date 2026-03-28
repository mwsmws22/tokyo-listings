import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export function createLogger() {
  return pino({
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "DATABASE_URL",
        "password",
        "token",
        "refreshToken",
        "accessToken",
      ],
      remove: true,
    },
    ...(isDev
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true },
          },
        }
      : {}),
  });
}
