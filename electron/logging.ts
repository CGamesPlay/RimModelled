import envPaths from "env-paths";
import winston from "winston";
import Transport from "winston-transport";
import * as path from "path";
import mkdirp from "mkdirp";

export { LogEntry } from "winston";

class ConsoleTransport extends Transport {
  log(info: any, callback: () => void) {
    if (typeof info !== "object") {
      info = { message: info };
    }
    const { level, message, ...rest } = info;
    delete rest[Symbol.for("level")];
    delete rest[Symbol.for("message")];
    delete rest[Symbol.for("splat")];
    if (level === "error") {
      console.error(message, rest);
    } else if (level === "warn") {
      console.warn(message, rest);
    } else {
      console.log(message, rest);
    }
    callback();
  }
}

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
  transports: [getFileTransport(), new ConsoleTransport()],
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
