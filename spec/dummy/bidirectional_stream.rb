# Create a new HTTPX session
http = HTTPX
       .plugin(:stream)
       .with(fallback_protocol: "h2")

# Create an Enumerator that yields JSON objects
data = Enumerator.new do |yielder|
  5.times do |i|
    chunk = "#{{ message: "Hello #{i}", timestamp: Time.now.to_i }.to_json}\n"
    puts "Sending chunk #{i}: #{chunk}"
    yielder << chunk
    sleep 1 # Simulate some delay between chunks
  end
end

# Send the request with streaming body
response = http.post(
  "http://localhost:3000/ndjson",
  body: data,
  headers: {
    "Content-Type" => "application/x-ndjson"
  },
  stream: true
)

response.each_line do |line|
  parsed_response = JSON.parse(line)
  puts "Received response: #{parsed_response}"
end
