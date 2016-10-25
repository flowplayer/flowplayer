
/*
  Shared DOM operations
*/

// returns single element
var $ = function(query, root) {

  if (query == window || query == document) return typeof query.on == 'function' ? query : $.observable(query)

  var el

  // $('<span>', attr)
  if (query[0] == '<') {
    el = document.createElement(query.slice(1, -1))

    root && Object.keys(root).forEach(function(name) {
      el.setAttribute(name, root[name])
    })

  } else {
    if (typeof query == 'string') {
      el = root ? root.querySelector('.flow-' + query) : document.querySelector(query)

    } else {
      el = query
    }
    if (!el) return el
  }

  $.observable(el)


  el.offset = function() {
    var offset = { top: 0, left: 0 },
        node = el

    do {
      offset.left += (node.offsetLeft || 0)
      offset.top += (node.offsetTop || 0)

    } while (node = node.offsetParent)

    return offset
  }

  el.innerWidth = function() {
    var style = getComputedStyle(el)
    return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  }

  el.prepend = function(child) {
    if (typeof child == 'string') {
      el.insertAdjacentHTML('afterbegin', child)
      child = el.firstChild

    } else {
      el.insertBefore(child, el.firstChild)
    }

    return $(child)
  }

  el.css = function(key, val) {
    if (typeof key == 'object') {
      for (var name in key) {
        el.css(name, key[name])
      }
    } else if (key) {
      if (val === undefined) return getComputedStyle(this)[key]
      if (1 * val) val += 'px'
      el.style[key] = val
    }
    return el
  }

  el.show = function() {
    // 'initial' not working on IE
    var tag = el.tagName
    return el.css({ display: ['SPAN', 'A'].indexOf(tag) >= 0 ? 'inline' : 'block' })
  }

  el.hide = function() {
    return el.css({ display: 'none' })
  }

  el.append = function(child) {
    if (typeof child == 'string') {
      el.insertAdjacentHTML('beforeend', child)
      child = el.lastChild

    } else {
      el.appendChild(child)
    }

    return $(child)
  }

  el.remove = function(query) {
    var p = el.parentNode
    p && p.removeChild(el)
  }

  el.attr = function(name, value) {
    if (value !== undefined) {
      el.setAttribute(name, value)
      return el
    }
    return el.getAttribute(name)
  }

  el.txt = function(text) {
    el.textContent = text
    return el
  }

  // addClass
  el.addClass = function(names) {
    names.split(' ').forEach(function(name) {
      if (!el.hasClass(name)) el.className += (el.className ? ' ' : '') + name
    })
    return el
  }

  // removeClass
  el.removeClass = function(names) {
    names.split(' ').forEach(function(name) {
      el.className = (el.className || '').replace(name, '').replace(/\s+/g, ' ')
    })
    return el
  }

  // toggleClass
  el.toggleClass = function(names, flag) {
    if (flag === undefined) flag = !el.hasClass(names)
    return flag ? el.addClass(names) : el.removeClass(names)
  }

  // hasClass
  el.hasClass = function(name) {
    var names = (el.className || '').split(' ')
    return names.indexOf(name) >= 0
  }

  return el
}

// for plugins
window.miniquery = $



$.observable = function(el) {

  el.emit = function(name, data) {
    var event = document.createEvent('Event')
    if (data) $.extend(event, data)
    event.initEvent(name, false, false)
    el.dispatchEvent(event) // new CustomEvent(name)
    return el
  }

  el.on = function(events, fn) {
    events.split(' ').forEach(function(name) {
      el.addEventListener(name, fn)
    })
    return el
  }

  el.off = function(event, fn) {
    el.removeEventListener(event, fn)
    return el
  }

  el.one = function(event, fn) {
    function on(e) { el.off(event, on); fn(e) }
    return el.on(event, on)
  }

  return el

}
