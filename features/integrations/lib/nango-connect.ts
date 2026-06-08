import Nango from "@nangohq/frontend"
import type { ConnectUI } from "@nangohq/frontend"

type OpenNangoConnectParams = {
  sessionToken: string
  onSuccess: () => void | Promise<void>
  onError?: (message: string) => void
  onClose?: () => void
}

function dismissConnectUI(connectUI: ConnectUI, nango: Nango) {
  connectUI.close()
  nango.clear()

  const iframe = document.getElementById("connect-ui")
  iframe?.remove()
  document.body.style.overflow = ""
}

export function openNangoConnect({
  sessionToken,
  onSuccess,
  onError,
  onClose,
}: OpenNangoConnectParams) {
  const nango = new Nango({ connectSessionToken: sessionToken })
  const connectUI = nango.openConnectUI({
    sessionToken,
    onEvent: async (event) => {
      if (event.type === "connect") {
        dismissConnectUI(connectUI, nango)
        await onSuccess()
        return
      }
      if (event.type === "close") {
        dismissConnectUI(connectUI, nango)
        onClose?.()
        return
      }
      if (event.type === "error") {
        dismissConnectUI(connectUI, nango)
        onError?.(event.payload.errorMessage)
      }
    },
  })
  connectUI.open()

  return {
    dismiss: () => dismissConnectUI(connectUI, nango),
  }
}
