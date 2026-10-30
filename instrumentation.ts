import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if ((!posthogKey || !posthogHost) && process.env.NODE_ENV === "development") {
  const missingVariables = [!posthogKey && "NEXT_PUBLIC_POSTHOG_KEY", !posthogHost && "NEXT_PUBLIC_POSTHOG_HOST"].filter(Boolean);
  missingVariables.forEach((missingVariable) => {
    console.error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    );
  });
}

export const posthogLoggerProvider =
  posthogKey && posthogHost
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
