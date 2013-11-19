require 'selenium/webdriver'

url = "http://#{ENV['username']}:#{ENV['key']}@hub.browserstack.com/wd/hub"

capabilities = Selenium::WebDriver::Remote::Capabilities.new
capabilities['os'] = ENV['OS']
capabilities['os_version'] = ENV['OS_VERSION']
capabilities['browser'] = ENV['BROWSER']
capabilities['browser_version'] = ENV['BROWSER_VERSION']
capabilities['browserstack.tunnel'] = true
capabilities['browserstack.debug'] = !!ENV['debug']
capabilities['browserName'] = ENV['BROWSER_NAME']
capabilities['platform'] = ENV['PLATFORM']
capabilities['device'] = ENV['DEVICE']

browser = Selenium::WebDriver.for(:remote, :url => url,
                                  :desired_capabilities => capabilities)

Before do |scenario|
  @browser = browser
  @browser.manage.timeouts.implicit_wait = 5
  @splash = !!ENV['splash']
end

at_exit do
  browser.quit
end
