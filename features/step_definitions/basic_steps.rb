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

def navigate_to_home
  url = "#{ENV['base_url']}/features/support/#{@filename}"
  @browser.navigate.to url
end

When(/^i open the page$/) do
  navigate_to_home()
end

Then(/^flowplayer should be visible on page$/) do
  @browser.find_element(:css => ".fp-ui")
end

def wait_for_ready
  if not @browser.execute_script("return window.flowplayer.support.firstframe;")
    @browser.find_element(:css => ".is-splash.is-paused")
  else
    @browser.find_element(:css => ".is-ready")
  end
end

Then(/^the player should enter ready state$/) do
  wait_for_ready()
end

When(/^i open the page and wait for player to become ready$/) do
  navigate_to_home()
  wait_for_ready()
end

When(/^I start video by clicking the player$/) do
  @browser.find_element(:css => ".fp-ui").click
end

When(/^I wait for a few seconds$/) do
  sleep(3)
end

Then(/^the video should have been played at least over one second$/) do
  @browser.find_element(:css => ".pass-1s")
end
