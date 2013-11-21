require 'rubygems'
require 'cucumber'
require 'cucumber/rake/task'
require 'parallel'
require 'json'

@browsers = JSON.load(open('features/support/browsers.json'))
@browser = ENV["browser"]
@parallel_limit = ENV["nodes"] || 1
@parallel_limit = @parallel_limit.to_i

task :cucumber do
  current_browser = ""
  Parallel.map(@browsers, :in_threads => @parallel_limit) do |browser|
      current_browser = browser
      if @browser and browser['browser'] != @browser and browser['browserName'] != @browser
        next
      end
      puts "Running with: #{browser.inspect}"
      ENV['BROWSER'] = browser['browser']
      ENV['BROWSER_VERSION'] = browser['browser_version']
      ENV['BROWSER_NAME'] = browser['browserName']
      ENV['DEVICE'] = browser['device']
      ENV['OS'] = browser['os']
      ENV['OS_VERSION'] = browser['os_version']

      Rake::Task[:run_features].execute()

  end

  Parallel.map(@browsers, :in_threads => @parallel_limit) do |browser|
      current_browser = browser
      if @browser and browser['browser'] != @browser and browser['browserName'] != @browser
        next
      end
      puts "Running with splash: #{browser.inspect}"
      ENV['BROWSER'] = browser['browser']
      ENV['BROWSER_VERSION'] = browser['browser_version']
      ENV['BROWSER_NAME'] = browser['browserName']
      ENV['DEVICE'] = browser['device']
      ENV['OS'] = browser['os']
      ENV['OS_VERSION'] = browser['os_version']
      ENV['splash'] = "true"

      Rake::Task[:run_features].execute()

  end
  
end

Cucumber::Rake::Task.new(:run_features)
task :default => [:cucumber]
