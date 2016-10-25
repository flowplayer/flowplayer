
var player = $('#player'),
  ua = navigator.userAgent,
  no_flex = ua.indexOf('MSIE 9') > 0 || ua.indexOf('MSIE 7') > 0 // make this wiser


if (no_flex) player.addClass('no-flex')

function each(query, root, fn) {
  if (!fn) { fn = root; root = document }

  var els = root.querySelectorAll(query)
  for (var i = 0, el; (el = els[i]); i++) {
    fn(el)
  }
}

// open menu
each('.flow-controls strong', player, function(el) {
  var menu = $('#share-menu')

  $(el).on('click', function() {
    el.toggleClass('flow-selected')
    menu.toggleClass('flow-active')
    menu.css({left: Math.min(el.offsetLeft - 50, player.offsetWidth  - 125) })

  })
})


false && player.on('mouseenter mouseleave', function(e) {
  player.toggleClass('flow-ui-shown', e.type == 'mouseenter')
})

// play / pause click
$('.flow-ui').on('click', function(e) {
  var cls = e.target.className
  if (cls == 'flow-ui' || cls.indexOf('play') > 0) {
    player.toggleClass('is-paused')
    var play = document.querySelector('.flow-play')
    play.classList.add('flow-visible')
    setTimeout(function() {
      play.classList.remove('flow-visible')
    }, 300)

  }
})


'chromecast airplay share fullscreen header playbtn duration volumebtn fullscreen speed cc hd'.split(' ').forEach(function(name) {

  var el = $('<a>').txt(name).on('click', function() {
    $('.flow-' + name).toggleClass('is-hidden')
  })

  $('#visibility-toggles').append(el)

})


'default minimal full fat'.split(' ').forEach(function(name) {

  var el = $('<a>').txt(name).on('click', function() {
    player.className = 'flowplayer flow-ui-shown flow-' + name + (no_flex ? ' no-flex' : '')

    each('[name=bg]', function(el) {
      el.disabled = name == 'minimal'
    })

  })

  $('#layout-options').append(el)

})

$('#rounding').on('change', function() {
  player.toggleClass('flow-edgy', !this.checked)
})

$('#light').on('change', function() {
  $('video').attr('poster', this.checked ? 'hero-light.jpg' : 'hero.jpg')
})



each('[name=bg]', function(el) {
  var bg = $(el).value

  el.on('change', function() {
    $('.flow-controls').css({ backgroundColor: bg })
  })

})
