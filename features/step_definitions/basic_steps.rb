Given(/^a page with$/) do |string|
  lf = File.open(File.dirname(__FILE__) + "/../support/layout.html", "rb")
  layout = lf.read
  lf.close
  @filename = (0...8).map { (65 +rand(26)).chr }.join + ".html"
  @of = File.open(File.dirname(__FILE__) + "/../support/" + @filename, "wb")
  layout.sub!('{flowplayer}', string)
  @of.write(layout)
  @of.close
end

After do
  File.delete @of
end

When(/^i open the page$/) do
  url = "#{ENV['base_url']}/features/support/#{@filename}"
  @browser.navigate.to url
end

Then(/^flowplayer should be visible on page$/) do
  @browser.find_element(:css => ".fp-ui")
end

Then(/^the player should enter ready state$/) do
  @browser.find_element(:css => ".is-ready")
end
