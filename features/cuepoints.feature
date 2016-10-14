Feature: Cuepoints
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
    <div class="cuepoint-count"></div>
    <div class="missed-cuepoints"></div>
    <script>
    var firedCuepoints = [];
    flowplayer(function(api, root) {
      api.conf.cuepoints = [];
      for (var i = 0.3; i <= 39; i = i + 0.3) {
        api.conf.cuepoints.push(i);
      }
      var cuepointCount = 0;
      api.bind('cuepoint', function(ev, api, cue) {
        $('.cuepoint-count').text(++cuepointCount);
        firedCuepoints.push(cue.time);
      });
      api.bind('finish', function() {
        $('.missed-cuepoints').text(api.cuepoints.filter(function(cue) {
          return !firedCuepoints.some(function(c) { return c == cue; });
        }));
      });
    });
    </script>
    """


  Scenario: Normal playback
    When i open the page and wait for player to become ready
    And I start video by clicking the player
    And I wait for video to play to the end
    Then no cuepoints should be missed
    And 130 cuepoints should have been fired
  Scenario: Slow motion
    When i open the page and wait for player to become ready
    And I start video by clicking the player
    And I enter slowmotion
    And I wait for video to play to the end
    Then no cuepoints should be missed
    And 130 cuepoints should have been fired

