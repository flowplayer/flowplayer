Feature: Basic setup


  Scenario: Minimal setup
    Given a page with
    """html
    <div class="flowplayer" data-ratio="0.4167">
      <video>
        <source type="video/webm" src="http://edge.flowplayer.org/bauhaus.webm">
        <source type="video/mp4"  src="http://edge.flowplayer.org/bauhaus.mp4">
        <source type="video/ogg"  src="http://edge.flowplayer.org/bauhaus.ogv">
      </video>
    </div>
    """
    When i open the page
    Then flowplayer should be visible on page
    And the player should enter ready state
