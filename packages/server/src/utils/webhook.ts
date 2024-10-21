import type { UpstreamRepoType } from "@/db/schema";

export function generateWebhookUrl(type: UpstreamRepoType, organizationId: string, appId: string) {
  if (type === "codeup") {
    return `/webhook/${organizationId}/${appId}/codeup`
  }
}
