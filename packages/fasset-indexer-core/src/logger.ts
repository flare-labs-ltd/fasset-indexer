import { format, createLogger } from "winston"
import { Console } from "winston/lib/winston/transports"
import DailyRotateFile from "winston-daily-rotate-file"


const logger_name = (require.main?.filename ?? "").split('/').pop()?.split('.').shift()

export const logger = createLogger({
  transports: [
    new DailyRotateFile({
      filename: `./log/${logger_name}@%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "50m",
      maxFiles: "14d",
      level: "info",
      json: true,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
    }),
    new Console({
      level: "info",
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
})