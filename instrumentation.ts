import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

const isProduction = process.env.NODE_ENV === "production";

export const posthogLoggerProvider =
  isProduction && posthogKey && posthogHost
    ? new LoggerProvider({
        resource: resourceFromAttributes({ "service.name": "mealtree" }),
        processors: [
          new BatchLogRecordProcessor({
            exporter: new OTLPLogExporter({
              url: new URL("/i/v1/logs", posthogHost).toString(),
              headers: {
                Authorization: `Bearer ${posthogKey}`,
                "Content-Type": "application/json",
              },
            }),
          }),
        ],
      })
    : null;

export const posthogLogger = posthogLoggerProvider?.getLogger("mealtree.posthog-logs");
export { SeverityNumber };

export function register() {}
