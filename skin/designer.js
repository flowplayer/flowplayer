
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
each('.fp-controls strong', player, function(el) {
  var menu = $('#share-menu')

  $(el).on('click', function() {
    el.toggleClass('fp-selected')
    menu.toggleClass('fp-active')
    menu.css({left: Math.min(el.offsetLeft - 50, player.offsetWidth  - 125) })

  })
})


false && player.on('mouseenter mouseleave', function(e) {
  player.toggleClass('fp-ui-shown', e.type == 'mouseenter')
})

// play / pause click
$('.fp-ui').on('click', function(e) {
  var cls = e.target.className
  if (cls == 'fp-ui' || cls.indexOf('play') > 0) {
    player.toggleClass('is-paused')
    var play = document.querySelector('.fp-play')
    play.classList.add('fp-visible')
    setTimeout(function() {
      play.classList.remove('fp-visible')
    }, 300)

  }
})


'chromecast airplay share fullscreen header playbtn duration volumebtn fullscreen speed cc hd'.split(' ').forEach(function(name) {

  var el = $('<a>').txt(name).on('click', function() {
    $('.fp-' + name).toggleClass('is-hidden')
  })

  $('#visibility-toggles').append(el)

})


'default minimal full fat'.split(' ').forEach(function(name) {

  var el = $('<a>').txt(name).on('click', function() {
    player.className = 'flowplayer fp-ui-shown fp-' + name + (no_flex ? ' no-flex' : '')

    each('[name=bg]', function(el) {
      el.disabled = name == 'minimal'
    })

  })

  $('#layout-options').append(el)

})

$('#rounding').on('change', function() {
  player.toggleClass('fp-edgy', !this.checked)
})

$('#light').on('change', function() {
  $('video').attr('poster', this.checked ? 'hero-light.jpg' : 'hero.jpg')
})



each('[name=bg]', function(el) {
  var bg = $(el).value

  el.on('change', function() {
    $('.fp-controls').css({ backgroundColor: bg })
  })

})
