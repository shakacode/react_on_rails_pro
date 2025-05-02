# frozen_string_literal: true

FETCH_LOG_MESSAGE = "REACT_ON_RAILS_PRO_DUMMY_APP: FETCH"

module CustomNavigation
  def navigate_with_streaming(path, base_url = nil)
    base_url ||= Capybara.app_host || Capybara.current_session.server.base_url
    empty_page_url = URI.join(base_url, "/empty").to_s
    # The app must create an empty page, so we need to navigate to it first
    # We need to navigate to an empty page first to avoid CORS issues and to update the page host
    visit empty_page_url

    # Override `fetch` to log the request
    page.execute_script(<<~JS)
      if (typeof window.originalFetch !== 'function') {
        window.originalFetch = window.fetch;
        window.fetch = function(url, options) {
          const stringifiedFetchInfo = JSON.stringify({ url, options });
          console.debug('#{FETCH_LOG_MESSAGE}', stringifiedFetchInfo);
          return window.originalFetch(url, options);
        }
      }
    JS

    url = URI.join(base_url, path).to_s

    inject_javascript_to_stream_page(url)

    loop do
      # check if the page has content
      if page.evaluate_script("window.loaded_content")
        loaded_content = page.evaluate_script("window.loaded_content;")
        page.evaluate_script("window.loaded_content = undefined;")
        yield loaded_content
        # Signal the browser to process the next chunk
        page.execute_script("window.processNextChunk()")
      end

      # check if the page has finished loading
      if page.evaluate_script("window.finished_loading")
        page.evaluate_script("window.finished_loading = false;")
        break
      end

      # Sleep briefly to avoid busy-waiting.
      sleep 0.1
    end
  end

  # Logs all fetch requests happening while streaming the page using the `navigate_with_streaming` method
  def fetch_requests_while_streaming
    logs = page.driver.browser.logs.get(:browser)
    fetch_requests = logs.select { |log| log.message.include?(FETCH_LOG_MESSAGE) }
    fetch_requests.map do |log|
      double_stringified_fetch_info = log.message.split(FETCH_LOG_MESSAGE.to_json).last
      JSON.parse(JSON.parse(double_stringified_fetch_info), symbolize_names: true)
    end
  end

  private

  def inject_javascript_to_stream_page(url)
    js = <<-JS
      (function() {
        history.replaceState({}, '', '#{url}');
        document.open();

        // Create a buffer for chunks and a flag for processing state
        window.chunkBuffer = [];

        // Define the global function to process the next chunk
        window.processNextChunk = function() {
          if (window.chunkBuffer.length === 0) {
            return;
          }

          const chunk = window.chunkBuffer.shift();
          document.write(chunk);
          window.loaded_content = chunk;

          if (window.chunkBuffer.length === 0 && window.finished_loading) {
            document.close();
          }
        };

        // Fetch the actual HTML content
        originalFetch('#{url}')
          .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            function readChunk() {
              reader.read().then(({ done, value }) => {
                if (done) {
                  window.finished_loading = true;
                  if (window.chunkBuffer.length === 0) {
                    document.close();
                  }
                  return;
                }

                const chunk = decoder.decode(value);
                window.chunkBuffer.push(chunk);

                // If this is the first chunk, set it as loaded_content
                if (window.chunkBuffer.length === 1 && !window.loaded_content) {
                  window.processNextChunk();
                }

                readChunk();
              });
            }

            readChunk();
          });
      })();
    JS
    page.execute_script(js)
  end
end
