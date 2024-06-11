# frozen_string_literal: true

module ReactOnRailsPro
  module Stream
    def stream_view_containing_react_components(template:, close_stream_at_end: true)
      @rorp_rendering_fibers = []
      template_string = render_to_string(template: template)
      response.stream.write(template_string)

      @rorp_rendering_fibers.each do |fiber|
        while (chunk = fiber.resume)
          response.stream.write(chunk)
        end
      end
      response.stream.close if close_stream_at_end
    end
  end
end
