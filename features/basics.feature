Feature: Basic setup


  Scenario: Minimal setup
    Given a page with
    """html
    <div class="flowplayer" data-ratio="0.4167">
      <video>
        <source type="video/webm" src="http://stream.flowplayer.org/bauhaus/624x260.webm">
        <source type="video/mp4"  src="http://stream.flowplayer.org/bauhaus/624x260.mp4">
        <source type="video/ogg"  src="http://stream.flowplayer.org/bauhaus/624x260.ogv">
      </video>
    </div>
    """
    When i open the page
    Then flowplayer should be visible on page
    And the player should enter ready state
