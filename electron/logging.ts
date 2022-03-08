import envPaths from "env-paths";
import winston from "winston";
import * as path from "path";
import mkdirp from "mkdirp";

export { LogEntry } from "winston";

function getFileTransport() {
  const paths = envPaths("RimModelled", { suffix: "" });
  const filename = path.join(paths.log, "RimModelled.log");
  mkdirp.sync(paths.log);
  return new winston.transports.File({
    filename,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  });
}

export const logger = winston.createLogger({
  level: "info",
  transports: [
    getFileTransport(),
    new winston.transports.Console({
      format: winston.format.printf(
        ({ timestamp, level, message, ...rest }) =>
          `${message}${
            Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : ""
          }`
      ),
      consoleWarnLevels: ["error", "warn", "debug"],
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Stream({
      stream: process.stdout,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ...rest }) =>
            `${new Date().toISOString()} ${level}: ${message}${
              Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : ""
            }`
        )
      ),
    })
  );
}

logger.info("RimModelled started");
