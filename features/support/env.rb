require 'selenium/webdriver'

if ENV['LOCAL_BROWSER']
  browser = Selenium::WebDriver.for :firefox
else

  url = "http://#{ENV['username']}:#{ENV['key']}@hub.browserstack.com/wd/hub"

  capabilities = Selenium::WebDriver::Remote::Capabilities.new
  capabilities['os'] = ENV['OS'] if ENV['OS']
  capabilities['os_version'] = ENV['OS_VERSION'] if ENV['OS_VERSION']
  capabilities['browser'] = ENV['BROWSER'] if ENV['BROWSER']
  capabilities['browser_version'] = ENV['BROWSER_VERSION'] if ENV['BROWSER_VERSION']
  capabilities['browserstack.tunnel'] = true
  capabilities['browserstack.debug'] = !!ENV['debug']
  capabilities['browserName'] = ENV['BROWSER_NAME'] if ENV['BROWSER_NAME']
  capabilities['platform'] = ENV['PLATFORM'] if ENV['PLATFORM']
  capabilities['device'] = ENV['DEVICE'] if ENV['DEVICE']

  browser = Selenium::WebDriver.for(:remote, :url => url,
                                    :desired_capabilities => capabilities)
end

Before do |scenario|
  @browser = browser
  @browser.manage.timeouts.implicit_wait = 5
  @splash = !!ENV['splash']
end

at_exit do
  browser.quit
end
