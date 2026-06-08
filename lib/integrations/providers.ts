export type ProviderId = "google-drive"

export type ProviderConfig = {
  id: ProviderId
  label: string
  nangoIntegrationId: string
  scopes: string[]
  ownerTypeDefault: "org"
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  "google-drive": {
    id: "google-drive",
    label: "Google Drive",
    nangoIntegrationId: "google-drive",
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    ],
    ownerTypeDefault: "org",
  },
}

export function getProvider(id: string): ProviderConfig | undefined {
  if (!isProviderId(id)) return undefined
  return PROVIDERS[id]
}

export function isProviderId(id: string): id is ProviderId {
  return id in PROVIDERS
}
