Feature: Basic setup


  Scenario: Normal playback
    Given a page with
    """html
    <div class="flowplayer" data-ratio="0.4167">
      <video>
        <source type="video/webm" src="http://stream.flowplayer.org/bauhaus/624x260.webm">
        <source type="video/mp4"  src="http://stream.flowplayer.org/bauhaus/624x260.mp4">
        <source type="video/ogg"  src="http://stream.flowplayer.org/bauhaus/624x260.ogv">
      </video>
    </div>
    <script>
    flowplayer(function(api, root) {
      api.bind('progress', function(ev, api, time) {
        if (time > 1) { //1 second
          root.after('<div class="pass-1s">Has player over 1 second</div>');
        }
      });
    });
    </script>
    """
    When i open the page and wait for player to become ready
    And I start video by clicking the player
    And I wait for a few seconds
    Then the video should have been played at least over one second
