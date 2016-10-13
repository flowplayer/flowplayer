Feature: Events
  Background:
    Given a page with
    """html
    <div class="flowplayer" data-ratio="0.4167">
      <video>
        <source type="video/webm" src="http://edge.flowplayer.org/bauhaus/624x260.webm">
        <source type="video/mp4"  src="http://edge.flowplayer.org/bauhaus/624x260.mp4">
        <source type="video/ogg"  src="http://edge.flowplayer.org/bauhaus/624x260.ogv">
      </video>
    </div>
    <table>
      <thead>
        <tr>
          <th>Event</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>beforeseek</td><td class="event-beforeseek">0</td></tr>
        <tr><td>disable</td><td class="event-disable">0</td></tr>
        <tr><td>error</td><td class="event-error">0</td></tr>
        <tr><td>finish</td><td class="event-finish">0</td></tr>
        <tr><td>fullscreen</td><td class="event-fullscreen">0</td></tr>
        <tr><td>fullscreen-exit</td><td class="event-fullscreen-exit">0</td></tr>
        <tr><td>load</td><td class="event-load">0</td></tr>
        <tr><td>mute</td><td class="event-mute">0</td></tr>
        <tr><td>pause</td><td class="event-pause">0</td></tr>
        <tr><td>progress</td><td class="event-progress">0</td></tr>
        <tr><td>ready</td><td class="event-ready">0</td></tr>
        <tr><td>resume</td><td class="event-resume">0</td></tr>
        <tr><td>seek</td><td class="event-seek">0</td></tr>
        <tr><td>speed</td><td class="event-speed">0</td></tr>
        <tr><td>stop</td><td class="event-stop">0</td></tr>
        <tr><td>unload</td><td class="event-unload">0</td></tr>
        <tr><td>volume</td><td class="event-volume">0</td></tr>
      </tbody>
    </table>
    <script>
    flowplayer(function(api, root) {
      ['beforeseek',
       'disable',
       'error',
       'finish',
       'fullscreen',
       'fullscreen-exit',
       'load',
       'mute',
       'pause',
       'progress',
       'ready',
       'resume',
       'seek',
       'speed',
       'stop',
       'unload',
       'volume'].forEach(function(evType) {
        api.bind(evType, function(ev, api) {
          var cell = $('.event-' + evType);
          cell.text(Number(cell.text()) + 1);
        });
      });
    });
    </script>
    """


  Scenario: Ready event
    When i open the page and wait for player to become ready
    Then "ready" event should be called 1 time unless splash setup

  Scenario: Load event
    When i open the page and wait for player to become ready
    Then "load" event should be called 1 time unless splash setup

  Scenario: Resume event
    When i open the page and wait for player to become ready
    And I start video by clicking the player
    Then "resume" event should be called 1 time
    And "ready" event should be called 1 time
    And "load" event should be called 1 time

  Scenario: Progress event
    When i open the page and wait for player to become ready
    And I start video by clicking the player
    And I wait for a few seconds
    Then "progress" event should be called at least 1 time
  Scenario: Finish event
    When i open the page and wait for player to become ready
    And I start video by clicking the player
    And I wait for video to play to the end
    Then "finish" event should be called 1 time
