# create a fiber that makes a http request and yields the response chunks
url = "http://localhost:3001/"

# fiber = Fiber.new do
#   uri = URI.parse(url)
#   Net::HTTP.start(uri.host, uri.port) do |http|
#     request = Net::HTTP::Get.new(uri)
#     http.request(request) do |response|
#       response.read_body do |chunk|
#         puts "fiber: #{chunk}"
#         Fiber.yield chunk
#       end
#     end
#   end
#   nil
# end
#
# first = true
# # iterate over the chunks and print them
# while chunk = fiber.resume
#   puts "main: #{chunk}"
#   if first
#     sleep 4
#     first = false
#   end
# end



# create another version using threads
# this version will print the chunks in the order they are received
# store the chunks in a queue and print them in a separate thread
queue = Queue.new

uri = URI.parse(url)
Thread.new do
  Net::HTTP.start(uri.host, uri.port) do |http|
    request = Net::HTTP::Get.new(uri)
    http.request(request) do |response|
      response.read_body do |chunk|
        puts "thread: #{chunk}"
        queue.push chunk
      end
    end
  end
  queue.push nil
end

first = true
while chunk = queue.pop
  puts "main: #{chunk}"
  if first
    sleep 4
    first = false
  end
end
