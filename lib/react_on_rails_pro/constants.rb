# frozen_string_literal: true

module ReactOnRailsPro
  VERSION = "4.0.0.rc.5"
  PROTOCOL_VERSION = "1.0.0"
  # Status code 410 means to resend the request with the updated bundle.
  STATUS_SEND_BUNDLE = 410
  # Status code 412 means protocol versions are incompatible between the server and the renderer.
  STATUS_INCOMPATIBLE = 412
end
