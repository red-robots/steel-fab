"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
* jquery.matchHeight.js v0.5.2
* http://brm.io/jquery-match-height/
* License: MIT
*/
;

(function ($) {
  /*
  *  internal
  */
  var _previousResizeWidth = -1,
      _updateTimeout = -1;
  /*
  *  _rows
  *  utility function returns array of jQuery selections representing each row
  *  (as displayed after float wrapping applied by browser)
  */


  var _rows = function _rows(elements) {
    var tolerance = 1,
        $elements = $(elements),
        lastTop = null,
        rows = []; // group elements by their top position

    $elements.each(function () {
      var $that = $(this),
          top = $that.offset().top - _parse($that.css('margin-top')),
          lastRow = rows.length > 0 ? rows[rows.length - 1] : null;

      if (lastRow === null) {
        // first item on the row, so just push it
        rows.push($that);
      } else {
        // if the row top is the same, add to the row group
        if (Math.floor(Math.abs(lastTop - top)) <= tolerance) {
          rows[rows.length - 1] = lastRow.add($that);
        } else {
          // otherwise start a new row group
          rows.push($that);
        }
      } // keep track of the last row top


      lastTop = top;
    });
    return rows;
  };
  /*
  *  _parse
  *  value parse utility function
  */


  var _parse = function _parse(value) {
    // parse value and convert NaN to 0
    return parseFloat(value) || 0;
  };
  /*
  *  _parseOptions
  *  handle plugin options
  */


  var _parseOptions = function _parseOptions(options) {
    var opts = {
      byRow: true,
      remove: false,
      property: 'height'
    };

    if (_typeof(options) === 'object') {
      return $.extend(opts, options);
    }

    if (typeof options === 'boolean') {
      opts.byRow = options;
    } else if (options === 'remove') {
      opts.remove = true;
    }

    return opts;
  };
  /*
  *  matchHeight
  *  plugin definition
  */


  var matchHeight = $.fn.matchHeight = function (options) {
    var opts = _parseOptions(options); // handle remove


    if (opts.remove) {
      var that = this; // remove fixed height from all selected elements

      this.css(opts.property, ''); // remove selected elements from all groups

      $.each(matchHeight._groups, function (key, group) {
        group.elements = group.elements.not(that);
      }); // TODO: cleanup empty groups

      return this;
    }

    if (this.length <= 1) return this; // keep track of this group so we can re-apply later on load and resize events

    matchHeight._groups.push({
      elements: this,
      options: opts
    }); // match each element's height to the tallest element in the selection


    matchHeight._apply(this, opts);

    return this;
  };
  /*
  *  plugin global options
  */


  matchHeight._groups = [];
  matchHeight._throttle = 80;
  matchHeight._maintainScroll = false;
  matchHeight._beforeUpdate = null;
  matchHeight._afterUpdate = null;
  /*
  *  matchHeight._apply
  *  apply matchHeight to given elements
  */

  matchHeight._apply = function (elements, options) {
    var opts = _parseOptions(options),
        $elements = $(elements),
        rows = [$elements]; // take note of scroll position


    var scrollTop = $(window).scrollTop(),
        htmlHeight = $('html').outerHeight(true); // get hidden parents

    var $hiddenParents = $elements.parents().filter(':hidden'); // cache the original inline style

    $hiddenParents.each(function () {
      var $that = $(this);
      $that.data('style-cache', $that.attr('style'));
    }); // temporarily must force hidden parents visible

    $hiddenParents.css('display', 'block'); // get rows if using byRow, otherwise assume one row

    if (opts.byRow) {
      // must first force an arbitrary equal height so floating elements break evenly
      $elements.each(function () {
        var $that = $(this),
            display = $that.css('display') === 'inline-block' ? 'inline-block' : 'block'; // cache the original inline style

        $that.data('style-cache', $that.attr('style'));
        $that.css({
          'display': display,
          'padding-top': '0',
          'padding-bottom': '0',
          'margin-top': '0',
          'margin-bottom': '0',
          'border-top-width': '0',
          'border-bottom-width': '0',
          'height': '100px'
        });
      }); // get the array of rows (based on element top position)

      rows = _rows($elements); // revert original inline styles

      $elements.each(function () {
        var $that = $(this);
        $that.attr('style', $that.data('style-cache') || '');
      });
    }

    $.each(rows, function (key, row) {
      var $row = $(row),
          maxHeight = 0; // skip apply to rows with only one item

      if (opts.byRow && $row.length <= 1) {
        $row.css(opts.property, '');
        return;
      } // iterate the row and find the max height


      $row.each(function () {
        var $that = $(this),
            display = $that.css('display') === 'inline-block' ? 'inline-block' : 'block'; // ensure we get the correct actual height (and not a previously set height value)

        var css = {
          'display': display
        };
        css[opts.property] = '';
        $that.css(css); // find the max height (including padding, but not margin)

        if ($that.outerHeight(false) > maxHeight) maxHeight = $that.outerHeight(false); // revert display block

        $that.css('display', '');
      }); // iterate the row and apply the height to all elements

      $row.each(function () {
        var $that = $(this),
            verticalPadding = 0; // handle padding and border correctly (required when not using border-box)

        if ($that.css('box-sizing') !== 'border-box') {
          verticalPadding += _parse($that.css('border-top-width')) + _parse($that.css('border-bottom-width'));
          verticalPadding += _parse($that.css('padding-top')) + _parse($that.css('padding-bottom'));
        } // set the height (accounting for padding and border)


        $that.css(opts.property, maxHeight - verticalPadding);
      });
    }); // revert hidden parents

    $hiddenParents.each(function () {
      var $that = $(this);
      $that.attr('style', $that.data('style-cache') || null);
    }); // restore scroll position if enabled

    if (matchHeight._maintainScroll) $(window).scrollTop(scrollTop / htmlHeight * $('html').outerHeight(true));
    return this;
  };
  /*
  *  matchHeight._applyDataApi
  *  applies matchHeight to all elements with a data-match-height attribute
  */


  matchHeight._applyDataApi = function () {
    var groups = {}; // generate groups by their groupId set by elements using data-match-height

    $('[data-match-height], [data-mh]').each(function () {
      var $this = $(this),
          groupId = $this.attr('data-match-height') || $this.attr('data-mh');

      if (groupId in groups) {
        groups[groupId] = groups[groupId].add($this);
      } else {
        groups[groupId] = $this;
      }
    }); // apply matchHeight to each group

    $.each(groups, function () {
      this.matchHeight(true);
    });
  };
  /*
  *  matchHeight._update
  *  updates matchHeight on all current groups with their correct options
  */


  var _update = function _update(event) {
    if (matchHeight._beforeUpdate) matchHeight._beforeUpdate(event, matchHeight._groups);
    $.each(matchHeight._groups, function () {
      matchHeight._apply(this.elements, this.options);
    });
    if (matchHeight._afterUpdate) matchHeight._afterUpdate(event, matchHeight._groups);
  };

  matchHeight._update = function (throttle, event) {
    // prevent update if fired from a resize event
    // where the viewport width hasn't actually changed
    // fixes an event looping bug in IE8
    if (event && event.type === 'resize') {
      var windowWidth = $(window).width();
      if (windowWidth === _previousResizeWidth) return;
      _previousResizeWidth = windowWidth;
    } // throttle updates


    if (!throttle) {
      _update(event);
    } else if (_updateTimeout === -1) {
      _updateTimeout = setTimeout(function () {
        _update(event);

        _updateTimeout = -1;
      }, matchHeight._throttle);
    }
  };
  /*
  *  bind events
  */
  // apply on DOM ready event


  $(matchHeight._applyDataApi); // update heights on load and resize events

  $(window).bind('load', function (event) {
    matchHeight._update(false, event);
  }); // throttled update heights on resize events

  $(window).bind('resize orientationchange', function (event) {
    matchHeight._update(true, event);
  });
})(jQuery);
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
  * Bootstrap v4.0.0 (https://getbootstrap.com)
  * Copyright 2011-2018 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
  */
!function (t, e) {
  "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) && "undefined" != typeof module ? e(exports, require("jquery"), require("popper.js")) : "function" == typeof define && define.amd ? define(["exports", "jquery", "popper.js"], e) : e(t.bootstrap = {}, t.jQuery, t.Popper);
}(void 0, function (t, e, n) {
  "use strict";

  function i(t, e) {
    for (var n = 0; n < e.length; n++) {
      var i = e[n];
      i.enumerable = i.enumerable || !1, i.configurable = !0, "value" in i && (i.writable = !0), Object.defineProperty(t, i.key, i);
    }
  }

  function s(t, e, n) {
    return e && i(t.prototype, e), n && i(t, n), t;
  }

  function r() {
    return (r = Object.assign || function (t) {
      for (var e = 1; e < arguments.length; e++) {
        var n = arguments[e];

        for (var i in n) {
          Object.prototype.hasOwnProperty.call(n, i) && (t[i] = n[i]);
        }
      }

      return t;
    }).apply(this, arguments);
  }

  e = e && e.hasOwnProperty("default") ? e.default : e, n = n && n.hasOwnProperty("default") ? n.default : n;

  var o,
      a,
      l,
      h,
      c,
      u,
      f,
      d,
      _,
      g,
      p,
      m,
      v,
      E,
      T,
      y,
      C,
      I,
      A,
      b,
      D,
      S,
      w,
      N,
      O,
      k,
      P = function (t) {
    var e = !1;

    function n(e) {
      var n = this,
          s = !1;
      return t(this).one(i.TRANSITION_END, function () {
        s = !0;
      }), setTimeout(function () {
        s || i.triggerTransitionEnd(n);
      }, e), this;
    }

    var i = {
      TRANSITION_END: "bsTransitionEnd",
      getUID: function getUID(t) {
        do {
          t += ~~(1e6 * Math.random());
        } while (document.getElementById(t));

        return t;
      },
      getSelectorFromElement: function getSelectorFromElement(e) {
        var n,
            i = e.getAttribute("data-target");
        i && "#" !== i || (i = e.getAttribute("href") || ""), "#" === i.charAt(0) && (n = i, i = n = "function" == typeof t.escapeSelector ? t.escapeSelector(n).substr(1) : n.replace(/(:|\.|\[|\]|,|=|@)/g, "\\$1"));

        try {
          return t(document).find(i).length > 0 ? i : null;
        } catch (t) {
          return null;
        }
      },
      reflow: function reflow(t) {
        return t.offsetHeight;
      },
      triggerTransitionEnd: function triggerTransitionEnd(n) {
        t(n).trigger(e.end);
      },
      supportsTransitionEnd: function supportsTransitionEnd() {
        return Boolean(e);
      },
      isElement: function isElement(t) {
        return (t[0] || t).nodeType;
      },
      typeCheckConfig: function typeCheckConfig(t, e, n) {
        for (var s in n) {
          if (Object.prototype.hasOwnProperty.call(n, s)) {
            var r = n[s],
                o = e[s],
                a = o && i.isElement(o) ? "element" : (l = o, {}.toString.call(l).match(/\s([a-zA-Z]+)/)[1].toLowerCase());
            if (!new RegExp(r).test(a)) throw new Error(t.toUpperCase() + ': Option "' + s + '" provided type "' + a + '" but expected type "' + r + '".');
          }
        }

        var l;
      }
    };
    return e = ("undefined" == typeof window || !window.QUnit) && {
      end: "transitionend"
    }, t.fn.emulateTransitionEnd = n, i.supportsTransitionEnd() && (t.event.special[i.TRANSITION_END] = {
      bindType: e.end,
      delegateType: e.end,
      handle: function handle(e) {
        if (t(e.target).is(this)) return e.handleObj.handler.apply(this, arguments);
      }
    }), i;
  }(e),
      L = (a = "alert", h = "." + (l = "bs.alert"), c = (o = e).fn[a], u = {
    CLOSE: "close" + h,
    CLOSED: "closed" + h,
    CLICK_DATA_API: "click" + h + ".data-api"
  }, f = "alert", d = "fade", _ = "show", g = function () {
    function t(t) {
      this._element = t;
    }

    var e = t.prototype;
    return e.close = function (t) {
      t = t || this._element;

      var e = this._getRootElement(t);

      this._triggerCloseEvent(e).isDefaultPrevented() || this._removeElement(e);
    }, e.dispose = function () {
      o.removeData(this._element, l), this._element = null;
    }, e._getRootElement = function (t) {
      var e = P.getSelectorFromElement(t),
          n = !1;
      return e && (n = o(e)[0]), n || (n = o(t).closest("." + f)[0]), n;
    }, e._triggerCloseEvent = function (t) {
      var e = o.Event(u.CLOSE);
      return o(t).trigger(e), e;
    }, e._removeElement = function (t) {
      var e = this;
      o(t).removeClass(_), P.supportsTransitionEnd() && o(t).hasClass(d) ? o(t).one(P.TRANSITION_END, function (n) {
        return e._destroyElement(t, n);
      }).emulateTransitionEnd(150) : this._destroyElement(t);
    }, e._destroyElement = function (t) {
      o(t).detach().trigger(u.CLOSED).remove();
    }, t._jQueryInterface = function (e) {
      return this.each(function () {
        var n = o(this),
            i = n.data(l);
        i || (i = new t(this), n.data(l, i)), "close" === e && i[e](this);
      });
    }, t._handleDismiss = function (t) {
      return function (e) {
        e && e.preventDefault(), t.close(this);
      };
    }, s(t, null, [{
      key: "VERSION",
      get: function get() {
        return "4.0.0";
      }
    }]), t;
  }(), o(document).on(u.CLICK_DATA_API, '[data-dismiss="alert"]', g._handleDismiss(new g())), o.fn[a] = g._jQueryInterface, o.fn[a].Constructor = g, o.fn[a].noConflict = function () {
    return o.fn[a] = c, g._jQueryInterface;
  }, g),
      R = (m = "button", E = "." + (v = "bs.button"), T = ".data-api", y = (p = e).fn[m], C = "active", I = "btn", A = "focus", b = '[data-toggle^="button"]', D = '[data-toggle="buttons"]', S = "input", w = ".active", N = ".btn", O = {
    CLICK_DATA_API: "click" + E + T,
    FOCUS_BLUR_DATA_API: "focus" + E + T + " blur" + E + T
  }, k = function () {
    function t(t) {
      this._element = t;
    }

    var e = t.prototype;
    return e.toggle = function () {
      var t = !0,
          e = !0,
          n = p(this._element).closest(D)[0];

      if (n) {
        var i = p(this._element).find(S)[0];

        if (i) {
          if ("radio" === i.type) if (i.checked && p(this._element).hasClass(C)) t = !1;else {
            var s = p(n).find(w)[0];
            s && p(s).removeClass(C);
          }

          if (t) {
            if (i.hasAttribute("disabled") || n.hasAttribute("disabled") || i.classList.contains("disabled") || n.classList.contains("disabled")) return;
            i.checked = !p(this._element).hasClass(C), p(i).trigger("change");
          }

          i.focus(), e = !1;
        }
      }

      e && this._element.setAttribute("aria-pressed", !p(this._element).hasClass(C)), t && p(this._element).toggleClass(C);
    }, e.dispose = function () {
      p.removeData(this._element, v), this._element = null;
    }, t._jQueryInterface = function (e) {
      return this.each(function () {
        var n = p(this).data(v);
        n || (n = new t(this), p(this).data(v, n)), "toggle" === e && n[e]();
      });
    }, s(t, null, [{
      key: "VERSION",
      get: function get() {
        return "4.0.0";
      }
    }]), t;
  }(), p(document).on(O.CLICK_DATA_API, b, function (t) {
    t.preventDefault();
    var e = t.target;
    p(e).hasClass(I) || (e = p(e).closest(N)), k._jQueryInterface.call(p(e), "toggle");
  }).on(O.FOCUS_BLUR_DATA_API, b, function (t) {
    var e = p(t.target).closest(N)[0];
    p(e).toggleClass(A, /^focus(in)?$/.test(t.type));
  }), p.fn[m] = k._jQueryInterface, p.fn[m].Constructor = k, p.fn[m].noConflict = function () {
    return p.fn[m] = y, k._jQueryInterface;
  }, k),
      j = function (t) {
    var e = "carousel",
        n = "bs.carousel",
        i = "." + n,
        o = t.fn[e],
        a = {
      interval: 5e3,
      keyboard: !0,
      slide: !1,
      pause: "hover",
      wrap: !0
    },
        l = {
      interval: "(number|boolean)",
      keyboard: "boolean",
      slide: "(boolean|string)",
      pause: "(string|boolean)",
      wrap: "boolean"
    },
        h = "next",
        c = "prev",
        u = "left",
        f = "right",
        d = {
      SLIDE: "slide" + i,
      SLID: "slid" + i,
      KEYDOWN: "keydown" + i,
      MOUSEENTER: "mouseenter" + i,
      MOUSELEAVE: "mouseleave" + i,
      TOUCHEND: "touchend" + i,
      LOAD_DATA_API: "load" + i + ".data-api",
      CLICK_DATA_API: "click" + i + ".data-api"
    },
        _ = "carousel",
        g = "active",
        p = "slide",
        m = "carousel-item-right",
        v = "carousel-item-left",
        E = "carousel-item-next",
        T = "carousel-item-prev",
        y = {
      ACTIVE: ".active",
      ACTIVE_ITEM: ".active.carousel-item",
      ITEM: ".carousel-item",
      NEXT_PREV: ".carousel-item-next, .carousel-item-prev",
      INDICATORS: ".carousel-indicators",
      DATA_SLIDE: "[data-slide], [data-slide-to]",
      DATA_RIDE: '[data-ride="carousel"]'
    },
        C = function () {
      function o(e, n) {
        this._items = null, this._interval = null, this._activeElement = null, this._isPaused = !1, this._isSliding = !1, this.touchTimeout = null, this._config = this._getConfig(n), this._element = t(e)[0], this._indicatorsElement = t(this._element).find(y.INDICATORS)[0], this._addEventListeners();
      }

      var C = o.prototype;
      return C.next = function () {
        this._isSliding || this._slide(h);
      }, C.nextWhenVisible = function () {
        !document.hidden && t(this._element).is(":visible") && "hidden" !== t(this._element).css("visibility") && this.next();
      }, C.prev = function () {
        this._isSliding || this._slide(c);
      }, C.pause = function (e) {
        e || (this._isPaused = !0), t(this._element).find(y.NEXT_PREV)[0] && P.supportsTransitionEnd() && (P.triggerTransitionEnd(this._element), this.cycle(!0)), clearInterval(this._interval), this._interval = null;
      }, C.cycle = function (t) {
        t || (this._isPaused = !1), this._interval && (clearInterval(this._interval), this._interval = null), this._config.interval && !this._isPaused && (this._interval = setInterval((document.visibilityState ? this.nextWhenVisible : this.next).bind(this), this._config.interval));
      }, C.to = function (e) {
        var n = this;
        this._activeElement = t(this._element).find(y.ACTIVE_ITEM)[0];

        var i = this._getItemIndex(this._activeElement);

        if (!(e > this._items.length - 1 || e < 0)) if (this._isSliding) t(this._element).one(d.SLID, function () {
          return n.to(e);
        });else {
          if (i === e) return this.pause(), void this.cycle();
          var s = e > i ? h : c;

          this._slide(s, this._items[e]);
        }
      }, C.dispose = function () {
        t(this._element).off(i), t.removeData(this._element, n), this._items = null, this._config = null, this._element = null, this._interval = null, this._isPaused = null, this._isSliding = null, this._activeElement = null, this._indicatorsElement = null;
      }, C._getConfig = function (t) {
        return t = r({}, a, t), P.typeCheckConfig(e, t, l), t;
      }, C._addEventListeners = function () {
        var e = this;
        this._config.keyboard && t(this._element).on(d.KEYDOWN, function (t) {
          return e._keydown(t);
        }), "hover" === this._config.pause && (t(this._element).on(d.MOUSEENTER, function (t) {
          return e.pause(t);
        }).on(d.MOUSELEAVE, function (t) {
          return e.cycle(t);
        }), "ontouchstart" in document.documentElement && t(this._element).on(d.TOUCHEND, function () {
          e.pause(), e.touchTimeout && clearTimeout(e.touchTimeout), e.touchTimeout = setTimeout(function (t) {
            return e.cycle(t);
          }, 500 + e._config.interval);
        }));
      }, C._keydown = function (t) {
        if (!/input|textarea/i.test(t.target.tagName)) switch (t.which) {
          case 37:
            t.preventDefault(), this.prev();
            break;

          case 39:
            t.preventDefault(), this.next();
        }
      }, C._getItemIndex = function (e) {
        return this._items = t.makeArray(t(e).parent().find(y.ITEM)), this._items.indexOf(e);
      }, C._getItemByDirection = function (t, e) {
        var n = t === h,
            i = t === c,
            s = this._getItemIndex(e),
            r = this._items.length - 1;

        if ((i && 0 === s || n && s === r) && !this._config.wrap) return e;
        var o = (s + (t === c ? -1 : 1)) % this._items.length;
        return -1 === o ? this._items[this._items.length - 1] : this._items[o];
      }, C._triggerSlideEvent = function (e, n) {
        var i = this._getItemIndex(e),
            s = this._getItemIndex(t(this._element).find(y.ACTIVE_ITEM)[0]),
            r = t.Event(d.SLIDE, {
          relatedTarget: e,
          direction: n,
          from: s,
          to: i
        });

        return t(this._element).trigger(r), r;
      }, C._setActiveIndicatorElement = function (e) {
        if (this._indicatorsElement) {
          t(this._indicatorsElement).find(y.ACTIVE).removeClass(g);

          var n = this._indicatorsElement.children[this._getItemIndex(e)];

          n && t(n).addClass(g);
        }
      }, C._slide = function (e, n) {
        var i,
            s,
            r,
            o = this,
            a = t(this._element).find(y.ACTIVE_ITEM)[0],
            l = this._getItemIndex(a),
            c = n || a && this._getItemByDirection(e, a),
            _ = this._getItemIndex(c),
            C = Boolean(this._interval);

        if (e === h ? (i = v, s = E, r = u) : (i = m, s = T, r = f), c && t(c).hasClass(g)) this._isSliding = !1;else if (!this._triggerSlideEvent(c, r).isDefaultPrevented() && a && c) {
          this._isSliding = !0, C && this.pause(), this._setActiveIndicatorElement(c);
          var I = t.Event(d.SLID, {
            relatedTarget: c,
            direction: r,
            from: l,
            to: _
          });
          P.supportsTransitionEnd() && t(this._element).hasClass(p) ? (t(c).addClass(s), P.reflow(c), t(a).addClass(i), t(c).addClass(i), t(a).one(P.TRANSITION_END, function () {
            t(c).removeClass(i + " " + s).addClass(g), t(a).removeClass(g + " " + s + " " + i), o._isSliding = !1, setTimeout(function () {
              return t(o._element).trigger(I);
            }, 0);
          }).emulateTransitionEnd(600)) : (t(a).removeClass(g), t(c).addClass(g), this._isSliding = !1, t(this._element).trigger(I)), C && this.cycle();
        }
      }, o._jQueryInterface = function (e) {
        return this.each(function () {
          var i = t(this).data(n),
              s = r({}, a, t(this).data());
          "object" == _typeof(e) && (s = r({}, s, e));
          var l = "string" == typeof e ? e : s.slide;
          if (i || (i = new o(this, s), t(this).data(n, i)), "number" == typeof e) i.to(e);else if ("string" == typeof l) {
            if ("undefined" == typeof i[l]) throw new TypeError('No method named "' + l + '"');
            i[l]();
          } else s.interval && (i.pause(), i.cycle());
        });
      }, o._dataApiClickHandler = function (e) {
        var i = P.getSelectorFromElement(this);

        if (i) {
          var s = t(i)[0];

          if (s && t(s).hasClass(_)) {
            var a = r({}, t(s).data(), t(this).data()),
                l = this.getAttribute("data-slide-to");
            l && (a.interval = !1), o._jQueryInterface.call(t(s), a), l && t(s).data(n).to(l), e.preventDefault();
          }
        }
      }, s(o, null, [{
        key: "VERSION",
        get: function get() {
          return "4.0.0";
        }
      }, {
        key: "Default",
        get: function get() {
          return a;
        }
      }]), o;
    }();

    return t(document).on(d.CLICK_DATA_API, y.DATA_SLIDE, C._dataApiClickHandler), t(window).on(d.LOAD_DATA_API, function () {
      t(y.DATA_RIDE).each(function () {
        var e = t(this);

        C._jQueryInterface.call(e, e.data());
      });
    }), t.fn[e] = C._jQueryInterface, t.fn[e].Constructor = C, t.fn[e].noConflict = function () {
      return t.fn[e] = o, C._jQueryInterface;
    }, C;
  }(e),
      H = function (t) {
    var e = "collapse",
        n = "bs.collapse",
        i = "." + n,
        o = t.fn[e],
        a = {
      toggle: !0,
      parent: ""
    },
        l = {
      toggle: "boolean",
      parent: "(string|element)"
    },
        h = {
      SHOW: "show" + i,
      SHOWN: "shown" + i,
      HIDE: "hide" + i,
      HIDDEN: "hidden" + i,
      CLICK_DATA_API: "click" + i + ".data-api"
    },
        c = "show",
        u = "collapse",
        f = "collapsing",
        d = "collapsed",
        _ = "width",
        g = "height",
        p = {
      ACTIVES: ".show, .collapsing",
      DATA_TOGGLE: '[data-toggle="collapse"]'
    },
        m = function () {
      function i(e, n) {
        this._isTransitioning = !1, this._element = e, this._config = this._getConfig(n), this._triggerArray = t.makeArray(t('[data-toggle="collapse"][href="#' + e.id + '"],[data-toggle="collapse"][data-target="#' + e.id + '"]'));

        for (var i = t(p.DATA_TOGGLE), s = 0; s < i.length; s++) {
          var r = i[s],
              o = P.getSelectorFromElement(r);
          null !== o && t(o).filter(e).length > 0 && (this._selector = o, this._triggerArray.push(r));
        }

        this._parent = this._config.parent ? this._getParent() : null, this._config.parent || this._addAriaAndCollapsedClass(this._element, this._triggerArray), this._config.toggle && this.toggle();
      }

      var o = i.prototype;
      return o.toggle = function () {
        t(this._element).hasClass(c) ? this.hide() : this.show();
      }, o.show = function () {
        var e,
            s,
            r = this;

        if (!this._isTransitioning && !t(this._element).hasClass(c) && (this._parent && 0 === (e = t.makeArray(t(this._parent).find(p.ACTIVES).filter('[data-parent="' + this._config.parent + '"]'))).length && (e = null), !(e && (s = t(e).not(this._selector).data(n)) && s._isTransitioning))) {
          var o = t.Event(h.SHOW);

          if (t(this._element).trigger(o), !o.isDefaultPrevented()) {
            e && (i._jQueryInterface.call(t(e).not(this._selector), "hide"), s || t(e).data(n, null));

            var a = this._getDimension();

            t(this._element).removeClass(u).addClass(f), this._element.style[a] = 0, this._triggerArray.length > 0 && t(this._triggerArray).removeClass(d).attr("aria-expanded", !0), this.setTransitioning(!0);

            var l = function l() {
              t(r._element).removeClass(f).addClass(u).addClass(c), r._element.style[a] = "", r.setTransitioning(!1), t(r._element).trigger(h.SHOWN);
            };

            if (P.supportsTransitionEnd()) {
              var _ = "scroll" + (a[0].toUpperCase() + a.slice(1));

              t(this._element).one(P.TRANSITION_END, l).emulateTransitionEnd(600), this._element.style[a] = this._element[_] + "px";
            } else l();
          }
        }
      }, o.hide = function () {
        var e = this;

        if (!this._isTransitioning && t(this._element).hasClass(c)) {
          var n = t.Event(h.HIDE);

          if (t(this._element).trigger(n), !n.isDefaultPrevented()) {
            var i = this._getDimension();

            if (this._element.style[i] = this._element.getBoundingClientRect()[i] + "px", P.reflow(this._element), t(this._element).addClass(f).removeClass(u).removeClass(c), this._triggerArray.length > 0) for (var s = 0; s < this._triggerArray.length; s++) {
              var r = this._triggerArray[s],
                  o = P.getSelectorFromElement(r);
              if (null !== o) t(o).hasClass(c) || t(r).addClass(d).attr("aria-expanded", !1);
            }
            this.setTransitioning(!0);

            var a = function a() {
              e.setTransitioning(!1), t(e._element).removeClass(f).addClass(u).trigger(h.HIDDEN);
            };

            this._element.style[i] = "", P.supportsTransitionEnd() ? t(this._element).one(P.TRANSITION_END, a).emulateTransitionEnd(600) : a();
          }
        }
      }, o.setTransitioning = function (t) {
        this._isTransitioning = t;
      }, o.dispose = function () {
        t.removeData(this._element, n), this._config = null, this._parent = null, this._element = null, this._triggerArray = null, this._isTransitioning = null;
      }, o._getConfig = function (t) {
        return (t = r({}, a, t)).toggle = Boolean(t.toggle), P.typeCheckConfig(e, t, l), t;
      }, o._getDimension = function () {
        return t(this._element).hasClass(_) ? _ : g;
      }, o._getParent = function () {
        var e = this,
            n = null;
        P.isElement(this._config.parent) ? (n = this._config.parent, "undefined" != typeof this._config.parent.jquery && (n = this._config.parent[0])) : n = t(this._config.parent)[0];
        var s = '[data-toggle="collapse"][data-parent="' + this._config.parent + '"]';
        return t(n).find(s).each(function (t, n) {
          e._addAriaAndCollapsedClass(i._getTargetFromElement(n), [n]);
        }), n;
      }, o._addAriaAndCollapsedClass = function (e, n) {
        if (e) {
          var i = t(e).hasClass(c);
          n.length > 0 && t(n).toggleClass(d, !i).attr("aria-expanded", i);
        }
      }, i._getTargetFromElement = function (e) {
        var n = P.getSelectorFromElement(e);
        return n ? t(n)[0] : null;
      }, i._jQueryInterface = function (e) {
        return this.each(function () {
          var s = t(this),
              o = s.data(n),
              l = r({}, a, s.data(), "object" == _typeof(e) && e);

          if (!o && l.toggle && /show|hide/.test(e) && (l.toggle = !1), o || (o = new i(this, l), s.data(n, o)), "string" == typeof e) {
            if ("undefined" == typeof o[e]) throw new TypeError('No method named "' + e + '"');
            o[e]();
          }
        });
      }, s(i, null, [{
        key: "VERSION",
        get: function get() {
          return "4.0.0";
        }
      }, {
        key: "Default",
        get: function get() {
          return a;
        }
      }]), i;
    }();

    return t(document).on(h.CLICK_DATA_API, p.DATA_TOGGLE, function (e) {
      "A" === e.currentTarget.tagName && e.preventDefault();
      var i = t(this),
          s = P.getSelectorFromElement(this);
      t(s).each(function () {
        var e = t(this),
            s = e.data(n) ? "toggle" : i.data();

        m._jQueryInterface.call(e, s);
      });
    }), t.fn[e] = m._jQueryInterface, t.fn[e].Constructor = m, t.fn[e].noConflict = function () {
      return t.fn[e] = o, m._jQueryInterface;
    }, m;
  }(e),
      W = function (t) {
    var e = "dropdown",
        i = "bs.dropdown",
        o = "." + i,
        a = ".data-api",
        l = t.fn[e],
        h = new RegExp("38|40|27"),
        c = {
      HIDE: "hide" + o,
      HIDDEN: "hidden" + o,
      SHOW: "show" + o,
      SHOWN: "shown" + o,
      CLICK: "click" + o,
      CLICK_DATA_API: "click" + o + a,
      KEYDOWN_DATA_API: "keydown" + o + a,
      KEYUP_DATA_API: "keyup" + o + a
    },
        u = "disabled",
        f = "show",
        d = "dropup",
        _ = "dropright",
        g = "dropleft",
        p = "dropdown-menu-right",
        m = "dropdown-menu-left",
        v = "position-static",
        E = '[data-toggle="dropdown"]',
        T = ".dropdown form",
        y = ".dropdown-menu",
        C = ".navbar-nav",
        I = ".dropdown-menu .dropdown-item:not(.disabled)",
        A = "top-start",
        b = "top-end",
        D = "bottom-start",
        S = "bottom-end",
        w = "right-start",
        N = "left-start",
        O = {
      offset: 0,
      flip: !0,
      boundary: "scrollParent"
    },
        k = {
      offset: "(number|string|function)",
      flip: "boolean",
      boundary: "(string|element)"
    },
        L = function () {
      function a(t, e) {
        this._element = t, this._popper = null, this._config = this._getConfig(e), this._menu = this._getMenuElement(), this._inNavbar = this._detectNavbar(), this._addEventListeners();
      }

      var l = a.prototype;
      return l.toggle = function () {
        if (!this._element.disabled && !t(this._element).hasClass(u)) {
          var e = a._getParentFromElement(this._element),
              i = t(this._menu).hasClass(f);

          if (a._clearMenus(), !i) {
            var s = {
              relatedTarget: this._element
            },
                r = t.Event(c.SHOW, s);

            if (t(e).trigger(r), !r.isDefaultPrevented()) {
              if (!this._inNavbar) {
                if ("undefined" == typeof n) throw new TypeError("Bootstrap dropdown require Popper.js (https://popper.js.org)");
                var o = this._element;
                t(e).hasClass(d) && (t(this._menu).hasClass(m) || t(this._menu).hasClass(p)) && (o = e), "scrollParent" !== this._config.boundary && t(e).addClass(v), this._popper = new n(o, this._menu, this._getPopperConfig());
              }

              "ontouchstart" in document.documentElement && 0 === t(e).closest(C).length && t("body").children().on("mouseover", null, t.noop), this._element.focus(), this._element.setAttribute("aria-expanded", !0), t(this._menu).toggleClass(f), t(e).toggleClass(f).trigger(t.Event(c.SHOWN, s));
            }
          }
        }
      }, l.dispose = function () {
        t.removeData(this._element, i), t(this._element).off(o), this._element = null, this._menu = null, null !== this._popper && (this._popper.destroy(), this._popper = null);
      }, l.update = function () {
        this._inNavbar = this._detectNavbar(), null !== this._popper && this._popper.scheduleUpdate();
      }, l._addEventListeners = function () {
        var e = this;
        t(this._element).on(c.CLICK, function (t) {
          t.preventDefault(), t.stopPropagation(), e.toggle();
        });
      }, l._getConfig = function (n) {
        return n = r({}, this.constructor.Default, t(this._element).data(), n), P.typeCheckConfig(e, n, this.constructor.DefaultType), n;
      }, l._getMenuElement = function () {
        if (!this._menu) {
          var e = a._getParentFromElement(this._element);

          this._menu = t(e).find(y)[0];
        }

        return this._menu;
      }, l._getPlacement = function () {
        var e = t(this._element).parent(),
            n = D;
        return e.hasClass(d) ? (n = A, t(this._menu).hasClass(p) && (n = b)) : e.hasClass(_) ? n = w : e.hasClass(g) ? n = N : t(this._menu).hasClass(p) && (n = S), n;
      }, l._detectNavbar = function () {
        return t(this._element).closest(".navbar").length > 0;
      }, l._getPopperConfig = function () {
        var t = this,
            e = {};
        return "function" == typeof this._config.offset ? e.fn = function (e) {
          return e.offsets = r({}, e.offsets, t._config.offset(e.offsets) || {}), e;
        } : e.offset = this._config.offset, {
          placement: this._getPlacement(),
          modifiers: {
            offset: e,
            flip: {
              enabled: this._config.flip
            },
            preventOverflow: {
              boundariesElement: this._config.boundary
            }
          }
        };
      }, a._jQueryInterface = function (e) {
        return this.each(function () {
          var n = t(this).data(i);

          if (n || (n = new a(this, "object" == _typeof(e) ? e : null), t(this).data(i, n)), "string" == typeof e) {
            if ("undefined" == typeof n[e]) throw new TypeError('No method named "' + e + '"');
            n[e]();
          }
        });
      }, a._clearMenus = function (e) {
        if (!e || 3 !== e.which && ("keyup" !== e.type || 9 === e.which)) for (var n = t.makeArray(t(E)), s = 0; s < n.length; s++) {
          var r = a._getParentFromElement(n[s]),
              o = t(n[s]).data(i),
              l = {
            relatedTarget: n[s]
          };

          if (o) {
            var h = o._menu;

            if (t(r).hasClass(f) && !(e && ("click" === e.type && /input|textarea/i.test(e.target.tagName) || "keyup" === e.type && 9 === e.which) && t.contains(r, e.target))) {
              var u = t.Event(c.HIDE, l);
              t(r).trigger(u), u.isDefaultPrevented() || ("ontouchstart" in document.documentElement && t("body").children().off("mouseover", null, t.noop), n[s].setAttribute("aria-expanded", "false"), t(h).removeClass(f), t(r).removeClass(f).trigger(t.Event(c.HIDDEN, l)));
            }
          }
        }
      }, a._getParentFromElement = function (e) {
        var n,
            i = P.getSelectorFromElement(e);
        return i && (n = t(i)[0]), n || e.parentNode;
      }, a._dataApiKeydownHandler = function (e) {
        if ((/input|textarea/i.test(e.target.tagName) ? !(32 === e.which || 27 !== e.which && (40 !== e.which && 38 !== e.which || t(e.target).closest(y).length)) : h.test(e.which)) && (e.preventDefault(), e.stopPropagation(), !this.disabled && !t(this).hasClass(u))) {
          var n = a._getParentFromElement(this),
              i = t(n).hasClass(f);

          if ((i || 27 === e.which && 32 === e.which) && (!i || 27 !== e.which && 32 !== e.which)) {
            var s = t(n).find(I).get();

            if (0 !== s.length) {
              var r = s.indexOf(e.target);
              38 === e.which && r > 0 && r--, 40 === e.which && r < s.length - 1 && r++, r < 0 && (r = 0), s[r].focus();
            }
          } else {
            if (27 === e.which) {
              var o = t(n).find(E)[0];
              t(o).trigger("focus");
            }

            t(this).trigger("click");
          }
        }
      }, s(a, null, [{
        key: "VERSION",
        get: function get() {
          return "4.0.0";
        }
      }, {
        key: "Default",
        get: function get() {
          return O;
        }
      }, {
        key: "DefaultType",
        get: function get() {
          return k;
        }
      }]), a;
    }();

    return t(document).on(c.KEYDOWN_DATA_API, E, L._dataApiKeydownHandler).on(c.KEYDOWN_DATA_API, y, L._dataApiKeydownHandler).on(c.CLICK_DATA_API + " " + c.KEYUP_DATA_API, L._clearMenus).on(c.CLICK_DATA_API, E, function (e) {
      e.preventDefault(), e.stopPropagation(), L._jQueryInterface.call(t(this), "toggle");
    }).on(c.CLICK_DATA_API, T, function (t) {
      t.stopPropagation();
    }), t.fn[e] = L._jQueryInterface, t.fn[e].Constructor = L, t.fn[e].noConflict = function () {
      return t.fn[e] = l, L._jQueryInterface;
    }, L;
  }(e),
      M = function (t) {
    var e = "modal",
        n = "bs.modal",
        i = "." + n,
        o = t.fn.modal,
        a = {
      backdrop: !0,
      keyboard: !0,
      focus: !0,
      show: !0
    },
        l = {
      backdrop: "(boolean|string)",
      keyboard: "boolean",
      focus: "boolean",
      show: "boolean"
    },
        h = {
      HIDE: "hide" + i,
      HIDDEN: "hidden" + i,
      SHOW: "show" + i,
      SHOWN: "shown" + i,
      FOCUSIN: "focusin" + i,
      RESIZE: "resize" + i,
      CLICK_DISMISS: "click.dismiss" + i,
      KEYDOWN_DISMISS: "keydown.dismiss" + i,
      MOUSEUP_DISMISS: "mouseup.dismiss" + i,
      MOUSEDOWN_DISMISS: "mousedown.dismiss" + i,
      CLICK_DATA_API: "click" + i + ".data-api"
    },
        c = "modal-scrollbar-measure",
        u = "modal-backdrop",
        f = "modal-open",
        d = "fade",
        _ = "show",
        g = {
      DIALOG: ".modal-dialog",
      DATA_TOGGLE: '[data-toggle="modal"]',
      DATA_DISMISS: '[data-dismiss="modal"]',
      FIXED_CONTENT: ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top",
      STICKY_CONTENT: ".sticky-top",
      NAVBAR_TOGGLER: ".navbar-toggler"
    },
        p = function () {
      function o(e, n) {
        this._config = this._getConfig(n), this._element = e, this._dialog = t(e).find(g.DIALOG)[0], this._backdrop = null, this._isShown = !1, this._isBodyOverflowing = !1, this._ignoreBackdropClick = !1, this._originalBodyPadding = 0, this._scrollbarWidth = 0;
      }

      var p = o.prototype;
      return p.toggle = function (t) {
        return this._isShown ? this.hide() : this.show(t);
      }, p.show = function (e) {
        var n = this;

        if (!this._isTransitioning && !this._isShown) {
          P.supportsTransitionEnd() && t(this._element).hasClass(d) && (this._isTransitioning = !0);
          var i = t.Event(h.SHOW, {
            relatedTarget: e
          });
          t(this._element).trigger(i), this._isShown || i.isDefaultPrevented() || (this._isShown = !0, this._checkScrollbar(), this._setScrollbar(), this._adjustDialog(), t(document.body).addClass(f), this._setEscapeEvent(), this._setResizeEvent(), t(this._element).on(h.CLICK_DISMISS, g.DATA_DISMISS, function (t) {
            return n.hide(t);
          }), t(this._dialog).on(h.MOUSEDOWN_DISMISS, function () {
            t(n._element).one(h.MOUSEUP_DISMISS, function (e) {
              t(e.target).is(n._element) && (n._ignoreBackdropClick = !0);
            });
          }), this._showBackdrop(function () {
            return n._showElement(e);
          }));
        }
      }, p.hide = function (e) {
        var n = this;

        if (e && e.preventDefault(), !this._isTransitioning && this._isShown) {
          var i = t.Event(h.HIDE);

          if (t(this._element).trigger(i), this._isShown && !i.isDefaultPrevented()) {
            this._isShown = !1;
            var s = P.supportsTransitionEnd() && t(this._element).hasClass(d);
            s && (this._isTransitioning = !0), this._setEscapeEvent(), this._setResizeEvent(), t(document).off(h.FOCUSIN), t(this._element).removeClass(_), t(this._element).off(h.CLICK_DISMISS), t(this._dialog).off(h.MOUSEDOWN_DISMISS), s ? t(this._element).one(P.TRANSITION_END, function (t) {
              return n._hideModal(t);
            }).emulateTransitionEnd(300) : this._hideModal();
          }
        }
      }, p.dispose = function () {
        t.removeData(this._element, n), t(window, document, this._element, this._backdrop).off(i), this._config = null, this._element = null, this._dialog = null, this._backdrop = null, this._isShown = null, this._isBodyOverflowing = null, this._ignoreBackdropClick = null, this._scrollbarWidth = null;
      }, p.handleUpdate = function () {
        this._adjustDialog();
      }, p._getConfig = function (t) {
        return t = r({}, a, t), P.typeCheckConfig(e, t, l), t;
      }, p._showElement = function (e) {
        var n = this,
            i = P.supportsTransitionEnd() && t(this._element).hasClass(d);
        this._element.parentNode && this._element.parentNode.nodeType === Node.ELEMENT_NODE || document.body.appendChild(this._element), this._element.style.display = "block", this._element.removeAttribute("aria-hidden"), this._element.scrollTop = 0, i && P.reflow(this._element), t(this._element).addClass(_), this._config.focus && this._enforceFocus();

        var s = t.Event(h.SHOWN, {
          relatedTarget: e
        }),
            r = function r() {
          n._config.focus && n._element.focus(), n._isTransitioning = !1, t(n._element).trigger(s);
        };

        i ? t(this._dialog).one(P.TRANSITION_END, r).emulateTransitionEnd(300) : r();
      }, p._enforceFocus = function () {
        var e = this;
        t(document).off(h.FOCUSIN).on(h.FOCUSIN, function (n) {
          document !== n.target && e._element !== n.target && 0 === t(e._element).has(n.target).length && e._element.focus();
        });
      }, p._setEscapeEvent = function () {
        var e = this;
        this._isShown && this._config.keyboard ? t(this._element).on(h.KEYDOWN_DISMISS, function (t) {
          27 === t.which && (t.preventDefault(), e.hide());
        }) : this._isShown || t(this._element).off(h.KEYDOWN_DISMISS);
      }, p._setResizeEvent = function () {
        var e = this;
        this._isShown ? t(window).on(h.RESIZE, function (t) {
          return e.handleUpdate(t);
        }) : t(window).off(h.RESIZE);
      }, p._hideModal = function () {
        var e = this;
        this._element.style.display = "none", this._element.setAttribute("aria-hidden", !0), this._isTransitioning = !1, this._showBackdrop(function () {
          t(document.body).removeClass(f), e._resetAdjustments(), e._resetScrollbar(), t(e._element).trigger(h.HIDDEN);
        });
      }, p._removeBackdrop = function () {
        this._backdrop && (t(this._backdrop).remove(), this._backdrop = null);
      }, p._showBackdrop = function (e) {
        var n = this,
            i = t(this._element).hasClass(d) ? d : "";

        if (this._isShown && this._config.backdrop) {
          var s = P.supportsTransitionEnd() && i;
          if (this._backdrop = document.createElement("div"), this._backdrop.className = u, i && t(this._backdrop).addClass(i), t(this._backdrop).appendTo(document.body), t(this._element).on(h.CLICK_DISMISS, function (t) {
            n._ignoreBackdropClick ? n._ignoreBackdropClick = !1 : t.target === t.currentTarget && ("static" === n._config.backdrop ? n._element.focus() : n.hide());
          }), s && P.reflow(this._backdrop), t(this._backdrop).addClass(_), !e) return;
          if (!s) return void e();
          t(this._backdrop).one(P.TRANSITION_END, e).emulateTransitionEnd(150);
        } else if (!this._isShown && this._backdrop) {
          t(this._backdrop).removeClass(_);

          var r = function r() {
            n._removeBackdrop(), e && e();
          };

          P.supportsTransitionEnd() && t(this._element).hasClass(d) ? t(this._backdrop).one(P.TRANSITION_END, r).emulateTransitionEnd(150) : r();
        } else e && e();
      }, p._adjustDialog = function () {
        var t = this._element.scrollHeight > document.documentElement.clientHeight;
        !this._isBodyOverflowing && t && (this._element.style.paddingLeft = this._scrollbarWidth + "px"), this._isBodyOverflowing && !t && (this._element.style.paddingRight = this._scrollbarWidth + "px");
      }, p._resetAdjustments = function () {
        this._element.style.paddingLeft = "", this._element.style.paddingRight = "";
      }, p._checkScrollbar = function () {
        var t = document.body.getBoundingClientRect();
        this._isBodyOverflowing = t.left + t.right < window.innerWidth, this._scrollbarWidth = this._getScrollbarWidth();
      }, p._setScrollbar = function () {
        var e = this;

        if (this._isBodyOverflowing) {
          t(g.FIXED_CONTENT).each(function (n, i) {
            var s = t(i)[0].style.paddingRight,
                r = t(i).css("padding-right");
            t(i).data("padding-right", s).css("padding-right", parseFloat(r) + e._scrollbarWidth + "px");
          }), t(g.STICKY_CONTENT).each(function (n, i) {
            var s = t(i)[0].style.marginRight,
                r = t(i).css("margin-right");
            t(i).data("margin-right", s).css("margin-right", parseFloat(r) - e._scrollbarWidth + "px");
          }), t(g.NAVBAR_TOGGLER).each(function (n, i) {
            var s = t(i)[0].style.marginRight,
                r = t(i).css("margin-right");
            t(i).data("margin-right", s).css("margin-right", parseFloat(r) + e._scrollbarWidth + "px");
          });
          var n = document.body.style.paddingRight,
              i = t("body").css("padding-right");
          t("body").data("padding-right", n).css("padding-right", parseFloat(i) + this._scrollbarWidth + "px");
        }
      }, p._resetScrollbar = function () {
        t(g.FIXED_CONTENT).each(function (e, n) {
          var i = t(n).data("padding-right");
          "undefined" != typeof i && t(n).css("padding-right", i).removeData("padding-right");
        }), t(g.STICKY_CONTENT + ", " + g.NAVBAR_TOGGLER).each(function (e, n) {
          var i = t(n).data("margin-right");
          "undefined" != typeof i && t(n).css("margin-right", i).removeData("margin-right");
        });
        var e = t("body").data("padding-right");
        "undefined" != typeof e && t("body").css("padding-right", e).removeData("padding-right");
      }, p._getScrollbarWidth = function () {
        var t = document.createElement("div");
        t.className = c, document.body.appendChild(t);
        var e = t.getBoundingClientRect().width - t.clientWidth;
        return document.body.removeChild(t), e;
      }, o._jQueryInterface = function (e, i) {
        return this.each(function () {
          var s = t(this).data(n),
              a = r({}, o.Default, t(this).data(), "object" == _typeof(e) && e);

          if (s || (s = new o(this, a), t(this).data(n, s)), "string" == typeof e) {
            if ("undefined" == typeof s[e]) throw new TypeError('No method named "' + e + '"');
            s[e](i);
          } else a.show && s.show(i);
        });
      }, s(o, null, [{
        key: "VERSION",
        get: function get() {
          return "4.0.0";
        }
      }, {
        key: "Default",
        get: function get() {
          return a;
        }
      }]), o;
    }();

    return t(document).on(h.CLICK_DATA_API, g.DATA_TOGGLE, function (e) {
      var i,
          s = this,
          o = P.getSelectorFromElement(this);
      o && (i = t(o)[0]);
      var a = t(i).data(n) ? "toggle" : r({}, t(i).data(), t(this).data());
      "A" !== this.tagName && "AREA" !== this.tagName || e.preventDefault();
      var l = t(i).one(h.SHOW, function (e) {
        e.isDefaultPrevented() || l.one(h.HIDDEN, function () {
          t(s).is(":visible") && s.focus();
        });
      });

      p._jQueryInterface.call(t(i), a, this);
    }), t.fn.modal = p._jQueryInterface, t.fn.modal.Constructor = p, t.fn.modal.noConflict = function () {
      return t.fn.modal = o, p._jQueryInterface;
    }, p;
  }(e),
      U = function (t) {
    var e = "tooltip",
        i = "bs.tooltip",
        o = "." + i,
        a = t.fn[e],
        l = new RegExp("(^|\\s)bs-tooltip\\S+", "g"),
        h = {
      animation: "boolean",
      template: "string",
      title: "(string|element|function)",
      trigger: "string",
      delay: "(number|object)",
      html: "boolean",
      selector: "(string|boolean)",
      placement: "(string|function)",
      offset: "(number|string)",
      container: "(string|element|boolean)",
      fallbackPlacement: "(string|array)",
      boundary: "(string|element)"
    },
        c = {
      AUTO: "auto",
      TOP: "top",
      RIGHT: "right",
      BOTTOM: "bottom",
      LEFT: "left"
    },
        u = {
      animation: !0,
      template: '<div class="tooltip" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>',
      trigger: "hover focus",
      title: "",
      delay: 0,
      html: !1,
      selector: !1,
      placement: "top",
      offset: 0,
      container: !1,
      fallbackPlacement: "flip",
      boundary: "scrollParent"
    },
        f = "show",
        d = "out",
        _ = {
      HIDE: "hide" + o,
      HIDDEN: "hidden" + o,
      SHOW: "show" + o,
      SHOWN: "shown" + o,
      INSERTED: "inserted" + o,
      CLICK: "click" + o,
      FOCUSIN: "focusin" + o,
      FOCUSOUT: "focusout" + o,
      MOUSEENTER: "mouseenter" + o,
      MOUSELEAVE: "mouseleave" + o
    },
        g = "fade",
        p = "show",
        m = ".tooltip-inner",
        v = ".arrow",
        E = "hover",
        T = "focus",
        y = "click",
        C = "manual",
        I = function () {
      function a(t, e) {
        if ("undefined" == typeof n) throw new TypeError("Bootstrap tooltips require Popper.js (https://popper.js.org)");
        this._isEnabled = !0, this._timeout = 0, this._hoverState = "", this._activeTrigger = {}, this._popper = null, this.element = t, this.config = this._getConfig(e), this.tip = null, this._setListeners();
      }

      var I = a.prototype;
      return I.enable = function () {
        this._isEnabled = !0;
      }, I.disable = function () {
        this._isEnabled = !1;
      }, I.toggleEnabled = function () {
        this._isEnabled = !this._isEnabled;
      }, I.toggle = function (e) {
        if (this._isEnabled) if (e) {
          var n = this.constructor.DATA_KEY,
              i = t(e.currentTarget).data(n);
          i || (i = new this.constructor(e.currentTarget, this._getDelegateConfig()), t(e.currentTarget).data(n, i)), i._activeTrigger.click = !i._activeTrigger.click, i._isWithActiveTrigger() ? i._enter(null, i) : i._leave(null, i);
        } else {
          if (t(this.getTipElement()).hasClass(p)) return void this._leave(null, this);

          this._enter(null, this);
        }
      }, I.dispose = function () {
        clearTimeout(this._timeout), t.removeData(this.element, this.constructor.DATA_KEY), t(this.element).off(this.constructor.EVENT_KEY), t(this.element).closest(".modal").off("hide.bs.modal"), this.tip && t(this.tip).remove(), this._isEnabled = null, this._timeout = null, this._hoverState = null, this._activeTrigger = null, null !== this._popper && this._popper.destroy(), this._popper = null, this.element = null, this.config = null, this.tip = null;
      }, I.show = function () {
        var e = this;
        if ("none" === t(this.element).css("display")) throw new Error("Please use show on visible elements");
        var i = t.Event(this.constructor.Event.SHOW);

        if (this.isWithContent() && this._isEnabled) {
          t(this.element).trigger(i);
          var s = t.contains(this.element.ownerDocument.documentElement, this.element);
          if (i.isDefaultPrevented() || !s) return;
          var r = this.getTipElement(),
              o = P.getUID(this.constructor.NAME);
          r.setAttribute("id", o), this.element.setAttribute("aria-describedby", o), this.setContent(), this.config.animation && t(r).addClass(g);

          var l = "function" == typeof this.config.placement ? this.config.placement.call(this, r, this.element) : this.config.placement,
              h = this._getAttachment(l);

          this.addAttachmentClass(h);
          var c = !1 === this.config.container ? document.body : t(this.config.container);
          t(r).data(this.constructor.DATA_KEY, this), t.contains(this.element.ownerDocument.documentElement, this.tip) || t(r).appendTo(c), t(this.element).trigger(this.constructor.Event.INSERTED), this._popper = new n(this.element, r, {
            placement: h,
            modifiers: {
              offset: {
                offset: this.config.offset
              },
              flip: {
                behavior: this.config.fallbackPlacement
              },
              arrow: {
                element: v
              },
              preventOverflow: {
                boundariesElement: this.config.boundary
              }
            },
            onCreate: function onCreate(t) {
              t.originalPlacement !== t.placement && e._handlePopperPlacementChange(t);
            },
            onUpdate: function onUpdate(t) {
              e._handlePopperPlacementChange(t);
            }
          }), t(r).addClass(p), "ontouchstart" in document.documentElement && t("body").children().on("mouseover", null, t.noop);

          var u = function u() {
            e.config.animation && e._fixTransition();
            var n = e._hoverState;
            e._hoverState = null, t(e.element).trigger(e.constructor.Event.SHOWN), n === d && e._leave(null, e);
          };

          P.supportsTransitionEnd() && t(this.tip).hasClass(g) ? t(this.tip).one(P.TRANSITION_END, u).emulateTransitionEnd(a._TRANSITION_DURATION) : u();
        }
      }, I.hide = function (e) {
        var n = this,
            i = this.getTipElement(),
            s = t.Event(this.constructor.Event.HIDE),
            r = function r() {
          n._hoverState !== f && i.parentNode && i.parentNode.removeChild(i), n._cleanTipClass(), n.element.removeAttribute("aria-describedby"), t(n.element).trigger(n.constructor.Event.HIDDEN), null !== n._popper && n._popper.destroy(), e && e();
        };

        t(this.element).trigger(s), s.isDefaultPrevented() || (t(i).removeClass(p), "ontouchstart" in document.documentElement && t("body").children().off("mouseover", null, t.noop), this._activeTrigger[y] = !1, this._activeTrigger[T] = !1, this._activeTrigger[E] = !1, P.supportsTransitionEnd() && t(this.tip).hasClass(g) ? t(i).one(P.TRANSITION_END, r).emulateTransitionEnd(150) : r(), this._hoverState = "");
      }, I.update = function () {
        null !== this._popper && this._popper.scheduleUpdate();
      }, I.isWithContent = function () {
        return Boolean(this.getTitle());
      }, I.addAttachmentClass = function (e) {
        t(this.getTipElement()).addClass("bs-tooltip-" + e);
      }, I.getTipElement = function () {
        return this.tip = this.tip || t(this.config.template)[0], this.tip;
      }, I.setContent = function () {
        var e = t(this.getTipElement());
        this.setElementContent(e.find(m), this.getTitle()), e.removeClass(g + " " + p);
      }, I.setElementContent = function (e, n) {
        var i = this.config.html;
        "object" == _typeof(n) && (n.nodeType || n.jquery) ? i ? t(n).parent().is(e) || e.empty().append(n) : e.text(t(n).text()) : e[i ? "html" : "text"](n);
      }, I.getTitle = function () {
        var t = this.element.getAttribute("data-original-title");
        return t || (t = "function" == typeof this.config.title ? this.config.title.call(this.element) : this.config.title), t;
      }, I._getAttachment = function (t) {
        return c[t.toUpperCase()];
      }, I._setListeners = function () {
        var e = this;
        this.config.trigger.split(" ").forEach(function (n) {
          if ("click" === n) t(e.element).on(e.constructor.Event.CLICK, e.config.selector, function (t) {
            return e.toggle(t);
          });else if (n !== C) {
            var i = n === E ? e.constructor.Event.MOUSEENTER : e.constructor.Event.FOCUSIN,
                s = n === E ? e.constructor.Event.MOUSELEAVE : e.constructor.Event.FOCUSOUT;
            t(e.element).on(i, e.config.selector, function (t) {
              return e._enter(t);
            }).on(s, e.config.selector, function (t) {
              return e._leave(t);
            });
          }
          t(e.element).closest(".modal").on("hide.bs.modal", function () {
            return e.hide();
          });
        }), this.config.selector ? this.config = r({}, this.config, {
          trigger: "manual",
          selector: ""
        }) : this._fixTitle();
      }, I._fixTitle = function () {
        var t = _typeof(this.element.getAttribute("data-original-title"));

        (this.element.getAttribute("title") || "string" !== t) && (this.element.setAttribute("data-original-title", this.element.getAttribute("title") || ""), this.element.setAttribute("title", ""));
      }, I._enter = function (e, n) {
        var i = this.constructor.DATA_KEY;
        (n = n || t(e.currentTarget).data(i)) || (n = new this.constructor(e.currentTarget, this._getDelegateConfig()), t(e.currentTarget).data(i, n)), e && (n._activeTrigger["focusin" === e.type ? T : E] = !0), t(n.getTipElement()).hasClass(p) || n._hoverState === f ? n._hoverState = f : (clearTimeout(n._timeout), n._hoverState = f, n.config.delay && n.config.delay.show ? n._timeout = setTimeout(function () {
          n._hoverState === f && n.show();
        }, n.config.delay.show) : n.show());
      }, I._leave = function (e, n) {
        var i = this.constructor.DATA_KEY;
        (n = n || t(e.currentTarget).data(i)) || (n = new this.constructor(e.currentTarget, this._getDelegateConfig()), t(e.currentTarget).data(i, n)), e && (n._activeTrigger["focusout" === e.type ? T : E] = !1), n._isWithActiveTrigger() || (clearTimeout(n._timeout), n._hoverState = d, n.config.delay && n.config.delay.hide ? n._timeout = setTimeout(function () {
          n._hoverState === d && n.hide();
        }, n.config.delay.hide) : n.hide());
      }, I._isWithActiveTrigger = function () {
        for (var t in this._activeTrigger) {
          if (this._activeTrigger[t]) return !0;
        }

        return !1;
      }, I._getConfig = function (n) {
        return "number" == typeof (n = r({}, this.constructor.Default, t(this.element).data(), n)).delay && (n.delay = {
          show: n.delay,
          hide: n.delay
        }), "number" == typeof n.title && (n.title = n.title.toString()), "number" == typeof n.content && (n.content = n.content.toString()), P.typeCheckConfig(e, n, this.constructor.DefaultType), n;
      }, I._getDelegateConfig = function () {
        var t = {};
        if (this.config) for (var e in this.config) {
          this.constructor.Default[e] !== this.config[e] && (t[e] = this.config[e]);
        }
        return t;
      }, I._cleanTipClass = function () {
        var e = t(this.getTipElement()),
            n = e.attr("class").match(l);
        null !== n && n.length > 0 && e.removeClass(n.join(""));
      }, I._handlePopperPlacementChange = function (t) {
        this._cleanTipClass(), this.addAttachmentClass(this._getAttachment(t.placement));
      }, I._fixTransition = function () {
        var e = this.getTipElement(),
            n = this.config.animation;
        null === e.getAttribute("x-placement") && (t(e).removeClass(g), this.config.animation = !1, this.hide(), this.show(), this.config.animation = n);
      }, a._jQueryInterface = function (e) {
        return this.each(function () {
          var n = t(this).data(i),
              s = "object" == _typeof(e) && e;

          if ((n || !/dispose|hide/.test(e)) && (n || (n = new a(this, s), t(this).data(i, n)), "string" == typeof e)) {
            if ("undefined" == typeof n[e]) throw new TypeError('No method named "' + e + '"');
            n[e]();
          }
        });
      }, s(a, null, [{
        key: "VERSION",
        get: function get() {
          return "4.0.0";
        }
      }, {
        key: "Default",
        get: function get() {
          return u;
        }
      }, {
        key: "NAME",
        get: function get() {
          return e;
        }
      }, {
        key: "DATA_KEY",
        get: function get() {
          return i;
        }
      }, {
        key: "Event",
        get: function get() {
          return _;
        }
      }, {
        key: "EVENT_KEY",
        get: function get() {
          return o;
        }
      }, {
        key: "DefaultType",
        get: function get() {
          return h;
        }
      }]), a;
    }();

    return t.fn[e] = I._jQueryInterface, t.fn[e].Constructor = I, t.fn[e].noConflict = function () {
      return t.fn[e] = a, I._jQueryInterface;
    }, I;
  }(e),
      x = function (t) {
    var e = "popover",
        n = "bs.popover",
        i = "." + n,
        o = t.fn[e],
        a = new RegExp("(^|\\s)bs-popover\\S+", "g"),
        l = r({}, U.Default, {
      placement: "right",
      trigger: "click",
      content: "",
      template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
    }),
        h = r({}, U.DefaultType, {
      content: "(string|element|function)"
    }),
        c = "fade",
        u = "show",
        f = ".popover-header",
        d = ".popover-body",
        _ = {
      HIDE: "hide" + i,
      HIDDEN: "hidden" + i,
      SHOW: "show" + i,
      SHOWN: "shown" + i,
      INSERTED: "inserted" + i,
      CLICK: "click" + i,
      FOCUSIN: "focusin" + i,
      FOCUSOUT: "focusout" + i,
      MOUSEENTER: "mouseenter" + i,
      MOUSELEAVE: "mouseleave" + i
    },
        g = function (r) {
      var o, g;

      function p() {
        return r.apply(this, arguments) || this;
      }

      g = r, (o = p).prototype = Object.create(g.prototype), o.prototype.constructor = o, o.__proto__ = g;
      var m = p.prototype;
      return m.isWithContent = function () {
        return this.getTitle() || this._getContent();
      }, m.addAttachmentClass = function (e) {
        t(this.getTipElement()).addClass("bs-popover-" + e);
      }, m.getTipElement = function () {
        return this.tip = this.tip || t(this.config.template)[0], this.tip;
      }, m.setContent = function () {
        var e = t(this.getTipElement());
        this.setElementContent(e.find(f), this.getTitle());

        var n = this._getContent();

        "function" == typeof n && (n = n.call(this.element)), this.setElementContent(e.find(d), n), e.removeClass(c + " " + u);
      }, m._getContent = function () {
        return this.element.getAttribute("data-content") || this.config.content;
      }, m._cleanTipClass = function () {
        var e = t(this.getTipElement()),
            n = e.attr("class").match(a);
        null !== n && n.length > 0 && e.removeClass(n.join(""));
      }, p._jQueryInterface = function (e) {
        return this.each(function () {
          var i = t(this).data(n),
              s = "object" == _typeof(e) ? e : null;

          if ((i || !/destroy|hide/.test(e)) && (i || (i = new p(this, s), t(this).data(n, i)), "string" == typeof e)) {
            if ("undefined" == typeof i[e]) throw new TypeError('No method named "' + e + '"');
            i[e]();
          }
        });
      }, s(p, null, [{
        key: "VERSION",
        get: function get() {
          return "4.0.0";
        }
      }, {
        key: "Default",
        get: function get() {
          return l;
        }
      }, {
        key: "NAME",
        get: function get() {
          return e;
        }
      }, {
        key: "DATA_KEY",
        get: function get() {
          return n;
        }
      }, {
        key: "Event",
        get: function get() {
          return _;
        }
      }, {
        key: "EVENT_KEY",
        get: function get() {
          return i;
        }
      }, {
        key: "DefaultType",
        get: function get() {
          return h;
        }
      }]), p;
    }(U);

    return t.fn[e] = g._jQueryInterface, t.fn[e].Constructor = g, t.fn[e].noConflict = function () {
      return t.fn[e] = o, g._jQueryInterface;
    }, g;
  }(e),
      K = function (t) {
    var e = "scrollspy",
        n = "bs.scrollspy",
        i = "." + n,
        o = t.fn[e],
        a = {
      offset: 10,
      method: "auto",
      target: ""
    },
        l = {
      offset: "number",
      method: "string",
      target: "(string|element)"
    },
        h = {
      ACTIVATE: "activate" + i,
      SCROLL: "scroll" + i,
      LOAD_DATA_API: "load" + i + ".data-api"
    },
        c = "dropdown-item",
        u = "active",
        f = {
      DATA_SPY: '[data-spy="scroll"]',
      ACTIVE: ".active",
      NAV_LIST_GROUP: ".nav, .list-group",
      NAV_LINKS: ".nav-link",
      NAV_ITEMS: ".nav-item",
      LIST_ITEMS: ".list-group-item",
      DROPDOWN: ".dropdown",
      DROPDOWN_ITEMS: ".dropdown-item",
      DROPDOWN_TOGGLE: ".dropdown-toggle"
    },
        d = "offset",
        _ = "position",
        g = function () {
      function o(e, n) {
        var i = this;
        this._element = e, this._scrollElement = "BODY" === e.tagName ? window : e, this._config = this._getConfig(n), this._selector = this._config.target + " " + f.NAV_LINKS + "," + this._config.target + " " + f.LIST_ITEMS + "," + this._config.target + " " + f.DROPDOWN_ITEMS, this._offsets = [], this._targets = [], this._activeTarget = null, this._scrollHeight = 0, t(this._scrollElement).on(h.SCROLL, function (t) {
          return i._process(t);
        }), this.refresh(), this._process();
      }

      var g = o.prototype;
      return g.refresh = function () {
        var e = this,
            n = this._scrollElement === this._scrollElement.window ? d : _,
            i = "auto" === this._config.method ? n : this._config.method,
            s = i === _ ? this._getScrollTop() : 0;
        this._offsets = [], this._targets = [], this._scrollHeight = this._getScrollHeight(), t.makeArray(t(this._selector)).map(function (e) {
          var n,
              r = P.getSelectorFromElement(e);

          if (r && (n = t(r)[0]), n) {
            var o = n.getBoundingClientRect();
            if (o.width || o.height) return [t(n)[i]().top + s, r];
          }

          return null;
        }).filter(function (t) {
          return t;
        }).sort(function (t, e) {
          return t[0] - e[0];
        }).forEach(function (t) {
          e._offsets.push(t[0]), e._targets.push(t[1]);
        });
      }, g.dispose = function () {
        t.removeData(this._element, n), t(this._scrollElement).off(i), this._element = null, this._scrollElement = null, this._config = null, this._selector = null, this._offsets = null, this._targets = null, this._activeTarget = null, this._scrollHeight = null;
      }, g._getConfig = function (n) {
        if ("string" != typeof (n = r({}, a, n)).target) {
          var i = t(n.target).attr("id");
          i || (i = P.getUID(e), t(n.target).attr("id", i)), n.target = "#" + i;
        }

        return P.typeCheckConfig(e, n, l), n;
      }, g._getScrollTop = function () {
        return this._scrollElement === window ? this._scrollElement.pageYOffset : this._scrollElement.scrollTop;
      }, g._getScrollHeight = function () {
        return this._scrollElement.scrollHeight || Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      }, g._getOffsetHeight = function () {
        return this._scrollElement === window ? window.innerHeight : this._scrollElement.getBoundingClientRect().height;
      }, g._process = function () {
        var t = this._getScrollTop() + this._config.offset,
            e = this._getScrollHeight(),
            n = this._config.offset + e - this._getOffsetHeight();

        if (this._scrollHeight !== e && this.refresh(), t >= n) {
          var i = this._targets[this._targets.length - 1];
          this._activeTarget !== i && this._activate(i);
        } else {
          if (this._activeTarget && t < this._offsets[0] && this._offsets[0] > 0) return this._activeTarget = null, void this._clear();

          for (var s = this._offsets.length; s--;) {
            this._activeTarget !== this._targets[s] && t >= this._offsets[s] && ("undefined" == typeof this._offsets[s + 1] || t < this._offsets[s + 1]) && this._activate(this._targets[s]);
          }
        }
      }, g._activate = function (e) {
        this._activeTarget = e, this._clear();

        var n = this._selector.split(",");

        n = n.map(function (t) {
          return t + '[data-target="' + e + '"],' + t + '[href="' + e + '"]';
        });
        var i = t(n.join(","));
        i.hasClass(c) ? (i.closest(f.DROPDOWN).find(f.DROPDOWN_TOGGLE).addClass(u), i.addClass(u)) : (i.addClass(u), i.parents(f.NAV_LIST_GROUP).prev(f.NAV_LINKS + ", " + f.LIST_ITEMS).addClass(u), i.parents(f.NAV_LIST_GROUP).prev(f.NAV_ITEMS).children(f.NAV_LINKS).addClass(u)), t(this._scrollElement).trigger(h.ACTIVATE, {
          relatedTarget: e
        });
      }, g._clear = function () {
        t(this._selector).filter(f.ACTIVE).removeClass(u);
      }, o._jQueryInterface = function (e) {
        return this.each(function () {
          var i = t(this).data(n);

          if (i || (i = new o(this, "object" == _typeof(e) && e), t(this).data(n, i)), "string" == typeof e) {
            if ("undefined" == typeof i[e]) throw new TypeError('No method named "' + e + '"');
            i[e]();
          }
        });
      }, s(o, null, [{
        key: "VERSION",
        get: function get() {
          return "4.0.0";
        }
      }, {
        key: "Default",
        get: function get() {
          return a;
        }
      }]), o;
    }();

    return t(window).on(h.LOAD_DATA_API, function () {
      for (var e = t.makeArray(t(f.DATA_SPY)), n = e.length; n--;) {
        var i = t(e[n]);

        g._jQueryInterface.call(i, i.data());
      }
    }), t.fn[e] = g._jQueryInterface, t.fn[e].Constructor = g, t.fn[e].noConflict = function () {
      return t.fn[e] = o, g._jQueryInterface;
    }, g;
  }(e),
      V = function (t) {
    var e = "bs.tab",
        n = "." + e,
        i = t.fn.tab,
        r = {
      HIDE: "hide" + n,
      HIDDEN: "hidden" + n,
      SHOW: "show" + n,
      SHOWN: "shown" + n,
      CLICK_DATA_API: "click.bs.tab.data-api"
    },
        o = "dropdown-menu",
        a = "active",
        l = "disabled",
        h = "fade",
        c = "show",
        u = ".dropdown",
        f = ".nav, .list-group",
        d = ".active",
        _ = "> li > .active",
        g = '[data-toggle="tab"], [data-toggle="pill"], [data-toggle="list"]',
        p = ".dropdown-toggle",
        m = "> .dropdown-menu .active",
        v = function () {
      function n(t) {
        this._element = t;
      }

      var i = n.prototype;
      return i.show = function () {
        var e = this;

        if (!(this._element.parentNode && this._element.parentNode.nodeType === Node.ELEMENT_NODE && t(this._element).hasClass(a) || t(this._element).hasClass(l))) {
          var n,
              i,
              s = t(this._element).closest(f)[0],
              o = P.getSelectorFromElement(this._element);

          if (s) {
            var h = "UL" === s.nodeName ? _ : d;
            i = (i = t.makeArray(t(s).find(h)))[i.length - 1];
          }

          var c = t.Event(r.HIDE, {
            relatedTarget: this._element
          }),
              u = t.Event(r.SHOW, {
            relatedTarget: i
          });

          if (i && t(i).trigger(c), t(this._element).trigger(u), !u.isDefaultPrevented() && !c.isDefaultPrevented()) {
            o && (n = t(o)[0]), this._activate(this._element, s);

            var g = function g() {
              var n = t.Event(r.HIDDEN, {
                relatedTarget: e._element
              }),
                  s = t.Event(r.SHOWN, {
                relatedTarget: i
              });
              t(i).trigger(n), t(e._element).trigger(s);
            };

            n ? this._activate(n, n.parentNode, g) : g();
          }
        }
      }, i.dispose = function () {
        t.removeData(this._element, e), this._element = null;
      }, i._activate = function (e, n, i) {
        var s = this,
            r = ("UL" === n.nodeName ? t(n).find(_) : t(n).children(d))[0],
            o = i && P.supportsTransitionEnd() && r && t(r).hasClass(h),
            a = function a() {
          return s._transitionComplete(e, r, i);
        };

        r && o ? t(r).one(P.TRANSITION_END, a).emulateTransitionEnd(150) : a();
      }, i._transitionComplete = function (e, n, i) {
        if (n) {
          t(n).removeClass(c + " " + a);
          var s = t(n.parentNode).find(m)[0];
          s && t(s).removeClass(a), "tab" === n.getAttribute("role") && n.setAttribute("aria-selected", !1);
        }

        if (t(e).addClass(a), "tab" === e.getAttribute("role") && e.setAttribute("aria-selected", !0), P.reflow(e), t(e).addClass(c), e.parentNode && t(e.parentNode).hasClass(o)) {
          var r = t(e).closest(u)[0];
          r && t(r).find(p).addClass(a), e.setAttribute("aria-expanded", !0);
        }

        i && i();
      }, n._jQueryInterface = function (i) {
        return this.each(function () {
          var s = t(this),
              r = s.data(e);

          if (r || (r = new n(this), s.data(e, r)), "string" == typeof i) {
            if ("undefined" == typeof r[i]) throw new TypeError('No method named "' + i + '"');
            r[i]();
          }
        });
      }, s(n, null, [{
        key: "VERSION",
        get: function get() {
          return "4.0.0";
        }
      }]), n;
    }();

    return t(document).on(r.CLICK_DATA_API, g, function (e) {
      e.preventDefault(), v._jQueryInterface.call(t(this), "show");
    }), t.fn.tab = v._jQueryInterface, t.fn.tab.Constructor = v, t.fn.tab.noConflict = function () {
      return t.fn.tab = i, v._jQueryInterface;
    }, v;
  }(e);

  !function (t) {
    if ("undefined" == typeof t) throw new TypeError("Bootstrap's JavaScript requires jQuery. jQuery must be included before Bootstrap's JavaScript.");
    var e = t.fn.jquery.split(" ")[0].split(".");
    if (e[0] < 2 && e[1] < 9 || 1 === e[0] && 9 === e[1] && e[2] < 1 || e[0] >= 4) throw new Error("Bootstrap's JavaScript requires at least jQuery v1.9.1 but less than v4.0.0");
  }(e), t.Util = P, t.Alert = L, t.Button = R, t.Carousel = j, t.Collapse = H, t.Dropdown = W, t.Modal = M, t.Popover = x, t.Scrollspy = K, t.Tab = V, t.Tooltip = U, Object.defineProperty(t, "__esModule", {
    value: !0
  });
});
"use strict";

/*!
	Colorbox v1.4.33 - 2013-10-31
	jQuery lightbox and modal window plugin
	(c) 2013 Jack Moore - http://www.jacklmoore.com/colorbox
	license: http://www.opensource.org/licenses/mit-license.php
*/
(function ($, document, window) {
  var // Default settings object.
  // See http://jacklmoore.com/colorbox for details.
  defaults = {
    // data sources
    html: false,
    photo: false,
    iframe: false,
    inline: false,
    // behavior and appearance
    transition: "elastic",
    speed: 300,
    fadeOut: 300,
    width: false,
    initialWidth: "600",
    innerWidth: false,
    maxWidth: false,
    height: false,
    initialHeight: "450",
    innerHeight: false,
    maxHeight: false,
    scalePhotos: true,
    scrolling: true,
    href: false,
    title: false,
    rel: false,
    opacity: 0.9,
    preloading: true,
    className: false,
    overlayClose: true,
    escKey: true,
    arrowKey: true,
    top: false,
    bottom: false,
    left: false,
    right: false,
    fixed: false,
    data: undefined,
    closeButton: true,
    fastIframe: true,
    open: false,
    reposition: true,
    loop: true,
    slideshow: false,
    slideshowAuto: true,
    slideshowSpeed: 2500,
    slideshowStart: "start slideshow",
    slideshowStop: "stop slideshow",
    photoRegex: /\.(gif|png|jp(e|g|eg)|bmp|ico|webp)((#|\?).*)?$/i,
    // alternate image paths for high-res displays
    retinaImage: false,
    retinaUrl: false,
    retinaSuffix: '@2x.$1',
    // internationalization
    current: "Company {current} of {total}",
    previous: "previous",
    next: "next",
    close: "close",
    xhrError: "This content failed to load.",
    imgError: "This image failed to load.",
    // accessbility
    returnFocus: true,
    trapFocus: true,
    // callbacks
    onOpen: false,
    onLoad: false,
    onComplete: false,
    onCleanup: false,
    onClosed: false
  },
      // Abstracting the HTML and event identifiers for easy rebranding
  colorbox = 'colorbox',
      prefix = 'cbox',
      boxElement = prefix + 'Element',
      // Events
  event_open = prefix + '_open',
      event_load = prefix + '_load',
      event_complete = prefix + '_complete',
      event_cleanup = prefix + '_cleanup',
      event_closed = prefix + '_closed',
      event_purge = prefix + '_purge',
      // Cached jQuery Object Variables
  $overlay,
      $box,
      $wrap,
      $content,
      $topBorder,
      $leftBorder,
      $rightBorder,
      $bottomBorder,
      $related,
      $window,
      $loaded,
      $loadingBay,
      $loadingOverlay,
      $title,
      $current,
      $slideshow,
      $next,
      $prev,
      $close,
      $groupControls,
      $events = $('<a/>'),
      // $([]) would be prefered, but there is an issue with jQuery 1.4.2
  // Variables for cached values or use across multiple functions
  settings,
      interfaceHeight,
      interfaceWidth,
      loadedHeight,
      loadedWidth,
      element,
      index,
      photo,
      open,
      active,
      closing,
      loadingTimer,
      publicMethod,
      div = "div",
      className,
      requests = 0,
      previousCSS = {},
      init; // ****************
  // HELPER FUNCTIONS
  // ****************
  // Convenience function for creating new jQuery objects

  function $tag(tag, id, css) {
    var element = document.createElement(tag);

    if (id) {
      element.id = prefix + id;
    }

    if (css) {
      element.style.cssText = css;
    }

    return $(element);
  } // Get the window height using innerHeight when available to avoid an issue with iOS
  // http://bugs.jquery.com/ticket/6724


  function winheight() {
    return window.innerHeight ? window.innerHeight : $(window).height();
  } // Determine the next and previous members in a group.


  function getIndex(increment) {
    var max = $related.length,
        newIndex = (index + increment) % max;
    return newIndex < 0 ? max + newIndex : newIndex;
  } // Convert '%' and 'px' values to integers


  function setSize(size, dimension) {
    return Math.round((/%/.test(size) ? (dimension === 'x' ? $window.width() : winheight()) / 100 : 1) * parseInt(size, 10));
  } // Checks an href to see if it is a photo.
  // There is a force photo option (photo: true) for hrefs that cannot be matched by the regex.


  function isImage(settings, url) {
    return settings.photo || settings.photoRegex.test(url);
  }

  function retinaUrl(settings, url) {
    return settings.retinaUrl && window.devicePixelRatio > 1 ? url.replace(settings.photoRegex, settings.retinaSuffix) : url;
  }

  function trapFocus(e) {
    if ('contains' in $box[0] && !$box[0].contains(e.target)) {
      e.stopPropagation();
      $box.focus();
    }
  } // Assigns function results to their respective properties


  function makeSettings() {
    var i,
        data = $.data(element, colorbox);

    if (data == null) {
      settings = $.extend({}, defaults);

      if (console && console.log) {
        console.log('Error: cboxElement missing settings object');
      }
    } else {
      settings = $.extend({}, data);
    }

    for (i in settings) {
      if ($.isFunction(settings[i]) && i.slice(0, 2) !== 'on') {
        // checks to make sure the function isn't one of the callbacks, they will be handled at the appropriate time.
        settings[i] = settings[i].call(element);
      }
    }

    settings.rel = settings.rel || element.rel || $(element).data('rel') || 'nofollow';
    settings.href = settings.href || $(element).attr('href');
    settings.title = settings.title || element.title;

    if (typeof settings.href === "string") {
      settings.href = $.trim(settings.href);
    }
  }

  function trigger(event, callback) {
    // for external use
    $(document).trigger(event); // for internal use

    $events.triggerHandler(event);

    if ($.isFunction(callback)) {
      callback.call(element);
    }
  }

  var slideshow = function () {
    var active,
        className = prefix + "Slideshow_",
        click = "click." + prefix,
        timeOut;

    function clear() {
      clearTimeout(timeOut);
    }

    function set() {
      if (settings.loop || $related[index + 1]) {
        clear();
        timeOut = setTimeout(publicMethod.next, settings.slideshowSpeed);
      }
    }

    function start() {
      $slideshow.html(settings.slideshowStop).unbind(click).one(click, stop);
      $events.bind(event_complete, set).bind(event_load, clear);
      $box.removeClass(className + "off").addClass(className + "on");
    }

    function stop() {
      clear();
      $events.unbind(event_complete, set).unbind(event_load, clear);
      $slideshow.html(settings.slideshowStart).unbind(click).one(click, function () {
        publicMethod.next();
        start();
      });
      $box.removeClass(className + "on").addClass(className + "off");
    }

    function reset() {
      active = false;
      $slideshow.hide();
      clear();
      $events.unbind(event_complete, set).unbind(event_load, clear);
      $box.removeClass(className + "off " + className + "on");
    }

    return function () {
      if (active) {
        if (!settings.slideshow) {
          $events.unbind(event_cleanup, reset);
          reset();
        }
      } else {
        if (settings.slideshow && $related[1]) {
          active = true;
          $events.one(event_cleanup, reset);

          if (settings.slideshowAuto) {
            start();
          } else {
            stop();
          }

          $slideshow.show();
        }
      }
    };
  }();

  function launch(target) {
    if (!closing) {
      element = target;
      makeSettings();
      $related = $(element);
      index = 0;

      if (settings.rel !== 'nofollow') {
        $related = $('.' + boxElement).filter(function () {
          var data = $.data(this, colorbox),
              relRelated;

          if (data) {
            relRelated = $(this).data('rel') || data.rel || this.rel;
          }

          return relRelated === settings.rel;
        });
        index = $related.index(element); // Check direct calls to Colorbox.

        if (index === -1) {
          $related = $related.add(element);
          index = $related.length - 1;
        }
      }

      $overlay.css({
        opacity: parseFloat(settings.opacity),
        cursor: settings.overlayClose ? "pointer" : "auto",
        visibility: 'visible'
      }).show();

      if (className) {
        $box.add($overlay).removeClass(className);
      }

      if (settings.className) {
        $box.add($overlay).addClass(settings.className);
      }

      className = settings.className;

      if (settings.closeButton) {
        $close.html(settings.close).appendTo($content);
      } else {
        $close.appendTo('<div/>');
      }

      if (!open) {
        open = active = true; // Prevents the page-change action from queuing up if the visitor holds down the left or right keys.
        // Show colorbox so the sizes can be calculated in older versions of jQuery

        $box.css({
          visibility: 'hidden',
          display: 'block'
        });
        $loaded = $tag(div, 'LoadedContent', 'width:0; height:0; overflow:hidden');
        $content.css({
          width: '',
          height: ''
        }).append($loaded); // Cache values needed for size calculations

        interfaceHeight = $topBorder.height() + $bottomBorder.height() + $content.outerHeight(true) - $content.height();
        interfaceWidth = $leftBorder.width() + $rightBorder.width() + $content.outerWidth(true) - $content.width();
        loadedHeight = $loaded.outerHeight(true);
        loadedWidth = $loaded.outerWidth(true); // Opens inital empty Colorbox prior to content being loaded.

        settings.w = setSize(settings.initialWidth, 'x');
        settings.h = setSize(settings.initialHeight, 'y');
        $loaded.css({
          width: '',
          height: settings.h
        });
        publicMethod.position();
        trigger(event_open, settings.onOpen);
        $groupControls.add($title).hide();
        $box.focus();

        if (settings.trapFocus) {
          // Confine focus to the modal
          // Uses event capturing that is not supported in IE8-
          if (document.addEventListener) {
            document.addEventListener('focus', trapFocus, true);
            $events.one(event_closed, function () {
              document.removeEventListener('focus', trapFocus, true);
            });
          }
        } // Return focus on closing


        if (settings.returnFocus) {
          $events.one(event_closed, function () {
            $(element).focus();
          });
        }
      }

      load();
    }
  } // Colorbox's markup needs to be added to the DOM prior to being called
  // so that the browser will go ahead and load the CSS background images.


  function appendHTML() {
    if (!$box && document.body) {
      init = false;
      $window = $(window);
      $box = $tag(div).attr({
        id: colorbox,
        'class': $.support.opacity === false ? prefix + 'IE' : '',
        // class for optional IE8 & lower targeted CSS.
        role: 'dialog',
        tabindex: '-1'
      }).hide();
      $overlay = $tag(div, "Overlay").hide();
      $loadingOverlay = $([$tag(div, "LoadingOverlay")[0], $tag(div, "LoadingGraphic")[0]]);
      $wrap = $tag(div, "Wrapper");
      $content = $tag(div, "Content").append($title = $tag(div, "Title"), $current = $tag(div, "Current"), $prev = $('<button type="button"/>').attr({
        id: prefix + 'Previous'
      }), $next = $('<button type="button"/>').attr({
        id: prefix + 'Next'
      }), $slideshow = $tag('button', "Slideshow"), $loadingOverlay);
      $close = $('<button type="button"/>').attr({
        id: prefix + 'Close'
      });
      $wrap.append( // The 3x3 Grid that makes up Colorbox
      $tag(div).append($tag(div, "TopLeft"), $topBorder = $tag(div, "TopCenter"), $tag(div, "TopRight")), $tag(div, false, 'clear:left').append($leftBorder = $tag(div, "MiddleLeft"), $content, $rightBorder = $tag(div, "MiddleRight")), $tag(div, false, 'clear:left').append($tag(div, "BottomLeft"), $bottomBorder = $tag(div, "BottomCenter"), $tag(div, "BottomRight"))).find('div div').css({
        'float': 'left'
      });
      $loadingBay = $tag(div, false, 'position:absolute; width:9999px; visibility:hidden; display:none; max-width:none;');
      $groupControls = $next.add($prev).add($current).add($slideshow);
      $(document.body).append($overlay, $box.append($wrap, $loadingBay));
    }
  } // Add Colorbox's event bindings


  function addBindings() {
    function clickHandler(e) {
      // ignore non-left-mouse-clicks and clicks modified with ctrl / command, shift, or alt.
      // See: http://jacklmoore.com/notes/click-events/
      if (!(e.which > 1 || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        launch(this);
      }
    }

    if ($box) {
      if (!init) {
        init = true; // Anonymous functions here keep the public method from being cached, thereby allowing them to be redefined on the fly.

        $next.click(function () {
          publicMethod.next();
        });
        $prev.click(function () {
          publicMethod.prev();
        });
        $close.click(function () {
          publicMethod.close();
        });
        $overlay.click(function () {
          if (settings.overlayClose) {
            publicMethod.close();
          }
        }); // Key Bindings

        $(document).bind('keydown.' + prefix, function (e) {
          var key = e.keyCode;

          if (open && settings.escKey && key === 27) {
            e.preventDefault();
            publicMethod.close();
          }

          if (open && settings.arrowKey && $related[1] && !e.altKey) {
            if (key === 37) {
              e.preventDefault();
              $prev.click();
            } else if (key === 39) {
              e.preventDefault();
              $next.click();
            }
          }
        });

        if ($.isFunction($.fn.on)) {
          // For jQuery 1.7+
          $(document).on('click.' + prefix, '.' + boxElement, clickHandler);
        } else {
          // For jQuery 1.3.x -> 1.6.x
          // This code is never reached in jQuery 1.9, so do not contact me about 'live' being removed.
          // This is not here for jQuery 1.9, it's here for legacy users.
          $('.' + boxElement).live('click.' + prefix, clickHandler);
        }
      }

      return true;
    }

    return false;
  } // Don't do anything if Colorbox already exists.


  if ($.colorbox) {
    return;
  } // Append the HTML when the DOM loads


  $(appendHTML); // ****************
  // PUBLIC FUNCTIONS
  // Usage format: $.colorbox.close();
  // Usage from within an iframe: parent.jQuery.colorbox.close();
  // ****************

  publicMethod = $.fn[colorbox] = $[colorbox] = function (options, callback) {
    var $this = this;
    options = options || {};
    appendHTML();

    if (addBindings()) {
      if ($.isFunction($this)) {
        // assume a call to $.colorbox
        $this = $('<a/>');
        options.open = true;
      } else if (!$this[0]) {
        // colorbox being applied to empty collection
        return $this;
      }

      if (callback) {
        options.onComplete = callback;
      }

      $this.each(function () {
        $.data(this, colorbox, $.extend({}, $.data(this, colorbox) || defaults, options));
      }).addClass(boxElement);

      if ($.isFunction(options.open) && options.open.call($this) || options.open) {
        launch($this[0]);
      }
    }

    return $this;
  };

  publicMethod.position = function (speed, loadedCallback) {
    var css,
        top = 0,
        left = 0,
        offset = $box.offset(),
        scrollTop,
        scrollLeft;
    $window.unbind('resize.' + prefix); // remove the modal so that it doesn't influence the document width/height

    $box.css({
      top: -9e4,
      left: -9e4
    });
    scrollTop = $window.scrollTop();
    scrollLeft = $window.scrollLeft();

    if (settings.fixed) {
      offset.top -= scrollTop;
      offset.left -= scrollLeft;
      $box.css({
        position: 'fixed'
      });
    } else {
      top = scrollTop;
      left = scrollLeft;
      $box.css({
        position: 'absolute'
      });
    } // keeps the top and left positions within the browser's viewport.


    if (settings.right !== false) {
      left += Math.max($window.width() - settings.w - loadedWidth - interfaceWidth - setSize(settings.right, 'x'), 0);
    } else if (settings.left !== false) {
      left += setSize(settings.left, 'x');
    } else {
      left += Math.round(Math.max($window.width() - settings.w - loadedWidth - interfaceWidth, 0) / 2);
    }

    if (settings.bottom !== false) {
      top += Math.max(winheight() - settings.h - loadedHeight - interfaceHeight - setSize(settings.bottom, 'y'), 0);
    } else if (settings.top !== false) {
      top += setSize(settings.top, 'y');
    } else {
      top += Math.round(Math.max(winheight() - settings.h - loadedHeight - interfaceHeight, 0) / 2);
    }

    $box.css({
      top: offset.top,
      left: offset.left,
      visibility: 'visible'
    }); // this gives the wrapper plenty of breathing room so it's floated contents can move around smoothly,
    // but it has to be shrank down around the size of div#colorbox when it's done.  If not,
    // it can invoke an obscure IE bug when using iframes.

    $wrap[0].style.width = $wrap[0].style.height = "9999px";

    function modalDimensions() {
      $topBorder[0].style.width = $bottomBorder[0].style.width = $content[0].style.width = parseInt($box[0].style.width, 10) - interfaceWidth + 'px';
      $content[0].style.height = $leftBorder[0].style.height = $rightBorder[0].style.height = parseInt($box[0].style.height, 10) - interfaceHeight + 'px';
    }

    css = {
      width: settings.w + loadedWidth + interfaceWidth,
      height: settings.h + loadedHeight + interfaceHeight,
      top: top,
      left: left
    }; // setting the speed to 0 if the content hasn't changed size or position

    if (speed) {
      var tempSpeed = 0;
      $.each(css, function (i) {
        if (css[i] !== previousCSS[i]) {
          tempSpeed = speed;
          return;
        }
      });
      speed = tempSpeed;
    }

    previousCSS = css;

    if (!speed) {
      $box.css(css);
    }

    $box.dequeue().animate(css, {
      duration: speed || 0,
      complete: function complete() {
        modalDimensions();
        active = false; // shrink the wrapper down to exactly the size of colorbox to avoid a bug in IE's iframe implementation.

        $wrap[0].style.width = settings.w + loadedWidth + interfaceWidth + "px";
        $wrap[0].style.height = settings.h + loadedHeight + interfaceHeight + "px";

        if (settings.reposition) {
          setTimeout(function () {
            // small delay before binding onresize due to an IE8 bug.
            $window.bind('resize.' + prefix, publicMethod.position);
          }, 1);
        }

        if (loadedCallback) {
          loadedCallback();
        }
      },
      step: modalDimensions
    });
  };

  publicMethod.resize = function (options) {
    var scrolltop;

    if (open) {
      options = options || {};

      if (options.width) {
        settings.w = setSize(options.width, 'x') - loadedWidth - interfaceWidth;
      }

      if (options.innerWidth) {
        settings.w = setSize(options.innerWidth, 'x');
      }

      $loaded.css({
        width: settings.w
      });

      if (options.height) {
        settings.h = setSize(options.height, 'y') - loadedHeight - interfaceHeight;
      }

      if (options.innerHeight) {
        settings.h = setSize(options.innerHeight, 'y');
      }

      if (!options.innerHeight && !options.height) {
        scrolltop = $loaded.scrollTop();
        $loaded.css({
          height: "auto"
        });
        settings.h = $loaded.height();
      }

      $loaded.css({
        height: settings.h
      });

      if (scrolltop) {
        $loaded.scrollTop(scrolltop);
      }

      publicMethod.position(settings.transition === "none" ? 0 : settings.speed);
    }
  };

  publicMethod.prep = function (object) {
    if (!open) {
      return;
    }

    var callback,
        speed = settings.transition === "none" ? 0 : settings.speed;
    $loaded.empty().remove(); // Using empty first may prevent some IE7 issues.

    $loaded = $tag(div, 'LoadedContent').append(object);

    function getWidth() {
      settings.w = settings.w || $loaded.width();
      settings.w = settings.mw && settings.mw < settings.w ? settings.mw : settings.w;
      return settings.w;
    }

    function getHeight() {
      settings.h = settings.h || $loaded.height();
      settings.h = settings.mh && settings.mh < settings.h ? settings.mh : settings.h;
      return settings.h;
    }

    $loaded.hide().appendTo($loadingBay.show()) // content has to be appended to the DOM for accurate size calculations.
    .css({
      width: getWidth(),
      overflow: settings.scrolling ? 'auto' : 'hidden'
    }).css({
      height: getHeight()
    }) // sets the height independently from the width in case the new width influences the value of height.
    .prependTo($content);
    $loadingBay.hide(); // floating the IMG removes the bottom line-height and fixed a problem where IE miscalculates the width of the parent element as 100% of the document width.

    $(photo).css({
      'float': 'none'
    });

    callback = function callback() {
      var total = $related.length,
          iframe,
          frameBorder = 'frameBorder',
          allowTransparency = 'allowTransparency',
          complete;

      if (!open) {
        return;
      }

      function removeFilter() {
        // Needed for IE7 & IE8 in versions of jQuery prior to 1.7.2
        if ($.support.opacity === false) {
          $box[0].style.removeAttribute('filter');
        }
      }

      complete = function complete() {
        clearTimeout(loadingTimer);
        $loadingOverlay.hide();
        trigger(event_complete, settings.onComplete);
      };

      $title.html(settings.title).add($loaded).show();

      if (total > 1) {
        // handle grouping
        if (typeof settings.current === "string") {
          $current.html(settings.current.replace('{current}', index + 1).replace('{total}', total)).show();
        }

        $next[settings.loop || index < total - 1 ? "show" : "hide"]().html(settings.next);
        $prev[settings.loop || index ? "show" : "hide"]().html(settings.previous);
        slideshow(); // Preloads images within a rel group

        if (settings.preloading) {
          $.each([getIndex(-1), getIndex(1)], function () {
            var src,
                img,
                i = $related[this],
                data = $.data(i, colorbox);

            if (data && data.href) {
              src = data.href;

              if ($.isFunction(src)) {
                src = src.call(i);
              }
            } else {
              src = $(i).attr('href');
            }

            if (src && isImage(data, src)) {
              src = retinaUrl(data, src);
              img = document.createElement('img');
              img.src = src;
            }
          });
        }
      } else {
        $groupControls.hide();
      }

      if (settings.iframe) {
        iframe = $tag('iframe')[0];

        if (frameBorder in iframe) {
          iframe[frameBorder] = 0;
        }

        if (allowTransparency in iframe) {
          iframe[allowTransparency] = "true";
        }

        if (!settings.scrolling) {
          iframe.scrolling = "no";
        }

        $(iframe).attr({
          src: settings.href,
          name: new Date().getTime(),
          // give the iframe a unique name to prevent caching
          'class': prefix + 'Iframe',
          allowFullScreen: true,
          // allow HTML5 video to go fullscreen
          webkitAllowFullScreen: true,
          mozallowfullscreen: true
        }).one('load', complete).appendTo($loaded);
        $events.one(event_purge, function () {
          iframe.src = "//about:blank";
        });

        if (settings.fastIframe) {
          $(iframe).trigger('load');
        }
      } else {
        complete();
      }

      if (settings.transition === 'fade') {
        $box.fadeTo(speed, 1, removeFilter);
      } else {
        removeFilter();
      }
    };

    if (settings.transition === 'fade') {
      $box.fadeTo(speed, 0, function () {
        publicMethod.position(0, callback);
      });
    } else {
      publicMethod.position(speed, callback);
    }
  };

  function load() {
    var href,
        setResize,
        prep = publicMethod.prep,
        $inline,
        request = ++requests;
    active = true;
    photo = false;
    element = $related[index];
    makeSettings();
    trigger(event_purge);
    trigger(event_load, settings.onLoad);
    settings.h = settings.height ? setSize(settings.height, 'y') - loadedHeight - interfaceHeight : settings.innerHeight && setSize(settings.innerHeight, 'y');
    settings.w = settings.width ? setSize(settings.width, 'x') - loadedWidth - interfaceWidth : settings.innerWidth && setSize(settings.innerWidth, 'x'); // Sets the minimum dimensions for use in image scaling

    settings.mw = settings.w;
    settings.mh = settings.h; // Re-evaluate the minimum width and height based on maxWidth and maxHeight values.
    // If the width or height exceed the maxWidth or maxHeight, use the maximum values instead.

    if (settings.maxWidth) {
      settings.mw = setSize(settings.maxWidth, 'x') - loadedWidth - interfaceWidth;
      settings.mw = settings.w && settings.w < settings.mw ? settings.w : settings.mw;
    }

    if (settings.maxHeight) {
      settings.mh = setSize(settings.maxHeight, 'y') - loadedHeight - interfaceHeight;
      settings.mh = settings.h && settings.h < settings.mh ? settings.h : settings.mh;
    }

    href = settings.href;
    loadingTimer = setTimeout(function () {
      $loadingOverlay.show();
    }, 100);

    if (settings.inline) {
      // Inserts an empty placeholder where inline content is being pulled from.
      // An event is bound to put inline content back when Colorbox closes or loads new content.
      $inline = $tag(div).hide().insertBefore($(href)[0]);
      $events.one(event_purge, function () {
        $inline.replaceWith($loaded.children());
      });
      prep($(href));
    } else if (settings.iframe) {
      // IFrame element won't be added to the DOM until it is ready to be displayed,
      // to avoid problems with DOM-ready JS that might be trying to run in that iframe.
      prep(" ");
    } else if (settings.html) {
      prep(settings.html);
    } else if (isImage(settings, href)) {
      href = retinaUrl(settings, href);
      photo = document.createElement('img');
      $(photo).addClass(prefix + 'Photo').bind('error', function () {
        settings.title = false;
        prep($tag(div, 'Error').html(settings.imgError));
      }).one('load', function () {
        var percent;

        if (request !== requests) {
          return;
        }

        $.each(['alt', 'longdesc', 'aria-describedby'], function (i, val) {
          var attr = $(element).attr(val) || $(element).attr('data-' + val);

          if (attr) {
            photo.setAttribute(val, attr);
          }
        });

        if (settings.retinaImage && window.devicePixelRatio > 1) {
          photo.height = photo.height / window.devicePixelRatio;
          photo.width = photo.width / window.devicePixelRatio;
        }

        if (settings.scalePhotos) {
          setResize = function setResize() {
            photo.height -= photo.height * percent;
            photo.width -= photo.width * percent;
          };

          if (settings.mw && photo.width > settings.mw) {
            percent = (photo.width - settings.mw) / photo.width;
            setResize();
          }

          if (settings.mh && photo.height > settings.mh) {
            percent = (photo.height - settings.mh) / photo.height;
            setResize();
          }
        }

        if (settings.h) {
          photo.style.marginTop = Math.max(settings.mh - photo.height, 0) / 2 + 'px';
        }

        if ($related[1] && (settings.loop || $related[index + 1])) {
          photo.style.cursor = 'pointer';

          photo.onclick = function () {
            publicMethod.next();
          };
        }

        photo.style.width = photo.width + 'px';
        photo.style.height = photo.height + 'px';
        setTimeout(function () {
          // A pause because Chrome will sometimes report a 0 by 0 size otherwise.
          prep(photo);
        }, 1);
      });
      setTimeout(function () {
        // A pause because Opera 10.6+ will sometimes not run the onload function otherwise.
        photo.src = href;
      }, 1);
    } else if (href) {
      $loadingBay.load(href, settings.data, function (data, status) {
        if (request === requests) {
          prep(status === 'error' ? $tag(div, 'Error').html(settings.xhrError) : $(this).contents());
        }
      });
    }
  } // Navigates to the next page/image in a set.


  publicMethod.next = function () {
    if (!active && $related[1] && (settings.loop || $related[index + 1])) {
      index = getIndex(1);
      launch($related[index]);
    }
  };

  publicMethod.prev = function () {
    if (!active && $related[1] && (settings.loop || index)) {
      index = getIndex(-1);
      launch($related[index]);
    }
  }; // Note: to use this within an iframe use the following format: parent.jQuery.colorbox.close();


  publicMethod.close = function () {
    if (open && !closing) {
      closing = true;
      open = false;
      trigger(event_cleanup, settings.onCleanup);
      $window.unbind('.' + prefix);
      $overlay.fadeTo(settings.fadeOut || 0, 0);
      $box.stop().fadeTo(settings.fadeOut || 0, 0, function () {
        $box.add($overlay).css({
          'opacity': 1,
          cursor: 'auto'
        }).hide();
        trigger(event_purge);
        $loaded.empty().remove(); // Using empty first may prevent some IE7 issues.

        setTimeout(function () {
          closing = false;
          trigger(event_closed, settings.onClosed);
        }, 1);
      });
    }
  }; // Removes changes Colorbox made to the document, but does not remove the plugin.


  publicMethod.remove = function () {
    if (!$box) {
      return;
    }

    $box.stop();
    $.colorbox.close();
    $box.stop().remove();
    $overlay.remove();
    closing = false;
    $box = null;
    $('.' + boxElement).removeData(colorbox).removeClass(boxElement);
    $(document).unbind('click.' + prefix);
  }; // A method for fetching the current element Colorbox is referencing.
  // returns a jQuery object.


  publicMethod.element = function () {
    return $(element);
  };

  publicMethod.settings = defaults;
})(jQuery, document, window);
"use strict";

/**
 * customizer.js
 *
 * Theme Customizer enhancements for a better user experience.
 *
 * Contains handlers to make Theme Customizer preview reload changes asynchronously.
 */
(function ($) {
  // Site title and description.
  wp.customize('blogname', function (value) {
    value.bind(function (to) {
      $('.site-title a').text(to);
    });
  });
  wp.customize('blogdescription', function (value) {
    value.bind(function (to) {
      $('.site-description').text(to);
    });
  }); // Header text color.

  wp.customize('header_textcolor', function (value) {
    value.bind(function (to) {
      if ('blank' === to) {
        $('.site-title a, .site-description').css({
          'clip': 'rect(1px, 1px, 1px, 1px)',
          'position': 'absolute'
        });
      } else {
        $('.site-title a, .site-description').css({
          'clip': 'auto',
          'position': 'relative'
        });
        $('.site-title a, .site-description').css({
          'color': to
        });
      }
    });
  });
})(jQuery);
"use strict";

// ==================================================
// fancyBox v3.5.7
//
// Licensed GPLv3 for open source use
// or fancyBox Commercial License for commercial use
//
// http://fancyapps.com/fancybox/
// Copyright 2019 fancyApps
//
// ==================================================
(function (window, document, $, undefined) {
  "use strict";

  window.console = window.console || {
    info: function info(stuff) {}
  }; // If there's no jQuery, fancyBox can't work
  // =========================================

  if (!$) {
    return;
  } // Check if fancyBox is already initialized
  // ========================================


  if ($.fn.fancybox) {
    console.info("fancyBox already initialized");
    return;
  } // Private default settings
  // ========================


  var defaults = {
    // Close existing modals
    // Set this to false if you do not need to stack multiple instances
    closeExisting: false,
    // Enable infinite gallery navigation
    loop: false,
    // Horizontal space between slides
    gutter: 50,
    // Enable keyboard navigation
    keyboard: true,
    // Should allow caption to overlap the content
    preventCaptionOverlap: true,
    // Should display navigation arrows at the screen edges
    arrows: true,
    // Should display counter at the top left corner
    infobar: true,
    // Should display close button (using `btnTpl.smallBtn` template) over the content
    // Can be true, false, "auto"
    // If "auto" - will be automatically enabled for "html", "inline" or "ajax" items
    smallBtn: "auto",
    // Should display toolbar (buttons at the top)
    // Can be true, false, "auto"
    // If "auto" - will be automatically hidden if "smallBtn" is enabled
    toolbar: "auto",
    // What buttons should appear in the top right corner.
    // Buttons will be created using templates from `btnTpl` option
    // and they will be placed into toolbar (class="fancybox-toolbar"` element)
    buttons: ["zoom", //"share",
    "slideShow", //"fullScreen",
    //"download",
    "thumbs", "close"],
    // Detect "idle" time in seconds
    idleTime: 3,
    // Disable right-click and use simple image protection for images
    protect: false,
    // Shortcut to make content "modal" - disable keyboard navigtion, hide buttons, etc
    modal: false,
    image: {
      // Wait for images to load before displaying
      //   true  - wait for image to load and then display;
      //   false - display thumbnail and load the full-sized image over top,
      //           requires predefined image dimensions (`data-width` and `data-height` attributes)
      preload: false
    },
    ajax: {
      // Object containing settings for ajax request
      settings: {
        // This helps to indicate that request comes from the modal
        // Feel free to change naming
        data: {
          fancybox: true
        }
      }
    },
    iframe: {
      // Iframe template
      tpl: '<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" allowfullscreen="allowfullscreen" allow="autoplay; fullscreen" src=""></iframe>',
      // Preload iframe before displaying it
      // This allows to calculate iframe content width and height
      // (note: Due to "Same Origin Policy", you can't get cross domain data).
      preload: true,
      // Custom CSS styling for iframe wrapping element
      // You can use this to set custom iframe dimensions
      css: {},
      // Iframe tag attributes
      attr: {
        scrolling: "auto"
      }
    },
    // For HTML5 video only
    video: {
      tpl: '<video class="fancybox-video" controls controlsList="nodownload" poster="{{poster}}">' + '<source src="{{src}}" type="{{format}}" />' + 'Sorry, your browser doesn\'t support embedded videos, <a href="{{src}}">download</a> and watch with your favorite video player!' + "</video>",
      format: "",
      // custom video format
      autoStart: true
    },
    // Default content type if cannot be detected automatically
    defaultType: "image",
    // Open/close animation type
    // Possible values:
    //   false            - disable
    //   "zoom"           - zoom images from/to thumbnail
    //   "fade"
    //   "zoom-in-out"
    //
    animationEffect: "zoom",
    // Duration in ms for open/close animation
    animationDuration: 366,
    // Should image change opacity while zooming
    // If opacity is "auto", then opacity will be changed if image and thumbnail have different aspect ratios
    zoomOpacity: "auto",
    // Transition effect between slides
    //
    // Possible values:
    //   false            - disable
    //   "fade'
    //   "slide'
    //   "circular'
    //   "tube'
    //   "zoom-in-out'
    //   "rotate'
    //
    transitionEffect: "fade",
    // Duration in ms for transition animation
    transitionDuration: 366,
    // Custom CSS class for slide element
    slideClass: "",
    // Custom CSS class for layout
    baseClass: "",
    // Base template for layout
    baseTpl: '<div class="fancybox-container" role="dialog" tabindex="-1">' + '<div class="fancybox-bg"></div>' + '<div class="fancybox-inner">' + '<div class="fancybox-infobar"><span data-fancybox-index></span>&nbsp;/&nbsp;<span data-fancybox-count></span></div>' + '<div class="fancybox-toolbar">{{buttons}}</div>' + '<div class="fancybox-navigation">{{arrows}}</div>' + '<div class="fancybox-stage"></div>' + '<div class="fancybox-caption"><div class="fancybox-caption__body"></div></div>' + "</div>" + "</div>",
    // Loading indicator template
    spinnerTpl: '<div class="fancybox-loading"></div>',
    // Error message template
    errorTpl: '<div class="fancybox-error"><p>{{ERROR}}</p></div>',
    btnTpl: {
      download: '<a download data-fancybox-download class="fancybox-button fancybox-button--download" title="{{DOWNLOAD}}" href="javascript:;">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.62 17.09V19H5.38v-1.91zm-2.97-6.96L17 11.45l-5 4.87-5-4.87 1.36-1.32 2.68 2.64V5h1.92v7.77z"/></svg>' + "</a>",
      zoom: '<button data-fancybox-zoom class="fancybox-button fancybox-button--zoom" title="{{ZOOM}}">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.7 17.3l-3-3a5.9 5.9 0 0 0-.6-7.6 5.9 5.9 0 0 0-8.4 0 5.9 5.9 0 0 0 0 8.4 5.9 5.9 0 0 0 7.7.7l3 3a1 1 0 0 0 1.3 0c.4-.5.4-1 0-1.5zM8.1 13.8a4 4 0 0 1 0-5.7 4 4 0 0 1 5.7 0 4 4 0 0 1 0 5.7 4 4 0 0 1-5.7 0z"/></svg>' + "</button>",
      close: '<button data-fancybox-close class="fancybox-button fancybox-button--close" title="{{CLOSE}}">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 10.6L6.6 5.2 5.2 6.6l5.4 5.4-5.4 5.4 1.4 1.4 5.4-5.4 5.4 5.4 1.4-1.4-5.4-5.4 5.4-5.4-1.4-1.4-5.4 5.4z"/></svg>' + "</button>",
      // Arrows
      arrowLeft: '<button data-fancybox-prev class="fancybox-button fancybox-button--arrow_left" title="{{PREV}}">' + '<div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.28 15.7l-1.34 1.37L5 12l4.94-5.07 1.34 1.38-2.68 2.72H19v1.94H8.6z"/></svg></div>' + "</button>",
      arrowRight: '<button data-fancybox-next class="fancybox-button fancybox-button--arrow_right" title="{{NEXT}}">' + '<div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.4 12.97l-2.68 2.72 1.34 1.38L19 12l-4.94-5.07-1.34 1.38 2.68 2.72H5v1.94z"/></svg></div>' + "</button>",
      // This small close button will be appended to your html/inline/ajax content by default,
      // if "smallBtn" option is not set to false
      smallBtn: '<button type="button" data-fancybox-close class="fancybox-button fancybox-close-small" title="{{CLOSE}}">' + '<svg xmlns="http://www.w3.org/2000/svg" version="1" viewBox="0 0 24 24"><path d="M13 12l5-5-1-1-5 5-5-5-1 1 5 5-5 5 1 1 5-5 5 5 1-1z"/></svg>' + "</button>"
    },
    // Container is injected into this element
    parentEl: "body",
    // Hide browser vertical scrollbars; use at your own risk
    hideScrollbar: true,
    // Focus handling
    // ==============
    // Try to focus on the first focusable element after opening
    autoFocus: true,
    // Put focus back to active element after closing
    backFocus: true,
    // Do not let user to focus on element outside modal content
    trapFocus: true,
    // Module specific options
    // =======================
    fullScreen: {
      autoStart: false
    },
    // Set `touch: false` to disable panning/swiping
    touch: {
      vertical: true,
      // Allow to drag content vertically
      momentum: true // Continue movement after releasing mouse/touch when panning

    },
    // Hash value when initializing manually,
    // set `false` to disable hash change
    hash: null,
    // Customize or add new media types
    // Example:

    /*
      media : {
        youtube : {
          params : {
            autoplay : 0
          }
        }
      }
    */
    media: {},
    slideShow: {
      autoStart: false,
      speed: 3000
    },
    thumbs: {
      autoStart: false,
      // Display thumbnails on opening
      hideOnClose: true,
      // Hide thumbnail grid when closing animation starts
      parentEl: ".fancybox-container",
      // Container is injected into this element
      axis: "y" // Vertical (y) or horizontal (x) scrolling

    },
    // Use mousewheel to navigate gallery
    // If 'auto' - enabled for images only
    wheel: "auto",
    // Callbacks
    //==========
    // See Documentation/API/Events for more information
    // Example:

    /*
      afterShow: function( instance, current ) {
        console.info( 'Clicked element:' );
        console.info( current.opts.$orig );
      }
    */
    onInit: $.noop,
    // When instance has been initialized
    beforeLoad: $.noop,
    // Before the content of a slide is being loaded
    afterLoad: $.noop,
    // When the content of a slide is done loading
    beforeShow: $.noop,
    // Before open animation starts
    afterShow: $.noop,
    // When content is done loading and animating
    beforeClose: $.noop,
    // Before the instance attempts to close. Return false to cancel the close.
    afterClose: $.noop,
    // After instance has been closed
    onActivate: $.noop,
    // When instance is brought to front
    onDeactivate: $.noop,
    // When other instance has been activated
    // Interaction
    // ===========
    // Use options below to customize taken action when user clicks or double clicks on the fancyBox area,
    // each option can be string or method that returns value.
    //
    // Possible values:
    //   "close"           - close instance
    //   "next"            - move to next gallery item
    //   "nextOrClose"     - move to next gallery item or close if gallery has only one item
    //   "toggleControls"  - show/hide controls
    //   "zoom"            - zoom image (if loaded)
    //   false             - do nothing
    // Clicked on the content
    clickContent: function clickContent(current, event) {
      return current.type === "image" ? "zoom" : false;
    },
    // Clicked on the slide
    clickSlide: "close",
    // Clicked on the background (backdrop) element;
    // if you have not changed the layout, then most likely you need to use `clickSlide` option
    clickOutside: "close",
    // Same as previous two, but for double click
    dblclickContent: false,
    dblclickSlide: false,
    dblclickOutside: false,
    // Custom options when mobile device is detected
    // =============================================
    mobile: {
      preventCaptionOverlap: false,
      idleTime: false,
      clickContent: function clickContent(current, event) {
        return current.type === "image" ? "toggleControls" : false;
      },
      clickSlide: function clickSlide(current, event) {
        return current.type === "image" ? "toggleControls" : "close";
      },
      dblclickContent: function dblclickContent(current, event) {
        return current.type === "image" ? "zoom" : false;
      },
      dblclickSlide: function dblclickSlide(current, event) {
        return current.type === "image" ? "zoom" : false;
      }
    },
    // Internationalization
    // ====================
    lang: "en",
    i18n: {
      en: {
        CLOSE: "Close",
        NEXT: "Next",
        PREV: "Previous",
        ERROR: "The requested content cannot be loaded. <br/> Please try again later.",
        PLAY_START: "Start slideshow",
        PLAY_STOP: "Pause slideshow",
        FULL_SCREEN: "Full screen",
        THUMBS: "Thumbnails",
        DOWNLOAD: "Download",
        SHARE: "Share",
        ZOOM: "Zoom"
      },
      de: {
        CLOSE: "Schlie&szlig;en",
        NEXT: "Weiter",
        PREV: "Zur&uuml;ck",
        ERROR: "Die angeforderten Daten konnten nicht geladen werden. <br/> Bitte versuchen Sie es sp&auml;ter nochmal.",
        PLAY_START: "Diaschau starten",
        PLAY_STOP: "Diaschau beenden",
        FULL_SCREEN: "Vollbild",
        THUMBS: "Vorschaubilder",
        DOWNLOAD: "Herunterladen",
        SHARE: "Teilen",
        ZOOM: "Vergr&ouml;&szlig;ern"
      }
    }
  }; // Few useful variables and methods
  // ================================

  var $W = $(window);
  var $D = $(document);
  var called = 0; // Check if an object is a jQuery object and not a native JavaScript object
  // ========================================================================

  var isQuery = function isQuery(obj) {
    return obj && obj.hasOwnProperty && obj instanceof $;
  }; // Handle multiple browsers for "requestAnimationFrame" and "cancelAnimationFrame"
  // ===============================================================================


  var requestAFrame = function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || // if all else fails, use setTimeout
    function (callback) {
      return window.setTimeout(callback, 1000 / 60);
    };
  }();

  var cancelAFrame = function () {
    return window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || function (id) {
      window.clearTimeout(id);
    };
  }(); // Detect the supported transition-end event property name
  // =======================================================


  var transitionEnd = function () {
    var el = document.createElement("fakeelement"),
        t;
    var transitions = {
      transition: "transitionend",
      OTransition: "oTransitionEnd",
      MozTransition: "transitionend",
      WebkitTransition: "webkitTransitionEnd"
    };

    for (t in transitions) {
      if (el.style[t] !== undefined) {
        return transitions[t];
      }
    }

    return "transitionend";
  }(); // Force redraw on an element.
  // This helps in cases where the browser doesn't redraw an updated element properly
  // ================================================================================


  var forceRedraw = function forceRedraw($el) {
    return $el && $el.length && $el[0].offsetHeight;
  }; // Exclude array (`buttons`) options from deep merging
  // ===================================================


  var mergeOpts = function mergeOpts(opts1, opts2) {
    var rez = $.extend(true, {}, opts1, opts2);
    $.each(opts2, function (key, value) {
      if ($.isArray(value)) {
        rez[key] = value;
      }
    });
    return rez;
  }; // How much of an element is visible in viewport
  // =============================================


  var inViewport = function inViewport(elem) {
    var elemCenter, rez;

    if (!elem || elem.ownerDocument !== document) {
      return false;
    }

    $(".fancybox-container").css("pointer-events", "none");
    elemCenter = {
      x: elem.getBoundingClientRect().left + elem.offsetWidth / 2,
      y: elem.getBoundingClientRect().top + elem.offsetHeight / 2
    };
    rez = document.elementFromPoint(elemCenter.x, elemCenter.y) === elem;
    $(".fancybox-container").css("pointer-events", "");
    return rez;
  }; // Class definition
  // ================


  var FancyBox = function FancyBox(content, opts, index) {
    var self = this;
    self.opts = mergeOpts({
      index: index
    }, $.fancybox.defaults);

    if ($.isPlainObject(opts)) {
      self.opts = mergeOpts(self.opts, opts);
    }

    if ($.fancybox.isMobile) {
      self.opts = mergeOpts(self.opts, self.opts.mobile);
    }

    self.id = self.opts.id || ++called;
    self.currIndex = parseInt(self.opts.index, 10) || 0;
    self.prevIndex = null;
    self.prevPos = null;
    self.currPos = 0;
    self.firstRun = true; // All group items

    self.group = []; // Existing slides (for current, next and previous gallery items)

    self.slides = {}; // Create group elements

    self.addContent(content);

    if (!self.group.length) {
      return;
    }

    self.init();
  };

  $.extend(FancyBox.prototype, {
    // Create DOM structure
    // ====================
    init: function init() {
      var self = this,
          firstItem = self.group[self.currIndex],
          firstItemOpts = firstItem.opts,
          $container,
          buttonStr;

      if (firstItemOpts.closeExisting) {
        $.fancybox.close(true);
      } // Hide scrollbars
      // ===============


      $("body").addClass("fancybox-active");

      if (!$.fancybox.getInstance() && firstItemOpts.hideScrollbar !== false && !$.fancybox.isMobile && document.body.scrollHeight > window.innerHeight) {
        $("head").append('<style id="fancybox-style-noscroll" type="text/css">.compensate-for-scrollbar{margin-right:' + (window.innerWidth - document.documentElement.clientWidth) + "px;}</style>");
        $("body").addClass("compensate-for-scrollbar");
      } // Build html markup and set references
      // ====================================
      // Build html code for buttons and insert into main template


      buttonStr = "";
      $.each(firstItemOpts.buttons, function (index, value) {
        buttonStr += firstItemOpts.btnTpl[value] || "";
      }); // Create markup from base template, it will be initially hidden to
      // avoid unnecessary work like painting while initializing is not complete

      $container = $(self.translate(self, firstItemOpts.baseTpl.replace("{{buttons}}", buttonStr).replace("{{arrows}}", firstItemOpts.btnTpl.arrowLeft + firstItemOpts.btnTpl.arrowRight))).attr("id", "fancybox-container-" + self.id).addClass(firstItemOpts.baseClass).data("FancyBox", self).appendTo(firstItemOpts.parentEl); // Create object holding references to jQuery wrapped nodes

      self.$refs = {
        container: $container
      };
      ["bg", "inner", "infobar", "toolbar", "stage", "caption", "navigation"].forEach(function (item) {
        self.$refs[item] = $container.find(".fancybox-" + item);
      });
      self.trigger("onInit"); // Enable events, deactive previous instances

      self.activate(); // Build slides, load and reveal content

      self.jumpTo(self.currIndex);
    },
    // Simple i18n support - replaces object keys found in template
    // with corresponding values
    // ============================================================
    translate: function translate(obj, str) {
      var arr = obj.opts.i18n[obj.opts.lang] || obj.opts.i18n.en;
      return str.replace(/\{\{(\w+)\}\}/g, function (match, n) {
        return arr[n] === undefined ? match : arr[n];
      });
    },
    // Populate current group with fresh content
    // Check if each object has valid type and content
    // ===============================================
    addContent: function addContent(content) {
      var self = this,
          items = $.makeArray(content),
          thumbs;
      $.each(items, function (i, item) {
        var obj = {},
            opts = {},
            $item,
            type,
            found,
            src,
            srcParts; // Step 1 - Make sure we have an object
        // ====================================

        if ($.isPlainObject(item)) {
          // We probably have manual usage here, something like
          // $.fancybox.open( [ { src : "image.jpg", type : "image" } ] )
          obj = item;
          opts = item.opts || item;
        } else if ($.type(item) === "object" && $(item).length) {
          // Here we probably have jQuery collection returned by some selector
          $item = $(item); // Support attributes like `data-options='{"touch" : false}'` and `data-touch='false'`

          opts = $item.data() || {};
          opts = $.extend(true, {}, opts, opts.options); // Here we store clicked element

          opts.$orig = $item;
          obj.src = self.opts.src || opts.src || $item.attr("href"); // Assume that simple syntax is used, for example:
          //   `$.fancybox.open( $("#test"), {} );`

          if (!obj.type && !obj.src) {
            obj.type = "inline";
            obj.src = item;
          }
        } else {
          // Assume we have a simple html code, for example:
          //   $.fancybox.open( '<div><h1>Hi!</h1></div>' );
          obj = {
            type: "html",
            src: item + ""
          };
        } // Each gallery object has full collection of options


        obj.opts = $.extend(true, {}, self.opts, opts); // Do not merge buttons array

        if ($.isArray(opts.buttons)) {
          obj.opts.buttons = opts.buttons;
        }

        if ($.fancybox.isMobile && obj.opts.mobile) {
          obj.opts = mergeOpts(obj.opts, obj.opts.mobile);
        } // Step 2 - Make sure we have content type, if not - try to guess
        // ==============================================================


        type = obj.type || obj.opts.type;
        src = obj.src || "";

        if (!type && src) {
          if (found = src.match(/\.(mp4|mov|ogv|webm)((\?|#).*)?$/i)) {
            type = "video";

            if (!obj.opts.video.format) {
              obj.opts.video.format = "video/" + (found[1] === "ogv" ? "ogg" : found[1]);
            }
          } else if (src.match(/(^data:image\/[a-z0-9+\/=]*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg|ico)((\?|#).*)?$)/i)) {
            type = "image";
          } else if (src.match(/\.(pdf)((\?|#).*)?$/i)) {
            type = "iframe";
            obj = $.extend(true, obj, {
              contentType: "pdf",
              opts: {
                iframe: {
                  preload: false
                }
              }
            });
          } else if (src.charAt(0) === "#") {
            type = "inline";
          }
        }

        if (type) {
          obj.type = type;
        } else {
          self.trigger("objectNeedsType", obj);
        }

        if (!obj.contentType) {
          obj.contentType = $.inArray(obj.type, ["html", "inline", "ajax"]) > -1 ? "html" : obj.type;
        } // Step 3 - Some adjustments
        // =========================


        obj.index = self.group.length;

        if (obj.opts.smallBtn == "auto") {
          obj.opts.smallBtn = $.inArray(obj.type, ["html", "inline", "ajax"]) > -1;
        }

        if (obj.opts.toolbar === "auto") {
          obj.opts.toolbar = !obj.opts.smallBtn;
        } // Find thumbnail image, check if exists and if is in the viewport


        obj.$thumb = obj.opts.$thumb || null;

        if (obj.opts.$trigger && obj.index === self.opts.index) {
          obj.$thumb = obj.opts.$trigger.find("img:first");

          if (obj.$thumb.length) {
            obj.opts.$orig = obj.opts.$trigger;
          }
        }

        if (!(obj.$thumb && obj.$thumb.length) && obj.opts.$orig) {
          obj.$thumb = obj.opts.$orig.find("img:first");
        }

        if (obj.$thumb && !obj.$thumb.length) {
          obj.$thumb = null;
        }

        obj.thumb = obj.opts.thumb || (obj.$thumb ? obj.$thumb[0].src : null); // "caption" is a "special" option, it can be used to customize caption per gallery item

        if ($.type(obj.opts.caption) === "function") {
          obj.opts.caption = obj.opts.caption.apply(item, [self, obj]);
        }

        if ($.type(self.opts.caption) === "function") {
          obj.opts.caption = self.opts.caption.apply(item, [self, obj]);
        } // Make sure we have caption as a string or jQuery object


        if (!(obj.opts.caption instanceof $)) {
          obj.opts.caption = obj.opts.caption === undefined ? "" : obj.opts.caption + "";
        } // Check if url contains "filter" used to filter the content
        // Example: "ajax.html #something"


        if (obj.type === "ajax") {
          srcParts = src.split(/\s+/, 2);

          if (srcParts.length > 1) {
            obj.src = srcParts.shift();
            obj.opts.filter = srcParts.shift();
          }
        } // Hide all buttons and disable interactivity for modal items


        if (obj.opts.modal) {
          obj.opts = $.extend(true, obj.opts, {
            trapFocus: true,
            // Remove buttons
            infobar: 0,
            toolbar: 0,
            smallBtn: 0,
            // Disable keyboard navigation
            keyboard: 0,
            // Disable some modules
            slideShow: 0,
            fullScreen: 0,
            thumbs: 0,
            touch: 0,
            // Disable click event handlers
            clickContent: false,
            clickSlide: false,
            clickOutside: false,
            dblclickContent: false,
            dblclickSlide: false,
            dblclickOutside: false
          });
        } // Step 4 - Add processed object to group
        // ======================================


        self.group.push(obj);
      }); // Update controls if gallery is already opened

      if (Object.keys(self.slides).length) {
        self.updateControls(); // Update thumbnails, if needed

        thumbs = self.Thumbs;

        if (thumbs && thumbs.isActive) {
          thumbs.create();
          thumbs.focus();
        }
      }
    },
    // Attach an event handler functions for:
    //   - navigation buttons
    //   - browser scrolling, resizing;
    //   - focusing
    //   - keyboard
    //   - detecting inactivity
    // ======================================
    addEvents: function addEvents() {
      var self = this;
      self.removeEvents(); // Make navigation elements clickable
      // ==================================

      self.$refs.container.on("click.fb-close", "[data-fancybox-close]", function (e) {
        e.stopPropagation();
        e.preventDefault();
        self.close(e);
      }).on("touchstart.fb-prev click.fb-prev", "[data-fancybox-prev]", function (e) {
        e.stopPropagation();
        e.preventDefault();
        self.previous();
      }).on("touchstart.fb-next click.fb-next", "[data-fancybox-next]", function (e) {
        e.stopPropagation();
        e.preventDefault();
        self.next();
      }).on("click.fb", "[data-fancybox-zoom]", function (e) {
        // Click handler for zoom button
        self[self.isScaledDown() ? "scaleToActual" : "scaleToFit"]();
      }); // Handle page scrolling and browser resizing
      // ==========================================

      $W.on("orientationchange.fb resize.fb", function (e) {
        if (e && e.originalEvent && e.originalEvent.type === "resize") {
          if (self.requestId) {
            cancelAFrame(self.requestId);
          }

          self.requestId = requestAFrame(function () {
            self.update(e);
          });
        } else {
          if (self.current && self.current.type === "iframe") {
            self.$refs.stage.hide();
          }

          setTimeout(function () {
            self.$refs.stage.show();
            self.update(e);
          }, $.fancybox.isMobile ? 600 : 250);
        }
      });
      $D.on("keydown.fb", function (e) {
        var instance = $.fancybox ? $.fancybox.getInstance() : null,
            current = instance.current,
            keycode = e.keyCode || e.which; // Trap keyboard focus inside of the modal
        // =======================================

        if (keycode == 9) {
          if (current.opts.trapFocus) {
            self.focus(e);
          }

          return;
        } // Enable keyboard navigation
        // ==========================


        if (!current.opts.keyboard || e.ctrlKey || e.altKey || e.shiftKey || $(e.target).is("input,textarea,video,audio,select")) {
          return;
        } // Backspace and Esc keys


        if (keycode === 8 || keycode === 27) {
          e.preventDefault();
          self.close(e);
          return;
        } // Left arrow and Up arrow


        if (keycode === 37 || keycode === 38) {
          e.preventDefault();
          self.previous();
          return;
        } // Righ arrow and Down arrow


        if (keycode === 39 || keycode === 40) {
          e.preventDefault();
          self.next();
          return;
        }

        self.trigger("afterKeydown", e, keycode);
      }); // Hide controls after some inactivity period

      if (self.group[self.currIndex].opts.idleTime) {
        self.idleSecondsCounter = 0;
        $D.on("mousemove.fb-idle mouseleave.fb-idle mousedown.fb-idle touchstart.fb-idle touchmove.fb-idle scroll.fb-idle keydown.fb-idle", function (e) {
          self.idleSecondsCounter = 0;

          if (self.isIdle) {
            self.showControls();
          }

          self.isIdle = false;
        });
        self.idleInterval = window.setInterval(function () {
          self.idleSecondsCounter++;

          if (self.idleSecondsCounter >= self.group[self.currIndex].opts.idleTime && !self.isDragging) {
            self.isIdle = true;
            self.idleSecondsCounter = 0;
            self.hideControls();
          }
        }, 1000);
      }
    },
    // Remove events added by the core
    // ===============================
    removeEvents: function removeEvents() {
      var self = this;
      $W.off("orientationchange.fb resize.fb");
      $D.off("keydown.fb .fb-idle");
      this.$refs.container.off(".fb-close .fb-prev .fb-next");

      if (self.idleInterval) {
        window.clearInterval(self.idleInterval);
        self.idleInterval = null;
      }
    },
    // Change to previous gallery item
    // ===============================
    previous: function previous(duration) {
      return this.jumpTo(this.currPos - 1, duration);
    },
    // Change to next gallery item
    // ===========================
    next: function next(duration) {
      return this.jumpTo(this.currPos + 1, duration);
    },
    // Switch to selected gallery item
    // ===============================
    jumpTo: function jumpTo(pos, duration) {
      var self = this,
          groupLen = self.group.length,
          firstRun,
          isMoved,
          loop,
          current,
          previous,
          slidePos,
          stagePos,
          prop,
          diff;

      if (self.isDragging || self.isClosing || self.isAnimating && self.firstRun) {
        return;
      } // Should loop?


      pos = parseInt(pos, 10);
      loop = self.current ? self.current.opts.loop : self.opts.loop;

      if (!loop && (pos < 0 || pos >= groupLen)) {
        return false;
      } // Check if opening for the first time; this helps to speed things up


      firstRun = self.firstRun = !Object.keys(self.slides).length; // Create slides

      previous = self.current;
      self.prevIndex = self.currIndex;
      self.prevPos = self.currPos;
      current = self.createSlide(pos);

      if (groupLen > 1) {
        if (loop || current.index < groupLen - 1) {
          self.createSlide(pos + 1);
        }

        if (loop || current.index > 0) {
          self.createSlide(pos - 1);
        }
      }

      self.current = current;
      self.currIndex = current.index;
      self.currPos = current.pos;
      self.trigger("beforeShow", firstRun);
      self.updateControls(); // Validate duration length

      current.forcedDuration = undefined;

      if ($.isNumeric(duration)) {
        current.forcedDuration = duration;
      } else {
        duration = current.opts[firstRun ? "animationDuration" : "transitionDuration"];
      }

      duration = parseInt(duration, 10); // Check if user has swiped the slides or if still animating

      isMoved = self.isMoved(current); // Make sure current slide is visible

      current.$slide.addClass("fancybox-slide--current"); // Fresh start - reveal container, current slide and start loading content

      if (firstRun) {
        if (current.opts.animationEffect && duration) {
          self.$refs.container.css("transition-duration", duration + "ms");
        }

        self.$refs.container.addClass("fancybox-is-open").trigger("focus"); // Attempt to load content into slide
        // This will later call `afterLoad` -> `revealContent`

        self.loadSlide(current);
        self.preload("image");
        return;
      } // Get actual slide/stage positions (before cleaning up)


      slidePos = $.fancybox.getTranslate(previous.$slide);
      stagePos = $.fancybox.getTranslate(self.$refs.stage); // Clean up all slides

      $.each(self.slides, function (index, slide) {
        $.fancybox.stop(slide.$slide, true);
      });

      if (previous.pos !== current.pos) {
        previous.isComplete = false;
      }

      previous.$slide.removeClass("fancybox-slide--complete fancybox-slide--current"); // If slides are out of place, then animate them to correct position

      if (isMoved) {
        // Calculate horizontal swipe distance
        diff = slidePos.left - (previous.pos * slidePos.width + previous.pos * previous.opts.gutter);
        $.each(self.slides, function (index, slide) {
          slide.$slide.removeClass("fancybox-animated").removeClass(function (index, className) {
            return (className.match(/(^|\s)fancybox-fx-\S+/g) || []).join(" ");
          }); // Make sure that each slide is in equal distance
          // This is mostly needed for freshly added slides, because they are not yet positioned

          var leftPos = slide.pos * slidePos.width + slide.pos * slide.opts.gutter;
          $.fancybox.setTranslate(slide.$slide, {
            top: 0,
            left: leftPos - stagePos.left + diff
          });

          if (slide.pos !== current.pos) {
            slide.$slide.addClass("fancybox-slide--" + (slide.pos > current.pos ? "next" : "previous"));
          } // Redraw to make sure that transition will start


          forceRedraw(slide.$slide); // Animate the slide

          $.fancybox.animate(slide.$slide, {
            top: 0,
            left: (slide.pos - current.pos) * slidePos.width + (slide.pos - current.pos) * slide.opts.gutter
          }, duration, function () {
            slide.$slide.css({
              transform: "",
              opacity: ""
            }).removeClass("fancybox-slide--next fancybox-slide--previous");

            if (slide.pos === self.currPos) {
              self.complete();
            }
          });
        });
      } else if (duration && current.opts.transitionEffect) {
        // Set transition effect for previously active slide
        prop = "fancybox-animated fancybox-fx-" + current.opts.transitionEffect;
        previous.$slide.addClass("fancybox-slide--" + (previous.pos > current.pos ? "next" : "previous"));
        $.fancybox.animate(previous.$slide, prop, duration, function () {
          previous.$slide.removeClass(prop).removeClass("fancybox-slide--next fancybox-slide--previous");
        }, false);
      }

      if (current.isLoaded) {
        self.revealContent(current);
      } else {
        self.loadSlide(current);
      }

      self.preload("image");
    },
    // Create new "slide" element
    // These are gallery items  that are actually added to DOM
    // =======================================================
    createSlide: function createSlide(pos) {
      var self = this,
          $slide,
          index;
      index = pos % self.group.length;
      index = index < 0 ? self.group.length + index : index;

      if (!self.slides[pos] && self.group[index]) {
        $slide = $('<div class="fancybox-slide"></div>').appendTo(self.$refs.stage);
        self.slides[pos] = $.extend(true, {}, self.group[index], {
          pos: pos,
          $slide: $slide,
          isLoaded: false
        });
        self.updateSlide(self.slides[pos]);
      }

      return self.slides[pos];
    },
    // Scale image to the actual size of the image;
    // x and y values should be relative to the slide
    // ==============================================
    scaleToActual: function scaleToActual(x, y, duration) {
      var self = this,
          current = self.current,
          $content = current.$content,
          canvasWidth = $.fancybox.getTranslate(current.$slide).width,
          canvasHeight = $.fancybox.getTranslate(current.$slide).height,
          newImgWidth = current.width,
          newImgHeight = current.height,
          imgPos,
          posX,
          posY,
          scaleX,
          scaleY;

      if (self.isAnimating || self.isMoved() || !$content || !(current.type == "image" && current.isLoaded && !current.hasError)) {
        return;
      }

      self.isAnimating = true;
      $.fancybox.stop($content);
      x = x === undefined ? canvasWidth * 0.5 : x;
      y = y === undefined ? canvasHeight * 0.5 : y;
      imgPos = $.fancybox.getTranslate($content);
      imgPos.top -= $.fancybox.getTranslate(current.$slide).top;
      imgPos.left -= $.fancybox.getTranslate(current.$slide).left;
      scaleX = newImgWidth / imgPos.width;
      scaleY = newImgHeight / imgPos.height; // Get center position for original image

      posX = canvasWidth * 0.5 - newImgWidth * 0.5;
      posY = canvasHeight * 0.5 - newImgHeight * 0.5; // Make sure image does not move away from edges

      if (newImgWidth > canvasWidth) {
        posX = imgPos.left * scaleX - (x * scaleX - x);

        if (posX > 0) {
          posX = 0;
        }

        if (posX < canvasWidth - newImgWidth) {
          posX = canvasWidth - newImgWidth;
        }
      }

      if (newImgHeight > canvasHeight) {
        posY = imgPos.top * scaleY - (y * scaleY - y);

        if (posY > 0) {
          posY = 0;
        }

        if (posY < canvasHeight - newImgHeight) {
          posY = canvasHeight - newImgHeight;
        }
      }

      self.updateCursor(newImgWidth, newImgHeight);
      $.fancybox.animate($content, {
        top: posY,
        left: posX,
        scaleX: scaleX,
        scaleY: scaleY
      }, duration || 366, function () {
        self.isAnimating = false;
      }); // Stop slideshow

      if (self.SlideShow && self.SlideShow.isActive) {
        self.SlideShow.stop();
      }
    },
    // Scale image to fit inside parent element
    // ========================================
    scaleToFit: function scaleToFit(duration) {
      var self = this,
          current = self.current,
          $content = current.$content,
          end;

      if (self.isAnimating || self.isMoved() || !$content || !(current.type == "image" && current.isLoaded && !current.hasError)) {
        return;
      }

      self.isAnimating = true;
      $.fancybox.stop($content);
      end = self.getFitPos(current);
      self.updateCursor(end.width, end.height);
      $.fancybox.animate($content, {
        top: end.top,
        left: end.left,
        scaleX: end.width / $content.width(),
        scaleY: end.height / $content.height()
      }, duration || 366, function () {
        self.isAnimating = false;
      });
    },
    // Calculate image size to fit inside viewport
    // ===========================================
    getFitPos: function getFitPos(slide) {
      var self = this,
          $content = slide.$content,
          $slide = slide.$slide,
          width = slide.width || slide.opts.width,
          height = slide.height || slide.opts.height,
          maxWidth,
          maxHeight,
          minRatio,
          aspectRatio,
          rez = {};

      if (!slide.isLoaded || !$content || !$content.length) {
        return false;
      }

      maxWidth = $.fancybox.getTranslate(self.$refs.stage).width;
      maxHeight = $.fancybox.getTranslate(self.$refs.stage).height;
      maxWidth -= parseFloat($slide.css("paddingLeft")) + parseFloat($slide.css("paddingRight")) + parseFloat($content.css("marginLeft")) + parseFloat($content.css("marginRight"));
      maxHeight -= parseFloat($slide.css("paddingTop")) + parseFloat($slide.css("paddingBottom")) + parseFloat($content.css("marginTop")) + parseFloat($content.css("marginBottom"));

      if (!width || !height) {
        width = maxWidth;
        height = maxHeight;
      }

      minRatio = Math.min(1, maxWidth / width, maxHeight / height);
      width = minRatio * width;
      height = minRatio * height; // Adjust width/height to precisely fit into container

      if (width > maxWidth - 0.5) {
        width = maxWidth;
      }

      if (height > maxHeight - 0.5) {
        height = maxHeight;
      }

      if (slide.type === "image") {
        rez.top = Math.floor((maxHeight - height) * 0.5) + parseFloat($slide.css("paddingTop"));
        rez.left = Math.floor((maxWidth - width) * 0.5) + parseFloat($slide.css("paddingLeft"));
      } else if (slide.contentType === "video") {
        // Force aspect ratio for the video
        // "I say the whole world must learn of our peaceful ways… by force!"
        aspectRatio = slide.opts.width && slide.opts.height ? width / height : slide.opts.ratio || 16 / 9;

        if (height > width / aspectRatio) {
          height = width / aspectRatio;
        } else if (width > height * aspectRatio) {
          width = height * aspectRatio;
        }
      }

      rez.width = width;
      rez.height = height;
      return rez;
    },
    // Update content size and position for all slides
    // ==============================================
    update: function update(e) {
      var self = this;
      $.each(self.slides, function (key, slide) {
        self.updateSlide(slide, e);
      });
    },
    // Update slide content position and size
    // ======================================
    updateSlide: function updateSlide(slide, e) {
      var self = this,
          $content = slide && slide.$content,
          width = slide.width || slide.opts.width,
          height = slide.height || slide.opts.height,
          $slide = slide.$slide; // First, prevent caption overlap, if needed

      self.adjustCaption(slide); // Then resize content to fit inside the slide

      if ($content && (width || height || slide.contentType === "video") && !slide.hasError) {
        $.fancybox.stop($content);
        $.fancybox.setTranslate($content, self.getFitPos(slide));

        if (slide.pos === self.currPos) {
          self.isAnimating = false;
          self.updateCursor();
        }
      } // Then some adjustments


      self.adjustLayout(slide);

      if ($slide.length) {
        $slide.trigger("refresh");

        if (slide.pos === self.currPos) {
          self.$refs.toolbar.add(self.$refs.navigation.find(".fancybox-button--arrow_right")).toggleClass("compensate-for-scrollbar", $slide.get(0).scrollHeight > $slide.get(0).clientHeight);
        }
      }

      self.trigger("onUpdate", slide, e);
    },
    // Horizontally center slide
    // =========================
    centerSlide: function centerSlide(duration) {
      var self = this,
          current = self.current,
          $slide = current.$slide;

      if (self.isClosing || !current) {
        return;
      }

      $slide.siblings().css({
        transform: "",
        opacity: ""
      });
      $slide.parent().children().removeClass("fancybox-slide--previous fancybox-slide--next");
      $.fancybox.animate($slide, {
        top: 0,
        left: 0,
        opacity: 1
      }, duration === undefined ? 0 : duration, function () {
        // Clean up
        $slide.css({
          transform: "",
          opacity: ""
        });

        if (!current.isComplete) {
          self.complete();
        }
      }, false);
    },
    // Check if current slide is moved (swiped)
    // ========================================
    isMoved: function isMoved(slide) {
      var current = slide || this.current,
          slidePos,
          stagePos;

      if (!current) {
        return false;
      }

      stagePos = $.fancybox.getTranslate(this.$refs.stage);
      slidePos = $.fancybox.getTranslate(current.$slide);
      return !current.$slide.hasClass("fancybox-animated") && (Math.abs(slidePos.top - stagePos.top) > 0.5 || Math.abs(slidePos.left - stagePos.left) > 0.5);
    },
    // Update cursor style depending if content can be zoomed
    // ======================================================
    updateCursor: function updateCursor(nextWidth, nextHeight) {
      var self = this,
          current = self.current,
          $container = self.$refs.container,
          canPan,
          isZoomable;

      if (!current || self.isClosing || !self.Guestures) {
        return;
      }

      $container.removeClass("fancybox-is-zoomable fancybox-can-zoomIn fancybox-can-zoomOut fancybox-can-swipe fancybox-can-pan");
      canPan = self.canPan(nextWidth, nextHeight);
      isZoomable = canPan ? true : self.isZoomable();
      $container.toggleClass("fancybox-is-zoomable", isZoomable);
      $("[data-fancybox-zoom]").prop("disabled", !isZoomable);

      if (canPan) {
        $container.addClass("fancybox-can-pan");
      } else if (isZoomable && (current.opts.clickContent === "zoom" || $.isFunction(current.opts.clickContent) && current.opts.clickContent(current) == "zoom")) {
        $container.addClass("fancybox-can-zoomIn");
      } else if (current.opts.touch && (current.opts.touch.vertical || self.group.length > 1) && current.contentType !== "video") {
        $container.addClass("fancybox-can-swipe");
      }
    },
    // Check if current slide is zoomable
    // ==================================
    isZoomable: function isZoomable() {
      var self = this,
          current = self.current,
          fitPos; // Assume that slide is zoomable if:
      //   - image is still loading
      //   - actual size of the image is smaller than available area

      if (current && !self.isClosing && current.type === "image" && !current.hasError) {
        if (!current.isLoaded) {
          return true;
        }

        fitPos = self.getFitPos(current);

        if (fitPos && (current.width > fitPos.width || current.height > fitPos.height)) {
          return true;
        }
      }

      return false;
    },
    // Check if current image dimensions are smaller than actual
    // =========================================================
    isScaledDown: function isScaledDown(nextWidth, nextHeight) {
      var self = this,
          rez = false,
          current = self.current,
          $content = current.$content;

      if (nextWidth !== undefined && nextHeight !== undefined) {
        rez = nextWidth < current.width && nextHeight < current.height;
      } else if ($content) {
        rez = $.fancybox.getTranslate($content);
        rez = rez.width < current.width && rez.height < current.height;
      }

      return rez;
    },
    // Check if image dimensions exceed parent element
    // ===============================================
    canPan: function canPan(nextWidth, nextHeight) {
      var self = this,
          current = self.current,
          pos = null,
          rez = false;

      if (current.type === "image" && (current.isComplete || nextWidth && nextHeight) && !current.hasError) {
        rez = self.getFitPos(current);

        if (nextWidth !== undefined && nextHeight !== undefined) {
          pos = {
            width: nextWidth,
            height: nextHeight
          };
        } else if (current.isComplete) {
          pos = $.fancybox.getTranslate(current.$content);
        }

        if (pos && rez) {
          rez = Math.abs(pos.width - rez.width) > 1.5 || Math.abs(pos.height - rez.height) > 1.5;
        }
      }

      return rez;
    },
    // Load content into the slide
    // ===========================
    loadSlide: function loadSlide(slide) {
      var self = this,
          type,
          $slide,
          ajaxLoad;

      if (slide.isLoading || slide.isLoaded) {
        return;
      }

      slide.isLoading = true;

      if (self.trigger("beforeLoad", slide) === false) {
        slide.isLoading = false;
        return false;
      }

      type = slide.type;
      $slide = slide.$slide;
      $slide.off("refresh").trigger("onReset").addClass(slide.opts.slideClass); // Create content depending on the type

      switch (type) {
        case "image":
          self.setImage(slide);
          break;

        case "iframe":
          self.setIframe(slide);
          break;

        case "html":
          self.setContent(slide, slide.src || slide.content);
          break;

        case "video":
          self.setContent(slide, slide.opts.video.tpl.replace(/\{\{src\}\}/gi, slide.src).replace("{{format}}", slide.opts.videoFormat || slide.opts.video.format || "").replace("{{poster}}", slide.thumb || ""));
          break;

        case "inline":
          if ($(slide.src).length) {
            self.setContent(slide, $(slide.src));
          } else {
            self.setError(slide);
          }

          break;

        case "ajax":
          self.showLoading(slide);
          ajaxLoad = $.ajax($.extend({}, slide.opts.ajax.settings, {
            url: slide.src,
            success: function success(data, textStatus) {
              if (textStatus === "success") {
                self.setContent(slide, data);
              }
            },
            error: function error(jqXHR, textStatus) {
              if (jqXHR && textStatus !== "abort") {
                self.setError(slide);
              }
            }
          }));
          $slide.one("onReset", function () {
            ajaxLoad.abort();
          });
          break;

        default:
          self.setError(slide);
          break;
      }

      return true;
    },
    // Use thumbnail image, if possible
    // ================================
    setImage: function setImage(slide) {
      var self = this,
          ghost; // Check if need to show loading icon

      setTimeout(function () {
        var $img = slide.$image;

        if (!self.isClosing && slide.isLoading && (!$img || !$img.length || !$img[0].complete) && !slide.hasError) {
          self.showLoading(slide);
        }
      }, 50); //Check if image has srcset

      self.checkSrcset(slide); // This will be wrapper containing both ghost and actual image

      slide.$content = $('<div class="fancybox-content"></div>').addClass("fancybox-is-hidden").appendTo(slide.$slide.addClass("fancybox-slide--image")); // If we have a thumbnail, we can display it while actual image is loading
      // Users will not stare at black screen and actual image will appear gradually

      if (slide.opts.preload !== false && slide.opts.width && slide.opts.height && slide.thumb) {
        slide.width = slide.opts.width;
        slide.height = slide.opts.height;
        ghost = document.createElement("img");

        ghost.onerror = function () {
          $(this).remove();
          slide.$ghost = null;
        };

        ghost.onload = function () {
          self.afterLoad(slide);
        };

        slide.$ghost = $(ghost).addClass("fancybox-image").appendTo(slide.$content).attr("src", slide.thumb);
      } // Start loading actual image


      self.setBigImage(slide);
    },
    // Check if image has srcset and get the source
    // ============================================
    checkSrcset: function checkSrcset(slide) {
      var srcset = slide.opts.srcset || slide.opts.image.srcset,
          found,
          temp,
          pxRatio,
          windowWidth; // If we have "srcset", then we need to find first matching "src" value.
      // This is necessary, because when you set an src attribute, the browser will preload the image
      // before any javascript or even CSS is applied.

      if (srcset) {
        pxRatio = window.devicePixelRatio || 1;
        windowWidth = window.innerWidth * pxRatio;
        temp = srcset.split(",").map(function (el) {
          var ret = {};
          el.trim().split(/\s+/).forEach(function (el, i) {
            var value = parseInt(el.substring(0, el.length - 1), 10);

            if (i === 0) {
              return ret.url = el;
            }

            if (value) {
              ret.value = value;
              ret.postfix = el[el.length - 1];
            }
          });
          return ret;
        }); // Sort by value

        temp.sort(function (a, b) {
          return a.value - b.value;
        }); // Ok, now we have an array of all srcset values

        for (var j = 0; j < temp.length; j++) {
          var el = temp[j];

          if (el.postfix === "w" && el.value >= windowWidth || el.postfix === "x" && el.value >= pxRatio) {
            found = el;
            break;
          }
        } // If not found, take the last one


        if (!found && temp.length) {
          found = temp[temp.length - 1];
        }

        if (found) {
          slide.src = found.url; // If we have default width/height values, we can calculate height for matching source

          if (slide.width && slide.height && found.postfix == "w") {
            slide.height = slide.width / slide.height * found.value;
            slide.width = found.value;
          }

          slide.opts.srcset = srcset;
        }
      }
    },
    // Create full-size image
    // ======================
    setBigImage: function setBigImage(slide) {
      var self = this,
          img = document.createElement("img"),
          $img = $(img);
      slide.$image = $img.one("error", function () {
        self.setError(slide);
      }).one("load", function () {
        var sizes;

        if (!slide.$ghost) {
          self.resolveImageSlideSize(slide, this.naturalWidth, this.naturalHeight);
          self.afterLoad(slide);
        }

        if (self.isClosing) {
          return;
        }

        if (slide.opts.srcset) {
          sizes = slide.opts.sizes;

          if (!sizes || sizes === "auto") {
            sizes = (slide.width / slide.height > 1 && $W.width() / $W.height() > 1 ? "100" : Math.round(slide.width / slide.height * 100)) + "vw";
          }

          $img.attr("sizes", sizes).attr("srcset", slide.opts.srcset);
        } // Hide temporary image after some delay


        if (slide.$ghost) {
          setTimeout(function () {
            if (slide.$ghost && !self.isClosing) {
              slide.$ghost.hide();
            }
          }, Math.min(300, Math.max(1000, slide.height / 1600)));
        }

        self.hideLoading(slide);
      }).addClass("fancybox-image").attr("src", slide.src).appendTo(slide.$content);

      if ((img.complete || img.readyState == "complete") && $img.naturalWidth && $img.naturalHeight) {
        $img.trigger("load");
      } else if (img.error) {
        $img.trigger("error");
      }
    },
    // Computes the slide size from image size and maxWidth/maxHeight
    // ==============================================================
    resolveImageSlideSize: function resolveImageSlideSize(slide, imgWidth, imgHeight) {
      var maxWidth = parseInt(slide.opts.width, 10),
          maxHeight = parseInt(slide.opts.height, 10); // Sets the default values from the image

      slide.width = imgWidth;
      slide.height = imgHeight;

      if (maxWidth > 0) {
        slide.width = maxWidth;
        slide.height = Math.floor(maxWidth * imgHeight / imgWidth);
      }

      if (maxHeight > 0) {
        slide.width = Math.floor(maxHeight * imgWidth / imgHeight);
        slide.height = maxHeight;
      }
    },
    // Create iframe wrapper, iframe and bindings
    // ==========================================
    setIframe: function setIframe(slide) {
      var self = this,
          opts = slide.opts.iframe,
          $slide = slide.$slide,
          $iframe;
      slide.$content = $('<div class="fancybox-content' + (opts.preload ? " fancybox-is-hidden" : "") + '"></div>').css(opts.css).appendTo($slide);
      $slide.addClass("fancybox-slide--" + slide.contentType);
      slide.$iframe = $iframe = $(opts.tpl.replace(/\{rnd\}/g, new Date().getTime())).attr(opts.attr).appendTo(slide.$content);

      if (opts.preload) {
        self.showLoading(slide); // Unfortunately, it is not always possible to determine if iframe is successfully loaded
        // (due to browser security policy)

        $iframe.on("load.fb error.fb", function (e) {
          this.isReady = 1;
          slide.$slide.trigger("refresh");
          self.afterLoad(slide);
        }); // Recalculate iframe content size
        // ===============================

        $slide.on("refresh.fb", function () {
          var $content = slide.$content,
              frameWidth = opts.css.width,
              frameHeight = opts.css.height,
              $contents,
              $body;

          if ($iframe[0].isReady !== 1) {
            return;
          }

          try {
            $contents = $iframe.contents();
            $body = $contents.find("body");
          } catch (ignore) {} // Calculate content dimensions, if it is accessible


          if ($body && $body.length && $body.children().length) {
            // Avoid scrolling to top (if multiple instances)
            $slide.css("overflow", "visible");
            $content.css({
              width: "100%",
              "max-width": "100%",
              height: "9999px"
            });

            if (frameWidth === undefined) {
              frameWidth = Math.ceil(Math.max($body[0].clientWidth, $body.outerWidth(true)));
            }

            $content.css("width", frameWidth ? frameWidth : "").css("max-width", "");

            if (frameHeight === undefined) {
              frameHeight = Math.ceil(Math.max($body[0].clientHeight, $body.outerHeight(true)));
            }

            $content.css("height", frameHeight ? frameHeight : "");
            $slide.css("overflow", "auto");
          }

          $content.removeClass("fancybox-is-hidden");
        });
      } else {
        self.afterLoad(slide);
      }

      $iframe.attr("src", slide.src); // Remove iframe if closing or changing gallery item

      $slide.one("onReset", function () {
        // This helps IE not to throw errors when closing
        try {
          $(this).find("iframe").hide().unbind().attr("src", "//about:blank");
        } catch (ignore) {}

        $(this).off("refresh.fb").empty();
        slide.isLoaded = false;
        slide.isRevealed = false;
      });
    },
    // Wrap and append content to the slide
    // ======================================
    setContent: function setContent(slide, content) {
      var self = this;

      if (self.isClosing) {
        return;
      }

      self.hideLoading(slide);

      if (slide.$content) {
        $.fancybox.stop(slide.$content);
      }

      slide.$slide.empty(); // If content is a jQuery object, then it will be moved to the slide.
      // The placeholder is created so we will know where to put it back.

      if (isQuery(content) && content.parent().length) {
        // Make sure content is not already moved to fancyBox
        if (content.hasClass("fancybox-content") || content.parent().hasClass("fancybox-content")) {
          content.parents(".fancybox-slide").trigger("onReset");
        } // Create temporary element marking original place of the content


        slide.$placeholder = $("<div>").hide().insertAfter(content); // Make sure content is visible

        content.css("display", "inline-block");
      } else if (!slide.hasError) {
        // If content is just a plain text, try to convert it to html
        if ($.type(content) === "string") {
          content = $("<div>").append($.trim(content)).contents();
        } // If "filter" option is provided, then filter content


        if (slide.opts.filter) {
          content = $("<div>").html(content).find(slide.opts.filter);
        }
      }

      slide.$slide.one("onReset", function () {
        // Pause all html5 video/audio
        $(this).find("video,audio").trigger("pause"); // Put content back

        if (slide.$placeholder) {
          slide.$placeholder.after(content.removeClass("fancybox-content").hide()).remove();
          slide.$placeholder = null;
        } // Remove custom close button


        if (slide.$smallBtn) {
          slide.$smallBtn.remove();
          slide.$smallBtn = null;
        } // Remove content and mark slide as not loaded


        if (!slide.hasError) {
          $(this).empty();
          slide.isLoaded = false;
          slide.isRevealed = false;
        }
      });
      $(content).appendTo(slide.$slide);

      if ($(content).is("video,audio")) {
        $(content).addClass("fancybox-video");
        $(content).wrap("<div></div>");
        slide.contentType = "video";
        slide.opts.width = slide.opts.width || $(content).attr("width");
        slide.opts.height = slide.opts.height || $(content).attr("height");
      }

      slide.$content = slide.$slide.children().filter("div,form,main,video,audio,article,.fancybox-content").first();
      slide.$content.siblings().hide(); // Re-check if there is a valid content
      // (in some cases, ajax response can contain various elements or plain text)

      if (!slide.$content.length) {
        slide.$content = slide.$slide.wrapInner("<div></div>").children().first();
      }

      slide.$content.addClass("fancybox-content");
      slide.$slide.addClass("fancybox-slide--" + slide.contentType);
      self.afterLoad(slide);
    },
    // Display error message
    // =====================
    setError: function setError(slide) {
      slide.hasError = true;
      slide.$slide.trigger("onReset").removeClass("fancybox-slide--" + slide.contentType).addClass("fancybox-slide--error");
      slide.contentType = "html";
      this.setContent(slide, this.translate(slide, slide.opts.errorTpl));

      if (slide.pos === this.currPos) {
        this.isAnimating = false;
      }
    },
    // Show loading icon inside the slide
    // ==================================
    showLoading: function showLoading(slide) {
      var self = this;
      slide = slide || self.current;

      if (slide && !slide.$spinner) {
        slide.$spinner = $(self.translate(self, self.opts.spinnerTpl)).appendTo(slide.$slide).hide().fadeIn("fast");
      }
    },
    // Remove loading icon from the slide
    // ==================================
    hideLoading: function hideLoading(slide) {
      var self = this;
      slide = slide || self.current;

      if (slide && slide.$spinner) {
        slide.$spinner.stop().remove();
        delete slide.$spinner;
      }
    },
    // Adjustments after slide content has been loaded
    // ===============================================
    afterLoad: function afterLoad(slide) {
      var self = this;

      if (self.isClosing) {
        return;
      }

      slide.isLoading = false;
      slide.isLoaded = true;
      self.trigger("afterLoad", slide);
      self.hideLoading(slide); // Add small close button

      if (slide.opts.smallBtn && (!slide.$smallBtn || !slide.$smallBtn.length)) {
        slide.$smallBtn = $(self.translate(slide, slide.opts.btnTpl.smallBtn)).appendTo(slide.$content);
      } // Disable right click


      if (slide.opts.protect && slide.$content && !slide.hasError) {
        slide.$content.on("contextmenu.fb", function (e) {
          if (e.button == 2) {
            e.preventDefault();
          }

          return true;
        }); // Add fake element on top of the image
        // This makes a bit harder for user to select image

        if (slide.type === "image") {
          $('<div class="fancybox-spaceball"></div>').appendTo(slide.$content);
        }
      }

      self.adjustCaption(slide);
      self.adjustLayout(slide);

      if (slide.pos === self.currPos) {
        self.updateCursor();
      }

      self.revealContent(slide);
    },
    // Prevent caption overlap,
    // fix css inconsistency across browsers
    // =====================================
    adjustCaption: function adjustCaption(slide) {
      var self = this,
          current = slide || self.current,
          caption = current.opts.caption,
          preventOverlap = current.opts.preventCaptionOverlap,
          $caption = self.$refs.caption,
          $clone,
          captionH = false;
      $caption.toggleClass("fancybox-caption--separate", preventOverlap);

      if (preventOverlap && caption && caption.length) {
        if (current.pos !== self.currPos) {
          $clone = $caption.clone().appendTo($caption.parent());
          $clone.children().eq(0).empty().html(caption);
          captionH = $clone.outerHeight(true);
          $clone.empty().remove();
        } else if (self.$caption) {
          captionH = self.$caption.outerHeight(true);
        }

        current.$slide.css("padding-bottom", captionH || "");
      }
    },
    // Simple hack to fix inconsistency across browsers, described here (affects Edge, too):
    // https://bugzilla.mozilla.org/show_bug.cgi?id=748518
    // ====================================================================================
    adjustLayout: function adjustLayout(slide) {
      var self = this,
          current = slide || self.current,
          scrollHeight,
          marginBottom,
          inlinePadding,
          actualPadding;

      if (current.isLoaded && current.opts.disableLayoutFix !== true) {
        current.$content.css("margin-bottom", ""); // If we would always set margin-bottom for the content,
        // then it would potentially break vertical align

        if (current.$content.outerHeight() > current.$slide.height() + 0.5) {
          inlinePadding = current.$slide[0].style["padding-bottom"];
          actualPadding = current.$slide.css("padding-bottom");

          if (parseFloat(actualPadding) > 0) {
            scrollHeight = current.$slide[0].scrollHeight;
            current.$slide.css("padding-bottom", 0);

            if (Math.abs(scrollHeight - current.$slide[0].scrollHeight) < 1) {
              marginBottom = actualPadding;
            }

            current.$slide.css("padding-bottom", inlinePadding);
          }
        }

        current.$content.css("margin-bottom", marginBottom);
      }
    },
    // Make content visible
    // This method is called right after content has been loaded or
    // user navigates gallery and transition should start
    // ============================================================
    revealContent: function revealContent(slide) {
      var self = this,
          $slide = slide.$slide,
          end = false,
          start = false,
          isMoved = self.isMoved(slide),
          isRevealed = slide.isRevealed,
          effect,
          effectClassName,
          duration,
          opacity;
      slide.isRevealed = true;
      effect = slide.opts[self.firstRun ? "animationEffect" : "transitionEffect"];
      duration = slide.opts[self.firstRun ? "animationDuration" : "transitionDuration"];
      duration = parseInt(slide.forcedDuration === undefined ? duration : slide.forcedDuration, 10);

      if (isMoved || slide.pos !== self.currPos || !duration) {
        effect = false;
      } // Check if can zoom


      if (effect === "zoom") {
        if (slide.pos === self.currPos && duration && slide.type === "image" && !slide.hasError && (start = self.getThumbPos(slide))) {
          end = self.getFitPos(slide);
        } else {
          effect = "fade";
        }
      } // Zoom animation
      // ==============


      if (effect === "zoom") {
        self.isAnimating = true;
        end.scaleX = end.width / start.width;
        end.scaleY = end.height / start.height; // Check if we need to animate opacity

        opacity = slide.opts.zoomOpacity;

        if (opacity == "auto") {
          opacity = Math.abs(slide.width / slide.height - start.width / start.height) > 0.1;
        }

        if (opacity) {
          start.opacity = 0.1;
          end.opacity = 1;
        } // Draw image at start position


        $.fancybox.setTranslate(slide.$content.removeClass("fancybox-is-hidden"), start);
        forceRedraw(slide.$content); // Start animation

        $.fancybox.animate(slide.$content, end, duration, function () {
          self.isAnimating = false;
          self.complete();
        });
        return;
      }

      self.updateSlide(slide); // Simply show content if no effect
      // ================================

      if (!effect) {
        slide.$content.removeClass("fancybox-is-hidden");

        if (!isRevealed && isMoved && slide.type === "image" && !slide.hasError) {
          slide.$content.hide().fadeIn("fast");
        }

        if (slide.pos === self.currPos) {
          self.complete();
        }

        return;
      } // Prepare for CSS transiton
      // =========================


      $.fancybox.stop($slide); //effectClassName = "fancybox-animated fancybox-slide--" + (slide.pos >= self.prevPos ? "next" : "previous") + " fancybox-fx-" + effect;

      effectClassName = "fancybox-slide--" + (slide.pos >= self.prevPos ? "next" : "previous") + " fancybox-animated fancybox-fx-" + effect;
      $slide.addClass(effectClassName).removeClass("fancybox-slide--current"); //.addClass(effectClassName);

      slide.$content.removeClass("fancybox-is-hidden"); // Force reflow

      forceRedraw($slide);

      if (slide.type !== "image") {
        slide.$content.hide().show(0);
      }

      $.fancybox.animate($slide, "fancybox-slide--current", duration, function () {
        $slide.removeClass(effectClassName).css({
          transform: "",
          opacity: ""
        });

        if (slide.pos === self.currPos) {
          self.complete();
        }
      }, true);
    },
    // Check if we can and have to zoom from thumbnail
    //================================================
    getThumbPos: function getThumbPos(slide) {
      var rez = false,
          $thumb = slide.$thumb,
          thumbPos,
          btw,
          brw,
          bbw,
          blw;

      if (!$thumb || !inViewport($thumb[0])) {
        return false;
      }

      thumbPos = $.fancybox.getTranslate($thumb);
      btw = parseFloat($thumb.css("border-top-width") || 0);
      brw = parseFloat($thumb.css("border-right-width") || 0);
      bbw = parseFloat($thumb.css("border-bottom-width") || 0);
      blw = parseFloat($thumb.css("border-left-width") || 0);
      rez = {
        top: thumbPos.top + btw,
        left: thumbPos.left + blw,
        width: thumbPos.width - brw - blw,
        height: thumbPos.height - btw - bbw,
        scaleX: 1,
        scaleY: 1
      };
      return thumbPos.width > 0 && thumbPos.height > 0 ? rez : false;
    },
    // Final adjustments after current gallery item is moved to position
    // and it`s content is loaded
    // ==================================================================
    complete: function complete() {
      var self = this,
          current = self.current,
          slides = {},
          $el;

      if (self.isMoved() || !current.isLoaded) {
        return;
      }

      if (!current.isComplete) {
        current.isComplete = true;
        current.$slide.siblings().trigger("onReset");
        self.preload("inline"); // Trigger any CSS transiton inside the slide

        forceRedraw(current.$slide);
        current.$slide.addClass("fancybox-slide--complete"); // Remove unnecessary slides

        $.each(self.slides, function (key, slide) {
          if (slide.pos >= self.currPos - 1 && slide.pos <= self.currPos + 1) {
            slides[slide.pos] = slide;
          } else if (slide) {
            $.fancybox.stop(slide.$slide);
            slide.$slide.off().remove();
          }
        });
        self.slides = slides;
      }

      self.isAnimating = false;
      self.updateCursor();
      self.trigger("afterShow"); // Autoplay first html5 video/audio

      if (!!current.opts.video.autoStart) {
        current.$slide.find("video,audio").filter(":visible:first").trigger("play").one("ended", function () {
          if (Document.exitFullscreen) {
            Document.exitFullscreen();
          } else if (this.webkitExitFullscreen) {
            this.webkitExitFullscreen();
          }

          self.next();
        });
      } // Try to focus on the first focusable element


      if (current.opts.autoFocus && current.contentType === "html") {
        // Look for the first input with autofocus attribute
        $el = current.$content.find("input[autofocus]:enabled:visible:first");

        if ($el.length) {
          $el.trigger("focus");
        } else {
          self.focus(null, true);
        }
      } // Avoid jumping


      current.$slide.scrollTop(0).scrollLeft(0);
    },
    // Preload next and previous slides
    // ================================
    preload: function preload(type) {
      var self = this,
          prev,
          next;

      if (self.group.length < 2) {
        return;
      }

      next = self.slides[self.currPos + 1];
      prev = self.slides[self.currPos - 1];

      if (prev && prev.type === type) {
        self.loadSlide(prev);
      }

      if (next && next.type === type) {
        self.loadSlide(next);
      }
    },
    // Try to find and focus on the first focusable element
    // ====================================================
    focus: function focus(e, firstRun) {
      var self = this,
          focusableStr = ["a[href]", "area[href]", 'input:not([disabled]):not([type="hidden"]):not([aria-hidden])', "select:not([disabled]):not([aria-hidden])", "textarea:not([disabled]):not([aria-hidden])", "button:not([disabled]):not([aria-hidden])", "iframe", "object", "embed", "video", "audio", "[contenteditable]", '[tabindex]:not([tabindex^="-"])'].join(","),
          focusableItems,
          focusedItemIndex;

      if (self.isClosing) {
        return;
      }

      if (e || !self.current || !self.current.isComplete) {
        // Focus on any element inside fancybox
        focusableItems = self.$refs.container.find("*:visible");
      } else {
        // Focus inside current slide
        focusableItems = self.current.$slide.find("*:visible" + (firstRun ? ":not(.fancybox-close-small)" : ""));
      }

      focusableItems = focusableItems.filter(focusableStr).filter(function () {
        return $(this).css("visibility") !== "hidden" && !$(this).hasClass("disabled");
      });

      if (focusableItems.length) {
        focusedItemIndex = focusableItems.index(document.activeElement);

        if (e && e.shiftKey) {
          // Back tab
          if (focusedItemIndex < 0 || focusedItemIndex == 0) {
            e.preventDefault();
            focusableItems.eq(focusableItems.length - 1).trigger("focus");
          }
        } else {
          // Outside or Forward tab
          if (focusedItemIndex < 0 || focusedItemIndex == focusableItems.length - 1) {
            if (e) {
              e.preventDefault();
            }

            focusableItems.eq(0).trigger("focus");
          }
        }
      } else {
        self.$refs.container.trigger("focus");
      }
    },
    // Activates current instance - brings container to the front and enables keyboard,
    // notifies other instances about deactivating
    // =================================================================================
    activate: function activate() {
      var self = this; // Deactivate all instances

      $(".fancybox-container").each(function () {
        var instance = $(this).data("FancyBox"); // Skip self and closing instances

        if (instance && instance.id !== self.id && !instance.isClosing) {
          instance.trigger("onDeactivate");
          instance.removeEvents();
          instance.isVisible = false;
        }
      });
      self.isVisible = true;

      if (self.current || self.isIdle) {
        self.update();
        self.updateControls();
      }

      self.trigger("onActivate");
      self.addEvents();
    },
    // Start closing procedure
    // This will start "zoom-out" animation if needed and clean everything up afterwards
    // =================================================================================
    close: function close(e, d) {
      var self = this,
          current = self.current,
          effect,
          duration,
          $content,
          domRect,
          opacity,
          start,
          end;

      var done = function done() {
        self.cleanUp(e);
      };

      if (self.isClosing) {
        return false;
      }

      self.isClosing = true; // If beforeClose callback prevents closing, make sure content is centered

      if (self.trigger("beforeClose", e) === false) {
        self.isClosing = false;
        requestAFrame(function () {
          self.update();
        });
        return false;
      } // Remove all events
      // If there are multiple instances, they will be set again by "activate" method


      self.removeEvents();
      $content = current.$content;
      effect = current.opts.animationEffect;
      duration = $.isNumeric(d) ? d : effect ? current.opts.animationDuration : 0;
      current.$slide.removeClass("fancybox-slide--complete fancybox-slide--next fancybox-slide--previous fancybox-animated");

      if (e !== true) {
        $.fancybox.stop(current.$slide);
      } else {
        effect = false;
      } // Remove other slides


      current.$slide.siblings().trigger("onReset").remove(); // Trigger animations

      if (duration) {
        self.$refs.container.removeClass("fancybox-is-open").addClass("fancybox-is-closing").css("transition-duration", duration + "ms");
      } // Clean up


      self.hideLoading(current);
      self.hideControls(true);
      self.updateCursor(); // Check if possible to zoom-out

      if (effect === "zoom" && !($content && duration && current.type === "image" && !self.isMoved() && !current.hasError && (end = self.getThumbPos(current)))) {
        effect = "fade";
      }

      if (effect === "zoom") {
        $.fancybox.stop($content);
        domRect = $.fancybox.getTranslate($content);
        start = {
          top: domRect.top,
          left: domRect.left,
          scaleX: domRect.width / end.width,
          scaleY: domRect.height / end.height,
          width: end.width,
          height: end.height
        }; // Check if we need to animate opacity

        opacity = current.opts.zoomOpacity;

        if (opacity == "auto") {
          opacity = Math.abs(current.width / current.height - end.width / end.height) > 0.1;
        }

        if (opacity) {
          end.opacity = 0;
        }

        $.fancybox.setTranslate($content, start);
        forceRedraw($content);
        $.fancybox.animate($content, end, duration, done);
        return true;
      }

      if (effect && duration) {
        $.fancybox.animate(current.$slide.addClass("fancybox-slide--previous").removeClass("fancybox-slide--current"), "fancybox-animated fancybox-fx-" + effect, duration, done);
      } else {
        // If skip animation
        if (e === true) {
          setTimeout(done, duration);
        } else {
          done();
        }
      }

      return true;
    },
    // Final adjustments after removing the instance
    // =============================================
    cleanUp: function cleanUp(e) {
      var self = this,
          instance,
          $focus = self.current.opts.$orig,
          x,
          y;
      self.current.$slide.trigger("onReset");
      self.$refs.container.empty().remove();
      self.trigger("afterClose", e); // Place back focus

      if (!!self.current.opts.backFocus) {
        if (!$focus || !$focus.length || !$focus.is(":visible")) {
          $focus = self.$trigger;
        }

        if ($focus && $focus.length) {
          x = window.scrollX;
          y = window.scrollY;
          $focus.trigger("focus");
          $("html, body").scrollTop(y).scrollLeft(x);
        }
      }

      self.current = null; // Check if there are other instances

      instance = $.fancybox.getInstance();

      if (instance) {
        instance.activate();
      } else {
        $("body").removeClass("fancybox-active compensate-for-scrollbar");
        $("#fancybox-style-noscroll").remove();
      }
    },
    // Call callback and trigger an event
    // ==================================
    trigger: function trigger(name, slide) {
      var args = Array.prototype.slice.call(arguments, 1),
          self = this,
          obj = slide && slide.opts ? slide : self.current,
          rez;

      if (obj) {
        args.unshift(obj);
      } else {
        obj = self;
      }

      args.unshift(self);

      if ($.isFunction(obj.opts[name])) {
        rez = obj.opts[name].apply(obj, args);
      }

      if (rez === false) {
        return rez;
      }

      if (name === "afterClose" || !self.$refs) {
        $D.trigger(name + ".fb", args);
      } else {
        self.$refs.container.trigger(name + ".fb", args);
      }
    },
    // Update infobar values, navigation button states and reveal caption
    // ==================================================================
    updateControls: function updateControls() {
      var self = this,
          current = self.current,
          index = current.index,
          $container = self.$refs.container,
          $caption = self.$refs.caption,
          caption = current.opts.caption; // Recalculate content dimensions

      current.$slide.trigger("refresh"); // Set caption

      if (caption && caption.length) {
        self.$caption = $caption;
        $caption.children().eq(0).html(caption);
      } else {
        self.$caption = null;
      }

      if (!self.hasHiddenControls && !self.isIdle) {
        self.showControls();
      } // Update info and navigation elements


      $container.find("[data-fancybox-count]").html(self.group.length);
      $container.find("[data-fancybox-index]").html(index + 1);
      $container.find("[data-fancybox-prev]").prop("disabled", !current.opts.loop && index <= 0);
      $container.find("[data-fancybox-next]").prop("disabled", !current.opts.loop && index >= self.group.length - 1);

      if (current.type === "image") {
        // Re-enable buttons; update download button source
        $container.find("[data-fancybox-zoom]").show().end().find("[data-fancybox-download]").attr("href", current.opts.image.src || current.src).show();
      } else if (current.opts.toolbar) {
        $container.find("[data-fancybox-download],[data-fancybox-zoom]").hide();
      } // Make sure focus is not on disabled button/element


      if ($(document.activeElement).is(":hidden,[disabled]")) {
        self.$refs.container.trigger("focus");
      }
    },
    // Hide toolbar and caption
    // ========================
    hideControls: function hideControls(andCaption) {
      var self = this,
          arr = ["infobar", "toolbar", "nav"];

      if (andCaption || !self.current.opts.preventCaptionOverlap) {
        arr.push("caption");
      }

      this.$refs.container.removeClass(arr.map(function (i) {
        return "fancybox-show-" + i;
      }).join(" "));
      this.hasHiddenControls = true;
    },
    showControls: function showControls() {
      var self = this,
          opts = self.current ? self.current.opts : self.opts,
          $container = self.$refs.container;
      self.hasHiddenControls = false;
      self.idleSecondsCounter = 0;
      $container.toggleClass("fancybox-show-toolbar", !!(opts.toolbar && opts.buttons)).toggleClass("fancybox-show-infobar", !!(opts.infobar && self.group.length > 1)).toggleClass("fancybox-show-caption", !!self.$caption).toggleClass("fancybox-show-nav", !!(opts.arrows && self.group.length > 1)).toggleClass("fancybox-is-modal", !!opts.modal);
    },
    // Toggle toolbar and caption
    // ==========================
    toggleControls: function toggleControls() {
      if (this.hasHiddenControls) {
        this.showControls();
      } else {
        this.hideControls();
      }
    }
  });
  $.fancybox = {
    version: "3.5.7",
    defaults: defaults,
    // Get current instance and execute a command.
    //
    // Examples of usage:
    //
    //   $instance = $.fancybox.getInstance();
    //   $.fancybox.getInstance().jumpTo( 1 );
    //   $.fancybox.getInstance( 'jumpTo', 1 );
    //   $.fancybox.getInstance( function() {
    //       console.info( this.currIndex );
    //   });
    // ======================================================
    getInstance: function getInstance(command) {
      var instance = $('.fancybox-container:not(".fancybox-is-closing"):last').data("FancyBox"),
          args = Array.prototype.slice.call(arguments, 1);

      if (instance instanceof FancyBox) {
        if ($.type(command) === "string") {
          instance[command].apply(instance, args);
        } else if ($.type(command) === "function") {
          command.apply(instance, args);
        }

        return instance;
      }

      return false;
    },
    // Create new instance
    // ===================
    open: function open(items, opts, index) {
      return new FancyBox(items, opts, index);
    },
    // Close current or all instances
    // ==============================
    close: function close(all) {
      var instance = this.getInstance();

      if (instance) {
        instance.close(); // Try to find and close next instance

        if (all === true) {
          this.close(all);
        }
      }
    },
    // Close all instances and unbind all events
    // =========================================
    destroy: function destroy() {
      this.close(true);
      $D.add("body").off("click.fb-start", "**");
    },
    // Try to detect mobile devices
    // ============================
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    // Detect if 'translate3d' support is available
    // ============================================
    use3d: function () {
      var div = document.createElement("div");
      return window.getComputedStyle && window.getComputedStyle(div) && window.getComputedStyle(div).getPropertyValue("transform") && !(document.documentMode && document.documentMode < 11);
    }(),
    // Helper function to get current visual state of an element
    // returns array[ top, left, horizontal-scale, vertical-scale, opacity ]
    // =====================================================================
    getTranslate: function getTranslate($el) {
      var domRect;

      if (!$el || !$el.length) {
        return false;
      }

      domRect = $el[0].getBoundingClientRect();
      return {
        top: domRect.top || 0,
        left: domRect.left || 0,
        width: domRect.width,
        height: domRect.height,
        opacity: parseFloat($el.css("opacity"))
      };
    },
    // Shortcut for setting "translate3d" properties for element
    // Can set be used to set opacity, too
    // ========================================================
    setTranslate: function setTranslate($el, props) {
      var str = "",
          css = {};

      if (!$el || !props) {
        return;
      }

      if (props.left !== undefined || props.top !== undefined) {
        str = (props.left === undefined ? $el.position().left : props.left) + "px, " + (props.top === undefined ? $el.position().top : props.top) + "px";

        if (this.use3d) {
          str = "translate3d(" + str + ", 0px)";
        } else {
          str = "translate(" + str + ")";
        }
      }

      if (props.scaleX !== undefined && props.scaleY !== undefined) {
        str += " scale(" + props.scaleX + ", " + props.scaleY + ")";
      } else if (props.scaleX !== undefined) {
        str += " scaleX(" + props.scaleX + ")";
      }

      if (str.length) {
        css.transform = str;
      }

      if (props.opacity !== undefined) {
        css.opacity = props.opacity;
      }

      if (props.width !== undefined) {
        css.width = props.width;
      }

      if (props.height !== undefined) {
        css.height = props.height;
      }

      return $el.css(css);
    },
    // Simple CSS transition handler
    // =============================
    animate: function animate($el, to, duration, callback, leaveAnimationName) {
      var self = this,
          from;

      if ($.isFunction(duration)) {
        callback = duration;
        duration = null;
      }

      self.stop($el);
      from = self.getTranslate($el);
      $el.on(transitionEnd, function (e) {
        // Skip events from child elements and z-index change
        if (e && e.originalEvent && (!$el.is(e.originalEvent.target) || e.originalEvent.propertyName == "z-index")) {
          return;
        }

        self.stop($el);

        if ($.isNumeric(duration)) {
          $el.css("transition-duration", "");
        }

        if ($.isPlainObject(to)) {
          if (to.scaleX !== undefined && to.scaleY !== undefined) {
            self.setTranslate($el, {
              top: to.top,
              left: to.left,
              width: from.width * to.scaleX,
              height: from.height * to.scaleY,
              scaleX: 1,
              scaleY: 1
            });
          }
        } else if (leaveAnimationName !== true) {
          $el.removeClass(to);
        }

        if ($.isFunction(callback)) {
          callback(e);
        }
      });

      if ($.isNumeric(duration)) {
        $el.css("transition-duration", duration + "ms");
      } // Start animation by changing CSS properties or class name


      if ($.isPlainObject(to)) {
        if (to.scaleX !== undefined && to.scaleY !== undefined) {
          delete to.width;
          delete to.height;

          if ($el.parent().hasClass("fancybox-slide--image")) {
            $el.parent().addClass("fancybox-is-scaling");
          }
        }

        $.fancybox.setTranslate($el, to);
      } else {
        $el.addClass(to);
      } // Make sure that `transitionend` callback gets fired


      $el.data("timer", setTimeout(function () {
        $el.trigger(transitionEnd);
      }, duration + 33));
    },
    stop: function stop($el, callCallback) {
      if ($el && $el.length) {
        clearTimeout($el.data("timer"));

        if (callCallback) {
          $el.trigger(transitionEnd);
        }

        $el.off(transitionEnd).css("transition-duration", "");
        $el.parent().removeClass("fancybox-is-scaling");
      }
    }
  }; // Default click handler for "fancyboxed" links
  // ============================================

  function _run(e, opts) {
    var items = [],
        index = 0,
        $target,
        value,
        instance; // Avoid opening multiple times

    if (e && e.isDefaultPrevented()) {
      return;
    }

    e.preventDefault();
    opts = opts || {};

    if (e && e.data) {
      opts = mergeOpts(e.data.options, opts);
    }

    $target = opts.$target || $(e.currentTarget).trigger("blur");
    instance = $.fancybox.getInstance();

    if (instance && instance.$trigger && instance.$trigger.is($target)) {
      return;
    }

    if (opts.selector) {
      items = $(opts.selector);
    } else {
      // Get all related items and find index for clicked one
      value = $target.attr("data-fancybox") || "";

      if (value) {
        items = e.data ? e.data.items : [];
        items = items.length ? items.filter('[data-fancybox="' + value + '"]') : $('[data-fancybox="' + value + '"]');
      } else {
        items = [$target];
      }
    }

    index = $(items).index($target); // Sometimes current item can not be found

    if (index < 0) {
      index = 0;
    }

    instance = $.fancybox.open(items, opts, index); // Save last active element

    instance.$trigger = $target;
  } // Create a jQuery plugin
  // ======================


  $.fn.fancybox = function (options) {
    var selector;
    options = options || {};
    selector = options.selector || false;

    if (selector) {
      // Use body element instead of document so it executes first
      $("body").off("click.fb-start", selector).on("click.fb-start", selector, {
        options: options
      }, _run);
    } else {
      this.off("click.fb-start").on("click.fb-start", {
        items: this,
        options: options
      }, _run);
    }

    return this;
  }; // Self initializing plugin for all elements having `data-fancybox` attribute
  // ==========================================================================


  $D.on("click.fb-start", "[data-fancybox]", _run); // Enable "trigger elements"
  // =========================

  $D.on("click.fb-start", "[data-fancybox-trigger]", function (e) {
    $('[data-fancybox="' + $(this).attr("data-fancybox-trigger") + '"]').eq($(this).attr("data-fancybox-index") || 0).trigger("click.fb-start", {
      $trigger: $(this)
    });
  }); // Track focus event for better accessibility styling
  // ==================================================

  (function () {
    var buttonStr = ".fancybox-button",
        focusStr = "fancybox-focus",
        $pressed = null;
    $D.on("mousedown mouseup focus blur", buttonStr, function (e) {
      switch (e.type) {
        case "mousedown":
          $pressed = $(this);
          break;

        case "mouseup":
          $pressed = null;
          break;

        case "focusin":
          $(buttonStr).removeClass(focusStr);

          if (!$(this).is($pressed) && !$(this).is("[disabled]")) {
            $(this).addClass(focusStr);
          }

          break;

        case "focusout":
          $(buttonStr).removeClass(focusStr);
          break;
      }
    });
  })();
})(window, document, jQuery); // ==========================================================================
//
// Media
// Adds additional media type support
//
// ==========================================================================


(function ($) {
  "use strict"; // Object containing properties for each media type

  var defaults = {
    youtube: {
      matcher: /(youtube\.com|youtu\.be|youtube\-nocookie\.com)\/(watch\?(.*&)?v=|v\/|u\/|embed\/?)?(videoseries\?list=(.*)|[\w-]{11}|\?listType=(.*)&list=(.*))(.*)/i,
      params: {
        autoplay: 1,
        autohide: 1,
        fs: 1,
        rel: 0,
        hd: 1,
        wmode: "transparent",
        enablejsapi: 1,
        html5: 1
      },
      paramPlace: 8,
      type: "iframe",
      url: "https://www.youtube-nocookie.com/embed/$4",
      thumb: "https://img.youtube.com/vi/$4/hqdefault.jpg"
    },
    vimeo: {
      matcher: /^.+vimeo.com\/(.*\/)?([\d]+)(.*)?/,
      params: {
        autoplay: 1,
        hd: 1,
        show_title: 1,
        show_byline: 1,
        show_portrait: 0,
        fullscreen: 1
      },
      paramPlace: 3,
      type: "iframe",
      url: "//player.vimeo.com/video/$2"
    },
    instagram: {
      matcher: /(instagr\.am|instagram\.com)\/p\/([a-zA-Z0-9_\-]+)\/?/i,
      type: "image",
      url: "//$1/p/$2/media/?size=l"
    },
    // Examples:
    // http://maps.google.com/?ll=48.857995,2.294297&spn=0.007666,0.021136&t=m&z=16
    // https://www.google.com/maps/@37.7852006,-122.4146355,14.65z
    // https://www.google.com/maps/@52.2111123,2.9237542,6.61z?hl=en
    // https://www.google.com/maps/place/Googleplex/@37.4220041,-122.0833494,17z/data=!4m5!3m4!1s0x0:0x6c296c66619367e0!8m2!3d37.4219998!4d-122.0840572
    gmap_place: {
      matcher: /(maps\.)?google\.([a-z]{2,3}(\.[a-z]{2})?)\/(((maps\/(place\/(.*)\/)?\@(.*),(\d+.?\d+?)z))|(\?ll=))(.*)?/i,
      type: "iframe",
      url: function url(rez) {
        return "//maps.google." + rez[2] + "/?ll=" + (rez[9] ? rez[9] + "&z=" + Math.floor(rez[10]) + (rez[12] ? rez[12].replace(/^\//, "&") : "") : rez[12] + "").replace(/\?/, "&") + "&output=" + (rez[12] && rez[12].indexOf("layer=c") > 0 ? "svembed" : "embed");
      }
    },
    // Examples:
    // https://www.google.com/maps/search/Empire+State+Building/
    // https://www.google.com/maps/search/?api=1&query=centurylink+field
    // https://www.google.com/maps/search/?api=1&query=47.5951518,-122.3316393
    gmap_search: {
      matcher: /(maps\.)?google\.([a-z]{2,3}(\.[a-z]{2})?)\/(maps\/search\/)(.*)/i,
      type: "iframe",
      url: function url(rez) {
        return "//maps.google." + rez[2] + "/maps?q=" + rez[5].replace("query=", "q=").replace("api=1", "") + "&output=embed";
      }
    }
  }; // Formats matching url to final form

  var format = function format(url, rez, params) {
    if (!url) {
      return;
    }

    params = params || "";

    if ($.type(params) === "object") {
      params = $.param(params, true);
    }

    $.each(rez, function (key, value) {
      url = url.replace("$" + key, value || "");
    });

    if (params.length) {
      url += (url.indexOf("?") > 0 ? "&" : "?") + params;
    }

    return url;
  };

  $(document).on("objectNeedsType.fb", function (e, instance, item) {
    var url = item.src || "",
        type = false,
        media,
        thumb,
        rez,
        params,
        urlParams,
        paramObj,
        provider;
    media = $.extend(true, {}, defaults, item.opts.media); // Look for any matching media type

    $.each(media, function (providerName, providerOpts) {
      rez = url.match(providerOpts.matcher);

      if (!rez) {
        return;
      }

      type = providerOpts.type;
      provider = providerName;
      paramObj = {};

      if (providerOpts.paramPlace && rez[providerOpts.paramPlace]) {
        urlParams = rez[providerOpts.paramPlace];

        if (urlParams[0] == "?") {
          urlParams = urlParams.substring(1);
        }

        urlParams = urlParams.split("&");

        for (var m = 0; m < urlParams.length; ++m) {
          var p = urlParams[m].split("=", 2);

          if (p.length == 2) {
            paramObj[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
          }
        }
      }

      params = $.extend(true, {}, providerOpts.params, item.opts[providerName], paramObj);
      url = $.type(providerOpts.url) === "function" ? providerOpts.url.call(this, rez, params, item) : format(providerOpts.url, rez, params);
      thumb = $.type(providerOpts.thumb) === "function" ? providerOpts.thumb.call(this, rez, params, item) : format(providerOpts.thumb, rez);

      if (providerName === "youtube") {
        url = url.replace(/&t=((\d+)m)?(\d+)s/, function (match, p1, m, s) {
          return "&start=" + ((m ? parseInt(m, 10) * 60 : 0) + parseInt(s, 10));
        });
      } else if (providerName === "vimeo") {
        url = url.replace("&%23", "#");
      }

      return false;
    }); // If it is found, then change content type and update the url

    if (type) {
      if (!item.opts.thumb && !(item.opts.$thumb && item.opts.$thumb.length)) {
        item.opts.thumb = thumb;
      }

      if (type === "iframe") {
        item.opts = $.extend(true, item.opts, {
          iframe: {
            preload: false,
            attr: {
              scrolling: "no"
            }
          }
        });
      }

      $.extend(item, {
        type: type,
        src: url,
        origSrc: item.src,
        contentSource: provider,
        contentType: type === "image" ? "image" : provider == "gmap_place" || provider == "gmap_search" ? "map" : "video"
      });
    } else if (url) {
      item.type = item.opts.defaultType;
    }
  }); // Load YouTube/Video API on request to detect when video finished playing

  var VideoAPILoader = {
    youtube: {
      src: "https://www.youtube.com/iframe_api",
      class: "YT",
      loading: false,
      loaded: false
    },
    vimeo: {
      src: "https://player.vimeo.com/api/player.js",
      class: "Vimeo",
      loading: false,
      loaded: false
    },
    load: function load(vendor) {
      var _this = this,
          script;

      if (this[vendor].loaded) {
        setTimeout(function () {
          _this.done(vendor);
        });
        return;
      }

      if (this[vendor].loading) {
        return;
      }

      this[vendor].loading = true;
      script = document.createElement("script");
      script.type = "text/javascript";
      script.src = this[vendor].src;

      if (vendor === "youtube") {
        window.onYouTubeIframeAPIReady = function () {
          _this[vendor].loaded = true;

          _this.done(vendor);
        };
      } else {
        script.onload = function () {
          _this[vendor].loaded = true;

          _this.done(vendor);
        };
      }

      document.body.appendChild(script);
    },
    done: function done(vendor) {
      var instance, $el, player;

      if (vendor === "youtube") {
        delete window.onYouTubeIframeAPIReady;
      }

      instance = $.fancybox.getInstance();

      if (instance) {
        $el = instance.current.$content.find("iframe");

        if (vendor === "youtube" && YT !== undefined && YT) {
          player = new YT.Player($el.attr("id"), {
            events: {
              onStateChange: function onStateChange(e) {
                if (e.data == 0) {
                  instance.next();
                }
              }
            }
          });
        } else if (vendor === "vimeo" && Vimeo !== undefined && Vimeo) {
          player = new Vimeo.Player($el);
          player.on("ended", function () {
            instance.next();
          });
        }
      }
    }
  };
  $(document).on({
    "afterShow.fb": function afterShowFb(e, instance, current) {
      if (instance.group.length > 1 && (current.contentSource === "youtube" || current.contentSource === "vimeo")) {
        VideoAPILoader.load(current.contentSource);
      }
    }
  });
})(jQuery); // ==========================================================================
//
// Guestures
// Adds touch guestures, handles click and tap events
//
// ==========================================================================


(function (window, document, $) {
  "use strict";

  var requestAFrame = function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || // if all else fails, use setTimeout
    function (callback) {
      return window.setTimeout(callback, 1000 / 60);
    };
  }();

  var cancelAFrame = function () {
    return window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || function (id) {
      window.clearTimeout(id);
    };
  }();

  var getPointerXY = function getPointerXY(e) {
    var result = [];
    e = e.originalEvent || e || window.e;
    e = e.touches && e.touches.length ? e.touches : e.changedTouches && e.changedTouches.length ? e.changedTouches : [e];

    for (var key in e) {
      if (e[key].pageX) {
        result.push({
          x: e[key].pageX,
          y: e[key].pageY
        });
      } else if (e[key].clientX) {
        result.push({
          x: e[key].clientX,
          y: e[key].clientY
        });
      }
    }

    return result;
  };

  var distance = function distance(point2, point1, what) {
    if (!point1 || !point2) {
      return 0;
    }

    if (what === "x") {
      return point2.x - point1.x;
    } else if (what === "y") {
      return point2.y - point1.y;
    }

    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  };

  var isClickable = function isClickable($el) {
    if ($el.is('a,area,button,[role="button"],input,label,select,summary,textarea,video,audio,iframe') || $.isFunction($el.get(0).onclick) || $el.data("selectable")) {
      return true;
    } // Check for attributes like data-fancybox-next or data-fancybox-close


    for (var i = 0, atts = $el[0].attributes, n = atts.length; i < n; i++) {
      if (atts[i].nodeName.substr(0, 14) === "data-fancybox-") {
        return true;
      }
    }

    return false;
  };

  var hasScrollbars = function hasScrollbars(el) {
    var overflowY = window.getComputedStyle(el)["overflow-y"],
        overflowX = window.getComputedStyle(el)["overflow-x"],
        vertical = (overflowY === "scroll" || overflowY === "auto") && el.scrollHeight > el.clientHeight,
        horizontal = (overflowX === "scroll" || overflowX === "auto") && el.scrollWidth > el.clientWidth;
    return vertical || horizontal;
  };

  var isScrollable = function isScrollable($el) {
    var rez = false;

    while (true) {
      rez = hasScrollbars($el.get(0));

      if (rez) {
        break;
      }

      $el = $el.parent();

      if (!$el.length || $el.hasClass("fancybox-stage") || $el.is("body")) {
        break;
      }
    }

    return rez;
  };

  var Guestures = function Guestures(instance) {
    var self = this;
    self.instance = instance;
    self.$bg = instance.$refs.bg;
    self.$stage = instance.$refs.stage;
    self.$container = instance.$refs.container;
    self.destroy();
    self.$container.on("touchstart.fb.touch mousedown.fb.touch", $.proxy(self, "ontouchstart"));
  };

  Guestures.prototype.destroy = function () {
    var self = this;
    self.$container.off(".fb.touch");
    $(document).off(".fb.touch");

    if (self.requestId) {
      cancelAFrame(self.requestId);
      self.requestId = null;
    }

    if (self.tapped) {
      clearTimeout(self.tapped);
      self.tapped = null;
    }
  };

  Guestures.prototype.ontouchstart = function (e) {
    var self = this,
        $target = $(e.target),
        instance = self.instance,
        current = instance.current,
        $slide = current.$slide,
        $content = current.$content,
        isTouchDevice = e.type == "touchstart"; // Do not respond to both (touch and mouse) events

    if (isTouchDevice) {
      self.$container.off("mousedown.fb.touch");
    } // Ignore right click


    if (e.originalEvent && e.originalEvent.button == 2) {
      return;
    } // Ignore taping on links, buttons, input elements


    if (!$slide.length || !$target.length || isClickable($target) || isClickable($target.parent())) {
      return;
    } // Ignore clicks on the scrollbar


    if (!$target.is("img") && e.originalEvent.clientX > $target[0].clientWidth + $target.offset().left) {
      return;
    } // Ignore clicks while zooming or closing


    if (!current || instance.isAnimating || current.$slide.hasClass("fancybox-animated")) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    self.realPoints = self.startPoints = getPointerXY(e);

    if (!self.startPoints.length) {
      return;
    } // Allow other scripts to catch touch event if "touch" is set to false


    if (current.touch) {
      e.stopPropagation();
    }

    self.startEvent = e;
    self.canTap = true;
    self.$target = $target;
    self.$content = $content;
    self.opts = current.opts.touch;
    self.isPanning = false;
    self.isSwiping = false;
    self.isZooming = false;
    self.isScrolling = false;
    self.canPan = instance.canPan();
    self.startTime = new Date().getTime();
    self.distanceX = self.distanceY = self.distance = 0;
    self.canvasWidth = Math.round($slide[0].clientWidth);
    self.canvasHeight = Math.round($slide[0].clientHeight);
    self.contentLastPos = null;
    self.contentStartPos = $.fancybox.getTranslate(self.$content) || {
      top: 0,
      left: 0
    };
    self.sliderStartPos = $.fancybox.getTranslate($slide); // Since position will be absolute, but we need to make it relative to the stage

    self.stagePos = $.fancybox.getTranslate(instance.$refs.stage);
    self.sliderStartPos.top -= self.stagePos.top;
    self.sliderStartPos.left -= self.stagePos.left;
    self.contentStartPos.top -= self.stagePos.top;
    self.contentStartPos.left -= self.stagePos.left;
    $(document).off(".fb.touch").on(isTouchDevice ? "touchend.fb.touch touchcancel.fb.touch" : "mouseup.fb.touch mouseleave.fb.touch", $.proxy(self, "ontouchend")).on(isTouchDevice ? "touchmove.fb.touch" : "mousemove.fb.touch", $.proxy(self, "ontouchmove"));

    if ($.fancybox.isMobile) {
      document.addEventListener("scroll", self.onscroll, true);
    } // Skip if clicked outside the sliding area


    if (!(self.opts || self.canPan) || !($target.is(self.$stage) || self.$stage.find($target).length)) {
      if ($target.is(".fancybox-image")) {
        e.preventDefault();
      }

      if (!($.fancybox.isMobile && $target.parents(".fancybox-caption").length)) {
        return;
      }
    }

    self.isScrollable = isScrollable($target) || isScrollable($target.parent()); // Check if element is scrollable and try to prevent default behavior (scrolling)

    if (!($.fancybox.isMobile && self.isScrollable)) {
      e.preventDefault();
    } // One finger or mouse click - swipe or pan an image


    if (self.startPoints.length === 1 || current.hasError) {
      if (self.canPan) {
        $.fancybox.stop(self.$content);
        self.isPanning = true;
      } else {
        self.isSwiping = true;
      }

      self.$container.addClass("fancybox-is-grabbing");
    } // Two fingers - zoom image


    if (self.startPoints.length === 2 && current.type === "image" && (current.isLoaded || current.$ghost)) {
      self.canTap = false;
      self.isSwiping = false;
      self.isPanning = false;
      self.isZooming = true;
      $.fancybox.stop(self.$content);
      self.centerPointStartX = (self.startPoints[0].x + self.startPoints[1].x) * 0.5 - $(window).scrollLeft();
      self.centerPointStartY = (self.startPoints[0].y + self.startPoints[1].y) * 0.5 - $(window).scrollTop();
      self.percentageOfImageAtPinchPointX = (self.centerPointStartX - self.contentStartPos.left) / self.contentStartPos.width;
      self.percentageOfImageAtPinchPointY = (self.centerPointStartY - self.contentStartPos.top) / self.contentStartPos.height;
      self.startDistanceBetweenFingers = distance(self.startPoints[0], self.startPoints[1]);
    }
  };

  Guestures.prototype.onscroll = function (e) {
    var self = this;
    self.isScrolling = true;
    document.removeEventListener("scroll", self.onscroll, true);
  };

  Guestures.prototype.ontouchmove = function (e) {
    var self = this; // Make sure user has not released over iframe or disabled element

    if (e.originalEvent.buttons !== undefined && e.originalEvent.buttons === 0) {
      self.ontouchend(e);
      return;
    }

    if (self.isScrolling) {
      self.canTap = false;
      return;
    }

    self.newPoints = getPointerXY(e);

    if (!(self.opts || self.canPan) || !self.newPoints.length || !self.newPoints.length) {
      return;
    }

    if (!(self.isSwiping && self.isSwiping === true)) {
      e.preventDefault();
    }

    self.distanceX = distance(self.newPoints[0], self.startPoints[0], "x");
    self.distanceY = distance(self.newPoints[0], self.startPoints[0], "y");
    self.distance = distance(self.newPoints[0], self.startPoints[0]); // Skip false ontouchmove events (Chrome)

    if (self.distance > 0) {
      if (self.isSwiping) {
        self.onSwipe(e);
      } else if (self.isPanning) {
        self.onPan();
      } else if (self.isZooming) {
        self.onZoom();
      }
    }
  };

  Guestures.prototype.onSwipe = function (e) {
    var self = this,
        instance = self.instance,
        swiping = self.isSwiping,
        left = self.sliderStartPos.left || 0,
        angle; // If direction is not yet determined

    if (swiping === true) {
      // We need at least 10px distance to correctly calculate an angle
      if (Math.abs(self.distance) > 10) {
        self.canTap = false;

        if (instance.group.length < 2 && self.opts.vertical) {
          self.isSwiping = "y";
        } else if (instance.isDragging || self.opts.vertical === false || self.opts.vertical === "auto" && $(window).width() > 800) {
          self.isSwiping = "x";
        } else {
          angle = Math.abs(Math.atan2(self.distanceY, self.distanceX) * 180 / Math.PI);
          self.isSwiping = angle > 45 && angle < 135 ? "y" : "x";
        }

        if (self.isSwiping === "y" && $.fancybox.isMobile && self.isScrollable) {
          self.isScrolling = true;
          return;
        }

        instance.isDragging = self.isSwiping; // Reset points to avoid jumping, because we dropped first swipes to calculate the angle

        self.startPoints = self.newPoints;
        $.each(instance.slides, function (index, slide) {
          var slidePos, stagePos;
          $.fancybox.stop(slide.$slide);
          slidePos = $.fancybox.getTranslate(slide.$slide);
          stagePos = $.fancybox.getTranslate(instance.$refs.stage);
          slide.$slide.css({
            transform: "",
            opacity: "",
            "transition-duration": ""
          }).removeClass("fancybox-animated").removeClass(function (index, className) {
            return (className.match(/(^|\s)fancybox-fx-\S+/g) || []).join(" ");
          });

          if (slide.pos === instance.current.pos) {
            self.sliderStartPos.top = slidePos.top - stagePos.top;
            self.sliderStartPos.left = slidePos.left - stagePos.left;
          }

          $.fancybox.setTranslate(slide.$slide, {
            top: slidePos.top - stagePos.top,
            left: slidePos.left - stagePos.left
          });
        }); // Stop slideshow

        if (instance.SlideShow && instance.SlideShow.isActive) {
          instance.SlideShow.stop();
        }
      }

      return;
    } // Sticky edges


    if (swiping == "x") {
      if (self.distanceX > 0 && (self.instance.group.length < 2 || self.instance.current.index === 0 && !self.instance.current.opts.loop)) {
        left = left + Math.pow(self.distanceX, 0.8);
      } else if (self.distanceX < 0 && (self.instance.group.length < 2 || self.instance.current.index === self.instance.group.length - 1 && !self.instance.current.opts.loop)) {
        left = left - Math.pow(-self.distanceX, 0.8);
      } else {
        left = left + self.distanceX;
      }
    }

    self.sliderLastPos = {
      top: swiping == "x" ? 0 : self.sliderStartPos.top + self.distanceY,
      left: left
    };

    if (self.requestId) {
      cancelAFrame(self.requestId);
      self.requestId = null;
    }

    self.requestId = requestAFrame(function () {
      if (self.sliderLastPos) {
        $.each(self.instance.slides, function (index, slide) {
          var pos = slide.pos - self.instance.currPos;
          $.fancybox.setTranslate(slide.$slide, {
            top: self.sliderLastPos.top,
            left: self.sliderLastPos.left + pos * self.canvasWidth + pos * slide.opts.gutter
          });
        });
        self.$container.addClass("fancybox-is-sliding");
      }
    });
  };

  Guestures.prototype.onPan = function () {
    var self = this; // Prevent accidental movement (sometimes, when tapping casually, finger can move a bit)

    if (distance(self.newPoints[0], self.realPoints[0]) < ($.fancybox.isMobile ? 10 : 5)) {
      self.startPoints = self.newPoints;
      return;
    }

    self.canTap = false;
    self.contentLastPos = self.limitMovement();

    if (self.requestId) {
      cancelAFrame(self.requestId);
    }

    self.requestId = requestAFrame(function () {
      $.fancybox.setTranslate(self.$content, self.contentLastPos);
    });
  }; // Make panning sticky to the edges


  Guestures.prototype.limitMovement = function () {
    var self = this;
    var canvasWidth = self.canvasWidth;
    var canvasHeight = self.canvasHeight;
    var distanceX = self.distanceX;
    var distanceY = self.distanceY;
    var contentStartPos = self.contentStartPos;
    var currentOffsetX = contentStartPos.left;
    var currentOffsetY = contentStartPos.top;
    var currentWidth = contentStartPos.width;
    var currentHeight = contentStartPos.height;
    var minTranslateX, minTranslateY, maxTranslateX, maxTranslateY, newOffsetX, newOffsetY;

    if (currentWidth > canvasWidth) {
      newOffsetX = currentOffsetX + distanceX;
    } else {
      newOffsetX = currentOffsetX;
    }

    newOffsetY = currentOffsetY + distanceY; // Slow down proportionally to traveled distance

    minTranslateX = Math.max(0, canvasWidth * 0.5 - currentWidth * 0.5);
    minTranslateY = Math.max(0, canvasHeight * 0.5 - currentHeight * 0.5);
    maxTranslateX = Math.min(canvasWidth - currentWidth, canvasWidth * 0.5 - currentWidth * 0.5);
    maxTranslateY = Math.min(canvasHeight - currentHeight, canvasHeight * 0.5 - currentHeight * 0.5); //   ->

    if (distanceX > 0 && newOffsetX > minTranslateX) {
      newOffsetX = minTranslateX - 1 + Math.pow(-minTranslateX + currentOffsetX + distanceX, 0.8) || 0;
    } //    <-


    if (distanceX < 0 && newOffsetX < maxTranslateX) {
      newOffsetX = maxTranslateX + 1 - Math.pow(maxTranslateX - currentOffsetX - distanceX, 0.8) || 0;
    } //   \/


    if (distanceY > 0 && newOffsetY > minTranslateY) {
      newOffsetY = minTranslateY - 1 + Math.pow(-minTranslateY + currentOffsetY + distanceY, 0.8) || 0;
    } //   /\


    if (distanceY < 0 && newOffsetY < maxTranslateY) {
      newOffsetY = maxTranslateY + 1 - Math.pow(maxTranslateY - currentOffsetY - distanceY, 0.8) || 0;
    }

    return {
      top: newOffsetY,
      left: newOffsetX
    };
  };

  Guestures.prototype.limitPosition = function (newOffsetX, newOffsetY, newWidth, newHeight) {
    var self = this;
    var canvasWidth = self.canvasWidth;
    var canvasHeight = self.canvasHeight;

    if (newWidth > canvasWidth) {
      newOffsetX = newOffsetX > 0 ? 0 : newOffsetX;
      newOffsetX = newOffsetX < canvasWidth - newWidth ? canvasWidth - newWidth : newOffsetX;
    } else {
      // Center horizontally
      newOffsetX = Math.max(0, canvasWidth / 2 - newWidth / 2);
    }

    if (newHeight > canvasHeight) {
      newOffsetY = newOffsetY > 0 ? 0 : newOffsetY;
      newOffsetY = newOffsetY < canvasHeight - newHeight ? canvasHeight - newHeight : newOffsetY;
    } else {
      // Center vertically
      newOffsetY = Math.max(0, canvasHeight / 2 - newHeight / 2);
    }

    return {
      top: newOffsetY,
      left: newOffsetX
    };
  };

  Guestures.prototype.onZoom = function () {
    var self = this; // Calculate current distance between points to get pinch ratio and new width and height

    var contentStartPos = self.contentStartPos;
    var currentWidth = contentStartPos.width;
    var currentHeight = contentStartPos.height;
    var currentOffsetX = contentStartPos.left;
    var currentOffsetY = contentStartPos.top;
    var endDistanceBetweenFingers = distance(self.newPoints[0], self.newPoints[1]);
    var pinchRatio = endDistanceBetweenFingers / self.startDistanceBetweenFingers;
    var newWidth = Math.floor(currentWidth * pinchRatio);
    var newHeight = Math.floor(currentHeight * pinchRatio); // This is the translation due to pinch-zooming

    var translateFromZoomingX = (currentWidth - newWidth) * self.percentageOfImageAtPinchPointX;
    var translateFromZoomingY = (currentHeight - newHeight) * self.percentageOfImageAtPinchPointY; // Point between the two touches

    var centerPointEndX = (self.newPoints[0].x + self.newPoints[1].x) / 2 - $(window).scrollLeft();
    var centerPointEndY = (self.newPoints[0].y + self.newPoints[1].y) / 2 - $(window).scrollTop(); // And this is the translation due to translation of the centerpoint
    // between the two fingers

    var translateFromTranslatingX = centerPointEndX - self.centerPointStartX;
    var translateFromTranslatingY = centerPointEndY - self.centerPointStartY; // The new offset is the old/current one plus the total translation

    var newOffsetX = currentOffsetX + (translateFromZoomingX + translateFromTranslatingX);
    var newOffsetY = currentOffsetY + (translateFromZoomingY + translateFromTranslatingY);
    var newPos = {
      top: newOffsetY,
      left: newOffsetX,
      scaleX: pinchRatio,
      scaleY: pinchRatio
    };
    self.canTap = false;
    self.newWidth = newWidth;
    self.newHeight = newHeight;
    self.contentLastPos = newPos;

    if (self.requestId) {
      cancelAFrame(self.requestId);
    }

    self.requestId = requestAFrame(function () {
      $.fancybox.setTranslate(self.$content, self.contentLastPos);
    });
  };

  Guestures.prototype.ontouchend = function (e) {
    var self = this;
    var swiping = self.isSwiping;
    var panning = self.isPanning;
    var zooming = self.isZooming;
    var scrolling = self.isScrolling;
    self.endPoints = getPointerXY(e);
    self.dMs = Math.max(new Date().getTime() - self.startTime, 1);
    self.$container.removeClass("fancybox-is-grabbing");
    $(document).off(".fb.touch");
    document.removeEventListener("scroll", self.onscroll, true);

    if (self.requestId) {
      cancelAFrame(self.requestId);
      self.requestId = null;
    }

    self.isSwiping = false;
    self.isPanning = false;
    self.isZooming = false;
    self.isScrolling = false;
    self.instance.isDragging = false;

    if (self.canTap) {
      return self.onTap(e);
    }

    self.speed = 100; // Speed in px/ms

    self.velocityX = self.distanceX / self.dMs * 0.5;
    self.velocityY = self.distanceY / self.dMs * 0.5;

    if (panning) {
      self.endPanning();
    } else if (zooming) {
      self.endZooming();
    } else {
      self.endSwiping(swiping, scrolling);
    }

    return;
  };

  Guestures.prototype.endSwiping = function (swiping, scrolling) {
    var self = this,
        ret = false,
        len = self.instance.group.length,
        distanceX = Math.abs(self.distanceX),
        canAdvance = swiping == "x" && len > 1 && (self.dMs > 130 && distanceX > 10 || distanceX > 50),
        speedX = 300;
    self.sliderLastPos = null; // Close if swiped vertically / navigate if horizontally

    if (swiping == "y" && !scrolling && Math.abs(self.distanceY) > 50) {
      // Continue vertical movement
      $.fancybox.animate(self.instance.current.$slide, {
        top: self.sliderStartPos.top + self.distanceY + self.velocityY * 150,
        opacity: 0
      }, 200);
      ret = self.instance.close(true, 250);
    } else if (canAdvance && self.distanceX > 0) {
      ret = self.instance.previous(speedX);
    } else if (canAdvance && self.distanceX < 0) {
      ret = self.instance.next(speedX);
    }

    if (ret === false && (swiping == "x" || swiping == "y")) {
      self.instance.centerSlide(200);
    }

    self.$container.removeClass("fancybox-is-sliding");
  }; // Limit panning from edges
  // ========================


  Guestures.prototype.endPanning = function () {
    var self = this,
        newOffsetX,
        newOffsetY,
        newPos;

    if (!self.contentLastPos) {
      return;
    }

    if (self.opts.momentum === false || self.dMs > 350) {
      newOffsetX = self.contentLastPos.left;
      newOffsetY = self.contentLastPos.top;
    } else {
      // Continue movement
      newOffsetX = self.contentLastPos.left + self.velocityX * 500;
      newOffsetY = self.contentLastPos.top + self.velocityY * 500;
    }

    newPos = self.limitPosition(newOffsetX, newOffsetY, self.contentStartPos.width, self.contentStartPos.height);
    newPos.width = self.contentStartPos.width;
    newPos.height = self.contentStartPos.height;
    $.fancybox.animate(self.$content, newPos, 366);
  };

  Guestures.prototype.endZooming = function () {
    var self = this;
    var current = self.instance.current;
    var newOffsetX, newOffsetY, newPos, reset;
    var newWidth = self.newWidth;
    var newHeight = self.newHeight;

    if (!self.contentLastPos) {
      return;
    }

    newOffsetX = self.contentLastPos.left;
    newOffsetY = self.contentLastPos.top;
    reset = {
      top: newOffsetY,
      left: newOffsetX,
      width: newWidth,
      height: newHeight,
      scaleX: 1,
      scaleY: 1
    }; // Reset scalex/scaleY values; this helps for perfomance and does not break animation

    $.fancybox.setTranslate(self.$content, reset);

    if (newWidth < self.canvasWidth && newHeight < self.canvasHeight) {
      self.instance.scaleToFit(150);
    } else if (newWidth > current.width || newHeight > current.height) {
      self.instance.scaleToActual(self.centerPointStartX, self.centerPointStartY, 150);
    } else {
      newPos = self.limitPosition(newOffsetX, newOffsetY, newWidth, newHeight);
      $.fancybox.animate(self.$content, newPos, 150);
    }
  };

  Guestures.prototype.onTap = function (e) {
    var self = this;
    var $target = $(e.target);
    var instance = self.instance;
    var current = instance.current;
    var endPoints = e && getPointerXY(e) || self.startPoints;
    var tapX = endPoints[0] ? endPoints[0].x - $(window).scrollLeft() - self.stagePos.left : 0;
    var tapY = endPoints[0] ? endPoints[0].y - $(window).scrollTop() - self.stagePos.top : 0;
    var where;

    var process = function process(prefix) {
      var action = current.opts[prefix];

      if ($.isFunction(action)) {
        action = action.apply(instance, [current, e]);
      }

      if (!action) {
        return;
      }

      switch (action) {
        case "close":
          instance.close(self.startEvent);
          break;

        case "toggleControls":
          instance.toggleControls();
          break;

        case "next":
          instance.next();
          break;

        case "nextOrClose":
          if (instance.group.length > 1) {
            instance.next();
          } else {
            instance.close(self.startEvent);
          }

          break;

        case "zoom":
          if (current.type == "image" && (current.isLoaded || current.$ghost)) {
            if (instance.canPan()) {
              instance.scaleToFit();
            } else if (instance.isScaledDown()) {
              instance.scaleToActual(tapX, tapY);
            } else if (instance.group.length < 2) {
              instance.close(self.startEvent);
            }
          }

          break;
      }
    }; // Ignore right click


    if (e.originalEvent && e.originalEvent.button == 2) {
      return;
    } // Skip if clicked on the scrollbar


    if (!$target.is("img") && tapX > $target[0].clientWidth + $target.offset().left) {
      return;
    } // Check where is clicked


    if ($target.is(".fancybox-bg,.fancybox-inner,.fancybox-outer,.fancybox-container")) {
      where = "Outside";
    } else if ($target.is(".fancybox-slide")) {
      where = "Slide";
    } else if (instance.current.$content && instance.current.$content.find($target).addBack().filter($target).length) {
      where = "Content";
    } else {
      return;
    } // Check if this is a double tap


    if (self.tapped) {
      // Stop previously created single tap
      clearTimeout(self.tapped);
      self.tapped = null; // Skip if distance between taps is too big

      if (Math.abs(tapX - self.tapX) > 50 || Math.abs(tapY - self.tapY) > 50) {
        return this;
      } // OK, now we assume that this is a double-tap


      process("dblclick" + where);
    } else {
      // Single tap will be processed if user has not clicked second time within 300ms
      // or there is no need to wait for double-tap
      self.tapX = tapX;
      self.tapY = tapY;

      if (current.opts["dblclick" + where] && current.opts["dblclick" + where] !== current.opts["click" + where]) {
        self.tapped = setTimeout(function () {
          self.tapped = null;

          if (!instance.isAnimating) {
            process("click" + where);
          }
        }, 500);
      } else {
        process("click" + where);
      }
    }

    return this;
  };

  $(document).on("onActivate.fb", function (e, instance) {
    if (instance && !instance.Guestures) {
      instance.Guestures = new Guestures(instance);
    }
  }).on("beforeClose.fb", function (e, instance) {
    if (instance && instance.Guestures) {
      instance.Guestures.destroy();
    }
  });
})(window, document, jQuery); // ==========================================================================
//
// SlideShow
// Enables slideshow functionality
//
// Example of usage:
// $.fancybox.getInstance().SlideShow.start()
//
// ==========================================================================


(function (document, $) {
  "use strict";

  $.extend(true, $.fancybox.defaults, {
    btnTpl: {
      slideShow: '<button data-fancybox-play class="fancybox-button fancybox-button--play" title="{{PLAY_START}}">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6.5 5.4v13.2l11-6.6z"/></svg>' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8.33 5.75h2.2v12.5h-2.2V5.75zm5.15 0h2.2v12.5h-2.2V5.75z"/></svg>' + "</button>"
    },
    slideShow: {
      autoStart: false,
      speed: 3000,
      progress: true
    }
  });

  var SlideShow = function SlideShow(instance) {
    this.instance = instance;
    this.init();
  };

  $.extend(SlideShow.prototype, {
    timer: null,
    isActive: false,
    $button: null,
    init: function init() {
      var self = this,
          instance = self.instance,
          opts = instance.group[instance.currIndex].opts.slideShow;
      self.$button = instance.$refs.toolbar.find("[data-fancybox-play]").on("click", function () {
        self.toggle();
      });

      if (instance.group.length < 2 || !opts) {
        self.$button.hide();
      } else if (opts.progress) {
        self.$progress = $('<div class="fancybox-progress"></div>').appendTo(instance.$refs.inner);
      }
    },
    set: function set(force) {
      var self = this,
          instance = self.instance,
          current = instance.current; // Check if reached last element

      if (current && (force === true || current.opts.loop || instance.currIndex < instance.group.length - 1)) {
        if (self.isActive && current.contentType !== "video") {
          if (self.$progress) {
            $.fancybox.animate(self.$progress.show(), {
              scaleX: 1
            }, current.opts.slideShow.speed);
          }

          self.timer = setTimeout(function () {
            if (!instance.current.opts.loop && instance.current.index == instance.group.length - 1) {
              instance.jumpTo(0);
            } else {
              instance.next();
            }
          }, current.opts.slideShow.speed);
        }
      } else {
        self.stop();
        instance.idleSecondsCounter = 0;
        instance.showControls();
      }
    },
    clear: function clear() {
      var self = this;
      clearTimeout(self.timer);
      self.timer = null;

      if (self.$progress) {
        self.$progress.removeAttr("style").hide();
      }
    },
    start: function start() {
      var self = this,
          current = self.instance.current;

      if (current) {
        self.$button.attr("title", (current.opts.i18n[current.opts.lang] || current.opts.i18n.en).PLAY_STOP).removeClass("fancybox-button--play").addClass("fancybox-button--pause");
        self.isActive = true;

        if (current.isComplete) {
          self.set(true);
        }

        self.instance.trigger("onSlideShowChange", true);
      }
    },
    stop: function stop() {
      var self = this,
          current = self.instance.current;
      self.clear();
      self.$button.attr("title", (current.opts.i18n[current.opts.lang] || current.opts.i18n.en).PLAY_START).removeClass("fancybox-button--pause").addClass("fancybox-button--play");
      self.isActive = false;
      self.instance.trigger("onSlideShowChange", false);

      if (self.$progress) {
        self.$progress.removeAttr("style").hide();
      }
    },
    toggle: function toggle() {
      var self = this;

      if (self.isActive) {
        self.stop();
      } else {
        self.start();
      }
    }
  });
  $(document).on({
    "onInit.fb": function onInitFb(e, instance) {
      if (instance && !instance.SlideShow) {
        instance.SlideShow = new SlideShow(instance);
      }
    },
    "beforeShow.fb": function beforeShowFb(e, instance, current, firstRun) {
      var SlideShow = instance && instance.SlideShow;

      if (firstRun) {
        if (SlideShow && current.opts.slideShow.autoStart) {
          SlideShow.start();
        }
      } else if (SlideShow && SlideShow.isActive) {
        SlideShow.clear();
      }
    },
    "afterShow.fb": function afterShowFb(e, instance, current) {
      var SlideShow = instance && instance.SlideShow;

      if (SlideShow && SlideShow.isActive) {
        SlideShow.set();
      }
    },
    "afterKeydown.fb": function afterKeydownFb(e, instance, current, keypress, keycode) {
      var SlideShow = instance && instance.SlideShow; // "P" or Spacebar

      if (SlideShow && current.opts.slideShow && (keycode === 80 || keycode === 32) && !$(document.activeElement).is("button,a,input")) {
        keypress.preventDefault();
        SlideShow.toggle();
      }
    },
    "beforeClose.fb onDeactivate.fb": function beforeCloseFbOnDeactivateFb(e, instance) {
      var SlideShow = instance && instance.SlideShow;

      if (SlideShow) {
        SlideShow.stop();
      }
    }
  }); // Page Visibility API to pause slideshow when window is not active

  $(document).on("visibilitychange", function () {
    var instance = $.fancybox.getInstance(),
        SlideShow = instance && instance.SlideShow;

    if (SlideShow && SlideShow.isActive) {
      if (document.hidden) {
        SlideShow.clear();
      } else {
        SlideShow.set();
      }
    }
  });
})(document, jQuery); // ==========================================================================
//
// FullScreen
// Adds fullscreen functionality
//
// ==========================================================================


(function (document, $) {
  "use strict"; // Collection of methods supported by user browser

  var fn = function () {
    var fnMap = [["requestFullscreen", "exitFullscreen", "fullscreenElement", "fullscreenEnabled", "fullscreenchange", "fullscreenerror"], // new WebKit
    ["webkitRequestFullscreen", "webkitExitFullscreen", "webkitFullscreenElement", "webkitFullscreenEnabled", "webkitfullscreenchange", "webkitfullscreenerror"], // old WebKit (Safari 5.1)
    ["webkitRequestFullScreen", "webkitCancelFullScreen", "webkitCurrentFullScreenElement", "webkitCancelFullScreen", "webkitfullscreenchange", "webkitfullscreenerror"], ["mozRequestFullScreen", "mozCancelFullScreen", "mozFullScreenElement", "mozFullScreenEnabled", "mozfullscreenchange", "mozfullscreenerror"], ["msRequestFullscreen", "msExitFullscreen", "msFullscreenElement", "msFullscreenEnabled", "MSFullscreenChange", "MSFullscreenError"]];
    var ret = {};

    for (var i = 0; i < fnMap.length; i++) {
      var val = fnMap[i];

      if (val && val[1] in document) {
        for (var j = 0; j < val.length; j++) {
          ret[fnMap[0][j]] = val[j];
        }

        return ret;
      }
    }

    return false;
  }();

  if (fn) {
    var FullScreen = {
      request: function request(elem) {
        elem = elem || document.documentElement;
        elem[fn.requestFullscreen](elem.ALLOW_KEYBOARD_INPUT);
      },
      exit: function exit() {
        document[fn.exitFullscreen]();
      },
      toggle: function toggle(elem) {
        elem = elem || document.documentElement;

        if (this.isFullscreen()) {
          this.exit();
        } else {
          this.request(elem);
        }
      },
      isFullscreen: function isFullscreen() {
        return Boolean(document[fn.fullscreenElement]);
      },
      enabled: function enabled() {
        return Boolean(document[fn.fullscreenEnabled]);
      }
    };
    $.extend(true, $.fancybox.defaults, {
      btnTpl: {
        fullScreen: '<button data-fancybox-fullscreen class="fancybox-button fancybox-button--fsenter" title="{{FULL_SCREEN}}">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z"/></svg>' + "</button>"
      },
      fullScreen: {
        autoStart: false
      }
    });
    $(document).on(fn.fullscreenchange, function () {
      var isFullscreen = FullScreen.isFullscreen(),
          instance = $.fancybox.getInstance();

      if (instance) {
        // If image is zooming, then force to stop and reposition properly
        if (instance.current && instance.current.type === "image" && instance.isAnimating) {
          instance.isAnimating = false;
          instance.update(true, true, 0);

          if (!instance.isComplete) {
            instance.complete();
          }
        }

        instance.trigger("onFullscreenChange", isFullscreen);
        instance.$refs.container.toggleClass("fancybox-is-fullscreen", isFullscreen);
        instance.$refs.toolbar.find("[data-fancybox-fullscreen]").toggleClass("fancybox-button--fsenter", !isFullscreen).toggleClass("fancybox-button--fsexit", isFullscreen);
      }
    });
  }

  $(document).on({
    "onInit.fb": function onInitFb(e, instance) {
      var $container;

      if (!fn) {
        instance.$refs.toolbar.find("[data-fancybox-fullscreen]").remove();
        return;
      }

      if (instance && instance.group[instance.currIndex].opts.fullScreen) {
        $container = instance.$refs.container;
        $container.on("click.fb-fullscreen", "[data-fancybox-fullscreen]", function (e) {
          e.stopPropagation();
          e.preventDefault();
          FullScreen.toggle();
        });

        if (instance.opts.fullScreen && instance.opts.fullScreen.autoStart === true) {
          FullScreen.request();
        } // Expose API


        instance.FullScreen = FullScreen;
      } else if (instance) {
        instance.$refs.toolbar.find("[data-fancybox-fullscreen]").hide();
      }
    },
    "afterKeydown.fb": function afterKeydownFb(e, instance, current, keypress, keycode) {
      // "F"
      if (instance && instance.FullScreen && keycode === 70) {
        keypress.preventDefault();
        instance.FullScreen.toggle();
      }
    },
    "beforeClose.fb": function beforeCloseFb(e, instance) {
      if (instance && instance.FullScreen && instance.$refs.container.hasClass("fancybox-is-fullscreen")) {
        FullScreen.exit();
      }
    }
  });
})(document, jQuery); // ==========================================================================
//
// Thumbs
// Displays thumbnails in a grid
//
// ==========================================================================


(function (document, $) {
  "use strict";

  var CLASS = "fancybox-thumbs",
      CLASS_ACTIVE = CLASS + "-active"; // Make sure there are default values

  $.fancybox.defaults = $.extend(true, {
    btnTpl: {
      thumbs: '<button data-fancybox-thumbs class="fancybox-button fancybox-button--thumbs" title="{{THUMBS}}">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14.59 14.59h3.76v3.76h-3.76v-3.76zm-4.47 0h3.76v3.76h-3.76v-3.76zm-4.47 0h3.76v3.76H5.65v-3.76zm8.94-4.47h3.76v3.76h-3.76v-3.76zm-4.47 0h3.76v3.76h-3.76v-3.76zm-4.47 0h3.76v3.76H5.65v-3.76zm8.94-4.47h3.76v3.76h-3.76V5.65zm-4.47 0h3.76v3.76h-3.76V5.65zm-4.47 0h3.76v3.76H5.65V5.65z"/></svg>' + "</button>"
    },
    thumbs: {
      autoStart: false,
      // Display thumbnails on opening
      hideOnClose: true,
      // Hide thumbnail grid when closing animation starts
      parentEl: ".fancybox-container",
      // Container is injected into this element
      axis: "y" // Vertical (y) or horizontal (x) scrolling

    }
  }, $.fancybox.defaults);

  var FancyThumbs = function FancyThumbs(instance) {
    this.init(instance);
  };

  $.extend(FancyThumbs.prototype, {
    $button: null,
    $grid: null,
    $list: null,
    isVisible: false,
    isActive: false,
    init: function init(instance) {
      var self = this,
          group = instance.group,
          enabled = 0;
      self.instance = instance;
      self.opts = group[instance.currIndex].opts.thumbs;
      instance.Thumbs = self;
      self.$button = instance.$refs.toolbar.find("[data-fancybox-thumbs]"); // Enable thumbs if at least two group items have thumbnails

      for (var i = 0, len = group.length; i < len; i++) {
        if (group[i].thumb) {
          enabled++;
        }

        if (enabled > 1) {
          break;
        }
      }

      if (enabled > 1 && !!self.opts) {
        self.$button.removeAttr("style").on("click", function () {
          self.toggle();
        });
        self.isActive = true;
      } else {
        self.$button.hide();
      }
    },
    create: function create() {
      var self = this,
          instance = self.instance,
          parentEl = self.opts.parentEl,
          list = [],
          src;

      if (!self.$grid) {
        // Create main element
        self.$grid = $('<div class="' + CLASS + " " + CLASS + "-" + self.opts.axis + '"></div>').appendTo(instance.$refs.container.find(parentEl).addBack().filter(parentEl)); // Add "click" event that performs gallery navigation

        self.$grid.on("click", "a", function () {
          instance.jumpTo($(this).attr("data-index"));
        });
      } // Build the list


      if (!self.$list) {
        self.$list = $('<div class="' + CLASS + '__list">').appendTo(self.$grid);
      }

      $.each(instance.group, function (i, item) {
        src = item.thumb;

        if (!src && item.type === "image") {
          src = item.src;
        }

        list.push('<a href="javascript:;" tabindex="0" data-index="' + i + '"' + (src && src.length ? ' style="background-image:url(' + src + ')"' : 'class="fancybox-thumbs-missing"') + "></a>");
      });
      self.$list[0].innerHTML = list.join("");

      if (self.opts.axis === "x") {
        // Set fixed width for list element to enable horizontal scrolling
        self.$list.width(parseInt(self.$grid.css("padding-right"), 10) + instance.group.length * self.$list.children().eq(0).outerWidth(true));
      }
    },
    focus: function focus(duration) {
      var self = this,
          $list = self.$list,
          $grid = self.$grid,
          thumb,
          thumbPos;

      if (!self.instance.current) {
        return;
      }

      thumb = $list.children().removeClass(CLASS_ACTIVE).filter('[data-index="' + self.instance.current.index + '"]').addClass(CLASS_ACTIVE);
      thumbPos = thumb.position(); // Check if need to scroll to make current thumb visible

      if (self.opts.axis === "y" && (thumbPos.top < 0 || thumbPos.top > $list.height() - thumb.outerHeight())) {
        $list.stop().animate({
          scrollTop: $list.scrollTop() + thumbPos.top
        }, duration);
      } else if (self.opts.axis === "x" && (thumbPos.left < $grid.scrollLeft() || thumbPos.left > $grid.scrollLeft() + ($grid.width() - thumb.outerWidth()))) {
        $list.parent().stop().animate({
          scrollLeft: thumbPos.left
        }, duration);
      }
    },
    update: function update() {
      var that = this;
      that.instance.$refs.container.toggleClass("fancybox-show-thumbs", this.isVisible);

      if (that.isVisible) {
        if (!that.$grid) {
          that.create();
        }

        that.instance.trigger("onThumbsShow");
        that.focus(0);
      } else if (that.$grid) {
        that.instance.trigger("onThumbsHide");
      } // Update content position


      that.instance.update();
    },
    hide: function hide() {
      this.isVisible = false;
      this.update();
    },
    show: function show() {
      this.isVisible = true;
      this.update();
    },
    toggle: function toggle() {
      this.isVisible = !this.isVisible;
      this.update();
    }
  });
  $(document).on({
    "onInit.fb": function onInitFb(e, instance) {
      var Thumbs;

      if (instance && !instance.Thumbs) {
        Thumbs = new FancyThumbs(instance);

        if (Thumbs.isActive && Thumbs.opts.autoStart === true) {
          Thumbs.show();
        }
      }
    },
    "beforeShow.fb": function beforeShowFb(e, instance, item, firstRun) {
      var Thumbs = instance && instance.Thumbs;

      if (Thumbs && Thumbs.isVisible) {
        Thumbs.focus(firstRun ? 0 : 250);
      }
    },
    "afterKeydown.fb": function afterKeydownFb(e, instance, current, keypress, keycode) {
      var Thumbs = instance && instance.Thumbs; // "G"

      if (Thumbs && Thumbs.isActive && keycode === 71) {
        keypress.preventDefault();
        Thumbs.toggle();
      }
    },
    "beforeClose.fb": function beforeCloseFb(e, instance) {
      var Thumbs = instance && instance.Thumbs;

      if (Thumbs && Thumbs.isVisible && Thumbs.opts.hideOnClose !== false) {
        Thumbs.$grid.hide();
      }
    }
  });
})(document, jQuery); //// ==========================================================================
//
// Share
// Displays simple form for sharing current url
//
// ==========================================================================


(function (document, $) {
  "use strict";

  $.extend(true, $.fancybox.defaults, {
    btnTpl: {
      share: '<button data-fancybox-share class="fancybox-button fancybox-button--share" title="{{SHARE}}">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.55 19c1.4-8.4 9.1-9.8 11.9-9.8V5l7 7-7 6.3v-3.5c-2.8 0-10.5 2.1-11.9 4.2z"/></svg>' + "</button>"
    },
    share: {
      url: function url(instance, item) {
        return (!instance.currentHash && !(item.type === "inline" || item.type === "html") ? item.origSrc || item.src : false) || window.location;
      },
      tpl: '<div class="fancybox-share">' + "<h1>{{SHARE}}</h1>" + "<p>" + '<a class="fancybox-share__button fancybox-share__button--fb" href="https://www.facebook.com/sharer/sharer.php?u={{url}}">' + '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m287 456v-299c0-21 6-35 35-35h38v-63c-7-1-29-3-55-3-54 0-91 33-91 94v306m143-254h-205v72h196" /></svg>' + "<span>Facebook</span>" + "</a>" + '<a class="fancybox-share__button fancybox-share__button--tw" href="https://twitter.com/intent/tweet?url={{url}}&text={{descr}}">' + '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m456 133c-14 7-31 11-47 13 17-10 30-27 37-46-15 10-34 16-52 20-61-62-157-7-141 75-68-3-129-35-169-85-22 37-11 86 26 109-13 0-26-4-37-9 0 39 28 72 65 80-12 3-25 4-37 2 10 33 41 57 77 57-42 30-77 38-122 34 170 111 378-32 359-208 16-11 30-25 41-42z" /></svg>' + "<span>Twitter</span>" + "</a>" + '<a class="fancybox-share__button fancybox-share__button--pt" href="https://www.pinterest.com/pin/create/button/?url={{url}}&description={{descr}}&media={{media}}">' + '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="m265 56c-109 0-164 78-164 144 0 39 15 74 47 87 5 2 10 0 12-5l4-19c2-6 1-8-3-13-9-11-15-25-15-45 0-58 43-110 113-110 62 0 96 38 96 88 0 67-30 122-73 122-24 0-42-19-36-44 6-29 20-60 20-81 0-19-10-35-31-35-25 0-44 26-44 60 0 21 7 36 7 36l-30 125c-8 37-1 83 0 87 0 3 4 4 5 2 2-3 32-39 42-75l16-64c8 16 31 29 56 29 74 0 124-67 124-157 0-69-58-132-146-132z" fill="#fff"/></svg>' + "<span>Pinterest</span>" + "</a>" + "</p>" + '<p><input class="fancybox-share__input" type="text" value="{{url_raw}}" onclick="select()" /></p>' + "</div>"
    }
  });

  function escapeHtml(string) {
    var entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;"
    };
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
      return entityMap[s];
    });
  }

  $(document).on("click", "[data-fancybox-share]", function () {
    var instance = $.fancybox.getInstance(),
        current = instance.current || null,
        url,
        tpl;

    if (!current) {
      return;
    }

    if ($.type(current.opts.share.url) === "function") {
      url = current.opts.share.url.apply(current, [instance, current]);
    }

    tpl = current.opts.share.tpl.replace(/\{\{media\}\}/g, current.type === "image" ? encodeURIComponent(current.src) : "").replace(/\{\{url\}\}/g, encodeURIComponent(url)).replace(/\{\{url_raw\}\}/g, escapeHtml(url)).replace(/\{\{descr\}\}/g, instance.$caption ? encodeURIComponent(instance.$caption.text()) : "");
    $.fancybox.open({
      src: instance.translate(instance, tpl),
      type: "html",
      opts: {
        touch: false,
        animationEffect: false,
        afterLoad: function afterLoad(shareInstance, shareCurrent) {
          // Close self if parent instance is closing
          instance.$refs.container.one("beforeClose.fb", function () {
            shareInstance.close(null, 0);
          }); // Opening links in a popup window

          shareCurrent.$content.find(".fancybox-share__button").click(function () {
            window.open(this.href, "Share", "width=550, height=450");
            return false;
          });
        },
        mobile: {
          autoFocus: false
        }
      }
    });
  });
})(document, jQuery); // ==========================================================================
//
// Hash
// Enables linking to each modal
//
// ==========================================================================


(function (window, document, $) {
  "use strict"; // Simple $.escapeSelector polyfill (for jQuery prior v3)

  if (!$.escapeSelector) {
    $.escapeSelector = function (sel) {
      var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;

      var fcssescape = function fcssescape(ch, asCodePoint) {
        if (asCodePoint) {
          // U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
          if (ch === "\0") {
            return "\uFFFD";
          } // Control characters and (dependent upon position) numbers get escaped as code points


          return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
        } // Other potentially-special ASCII characters get backslash-escaped


        return "\\" + ch;
      };

      return (sel + "").replace(rcssescape, fcssescape);
    };
  } // Get info about gallery name and current index from url


  function parseUrl() {
    var hash = window.location.hash.substr(1),
        rez = hash.split("-"),
        index = rez.length > 1 && /^\+?\d+$/.test(rez[rez.length - 1]) ? parseInt(rez.pop(-1), 10) || 1 : 1,
        gallery = rez.join("-");
    return {
      hash: hash,

      /* Index is starting from 1 */
      index: index < 1 ? 1 : index,
      gallery: gallery
    };
  } // Trigger click evnt on links to open new fancyBox instance


  function triggerFromUrl(url) {
    if (url.gallery !== "") {
      // If we can find element matching 'data-fancybox' atribute,
      // then triggering click event should start fancyBox
      $("[data-fancybox='" + $.escapeSelector(url.gallery) + "']").eq(url.index - 1).focus().trigger("click.fb-start");
    }
  } // Get gallery name from current instance


  function getGalleryID(instance) {
    var opts, ret;

    if (!instance) {
      return false;
    }

    opts = instance.current ? instance.current.opts : instance.opts;
    ret = opts.hash || (opts.$orig ? opts.$orig.data("fancybox") || opts.$orig.data("fancybox-trigger") : "");
    return ret === "" ? false : ret;
  } // Start when DOM becomes ready


  $(function () {
    // Check if user has disabled this module
    if ($.fancybox.defaults.hash === false) {
      return;
    } // Update hash when opening/closing fancyBox


    $(document).on({
      "onInit.fb": function onInitFb(e, instance) {
        var url, gallery;

        if (instance.group[instance.currIndex].opts.hash === false) {
          return;
        }

        url = parseUrl();
        gallery = getGalleryID(instance); // Make sure gallery start index matches index from hash

        if (gallery && url.gallery && gallery == url.gallery) {
          instance.currIndex = url.index - 1;
        }
      },
      "beforeShow.fb": function beforeShowFb(e, instance, current, firstRun) {
        var gallery;

        if (!current || current.opts.hash === false) {
          return;
        } // Check if need to update window hash


        gallery = getGalleryID(instance);

        if (!gallery) {
          return;
        } // Variable containing last hash value set by fancyBox
        // It will be used to determine if fancyBox needs to close after hash change is detected


        instance.currentHash = gallery + (instance.group.length > 1 ? "-" + (current.index + 1) : ""); // If current hash is the same (this instance most likely is opened by hashchange), then do nothing

        if (window.location.hash === "#" + instance.currentHash) {
          return;
        }

        if (firstRun && !instance.origHash) {
          instance.origHash = window.location.hash;
        }

        if (instance.hashTimer) {
          clearTimeout(instance.hashTimer);
        } // Update hash


        instance.hashTimer = setTimeout(function () {
          if ("replaceState" in window.history) {
            window.history[firstRun ? "pushState" : "replaceState"]({}, document.title, window.location.pathname + window.location.search + "#" + instance.currentHash);

            if (firstRun) {
              instance.hasCreatedHistory = true;
            }
          } else {
            window.location.hash = instance.currentHash;
          }

          instance.hashTimer = null;
        }, 300);
      },
      "beforeClose.fb": function beforeCloseFb(e, instance, current) {
        if (!current || current.opts.hash === false) {
          return;
        }

        clearTimeout(instance.hashTimer); // Goto previous history entry

        if (instance.currentHash && instance.hasCreatedHistory) {
          window.history.back();
        } else if (instance.currentHash) {
          if ("replaceState" in window.history) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search + (instance.origHash || ""));
          } else {
            window.location.hash = instance.origHash;
          }
        }

        instance.currentHash = null;
      }
    }); // Check if need to start/close after url has changed

    $(window).on("hashchange.fb", function () {
      var url = parseUrl(),
          fb = null; // Find last fancyBox instance that has "hash"

      $.each($(".fancybox-container").get().reverse(), function (index, value) {
        var tmp = $(value).data("FancyBox");

        if (tmp && tmp.currentHash) {
          fb = tmp;
          return false;
        }
      });

      if (fb) {
        // Now, compare hash values
        if (fb.currentHash !== url.gallery + "-" + url.index && !(url.index === 1 && fb.currentHash == url.gallery)) {
          fb.currentHash = null;
          fb.close();
        }
      } else if (url.gallery !== "") {
        triggerFromUrl(url);
      }
    }); // Check current hash and trigger click event on matching element to start fancyBox, if needed

    setTimeout(function () {
      if (!$.fancybox.getInstance()) {
        triggerFromUrl(parseUrl());
      }
    }, 50);
  });
})(window, document, jQuery); // ==========================================================================
//
// Wheel
// Basic mouse weheel support for gallery navigation
//
// ==========================================================================


(function (document, $) {
  "use strict";

  var prevTime = new Date().getTime();
  $(document).on({
    "onInit.fb": function onInitFb(e, instance, current) {
      instance.$refs.stage.on("mousewheel DOMMouseScroll wheel MozMousePixelScroll", function (e) {
        var current = instance.current,
            currTime = new Date().getTime();

        if (instance.group.length < 2 || current.opts.wheel === false || current.opts.wheel === "auto" && current.type !== "image") {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        if (current.$slide.hasClass("fancybox-animated")) {
          return;
        }

        e = e.originalEvent || e;

        if (currTime - prevTime < 250) {
          return;
        }

        prevTime = currTime;
        instance[(-e.deltaY || -e.deltaX || e.wheelDelta || -e.detail) < 0 ? "next" : "previous"]();
      });
    }
  });
})(document, jQuery);
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
 * jQuery FlexSlider v2.2.0
 * Copyright 2012 WooThemes
 * Contributing Author: Tyler Smith
 */
;

(function ($) {
  //FlexSlider: Object Instance
  $.flexslider = function (el, options) {
    var slider = $(el); // making variables public

    slider.vars = $.extend({}, $.flexslider.defaults, options);
    var namespace = slider.vars.namespace,
        msGesture = window.navigator && window.navigator.msPointerEnabled && window.MSGesture,
        touch = ("ontouchstart" in window || msGesture || window.DocumentTouch && document instanceof DocumentTouch) && slider.vars.touch,
        // depricating this idea, as devices are being released with both of these events
    //eventType = (touch) ? "touchend" : "click",
    eventType = "click touchend MSPointerUp",
        watchedEvent = "",
        watchedEventClearTimer,
        vertical = slider.vars.direction === "vertical",
        reverse = slider.vars.reverse,
        carousel = slider.vars.itemWidth > 0,
        fade = slider.vars.animation === "fade",
        asNav = slider.vars.asNavFor !== "",
        methods = {},
        focused = true; // Store a reference to the slider object

    $.data(el, "flexslider", slider); // Private slider methods

    methods = {
      init: function init() {
        slider.animating = false; // Get current slide and make sure it is a number

        slider.currentSlide = parseInt(slider.vars.startAt ? slider.vars.startAt : 0);
        if (isNaN(slider.currentSlide)) slider.currentSlide = 0;
        slider.animatingTo = slider.currentSlide;
        slider.atEnd = slider.currentSlide === 0 || slider.currentSlide === slider.last;
        slider.containerSelector = slider.vars.selector.substr(0, slider.vars.selector.search(' '));
        slider.slides = $(slider.vars.selector, slider);
        slider.container = $(slider.containerSelector, slider);
        slider.count = slider.slides.length; // SYNC:

        slider.syncExists = $(slider.vars.sync).length > 0; // SLIDE:

        if (slider.vars.animation === "slide") slider.vars.animation = "swing";
        slider.prop = vertical ? "top" : "marginLeft";
        slider.args = {}; // SLIDESHOW:

        slider.manualPause = false;
        slider.stopped = false; //PAUSE WHEN INVISIBLE

        slider.started = false;
        slider.startTimeout = null; // TOUCH/USECSS:

        slider.transitions = !slider.vars.video && !fade && slider.vars.useCSS && function () {
          var obj = document.createElement('div'),
              props = ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];

          for (var i in props) {
            if (obj.style[props[i]] !== undefined) {
              slider.pfx = props[i].replace('Perspective', '').toLowerCase();
              slider.prop = "-" + slider.pfx + "-transform";
              return true;
            }
          }

          return false;
        }(); // CONTROLSCONTAINER:


        if (slider.vars.controlsContainer !== "") slider.controlsContainer = $(slider.vars.controlsContainer).length > 0 && $(slider.vars.controlsContainer); // MANUAL:

        if (slider.vars.manualControls !== "") slider.manualControls = $(slider.vars.manualControls).length > 0 && $(slider.vars.manualControls); // RANDOMIZE:

        if (slider.vars.randomize) {
          slider.slides.sort(function () {
            return Math.round(Math.random()) - 0.5;
          });
          slider.container.empty().append(slider.slides);
        }

        slider.doMath(); // INIT

        slider.setup("init"); // CONTROLNAV:

        if (slider.vars.controlNav) methods.controlNav.setup(); // DIRECTIONNAV:

        if (slider.vars.directionNav) methods.directionNav.setup(); // KEYBOARD:

        if (slider.vars.keyboard && ($(slider.containerSelector).length === 1 || slider.vars.multipleKeyboard)) {
          $(document).bind('keyup', function (event) {
            var keycode = event.keyCode;

            if (!slider.animating && (keycode === 39 || keycode === 37)) {
              var target = keycode === 39 ? slider.getTarget('next') : keycode === 37 ? slider.getTarget('prev') : false;
              slider.flexAnimate(target, slider.vars.pauseOnAction);
            }
          });
        } // MOUSEWHEEL:


        if (slider.vars.mousewheel) {
          slider.bind('mousewheel', function (event, delta, deltaX, deltaY) {
            event.preventDefault();
            var target = delta < 0 ? slider.getTarget('next') : slider.getTarget('prev');
            slider.flexAnimate(target, slider.vars.pauseOnAction);
          });
        } // PAUSEPLAY


        if (slider.vars.pausePlay) methods.pausePlay.setup(); //PAUSE WHEN INVISIBLE

        if (slider.vars.slideshow && slider.vars.pauseInvisible) methods.pauseInvisible.init(); // SLIDSESHOW

        if (slider.vars.slideshow) {
          if (slider.vars.pauseOnHover) {
            slider.hover(function () {
              if (!slider.manualPlay && !slider.manualPause) slider.pause();
            }, function () {
              if (!slider.manualPause && !slider.manualPlay && !slider.stopped) slider.play();
            });
          } // initialize animation
          //If we're visible, or we don't use PageVisibility API


          if (!slider.vars.pauseInvisible || !methods.pauseInvisible.isHidden()) {
            slider.vars.initDelay > 0 ? slider.startTimeout = setTimeout(slider.play, slider.vars.initDelay) : slider.play();
          }
        } // ASNAV:


        if (asNav) methods.asNav.setup(); // TOUCH

        if (touch && slider.vars.touch) methods.touch(); // FADE&&SMOOTHHEIGHT || SLIDE:

        if (!fade || fade && slider.vars.smoothHeight) $(window).bind("resize orientationchange focus", methods.resize);
        slider.find("img").attr("draggable", "false"); // API: start() Callback

        setTimeout(function () {
          slider.vars.start(slider);
        }, 200);
      },
      asNav: {
        setup: function setup() {
          slider.asNav = true;
          slider.animatingTo = Math.floor(slider.currentSlide / slider.move);
          slider.currentItem = slider.currentSlide;
          slider.slides.removeClass(namespace + "active-slide").eq(slider.currentItem).addClass(namespace + "active-slide");

          if (!msGesture) {
            slider.slides.click(function (e) {
              e.preventDefault();
              var $slide = $(this),
                  target = $slide.index();
              var posFromLeft = $slide.offset().left - $(slider).scrollLeft(); // Find position of slide relative to left of slider container

              if (posFromLeft <= 0 && $slide.hasClass(namespace + 'active-slide')) {
                slider.flexAnimate(slider.getTarget("prev"), true);
              } else if (!$(slider.vars.asNavFor).data('flexslider').animating && !$slide.hasClass(namespace + "active-slide")) {
                slider.direction = slider.currentItem < target ? "next" : "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction, false, true, true);
              }
            });
          } else {
            el._slider = slider;
            slider.slides.each(function () {
              var that = this;
              that._gesture = new MSGesture();
              that._gesture.target = that;
              that.addEventListener("MSPointerDown", function (e) {
                e.preventDefault();
                if (e.currentTarget._gesture) e.currentTarget._gesture.addPointer(e.pointerId);
              }, false);
              that.addEventListener("MSGestureTap", function (e) {
                e.preventDefault();
                var $slide = $(this),
                    target = $slide.index();

                if (!$(slider.vars.asNavFor).data('flexslider').animating && !$slide.hasClass('active')) {
                  slider.direction = slider.currentItem < target ? "next" : "prev";
                  slider.flexAnimate(target, slider.vars.pauseOnAction, false, true, true);
                }
              });
            });
          }
        }
      },
      controlNav: {
        setup: function setup() {
          if (!slider.manualControls) {
            methods.controlNav.setupPaging();
          } else {
            // MANUALCONTROLS:
            methods.controlNav.setupManual();
          }
        },
        setupPaging: function setupPaging() {
          var type = slider.vars.controlNav === "thumbnails" ? 'control-thumbs' : 'control-paging',
              j = 1,
              item,
              slide;
          slider.controlNavScaffold = $('<ol class="' + namespace + 'control-nav ' + namespace + type + '"></ol>');

          if (slider.pagingCount > 1) {
            for (var i = 0; i < slider.pagingCount; i++) {
              slide = slider.slides.eq(i);
              item = slider.vars.controlNav === "thumbnails" ? '<img src="' + slide.attr('data-thumb') + '"/>' : '<a>' + j + '</a>';

              if ('thumbnails' === slider.vars.controlNav && true === slider.vars.thumbCaptions) {
                var captn = slide.attr('data-thumbcaption');
                if ('' != captn && undefined != captn) item += '<span class="' + namespace + 'caption">' + captn + '</span>';
              }

              slider.controlNavScaffold.append('<li>' + item + '</li>');
              j++;
            }
          } // CONTROLSCONTAINER:


          slider.controlsContainer ? $(slider.controlsContainer).append(slider.controlNavScaffold) : slider.append(slider.controlNavScaffold);
          methods.controlNav.set();
          methods.controlNav.active();
          slider.controlNavScaffold.delegate('a, img', eventType, function (event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              var $this = $(this),
                  target = slider.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                slider.direction = target > slider.currentSlide ? "next" : "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              }
            } // setup flags to prevent event duplication


            if (watchedEvent === "") {
              watchedEvent = event.type;
            }

            methods.setToClearWatchedEvent();
          });
        },
        setupManual: function setupManual() {
          slider.controlNav = slider.manualControls;
          methods.controlNav.active();
          slider.controlNav.bind(eventType, function (event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              var $this = $(this),
                  target = slider.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                target > slider.currentSlide ? slider.direction = "next" : slider.direction = "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              }
            } // setup flags to prevent event duplication


            if (watchedEvent === "") {
              watchedEvent = event.type;
            }

            methods.setToClearWatchedEvent();
          });
        },
        set: function set() {
          var selector = slider.vars.controlNav === "thumbnails" ? 'img' : 'a';
          slider.controlNav = $('.' + namespace + 'control-nav li ' + selector, slider.controlsContainer ? slider.controlsContainer : slider);
        },
        active: function active() {
          slider.controlNav.removeClass(namespace + "active").eq(slider.animatingTo).addClass(namespace + "active");
        },
        update: function update(action, pos) {
          if (slider.pagingCount > 1 && action === "add") {
            slider.controlNavScaffold.append($('<li><a>' + slider.count + '</a></li>'));
          } else if (slider.pagingCount === 1) {
            slider.controlNavScaffold.find('li').remove();
          } else {
            slider.controlNav.eq(pos).closest('li').remove();
          }

          methods.controlNav.set();
          slider.pagingCount > 1 && slider.pagingCount !== slider.controlNav.length ? slider.update(pos, action) : methods.controlNav.active();
        }
      },
      directionNav: {
        setup: function setup() {
          var directionNavScaffold = $('<ul class="' + namespace + 'direction-nav"><li><a class="' + namespace + 'prev" href="#">' + slider.vars.prevText + '</a></li><li><a class="' + namespace + 'next" href="#">' + slider.vars.nextText + '</a></li></ul>'); // CONTROLSCONTAINER:

          if (slider.controlsContainer) {
            $(slider.controlsContainer).append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider.controlsContainer);
          } else {
            slider.append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider);
          }

          methods.directionNav.update();
          slider.directionNav.bind(eventType, function (event) {
            event.preventDefault();
            var target;

            if (watchedEvent === "" || watchedEvent === event.type) {
              target = $(this).hasClass(namespace + 'next') ? slider.getTarget('next') : slider.getTarget('prev');
              slider.flexAnimate(target, slider.vars.pauseOnAction);
            } // setup flags to prevent event duplication


            if (watchedEvent === "") {
              watchedEvent = event.type;
            }

            methods.setToClearWatchedEvent();
          });
        },
        update: function update() {
          var disabledClass = namespace + 'disabled';

          if (slider.pagingCount === 1) {
            slider.directionNav.addClass(disabledClass).attr('tabindex', '-1');
          } else if (!slider.vars.animationLoop) {
            if (slider.animatingTo === 0) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "prev").addClass(disabledClass).attr('tabindex', '-1');
            } else if (slider.animatingTo === slider.last) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "next").addClass(disabledClass).attr('tabindex', '-1');
            } else {
              slider.directionNav.removeClass(disabledClass).removeAttr('tabindex');
            }
          } else {
            slider.directionNav.removeClass(disabledClass).removeAttr('tabindex');
          }
        }
      },
      pausePlay: {
        setup: function setup() {
          var pausePlayScaffold = $('<div class="' + namespace + 'pauseplay"><a></a></div>'); // CONTROLSCONTAINER:

          if (slider.controlsContainer) {
            slider.controlsContainer.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider.controlsContainer);
          } else {
            slider.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider);
          }

          methods.pausePlay.update(slider.vars.slideshow ? namespace + 'pause' : namespace + 'play');
          slider.pausePlay.bind(eventType, function (event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              if ($(this).hasClass(namespace + 'pause')) {
                slider.manualPause = true;
                slider.manualPlay = false;
                slider.pause();
              } else {
                slider.manualPause = false;
                slider.manualPlay = true;
                slider.play();
              }
            } // setup flags to prevent event duplication


            if (watchedEvent === "") {
              watchedEvent = event.type;
            }

            methods.setToClearWatchedEvent();
          });
        },
        update: function update(state) {
          state === "play" ? slider.pausePlay.removeClass(namespace + 'pause').addClass(namespace + 'play').html(slider.vars.playText) : slider.pausePlay.removeClass(namespace + 'play').addClass(namespace + 'pause').html(slider.vars.pauseText);
        }
      },
      touch: function touch() {
        var startX,
            startY,
            offset,
            cwidth,
            dx,
            startT,
            scrolling = false,
            localX = 0,
            localY = 0,
            accDx = 0;

        if (!msGesture) {
          var onTouchStart = function onTouchStart(e) {
            if (slider.animating) {
              e.preventDefault();
            } else if (window.navigator.msPointerEnabled || e.touches.length === 1) {
              slider.pause(); // CAROUSEL:

              cwidth = vertical ? slider.h : slider.w;
              startT = Number(new Date()); // CAROUSEL:
              // Local vars for X and Y points.

              localX = e.touches[0].pageX;
              localY = e.touches[0].pageY;
              offset = carousel && reverse && slider.animatingTo === slider.last ? 0 : carousel && reverse ? slider.limit - (slider.itemW + slider.vars.itemMargin) * slider.move * slider.animatingTo : carousel && slider.currentSlide === slider.last ? slider.limit : carousel ? (slider.itemW + slider.vars.itemMargin) * slider.move * slider.currentSlide : reverse ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
              startX = vertical ? localY : localX;
              startY = vertical ? localX : localY;
              el.addEventListener('touchmove', onTouchMove, false);
              el.addEventListener('touchend', onTouchEnd, false);
            }
          };

          var onTouchMove = function onTouchMove(e) {
            // Local vars for X and Y points.
            localX = e.touches[0].pageX;
            localY = e.touches[0].pageY;
            dx = vertical ? startX - localY : startX - localX;
            scrolling = vertical ? Math.abs(dx) < Math.abs(localX - startY) : Math.abs(dx) < Math.abs(localY - startY);
            var fxms = 500;

            if (!scrolling || Number(new Date()) - startT > fxms) {
              e.preventDefault();

              if (!fade && slider.transitions) {
                if (!slider.vars.animationLoop) {
                  dx = dx / (slider.currentSlide === 0 && dx < 0 || slider.currentSlide === slider.last && dx > 0 ? Math.abs(dx) / cwidth + 2 : 1);
                }

                slider.setProps(offset + dx, "setTouch");
              }
            }
          };

          var onTouchEnd = function onTouchEnd(e) {
            // finish the touch by undoing the touch session
            el.removeEventListener('touchmove', onTouchMove, false);

            if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
              var updateDx = reverse ? -dx : dx,
                  target = updateDx > 0 ? slider.getTarget('next') : slider.getTarget('prev');

              if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth / 2)) {
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              } else {
                if (!fade) slider.flexAnimate(slider.currentSlide, slider.vars.pauseOnAction, true);
              }
            }

            el.removeEventListener('touchend', onTouchEnd, false);
            startX = null;
            startY = null;
            dx = null;
            offset = null;
          };

          el.addEventListener('touchstart', onTouchStart, false);
        } else {
          var onMSPointerDown = function onMSPointerDown(e) {
            e.stopPropagation();

            if (slider.animating) {
              e.preventDefault();
            } else {
              slider.pause();

              el._gesture.addPointer(e.pointerId);

              accDx = 0;
              cwidth = vertical ? slider.h : slider.w;
              startT = Number(new Date()); // CAROUSEL:

              offset = carousel && reverse && slider.animatingTo === slider.last ? 0 : carousel && reverse ? slider.limit - (slider.itemW + slider.vars.itemMargin) * slider.move * slider.animatingTo : carousel && slider.currentSlide === slider.last ? slider.limit : carousel ? (slider.itemW + slider.vars.itemMargin) * slider.move * slider.currentSlide : reverse ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
            }
          };

          var onMSGestureChange = function onMSGestureChange(e) {
            e.stopPropagation();
            var slider = e.target._slider;

            if (!slider) {
              return;
            }

            var transX = -e.translationX,
                transY = -e.translationY; //Accumulate translations.

            accDx = accDx + (vertical ? transY : transX);
            dx = accDx;
            scrolling = vertical ? Math.abs(accDx) < Math.abs(-transX) : Math.abs(accDx) < Math.abs(-transY);

            if (e.detail === e.MSGESTURE_FLAG_INERTIA) {
              setImmediate(function () {
                el._gesture.stop();
              });
              return;
            }

            if (!scrolling || Number(new Date()) - startT > 500) {
              e.preventDefault();

              if (!fade && slider.transitions) {
                if (!slider.vars.animationLoop) {
                  dx = accDx / (slider.currentSlide === 0 && accDx < 0 || slider.currentSlide === slider.last && accDx > 0 ? Math.abs(accDx) / cwidth + 2 : 1);
                }

                slider.setProps(offset + dx, "setTouch");
              }
            }
          };

          var onMSGestureEnd = function onMSGestureEnd(e) {
            e.stopPropagation();
            var slider = e.target._slider;

            if (!slider) {
              return;
            }

            if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
              var updateDx = reverse ? -dx : dx,
                  target = updateDx > 0 ? slider.getTarget('next') : slider.getTarget('prev');

              if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth / 2)) {
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              } else {
                if (!fade) slider.flexAnimate(slider.currentSlide, slider.vars.pauseOnAction, true);
              }
            }

            startX = null;
            startY = null;
            dx = null;
            offset = null;
            accDx = 0;
          };

          el.style.msTouchAction = "none";
          el._gesture = new MSGesture();
          el._gesture.target = el;
          el.addEventListener("MSPointerDown", onMSPointerDown, false);
          el._slider = slider;
          el.addEventListener("MSGestureChange", onMSGestureChange, false);
          el.addEventListener("MSGestureEnd", onMSGestureEnd, false);
        }
      },
      resize: function resize() {
        if (!slider.animating && slider.is(':visible')) {
          if (!carousel) slider.doMath();

          if (fade) {
            // SMOOTH HEIGHT:
            methods.smoothHeight();
          } else if (carousel) {
            //CAROUSEL:
            slider.slides.width(slider.computedW);
            slider.update(slider.pagingCount);
            slider.setProps();
          } else if (vertical) {
            //VERTICAL:
            slider.viewport.height(slider.h);
            slider.setProps(slider.h, "setTotal");
          } else {
            // SMOOTH HEIGHT:
            if (slider.vars.smoothHeight) methods.smoothHeight();
            slider.newSlides.width(slider.computedW);
            slider.setProps(slider.computedW, "setTotal");
          }
        }
      },
      smoothHeight: function smoothHeight(dur) {
        if (!vertical || fade) {
          var $obj = fade ? slider : slider.viewport;
          dur ? $obj.animate({
            "height": slider.slides.eq(slider.animatingTo).height()
          }, dur) : $obj.height(slider.slides.eq(slider.animatingTo).height());
        }
      },
      sync: function sync(action) {
        var $obj = $(slider.vars.sync).data("flexslider"),
            target = slider.animatingTo;

        switch (action) {
          case "animate":
            $obj.flexAnimate(target, slider.vars.pauseOnAction, false, true);
            break;

          case "play":
            if (!$obj.playing && !$obj.asNav) {
              $obj.play();
            }

            break;

          case "pause":
            $obj.pause();
            break;
        }
      },
      pauseInvisible: {
        visProp: null,
        init: function init() {
          var prefixes = ['webkit', 'moz', 'ms', 'o'];
          if ('hidden' in document) return 'hidden';

          for (var i = 0; i < prefixes.length; i++) {
            if (prefixes[i] + 'Hidden' in document) methods.pauseInvisible.visProp = prefixes[i] + 'Hidden';
          }

          if (methods.pauseInvisible.visProp) {
            var evtname = methods.pauseInvisible.visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
            document.addEventListener(evtname, function () {
              if (methods.pauseInvisible.isHidden()) {
                if (slider.startTimeout) clearTimeout(slider.startTimeout); //If clock is ticking, stop timer and prevent from starting while invisible
                else slider.pause(); //Or just pause
              } else {
                if (slider.started) slider.play(); //Initiated before, just play
                else slider.vars.initDelay > 0 ? setTimeout(slider.play, slider.vars.initDelay) : slider.play(); //Didn't init before: simply init or wait for it
              }
            });
          }
        },
        isHidden: function isHidden() {
          return document[methods.pauseInvisible.visProp] || false;
        }
      },
      setToClearWatchedEvent: function setToClearWatchedEvent() {
        clearTimeout(watchedEventClearTimer);
        watchedEventClearTimer = setTimeout(function () {
          watchedEvent = "";
        }, 3000);
      }
    }; // public methods

    slider.flexAnimate = function (target, pause, override, withSync, fromNav) {
      if (!slider.vars.animationLoop && target !== slider.currentSlide) {
        slider.direction = target > slider.currentSlide ? "next" : "prev";
      }

      if (asNav && slider.pagingCount === 1) slider.direction = slider.currentItem < target ? "next" : "prev";

      if (!slider.animating && (slider.canAdvance(target, fromNav) || override) && slider.is(":visible")) {
        if (asNav && withSync) {
          var master = $(slider.vars.asNavFor).data('flexslider');
          slider.atEnd = target === 0 || target === slider.count - 1;
          master.flexAnimate(target, true, false, true, fromNav);
          slider.direction = slider.currentItem < target ? "next" : "prev";
          master.direction = slider.direction;

          if (Math.ceil((target + 1) / slider.visible) - 1 !== slider.currentSlide && target !== 0) {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            target = Math.floor(target / slider.visible);
          } else {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            return false;
          }
        }

        slider.animating = true;
        slider.animatingTo = target; // SLIDESHOW:

        if (pause) slider.pause(); // API: before() animation Callback

        slider.vars.before(slider); // SYNC:

        if (slider.syncExists && !fromNav) methods.sync("animate"); // CONTROLNAV

        if (slider.vars.controlNav) methods.controlNav.active(); // !CAROUSEL:
        // CANDIDATE: slide active class (for add/remove slide)

        if (!carousel) slider.slides.removeClass(namespace + 'active-slide').eq(target).addClass(namespace + 'active-slide'); // INFINITE LOOP:
        // CANDIDATE: atEnd

        slider.atEnd = target === 0 || target === slider.last; // DIRECTIONNAV:

        if (slider.vars.directionNav) methods.directionNav.update();

        if (target === slider.last) {
          // API: end() of cycle Callback
          slider.vars.end(slider); // SLIDESHOW && !INFINITE LOOP:

          if (!slider.vars.animationLoop) slider.pause();
        } // SLIDE:


        if (!fade) {
          var dimension = vertical ? slider.slides.filter(':first').height() : slider.computedW,
              margin,
              slideString,
              calcNext; // INFINITE LOOP / REVERSE:

          if (carousel) {
            //margin = (slider.vars.itemWidth > slider.w) ? slider.vars.itemMargin * 2 : slider.vars.itemMargin;
            margin = slider.vars.itemMargin;
            calcNext = (slider.itemW + margin) * slider.move * slider.animatingTo;
            slideString = calcNext > slider.limit && slider.visible !== 1 ? slider.limit : calcNext;
          } else if (slider.currentSlide === 0 && target === slider.count - 1 && slider.vars.animationLoop && slider.direction !== "next") {
            slideString = reverse ? (slider.count + slider.cloneOffset) * dimension : 0;
          } else if (slider.currentSlide === slider.last && target === 0 && slider.vars.animationLoop && slider.direction !== "prev") {
            slideString = reverse ? 0 : (slider.count + 1) * dimension;
          } else {
            slideString = reverse ? (slider.count - 1 - target + slider.cloneOffset) * dimension : (target + slider.cloneOffset) * dimension;
          }

          slider.setProps(slideString, "", slider.vars.animationSpeed);

          if (slider.transitions) {
            if (!slider.vars.animationLoop || !slider.atEnd) {
              slider.animating = false;
              slider.currentSlide = slider.animatingTo;
            }

            slider.container.unbind("webkitTransitionEnd transitionend");
            slider.container.bind("webkitTransitionEnd transitionend", function () {
              slider.wrapup(dimension);
            });
          } else {
            slider.container.animate(slider.args, slider.vars.animationSpeed, slider.vars.easing, function () {
              slider.wrapup(dimension);
            });
          }
        } else {
          // FADE:
          if (!touch) {
            //slider.slides.eq(slider.currentSlide).fadeOut(slider.vars.animationSpeed, slider.vars.easing);
            //slider.slides.eq(target).fadeIn(slider.vars.animationSpeed, slider.vars.easing, slider.wrapup);
            slider.slides.eq(slider.currentSlide).css({
              "zIndex": 1
            }).animate({
              "opacity": 0
            }, slider.vars.animationSpeed, slider.vars.easing);
            slider.slides.eq(target).css({
              "zIndex": 2
            }).animate({
              "opacity": 1
            }, slider.vars.animationSpeed, slider.vars.easing, slider.wrapup);
          } else {
            slider.slides.eq(slider.currentSlide).css({
              "opacity": 0,
              "zIndex": 1
            });
            slider.slides.eq(target).css({
              "opacity": 1,
              "zIndex": 2
            });
            slider.wrapup(dimension);
          }
        } // SMOOTH HEIGHT:


        if (slider.vars.smoothHeight) methods.smoothHeight(slider.vars.animationSpeed);
      }
    };

    slider.wrapup = function (dimension) {
      // SLIDE:
      if (!fade && !carousel) {
        if (slider.currentSlide === 0 && slider.animatingTo === slider.last && slider.vars.animationLoop) {
          slider.setProps(dimension, "jumpEnd");
        } else if (slider.currentSlide === slider.last && slider.animatingTo === 0 && slider.vars.animationLoop) {
          slider.setProps(dimension, "jumpStart");
        }
      }

      slider.animating = false;
      slider.currentSlide = slider.animatingTo; // API: after() animation Callback

      slider.vars.after(slider);
    }; // SLIDESHOW:


    slider.animateSlides = function () {
      if (!slider.animating && focused) slider.flexAnimate(slider.getTarget("next"));
    }; // SLIDESHOW:


    slider.pause = function () {
      clearInterval(slider.animatedSlides);
      slider.animatedSlides = null;
      slider.playing = false; // PAUSEPLAY:

      if (slider.vars.pausePlay) methods.pausePlay.update("play"); // SYNC:

      if (slider.syncExists) methods.sync("pause");
    }; // SLIDESHOW:


    slider.play = function () {
      if (slider.playing) clearInterval(slider.animatedSlides);
      slider.animatedSlides = slider.animatedSlides || setInterval(slider.animateSlides, slider.vars.slideshowSpeed);
      slider.started = slider.playing = true; // PAUSEPLAY:

      if (slider.vars.pausePlay) methods.pausePlay.update("pause"); // SYNC:

      if (slider.syncExists) methods.sync("play");
    }; // STOP:


    slider.stop = function () {
      slider.pause();
      slider.stopped = true;
    };

    slider.canAdvance = function (target, fromNav) {
      // ASNAV:
      var last = asNav ? slider.pagingCount - 1 : slider.last;
      return fromNav ? true : asNav && slider.currentItem === slider.count - 1 && target === 0 && slider.direction === "prev" ? true : asNav && slider.currentItem === 0 && target === slider.pagingCount - 1 && slider.direction !== "next" ? false : target === slider.currentSlide && !asNav ? false : slider.vars.animationLoop ? true : slider.atEnd && slider.currentSlide === 0 && target === last && slider.direction !== "next" ? false : slider.atEnd && slider.currentSlide === last && target === 0 && slider.direction === "next" ? false : true;
    };

    slider.getTarget = function (dir) {
      slider.direction = dir;

      if (dir === "next") {
        return slider.currentSlide === slider.last ? 0 : slider.currentSlide + 1;
      } else {
        return slider.currentSlide === 0 ? slider.last : slider.currentSlide - 1;
      }
    }; // SLIDE:


    slider.setProps = function (pos, special, dur) {
      var target = function () {
        var posCheck = pos ? pos : (slider.itemW + slider.vars.itemMargin) * slider.move * slider.animatingTo,
            posCalc = function () {
          if (carousel) {
            return special === "setTouch" ? pos : reverse && slider.animatingTo === slider.last ? 0 : reverse ? slider.limit - (slider.itemW + slider.vars.itemMargin) * slider.move * slider.animatingTo : slider.animatingTo === slider.last ? slider.limit : posCheck;
          } else {
            switch (special) {
              case "setTotal":
                return reverse ? (slider.count - 1 - slider.currentSlide + slider.cloneOffset) * pos : (slider.currentSlide + slider.cloneOffset) * pos;

              case "setTouch":
                return reverse ? pos : pos;

              case "jumpEnd":
                return reverse ? pos : slider.count * pos;

              case "jumpStart":
                return reverse ? slider.count * pos : pos;

              default:
                return pos;
            }
          }
        }();

        return posCalc * -1 + "px";
      }();

      if (slider.transitions) {
        target = vertical ? "translate3d(0," + target + ",0)" : "translate3d(" + target + ",0,0)";
        dur = dur !== undefined ? dur / 1000 + "s" : "0s";
        slider.container.css("-" + slider.pfx + "-transition-duration", dur);
      }

      slider.args[slider.prop] = target;
      if (slider.transitions || dur === undefined) slider.container.css(slider.args);
    };

    slider.setup = function (type) {
      // SLIDE:
      if (!fade) {
        var sliderOffset, arr;

        if (type === "init") {
          slider.viewport = $('<div class="' + namespace + 'viewport"></div>').css({
            "overflow": "hidden",
            "position": "relative"
          }).appendTo(slider).append(slider.container); // INFINITE LOOP:

          slider.cloneCount = 0;
          slider.cloneOffset = 0; // REVERSE:

          if (reverse) {
            arr = $.makeArray(slider.slides).reverse();
            slider.slides = $(arr);
            slider.container.empty().append(slider.slides);
          }
        } // INFINITE LOOP && !CAROUSEL:


        if (slider.vars.animationLoop && !carousel) {
          slider.cloneCount = 2;
          slider.cloneOffset = 1; // clear out old clones

          if (type !== "init") slider.container.find('.clone').remove();
          slider.container.append(slider.slides.first().clone().addClass('clone').attr('aria-hidden', 'true')).prepend(slider.slides.last().clone().addClass('clone').attr('aria-hidden', 'true'));
        }

        slider.newSlides = $(slider.vars.selector, slider);
        sliderOffset = reverse ? slider.count - 1 - slider.currentSlide + slider.cloneOffset : slider.currentSlide + slider.cloneOffset; // VERTICAL:

        if (vertical && !carousel) {
          slider.container.height((slider.count + slider.cloneCount) * 200 + "%").css("position", "absolute").width("100%");
          setTimeout(function () {
            slider.newSlides.css({
              "display": "block"
            });
            slider.doMath();
            slider.viewport.height(slider.h);
            slider.setProps(sliderOffset * slider.h, "init");
          }, type === "init" ? 100 : 0);
        } else {
          slider.container.width((slider.count + slider.cloneCount) * 200 + "%");
          slider.setProps(sliderOffset * slider.computedW, "init");
          setTimeout(function () {
            slider.doMath();
            slider.newSlides.css({
              "width": slider.computedW,
              "float": "left",
              "display": "block"
            }); // SMOOTH HEIGHT:

            if (slider.vars.smoothHeight) methods.smoothHeight();
          }, type === "init" ? 100 : 0);
        }
      } else {
        // FADE:
        slider.slides.css({
          "width": "100%",
          "float": "left",
          "marginRight": "-100%",
          "position": "relative"
        });

        if (type === "init") {
          if (!touch) {
            //slider.slides.eq(slider.currentSlide).fadeIn(slider.vars.animationSpeed, slider.vars.easing);
            slider.slides.css({
              "opacity": 0,
              "display": "block",
              "zIndex": 1
            }).eq(slider.currentSlide).css({
              "zIndex": 2
            }).animate({
              "opacity": 1
            }, slider.vars.animationSpeed, slider.vars.easing);
          } else {
            slider.slides.css({
              "opacity": 0,
              "display": "block",
              "webkitTransition": "opacity " + slider.vars.animationSpeed / 1000 + "s ease",
              "zIndex": 1
            }).eq(slider.currentSlide).css({
              "opacity": 1,
              "zIndex": 2
            });
          }
        } // SMOOTH HEIGHT:


        if (slider.vars.smoothHeight) methods.smoothHeight();
      } // !CAROUSEL:
      // CANDIDATE: active slide


      if (!carousel) slider.slides.removeClass(namespace + "active-slide").eq(slider.currentSlide).addClass(namespace + "active-slide");
    };

    slider.doMath = function () {
      var slide = slider.slides.first(),
          slideMargin = slider.vars.itemMargin,
          minItems = slider.vars.minItems,
          maxItems = slider.vars.maxItems;
      slider.w = slider.viewport === undefined ? slider.width() : slider.viewport.width();
      slider.h = slide.height();
      slider.boxPadding = slide.outerWidth() - slide.width(); // CAROUSEL:

      if (carousel) {
        slider.itemT = slider.vars.itemWidth + slideMargin;
        slider.minW = minItems ? minItems * slider.itemT : slider.w;
        slider.maxW = maxItems ? maxItems * slider.itemT - slideMargin : slider.w;
        slider.itemW = slider.minW > slider.w ? (slider.w - slideMargin * (minItems - 1)) / minItems : slider.maxW < slider.w ? (slider.w - slideMargin * (maxItems - 1)) / maxItems : slider.vars.itemWidth > slider.w ? slider.w : slider.vars.itemWidth;
        slider.visible = Math.floor(slider.w / slider.itemW);
        slider.move = slider.vars.move > 0 && slider.vars.move < slider.visible ? slider.vars.move : slider.visible;
        slider.pagingCount = Math.ceil((slider.count - slider.visible) / slider.move + 1);
        slider.last = slider.pagingCount - 1;
        slider.limit = slider.pagingCount === 1 ? 0 : slider.vars.itemWidth > slider.w ? slider.itemW * (slider.count - 1) + slideMargin * (slider.count - 1) : (slider.itemW + slideMargin) * slider.count - slider.w - slideMargin;
      } else {
        slider.itemW = slider.w;
        slider.pagingCount = slider.count;
        slider.last = slider.count - 1;
      }

      slider.computedW = slider.itemW - slider.boxPadding;
    };

    slider.update = function (pos, action) {
      slider.doMath(); // update currentSlide and slider.animatingTo if necessary

      if (!carousel) {
        if (pos < slider.currentSlide) {
          slider.currentSlide += 1;
        } else if (pos <= slider.currentSlide && pos !== 0) {
          slider.currentSlide -= 1;
        }

        slider.animatingTo = slider.currentSlide;
      } // update controlNav


      if (slider.vars.controlNav && !slider.manualControls) {
        if (action === "add" && !carousel || slider.pagingCount > slider.controlNav.length) {
          methods.controlNav.update("add");
        } else if (action === "remove" && !carousel || slider.pagingCount < slider.controlNav.length) {
          if (carousel && slider.currentSlide > slider.last) {
            slider.currentSlide -= 1;
            slider.animatingTo -= 1;
          }

          methods.controlNav.update("remove", slider.last);
        }
      } // update directionNav


      if (slider.vars.directionNav) methods.directionNav.update();
    };

    slider.addSlide = function (obj, pos) {
      var $obj = $(obj);
      slider.count += 1;
      slider.last = slider.count - 1; // append new slide

      if (vertical && reverse) {
        pos !== undefined ? slider.slides.eq(slider.count - pos).after($obj) : slider.container.prepend($obj);
      } else {
        pos !== undefined ? slider.slides.eq(pos).before($obj) : slider.container.append($obj);
      } // update currentSlide, animatingTo, controlNav, and directionNav


      slider.update(pos, "add"); // update slider.slides

      slider.slides = $(slider.vars.selector + ':not(.clone)', slider); // re-setup the slider to accomdate new slide

      slider.setup(); //FlexSlider: added() Callback

      slider.vars.added(slider);
    };

    slider.removeSlide = function (obj) {
      var pos = isNaN(obj) ? slider.slides.index($(obj)) : obj; // update count

      slider.count -= 1;
      slider.last = slider.count - 1; // remove slide

      if (isNaN(obj)) {
        $(obj, slider.slides).remove();
      } else {
        vertical && reverse ? slider.slides.eq(slider.last).remove() : slider.slides.eq(obj).remove();
      } // update currentSlide, animatingTo, controlNav, and directionNav


      slider.doMath();
      slider.update(pos, "remove"); // update slider.slides

      slider.slides = $(slider.vars.selector + ':not(.clone)', slider); // re-setup the slider to accomdate new slide

      slider.setup(); // FlexSlider: removed() Callback

      slider.vars.removed(slider);
    }; //FlexSlider: Initialize


    methods.init();
  }; // Ensure the slider isn't focussed if the window loses focus.


  $(window).blur(function (e) {
    focused = false;
  }).focus(function (e) {
    focused = true;
  }); //FlexSlider: Default Settings

  $.flexslider.defaults = {
    namespace: "flex-",
    //{NEW} String: Prefix string attached to the class of every element generated by the plugin
    selector: ".slides > li",
    //{NEW} Selector: Must match a simple pattern. '{container} > {slide}' -- Ignore pattern at your own peril
    animation: "fade",
    //String: Select your animation type, "fade" or "slide"
    easing: "swing",
    //{NEW} String: Determines the easing method used in jQuery transitions. jQuery easing plugin is supported!
    direction: "horizontal",
    //String: Select the sliding direction, "horizontal" or "vertical"
    reverse: false,
    //{NEW} Boolean: Reverse the animation direction
    animationLoop: true,
    //Boolean: Should the animation loop? If false, directionNav will received "disable" classes at either end
    smoothHeight: false,
    //{NEW} Boolean: Allow height of the slider to animate smoothly in horizontal mode
    startAt: 0,
    //Integer: The slide that the slider should start on. Array notation (0 = first slide)
    slideshow: true,
    //Boolean: Animate slider automatically
    slideshowSpeed: 7000,
    //Integer: Set the speed of the slideshow cycling, in milliseconds
    animationSpeed: 600,
    //Integer: Set the speed of animations, in milliseconds
    initDelay: 0,
    //{NEW} Integer: Set an initialization delay, in milliseconds
    randomize: false,
    //Boolean: Randomize slide order
    thumbCaptions: false,
    //Boolean: Whether or not to put captions on thumbnails when using the "thumbnails" controlNav.
    // Usability features
    pauseOnAction: true,
    //Boolean: Pause the slideshow when interacting with control elements, highly recommended.
    pauseOnHover: false,
    //Boolean: Pause the slideshow when hovering over slider, then resume when no longer hovering
    pauseInvisible: true,
    //{NEW} Boolean: Pause the slideshow when tab is invisible, resume when visible. Provides better UX, lower CPU usage.
    useCSS: true,
    //{NEW} Boolean: Slider will use CSS3 transitions if available
    touch: true,
    //{NEW} Boolean: Allow touch swipe navigation of the slider on touch-enabled devices
    video: false,
    //{NEW} Boolean: If using video in the slider, will prevent CSS3 3D Transforms to avoid graphical glitches
    // Primary Controls
    controlNav: true,
    //Boolean: Create navigation for paging control of each clide? Note: Leave true for manualControls usage
    directionNav: true,
    //Boolean: Create navigation for previous/next navigation? (true/false)
    prevText: "Previous",
    //String: Set the text for the "previous" directionNav item
    nextText: "Next",
    //String: Set the text for the "next" directionNav item
    // Secondary Navigation
    keyboard: true,
    //Boolean: Allow slider navigating via keyboard left/right keys
    multipleKeyboard: false,
    //{NEW} Boolean: Allow keyboard navigation to affect multiple sliders. Default behavior cuts out keyboard navigation with more than one slider present.
    mousewheel: false,
    //{UPDATED} Boolean: Requires jquery.mousewheel.js (https://github.com/brandonaaron/jquery-mousewheel) - Allows slider navigating via mousewheel
    pausePlay: false,
    //Boolean: Create pause/play dynamic element
    pauseText: "Pause",
    //String: Set the text for the "pause" pausePlay item
    playText: "Play",
    //String: Set the text for the "play" pausePlay item
    // Special properties
    controlsContainer: "",
    //{UPDATED} jQuery Object/Selector: Declare which container the navigation elements should be appended too. Default container is the FlexSlider element. Example use would be $(".flexslider-container"). Property is ignored if given element is not found.
    manualControls: "",
    //{UPDATED} jQuery Object/Selector: Declare custom control navigation. Examples would be $(".flex-control-nav li") or "#tabs-nav li img", etc. The number of elements in your controlNav should match the number of slides/tabs.
    sync: "",
    //{NEW} Selector: Mirror the actions performed on this slider with another slider. Use with care.
    asNavFor: "",
    //{NEW} Selector: Internal property exposed for turning the slider into a thumbnail navigation for another slider
    // Carousel Options
    itemWidth: 0,
    //{NEW} Integer: Box-model width of individual carousel items, including horizontal borders and padding.
    itemMargin: 0,
    //{NEW} Integer: Margin between carousel items.
    minItems: 1,
    //{NEW} Integer: Minimum number of carousel items that should be visible. Items will resize fluidly when below this.
    maxItems: 0,
    //{NEW} Integer: Maxmimum number of carousel items that should be visible. Items will resize fluidly when above this limit.
    move: 0,
    //{NEW} Integer: Number of carousel items that should move on animation. If 0, slider will move all visible items.
    allowOneSlide: true,
    //{NEW} Boolean: Whether or not to allow a slider comprised of a single slide
    // Callback API
    start: function start() {},
    //Callback: function(slider) - Fires when the slider loads the first slide
    before: function before() {},
    //Callback: function(slider) - Fires asynchronously with each slider animation
    after: function after() {},
    //Callback: function(slider) - Fires after each slider animation completes
    end: function end() {},
    //Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
    added: function added() {},
    //{NEW} Callback: function(slider) - Fires after a slide is added
    removed: function removed() {} //{NEW} Callback: function(slider) - Fires after a slide is removed

  }; //FlexSlider: Plugin Function

  $.fn.flexslider = function (options) {
    if (options === undefined) options = {};

    if (_typeof(options) === "object") {
      return this.each(function () {
        var $this = $(this),
            selector = options.selector ? options.selector : ".slides > li",
            $slides = $this.find(selector);

        if ($slides.length === 1 && options.allowOneSlide === true || $slides.length === 0) {
          $slides.fadeIn(400);
          if (options.start) options.start($this);
        } else if ($this.data('flexslider') === undefined) {
          new $.flexslider(this, options);
        }
      });
    } else {
      // Helper strings to quickly perform functions on the slider
      var $slider = $(this).data('flexslider');

      switch (options) {
        case "play":
          $slider.play();
          break;

        case "pause":
          $slider.pause();
          break;

        case "stop":
          $slider.stop();
          break;

        case "next":
          $slider.flexAnimate($slider.getTarget("next"), true);
          break;

        case "prev":
        case "previous":
          $slider.flexAnimate($slider.getTarget("prev"), true);
          break;

        default:
          if (typeof options === "number") $slider.flexAnimate(options, true);
      }
    }
  };
})(jQuery);
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
 * jQuery FlexSlider v2.7.2
 * Copyright 2012 WooThemes
 * Contributing Author: Tyler Smith
 */
;

(function ($) {
  var focused = true; //FlexSlider: Object Instance

  $.flexslider = function (el, options) {
    var slider = $(el); // making variables public
    //if rtl value was not passed and html is in rtl..enable it by default.

    if (typeof options.rtl == 'undefined' && $('html').attr('dir') == 'rtl') {
      options.rtl = true;
    }

    slider.vars = $.extend({}, $.flexslider.defaults, options);
    var namespace = slider.vars.namespace,
        msGesture = window.navigator && window.navigator.msPointerEnabled && window.MSGesture,
        touch = ("ontouchstart" in window || msGesture || window.DocumentTouch && document instanceof DocumentTouch) && slider.vars.touch,
        // deprecating this idea, as devices are being released with both of these events
    eventType = "click touchend MSPointerUp keyup",
        watchedEvent = "",
        watchedEventClearTimer,
        vertical = slider.vars.direction === "vertical",
        reverse = slider.vars.reverse,
        carousel = slider.vars.itemWidth > 0,
        fade = slider.vars.animation === "fade",
        asNav = slider.vars.asNavFor !== "",
        methods = {}; // Store a reference to the slider object

    $.data(el, "flexslider", slider); // Private slider methods

    methods = {
      init: function init() {
        slider.animating = false; // Get current slide and make sure it is a number

        slider.currentSlide = parseInt(slider.vars.startAt ? slider.vars.startAt : 0, 10);

        if (isNaN(slider.currentSlide)) {
          slider.currentSlide = 0;
        }

        slider.animatingTo = slider.currentSlide;
        slider.atEnd = slider.currentSlide === 0 || slider.currentSlide === slider.last;
        slider.containerSelector = slider.vars.selector.substr(0, slider.vars.selector.search(' '));
        slider.slides = $(slider.vars.selector, slider);
        slider.container = $(slider.containerSelector, slider);
        slider.count = slider.slides.length; // SYNC:

        slider.syncExists = $(slider.vars.sync).length > 0; // SLIDE:

        if (slider.vars.animation === "slide") {
          slider.vars.animation = "swing";
        }

        slider.prop = vertical ? "top" : slider.vars.rtl ? "marginRight" : "marginLeft";
        slider.args = {}; // SLIDESHOW:

        slider.manualPause = false;
        slider.stopped = false; //PAUSE WHEN INVISIBLE

        slider.started = false;
        slider.startTimeout = null; // TOUCH/USECSS:

        slider.transitions = !slider.vars.video && !fade && slider.vars.useCSS && function () {
          var obj = document.createElement('div'),
              props = ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];

          for (var i in props) {
            if (obj.style[props[i]] !== undefined) {
              slider.pfx = props[i].replace('Perspective', '').toLowerCase();
              slider.prop = "-" + slider.pfx + "-transform";
              return true;
            }
          }

          return false;
        }();

        slider.isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        slider.ensureAnimationEnd = ''; // CONTROLSCONTAINER:

        if (slider.vars.controlsContainer !== "") slider.controlsContainer = $(slider.vars.controlsContainer).length > 0 && $(slider.vars.controlsContainer); // MANUAL:

        if (slider.vars.manualControls !== "") slider.manualControls = $(slider.vars.manualControls).length > 0 && $(slider.vars.manualControls); // CUSTOM DIRECTION NAV:

        if (slider.vars.customDirectionNav !== "") slider.customDirectionNav = $(slider.vars.customDirectionNav).length === 2 && $(slider.vars.customDirectionNav); // RANDOMIZE:

        if (slider.vars.randomize) {
          slider.slides.sort(function () {
            return Math.round(Math.random()) - 0.5;
          });
          slider.container.empty().append(slider.slides);
        }

        slider.doMath(); // INIT

        slider.setup("init"); // CONTROLNAV:

        if (slider.vars.controlNav) {
          methods.controlNav.setup();
        } // DIRECTIONNAV:


        if (slider.vars.directionNav) {
          methods.directionNav.setup();
        } // KEYBOARD:


        if (slider.vars.keyboard && ($(slider.containerSelector).length === 1 || slider.vars.multipleKeyboard)) {
          $(document).bind('keyup', function (event) {
            var keycode = event.keyCode;

            if (!slider.animating && (keycode === 39 || keycode === 37)) {
              var target = slider.vars.rtl ? keycode === 37 ? slider.getTarget('next') : keycode === 39 ? slider.getTarget('prev') : false : keycode === 39 ? slider.getTarget('next') : keycode === 37 ? slider.getTarget('prev') : false;
              slider.flexAnimate(target, slider.vars.pauseOnAction);
            }
          });
        } // MOUSEWHEEL:


        if (slider.vars.mousewheel) {
          slider.bind('mousewheel', function (event, delta, deltaX, deltaY) {
            event.preventDefault();
            var target = delta < 0 ? slider.getTarget('next') : slider.getTarget('prev');
            slider.flexAnimate(target, slider.vars.pauseOnAction);
          });
        } // PAUSEPLAY


        if (slider.vars.pausePlay) {
          methods.pausePlay.setup();
        } //PAUSE WHEN INVISIBLE


        if (slider.vars.slideshow && slider.vars.pauseInvisible) {
          methods.pauseInvisible.init();
        } // SLIDSESHOW


        if (slider.vars.slideshow) {
          if (slider.vars.pauseOnHover) {
            slider.hover(function () {
              if (!slider.manualPlay && !slider.manualPause) {
                slider.pause();
              }
            }, function () {
              if (!slider.manualPause && !slider.manualPlay && !slider.stopped) {
                slider.play();
              }
            });
          } // initialize animation
          //If we're visible, or we don't use PageVisibility API


          if (!slider.vars.pauseInvisible || !methods.pauseInvisible.isHidden()) {
            slider.vars.initDelay > 0 ? slider.startTimeout = setTimeout(slider.play, slider.vars.initDelay) : slider.play();
          }
        } // ASNAV:


        if (asNav) {
          methods.asNav.setup();
        } // TOUCH


        if (touch && slider.vars.touch) {
          methods.touch();
        } // FADE&&SMOOTHHEIGHT || SLIDE:


        if (!fade || fade && slider.vars.smoothHeight) {
          $(window).bind("resize orientationchange focus", methods.resize);
        }

        slider.find("img").attr("draggable", "false"); // API: start() Callback

        setTimeout(function () {
          slider.vars.start(slider);
        }, 200);
      },
      asNav: {
        setup: function setup() {
          slider.asNav = true;
          slider.animatingTo = Math.floor(slider.currentSlide / slider.move);
          slider.currentItem = slider.currentSlide;
          slider.slides.removeClass(namespace + "active-slide").eq(slider.currentItem).addClass(namespace + "active-slide");

          if (!msGesture) {
            slider.slides.on(eventType, function (e) {
              e.preventDefault();
              var $slide = $(this),
                  target = $slide.index();
              var posFromX;

              if (slider.vars.rtl) {
                posFromX = -1 * ($slide.offset().right - $(slider).scrollLeft()); // Find position of slide relative to right of slider container
              } else {
                posFromX = $slide.offset().left - $(slider).scrollLeft(); // Find position of slide relative to left of slider container
              }

              if (posFromX <= 0 && $slide.hasClass(namespace + 'active-slide')) {
                slider.flexAnimate(slider.getTarget("prev"), true);
              } else if (!$(slider.vars.asNavFor).data('flexslider').animating && !$slide.hasClass(namespace + "active-slide")) {
                slider.direction = slider.currentItem < target ? "next" : "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction, false, true, true);
              }
            });
          } else {
            el._slider = slider;
            slider.slides.each(function () {
              var that = this;
              that._gesture = new MSGesture();
              that._gesture.target = that;
              that.addEventListener("MSPointerDown", function (e) {
                e.preventDefault();

                if (e.currentTarget._gesture) {
                  e.currentTarget._gesture.addPointer(e.pointerId);
                }
              }, false);
              that.addEventListener("MSGestureTap", function (e) {
                e.preventDefault();
                var $slide = $(this),
                    target = $slide.index();

                if (!$(slider.vars.asNavFor).data('flexslider').animating && !$slide.hasClass('active')) {
                  slider.direction = slider.currentItem < target ? "next" : "prev";
                  slider.flexAnimate(target, slider.vars.pauseOnAction, false, true, true);
                }
              });
            });
          }
        }
      },
      controlNav: {
        setup: function setup() {
          if (!slider.manualControls) {
            methods.controlNav.setupPaging();
          } else {
            // MANUALCONTROLS:
            methods.controlNav.setupManual();
          }
        },
        setupPaging: function setupPaging() {
          var type = slider.vars.controlNav === "thumbnails" ? 'control-thumbs' : 'control-paging',
              j = 1,
              item,
              slide;
          slider.controlNavScaffold = $('<ol class="' + namespace + 'control-nav ' + namespace + type + '"></ol>');

          if (slider.pagingCount > 1) {
            for (var i = 0; i < slider.pagingCount; i++) {
              slide = slider.slides.eq(i);

              if (undefined === slide.attr('data-thumb-alt')) {
                slide.attr('data-thumb-alt', '');
              }

              item = $('<a></a>').attr('href', '#').text(j);

              if (slider.vars.controlNav === "thumbnails") {
                item = $('<img/>').attr('src', slide.attr('data-thumb'));
              }

              if ('' !== slide.attr('data-thumb-alt')) {
                item.attr('alt', slide.attr('data-thumb-alt'));
              }

              if ('thumbnails' === slider.vars.controlNav && true === slider.vars.thumbCaptions) {
                var captn = slide.attr('data-thumbcaption');

                if ('' !== captn && undefined !== captn) {
                  var caption = $('<span></span>').addClass(namespace + 'caption').text(captn);
                  item.append(caption);
                }
              }

              var liElement = $('<li>');
              item.appendTo(liElement);
              liElement.append('</li>');
              slider.controlNavScaffold.append(liElement);
              j++;
            }
          } // CONTROLSCONTAINER:


          slider.controlsContainer ? $(slider.controlsContainer).append(slider.controlNavScaffold) : slider.append(slider.controlNavScaffold);
          methods.controlNav.set();
          methods.controlNav.active();
          slider.controlNavScaffold.delegate('a, img', eventType, function (event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              var $this = $(this),
                  target = slider.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                slider.direction = target > slider.currentSlide ? "next" : "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              }
            } // setup flags to prevent event duplication


            if (watchedEvent === "") {
              watchedEvent = event.type;
            }

            methods.setToClearWatchedEvent();
          });
        },
        setupManual: function setupManual() {
          slider.controlNav = slider.manualControls;
          methods.controlNav.active();
          slider.controlNav.bind(eventType, function (event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              var $this = $(this),
                  target = slider.controlNav.index($this);

              if (!$this.hasClass(namespace + 'active')) {
                target > slider.currentSlide ? slider.direction = "next" : slider.direction = "prev";
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              }
            } // setup flags to prevent event duplication


            if (watchedEvent === "") {
              watchedEvent = event.type;
            }

            methods.setToClearWatchedEvent();
          });
        },
        set: function set() {
          var selector = slider.vars.controlNav === "thumbnails" ? 'img' : 'a';
          slider.controlNav = $('.' + namespace + 'control-nav li ' + selector, slider.controlsContainer ? slider.controlsContainer : slider);
        },
        active: function active() {
          slider.controlNav.removeClass(namespace + "active").eq(slider.animatingTo).addClass(namespace + "active");
        },
        update: function update(action, pos) {
          if (slider.pagingCount > 1 && action === "add") {
            slider.controlNavScaffold.append($('<li><a href="#">' + slider.count + '</a></li>'));
          } else if (slider.pagingCount === 1) {
            slider.controlNavScaffold.find('li').remove();
          } else {
            slider.controlNav.eq(pos).closest('li').remove();
          }

          methods.controlNav.set();
          slider.pagingCount > 1 && slider.pagingCount !== slider.controlNav.length ? slider.update(pos, action) : methods.controlNav.active();
        }
      },
      directionNav: {
        setup: function setup() {
          var directionNavScaffold = $('<ul class="' + namespace + 'direction-nav"><li class="' + namespace + 'nav-prev"><a class="' + namespace + 'prev" href="#">' + slider.vars.prevText + '</a></li><li class="' + namespace + 'nav-next"><a class="' + namespace + 'next" href="#">' + slider.vars.nextText + '</a></li></ul>'); // CUSTOM DIRECTION NAV:

          if (slider.customDirectionNav) {
            slider.directionNav = slider.customDirectionNav; // CONTROLSCONTAINER:
          } else if (slider.controlsContainer) {
            $(slider.controlsContainer).append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider.controlsContainer);
          } else {
            slider.append(directionNavScaffold);
            slider.directionNav = $('.' + namespace + 'direction-nav li a', slider);
          }

          methods.directionNav.update();
          slider.directionNav.bind(eventType, function (event) {
            event.preventDefault();
            var target;

            if (watchedEvent === "" || watchedEvent === event.type) {
              target = $(this).hasClass(namespace + 'next') ? slider.getTarget('next') : slider.getTarget('prev');
              slider.flexAnimate(target, slider.vars.pauseOnAction);
            } // setup flags to prevent event duplication


            if (watchedEvent === "") {
              watchedEvent = event.type;
            }

            methods.setToClearWatchedEvent();
          });
        },
        update: function update() {
          var disabledClass = namespace + 'disabled';

          if (slider.pagingCount === 1) {
            slider.directionNav.addClass(disabledClass).attr('tabindex', '-1');
          } else if (!slider.vars.animationLoop) {
            if (slider.animatingTo === 0) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "prev").addClass(disabledClass).attr('tabindex', '-1');
            } else if (slider.animatingTo === slider.last) {
              slider.directionNav.removeClass(disabledClass).filter('.' + namespace + "next").addClass(disabledClass).attr('tabindex', '-1');
            } else {
              slider.directionNav.removeClass(disabledClass).removeAttr('tabindex');
            }
          } else {
            slider.directionNav.removeClass(disabledClass).removeAttr('tabindex');
          }
        }
      },
      pausePlay: {
        setup: function setup() {
          var pausePlayScaffold = $('<div class="' + namespace + 'pauseplay"><a href="#"></a></div>'); // CONTROLSCONTAINER:

          if (slider.controlsContainer) {
            slider.controlsContainer.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider.controlsContainer);
          } else {
            slider.append(pausePlayScaffold);
            slider.pausePlay = $('.' + namespace + 'pauseplay a', slider);
          }

          methods.pausePlay.update(slider.vars.slideshow ? namespace + 'pause' : namespace + 'play');
          slider.pausePlay.bind(eventType, function (event) {
            event.preventDefault();

            if (watchedEvent === "" || watchedEvent === event.type) {
              if ($(this).hasClass(namespace + 'pause')) {
                slider.manualPause = true;
                slider.manualPlay = false;
                slider.pause();
              } else {
                slider.manualPause = false;
                slider.manualPlay = true;
                slider.play();
              }
            } // setup flags to prevent event duplication


            if (watchedEvent === "") {
              watchedEvent = event.type;
            }

            methods.setToClearWatchedEvent();
          });
        },
        update: function update(state) {
          state === "play" ? slider.pausePlay.removeClass(namespace + 'pause').addClass(namespace + 'play').html(slider.vars.playText) : slider.pausePlay.removeClass(namespace + 'play').addClass(namespace + 'pause').html(slider.vars.pauseText);
        }
      },
      touch: function touch() {
        var startX,
            startY,
            offset,
            cwidth,
            dx,
            startT,
            onTouchStart,
            onTouchMove,
            _onTouchEnd,
            scrolling = false,
            localX = 0,
            localY = 0,
            accDx = 0;

        if (!msGesture) {
          onTouchStart = function onTouchStart(e) {
            if (slider.animating) {
              e.preventDefault();
            } else if (window.navigator.msPointerEnabled || e.touches.length === 1) {
              slider.pause(); // CAROUSEL:

              cwidth = vertical ? slider.h : slider.w;
              startT = Number(new Date()); // CAROUSEL:
              // Local vars for X and Y points.

              localX = e.touches[0].pageX;
              localY = e.touches[0].pageY;
              offset = carousel && reverse && slider.animatingTo === slider.last ? 0 : carousel && reverse ? slider.limit - (slider.itemW + slider.vars.itemMargin) * slider.move * slider.animatingTo : carousel && slider.currentSlide === slider.last ? slider.limit : carousel ? (slider.itemW + slider.vars.itemMargin) * slider.move * slider.currentSlide : reverse ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
              startX = vertical ? localY : localX;
              startY = vertical ? localX : localY;
              el.addEventListener('touchmove', onTouchMove, false);
              el.addEventListener('touchend', _onTouchEnd, false);
            }
          };

          onTouchMove = function onTouchMove(e) {
            // Local vars for X and Y points.
            localX = e.touches[0].pageX;
            localY = e.touches[0].pageY;
            dx = vertical ? startX - localY : (slider.vars.rtl ? -1 : 1) * (startX - localX);
            scrolling = vertical ? Math.abs(dx) < Math.abs(localX - startY) : Math.abs(dx) < Math.abs(localY - startY);
            var fxms = 500;

            if (!scrolling || Number(new Date()) - startT > fxms) {
              e.preventDefault();

              if (!fade && slider.transitions) {
                if (!slider.vars.animationLoop) {
                  dx = dx / (slider.currentSlide === 0 && dx < 0 || slider.currentSlide === slider.last && dx > 0 ? Math.abs(dx) / cwidth + 2 : 1);
                }

                slider.setProps(offset + dx, "setTouch");
              }
            }
          };

          _onTouchEnd = function onTouchEnd(e) {
            // finish the touch by undoing the touch session
            el.removeEventListener('touchmove', onTouchMove, false);

            if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
              var updateDx = reverse ? -dx : dx,
                  target = updateDx > 0 ? slider.getTarget('next') : slider.getTarget('prev');

              if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth / 2)) {
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              } else {
                if (!fade) {
                  slider.flexAnimate(slider.currentSlide, slider.vars.pauseOnAction, true);
                }
              }
            }

            el.removeEventListener('touchend', _onTouchEnd, false);
            startX = null;
            startY = null;
            dx = null;
            offset = null;
          };

          el.addEventListener('touchstart', onTouchStart, false);
        } else {
          var onMSPointerDown = function onMSPointerDown(e) {
            e.stopPropagation();

            if (slider.animating) {
              e.preventDefault();
            } else {
              slider.pause();

              el._gesture.addPointer(e.pointerId);

              accDx = 0;
              cwidth = vertical ? slider.h : slider.w;
              startT = Number(new Date()); // CAROUSEL:

              offset = carousel && reverse && slider.animatingTo === slider.last ? 0 : carousel && reverse ? slider.limit - (slider.itemW + slider.vars.itemMargin) * slider.move * slider.animatingTo : carousel && slider.currentSlide === slider.last ? slider.limit : carousel ? (slider.itemW + slider.vars.itemMargin) * slider.move * slider.currentSlide : reverse ? (slider.last - slider.currentSlide + slider.cloneOffset) * cwidth : (slider.currentSlide + slider.cloneOffset) * cwidth;
            }
          };

          var onMSGestureChange = function onMSGestureChange(e) {
            e.stopPropagation();
            var slider = e.target._slider;

            if (!slider) {
              return;
            }

            var transX = -e.translationX,
                transY = -e.translationY; //Accumulate translations.

            accDx = accDx + (vertical ? transY : transX);
            dx = (slider.vars.rtl ? -1 : 1) * accDx;
            scrolling = vertical ? Math.abs(accDx) < Math.abs(-transX) : Math.abs(accDx) < Math.abs(-transY);

            if (e.detail === e.MSGESTURE_FLAG_INERTIA) {
              setImmediate(function () {
                el._gesture.stop();
              });
              return;
            }

            if (!scrolling || Number(new Date()) - startT > 500) {
              e.preventDefault();

              if (!fade && slider.transitions) {
                if (!slider.vars.animationLoop) {
                  dx = accDx / (slider.currentSlide === 0 && accDx < 0 || slider.currentSlide === slider.last && accDx > 0 ? Math.abs(accDx) / cwidth + 2 : 1);
                }

                slider.setProps(offset + dx, "setTouch");
              }
            }
          };

          var onMSGestureEnd = function onMSGestureEnd(e) {
            e.stopPropagation();
            var slider = e.target._slider;

            if (!slider) {
              return;
            }

            if (slider.animatingTo === slider.currentSlide && !scrolling && !(dx === null)) {
              var updateDx = reverse ? -dx : dx,
                  target = updateDx > 0 ? slider.getTarget('next') : slider.getTarget('prev');

              if (slider.canAdvance(target) && (Number(new Date()) - startT < 550 && Math.abs(updateDx) > 50 || Math.abs(updateDx) > cwidth / 2)) {
                slider.flexAnimate(target, slider.vars.pauseOnAction);
              } else {
                if (!fade) {
                  slider.flexAnimate(slider.currentSlide, slider.vars.pauseOnAction, true);
                }
              }
            }

            startX = null;
            startY = null;
            dx = null;
            offset = null;
            accDx = 0;
          };

          el.style.msTouchAction = "none";
          el._gesture = new MSGesture();
          el._gesture.target = el;
          el.addEventListener("MSPointerDown", onMSPointerDown, false);
          el._slider = slider;
          el.addEventListener("MSGestureChange", onMSGestureChange, false);
          el.addEventListener("MSGestureEnd", onMSGestureEnd, false);
        }
      },
      resize: function resize() {
        if (!slider.animating && slider.is(':visible')) {
          if (!carousel) {
            slider.doMath();
          }

          if (fade) {
            // SMOOTH HEIGHT:
            methods.smoothHeight();
          } else if (carousel) {
            //CAROUSEL:
            slider.slides.width(slider.computedW);
            slider.update(slider.pagingCount);
            slider.setProps();
          } else if (vertical) {
            //VERTICAL:
            slider.viewport.height(slider.h);
            slider.setProps(slider.h, "setTotal");
          } else {
            // SMOOTH HEIGHT:
            if (slider.vars.smoothHeight) {
              methods.smoothHeight();
            }

            slider.newSlides.width(slider.computedW);
            slider.setProps(slider.computedW, "setTotal");
          }
        }
      },
      smoothHeight: function smoothHeight(dur) {
        if (!vertical || fade) {
          var $obj = fade ? slider : slider.viewport;
          dur ? $obj.animate({
            "height": slider.slides.eq(slider.animatingTo).innerHeight()
          }, dur) : $obj.innerHeight(slider.slides.eq(slider.animatingTo).innerHeight());
        }
      },
      sync: function sync(action) {
        var $obj = $(slider.vars.sync).data("flexslider"),
            target = slider.animatingTo;

        switch (action) {
          case "animate":
            $obj.flexAnimate(target, slider.vars.pauseOnAction, false, true);
            break;

          case "play":
            if (!$obj.playing && !$obj.asNav) {
              $obj.play();
            }

            break;

          case "pause":
            $obj.pause();
            break;
        }
      },
      uniqueID: function uniqueID($clone) {
        // Append _clone to current level and children elements with id attributes
        $clone.filter('[id]').add($clone.find('[id]')).each(function () {
          var $this = $(this);
          $this.attr('id', $this.attr('id') + '_clone');
        });
        return $clone;
      },
      pauseInvisible: {
        visProp: null,
        init: function init() {
          var visProp = methods.pauseInvisible.getHiddenProp();

          if (visProp) {
            var evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
            document.addEventListener(evtname, function () {
              if (methods.pauseInvisible.isHidden()) {
                if (slider.startTimeout) {
                  clearTimeout(slider.startTimeout); //If clock is ticking, stop timer and prevent from starting while invisible
                } else {
                  slider.pause(); //Or just pause
                }
              } else {
                if (slider.started) {
                  slider.play(); //Initiated before, just play
                } else {
                  if (slider.vars.initDelay > 0) {
                    setTimeout(slider.play, slider.vars.initDelay);
                  } else {
                    slider.play(); //Didn't init before: simply init or wait for it
                  }
                }
              }
            });
          }
        },
        isHidden: function isHidden() {
          var prop = methods.pauseInvisible.getHiddenProp();

          if (!prop) {
            return false;
          }

          return document[prop];
        },
        getHiddenProp: function getHiddenProp() {
          var prefixes = ['webkit', 'moz', 'ms', 'o']; // if 'hidden' is natively supported just return it

          if ('hidden' in document) {
            return 'hidden';
          } // otherwise loop over all the known prefixes until we find one


          for (var i = 0; i < prefixes.length; i++) {
            if (prefixes[i] + 'Hidden' in document) {
              return prefixes[i] + 'Hidden';
            }
          } // otherwise it's not supported


          return null;
        }
      },
      setToClearWatchedEvent: function setToClearWatchedEvent() {
        clearTimeout(watchedEventClearTimer);
        watchedEventClearTimer = setTimeout(function () {
          watchedEvent = "";
        }, 3000);
      }
    }; // public methods

    slider.flexAnimate = function (target, pause, override, withSync, fromNav) {
      if (!slider.vars.animationLoop && target !== slider.currentSlide) {
        slider.direction = target > slider.currentSlide ? "next" : "prev";
      }

      if (asNav && slider.pagingCount === 1) slider.direction = slider.currentItem < target ? "next" : "prev";

      if (!slider.animating && (slider.canAdvance(target, fromNav) || override) && slider.is(":visible")) {
        if (asNav && withSync) {
          var master = $(slider.vars.asNavFor).data('flexslider');
          slider.atEnd = target === 0 || target === slider.count - 1;
          master.flexAnimate(target, true, false, true, fromNav);
          slider.direction = slider.currentItem < target ? "next" : "prev";
          master.direction = slider.direction;

          if (Math.ceil((target + 1) / slider.visible) - 1 !== slider.currentSlide && target !== 0) {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            target = Math.floor(target / slider.visible);
          } else {
            slider.currentItem = target;
            slider.slides.removeClass(namespace + "active-slide").eq(target).addClass(namespace + "active-slide");
            return false;
          }
        }

        slider.animating = true;
        slider.animatingTo = target; // SLIDESHOW:

        if (pause) {
          slider.pause();
        } // API: before() animation Callback


        slider.vars.before(slider); // SYNC:

        if (slider.syncExists && !fromNav) {
          methods.sync("animate");
        } // CONTROLNAV


        if (slider.vars.controlNav) {
          methods.controlNav.active();
        } // !CAROUSEL:
        // CANDIDATE: slide active class (for add/remove slide)


        if (!carousel) {
          slider.slides.removeClass(namespace + 'active-slide').eq(target).addClass(namespace + 'active-slide');
        } // INFINITE LOOP:
        // CANDIDATE: atEnd


        slider.atEnd = target === 0 || target === slider.last; // DIRECTIONNAV:

        if (slider.vars.directionNav) {
          methods.directionNav.update();
        }

        if (target === slider.last) {
          // API: end() of cycle Callback
          slider.vars.end(slider); // SLIDESHOW && !INFINITE LOOP:

          if (!slider.vars.animationLoop) {
            slider.pause();
          }
        } // SLIDE:


        if (!fade) {
          var dimension = vertical ? slider.slides.filter(':first').height() : slider.computedW,
              margin,
              slideString,
              calcNext; // INFINITE LOOP / REVERSE:

          if (carousel) {
            margin = slider.vars.itemMargin;
            calcNext = (slider.itemW + margin) * slider.move * slider.animatingTo;
            slideString = calcNext > slider.limit && slider.visible !== 1 ? slider.limit : calcNext;
          } else if (slider.currentSlide === 0 && target === slider.count - 1 && slider.vars.animationLoop && slider.direction !== "next") {
            slideString = reverse ? (slider.count + slider.cloneOffset) * dimension : 0;
          } else if (slider.currentSlide === slider.last && target === 0 && slider.vars.animationLoop && slider.direction !== "prev") {
            slideString = reverse ? 0 : (slider.count + 1) * dimension;
          } else {
            slideString = reverse ? (slider.count - 1 - target + slider.cloneOffset) * dimension : (target + slider.cloneOffset) * dimension;
          }

          slider.setProps(slideString, "", slider.vars.animationSpeed);

          if (slider.transitions) {
            if (!slider.vars.animationLoop || !slider.atEnd) {
              slider.animating = false;
              slider.currentSlide = slider.animatingTo;
            } // Unbind previous transitionEnd events and re-bind new transitionEnd event


            slider.container.unbind("webkitTransitionEnd transitionend");
            slider.container.bind("webkitTransitionEnd transitionend", function () {
              clearTimeout(slider.ensureAnimationEnd);
              slider.wrapup(dimension);
            }); // Insurance for the ever-so-fickle transitionEnd event

            clearTimeout(slider.ensureAnimationEnd);
            slider.ensureAnimationEnd = setTimeout(function () {
              slider.wrapup(dimension);
            }, slider.vars.animationSpeed + 100);
          } else {
            slider.container.animate(slider.args, slider.vars.animationSpeed, slider.vars.easing, function () {
              slider.wrapup(dimension);
            });
          }
        } else {
          // FADE:
          if (!touch) {
            slider.slides.eq(slider.currentSlide).css({
              "zIndex": 1
            }).animate({
              "opacity": 0
            }, slider.vars.animationSpeed, slider.vars.easing);
            slider.slides.eq(target).css({
              "zIndex": 2
            }).animate({
              "opacity": 1
            }, slider.vars.animationSpeed, slider.vars.easing, slider.wrapup);
          } else {
            slider.slides.eq(slider.currentSlide).css({
              "opacity": 0,
              "zIndex": 1
            });
            slider.slides.eq(target).css({
              "opacity": 1,
              "zIndex": 2
            });
            slider.wrapup(dimension);
          }
        } // SMOOTH HEIGHT:


        if (slider.vars.smoothHeight) {
          methods.smoothHeight(slider.vars.animationSpeed);
        }
      }
    };

    slider.wrapup = function (dimension) {
      // SLIDE:
      if (!fade && !carousel) {
        if (slider.currentSlide === 0 && slider.animatingTo === slider.last && slider.vars.animationLoop) {
          slider.setProps(dimension, "jumpEnd");
        } else if (slider.currentSlide === slider.last && slider.animatingTo === 0 && slider.vars.animationLoop) {
          slider.setProps(dimension, "jumpStart");
        }
      }

      slider.animating = false;
      slider.currentSlide = slider.animatingTo; // API: after() animation Callback

      slider.vars.after(slider);
    }; // SLIDESHOW:


    slider.animateSlides = function () {
      if (!slider.animating && focused) {
        slider.flexAnimate(slider.getTarget("next"));
      }
    }; // SLIDESHOW:


    slider.pause = function () {
      clearInterval(slider.animatedSlides);
      slider.animatedSlides = null;
      slider.playing = false; // PAUSEPLAY:

      if (slider.vars.pausePlay) {
        methods.pausePlay.update("play");
      } // SYNC:


      if (slider.syncExists) {
        methods.sync("pause");
      }
    }; // SLIDESHOW:


    slider.play = function () {
      if (slider.playing) {
        clearInterval(slider.animatedSlides);
      }

      slider.animatedSlides = slider.animatedSlides || setInterval(slider.animateSlides, slider.vars.slideshowSpeed);
      slider.started = slider.playing = true; // PAUSEPLAY:

      if (slider.vars.pausePlay) {
        methods.pausePlay.update("pause");
      } // SYNC:


      if (slider.syncExists) {
        methods.sync("play");
      }
    }; // STOP:


    slider.stop = function () {
      slider.pause();
      slider.stopped = true;
    };

    slider.canAdvance = function (target, fromNav) {
      // ASNAV:
      var last = asNav ? slider.pagingCount - 1 : slider.last;
      return fromNav ? true : asNav && slider.currentItem === slider.count - 1 && target === 0 && slider.direction === "prev" ? true : asNav && slider.currentItem === 0 && target === slider.pagingCount - 1 && slider.direction !== "next" ? false : target === slider.currentSlide && !asNav ? false : slider.vars.animationLoop ? true : slider.atEnd && slider.currentSlide === 0 && target === last && slider.direction !== "next" ? false : slider.atEnd && slider.currentSlide === last && target === 0 && slider.direction === "next" ? false : true;
    };

    slider.getTarget = function (dir) {
      slider.direction = dir;

      if (dir === "next") {
        return slider.currentSlide === slider.last ? 0 : slider.currentSlide + 1;
      } else {
        return slider.currentSlide === 0 ? slider.last : slider.currentSlide - 1;
      }
    }; // SLIDE:


    slider.setProps = function (pos, special, dur) {
      var target = function () {
        var posCheck = pos ? pos : (slider.itemW + slider.vars.itemMargin) * slider.move * slider.animatingTo,
            posCalc = function () {
          if (carousel) {
            return special === "setTouch" ? pos : reverse && slider.animatingTo === slider.last ? 0 : reverse ? slider.limit - (slider.itemW + slider.vars.itemMargin) * slider.move * slider.animatingTo : slider.animatingTo === slider.last ? slider.limit : posCheck;
          } else {
            switch (special) {
              case "setTotal":
                return reverse ? (slider.count - 1 - slider.currentSlide + slider.cloneOffset) * pos : (slider.currentSlide + slider.cloneOffset) * pos;

              case "setTouch":
                return reverse ? pos : pos;

              case "jumpEnd":
                return reverse ? pos : slider.count * pos;

              case "jumpStart":
                return reverse ? slider.count * pos : pos;

              default:
                return pos;
            }
          }
        }();

        return posCalc * (slider.vars.rtl ? 1 : -1) + "px";
      }();

      if (slider.transitions) {
        if (slider.isFirefox) {
          target = vertical ? "translate3d(0," + target + ",0)" : "translate3d(" + (parseInt(target) + 'px') + ",0,0)";
        } else {
          target = vertical ? "translate3d(0," + target + ",0)" : "translate3d(" + ((slider.vars.rtl ? -1 : 1) * parseInt(target) + 'px') + ",0,0)";
        }

        dur = dur !== undefined ? dur / 1000 + "s" : "0s";
        slider.container.css("-" + slider.pfx + "-transition-duration", dur);
        slider.container.css("transition-duration", dur);
      }

      slider.args[slider.prop] = target;

      if (slider.transitions || dur === undefined) {
        slider.container.css(slider.args);
      }

      slider.container.css('transform', target);
    };

    slider.setup = function (type) {
      // SLIDE:
      if (!fade) {
        var sliderOffset, arr;

        if (type === "init") {
          slider.viewport = $('<div class="' + namespace + 'viewport"></div>').css({
            "overflow": "hidden",
            "position": "relative"
          }).appendTo(slider).append(slider.container); // INFINITE LOOP:

          slider.cloneCount = 0;
          slider.cloneOffset = 0; // REVERSE:

          if (reverse) {
            arr = $.makeArray(slider.slides).reverse();
            slider.slides = $(arr);
            slider.container.empty().append(slider.slides);
          }
        } // INFINITE LOOP && !CAROUSEL:


        if (slider.vars.animationLoop && !carousel) {
          slider.cloneCount = 2;
          slider.cloneOffset = 1; // clear out old clones

          if (type !== "init") {
            slider.container.find('.clone').remove();
          }

          slider.container.append(methods.uniqueID(slider.slides.first().clone().addClass('clone')).attr('aria-hidden', 'true')).prepend(methods.uniqueID(slider.slides.last().clone().addClass('clone')).attr('aria-hidden', 'true'));
        }

        slider.newSlides = $(slider.vars.selector, slider);
        sliderOffset = reverse ? slider.count - 1 - slider.currentSlide + slider.cloneOffset : slider.currentSlide + slider.cloneOffset; // VERTICAL:

        if (vertical && !carousel) {
          slider.container.height((slider.count + slider.cloneCount) * 200 + "%").css("position", "absolute").width("100%");
          setTimeout(function () {
            slider.newSlides.css({
              "display": "block"
            });
            slider.doMath();
            slider.viewport.height(slider.h);
            slider.setProps(sliderOffset * slider.h, "init");
          }, type === "init" ? 100 : 0);
        } else {
          slider.container.width((slider.count + slider.cloneCount) * 200 + "%");
          slider.setProps(sliderOffset * slider.computedW, "init");
          setTimeout(function () {
            slider.doMath();

            if (slider.vars.rtl) {
              if (slider.isFirefox) {
                slider.newSlides.css({
                  "width": slider.computedW,
                  "marginRight": slider.computedM,
                  "float": "right",
                  "display": "block"
                });
              } else {
                slider.newSlides.css({
                  "width": slider.computedW,
                  "marginRight": slider.computedM,
                  "float": "left",
                  "display": "block"
                });
              }
            } else {
              slider.newSlides.css({
                "width": slider.computedW,
                "marginRight": slider.computedM,
                "float": "left",
                "display": "block"
              });
            } // SMOOTH HEIGHT:


            if (slider.vars.smoothHeight) {
              methods.smoothHeight();
            }
          }, type === "init" ? 100 : 0);
        }
      } else {
        // FADE:
        if (slider.vars.rtl) {
          slider.slides.css({
            "width": "100%",
            "float": 'right',
            "marginLeft": "-100%",
            "position": "relative"
          });
        } else {
          slider.slides.css({
            "width": "100%",
            "float": 'left',
            "marginRight": "-100%",
            "position": "relative"
          });
        }

        if (type === "init") {
          if (!touch) {
            //slider.slides.eq(slider.currentSlide).fadeIn(slider.vars.animationSpeed, slider.vars.easing);
            if (slider.vars.fadeFirstSlide == false) {
              slider.slides.css({
                "opacity": 0,
                "display": "block",
                "zIndex": 1
              }).eq(slider.currentSlide).css({
                "zIndex": 2
              }).css({
                "opacity": 1
              });
            } else {
              slider.slides.css({
                "opacity": 0,
                "display": "block",
                "zIndex": 1
              }).eq(slider.currentSlide).css({
                "zIndex": 2
              }).animate({
                "opacity": 1
              }, slider.vars.animationSpeed, slider.vars.easing);
            }
          } else {
            slider.slides.css({
              "opacity": 0,
              "display": "block",
              "webkitTransition": "opacity " + slider.vars.animationSpeed / 1000 + "s ease",
              "zIndex": 1
            }).eq(slider.currentSlide).css({
              "opacity": 1,
              "zIndex": 2
            });
          }
        } // SMOOTH HEIGHT:


        if (slider.vars.smoothHeight) {
          methods.smoothHeight();
        }
      } // !CAROUSEL:
      // CANDIDATE: active slide


      if (!carousel) {
        slider.slides.removeClass(namespace + "active-slide").eq(slider.currentSlide).addClass(namespace + "active-slide");
      } //FlexSlider: init() Callback


      slider.vars.init(slider);
    };

    slider.doMath = function () {
      var slide = slider.slides.first(),
          slideMargin = slider.vars.itemMargin,
          minItems = slider.vars.minItems,
          maxItems = slider.vars.maxItems;
      slider.w = slider.viewport === undefined ? slider.width() : slider.viewport.width();

      if (slider.isFirefox) {
        slider.w = slider.width();
      }

      slider.h = slide.height();
      slider.boxPadding = slide.outerWidth() - slide.width(); // CAROUSEL:

      if (carousel) {
        slider.itemT = slider.vars.itemWidth + slideMargin;
        slider.itemM = slideMargin;
        slider.minW = minItems ? minItems * slider.itemT : slider.w;
        slider.maxW = maxItems ? maxItems * slider.itemT - slideMargin : slider.w;
        slider.itemW = slider.minW > slider.w ? (slider.w - slideMargin * (minItems - 1)) / minItems : slider.maxW < slider.w ? (slider.w - slideMargin * (maxItems - 1)) / maxItems : slider.vars.itemWidth > slider.w ? slider.w : slider.vars.itemWidth;
        slider.visible = Math.floor(slider.w / slider.itemW);
        slider.move = slider.vars.move > 0 && slider.vars.move < slider.visible ? slider.vars.move : slider.visible;
        slider.pagingCount = Math.ceil((slider.count - slider.visible) / slider.move + 1);
        slider.last = slider.pagingCount - 1;
        slider.limit = slider.pagingCount === 1 ? 0 : slider.vars.itemWidth > slider.w ? slider.itemW * (slider.count - 1) + slideMargin * (slider.count - 1) : (slider.itemW + slideMargin) * slider.count - slider.w - slideMargin;
      } else {
        slider.itemW = slider.w;
        slider.itemM = slideMargin;
        slider.pagingCount = slider.count;
        slider.last = slider.count - 1;
      }

      slider.computedW = slider.itemW - slider.boxPadding;
      slider.computedM = slider.itemM;
    };

    slider.update = function (pos, action) {
      slider.doMath(); // update currentSlide and slider.animatingTo if necessary

      if (!carousel) {
        if (pos < slider.currentSlide) {
          slider.currentSlide += 1;
        } else if (pos <= slider.currentSlide && pos !== 0) {
          slider.currentSlide -= 1;
        }

        slider.animatingTo = slider.currentSlide;
      } // update controlNav


      if (slider.vars.controlNav && !slider.manualControls) {
        if (action === "add" && !carousel || slider.pagingCount > slider.controlNav.length) {
          methods.controlNav.update("add");
        } else if (action === "remove" && !carousel || slider.pagingCount < slider.controlNav.length) {
          if (carousel && slider.currentSlide > slider.last) {
            slider.currentSlide -= 1;
            slider.animatingTo -= 1;
          }

          methods.controlNav.update("remove", slider.last);
        }
      } // update directionNav


      if (slider.vars.directionNav) {
        methods.directionNav.update();
      }
    };

    slider.addSlide = function (obj, pos) {
      var $obj = $(obj);
      slider.count += 1;
      slider.last = slider.count - 1; // append new slide

      if (vertical && reverse) {
        pos !== undefined ? slider.slides.eq(slider.count - pos).after($obj) : slider.container.prepend($obj);
      } else {
        pos !== undefined ? slider.slides.eq(pos).before($obj) : slider.container.append($obj);
      } // update currentSlide, animatingTo, controlNav, and directionNav


      slider.update(pos, "add"); // update slider.slides

      slider.slides = $(slider.vars.selector + ':not(.clone)', slider); // re-setup the slider to accomdate new slide

      slider.setup(); //FlexSlider: added() Callback

      slider.vars.added(slider);
    };

    slider.removeSlide = function (obj) {
      var pos = isNaN(obj) ? slider.slides.index($(obj)) : obj; // update count

      slider.count -= 1;
      slider.last = slider.count - 1; // remove slide

      if (isNaN(obj)) {
        $(obj, slider.slides).remove();
      } else {
        vertical && reverse ? slider.slides.eq(slider.last).remove() : slider.slides.eq(obj).remove();
      } // update currentSlide, animatingTo, controlNav, and directionNav


      slider.doMath();
      slider.update(pos, "remove"); // update slider.slides

      slider.slides = $(slider.vars.selector + ':not(.clone)', slider); // re-setup the slider to accomdate new slide

      slider.setup(); // FlexSlider: removed() Callback

      slider.vars.removed(slider);
    }; //FlexSlider: Initialize


    methods.init();
  }; // Ensure the slider isn't focussed if the window loses focus.


  $(window).blur(function (e) {
    focused = false;
  }).focus(function (e) {
    focused = true;
  }); //FlexSlider: Default Settings

  $.flexslider.defaults = {
    namespace: "flex-",
    //{NEW} String: Prefix string attached to the class of every element generated by the plugin
    selector: ".slides > li",
    //{NEW} Selector: Must match a simple pattern. '{container} > {slide}' -- Ignore pattern at your own peril
    animation: "fade",
    //String: Select your animation type, "fade" or "slide"
    easing: "swing",
    //{NEW} String: Determines the easing method used in jQuery transitions. jQuery easing plugin is supported!
    direction: "horizontal",
    //String: Select the sliding direction, "horizontal" or "vertical"
    reverse: false,
    //{NEW} Boolean: Reverse the animation direction
    animationLoop: true,
    //Boolean: Should the animation loop? If false, directionNav will received "disable" classes at either end
    smoothHeight: false,
    //{NEW} Boolean: Allow height of the slider to animate smoothly in horizontal mode
    startAt: 0,
    //Integer: The slide that the slider should start on. Array notation (0 = first slide)
    slideshow: true,
    //Boolean: Animate slider automatically
    slideshowSpeed: 7000,
    //Integer: Set the speed of the slideshow cycling, in milliseconds
    animationSpeed: 600,
    //Integer: Set the speed of animations, in milliseconds
    initDelay: 0,
    //{NEW} Integer: Set an initialization delay, in milliseconds
    randomize: false,
    //Boolean: Randomize slide order
    fadeFirstSlide: true,
    //Boolean: Fade in the first slide when animation type is "fade"
    thumbCaptions: false,
    //Boolean: Whether or not to put captions on thumbnails when using the "thumbnails" controlNav.
    // Usability features
    pauseOnAction: true,
    //Boolean: Pause the slideshow when interacting with control elements, highly recommended.
    pauseOnHover: false,
    //Boolean: Pause the slideshow when hovering over slider, then resume when no longer hovering
    pauseInvisible: true,
    //{NEW} Boolean: Pause the slideshow when tab is invisible, resume when visible. Provides better UX, lower CPU usage.
    useCSS: true,
    //{NEW} Boolean: Slider will use CSS3 transitions if available
    touch: true,
    //{NEW} Boolean: Allow touch swipe navigation of the slider on touch-enabled devices
    video: false,
    //{NEW} Boolean: If using video in the slider, will prevent CSS3 3D Transforms to avoid graphical glitches
    // Primary Controls
    controlNav: true,
    //Boolean: Create navigation for paging control of each slide? Note: Leave true for manualControls usage
    directionNav: true,
    //Boolean: Create navigation for previous/next navigation? (true/false)
    prevText: "Previous",
    //String: Set the text for the "previous" directionNav item
    nextText: "Next",
    //String: Set the text for the "next" directionNav item
    // Secondary Navigation
    keyboard: true,
    //Boolean: Allow slider navigating via keyboard left/right keys
    multipleKeyboard: false,
    //{NEW} Boolean: Allow keyboard navigation to affect multiple sliders. Default behavior cuts out keyboard navigation with more than one slider present.
    mousewheel: false,
    //{UPDATED} Boolean: Requires jquery.mousewheel.js (https://github.com/brandonaaron/jquery-mousewheel) - Allows slider navigating via mousewheel
    pausePlay: false,
    //Boolean: Create pause/play dynamic element
    pauseText: "Pause",
    //String: Set the text for the "pause" pausePlay item
    playText: "Play",
    //String: Set the text for the "play" pausePlay item
    // Special properties
    controlsContainer: "",
    //{UPDATED} jQuery Object/Selector: Declare which container the navigation elements should be appended too. Default container is the FlexSlider element. Example use would be $(".flexslider-container"). Property is ignored if given element is not found.
    manualControls: "",
    //{UPDATED} jQuery Object/Selector: Declare custom control navigation. Examples would be $(".flex-control-nav li") or "#tabs-nav li img", etc. The number of elements in your controlNav should match the number of slides/tabs.
    customDirectionNav: "",
    //{NEW} jQuery Object/Selector: Custom prev / next button. Must be two jQuery elements. In order to make the events work they have to have the classes "prev" and "next" (plus namespace)
    sync: "",
    //{NEW} Selector: Mirror the actions performed on this slider with another slider. Use with care.
    asNavFor: "",
    //{NEW} Selector: Internal property exposed for turning the slider into a thumbnail navigation for another slider
    // Carousel Options
    itemWidth: 0,
    //{NEW} Integer: Box-model width of individual carousel items, including horizontal borders and padding.
    itemMargin: 0,
    //{NEW} Integer: Margin between carousel items.
    minItems: 1,
    //{NEW} Integer: Minimum number of carousel items that should be visible. Items will resize fluidly when below this.
    maxItems: 0,
    //{NEW} Integer: Maxmimum number of carousel items that should be visible. Items will resize fluidly when above this limit.
    move: 0,
    //{NEW} Integer: Number of carousel items that should move on animation. If 0, slider will move all visible items.
    allowOneSlide: true,
    //{NEW} Boolean: Whether or not to allow a slider comprised of a single slide
    // Browser Specific
    isFirefox: false,
    // {NEW} Boolean: Set to true when Firefox is the browser used.
    // Callback API
    start: function start() {},
    //Callback: function(slider) - Fires when the slider loads the first slide
    before: function before() {},
    //Callback: function(slider) - Fires asynchronously with each slider animation
    after: function after() {},
    //Callback: function(slider) - Fires after each slider animation completes
    end: function end() {},
    //Callback: function(slider) - Fires when the slider reaches the last slide (asynchronous)
    added: function added() {},
    //{NEW} Callback: function(slider) - Fires after a slide is added
    removed: function removed() {},
    //{NEW} Callback: function(slider) - Fires after a slide is removed
    init: function init() {},
    //{NEW} Callback: function(slider) - Fires after the slider is initially setup
    rtl: false //{NEW} Boolean: Whether or not to enable RTL mode

  }; //FlexSlider: Plugin Function

  $.fn.flexslider = function (options) {
    if (options === undefined) {
      options = {};
    }

    if (_typeof(options) === "object") {
      return this.each(function () {
        var $this = $(this),
            selector = options.selector ? options.selector : ".slides > li",
            $slides = $this.find(selector);

        if ($slides.length === 1 && options.allowOneSlide === false || $slides.length === 0) {
          $slides.fadeIn(400);

          if (options.start) {
            options.start($this);
          }
        } else if ($this.data('flexslider') === undefined) {
          new $.flexslider(this, options);
        }
      });
    } else {
      // Helper strings to quickly perform functions on the slider
      var $slider = $(this).data('flexslider');

      switch (options) {
        case "play":
          $slider.play();
          break;

        case "pause":
          $slider.pause();
          break;

        case "stop":
          $slider.stop();
          break;

        case "next":
          $slider.flexAnimate($slider.getTarget("next"), true);
          break;

        case "prev":
        case "previous":
          $slider.flexAnimate($slider.getTarget("prev"), true);
          break;

        default:
          if (typeof options === "number") {
            $slider.flexAnimate(options, true);
          }

      }
    }
  };
})(jQuery);
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* -------------------------------- 
Horizontal Timeline 2.0
by Studocwho @ yCodeTech
Version: 2.0.5-alpha.3.1
Original Horizontal Timeline by CodyHouse
Licensed under the MIT license	
Docs at http://horizontal-timeline.ycodetech.co.uk
-------------------------------- */
!function (e, t, n, s) {
  var a = "horizontalTimeline",
      l = {
    desktopDateIntervals: 200,
    tabletDateIntervals: 150,
    mobileDateIntervals: 120,
    minimalFirstDateInterval: !0,
    dateDisplay: "dateTime",
    dateOrder: "normal",
    autoplay: !1,
    autoplaySpeed: 8,
    autoplayPause_onHover: !1,
    useScrollWheel: !1,
    useTouchSwipe: !0,
    useKeyboardKeys: !1,
    addRequiredFile: !0,
    useFontAwesomeIcons: !0,
    useNavBtns: !0,
    useScrollBtns: !0,
    iconBaseClass: "fas fa-3x",
    scrollLeft_iconClass: "fa-chevron-circle-left",
    scrollRight_iconClass: "fa-chevron-circle-right",
    prev_iconClass: "fa-arrow-circle-left",
    next_iconClass: "fa-arrow-circle-right",
    pause_iconClass: "fa-pause-circle",
    play_iconClass: "fa-play-circle",
    animation_baseClass: "animationSpeed",
    enter_animationClass: {
      left: "enter-left",
      right: "enter-right"
    },
    exit_animationClass: {
      left: "exit-left",
      right: "exit-right"
    }
  };

  function r(t, i) {
    this.element = t, this.settings = e.extend({}, l, i), this._defaults = l, this._name = a, this.$element = e(t), this.init();
  }

  r.prototype.init = function () {
    var i = this;

    if (0 == this.$element.find("li").length && this.$element.css("opacity", 1).html("<h3>There are no events at this point in time.<br><br>Please add some content.</h3>"), 1 == this.settings.useFontAwesomeIcons) {
      this._addFile("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.8.2/css/all.min.css", "css");
    }

    this._create(), t.setTimeout(e.proxy(function () {
      var t,
          n = {};

      if (this._timelineComponents(n), this.init.addIdsAndClasses = function (e) {
        e._timelineComponents(n), 1 == n.eventsContentList.length ? (n.eventsContentList.first().attr("id", "first"), n.timelineEvents.first().addClass("first")) : (n.eventsContentList.addClass(e.settings.animation_baseClass).first().attr("id", "first").end().last().attr("id", "last"), n.timelineEvents.first().addClass("first").end().last().addClass("last"));
      }, this.init.addIdsAndClasses(this), n.eventsContentList.hasClass("selected")) {
        var s = this._timelineData(n.eventsContentSelected, "date");

        (l = n.eventsWrapper.find("a").filter(e.proxy(function (t, i) {
          if (this._timelineData(e(i), "date") == s) return e(i);
        }, this))).addClass("selected"), this._updateOlderEvents(l);
      } else if ("normal" == this.settings.dateOrder) {
        n.eventsWrapper.find("a.first").addClass("selected");

        var a = n.eventsWrapper.find("a.selected"),
            l = this._timelineData(a, "date");

        n.eventsContent.find("li").filter(e.proxy(function (t, i) {
          this._timelineData(e(i), "date") == l && e(i).addClass("selected");
        }, this));
      } else if ("reverse" == this.settings.dateOrder) {
        n.eventsWrapper.find("a.last").addClass("selected");
        a = n.eventsWrapper.find("a.selected"), l = this._timelineData(a, "date");
        n.eventsContent.find("li").filter(e.proxy(function (t, i) {
          this._timelineData(e(i), "date") == l && e(i).addClass("selected");
        }, this)), this._updateOlderEvents(a);
      }

      this._setDatePosition(n), t = this._setTimelineWidth(n), this._updateFilling(n.eventsWrapper.find("a.selected"), n.fillingLine, t), this.$element.addClass("loaded"), this._setup(i, n, t);
    }, this), 300);
  }, r.prototype._create = function () {
    var t = '<div class="events-wrapper"><div class="events"><span class="filling-line" aria-hidden="true"></span></div></div>',
        i = '<a href="" class="' + this.settings.iconBaseClass + " " + this.settings.scrollLeft_iconClass + ' scroll-left inactive"></a>',
        n = '<a href="" class="' + this.settings.iconBaseClass + " " + this.settings.prev_iconClass + ' prev inactive"></a>',
        s = '<a href="" class="' + this.settings.iconBaseClass + " " + this.settings.next_iconClass + ' next"></a>',
        a = '<a href="" class="' + this.settings.iconBaseClass + " " + this.settings.scrollRight_iconClass + ' scroll-right"></a>',
        l = '<a href="" class="' + this.settings.iconBaseClass + " " + this.settings.pause_iconClass + ' pause"></a>';
    this.$element.prepend('<div class="timeline"></div>');
    var r = this.$element.find(".timeline");
    1 == this.settings.useNavBtns || 1 == this.settings.useScrollBtns ? (r.append('<div class="timeline-navigation" id="leftNav"></div>').append(t).append('<div class="timeline-navigation" id="rightNav"></div>'), 0 == this.settings.useNavBtns && 1 == this.settings.useScrollBtns ? r.find("#leftNav").append(i).end().find("#rightNav").append(a) : 1 == this.settings.useNavBtns && 0 == this.settings.useScrollBtns ? r.find("#leftNav").append(n).end().find("#rightNav").append(s) : 1 == this.settings.useNavBtns && 1 == this.settings.useScrollBtns && r.find("#leftNav").append(i).append(n).end().find("#rightNav").append(s).append(a)) : (r.append(t), r.find(".events-wrapper").css("min-width", "100%")), 1 == this.settings.autoplay && r.append('<div class="timeline-navigation" id="pausePlay"></div>').find("#pausePlay").append(l), this._create.date = function (t, i, n) {
      if ("normal" == t.settings.dateOrder) var s = t.$element.children(".events-content").find("li");else if ("reverse" == t.settings.dateOrder) var s = e(t.$element.children(".events-content").find("li").get().reverse());
      "dateTime" == t.settings.dateDisplay ? s.each(function () {
        t._create.eventDateDisplay(t, e(this), "dateTime", i, n);
      }) : "date" == t.settings.dateDisplay ? s.each(function () {
        t._create.eventDateDisplay(t, e(this), "date", i, n);
      }) : "time" == t.settings.dateDisplay ? s.each(function () {
        t._create.eventDateDisplay(t, e(this), "time", i, n);
      }) : "dayMonth" == t.settings.dateDisplay ? s.each(function () {
        t._create.eventDateDisplay(t, e(this), "dayMonth", i, n);
      }) : "monthYear" == t.settings.dateDisplay ? s.each(function () {
        t._create.eventDateDisplay(t, e(this), "monthYear", i, n);
      }) : "year" == t.settings.dateDisplay && s.each(function () {
        t._create.eventDateDisplay(t, e(this), "year", i, n);
      });
    }, this._create.eventDateDisplay = function (t, i, n, s, a) {
      var l = t._timelineData(i, "date"),
          r = l.includes("T"),
          o = !r && l.includes(":"),
          d = "dateTime" == n,
          p = "date" == n,
          h = "time" == n,
          f = "dayMonth" == n,
          u = "monthYear" == n,
          c = "year" == n,
          m = t.$element.find(".events"),
          v = '<a href="" data-horizontal-timeline=\'{"date": "' + l + "\"}'>";

      if (void 0 !== a || null != a) var _ = m.find("a").filter(function () {
        var i = t._timelineData(e(this), "date");

        if (i == a) return e(this);
      });

      function g(e) {
        if (e > 3 && e < 21) return "th";

        switch (e % 10) {
          case 1:
            return "st";

          case 2:
            return "nd";

          case 3:
            return "rd";

          default:
            return "th";
        }
      }

      function y(e) {
        return [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][e];
      }

      var C = m.children("a").map(function () {
        if (e(this).data("horizontal-timeline")) {
          var t = e(this).data("horizontal-timeline");
          return t.date;
        }

        var i = e(this).data("date");
        return i;
      }).get();
      if (-1 == jQuery.inArray(l, C)) if (r) {
        var b = l.split("T"),
            w = b[0],
            x = b[1],
            D = w.split("/"),
            W = D[0].replace(/^0+/, ""),
            T = D[1].replace(/^0+/, ""),
            O = D[2],
            N = t._timelineData(i, "customDisplay");

        void 0 !== N ? "append" == s ? m.append(v + N + "</a>") : "after" == s ? _.after(v + N + "</a>") : _.before(v + N + "</a>") : d ? "append" == s ? m.append(v + w + "<br>" + x + "</a>") : "after" == s ? _.after(v + w + "<br>" + x + "</a>") : _.before(v + w + "<br>" + x + "</a>") : p ? "append" == s ? m.append(v + w + "</a>") : "after" == s ? _.after(v + w + "</a>") : _.before(v + w + "</a>") : h ? "append" == s ? m.append(v + x + "</a>") : "after" == s ? _.after(v + x + "</a>") : _.before(v + x + "</a>") : f ? "append" == s ? m.append(v + W + g(W) + "<br>" + y(T) + "</a>") : "after" == s ? _.after(v + W + g(W) + "<br>" + y(T) + "</a>") : _.before(v + W + g(W) + "<br>" + y(T) + "</a>") : u ? "append" == s ? m.append(v + y(T) + "<br>" + O + "</a>") : "after" == s ? _.after(v + y(T) + "<br>" + O + "</a>") : _.before(v + y(T) + "<br>" + O + "</a>") : c && ("append" == s ? m.append(v + O + "</a>") : "after" == s ? _.after(v + O + "</a>") : _.before(v + O + "</a>"));
      } else if (o) {
        var x = l,
            N = t._timelineData(i, "customDisplay");

        void 0 !== N ? "append" == s ? m.append(v + N + "</a>") : "after" == s ? _.after(v + N + "</a>") : _.before(v + N + "</a>") : (d || h) && ("append" == s ? m.append(v + x + "</a>") : "after" == s ? _.after(v + x + "</a>") : _.before(v + x + "</a>"));
      } else {
        var w = l,
            D = w.split("/"),
            W = D[0].replace(/^0+/, ""),
            T = D[1].replace(/^0+/, ""),
            O = D[2],
            N = t._timelineData(i, "customDisplay");

        void 0 !== N ? "append" == s ? m.append(v + N + "</a>") : "after" == s ? _.after(v + N + "</a>") : _.before(v + N + "</a>") : d || p ? "append" == s ? m.append(v + w + "</a>") : "after" == s ? _.after(v + w + "</a>") : _.before(v + w + "</a>") : f ? "append" == s ? m.append(v + W + g(W) + "<br>" + y(T) + "</a>") : "after" == s ? _.after(v + W + g(W) + "<br>" + y(T) + "</a>") : _.before(v + W + g(W) + "<br>" + y(T) + "</a>") : u ? "append" == s ? m.append(v + y(T) + "<br>" + O + "</a>") : "after" == s ? _.after(v + y(T) + "<br>" + O + "</a>") : _.before(v + y(T) + "<br>" + O + "</a>") : c && ("append" == s ? m.append(v + O + "</a>") : "after" == s ? _.after(v + O + "</a>") : _.before(v + O + "</a>"));
      }
    }, this._create.date(this, "append");
  }, r.prototype._timelineComponents = function (e) {
    e.eventsContent = this.$element.children(".events-content"), e.eventsContentList = e.eventsContent.find("li"), e.eventsContentSelected = e.eventsContent.find("li.selected"), e.timelineWrapper = e.eventsContent.parent().find(".events-wrapper"), e.eventsWrapper = e.timelineWrapper.children(".events"), e.fillingLine = e.eventsWrapper.children(".filling-line"), e.timelineEvents = e.eventsWrapper.find("a"), e.timelineNavigation = e.timelineWrapper.siblings(".timeline-navigation");
  }, r.prototype._setup = function (i, s, a) {
    var l,
        r,
        o,
        d,
        p = this.$element.attr("id");

    if (this._setup.mobileResizeFix = function (i) {
      var n = this.$element.data("plugin_" + this._name).windowWidth,
          s = e(t).width();
      s !== n && this.refresh(), this.$element.data("plugin_" + this._name).windowWidth = s;
    }, e(t).on("resize." + this._name + "_" + p, (l = e.proxy(this._setup.mobileResizeFix, this), r = 250, function () {
      var e = this,
          t = arguments,
          i = o && !d;
      clearTimeout(d), d = setTimeout(function () {
        d = null, o || l.apply(e, t);
      }, r), i && l.apply(e, t);
    })), this.$element.on("click." + this._name, ".timeline-navigation .inactive", function (e) {
      return e.stopImmediatePropagation(), !1;
    }).on("click." + this._name, ".timeline-navigation a", e.proxy(function () {
      event.preventDefault();
      var t = e(event.target);
      this._timelineComponents(s), a = this._setTimelineWidth(s), t.is(".next") && this._showNewContent(s, a, "next"), t.is(".prev") && this._showNewContent(s, a, "prev"), t.is(".scroll-right") && this._updateSlide(s, a, "right"), t.is(".scroll-left") && this._updateSlide(s, a, "left");
    }, this)).on("click." + this._name, ".events a", e.proxy(function () {
      event.preventDefault();
      var t = e(event.target);
      this._timelineComponents(s), this.$element.find(".events").find("a").removeClass("selected"), t.addClass("selected"), this._updateOlderEvents(t), a = this._setTimelineWidth(s), this._updateFilling(t, s.fillingLine, a), this._updateVisibleContent(t, s.eventsContent), this._updateTimelinePosition(t, s, a);
    }, this)), 1 == this.settings.autoplay) {
      var h = s.timelineNavigation.find(".pause")[0];

      if (s.eventsContent.prepend('<div class="progressBarWrapper"><div class="progressBar"></div></div>'), this._setup.autoplay = function (t) {
        var i,
            n,
            a,
            l,
            r,
            o = Number(t.settings.autoplaySpeed);
        t.$element.find("#pausePlay");

        function d() {
          if (i = t.$element.data("plugin_" + t._name).autoplay.isPaused, this._timelineComponents(s), !1 === i && this._elementInViewport(this.element)) {
            var e = this._checkMQ();

            a += "tinyMobile" == e || "mobile" == e ? 3 / o : 1 / o, this.$element.find(".progressBar").css({
              width: a + "%"
            }), l = s.eventsWrapper.find(".selected").index(), a >= 100 && ("normal" == this.settings.dateOrder && l == this._setup.autoplay.countEvents() || "reverse" == this.settings.dateOrder && 1 == l ? (this._showNewContent(s, r, "start"), l = s.eventsWrapper.find(".selected").index()) : "normal" == this.settings.dateOrder ? this._showNewContent(s, r, "next") : "reverse" == this.settings.dateOrder && this._showNewContent(s, r, "prev"));
          }
        }

        t.$element.data("plugin_" + t._name).autoplay = {
          isPaused: !1,
          mouseEvent: !1
        }, t._timelineComponents(s), t._setup.autoplay.countEvents = function () {
          return s.timelineEvents.length;
        }, t._setup.autoplay.start = function (t) {
          a = 0, t._timelineComponents(s), r = t._setTimelineWidth(s), n = setInterval(e.proxy(d, t), 10);
        }, t._setup.autoplay.pause = function () {
          t.$element.data("plugin_" + t._name).autoplay.isPaused = !0;
        }, t._setup.autoplay.resume = function () {
          t.$element.data("plugin_" + t._name).autoplay.isPaused = !1;
        }, t._setup.autoplay.moved = function (e) {
          e._setup.autoplay.destroy(), e._setup.autoplay.start(e);
        }, t._setup.autoplay.changeButtons = function (e) {
          var t = e.data,
              i = t[0],
              n = t[1],
              s = t[2],
              a = this.$element.find("#pausePlay"),
              l = '<a href="" class="' + this.settings.iconBaseClass + " " + this.settings.play_iconClass + ' play"></a>';
          "click" == e.type && 1 == i ? (a.addClass("clicked"), this.$element.data("plugin_" + this._name).autoplay.mouseEvent = "click", a.html(l), this._setup.autoplay.pause(), console.log("Autoplay is " + s + ".")) : "click" != e.type || i || (a.removeClass("clicked"), this.$element.data("plugin_" + this._name).autoplay.mouseEvent = !1, a.html(n), this._setup.autoplay.resume(), console.log("Autoplay is " + s + "."));
          "mouseenter" != e.type || a.hasClass("clicked") ? "mouseleave" != e.type || a.hasClass("clicked") || (this.$element.data("plugin_" + this._name).autoplay.mouseEvent = !1, a.html(n), this._setup.autoplay.resume(), console.log("Autoplay is " + s + ".")) : (this.$element.data("plugin_" + this._name).autoplay.mouseEvent = "hover", a.html(l), this._setup.autoplay.pause(), console.log("Autoplay is " + s + "."));
        }, t._setup.autoplay.refresh = function (e) {
          e._timelineComponents(s), r = e._setTimelineWidth(s);
        }, t._setup.autoplay.destroy = function () {
          clearInterval(n);
        }, t._setup.autoplay.start(t);
      }, this._setup.autoplay(this), this.$element.on("click." + this._name, ".timeline-navigation .pause", [!0, h, "paused"], e.proxy(this._setup.autoplay.changeButtons, this)).on("click." + this._name, ".timeline-navigation .play", [!1, h, "playing"], e.proxy(this._setup.autoplay.changeButtons, this)), 1 == this.settings.autoplayPause_onHover) {
        var f = this._checkMQ();

        "smallTablet" != f && "tablet" != f && "desktop" != f || this.$element.on("mouseenter." + this._name, ".events-content", [!1, h, "paused"], e.proxy(this._setup.autoplay.changeButtons, this)).on("mouseleave." + this._name, ".events-content", [!1, h, "playing"], e.proxy(this._setup.autoplay.changeButtons, this));
      }
    }

    var u = e(".goto-horizontal-timeline");

    if (u.length > 0) {
      u.on("click." + this._name, function (t) {
        t.preventDefault();
        var i = {},
            n = e(t.target),
            s = n.attr("href"),
            a = "#" == s;

        if (a) {
          var l = "#" + n.parents(".horizontal-timeline").attr("id");
          r = e(l);
        } else var r = e(s);

        var o = r.data("plugin_horizontalTimeline").Timeline;

        o._timelineComponents(i);

        var d,
            p,
            h,
            f,
            u = n.data("gototimeline"),
            c = u.date,
            m = u.scrollspeed,
            v = u.scrolloffset,
            _ = u.scrolleasing,
            g = {
          speed: 500,
          offset: 0,
          easing: "linear"
        };
        void 0 !== u && (d = c, p = void 0 !== m ? m : g.speed, h = void 0 !== v ? v : g.offset, f = void 0 !== _ ? _ : g.easing);

        var y = i.eventsWrapper.find("a"),
            C = i.eventsWrapper.find("a").filter(function (t, i) {
          var n = o._timelineData(e(i), "date");

          if (n == d) return e(i);
        }),
            b = o._setTimelineWidth(i);

        a ? w(o) : e("html, body").stop().animate({
          scrollTop: r.offset().top - h
        }, p, f, function () {
          w(o);
        });

        function w(e) {
          C.hasClass("selected") || (y.removeClass("selected"), C.addClass("selected"), e._updateOlderEvents(C), e._updateFilling(C, i.fillingLine, b), e._updateVisibleContent(C, i.eventsContent)), e._updateTimelinePosition(C, i, b);
        }
      });
    }

    if (1 == this.settings.useScrollWheel) {
      var c = "https://cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.13/jquery.mousewheel.min.js";
      this._setup.mousewheel = function (e, t) {
        this._timelineComponents(s), a = this._setTimelineWidth(s), e.deltaY > 0 ? this._showNewContent(s, a, "prev") : this._showNewContent(s, a, "next");
        e.preventDefault();
      }, this._addFile(c, "js", e.proxy(function () {
        t.setTimeout(e.proxy(function () {
          this.$element.on("mousewheel." + this._name, ".events-content", e.proxy(this._setup.mousewheel, this));
        }, this), 300);
      }, this));
    }

    if (1 == this.settings.useTouchSwipe) {
      c = "https://cdnjs.cloudflare.com/ajax/libs/jquery.touchswipe/1.6.18/jquery.touchSwipe.min.js";
      this._setup.swipe = function (e, t) {
        e._timelineComponents(s), a = e._setTimelineWidth(s), e._showNewContent(s, a, t);
      }, this._addFile(c, "js", e.proxy(function () {
        t.setTimeout(e.proxy(function () {
          s.eventsContent.swipe({
            swipeRight: e.proxy(function (e, t, i, n, s) {
              this._setup.swipe(this, "prev");
            }, this),
            swipeLeft: e.proxy(function (e, t, i, n, s) {
              this._setup.swipe(this, "next");
            }, this),
            threshold: 75,
            preventDefaultEvents: !1
          }), s.timelineWrapper.swipe({
            swipeRight: e.proxy(function (e, t, i, n, l) {
              var r = this._getTranslateValue(s.eventsWrapper),
                  o = Number(s.timelineWrapper.width());

              this._translateTimeline(s, i + r, o - a);
            }, this),
            swipeLeft: e.proxy(function (e, t, i, n, l) {
              var r = this._getTranslateValue(s.eventsWrapper),
                  o = Number(s.timelineWrapper.width());

              this._translateTimeline(s, -i + r, o - a);
            }, this),
            threshold: 30,
            preventDefaultEvents: !1
          });
        }, this), 1e3);
      }, this)), s.timelineWrapper.addClass("touch-enabled").parent().siblings(".events-content").addClass("touch-enabled");
    }

    if (1 == this.settings.useKeyboardKeys) {
      this._setup.keyboardKeys = function (e) {
        this._timelineComponents(s), a = this._setTimelineWidth(s), "37" == e.which && this._elementInViewport(this.element) ? this._showNewContent(s, a, "prev") : "39" == e.which && this._elementInViewport(this.element) && this._showNewContent(s, a, "next");
      };

      p = this.$element.attr("id");
      e(n).on("keyup." + this._name + "_" + p, e.proxy(this._setup.keyboardKeys, this));
    }
  }, r.prototype._timelineData = function (e, t) {
    if (e.data("horizontal-timeline")) {
      var i = e.data("horizontal-timeline");
      if ("date" == t) return i.date;
      if ("customDisplay" == t) return i.customDisplay;
    } else {
      var n = e.data("date"),
          s = e.data("custom-display");
      if ("date" == t) return n;
      if ("customDisplay" == t) return s;
    }
  }, r.prototype.refresh = function () {
    var e = {};
    this._timelineComponents(e), e.eventsContent.find("#first").removeAttr("id").end().find("#last").removeAttr("id").end(), e.eventsWrapper.find(".first").removeClass("first").end().find(".last").removeClass("last").end(), this.init.addIdsAndClasses(this), this._setDatePosition(e), timelineTotalWidth = this._setTimelineWidth(e), this._updateFilling(e.eventsWrapper.find("a.selected"), e.fillingLine, timelineTotalWidth), 1 == this.settings.autoplay && this._setup.autoplay.refresh(this), console.log("refreshed #" + this.element.id);
  }, r.prototype.destroy = function () {
    var i = this.$element,
        s = i.attr("id"),
        l = i.data("plugin_" + this._name).originalEventsContent;
    1 == e(".horizontal-timeline .timeline").length && (e(".goto-horizontal-timeline").off("." + this._name), e("body").removeData("plugin_" + this._name + "_loadedFile")), i.removeClass("loaded").off("." + this._name, "**").find(".timeline").remove().end().find(".events-content").replaceWith(l).swipe("destroy"), i.find(".events-wrapper").removeClass("touch-enabled").swipe("destroy"), e(n).off("." + this._name + "_" + s), e(t).off("." + this._name + "_" + s), 1 == this.settings.autoplay && this._setup.autoplay.destroy(), i.removeData("plugin_" + a), console.log("destroyed #" + this.element.id);
  }, r.prototype.addEvent = function (t, i, n) {
    var s = {};

    this._timelineComponents(s);

    var a = t.split("date")[1].split('"')[2],
        l = s.eventsContent.find("li").filter(e.proxy(function (t, i) {
      if (this._timelineData(e(i), "date") == n) return e(i);
    }, this)),
        r = s.eventsWrapper.find("a.selected"),
        o = this.$element.data("plugin_" + this._name).existingDates;
    -1 == jQuery.inArray(a, o) && (o.push(a), "before" == i ? l.before(t) : "after" == i && l.after(t), this._create.date(this, i, n), this._updateOlderEvents(r), this.refresh());
  }, r.prototype.removeEvent = function (t) {
    var i = {};

    this._timelineComponents(i);

    var n,
        s = i.eventsWrapper.find("a").filter(e.proxy(function (i, n) {
      if (this._timelineData(e(n), "date") == t) return e(n);
    }, this)),
        a = i.eventsContent.find("li").filter(e.proxy(function (i, n) {
      if (this._timelineData(e(n), "date") == t) return e(n);
    }, this)),
        l = this.$element.data("plugin_" + this._name).existingDates,
        r = l.indexOf(t);
    i.timelineEvents.length > 1 ? (s.is(".selected") ? (a.removeClass(".selected"), s.next().length ? (n = s.next().addClass("selected"), a.next().addClass("selected")) : (n = s.prev().addClass("selected"), a.prev().addClass("selected"))) : n = i.eventsWrapper.find("a.selected"), this._updateOlderEvents(n), s.remove(), a.remove(), r > -1 && l.splice(r, 1), this.refresh()) : console.warn("Timeline must always have at least 1 event after initialisation, therefore it can't be removed. Please use the Destroy method instead.");
  }, r.prototype._updateSlide = function (e, t, i) {
    var n = this._getTranslateValue(e.eventsWrapper),
        s = Number(e.timelineWrapper.width());

    "right" == i ? this._translateTimeline(e, n - s, s - t) : this._translateTimeline(e, n + s);
  }, r.prototype._showNewContent = function (e, t, i) {
    var n = e.eventsContent.find(".selected");
    if ("normal" == this.settings.dateOrder) var s = "next" == i ? n.next() : n.prev();else if ("reverse" == this.settings.dateOrder) s = "next" == i ? n.prev() : n.next();

    if (s.length > 0 || "reverse" == this.settings.dateOrder && "start" == i) {
      var a,
          l = e.eventsWrapper.find(".selected");
      "start" == i ? "normal" == this.settings.dateOrder ? a = e.eventsWrapper.find(".first") : "reverse" == this.settings.dateOrder && (a = e.eventsWrapper.find(".last")) : "next" == i ? a = l.next("a") : "prev" == i && (a = l.prev("a")), this._updateVisibleContent(a, e.eventsContent), a.addClass("selected"), l.removeClass("selected"), this._updateFilling(a, e.fillingLine, t), this._updateOlderEvents(a), this._updateTimelinePosition(a, e, t);
    }
  }, r.prototype._updateTimelinePosition = function (e, t, i) {
    var n = Number(e.css("left").replace("px", "")),
        s = t.timelineWrapper.width();

    this._translateTimeline(t, s / 2 - n, s - i);
  }, r.prototype._translateTimeline = function (e, t, i) {
    t = t > 0 ? 0 : t;
    t = void 0 !== i && t < i ? i : t, this._setTransformValue(e.eventsWrapper, "translateX", t + "px"), this._buttonStates(e, t, i);
  }, r.prototype._updateFilling = function (e, t, i) {
    var n = e.css("left").replace("px", ""),
        s = e.css("width").replace("px", ""),
        a = (n = Number(n) + Number(s) / 2) / i;

    this._setTransformValue(t, "scaleX", a);
  }, r.prototype._setDatePosition = function (e) {
    var t = 0,
        n = 0,
        s = 0;

    this._setDateIntervals(e);

    var a = this._checkMQ();

    for (1 != this.settings.minimalFirstDateInterval && "tinyMobile" != a && "mobile" != a || (e.timelineEvents.first().css({
      left: "0px",
      "padding-left": "10px"
    }), s = 1), i = s; i < e.timelineEvents.length; i++) {
      t = n + dateIntervals, e.timelineEvents.eq(i).css("left", t + "px"), n = t;
    }
  }, r.prototype._setTimelineWidth = function (e) {
    var t = 0,
        i = e.timelineWrapper.width(),
        n = Number(e.timelineEvents.last().css("left").replace("px", "")) + 100;
    return t = n < i ? i : n, e.eventsWrapper.css("width", t + "px"), this._updateTimelinePosition(e.eventsWrapper.find("a.selected"), e, t), t;
  }, r.prototype._updateVisibleContent = function (t, i) {
    var a = this._timelineData(t, "date");

    if (visibleContent = i.find(".selected"), newContent = i.find("li").filter(e.proxy(function (t, i) {
      if (this._timelineData(e(i), "date") == a) return e(i);
    }, this)), newContentHeight = newContent.outerHeight(), enterObj = this.settings.enter_animationClass, exitObj = this.settings.exit_animationClass, allClasses = exitObj.right + " " + exitObj.left + " " + enterObj.left + " " + enterObj.right, newContent.index() > visibleContent.index()) var l = "selected " + enterObj.right,
        r = exitObj.left;else l = "selected " + enterObj.left, r = exitObj.right;

    var o = function () {
      var e,
          t = n.createElement("fakeelement"),
          i = {
        animation: "animationend",
        OAnimation: "oAnimationEnd",
        MozAnimation: "animationend",
        WebkitAnimation: "webkitAnimationEnd"
      };

      for (e in i) {
        if (t.style[e] !== s) return i[e];
      }
    }();

    newContent.addClass(l), visibleContent.addClass(r).one(o, function (e) {
      i.find("li").removeClass(allClasses);
    }).removeClass("selected"), i.height(newContentHeight + "px"), 1 == this.settings.autoplay && this._setup.autoplay.moved(this);
  }, r.prototype._updateOlderEvents = function (e) {
    e.prevAll("a").addClass("older-event").end().nextAll("a").removeClass("older-event"), e.is(".selected") && e.removeClass("older-event");
  }, r.prototype._getTranslateValue = function (e) {
    var i = t.getComputedStyle(e.get(0), null);
    if ((n = i.getPropertyValue("-webkit-transform") || i.getPropertyValue("-moz-transform") || i.getPropertyValue("-ms-transform") || i.getPropertyValue("-o-transform") || i.getPropertyValue("transform")).indexOf("(") >= 0) var n,
        s = (n = (n = (n = n.split("(")[1]).split(")")[0]).split(","))[4];else s = 0;
    return Number(s);
  }, r.prototype._setTransformValue = function (e, t, i) {
    e.css({
      "-webkit-transform": t + "(" + i + ")",
      "-moz-transform": t + "(" + i + ")",
      "-ms-transform": t + "(" + i + ")",
      "-o-transform": t + "(" + i + ")",
      transform: t + "(" + i + ")"
    });
  }, r.prototype._elementInViewport = function (e) {
    for (var i = e.offsetTop, n = e.offsetLeft, s = e.offsetWidth, a = e.offsetHeight; e.offsetParent;) {
      i += (e = e.offsetParent).offsetTop, n += e.offsetLeft;
    }

    return i < t.pageYOffset + t.innerHeight && n < t.pageXOffset + t.innerWidth && i + a > t.pageYOffset && n + s > t.pageXOffset;
  }, r.prototype._setDateIntervals = function (e) {
    var t = this._checkMQ();

    "tinyMobile" == t || "mobile" == t ? dateIntervals = this.settings.mobileDateIntervals : "smallTablet" == t || "tablet" == t ? dateIntervals = this.settings.tabletDateIntervals : "desktop" == t && (dateIntervals = this.settings.desktopDateIntervals);
    dateIntervals < 120 && (dateIntervals = 120);
  }, r.prototype._checkMQ = function () {
    return t.getComputedStyle(this.element, ":before").content.replace(/'/g, "").replace(/"/g, "");
  }, r.prototype._buttonStates = function (e, t, i) {
    var n = e.timelineNavigation.find(".next"),
        s = e.timelineNavigation.find(".prev"),
        a = e.timelineNavigation.find(".scroll-left"),
        l = e.timelineNavigation.find(".scroll-right"),
        r = e.timelineWrapper.find(".first"),
        o = e.timelineWrapper.find(".last");
    Number(e.timelineWrapper.css("width").replace("px", "")) == e.eventsWrapper.width() && (a.addClass("inactive"), l.addClass("inactive")), 1 == e.eventsContentList.length ? (s.addClass("inactive"), n.addClass("inactive")) : (r.is(".selected") ? s.addClass("inactive") : s.removeClass("inactive"), o.is(".selected") ? n.addClass("inactive") : n.removeClass("inactive")), 0 == t ? a.addClass("inactive") : a.removeClass("inactive"), t == i ? l.addClass("inactive") : l.removeClass("inactive");
  }, r.prototype._addFile = function (t, i, n) {
    if (1 == this.settings.addRequiredFile) {
      var s,
          a = e("body").data("plugin_" + this._name + "_loadedFile"),
          l = "js" == i,
          r = "css" == i,
          o = t.split("libs/")[1].split("/")[0];
      l ? s = e('script[src*="' + o + '"]') : r && (s = e('link[href*="' + o + '"]')), null == a && (a = new Array()), -1 != a.indexOf(t) || s.length ? s.length && -1 == a.indexOf(t) ? (l && (console.groupCollapsed(o + " on " + this.$element.attr("id") + " timeline"), console.log("The plugin has already been loaded in the document via a <script> tag, no need to load it again."), "function" == typeof n && n(this)), a.push(t)) : l && (console.groupCollapsed(o + " on " + this.$element.attr("id") + " timeline"), console.log("The plugin has already been loaded, no need to load it again."), "function" == typeof n && n(this)) : (l ? (console.groupCollapsed(o + " on " + this.$element.attr("id") + " timeline"), console.log("The plugin isn't loaded."), e.getScript(t).done(function (e, t) {
        "function" == typeof n && n(this);
      }).fail(function (e, i, n) {
        console.error("Failed to get " + t + "\n" + e + "\n" + this.settings + "\n" + n);
      }), console.log("It was loaded dynamically.")) : r && (console.groupCollapsed(o), console.log("The plugin isn't loaded."), e("<link>").attr({
        href: t,
        rel: "stylesheet",
        type: "text/css"
      }).insertAfter(e("head").find("link").last()), console.log("It was loaded dynamically.")), a.push(t)), l && console.log("Executed on:", this.$element), console.groupEnd(), e("body").data("plugin_" + this._name + "_loadedFile", a);
    } else "function" == typeof n && n(this);
  }, e.fn[a] = function (i) {
    var n,
        l = arguments,
        o = e(t).width(),
        d = e(this).find(".events-content").find("li").map(function () {
      return e(this).data("horizontal-timeline") ? e(this).data("horizontal-timeline").date : e(this).data("date");
    }).get();
    return i === s || "object" == _typeof(i) ? this.each(function () {
      e.data(this, "plugin_" + a) || e.data(this, "plugin_" + a, {
        originalEventsContent: e(this).find(".events-content").clone()[0],
        windowWidth: o,
        existingDates: d,
        Timeline: new r(this, i)
      });
    }) : "string" == typeof i && "_" !== i[0] && "init" !== i ? (this.each(function () {
      var t = e.data(this, "plugin_" + a).Timeline;
      t instanceof r && "function" == typeof t[i] && (n = t[i].apply(t, Array.prototype.slice.call(l, 1)));
    }), n !== s ? n : this) : void 0;
  };
}(jQuery, window, document);
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
 * imagesLoaded PACKAGED v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

/*!
 * EventEmitter v4.2.6 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */
(function () {
  /**
   * Class for managing events.
   * Can be extended to provide event functionality in other classes.
   *
   * @class EventEmitter Manages event registering and emitting.
   */
  function EventEmitter() {} // Shortcuts to improve speed and size


  var proto = EventEmitter.prototype;
  var exports = this;
  var originalGlobalValue = exports.EventEmitter;
  /**
   * Finds the index of the listener for the event in it's storage array.
   *
   * @param {Function[]} listeners Array of listeners to search through.
   * @param {Function} listener Method to look for.
   * @return {Number} Index of the specified listener, -1 if not found
   * @api private
   */

  function indexOfListener(listeners, listener) {
    var i = listeners.length;

    while (i--) {
      if (listeners[i].listener === listener) {
        return i;
      }
    }

    return -1;
  }
  /**
   * Alias a method while keeping the context correct, to allow for overwriting of target method.
   *
   * @param {String} name The name of the target method.
   * @return {Function} The aliased method
   * @api private
   */


  function alias(name) {
    return function aliasClosure() {
      return this[name].apply(this, arguments);
    };
  }
  /**
   * Returns the listener array for the specified event.
   * Will initialise the event object and listener arrays if required.
   * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
   * Each property in the object response is an array of listener functions.
   *
   * @param {String|RegExp} evt Name of the event to return the listeners from.
   * @return {Function[]|Object} All listener functions for the event.
   */


  proto.getListeners = function getListeners(evt) {
    var events = this._getEvents();

    var response;
    var key; // Return a concatenated array of all matching events if
    // the selector is a regular expression.

    if (_typeof(evt) === 'object') {
      response = {};

      for (key in events) {
        if (events.hasOwnProperty(key) && evt.test(key)) {
          response[key] = events[key];
        }
      }
    } else {
      response = events[evt] || (events[evt] = []);
    }

    return response;
  };
  /**
   * Takes a list of listener objects and flattens it into a list of listener functions.
   *
   * @param {Object[]} listeners Raw listener objects.
   * @return {Function[]} Just the listener functions.
   */


  proto.flattenListeners = function flattenListeners(listeners) {
    var flatListeners = [];
    var i;

    for (i = 0; i < listeners.length; i += 1) {
      flatListeners.push(listeners[i].listener);
    }

    return flatListeners;
  };
  /**
   * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
   *
   * @param {String|RegExp} evt Name of the event to return the listeners from.
   * @return {Object} All listener functions for an event in an object.
   */


  proto.getListenersAsObject = function getListenersAsObject(evt) {
    var listeners = this.getListeners(evt);
    var response;

    if (listeners instanceof Array) {
      response = {};
      response[evt] = listeners;
    }

    return response || listeners;
  };
  /**
   * Adds a listener function to the specified event.
   * The listener will not be added if it is a duplicate.
   * If the listener returns true then it will be removed after it is called.
   * If you pass a regular expression as the event name then the listener will be added to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to attach the listener to.
   * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.addListener = function addListener(evt, listener) {
    var listeners = this.getListenersAsObject(evt);
    var listenerIsWrapped = _typeof(listener) === 'object';
    var key;

    for (key in listeners) {
      if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
        listeners[key].push(listenerIsWrapped ? listener : {
          listener: listener,
          once: false
        });
      }
    }

    return this;
  };
  /**
   * Alias of addListener
   */


  proto.on = alias('addListener');
  /**
   * Semi-alias of addListener. It will add a listener that will be
   * automatically removed after it's first execution.
   *
   * @param {String|RegExp} evt Name of the event to attach the listener to.
   * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
   * @return {Object} Current instance of EventEmitter for chaining.
   */

  proto.addOnceListener = function addOnceListener(evt, listener) {
    return this.addListener(evt, {
      listener: listener,
      once: true
    });
  };
  /**
   * Alias of addOnceListener.
   */


  proto.once = alias('addOnceListener');
  /**
   * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
   * You need to tell it what event names should be matched by a regex.
   *
   * @param {String} evt Name of the event to create.
   * @return {Object} Current instance of EventEmitter for chaining.
   */

  proto.defineEvent = function defineEvent(evt) {
    this.getListeners(evt);
    return this;
  };
  /**
   * Uses defineEvent to define multiple events.
   *
   * @param {String[]} evts An array of event names to define.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.defineEvents = function defineEvents(evts) {
    for (var i = 0; i < evts.length; i += 1) {
      this.defineEvent(evts[i]);
    }

    return this;
  };
  /**
   * Removes a listener function from the specified event.
   * When passed a regular expression as the event name, it will remove the listener from all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to remove the listener from.
   * @param {Function} listener Method to remove from the event.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.removeListener = function removeListener(evt, listener) {
    var listeners = this.getListenersAsObject(evt);
    var index;
    var key;

    for (key in listeners) {
      if (listeners.hasOwnProperty(key)) {
        index = indexOfListener(listeners[key], listener);

        if (index !== -1) {
          listeners[key].splice(index, 1);
        }
      }
    }

    return this;
  };
  /**
   * Alias of removeListener
   */


  proto.off = alias('removeListener');
  /**
   * Adds listeners in bulk using the manipulateListeners method.
   * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
   * You can also pass it a regular expression to add the array of listeners to all events that match it.
   * Yeah, this function does quite a bit. That's probably a bad thing.
   *
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to add.
   * @return {Object} Current instance of EventEmitter for chaining.
   */

  proto.addListeners = function addListeners(evt, listeners) {
    // Pass through to manipulateListeners
    return this.manipulateListeners(false, evt, listeners);
  };
  /**
   * Removes listeners in bulk using the manipulateListeners method.
   * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
   * You can also pass it an event name and an array of listeners to be removed.
   * You can also pass it a regular expression to remove the listeners from all events that match it.
   *
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to remove.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.removeListeners = function removeListeners(evt, listeners) {
    // Pass through to manipulateListeners
    return this.manipulateListeners(true, evt, listeners);
  };
  /**
   * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
   * The first argument will determine if the listeners are removed (true) or added (false).
   * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
   * You can also pass it an event name and an array of listeners to be added/removed.
   * You can also pass it a regular expression to manipulate the listeners of all events that match it.
   *
   * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
    var i;
    var value;
    var single = remove ? this.removeListener : this.addListener;
    var multiple = remove ? this.removeListeners : this.addListeners; // If evt is an object then pass each of it's properties to this method

    if (_typeof(evt) === 'object' && !(evt instanceof RegExp)) {
      for (i in evt) {
        if (evt.hasOwnProperty(i) && (value = evt[i])) {
          // Pass the single listener straight through to the singular method
          if (typeof value === 'function') {
            single.call(this, i, value);
          } else {
            // Otherwise pass back to the multiple function
            multiple.call(this, i, value);
          }
        }
      }
    } else {
      // So evt must be a string
      // And listeners must be an array of listeners
      // Loop over it and pass each one to the multiple method
      i = listeners.length;

      while (i--) {
        single.call(this, evt, listeners[i]);
      }
    }

    return this;
  };
  /**
   * Removes all listeners from a specified event.
   * If you do not specify an event then all listeners will be removed.
   * That means every event will be emptied.
   * You can also pass a regex to remove all events that match it.
   *
   * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.removeEvent = function removeEvent(evt) {
    var type = _typeof(evt);

    var events = this._getEvents();

    var key; // Remove different things depending on the state of evt

    if (type === 'string') {
      // Remove all listeners for the specified event
      delete events[evt];
    } else if (type === 'object') {
      // Remove all events matching the regex.
      for (key in events) {
        if (events.hasOwnProperty(key) && evt.test(key)) {
          delete events[key];
        }
      }
    } else {
      // Remove all listeners in all events
      delete this._events;
    }

    return this;
  };
  /**
   * Alias of removeEvent.
   *
   * Added to mirror the node API.
   */


  proto.removeAllListeners = alias('removeEvent');
  /**
   * Emits an event of your choice.
   * When emitted, every listener attached to that event will be executed.
   * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
   * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
   * So they will not arrive within the array on the other side, they will be separate.
   * You can also pass a regular expression to emit to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
   * @param {Array} [args] Optional array of arguments to be passed to each listener.
   * @return {Object} Current instance of EventEmitter for chaining.
   */

  proto.emitEvent = function emitEvent(evt, args) {
    var listeners = this.getListenersAsObject(evt);
    var listener;
    var i;
    var key;
    var response;

    for (key in listeners) {
      if (listeners.hasOwnProperty(key)) {
        i = listeners[key].length;

        while (i--) {
          // If the listener returns true then it shall be removed from the event
          // The function is executed either with a basic call or an apply if there is an args array
          listener = listeners[key][i];

          if (listener.once === true) {
            this.removeListener(evt, listener.listener);
          }

          response = listener.listener.apply(this, args || []);

          if (response === this._getOnceReturnValue()) {
            this.removeListener(evt, listener.listener);
          }
        }
      }
    }

    return this;
  };
  /**
   * Alias of emitEvent
   */


  proto.trigger = alias('emitEvent');
  /**
   * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
   * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
   * @param {...*} Optional additional arguments to be passed to each listener.
   * @return {Object} Current instance of EventEmitter for chaining.
   */

  proto.emit = function emit(evt) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this.emitEvent(evt, args);
  };
  /**
   * Sets the current value to check against when executing listeners. If a
   * listeners return value matches the one set here then it will be removed
   * after execution. This value defaults to true.
   *
   * @param {*} value The new value to check for when executing listeners.
   * @return {Object} Current instance of EventEmitter for chaining.
   */


  proto.setOnceReturnValue = function setOnceReturnValue(value) {
    this._onceReturnValue = value;
    return this;
  };
  /**
   * Fetches the current value to check against when executing listeners. If
   * the listeners return value matches this one then it should be removed
   * automatically. It will return true by default.
   *
   * @return {*|Boolean} The current value to check for or the default, true.
   * @api private
   */


  proto._getOnceReturnValue = function _getOnceReturnValue() {
    if (this.hasOwnProperty('_onceReturnValue')) {
      return this._onceReturnValue;
    } else {
      return true;
    }
  };
  /**
   * Fetches the events object and creates one if required.
   *
   * @return {Object} The events storage object.
   * @api private
   */


  proto._getEvents = function _getEvents() {
    return this._events || (this._events = {});
  };
  /**
   * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
   *
   * @return {Function} Non conflicting EventEmitter class.
   */


  EventEmitter.noConflict = function noConflict() {
    exports.EventEmitter = originalGlobalValue;
    return EventEmitter;
  }; // Expose the class either via AMD, CommonJS or the global object


  if (typeof define === 'function' && define.amd) {
    define('eventEmitter/EventEmitter', [], function () {
      return EventEmitter;
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object' && module.exports) {
    module.exports = EventEmitter;
  } else {
    this.EventEmitter = EventEmitter;
  }
}).call(void 0);
/*!
 * eventie v1.0.4
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 */

/*jshint browser: true, undef: true, unused: true */

/*global define: false */

(function (window) {
  var docElem = document.documentElement;

  var bind = function bind() {};

  function getIEEvent(obj) {
    var event = window.event; // add event.target

    event.target = event.target || event.srcElement || obj;
    return event;
  }

  if (docElem.addEventListener) {
    bind = function bind(obj, type, fn) {
      obj.addEventListener(type, fn, false);
    };
  } else if (docElem.attachEvent) {
    bind = function bind(obj, type, fn) {
      obj[type + fn] = fn.handleEvent ? function () {
        var event = getIEEvent(obj);
        fn.handleEvent.call(fn, event);
      } : function () {
        var event = getIEEvent(obj);
        fn.call(obj, event);
      };
      obj.attachEvent("on" + type, obj[type + fn]);
    };
  }

  var unbind = function unbind() {};

  if (docElem.removeEventListener) {
    unbind = function unbind(obj, type, fn) {
      obj.removeEventListener(type, fn, false);
    };
  } else if (docElem.detachEvent) {
    unbind = function unbind(obj, type, fn) {
      obj.detachEvent("on" + type, obj[type + fn]);

      try {
        delete obj[type + fn];
      } catch (err) {
        // can't delete window object properties
        obj[type + fn] = undefined;
      }
    };
  }

  var eventie = {
    bind: bind,
    unbind: unbind
  }; // transport

  if (typeof define === 'function' && define.amd) {
    // AMD
    define('eventie/eventie', eventie);
  } else {
    // browser global
    window.eventie = eventie;
  }
})(void 0);
/*!
 * imagesLoaded v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */


(function (window, factory) {
  // universal module definition

  /*global define: false, module: false, require: false */
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['eventEmitter/EventEmitter', 'eventie/eventie'], function (EventEmitter, eventie) {
      return factory(window, EventEmitter, eventie);
    });
  } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object') {
    // CommonJS
    module.exports = factory(window, require('wolfy87-eventemitter'), require('eventie'));
  } else {
    // browser global
    window.imagesLoaded = factory(window, window.EventEmitter, window.eventie);
  }
})(window, // --------------------------  factory -------------------------- //
function factory(window, EventEmitter, eventie) {
  var $ = window.jQuery;
  var console = window.console;
  var hasConsole = typeof console !== 'undefined'; // -------------------------- helpers -------------------------- //
  // extend objects

  function extend(a, b) {
    for (var prop in b) {
      a[prop] = b[prop];
    }

    return a;
  }

  var objToString = Object.prototype.toString;

  function isArray(obj) {
    return objToString.call(obj) === '[object Array]';
  } // turn element or nodeList into an array


  function makeArray(obj) {
    var ary = [];

    if (isArray(obj)) {
      // use object if already an array
      ary = obj;
    } else if (typeof obj.length === 'number') {
      // convert nodeList to array
      for (var i = 0, len = obj.length; i < len; i++) {
        ary.push(obj[i]);
      }
    } else {
      // array of single index
      ary.push(obj);
    }

    return ary;
  } // -------------------------- imagesLoaded -------------------------- //

  /**
   * @param {Array, Element, NodeList, String} elem
   * @param {Object or Function} options - if function, use as callback
   * @param {Function} onAlways - callback function
   */


  function ImagesLoaded(elem, options, onAlways) {
    // coerce ImagesLoaded() without new, to be new ImagesLoaded()
    if (!(this instanceof ImagesLoaded)) {
      return new ImagesLoaded(elem, options);
    } // use elem as selector string


    if (typeof elem === 'string') {
      elem = document.querySelectorAll(elem);
    }

    this.elements = makeArray(elem);
    this.options = extend({}, this.options);

    if (typeof options === 'function') {
      onAlways = options;
    } else {
      extend(this.options, options);
    }

    if (onAlways) {
      this.on('always', onAlways);
    }

    this.getImages();

    if ($) {
      // add jQuery Deferred object
      this.jqDeferred = new $.Deferred();
    } // HACK check async to allow time to bind listeners


    var _this = this;

    setTimeout(function () {
      _this.check();
    });
  }

  ImagesLoaded.prototype = new EventEmitter();
  ImagesLoaded.prototype.options = {};

  ImagesLoaded.prototype.getImages = function () {
    this.images = []; // filter & find items if we have an item selector

    for (var i = 0, len = this.elements.length; i < len; i++) {
      var elem = this.elements[i]; // filter siblings

      if (elem.nodeName === 'IMG') {
        this.addImage(elem);
      } // find children
      // no non-element nodes, #143


      var nodeType = elem.nodeType;

      if (!nodeType || !(nodeType === 1 || nodeType === 9 || nodeType === 11)) {
        continue;
      }

      var childElems = elem.querySelectorAll('img'); // concat childElems to filterFound array

      for (var j = 0, jLen = childElems.length; j < jLen; j++) {
        var img = childElems[j];
        this.addImage(img);
      }
    }
  };
  /**
   * @param {Image} img
   */


  ImagesLoaded.prototype.addImage = function (img) {
    var loadingImage = new LoadingImage(img);
    this.images.push(loadingImage);
  };

  ImagesLoaded.prototype.check = function () {
    var _this = this;

    var checkedCount = 0;
    var length = this.images.length;
    this.hasAnyBroken = false; // complete if no images

    if (!length) {
      this.complete();
      return;
    }

    function onConfirm(image, message) {
      if (_this.options.debug && hasConsole) {
        console.log('confirm', image, message);
      }

      _this.progress(image);

      checkedCount++;

      if (checkedCount === length) {
        _this.complete();
      }

      return true; // bind once
    }

    for (var i = 0; i < length; i++) {
      var loadingImage = this.images[i];
      loadingImage.on('confirm', onConfirm);
      loadingImage.check();
    }
  };

  ImagesLoaded.prototype.progress = function (image) {
    this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded; // HACK - Chrome triggers event before object properties have changed. #83

    var _this = this;

    setTimeout(function () {
      _this.emit('progress', _this, image);

      if (_this.jqDeferred && _this.jqDeferred.notify) {
        _this.jqDeferred.notify(_this, image);
      }
    });
  };

  ImagesLoaded.prototype.complete = function () {
    var eventName = this.hasAnyBroken ? 'fail' : 'done';
    this.isComplete = true;

    var _this = this; // HACK - another setTimeout so that confirm happens after progress


    setTimeout(function () {
      _this.emit(eventName, _this);

      _this.emit('always', _this);

      if (_this.jqDeferred) {
        var jqMethod = _this.hasAnyBroken ? 'reject' : 'resolve';

        _this.jqDeferred[jqMethod](_this);
      }
    });
  }; // -------------------------- jquery -------------------------- //


  if ($) {
    $.fn.imagesLoaded = function (options, callback) {
      var instance = new ImagesLoaded(this, options, callback);
      return instance.jqDeferred.promise($(this));
    };
  } // --------------------------  -------------------------- //


  function LoadingImage(img) {
    this.img = img;
  }

  LoadingImage.prototype = new EventEmitter();

  LoadingImage.prototype.check = function () {
    // first check cached any previous images that have same src
    var resource = cache[this.img.src] || new Resource(this.img.src);

    if (resource.isConfirmed) {
      this.confirm(resource.isLoaded, 'cached was confirmed');
      return;
    } // If complete is true and browser supports natural sizes,
    // try to check for image status manually.


    if (this.img.complete && this.img.naturalWidth !== undefined) {
      // report based on naturalWidth
      this.confirm(this.img.naturalWidth !== 0, 'naturalWidth');
      return;
    } // If none of the checks above matched, simulate loading on detached element.


    var _this = this;

    resource.on('confirm', function (resrc, message) {
      _this.confirm(resrc.isLoaded, message);

      return true;
    });
    resource.check();
  };

  LoadingImage.prototype.confirm = function (isLoaded, message) {
    this.isLoaded = isLoaded;
    this.emit('confirm', this, message);
  }; // -------------------------- Resource -------------------------- //
  // Resource checks each src, only once
  // separate class from LoadingImage to prevent memory leaks. See #115


  var cache = {};

  function Resource(src) {
    this.src = src; // add to cache

    cache[src] = this;
  }

  Resource.prototype = new EventEmitter();

  Resource.prototype.check = function () {
    // only trigger checking once
    if (this.isChecked) {
      return;
    } // simulate loading on detached element


    var proxyImage = new Image();
    eventie.bind(proxyImage, 'load', this);
    eventie.bind(proxyImage, 'error', this);
    proxyImage.src = this.src; // set flag

    this.isChecked = true;
  }; // ----- events ----- //
  // trigger specified handler for event type


  Resource.prototype.handleEvent = function (event) {
    var method = 'on' + event.type;

    if (this[method]) {
      this[method](event);
    }
  };

  Resource.prototype.onload = function (event) {
    this.confirm(true, 'onload');
    this.unbindProxyEvents(event);
  };

  Resource.prototype.onerror = function (event) {
    this.confirm(false, 'onerror');
    this.unbindProxyEvents(event);
  }; // ----- confirm ----- //


  Resource.prototype.confirm = function (isLoaded, message) {
    this.isConfirmed = true;
    this.isLoaded = isLoaded;
    this.emit('confirm', this, message);
  };

  Resource.prototype.unbindProxyEvents = function (event) {
    eventie.unbind(event.target, 'load', this);
    eventie.unbind(event.target, 'error', this);
  }; // -----  ----- //


  return ImagesLoaded;
});
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*!
 * Isotope PACKAGED v2.1.0
 * Filter & sort magical layouts
 * http://isotope.metafizzy.co
 */
(function (t) {
  function e() {}

  function i(t) {
    function i(e) {
      e.prototype.option || (e.prototype.option = function (e) {
        t.isPlainObject(e) && (this.options = t.extend(!0, this.options, e));
      });
    }

    function n(e, i) {
      t.fn[e] = function (n) {
        if ("string" == typeof n) {
          for (var s = o.call(arguments, 1), a = 0, u = this.length; u > a; a++) {
            var p = this[a],
                h = t.data(p, e);
            if (h) {
              if (t.isFunction(h[n]) && "_" !== n.charAt(0)) {
                var f = h[n].apply(h, s);
                if (void 0 !== f) return f;
              } else r("no such method '" + n + "' for " + e + " instance");
            } else r("cannot call methods on " + e + " prior to initialization; " + "attempted to call '" + n + "'");
          }

          return this;
        }

        return this.each(function () {
          var o = t.data(this, e);
          o ? (o.option(n), o._init()) : (o = new i(this, n), t.data(this, e, o));
        });
      };
    }

    if (t) {
      var r = "undefined" == typeof console ? e : function (t) {
        console.error(t);
      };
      return t.bridget = function (t, e) {
        i(e), n(t, e);
      }, t.bridget;
    }
  }

  var o = Array.prototype.slice;
  "function" == typeof define && define.amd ? define("jquery-bridget/jquery.bridget", ["jquery"], i) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? i(require("jquery")) : i(t.jQuery);
})(window), function (t) {
  function e(e) {
    var i = t.event;
    return i.target = i.target || i.srcElement || e, i;
  }

  var i = document.documentElement,
      o = function o() {};

  i.addEventListener ? o = function o(t, e, i) {
    t.addEventListener(e, i, !1);
  } : i.attachEvent && (o = function o(t, i, _o) {
    t[i + _o] = _o.handleEvent ? function () {
      var i = e(t);

      _o.handleEvent.call(_o, i);
    } : function () {
      var i = e(t);

      _o.call(t, i);
    }, t.attachEvent("on" + i, t[i + _o]);
  });

  var n = function n() {};

  i.removeEventListener ? n = function n(t, e, i) {
    t.removeEventListener(e, i, !1);
  } : i.detachEvent && (n = function n(t, e, i) {
    t.detachEvent("on" + e, t[e + i]);

    try {
      delete t[e + i];
    } catch (o) {
      t[e + i] = void 0;
    }
  });
  var r = {
    bind: o,
    unbind: n
  };
  "function" == typeof define && define.amd ? define("eventie/eventie", r) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = r : t.eventie = r;
}(void 0), function (t) {
  function e(t) {
    "function" == typeof t && (e.isReady ? t() : s.push(t));
  }

  function i(t) {
    var i = "readystatechange" === t.type && "complete" !== r.readyState;
    e.isReady || i || o();
  }

  function o() {
    e.isReady = !0;

    for (var t = 0, i = s.length; i > t; t++) {
      var o = s[t];
      o();
    }
  }

  function n(n) {
    return "complete" === r.readyState ? o() : (n.bind(r, "DOMContentLoaded", i), n.bind(r, "readystatechange", i), n.bind(t, "load", i)), e;
  }

  var r = t.document,
      s = [];
  e.isReady = !1, "function" == typeof define && define.amd ? define("doc-ready/doc-ready", ["eventie/eventie"], n) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = n(require("eventie")) : t.docReady = n(t.eventie);
}(window), function () {
  function t() {}

  function e(t, e) {
    for (var i = t.length; i--;) {
      if (t[i].listener === e) return i;
    }

    return -1;
  }

  function i(t) {
    return function () {
      return this[t].apply(this, arguments);
    };
  }

  var o = t.prototype,
      n = this,
      r = n.EventEmitter;
  o.getListeners = function (t) {
    var e,
        i,
        o = this._getEvents();

    if (t instanceof RegExp) {
      e = {};

      for (i in o) {
        o.hasOwnProperty(i) && t.test(i) && (e[i] = o[i]);
      }
    } else e = o[t] || (o[t] = []);

    return e;
  }, o.flattenListeners = function (t) {
    var e,
        i = [];

    for (e = 0; t.length > e; e += 1) {
      i.push(t[e].listener);
    }

    return i;
  }, o.getListenersAsObject = function (t) {
    var e,
        i = this.getListeners(t);
    return i instanceof Array && (e = {}, e[t] = i), e || i;
  }, o.addListener = function (t, i) {
    var o,
        n = this.getListenersAsObject(t),
        r = "object" == _typeof(i);

    for (o in n) {
      n.hasOwnProperty(o) && -1 === e(n[o], i) && n[o].push(r ? i : {
        listener: i,
        once: !1
      });
    }

    return this;
  }, o.on = i("addListener"), o.addOnceListener = function (t, e) {
    return this.addListener(t, {
      listener: e,
      once: !0
    });
  }, o.once = i("addOnceListener"), o.defineEvent = function (t) {
    return this.getListeners(t), this;
  }, o.defineEvents = function (t) {
    for (var e = 0; t.length > e; e += 1) {
      this.defineEvent(t[e]);
    }

    return this;
  }, o.removeListener = function (t, i) {
    var o,
        n,
        r = this.getListenersAsObject(t);

    for (n in r) {
      r.hasOwnProperty(n) && (o = e(r[n], i), -1 !== o && r[n].splice(o, 1));
    }

    return this;
  }, o.off = i("removeListener"), o.addListeners = function (t, e) {
    return this.manipulateListeners(!1, t, e);
  }, o.removeListeners = function (t, e) {
    return this.manipulateListeners(!0, t, e);
  }, o.manipulateListeners = function (t, e, i) {
    var o,
        n,
        r = t ? this.removeListener : this.addListener,
        s = t ? this.removeListeners : this.addListeners;
    if ("object" != _typeof(e) || e instanceof RegExp) for (o = i.length; o--;) {
      r.call(this, e, i[o]);
    } else for (o in e) {
      e.hasOwnProperty(o) && (n = e[o]) && ("function" == typeof n ? r.call(this, o, n) : s.call(this, o, n));
    }
    return this;
  }, o.removeEvent = function (t) {
    var e,
        i = _typeof(t),
        o = this._getEvents();

    if ("string" === i) delete o[t];else if (t instanceof RegExp) for (e in o) {
      o.hasOwnProperty(e) && t.test(e) && delete o[e];
    } else delete this._events;
    return this;
  }, o.removeAllListeners = i("removeEvent"), o.emitEvent = function (t, e) {
    var i,
        o,
        n,
        r,
        s = this.getListenersAsObject(t);

    for (n in s) {
      if (s.hasOwnProperty(n)) for (o = s[n].length; o--;) {
        i = s[n][o], i.once === !0 && this.removeListener(t, i.listener), r = i.listener.apply(this, e || []), r === this._getOnceReturnValue() && this.removeListener(t, i.listener);
      }
    }

    return this;
  }, o.trigger = i("emitEvent"), o.emit = function (t) {
    var e = Array.prototype.slice.call(arguments, 1);
    return this.emitEvent(t, e);
  }, o.setOnceReturnValue = function (t) {
    return this._onceReturnValue = t, this;
  }, o._getOnceReturnValue = function () {
    return this.hasOwnProperty("_onceReturnValue") ? this._onceReturnValue : !0;
  }, o._getEvents = function () {
    return this._events || (this._events = {});
  }, t.noConflict = function () {
    return n.EventEmitter = r, t;
  }, "function" == typeof define && define.amd ? define("eventEmitter/EventEmitter", [], function () {
    return t;
  }) : "object" == (typeof module === "undefined" ? "undefined" : _typeof(module)) && module.exports ? module.exports = t : n.EventEmitter = t;
}.call(void 0), function (t) {
  function e(t) {
    if (t) {
      if ("string" == typeof o[t]) return t;
      t = t.charAt(0).toUpperCase() + t.slice(1);

      for (var e, n = 0, r = i.length; r > n; n++) {
        if (e = i[n] + t, "string" == typeof o[e]) return e;
      }
    }
  }

  var i = "Webkit Moz ms Ms O".split(" "),
      o = document.documentElement.style;
  "function" == typeof define && define.amd ? define("get-style-property/get-style-property", [], function () {
    return e;
  }) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = e : t.getStyleProperty = e;
}(window), function (t) {
  function e(t) {
    var e = parseFloat(t),
        i = -1 === t.indexOf("%") && !isNaN(e);
    return i && e;
  }

  function i() {}

  function o() {
    for (var t = {
      width: 0,
      height: 0,
      innerWidth: 0,
      innerHeight: 0,
      outerWidth: 0,
      outerHeight: 0
    }, e = 0, i = s.length; i > e; e++) {
      var o = s[e];
      t[o] = 0;
    }

    return t;
  }

  function n(i) {
    function n() {
      if (!d) {
        d = !0;
        var o = t.getComputedStyle;

        if (p = function () {
          var t = o ? function (t) {
            return o(t, null);
          } : function (t) {
            return t.currentStyle;
          };
          return function (e) {
            var i = t(e);
            return i || r("Style returned " + i + ". Are you running this code in a hidden iframe on Firefox? " + "See http://bit.ly/getsizebug1"), i;
          };
        }(), h = i("boxSizing")) {
          var n = document.createElement("div");
          n.style.width = "200px", n.style.padding = "1px 2px 3px 4px", n.style.borderStyle = "solid", n.style.borderWidth = "1px 2px 3px 4px", n.style[h] = "border-box";
          var s = document.body || document.documentElement;
          s.appendChild(n);
          var a = p(n);
          f = 200 === e(a.width), s.removeChild(n);
        }
      }
    }

    function a(t) {
      if (n(), "string" == typeof t && (t = document.querySelector(t)), t && "object" == _typeof(t) && t.nodeType) {
        var i = p(t);
        if ("none" === i.display) return o();
        var r = {};
        r.width = t.offsetWidth, r.height = t.offsetHeight;

        for (var a = r.isBorderBox = !(!h || !i[h] || "border-box" !== i[h]), d = 0, l = s.length; l > d; d++) {
          var c = s[d],
              y = i[c];
          y = u(t, y);
          var m = parseFloat(y);
          r[c] = isNaN(m) ? 0 : m;
        }

        var g = r.paddingLeft + r.paddingRight,
            v = r.paddingTop + r.paddingBottom,
            _ = r.marginLeft + r.marginRight,
            I = r.marginTop + r.marginBottom,
            L = r.borderLeftWidth + r.borderRightWidth,
            z = r.borderTopWidth + r.borderBottomWidth,
            b = a && f,
            x = e(i.width);

        x !== !1 && (r.width = x + (b ? 0 : g + L));
        var S = e(i.height);
        return S !== !1 && (r.height = S + (b ? 0 : v + z)), r.innerWidth = r.width - (g + L), r.innerHeight = r.height - (v + z), r.outerWidth = r.width + _, r.outerHeight = r.height + I, r;
      }
    }

    function u(e, i) {
      if (t.getComputedStyle || -1 === i.indexOf("%")) return i;
      var o = e.style,
          n = o.left,
          r = e.runtimeStyle,
          s = r && r.left;
      return s && (r.left = e.currentStyle.left), o.left = i, i = o.pixelLeft, o.left = n, s && (r.left = s), i;
    }

    var p,
        h,
        f,
        d = !1;
    return a;
  }

  var r = "undefined" == typeof console ? i : function (t) {
    console.error(t);
  },
      s = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "marginLeft", "marginRight", "marginTop", "marginBottom", "borderLeftWidth", "borderRightWidth", "borderTopWidth", "borderBottomWidth"];
  "function" == typeof define && define.amd ? define("get-size/get-size", ["get-style-property/get-style-property"], n) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = n(require("desandro-get-style-property")) : t.getSize = n(t.getStyleProperty);
}(window), function (t) {
  function e(t, e) {
    return t[s](e);
  }

  function i(t) {
    if (!t.parentNode) {
      var e = document.createDocumentFragment();
      e.appendChild(t);
    }
  }

  function o(t, e) {
    i(t);

    for (var o = t.parentNode.querySelectorAll(e), n = 0, r = o.length; r > n; n++) {
      if (o[n] === t) return !0;
    }

    return !1;
  }

  function n(t, o) {
    return i(t), e(t, o);
  }

  var r,
      s = function () {
    if (t.matchesSelector) return "matchesSelector";

    for (var e = ["webkit", "moz", "ms", "o"], i = 0, o = e.length; o > i; i++) {
      var n = e[i],
          r = n + "MatchesSelector";
      if (t[r]) return r;
    }
  }();

  if (s) {
    var a = document.createElement("div"),
        u = e(a, "div");
    r = u ? e : n;
  } else r = o;

  "function" == typeof define && define.amd ? define("matches-selector/matches-selector", [], function () {
    return r;
  }) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = r : window.matchesSelector = r;
}(Element.prototype), function (t) {
  function e(t, e) {
    for (var i in e) {
      t[i] = e[i];
    }

    return t;
  }

  function i(t) {
    for (var e in t) {
      return !1;
    }

    return e = null, !0;
  }

  function o(t) {
    return t.replace(/([A-Z])/g, function (t) {
      return "-" + t.toLowerCase();
    });
  }

  function n(t, n, r) {
    function a(t, e) {
      t && (this.element = t, this.layout = e, this.position = {
        x: 0,
        y: 0
      }, this._create());
    }

    var u = r("transition"),
        p = r("transform"),
        h = u && p,
        f = !!r("perspective"),
        d = {
      WebkitTransition: "webkitTransitionEnd",
      MozTransition: "transitionend",
      OTransition: "otransitionend",
      transition: "transitionend"
    }[u],
        l = ["transform", "transition", "transitionDuration", "transitionProperty"],
        c = function () {
      for (var t = {}, e = 0, i = l.length; i > e; e++) {
        var o = l[e],
            n = r(o);
        n && n !== o && (t[o] = n);
      }

      return t;
    }();

    e(a.prototype, t.prototype), a.prototype._create = function () {
      this._transn = {
        ingProperties: {},
        clean: {},
        onEnd: {}
      }, this.css({
        position: "absolute"
      });
    }, a.prototype.handleEvent = function (t) {
      var e = "on" + t.type;
      this[e] && this[e](t);
    }, a.prototype.getSize = function () {
      this.size = n(this.element);
    }, a.prototype.css = function (t) {
      var e = this.element.style;

      for (var i in t) {
        var o = c[i] || i;
        e[o] = t[i];
      }
    }, a.prototype.getPosition = function () {
      var t = s(this.element),
          e = this.layout.options,
          i = e.isOriginLeft,
          o = e.isOriginTop,
          n = parseInt(t[i ? "left" : "right"], 10),
          r = parseInt(t[o ? "top" : "bottom"], 10);
      n = isNaN(n) ? 0 : n, r = isNaN(r) ? 0 : r;
      var a = this.layout.size;
      n -= i ? a.paddingLeft : a.paddingRight, r -= o ? a.paddingTop : a.paddingBottom, this.position.x = n, this.position.y = r;
    }, a.prototype.layoutPosition = function () {
      var t = this.layout.size,
          e = this.layout.options,
          i = {};
      e.isOriginLeft ? (i.left = this.position.x + t.paddingLeft + "px", i.right = "") : (i.right = this.position.x + t.paddingRight + "px", i.left = ""), e.isOriginTop ? (i.top = this.position.y + t.paddingTop + "px", i.bottom = "") : (i.bottom = this.position.y + t.paddingBottom + "px", i.top = ""), this.css(i), this.emitEvent("layout", [this]);
    };
    var y = f ? function (t, e) {
      return "translate3d(" + t + "px, " + e + "px, 0)";
    } : function (t, e) {
      return "translate(" + t + "px, " + e + "px)";
    };
    a.prototype._transitionTo = function (t, e) {
      this.getPosition();
      var i = this.position.x,
          o = this.position.y,
          n = parseInt(t, 10),
          r = parseInt(e, 10),
          s = n === this.position.x && r === this.position.y;
      if (this.setPosition(t, e), s && !this.isTransitioning) return this.layoutPosition(), void 0;
      var a = t - i,
          u = e - o,
          p = {},
          h = this.layout.options;
      a = h.isOriginLeft ? a : -a, u = h.isOriginTop ? u : -u, p.transform = y(a, u), this.transition({
        to: p,
        onTransitionEnd: {
          transform: this.layoutPosition
        },
        isCleaning: !0
      });
    }, a.prototype.goTo = function (t, e) {
      this.setPosition(t, e), this.layoutPosition();
    }, a.prototype.moveTo = h ? a.prototype._transitionTo : a.prototype.goTo, a.prototype.setPosition = function (t, e) {
      this.position.x = parseInt(t, 10), this.position.y = parseInt(e, 10);
    }, a.prototype._nonTransition = function (t) {
      this.css(t.to), t.isCleaning && this._removeStyles(t.to);

      for (var e in t.onTransitionEnd) {
        t.onTransitionEnd[e].call(this);
      }
    }, a.prototype._transition = function (t) {
      if (!parseFloat(this.layout.options.transitionDuration)) return this._nonTransition(t), void 0;
      var e = this._transn;

      for (var i in t.onTransitionEnd) {
        e.onEnd[i] = t.onTransitionEnd[i];
      }

      for (i in t.to) {
        e.ingProperties[i] = !0, t.isCleaning && (e.clean[i] = !0);
      }

      if (t.from) {
        this.css(t.from);
        var o = this.element.offsetHeight;
        o = null;
      }

      this.enableTransition(t.to), this.css(t.to), this.isTransitioning = !0;
    };
    var m = p && o(p) + ",opacity";
    a.prototype.enableTransition = function () {
      this.isTransitioning || (this.css({
        transitionProperty: m,
        transitionDuration: this.layout.options.transitionDuration
      }), this.element.addEventListener(d, this, !1));
    }, a.prototype.transition = a.prototype[u ? "_transition" : "_nonTransition"], a.prototype.onwebkitTransitionEnd = function (t) {
      this.ontransitionend(t);
    }, a.prototype.onotransitionend = function (t) {
      this.ontransitionend(t);
    };
    var g = {
      "-webkit-transform": "transform",
      "-moz-transform": "transform",
      "-o-transform": "transform"
    };
    a.prototype.ontransitionend = function (t) {
      if (t.target === this.element) {
        var e = this._transn,
            o = g[t.propertyName] || t.propertyName;

        if (delete e.ingProperties[o], i(e.ingProperties) && this.disableTransition(), o in e.clean && (this.element.style[t.propertyName] = "", delete e.clean[o]), o in e.onEnd) {
          var n = e.onEnd[o];
          n.call(this), delete e.onEnd[o];
        }

        this.emitEvent("transitionEnd", [this]);
      }
    }, a.prototype.disableTransition = function () {
      this.removeTransitionStyles(), this.element.removeEventListener(d, this, !1), this.isTransitioning = !1;
    }, a.prototype._removeStyles = function (t) {
      var e = {};

      for (var i in t) {
        e[i] = "";
      }

      this.css(e);
    };
    var v = {
      transitionProperty: "",
      transitionDuration: ""
    };
    return a.prototype.removeTransitionStyles = function () {
      this.css(v);
    }, a.prototype.removeElem = function () {
      this.element.parentNode.removeChild(this.element), this.emitEvent("remove", [this]);
    }, a.prototype.remove = function () {
      if (!u || !parseFloat(this.layout.options.transitionDuration)) return this.removeElem(), void 0;
      var t = this;
      this.on("transitionEnd", function () {
        return t.removeElem(), !0;
      }), this.hide();
    }, a.prototype.reveal = function () {
      delete this.isHidden, this.css({
        display: ""
      });
      var t = this.layout.options;
      this.transition({
        from: t.hiddenStyle,
        to: t.visibleStyle,
        isCleaning: !0
      });
    }, a.prototype.hide = function () {
      this.isHidden = !0, this.css({
        display: ""
      });
      var t = this.layout.options;
      this.transition({
        from: t.visibleStyle,
        to: t.hiddenStyle,
        isCleaning: !0,
        onTransitionEnd: {
          opacity: function opacity() {
            this.isHidden && this.css({
              display: "none"
            });
          }
        }
      });
    }, a.prototype.destroy = function () {
      this.css({
        position: "",
        left: "",
        right: "",
        top: "",
        bottom: "",
        transition: "",
        transform: ""
      });
    }, a;
  }

  var r = t.getComputedStyle,
      s = r ? function (t) {
    return r(t, null);
  } : function (t) {
    return t.currentStyle;
  };
  "function" == typeof define && define.amd ? define("outlayer/item", ["eventEmitter/EventEmitter", "get-size/get-size", "get-style-property/get-style-property"], n) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = n(require("wolfy87-eventemitter"), require("get-size"), require("desandro-get-style-property")) : (t.Outlayer = {}, t.Outlayer.Item = n(t.EventEmitter, t.getSize, t.getStyleProperty));
}(window), function (t) {
  function e(t, e) {
    for (var i in e) {
      t[i] = e[i];
    }

    return t;
  }

  function i(t) {
    return "[object Array]" === f.call(t);
  }

  function o(t) {
    var e = [];
    if (i(t)) e = t;else if (t && "number" == typeof t.length) for (var o = 0, n = t.length; n > o; o++) {
      e.push(t[o]);
    } else e.push(t);
    return e;
  }

  function n(t, e) {
    var i = l(e, t);
    -1 !== i && e.splice(i, 1);
  }

  function r(t) {
    return t.replace(/(.)([A-Z])/g, function (t, e, i) {
      return e + "-" + i;
    }).toLowerCase();
  }

  function s(i, s, f, l, c, y) {
    function m(t, i) {
      if ("string" == typeof t && (t = a.querySelector(t)), !t || !d(t)) return u && u.error("Bad " + this.constructor.namespace + " element: " + t), void 0;
      this.element = t, this.options = e({}, this.constructor.defaults), this.option(i);
      var o = ++g;
      this.element.outlayerGUID = o, v[o] = this, this._create(), this.options.isInitLayout && this.layout();
    }

    var g = 0,
        v = {};
    return m.namespace = "outlayer", m.Item = y, m.defaults = {
      containerStyle: {
        position: "relative"
      },
      isInitLayout: !0,
      isOriginLeft: !0,
      isOriginTop: !0,
      isResizeBound: !0,
      isResizingContainer: !0,
      transitionDuration: "0.4s",
      hiddenStyle: {
        opacity: 0,
        transform: "scale(0.001)"
      },
      visibleStyle: {
        opacity: 1,
        transform: "scale(1)"
      }
    }, e(m.prototype, f.prototype), m.prototype.option = function (t) {
      e(this.options, t);
    }, m.prototype._create = function () {
      this.reloadItems(), this.stamps = [], this.stamp(this.options.stamp), e(this.element.style, this.options.containerStyle), this.options.isResizeBound && this.bindResize();
    }, m.prototype.reloadItems = function () {
      this.items = this._itemize(this.element.children);
    }, m.prototype._itemize = function (t) {
      for (var e = this._filterFindItemElements(t), i = this.constructor.Item, o = [], n = 0, r = e.length; r > n; n++) {
        var s = e[n],
            a = new i(s, this);
        o.push(a);
      }

      return o;
    }, m.prototype._filterFindItemElements = function (t) {
      t = o(t);

      for (var e = this.options.itemSelector, i = [], n = 0, r = t.length; r > n; n++) {
        var s = t[n];
        if (d(s)) if (e) {
          c(s, e) && i.push(s);

          for (var a = s.querySelectorAll(e), u = 0, p = a.length; p > u; u++) {
            i.push(a[u]);
          }
        } else i.push(s);
      }

      return i;
    }, m.prototype.getItemElements = function () {
      for (var t = [], e = 0, i = this.items.length; i > e; e++) {
        t.push(this.items[e].element);
      }

      return t;
    }, m.prototype.layout = function () {
      this._resetLayout(), this._manageStamps();
      var t = void 0 !== this.options.isLayoutInstant ? this.options.isLayoutInstant : !this._isLayoutInited;
      this.layoutItems(this.items, t), this._isLayoutInited = !0;
    }, m.prototype._init = m.prototype.layout, m.prototype._resetLayout = function () {
      this.getSize();
    }, m.prototype.getSize = function () {
      this.size = l(this.element);
    }, m.prototype._getMeasurement = function (t, e) {
      var i,
          o = this.options[t];
      o ? ("string" == typeof o ? i = this.element.querySelector(o) : d(o) && (i = o), this[t] = i ? l(i)[e] : o) : this[t] = 0;
    }, m.prototype.layoutItems = function (t, e) {
      t = this._getItemsForLayout(t), this._layoutItems(t, e), this._postLayout();
    }, m.prototype._getItemsForLayout = function (t) {
      for (var e = [], i = 0, o = t.length; o > i; i++) {
        var n = t[i];
        n.isIgnored || e.push(n);
      }

      return e;
    }, m.prototype._layoutItems = function (t, e) {
      function i() {
        o.emitEvent("layoutComplete", [o, t]);
      }

      var o = this;
      if (!t || !t.length) return i(), void 0;

      this._itemsOn(t, "layout", i);

      for (var n = [], r = 0, s = t.length; s > r; r++) {
        var a = t[r],
            u = this._getItemLayoutPosition(a);

        u.item = a, u.isInstant = e || a.isLayoutInstant, n.push(u);
      }

      this._processLayoutQueue(n);
    }, m.prototype._getItemLayoutPosition = function () {
      return {
        x: 0,
        y: 0
      };
    }, m.prototype._processLayoutQueue = function (t) {
      for (var e = 0, i = t.length; i > e; e++) {
        var o = t[e];

        this._positionItem(o.item, o.x, o.y, o.isInstant);
      }
    }, m.prototype._positionItem = function (t, e, i, o) {
      o ? t.goTo(e, i) : t.moveTo(e, i);
    }, m.prototype._postLayout = function () {
      this.resizeContainer();
    }, m.prototype.resizeContainer = function () {
      if (this.options.isResizingContainer) {
        var t = this._getContainerSize();

        t && (this._setContainerMeasure(t.width, !0), this._setContainerMeasure(t.height, !1));
      }
    }, m.prototype._getContainerSize = h, m.prototype._setContainerMeasure = function (t, e) {
      if (void 0 !== t) {
        var i = this.size;
        i.isBorderBox && (t += e ? i.paddingLeft + i.paddingRight + i.borderLeftWidth + i.borderRightWidth : i.paddingBottom + i.paddingTop + i.borderTopWidth + i.borderBottomWidth), t = Math.max(t, 0), this.element.style[e ? "width" : "height"] = t + "px";
      }
    }, m.prototype._itemsOn = function (t, e, i) {
      function o() {
        return n++, n === r && i.call(s), !0;
      }

      for (var n = 0, r = t.length, s = this, a = 0, u = t.length; u > a; a++) {
        var p = t[a];
        p.on(e, o);
      }
    }, m.prototype.ignore = function (t) {
      var e = this.getItem(t);
      e && (e.isIgnored = !0);
    }, m.prototype.unignore = function (t) {
      var e = this.getItem(t);
      e && delete e.isIgnored;
    }, m.prototype.stamp = function (t) {
      if (t = this._find(t)) {
        this.stamps = this.stamps.concat(t);

        for (var e = 0, i = t.length; i > e; e++) {
          var o = t[e];
          this.ignore(o);
        }
      }
    }, m.prototype.unstamp = function (t) {
      if (t = this._find(t)) for (var e = 0, i = t.length; i > e; e++) {
        var o = t[e];
        n(o, this.stamps), this.unignore(o);
      }
    }, m.prototype._find = function (t) {
      return t ? ("string" == typeof t && (t = this.element.querySelectorAll(t)), t = o(t)) : void 0;
    }, m.prototype._manageStamps = function () {
      if (this.stamps && this.stamps.length) {
        this._getBoundingRect();

        for (var t = 0, e = this.stamps.length; e > t; t++) {
          var i = this.stamps[t];

          this._manageStamp(i);
        }
      }
    }, m.prototype._getBoundingRect = function () {
      var t = this.element.getBoundingClientRect(),
          e = this.size;
      this._boundingRect = {
        left: t.left + e.paddingLeft + e.borderLeftWidth,
        top: t.top + e.paddingTop + e.borderTopWidth,
        right: t.right - (e.paddingRight + e.borderRightWidth),
        bottom: t.bottom - (e.paddingBottom + e.borderBottomWidth)
      };
    }, m.prototype._manageStamp = h, m.prototype._getElementOffset = function (t) {
      var e = t.getBoundingClientRect(),
          i = this._boundingRect,
          o = l(t),
          n = {
        left: e.left - i.left - o.marginLeft,
        top: e.top - i.top - o.marginTop,
        right: i.right - e.right - o.marginRight,
        bottom: i.bottom - e.bottom - o.marginBottom
      };
      return n;
    }, m.prototype.handleEvent = function (t) {
      var e = "on" + t.type;
      this[e] && this[e](t);
    }, m.prototype.bindResize = function () {
      this.isResizeBound || (i.bind(t, "resize", this), this.isResizeBound = !0);
    }, m.prototype.unbindResize = function () {
      this.isResizeBound && i.unbind(t, "resize", this), this.isResizeBound = !1;
    }, m.prototype.onresize = function () {
      function t() {
        e.resize(), delete e.resizeTimeout;
      }

      this.resizeTimeout && clearTimeout(this.resizeTimeout);
      var e = this;
      this.resizeTimeout = setTimeout(t, 100);
    }, m.prototype.resize = function () {
      this.isResizeBound && this.needsResizeLayout() && this.layout();
    }, m.prototype.needsResizeLayout = function () {
      var t = l(this.element),
          e = this.size && t;
      return e && t.innerWidth !== this.size.innerWidth;
    }, m.prototype.addItems = function (t) {
      var e = this._itemize(t);

      return e.length && (this.items = this.items.concat(e)), e;
    }, m.prototype.appended = function (t) {
      var e = this.addItems(t);
      e.length && (this.layoutItems(e, !0), this.reveal(e));
    }, m.prototype.prepended = function (t) {
      var e = this._itemize(t);

      if (e.length) {
        var i = this.items.slice(0);
        this.items = e.concat(i), this._resetLayout(), this._manageStamps(), this.layoutItems(e, !0), this.reveal(e), this.layoutItems(i);
      }
    }, m.prototype.reveal = function (t) {
      var e = t && t.length;
      if (e) for (var i = 0; e > i; i++) {
        var o = t[i];
        o.reveal();
      }
    }, m.prototype.hide = function (t) {
      var e = t && t.length;
      if (e) for (var i = 0; e > i; i++) {
        var o = t[i];
        o.hide();
      }
    }, m.prototype.getItem = function (t) {
      for (var e = 0, i = this.items.length; i > e; e++) {
        var o = this.items[e];
        if (o.element === t) return o;
      }
    }, m.prototype.getItems = function (t) {
      if (t && t.length) {
        for (var e = [], i = 0, o = t.length; o > i; i++) {
          var n = t[i],
              r = this.getItem(n);
          r && e.push(r);
        }

        return e;
      }
    }, m.prototype.remove = function (t) {
      t = o(t);
      var e = this.getItems(t);

      if (e && e.length) {
        this._itemsOn(e, "remove", function () {
          this.emitEvent("removeComplete", [this, e]);
        });

        for (var i = 0, r = e.length; r > i; i++) {
          var s = e[i];
          s.remove(), n(s, this.items);
        }
      }
    }, m.prototype.destroy = function () {
      var t = this.element.style;
      t.height = "", t.position = "", t.width = "";

      for (var e = 0, i = this.items.length; i > e; e++) {
        var o = this.items[e];
        o.destroy();
      }

      this.unbindResize();
      var n = this.element.outlayerGUID;
      delete v[n], delete this.element.outlayerGUID, p && p.removeData(this.element, this.constructor.namespace);
    }, m.data = function (t) {
      var e = t && t.outlayerGUID;
      return e && v[e];
    }, m.create = function (t, i) {
      function o() {
        m.apply(this, arguments);
      }

      return Object.create ? o.prototype = Object.create(m.prototype) : e(o.prototype, m.prototype), o.prototype.constructor = o, o.defaults = e({}, m.defaults), e(o.defaults, i), o.prototype.settings = {}, o.namespace = t, o.data = m.data, o.Item = function () {
        y.apply(this, arguments);
      }, o.Item.prototype = new y(), s(function () {
        for (var e = r(t), i = a.querySelectorAll(".js-" + e), n = "data-" + e + "-options", s = 0, h = i.length; h > s; s++) {
          var f,
              d = i[s],
              l = d.getAttribute(n);

          try {
            f = l && JSON.parse(l);
          } catch (c) {
            u && u.error("Error parsing " + n + " on " + d.nodeName.toLowerCase() + (d.id ? "#" + d.id : "") + ": " + c);
            continue;
          }

          var y = new o(d, f);
          p && p.data(d, t, y);
        }
      }), p && p.bridget && p.bridget(t, o), o;
    }, m.Item = y, m;
  }

  var a = t.document,
      u = t.console,
      p = t.jQuery,
      h = function h() {},
      f = Object.prototype.toString,
      d = "function" == typeof HTMLElement || "object" == (typeof HTMLElement === "undefined" ? "undefined" : _typeof(HTMLElement)) ? function (t) {
    return t instanceof HTMLElement;
  } : function (t) {
    return t && "object" == _typeof(t) && 1 === t.nodeType && "string" == typeof t.nodeName;
  },
      l = Array.prototype.indexOf ? function (t, e) {
    return t.indexOf(e);
  } : function (t, e) {
    for (var i = 0, o = t.length; o > i; i++) {
      if (t[i] === e) return i;
    }

    return -1;
  };

  "function" == typeof define && define.amd ? define("outlayer/outlayer", ["eventie/eventie", "doc-ready/doc-ready", "eventEmitter/EventEmitter", "get-size/get-size", "matches-selector/matches-selector", "./item"], s) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = s(require("eventie"), require("doc-ready"), require("wolfy87-eventemitter"), require("get-size"), require("desandro-matches-selector"), require("./item")) : t.Outlayer = s(t.eventie, t.docReady, t.EventEmitter, t.getSize, t.matchesSelector, t.Outlayer.Item);
}(window), function (t) {
  function e(t) {
    function e() {
      t.Item.apply(this, arguments);
    }

    e.prototype = new t.Item(), e.prototype._create = function () {
      this.id = this.layout.itemGUID++, t.Item.prototype._create.call(this), this.sortData = {};
    }, e.prototype.updateSortData = function () {
      if (!this.isIgnored) {
        this.sortData.id = this.id, this.sortData["original-order"] = this.id, this.sortData.random = Math.random();
        var t = this.layout.options.getSortData,
            e = this.layout._sorters;

        for (var i in t) {
          var o = e[i];
          this.sortData[i] = o(this.element, this);
        }
      }
    };
    var i = e.prototype.destroy;
    return e.prototype.destroy = function () {
      i.apply(this, arguments), this.css({
        display: ""
      });
    }, e;
  }

  "function" == typeof define && define.amd ? define("isotope/js/item", ["outlayer/outlayer"], e) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = e(require("outlayer")) : (t.Isotope = t.Isotope || {}, t.Isotope.Item = e(t.Outlayer));
}(window), function (t) {
  function e(t, e) {
    function i(t) {
      this.isotope = t, t && (this.options = t.options[this.namespace], this.element = t.element, this.items = t.filteredItems, this.size = t.size);
    }

    return function () {
      function t(t) {
        return function () {
          return e.prototype[t].apply(this.isotope, arguments);
        };
      }

      for (var o = ["_resetLayout", "_getItemLayoutPosition", "_manageStamp", "_getContainerSize", "_getElementOffset", "needsResizeLayout"], n = 0, r = o.length; r > n; n++) {
        var s = o[n];
        i.prototype[s] = t(s);
      }
    }(), i.prototype.needsVerticalResizeLayout = function () {
      var e = t(this.isotope.element),
          i = this.isotope.size && e;
      return i && e.innerHeight !== this.isotope.size.innerHeight;
    }, i.prototype._getMeasurement = function () {
      this.isotope._getMeasurement.apply(this, arguments);
    }, i.prototype.getColumnWidth = function () {
      this.getSegmentSize("column", "Width");
    }, i.prototype.getRowHeight = function () {
      this.getSegmentSize("row", "Height");
    }, i.prototype.getSegmentSize = function (t, e) {
      var i = t + e,
          o = "outer" + e;

      if (this._getMeasurement(i, o), !this[i]) {
        var n = this.getFirstItemSize();
        this[i] = n && n[o] || this.isotope.size["inner" + e];
      }
    }, i.prototype.getFirstItemSize = function () {
      var e = this.isotope.filteredItems[0];
      return e && e.element && t(e.element);
    }, i.prototype.layout = function () {
      this.isotope.layout.apply(this.isotope, arguments);
    }, i.prototype.getSize = function () {
      this.isotope.getSize(), this.size = this.isotope.size;
    }, i.modes = {}, i.create = function (t, e) {
      function o() {
        i.apply(this, arguments);
      }

      return o.prototype = new i(), e && (o.options = e), o.prototype.namespace = t, i.modes[t] = o, o;
    }, i;
  }

  "function" == typeof define && define.amd ? define("isotope/js/layout-mode", ["get-size/get-size", "outlayer/outlayer"], e) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = e(require("get-size"), require("outlayer")) : (t.Isotope = t.Isotope || {}, t.Isotope.LayoutMode = e(t.getSize, t.Outlayer));
}(window), function (t) {
  function e(t, e) {
    var o = t.create("masonry");
    return o.prototype._resetLayout = function () {
      this.getSize(), this._getMeasurement("columnWidth", "outerWidth"), this._getMeasurement("gutter", "outerWidth"), this.measureColumns();
      var t = this.cols;

      for (this.colYs = []; t--;) {
        this.colYs.push(0);
      }

      this.maxY = 0;
    }, o.prototype.measureColumns = function () {
      if (this.getContainerWidth(), !this.columnWidth) {
        var t = this.items[0],
            i = t && t.element;
        this.columnWidth = i && e(i).outerWidth || this.containerWidth;
      }

      this.columnWidth += this.gutter, this.cols = Math.floor((this.containerWidth + this.gutter) / this.columnWidth), this.cols = Math.max(this.cols, 1);
    }, o.prototype.getContainerWidth = function () {
      var t = this.options.isFitWidth ? this.element.parentNode : this.element,
          i = e(t);
      this.containerWidth = i && i.innerWidth;
    }, o.prototype._getItemLayoutPosition = function (t) {
      t.getSize();
      var e = t.size.outerWidth % this.columnWidth,
          o = e && 1 > e ? "round" : "ceil",
          n = Math[o](t.size.outerWidth / this.columnWidth);
      n = Math.min(n, this.cols);

      for (var r = this._getColGroup(n), s = Math.min.apply(Math, r), a = i(r, s), u = {
        x: this.columnWidth * a,
        y: s
      }, p = s + t.size.outerHeight, h = this.cols + 1 - r.length, f = 0; h > f; f++) {
        this.colYs[a + f] = p;
      }

      return u;
    }, o.prototype._getColGroup = function (t) {
      if (2 > t) return this.colYs;

      for (var e = [], i = this.cols + 1 - t, o = 0; i > o; o++) {
        var n = this.colYs.slice(o, o + t);
        e[o] = Math.max.apply(Math, n);
      }

      return e;
    }, o.prototype._manageStamp = function (t) {
      var i = e(t),
          o = this._getElementOffset(t),
          n = this.options.isOriginLeft ? o.left : o.right,
          r = n + i.outerWidth,
          s = Math.floor(n / this.columnWidth);

      s = Math.max(0, s);
      var a = Math.floor(r / this.columnWidth);
      a -= r % this.columnWidth ? 0 : 1, a = Math.min(this.cols - 1, a);

      for (var u = (this.options.isOriginTop ? o.top : o.bottom) + i.outerHeight, p = s; a >= p; p++) {
        this.colYs[p] = Math.max(u, this.colYs[p]);
      }
    }, o.prototype._getContainerSize = function () {
      this.maxY = Math.max.apply(Math, this.colYs);
      var t = {
        height: this.maxY
      };
      return this.options.isFitWidth && (t.width = this._getContainerFitWidth()), t;
    }, o.prototype._getContainerFitWidth = function () {
      for (var t = 0, e = this.cols; --e && 0 === this.colYs[e];) {
        t++;
      }

      return (this.cols - t) * this.columnWidth - this.gutter;
    }, o.prototype.needsResizeLayout = function () {
      var t = this.containerWidth;
      return this.getContainerWidth(), t !== this.containerWidth;
    }, o;
  }

  var i = Array.prototype.indexOf ? function (t, e) {
    return t.indexOf(e);
  } : function (t, e) {
    for (var i = 0, o = t.length; o > i; i++) {
      var n = t[i];
      if (n === e) return i;
    }

    return -1;
  };
  "function" == typeof define && define.amd ? define("masonry/masonry", ["outlayer/outlayer", "get-size/get-size"], e) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = e(require("outlayer"), require("get-size")) : t.Masonry = e(t.Outlayer, t.getSize);
}(window), function (t) {
  function e(t, e) {
    for (var i in e) {
      t[i] = e[i];
    }

    return t;
  }

  function i(t, i) {
    var o = t.create("masonry"),
        n = o.prototype._getElementOffset,
        r = o.prototype.layout,
        s = o.prototype._getMeasurement;
    e(o.prototype, i.prototype), o.prototype._getElementOffset = n, o.prototype.layout = r, o.prototype._getMeasurement = s;
    var a = o.prototype.measureColumns;

    o.prototype.measureColumns = function () {
      this.items = this.isotope.filteredItems, a.call(this);
    };

    var u = o.prototype._manageStamp;
    return o.prototype._manageStamp = function () {
      this.options.isOriginLeft = this.isotope.options.isOriginLeft, this.options.isOriginTop = this.isotope.options.isOriginTop, u.apply(this, arguments);
    }, o;
  }

  "function" == typeof define && define.amd ? define("isotope/js/layout-modes/masonry", ["../layout-mode", "masonry/masonry"], i) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = i(require("../layout-mode"), require("masonry-layout")) : i(t.Isotope.LayoutMode, t.Masonry);
}(window), function (t) {
  function e(t) {
    var e = t.create("fitRows");
    return e.prototype._resetLayout = function () {
      this.x = 0, this.y = 0, this.maxY = 0, this._getMeasurement("gutter", "outerWidth");
    }, e.prototype._getItemLayoutPosition = function (t) {
      t.getSize();
      var e = t.size.outerWidth + this.gutter,
          i = this.isotope.size.innerWidth + this.gutter;
      0 !== this.x && e + this.x > i && (this.x = 0, this.y = this.maxY);
      var o = {
        x: this.x,
        y: this.y
      };
      return this.maxY = Math.max(this.maxY, this.y + t.size.outerHeight), this.x += e, o;
    }, e.prototype._getContainerSize = function () {
      return {
        height: this.maxY
      };
    }, e;
  }

  "function" == typeof define && define.amd ? define("isotope/js/layout-modes/fit-rows", ["../layout-mode"], e) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = e(require("../layout-mode")) : e(t.Isotope.LayoutMode);
}(window), function (t) {
  function e(t) {
    var e = t.create("vertical", {
      horizontalAlignment: 0
    });
    return e.prototype._resetLayout = function () {
      this.y = 0;
    }, e.prototype._getItemLayoutPosition = function (t) {
      t.getSize();
      var e = (this.isotope.size.innerWidth - t.size.outerWidth) * this.options.horizontalAlignment,
          i = this.y;
      return this.y += t.size.outerHeight, {
        x: e,
        y: i
      };
    }, e.prototype._getContainerSize = function () {
      return {
        height: this.y
      };
    }, e;
  }

  "function" == typeof define && define.amd ? define("isotope/js/layout-modes/vertical", ["../layout-mode"], e) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = e(require("../layout-mode")) : e(t.Isotope.LayoutMode);
}(window), function (t) {
  function e(t, e) {
    for (var i in e) {
      t[i] = e[i];
    }

    return t;
  }

  function i(t) {
    return "[object Array]" === h.call(t);
  }

  function o(t) {
    var e = [];
    if (i(t)) e = t;else if (t && "number" == typeof t.length) for (var o = 0, n = t.length; n > o; o++) {
      e.push(t[o]);
    } else e.push(t);
    return e;
  }

  function n(t, e) {
    var i = f(e, t);
    -1 !== i && e.splice(i, 1);
  }

  function r(t, i, r, u, h) {
    function f(t, e) {
      return function (i, o) {
        for (var n = 0, r = t.length; r > n; n++) {
          var s = t[n],
              a = i.sortData[s],
              u = o.sortData[s];

          if (a > u || u > a) {
            var p = void 0 !== e[s] ? e[s] : e,
                h = p ? 1 : -1;
            return (a > u ? 1 : -1) * h;
          }
        }

        return 0;
      };
    }

    var d = t.create("isotope", {
      layoutMode: "masonry",
      isJQueryFiltering: !0,
      sortAscending: !0
    });
    d.Item = u, d.LayoutMode = h, d.prototype._create = function () {
      this.itemGUID = 0, this._sorters = {}, this._getSorters(), t.prototype._create.call(this), this.modes = {}, this.filteredItems = this.items, this.sortHistory = ["original-order"];

      for (var e in h.modes) {
        this._initLayoutMode(e);
      }
    }, d.prototype.reloadItems = function () {
      this.itemGUID = 0, t.prototype.reloadItems.call(this);
    }, d.prototype._itemize = function () {
      for (var e = t.prototype._itemize.apply(this, arguments), i = 0, o = e.length; o > i; i++) {
        var n = e[i];
        n.id = this.itemGUID++;
      }

      return this._updateItemsSortData(e), e;
    }, d.prototype._initLayoutMode = function (t) {
      var i = h.modes[t],
          o = this.options[t] || {};
      this.options[t] = i.options ? e(i.options, o) : o, this.modes[t] = new i(this);
    }, d.prototype.layout = function () {
      return !this._isLayoutInited && this.options.isInitLayout ? (this.arrange(), void 0) : (this._layout(), void 0);
    }, d.prototype._layout = function () {
      var t = this._getIsInstant();

      this._resetLayout(), this._manageStamps(), this.layoutItems(this.filteredItems, t), this._isLayoutInited = !0;
    }, d.prototype.arrange = function (t) {
      this.option(t), this._getIsInstant(), this.filteredItems = this._filter(this.items), this._sort(), this._layout();
    }, d.prototype._init = d.prototype.arrange, d.prototype._getIsInstant = function () {
      var t = void 0 !== this.options.isLayoutInstant ? this.options.isLayoutInstant : !this._isLayoutInited;
      return this._isInstant = t, t;
    }, d.prototype._filter = function (t) {
      function e() {
        f.reveal(n), f.hide(r);
      }

      var i = this.options.filter;
      i = i || "*";

      for (var o = [], n = [], r = [], s = this._getFilterTest(i), a = 0, u = t.length; u > a; a++) {
        var p = t[a];

        if (!p.isIgnored) {
          var h = s(p);
          h && o.push(p), h && p.isHidden ? n.push(p) : h || p.isHidden || r.push(p);
        }
      }

      var f = this;
      return this._isInstant ? this._noTransition(e) : e(), o;
    }, d.prototype._getFilterTest = function (t) {
      return s && this.options.isJQueryFiltering ? function (e) {
        return s(e.element).is(t);
      } : "function" == typeof t ? function (e) {
        return t(e.element);
      } : function (e) {
        return r(e.element, t);
      };
    }, d.prototype.updateSortData = function (t) {
      var e;
      t ? (t = o(t), e = this.getItems(t)) : e = this.items, this._getSorters(), this._updateItemsSortData(e);
    }, d.prototype._getSorters = function () {
      var t = this.options.getSortData;

      for (var e in t) {
        var i = t[e];
        this._sorters[e] = l(i);
      }
    }, d.prototype._updateItemsSortData = function (t) {
      for (var e = t && t.length, i = 0; e && e > i; i++) {
        var o = t[i];
        o.updateSortData();
      }
    };

    var l = function () {
      function t(t) {
        if ("string" != typeof t) return t;
        var i = a(t).split(" "),
            o = i[0],
            n = o.match(/^\[(.+)\]$/),
            r = n && n[1],
            s = e(r, o),
            u = d.sortDataParsers[i[1]];
        return t = u ? function (t) {
          return t && u(s(t));
        } : function (t) {
          return t && s(t);
        };
      }

      function e(t, e) {
        var i;
        return i = t ? function (e) {
          return e.getAttribute(t);
        } : function (t) {
          var i = t.querySelector(e);
          return i && p(i);
        };
      }

      return t;
    }();

    d.sortDataParsers = {
      parseInt: function (_parseInt) {
        function parseInt(_x) {
          return _parseInt.apply(this, arguments);
        }

        parseInt.toString = function () {
          return _parseInt.toString();
        };

        return parseInt;
      }(function (t) {
        return parseInt(t, 10);
      }),
      parseFloat: function (_parseFloat) {
        function parseFloat(_x2) {
          return _parseFloat.apply(this, arguments);
        }

        parseFloat.toString = function () {
          return _parseFloat.toString();
        };

        return parseFloat;
      }(function (t) {
        return parseFloat(t);
      })
    }, d.prototype._sort = function () {
      var t = this.options.sortBy;

      if (t) {
        var e = [].concat.apply(t, this.sortHistory),
            i = f(e, this.options.sortAscending);
        this.filteredItems.sort(i), t !== this.sortHistory[0] && this.sortHistory.unshift(t);
      }
    }, d.prototype._mode = function () {
      var t = this.options.layoutMode,
          e = this.modes[t];
      if (!e) throw Error("No layout mode: " + t);
      return e.options = this.options[t], e;
    }, d.prototype._resetLayout = function () {
      t.prototype._resetLayout.call(this), this._mode()._resetLayout();
    }, d.prototype._getItemLayoutPosition = function (t) {
      return this._mode()._getItemLayoutPosition(t);
    }, d.prototype._manageStamp = function (t) {
      this._mode()._manageStamp(t);
    }, d.prototype._getContainerSize = function () {
      return this._mode()._getContainerSize();
    }, d.prototype.needsResizeLayout = function () {
      return this._mode().needsResizeLayout();
    }, d.prototype.appended = function (t) {
      var e = this.addItems(t);

      if (e.length) {
        var i = this._filterRevealAdded(e);

        this.filteredItems = this.filteredItems.concat(i);
      }
    }, d.prototype.prepended = function (t) {
      var e = this._itemize(t);

      if (e.length) {
        var i = this.items.slice(0);
        this.items = e.concat(i), this._resetLayout(), this._manageStamps();

        var o = this._filterRevealAdded(e);

        this.layoutItems(i), this.filteredItems = o.concat(this.filteredItems);
      }
    }, d.prototype._filterRevealAdded = function (t) {
      var e = this._noTransition(function () {
        return this._filter(t);
      });

      return this.layoutItems(e, !0), this.reveal(e), t;
    }, d.prototype.insert = function (t) {
      var e = this.addItems(t);

      if (e.length) {
        var i,
            o,
            n = e.length;

        for (i = 0; n > i; i++) {
          o = e[i], this.element.appendChild(o.element);
        }

        var r = this._filter(e);

        for (this._noTransition(function () {
          this.hide(r);
        }), i = 0; n > i; i++) {
          e[i].isLayoutInstant = !0;
        }

        for (this.arrange(), i = 0; n > i; i++) {
          delete e[i].isLayoutInstant;
        }

        this.reveal(r);
      }
    };
    var c = d.prototype.remove;
    return d.prototype.remove = function (t) {
      t = o(t);
      var e = this.getItems(t);
      if (c.call(this, t), e && e.length) for (var i = 0, r = e.length; r > i; i++) {
        var s = e[i];
        n(s, this.filteredItems);
      }
    }, d.prototype.shuffle = function () {
      for (var t = 0, e = this.items.length; e > t; t++) {
        var i = this.items[t];
        i.sortData.random = Math.random();
      }

      this.options.sortBy = "random", this._sort(), this._layout();
    }, d.prototype._noTransition = function (t) {
      var e = this.options.transitionDuration;
      this.options.transitionDuration = 0;
      var i = t.call(this);
      return this.options.transitionDuration = e, i;
    }, d.prototype.getFilteredItemElements = function () {
      for (var t = [], e = 0, i = this.filteredItems.length; i > e; e++) {
        t.push(this.filteredItems[e].element);
      }

      return t;
    }, d;
  }

  var s = t.jQuery,
      a = String.prototype.trim ? function (t) {
    return t.trim();
  } : function (t) {
    return t.replace(/^\s+|\s+$/g, "");
  },
      u = document.documentElement,
      p = u.textContent ? function (t) {
    return t.textContent;
  } : function (t) {
    return t.innerText;
  },
      h = Object.prototype.toString,
      f = Array.prototype.indexOf ? function (t, e) {
    return t.indexOf(e);
  } : function (t, e) {
    for (var i = 0, o = t.length; o > i; i++) {
      if (t[i] === e) return i;
    }

    return -1;
  };
  "function" == typeof define && define.amd ? define(["outlayer/outlayer", "get-size/get-size", "matches-selector/matches-selector", "isotope/js/item", "isotope/js/layout-mode", "isotope/js/layout-modes/masonry", "isotope/js/layout-modes/fit-rows", "isotope/js/layout-modes/vertical"], r) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = r(require("outlayer"), require("get-size"), require("desandro-matches-selector"), require("./item"), require("./layout-mode"), require("./layout-modes/masonry"), require("./layout-modes/fit-rows"), require("./layout-modes/vertical")) : t.Isotope = r(t.Outlayer, t.getSize, t.matchesSelector, t.Isotope.Item, t.Isotope.LayoutMode);
}(window);
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Owl Carousel v2.3.4
 * Copyright 2013-2018 David Deutsch
 * Licensed under: SEE LICENSE IN https://github.com/OwlCarousel2/OwlCarousel2/blob/master/LICENSE
 */
!function (a, b, c, d) {
  function e(b, c) {
    this.settings = null, this.options = a.extend({}, e.Defaults, c), this.$element = a(b), this._handlers = {}, this._plugins = {}, this._supress = {}, this._current = null, this._speed = null, this._coordinates = [], this._breakpoint = null, this._width = null, this._items = [], this._clones = [], this._mergers = [], this._widths = [], this._invalidated = {}, this._pipe = [], this._drag = {
      time: null,
      target: null,
      pointer: null,
      stage: {
        start: null,
        current: null
      },
      direction: null
    }, this._states = {
      current: {},
      tags: {
        initializing: ["busy"],
        animating: ["busy"],
        dragging: ["interacting"]
      }
    }, a.each(["onResize", "onThrottledResize"], a.proxy(function (b, c) {
      this._handlers[c] = a.proxy(this[c], this);
    }, this)), a.each(e.Plugins, a.proxy(function (a, b) {
      this._plugins[a.charAt(0).toLowerCase() + a.slice(1)] = new b(this);
    }, this)), a.each(e.Workers, a.proxy(function (b, c) {
      this._pipe.push({
        filter: c.filter,
        run: a.proxy(c.run, this)
      });
    }, this)), this.setup(), this.initialize();
  }

  e.Defaults = {
    items: 3,
    loop: !1,
    center: !1,
    rewind: !1,
    checkVisibility: !0,
    mouseDrag: !0,
    touchDrag: !0,
    pullDrag: !0,
    freeDrag: !1,
    margin: 0,
    stagePadding: 0,
    merge: !1,
    mergeFit: !0,
    autoWidth: !1,
    startPosition: 0,
    rtl: !1,
    smartSpeed: 250,
    fluidSpeed: !1,
    dragEndSpeed: !1,
    responsive: {},
    responsiveRefreshRate: 200,
    responsiveBaseElement: b,
    fallbackEasing: "swing",
    slideTransition: "",
    info: !1,
    nestedItemSelector: !1,
    itemElement: "div",
    stageElement: "div",
    refreshClass: "owl-refresh",
    loadedClass: "owl-loaded",
    loadingClass: "owl-loading",
    rtlClass: "owl-rtl",
    responsiveClass: "owl-responsive",
    dragClass: "owl-drag",
    itemClass: "owl-item",
    stageClass: "owl-stage",
    stageOuterClass: "owl-stage-outer",
    grabClass: "owl-grab"
  }, e.Width = {
    Default: "default",
    Inner: "inner",
    Outer: "outer"
  }, e.Type = {
    Event: "event",
    State: "state"
  }, e.Plugins = {}, e.Workers = [{
    filter: ["width", "settings"],
    run: function run() {
      this._width = this.$element.width();
    }
  }, {
    filter: ["width", "items", "settings"],
    run: function run(a) {
      a.current = this._items && this._items[this.relative(this._current)];
    }
  }, {
    filter: ["items", "settings"],
    run: function run() {
      this.$stage.children(".cloned").remove();
    }
  }, {
    filter: ["width", "items", "settings"],
    run: function run(a) {
      var b = this.settings.margin || "",
          c = !this.settings.autoWidth,
          d = this.settings.rtl,
          e = {
        width: "auto",
        "margin-left": d ? b : "",
        "margin-right": d ? "" : b
      };
      !c && this.$stage.children().css(e), a.css = e;
    }
  }, {
    filter: ["width", "items", "settings"],
    run: function run(a) {
      var b = (this.width() / this.settings.items).toFixed(3) - this.settings.margin,
          c = null,
          d = this._items.length,
          e = !this.settings.autoWidth,
          f = [];

      for (a.items = {
        merge: !1,
        width: b
      }; d--;) {
        c = this._mergers[d], c = this.settings.mergeFit && Math.min(c, this.settings.items) || c, a.items.merge = c > 1 || a.items.merge, f[d] = e ? b * c : this._items[d].width();
      }

      this._widths = f;
    }
  }, {
    filter: ["items", "settings"],
    run: function run() {
      var b = [],
          c = this._items,
          d = this.settings,
          e = Math.max(2 * d.items, 4),
          f = 2 * Math.ceil(c.length / 2),
          g = d.loop && c.length ? d.rewind ? e : Math.max(e, f) : 0,
          h = "",
          i = "";

      for (g /= 2; g > 0;) {
        b.push(this.normalize(b.length / 2, !0)), h += c[b[b.length - 1]][0].outerHTML, b.push(this.normalize(c.length - 1 - (b.length - 1) / 2, !0)), i = c[b[b.length - 1]][0].outerHTML + i, g -= 1;
      }

      this._clones = b, a(h).addClass("cloned").appendTo(this.$stage), a(i).addClass("cloned").prependTo(this.$stage);
    }
  }, {
    filter: ["width", "items", "settings"],
    run: function run() {
      for (var a = this.settings.rtl ? 1 : -1, b = this._clones.length + this._items.length, c = -1, d = 0, e = 0, f = []; ++c < b;) {
        d = f[c - 1] || 0, e = this._widths[this.relative(c)] + this.settings.margin, f.push(d + e * a);
      }

      this._coordinates = f;
    }
  }, {
    filter: ["width", "items", "settings"],
    run: function run() {
      var a = this.settings.stagePadding,
          b = this._coordinates,
          c = {
        width: Math.ceil(Math.abs(b[b.length - 1])) + 2 * a,
        "padding-left": a || "",
        "padding-right": a || ""
      };
      this.$stage.css(c);
    }
  }, {
    filter: ["width", "items", "settings"],
    run: function run(a) {
      var b = this._coordinates.length,
          c = !this.settings.autoWidth,
          d = this.$stage.children();
      if (c && a.items.merge) for (; b--;) {
        a.css.width = this._widths[this.relative(b)], d.eq(b).css(a.css);
      } else c && (a.css.width = a.items.width, d.css(a.css));
    }
  }, {
    filter: ["items"],
    run: function run() {
      this._coordinates.length < 1 && this.$stage.removeAttr("style");
    }
  }, {
    filter: ["width", "items", "settings"],
    run: function run(a) {
      a.current = a.current ? this.$stage.children().index(a.current) : 0, a.current = Math.max(this.minimum(), Math.min(this.maximum(), a.current)), this.reset(a.current);
    }
  }, {
    filter: ["position"],
    run: function run() {
      this.animate(this.coordinates(this._current));
    }
  }, {
    filter: ["width", "position", "items", "settings"],
    run: function run() {
      var a,
          b,
          c,
          d,
          e = this.settings.rtl ? 1 : -1,
          f = 2 * this.settings.stagePadding,
          g = this.coordinates(this.current()) + f,
          h = g + this.width() * e,
          i = [];

      for (c = 0, d = this._coordinates.length; c < d; c++) {
        a = this._coordinates[c - 1] || 0, b = Math.abs(this._coordinates[c]) + f * e, (this.op(a, "<=", g) && this.op(a, ">", h) || this.op(b, "<", g) && this.op(b, ">", h)) && i.push(c);
      }

      this.$stage.children(".active").removeClass("active"), this.$stage.children(":eq(" + i.join("), :eq(") + ")").addClass("active"), this.$stage.children(".center").removeClass("center"), this.settings.center && this.$stage.children().eq(this.current()).addClass("center");
    }
  }], e.prototype.initializeStage = function () {
    this.$stage = this.$element.find("." + this.settings.stageClass), this.$stage.length || (this.$element.addClass(this.options.loadingClass), this.$stage = a("<" + this.settings.stageElement + ">", {
      class: this.settings.stageClass
    }).wrap(a("<div/>", {
      class: this.settings.stageOuterClass
    })), this.$element.append(this.$stage.parent()));
  }, e.prototype.initializeItems = function () {
    var b = this.$element.find(".owl-item");
    if (b.length) return this._items = b.get().map(function (b) {
      return a(b);
    }), this._mergers = this._items.map(function () {
      return 1;
    }), void this.refresh();
    this.replace(this.$element.children().not(this.$stage.parent())), this.isVisible() ? this.refresh() : this.invalidate("width"), this.$element.removeClass(this.options.loadingClass).addClass(this.options.loadedClass);
  }, e.prototype.initialize = function () {
    if (this.enter("initializing"), this.trigger("initialize"), this.$element.toggleClass(this.settings.rtlClass, this.settings.rtl), this.settings.autoWidth && !this.is("pre-loading")) {
      var a, b, c;
      a = this.$element.find("img"), b = this.settings.nestedItemSelector ? "." + this.settings.nestedItemSelector : d, c = this.$element.children(b).width(), a.length && c <= 0 && this.preloadAutoWidthImages(a);
    }

    this.initializeStage(), this.initializeItems(), this.registerEventHandlers(), this.leave("initializing"), this.trigger("initialized");
  }, e.prototype.isVisible = function () {
    return !this.settings.checkVisibility || this.$element.is(":visible");
  }, e.prototype.setup = function () {
    var b = this.viewport(),
        c = this.options.responsive,
        d = -1,
        e = null;
    c ? (a.each(c, function (a) {
      a <= b && a > d && (d = Number(a));
    }), e = a.extend({}, this.options, c[d]), "function" == typeof e.stagePadding && (e.stagePadding = e.stagePadding()), delete e.responsive, e.responsiveClass && this.$element.attr("class", this.$element.attr("class").replace(new RegExp("(" + this.options.responsiveClass + "-)\\S+\\s", "g"), "$1" + d))) : e = a.extend({}, this.options), this.trigger("change", {
      property: {
        name: "settings",
        value: e
      }
    }), this._breakpoint = d, this.settings = e, this.invalidate("settings"), this.trigger("changed", {
      property: {
        name: "settings",
        value: this.settings
      }
    });
  }, e.prototype.optionsLogic = function () {
    this.settings.autoWidth && (this.settings.stagePadding = !1, this.settings.merge = !1);
  }, e.prototype.prepare = function (b) {
    var c = this.trigger("prepare", {
      content: b
    });
    return c.data || (c.data = a("<" + this.settings.itemElement + "/>").addClass(this.options.itemClass).append(b)), this.trigger("prepared", {
      content: c.data
    }), c.data;
  }, e.prototype.update = function () {
    for (var b = 0, c = this._pipe.length, d = a.proxy(function (a) {
      return this[a];
    }, this._invalidated), e = {}; b < c;) {
      (this._invalidated.all || a.grep(this._pipe[b].filter, d).length > 0) && this._pipe[b].run(e), b++;
    }

    this._invalidated = {}, !this.is("valid") && this.enter("valid");
  }, e.prototype.width = function (a) {
    switch (a = a || e.Width.Default) {
      case e.Width.Inner:
      case e.Width.Outer:
        return this._width;

      default:
        return this._width - 2 * this.settings.stagePadding + this.settings.margin;
    }
  }, e.prototype.refresh = function () {
    this.enter("refreshing"), this.trigger("refresh"), this.setup(), this.optionsLogic(), this.$element.addClass(this.options.refreshClass), this.update(), this.$element.removeClass(this.options.refreshClass), this.leave("refreshing"), this.trigger("refreshed");
  }, e.prototype.onThrottledResize = function () {
    b.clearTimeout(this.resizeTimer), this.resizeTimer = b.setTimeout(this._handlers.onResize, this.settings.responsiveRefreshRate);
  }, e.prototype.onResize = function () {
    return !!this._items.length && this._width !== this.$element.width() && !!this.isVisible() && (this.enter("resizing"), this.trigger("resize").isDefaultPrevented() ? (this.leave("resizing"), !1) : (this.invalidate("width"), this.refresh(), this.leave("resizing"), void this.trigger("resized")));
  }, e.prototype.registerEventHandlers = function () {
    a.support.transition && this.$stage.on(a.support.transition.end + ".owl.core", a.proxy(this.onTransitionEnd, this)), !1 !== this.settings.responsive && this.on(b, "resize", this._handlers.onThrottledResize), this.settings.mouseDrag && (this.$element.addClass(this.options.dragClass), this.$stage.on("mousedown.owl.core", a.proxy(this.onDragStart, this)), this.$stage.on("dragstart.owl.core selectstart.owl.core", function () {
      return !1;
    })), this.settings.touchDrag && (this.$stage.on("touchstart.owl.core", a.proxy(this.onDragStart, this)), this.$stage.on("touchcancel.owl.core", a.proxy(this.onDragEnd, this)));
  }, e.prototype.onDragStart = function (b) {
    var d = null;
    3 !== b.which && (a.support.transform ? (d = this.$stage.css("transform").replace(/.*\(|\)| /g, "").split(","), d = {
      x: d[16 === d.length ? 12 : 4],
      y: d[16 === d.length ? 13 : 5]
    }) : (d = this.$stage.position(), d = {
      x: this.settings.rtl ? d.left + this.$stage.width() - this.width() + this.settings.margin : d.left,
      y: d.top
    }), this.is("animating") && (a.support.transform ? this.animate(d.x) : this.$stage.stop(), this.invalidate("position")), this.$element.toggleClass(this.options.grabClass, "mousedown" === b.type), this.speed(0), this._drag.time = new Date().getTime(), this._drag.target = a(b.target), this._drag.stage.start = d, this._drag.stage.current = d, this._drag.pointer = this.pointer(b), a(c).on("mouseup.owl.core touchend.owl.core", a.proxy(this.onDragEnd, this)), a(c).one("mousemove.owl.core touchmove.owl.core", a.proxy(function (b) {
      var d = this.difference(this._drag.pointer, this.pointer(b));
      a(c).on("mousemove.owl.core touchmove.owl.core", a.proxy(this.onDragMove, this)), Math.abs(d.x) < Math.abs(d.y) && this.is("valid") || (b.preventDefault(), this.enter("dragging"), this.trigger("drag"));
    }, this)));
  }, e.prototype.onDragMove = function (a) {
    var b = null,
        c = null,
        d = null,
        e = this.difference(this._drag.pointer, this.pointer(a)),
        f = this.difference(this._drag.stage.start, e);
    this.is("dragging") && (a.preventDefault(), this.settings.loop ? (b = this.coordinates(this.minimum()), c = this.coordinates(this.maximum() + 1) - b, f.x = ((f.x - b) % c + c) % c + b) : (b = this.settings.rtl ? this.coordinates(this.maximum()) : this.coordinates(this.minimum()), c = this.settings.rtl ? this.coordinates(this.minimum()) : this.coordinates(this.maximum()), d = this.settings.pullDrag ? -1 * e.x / 5 : 0, f.x = Math.max(Math.min(f.x, b + d), c + d)), this._drag.stage.current = f, this.animate(f.x));
  }, e.prototype.onDragEnd = function (b) {
    var d = this.difference(this._drag.pointer, this.pointer(b)),
        e = this._drag.stage.current,
        f = d.x > 0 ^ this.settings.rtl ? "left" : "right";
    a(c).off(".owl.core"), this.$element.removeClass(this.options.grabClass), (0 !== d.x && this.is("dragging") || !this.is("valid")) && (this.speed(this.settings.dragEndSpeed || this.settings.smartSpeed), this.current(this.closest(e.x, 0 !== d.x ? f : this._drag.direction)), this.invalidate("position"), this.update(), this._drag.direction = f, (Math.abs(d.x) > 3 || new Date().getTime() - this._drag.time > 300) && this._drag.target.one("click.owl.core", function () {
      return !1;
    })), this.is("dragging") && (this.leave("dragging"), this.trigger("dragged"));
  }, e.prototype.closest = function (b, c) {
    var e = -1,
        f = 30,
        g = this.width(),
        h = this.coordinates();
    return this.settings.freeDrag || a.each(h, a.proxy(function (a, i) {
      return "left" === c && b > i - f && b < i + f ? e = a : "right" === c && b > i - g - f && b < i - g + f ? e = a + 1 : this.op(b, "<", i) && this.op(b, ">", h[a + 1] !== d ? h[a + 1] : i - g) && (e = "left" === c ? a + 1 : a), -1 === e;
    }, this)), this.settings.loop || (this.op(b, ">", h[this.minimum()]) ? e = b = this.minimum() : this.op(b, "<", h[this.maximum()]) && (e = b = this.maximum())), e;
  }, e.prototype.animate = function (b) {
    var c = this.speed() > 0;
    this.is("animating") && this.onTransitionEnd(), c && (this.enter("animating"), this.trigger("translate")), a.support.transform3d && a.support.transition ? this.$stage.css({
      transform: "translate3d(" + b + "px,0px,0px)",
      transition: this.speed() / 1e3 + "s" + (this.settings.slideTransition ? " " + this.settings.slideTransition : "")
    }) : c ? this.$stage.animate({
      left: b + "px"
    }, this.speed(), this.settings.fallbackEasing, a.proxy(this.onTransitionEnd, this)) : this.$stage.css({
      left: b + "px"
    });
  }, e.prototype.is = function (a) {
    return this._states.current[a] && this._states.current[a] > 0;
  }, e.prototype.current = function (a) {
    if (a === d) return this._current;
    if (0 === this._items.length) return d;

    if (a = this.normalize(a), this._current !== a) {
      var b = this.trigger("change", {
        property: {
          name: "position",
          value: a
        }
      });
      b.data !== d && (a = this.normalize(b.data)), this._current = a, this.invalidate("position"), this.trigger("changed", {
        property: {
          name: "position",
          value: this._current
        }
      });
    }

    return this._current;
  }, e.prototype.invalidate = function (b) {
    return "string" === a.type(b) && (this._invalidated[b] = !0, this.is("valid") && this.leave("valid")), a.map(this._invalidated, function (a, b) {
      return b;
    });
  }, e.prototype.reset = function (a) {
    (a = this.normalize(a)) !== d && (this._speed = 0, this._current = a, this.suppress(["translate", "translated"]), this.animate(this.coordinates(a)), this.release(["translate", "translated"]));
  }, e.prototype.normalize = function (a, b) {
    var c = this._items.length,
        e = b ? 0 : this._clones.length;
    return !this.isNumeric(a) || c < 1 ? a = d : (a < 0 || a >= c + e) && (a = ((a - e / 2) % c + c) % c + e / 2), a;
  }, e.prototype.relative = function (a) {
    return a -= this._clones.length / 2, this.normalize(a, !0);
  }, e.prototype.maximum = function (a) {
    var b,
        c,
        d,
        e = this.settings,
        f = this._coordinates.length;
    if (e.loop) f = this._clones.length / 2 + this._items.length - 1;else if (e.autoWidth || e.merge) {
      if (b = this._items.length) for (c = this._items[--b].width(), d = this.$element.width(); b-- && !((c += this._items[b].width() + this.settings.margin) > d);) {
        ;
      }
      f = b + 1;
    } else f = e.center ? this._items.length - 1 : this._items.length - e.items;
    return a && (f -= this._clones.length / 2), Math.max(f, 0);
  }, e.prototype.minimum = function (a) {
    return a ? 0 : this._clones.length / 2;
  }, e.prototype.items = function (a) {
    return a === d ? this._items.slice() : (a = this.normalize(a, !0), this._items[a]);
  }, e.prototype.mergers = function (a) {
    return a === d ? this._mergers.slice() : (a = this.normalize(a, !0), this._mergers[a]);
  }, e.prototype.clones = function (b) {
    var c = this._clones.length / 2,
        e = c + this._items.length,
        f = function f(a) {
      return a % 2 == 0 ? e + a / 2 : c - (a + 1) / 2;
    };

    return b === d ? a.map(this._clones, function (a, b) {
      return f(b);
    }) : a.map(this._clones, function (a, c) {
      return a === b ? f(c) : null;
    });
  }, e.prototype.speed = function (a) {
    return a !== d && (this._speed = a), this._speed;
  }, e.prototype.coordinates = function (b) {
    var c,
        e = 1,
        f = b - 1;
    return b === d ? a.map(this._coordinates, a.proxy(function (a, b) {
      return this.coordinates(b);
    }, this)) : (this.settings.center ? (this.settings.rtl && (e = -1, f = b + 1), c = this._coordinates[b], c += (this.width() - c + (this._coordinates[f] || 0)) / 2 * e) : c = this._coordinates[f] || 0, c = Math.ceil(c));
  }, e.prototype.duration = function (a, b, c) {
    return 0 === c ? 0 : Math.min(Math.max(Math.abs(b - a), 1), 6) * Math.abs(c || this.settings.smartSpeed);
  }, e.prototype.to = function (a, b) {
    var c = this.current(),
        d = null,
        e = a - this.relative(c),
        f = (e > 0) - (e < 0),
        g = this._items.length,
        h = this.minimum(),
        i = this.maximum();
    this.settings.loop ? (!this.settings.rewind && Math.abs(e) > g / 2 && (e += -1 * f * g), a = c + e, (d = ((a - h) % g + g) % g + h) !== a && d - e <= i && d - e > 0 && (c = d - e, a = d, this.reset(c))) : this.settings.rewind ? (i += 1, a = (a % i + i) % i) : a = Math.max(h, Math.min(i, a)), this.speed(this.duration(c, a, b)), this.current(a), this.isVisible() && this.update();
  }, e.prototype.next = function (a) {
    a = a || !1, this.to(this.relative(this.current()) + 1, a);
  }, e.prototype.prev = function (a) {
    a = a || !1, this.to(this.relative(this.current()) - 1, a);
  }, e.prototype.onTransitionEnd = function (a) {
    if (a !== d && (a.stopPropagation(), (a.target || a.srcElement || a.originalTarget) !== this.$stage.get(0))) return !1;
    this.leave("animating"), this.trigger("translated");
  }, e.prototype.viewport = function () {
    var d;
    return this.options.responsiveBaseElement !== b ? d = a(this.options.responsiveBaseElement).width() : b.innerWidth ? d = b.innerWidth : c.documentElement && c.documentElement.clientWidth ? d = c.documentElement.clientWidth : console.warn("Can not detect viewport width."), d;
  }, e.prototype.replace = function (b) {
    this.$stage.empty(), this._items = [], b && (b = b instanceof jQuery ? b : a(b)), this.settings.nestedItemSelector && (b = b.find("." + this.settings.nestedItemSelector)), b.filter(function () {
      return 1 === this.nodeType;
    }).each(a.proxy(function (a, b) {
      b = this.prepare(b), this.$stage.append(b), this._items.push(b), this._mergers.push(1 * b.find("[data-merge]").addBack("[data-merge]").attr("data-merge") || 1);
    }, this)), this.reset(this.isNumeric(this.settings.startPosition) ? this.settings.startPosition : 0), this.invalidate("items");
  }, e.prototype.add = function (b, c) {
    var e = this.relative(this._current);
    c = c === d ? this._items.length : this.normalize(c, !0), b = b instanceof jQuery ? b : a(b), this.trigger("add", {
      content: b,
      position: c
    }), b = this.prepare(b), 0 === this._items.length || c === this._items.length ? (0 === this._items.length && this.$stage.append(b), 0 !== this._items.length && this._items[c - 1].after(b), this._items.push(b), this._mergers.push(1 * b.find("[data-merge]").addBack("[data-merge]").attr("data-merge") || 1)) : (this._items[c].before(b), this._items.splice(c, 0, b), this._mergers.splice(c, 0, 1 * b.find("[data-merge]").addBack("[data-merge]").attr("data-merge") || 1)), this._items[e] && this.reset(this._items[e].index()), this.invalidate("items"), this.trigger("added", {
      content: b,
      position: c
    });
  }, e.prototype.remove = function (a) {
    (a = this.normalize(a, !0)) !== d && (this.trigger("remove", {
      content: this._items[a],
      position: a
    }), this._items[a].remove(), this._items.splice(a, 1), this._mergers.splice(a, 1), this.invalidate("items"), this.trigger("removed", {
      content: null,
      position: a
    }));
  }, e.prototype.preloadAutoWidthImages = function (b) {
    b.each(a.proxy(function (b, c) {
      this.enter("pre-loading"), c = a(c), a(new Image()).one("load", a.proxy(function (a) {
        c.attr("src", a.target.src), c.css("opacity", 1), this.leave("pre-loading"), !this.is("pre-loading") && !this.is("initializing") && this.refresh();
      }, this)).attr("src", c.attr("src") || c.attr("data-src") || c.attr("data-src-retina"));
    }, this));
  }, e.prototype.destroy = function () {
    this.$element.off(".owl.core"), this.$stage.off(".owl.core"), a(c).off(".owl.core"), !1 !== this.settings.responsive && (b.clearTimeout(this.resizeTimer), this.off(b, "resize", this._handlers.onThrottledResize));

    for (var d in this._plugins) {
      this._plugins[d].destroy();
    }

    this.$stage.children(".cloned").remove(), this.$stage.unwrap(), this.$stage.children().contents().unwrap(), this.$stage.children().unwrap(), this.$stage.remove(), this.$element.removeClass(this.options.refreshClass).removeClass(this.options.loadingClass).removeClass(this.options.loadedClass).removeClass(this.options.rtlClass).removeClass(this.options.dragClass).removeClass(this.options.grabClass).attr("class", this.$element.attr("class").replace(new RegExp(this.options.responsiveClass + "-\\S+\\s", "g"), "")).removeData("owl.carousel");
  }, e.prototype.op = function (a, b, c) {
    var d = this.settings.rtl;

    switch (b) {
      case "<":
        return d ? a > c : a < c;

      case ">":
        return d ? a < c : a > c;

      case ">=":
        return d ? a <= c : a >= c;

      case "<=":
        return d ? a >= c : a <= c;
    }
  }, e.prototype.on = function (a, b, c, d) {
    a.addEventListener ? a.addEventListener(b, c, d) : a.attachEvent && a.attachEvent("on" + b, c);
  }, e.prototype.off = function (a, b, c, d) {
    a.removeEventListener ? a.removeEventListener(b, c, d) : a.detachEvent && a.detachEvent("on" + b, c);
  }, e.prototype.trigger = function (b, c, d, f, g) {
    var h = {
      item: {
        count: this._items.length,
        index: this.current()
      }
    },
        i = a.camelCase(a.grep(["on", b, d], function (a) {
      return a;
    }).join("-").toLowerCase()),
        j = a.Event([b, "owl", d || "carousel"].join(".").toLowerCase(), a.extend({
      relatedTarget: this
    }, h, c));
    return this._supress[b] || (a.each(this._plugins, function (a, b) {
      b.onTrigger && b.onTrigger(j);
    }), this.register({
      type: e.Type.Event,
      name: b
    }), this.$element.trigger(j), this.settings && "function" == typeof this.settings[i] && this.settings[i].call(this, j)), j;
  }, e.prototype.enter = function (b) {
    a.each([b].concat(this._states.tags[b] || []), a.proxy(function (a, b) {
      this._states.current[b] === d && (this._states.current[b] = 0), this._states.current[b]++;
    }, this));
  }, e.prototype.leave = function (b) {
    a.each([b].concat(this._states.tags[b] || []), a.proxy(function (a, b) {
      this._states.current[b]--;
    }, this));
  }, e.prototype.register = function (b) {
    if (b.type === e.Type.Event) {
      if (a.event.special[b.name] || (a.event.special[b.name] = {}), !a.event.special[b.name].owl) {
        var c = a.event.special[b.name]._default;
        a.event.special[b.name]._default = function (a) {
          return !c || !c.apply || a.namespace && -1 !== a.namespace.indexOf("owl") ? a.namespace && a.namespace.indexOf("owl") > -1 : c.apply(this, arguments);
        }, a.event.special[b.name].owl = !0;
      }
    } else b.type === e.Type.State && (this._states.tags[b.name] ? this._states.tags[b.name] = this._states.tags[b.name].concat(b.tags) : this._states.tags[b.name] = b.tags, this._states.tags[b.name] = a.grep(this._states.tags[b.name], a.proxy(function (c, d) {
      return a.inArray(c, this._states.tags[b.name]) === d;
    }, this)));
  }, e.prototype.suppress = function (b) {
    a.each(b, a.proxy(function (a, b) {
      this._supress[b] = !0;
    }, this));
  }, e.prototype.release = function (b) {
    a.each(b, a.proxy(function (a, b) {
      delete this._supress[b];
    }, this));
  }, e.prototype.pointer = function (a) {
    var c = {
      x: null,
      y: null
    };
    return a = a.originalEvent || a || b.event, a = a.touches && a.touches.length ? a.touches[0] : a.changedTouches && a.changedTouches.length ? a.changedTouches[0] : a, a.pageX ? (c.x = a.pageX, c.y = a.pageY) : (c.x = a.clientX, c.y = a.clientY), c;
  }, e.prototype.isNumeric = function (a) {
    return !isNaN(parseFloat(a));
  }, e.prototype.difference = function (a, b) {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  }, a.fn.owlCarousel = function (b) {
    var c = Array.prototype.slice.call(arguments, 1);
    return this.each(function () {
      var d = a(this),
          f = d.data("owl.carousel");
      f || (f = new e(this, "object" == _typeof(b) && b), d.data("owl.carousel", f), a.each(["next", "prev", "to", "destroy", "refresh", "replace", "add", "remove"], function (b, c) {
        f.register({
          type: e.Type.Event,
          name: c
        }), f.$element.on(c + ".owl.carousel.core", a.proxy(function (a) {
          a.namespace && a.relatedTarget !== this && (this.suppress([c]), f[c].apply(this, [].slice.call(arguments, 1)), this.release([c]));
        }, f));
      })), "string" == typeof b && "_" !== b.charAt(0) && f[b].apply(f, c);
    });
  }, a.fn.owlCarousel.Constructor = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function e(b) {
    this._core = b, this._interval = null, this._visible = null, this._handlers = {
      "initialized.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.autoRefresh && this.watch();
      }, this)
    }, this._core.options = a.extend({}, e.Defaults, this._core.options), this._core.$element.on(this._handlers);
  };

  e.Defaults = {
    autoRefresh: !0,
    autoRefreshInterval: 500
  }, e.prototype.watch = function () {
    this._interval || (this._visible = this._core.isVisible(), this._interval = b.setInterval(a.proxy(this.refresh, this), this._core.settings.autoRefreshInterval));
  }, e.prototype.refresh = function () {
    this._core.isVisible() !== this._visible && (this._visible = !this._visible, this._core.$element.toggleClass("owl-hidden", !this._visible), this._visible && this._core.invalidate("width") && this._core.refresh());
  }, e.prototype.destroy = function () {
    var a, c;
    b.clearInterval(this._interval);

    for (a in this._handlers) {
      this._core.$element.off(a, this._handlers[a]);
    }

    for (c in Object.getOwnPropertyNames(this)) {
      "function" != typeof this[c] && (this[c] = null);
    }
  }, a.fn.owlCarousel.Constructor.Plugins.AutoRefresh = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function e(b) {
    this._core = b, this._loaded = [], this._handlers = {
      "initialized.owl.carousel change.owl.carousel resized.owl.carousel": a.proxy(function (b) {
        if (b.namespace && this._core.settings && this._core.settings.lazyLoad && (b.property && "position" == b.property.name || "initialized" == b.type)) {
          var c = this._core.settings,
              e = c.center && Math.ceil(c.items / 2) || c.items,
              f = c.center && -1 * e || 0,
              g = (b.property && b.property.value !== d ? b.property.value : this._core.current()) + f,
              h = this._core.clones().length,
              i = a.proxy(function (a, b) {
            this.load(b);
          }, this);

          for (c.lazyLoadEager > 0 && (e += c.lazyLoadEager, c.loop && (g -= c.lazyLoadEager, e++)); f++ < e;) {
            this.load(h / 2 + this._core.relative(g)), h && a.each(this._core.clones(this._core.relative(g)), i), g++;
          }
        }
      }, this)
    }, this._core.options = a.extend({}, e.Defaults, this._core.options), this._core.$element.on(this._handlers);
  };

  e.Defaults = {
    lazyLoad: !1,
    lazyLoadEager: 0
  }, e.prototype.load = function (c) {
    var d = this._core.$stage.children().eq(c),
        e = d && d.find(".owl-lazy");

    !e || a.inArray(d.get(0), this._loaded) > -1 || (e.each(a.proxy(function (c, d) {
      var e,
          f = a(d),
          g = b.devicePixelRatio > 1 && f.attr("data-src-retina") || f.attr("data-src") || f.attr("data-srcset");
      this._core.trigger("load", {
        element: f,
        url: g
      }, "lazy"), f.is("img") ? f.one("load.owl.lazy", a.proxy(function () {
        f.css("opacity", 1), this._core.trigger("loaded", {
          element: f,
          url: g
        }, "lazy");
      }, this)).attr("src", g) : f.is("source") ? f.one("load.owl.lazy", a.proxy(function () {
        this._core.trigger("loaded", {
          element: f,
          url: g
        }, "lazy");
      }, this)).attr("srcset", g) : (e = new Image(), e.onload = a.proxy(function () {
        f.css({
          "background-image": 'url("' + g + '")',
          opacity: "1"
        }), this._core.trigger("loaded", {
          element: f,
          url: g
        }, "lazy");
      }, this), e.src = g);
    }, this)), this._loaded.push(d.get(0)));
  }, e.prototype.destroy = function () {
    var a, b;

    for (a in this.handlers) {
      this._core.$element.off(a, this.handlers[a]);
    }

    for (b in Object.getOwnPropertyNames(this)) {
      "function" != typeof this[b] && (this[b] = null);
    }
  }, a.fn.owlCarousel.Constructor.Plugins.Lazy = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function e(c) {
    this._core = c, this._previousHeight = null, this._handlers = {
      "initialized.owl.carousel refreshed.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.autoHeight && this.update();
      }, this),
      "changed.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.autoHeight && "position" === a.property.name && this.update();
      }, this),
      "loaded.owl.lazy": a.proxy(function (a) {
        a.namespace && this._core.settings.autoHeight && a.element.closest("." + this._core.settings.itemClass).index() === this._core.current() && this.update();
      }, this)
    }, this._core.options = a.extend({}, e.Defaults, this._core.options), this._core.$element.on(this._handlers), this._intervalId = null;
    var d = this;
    a(b).on("load", function () {
      d._core.settings.autoHeight && d.update();
    }), a(b).resize(function () {
      d._core.settings.autoHeight && (null != d._intervalId && clearTimeout(d._intervalId), d._intervalId = setTimeout(function () {
        d.update();
      }, 250));
    });
  };

  e.Defaults = {
    autoHeight: !1,
    autoHeightClass: "owl-height"
  }, e.prototype.update = function () {
    var b = this._core._current,
        c = b + this._core.settings.items,
        d = this._core.settings.lazyLoad,
        e = this._core.$stage.children().toArray().slice(b, c),
        f = [],
        g = 0;

    a.each(e, function (b, c) {
      f.push(a(c).height());
    }), g = Math.max.apply(null, f), g <= 1 && d && this._previousHeight && (g = this._previousHeight), this._previousHeight = g, this._core.$stage.parent().height(g).addClass(this._core.settings.autoHeightClass);
  }, e.prototype.destroy = function () {
    var a, b;

    for (a in this._handlers) {
      this._core.$element.off(a, this._handlers[a]);
    }

    for (b in Object.getOwnPropertyNames(this)) {
      "function" != typeof this[b] && (this[b] = null);
    }
  }, a.fn.owlCarousel.Constructor.Plugins.AutoHeight = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function e(b) {
    this._core = b, this._videos = {}, this._playing = null, this._handlers = {
      "initialized.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.register({
          type: "state",
          name: "playing",
          tags: ["interacting"]
        });
      }, this),
      "resize.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.video && this.isInFullScreen() && a.preventDefault();
      }, this),
      "refreshed.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.is("resizing") && this._core.$stage.find(".cloned .owl-video-frame").remove();
      }, this),
      "changed.owl.carousel": a.proxy(function (a) {
        a.namespace && "position" === a.property.name && this._playing && this.stop();
      }, this),
      "prepared.owl.carousel": a.proxy(function (b) {
        if (b.namespace) {
          var c = a(b.content).find(".owl-video");
          c.length && (c.css("display", "none"), this.fetch(c, a(b.content)));
        }
      }, this)
    }, this._core.options = a.extend({}, e.Defaults, this._core.options), this._core.$element.on(this._handlers), this._core.$element.on("click.owl.video", ".owl-video-play-icon", a.proxy(function (a) {
      this.play(a);
    }, this));
  };

  e.Defaults = {
    video: !1,
    videoHeight: !1,
    videoWidth: !1
  }, e.prototype.fetch = function (a, b) {
    var c = function () {
      return a.attr("data-vimeo-id") ? "vimeo" : a.attr("data-vzaar-id") ? "vzaar" : "youtube";
    }(),
        d = a.attr("data-vimeo-id") || a.attr("data-youtube-id") || a.attr("data-vzaar-id"),
        e = a.attr("data-width") || this._core.settings.videoWidth,
        f = a.attr("data-height") || this._core.settings.videoHeight,
        g = a.attr("href");

    if (!g) throw new Error("Missing video URL.");
    if (d = g.match(/(http:|https:|)\/\/(player.|www.|app.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com|be\-nocookie\.com)|vzaar\.com)\/(video\/|videos\/|embed\/|channels\/.+\/|groups\/.+\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/), d[3].indexOf("youtu") > -1) c = "youtube";else if (d[3].indexOf("vimeo") > -1) c = "vimeo";else {
      if (!(d[3].indexOf("vzaar") > -1)) throw new Error("Video URL not supported.");
      c = "vzaar";
    }
    d = d[6], this._videos[g] = {
      type: c,
      id: d,
      width: e,
      height: f
    }, b.attr("data-video", g), this.thumbnail(a, this._videos[g]);
  }, e.prototype.thumbnail = function (b, c) {
    var d,
        e,
        f,
        g = c.width && c.height ? "width:" + c.width + "px;height:" + c.height + "px;" : "",
        h = b.find("img"),
        i = "src",
        j = "",
        k = this._core.settings,
        l = function l(c) {
      e = '<div class="owl-video-play-icon"></div>', d = k.lazyLoad ? a("<div/>", {
        class: "owl-video-tn " + j,
        srcType: c
      }) : a("<div/>", {
        class: "owl-video-tn",
        style: "opacity:1;background-image:url(" + c + ")"
      }), b.after(d), b.after(e);
    };

    if (b.wrap(a("<div/>", {
      class: "owl-video-wrapper",
      style: g
    })), this._core.settings.lazyLoad && (i = "data-src", j = "owl-lazy"), h.length) return l(h.attr(i)), h.remove(), !1;
    "youtube" === c.type ? (f = "//img.youtube.com/vi/" + c.id + "/hqdefault.jpg", l(f)) : "vimeo" === c.type ? a.ajax({
      type: "GET",
      url: "//vimeo.com/api/v2/video/" + c.id + ".json",
      jsonp: "callback",
      dataType: "jsonp",
      success: function success(a) {
        f = a[0].thumbnail_large, l(f);
      }
    }) : "vzaar" === c.type && a.ajax({
      type: "GET",
      url: "//vzaar.com/api/videos/" + c.id + ".json",
      jsonp: "callback",
      dataType: "jsonp",
      success: function success(a) {
        f = a.framegrab_url, l(f);
      }
    });
  }, e.prototype.stop = function () {
    this._core.trigger("stop", null, "video"), this._playing.find(".owl-video-frame").remove(), this._playing.removeClass("owl-video-playing"), this._playing = null, this._core.leave("playing"), this._core.trigger("stopped", null, "video");
  }, e.prototype.play = function (b) {
    var c,
        d = a(b.target),
        e = d.closest("." + this._core.settings.itemClass),
        f = this._videos[e.attr("data-video")],
        g = f.width || "100%",
        h = f.height || this._core.$stage.height();

    this._playing || (this._core.enter("playing"), this._core.trigger("play", null, "video"), e = this._core.items(this._core.relative(e.index())), this._core.reset(e.index()), c = a('<iframe frameborder="0" allowfullscreen mozallowfullscreen webkitAllowFullScreen ></iframe>'), c.attr("height", h), c.attr("width", g), "youtube" === f.type ? c.attr("src", "//www.youtube.com/embed/" + f.id + "?autoplay=1&rel=0&v=" + f.id) : "vimeo" === f.type ? c.attr("src", "//player.vimeo.com/video/" + f.id + "?autoplay=1") : "vzaar" === f.type && c.attr("src", "//view.vzaar.com/" + f.id + "/player?autoplay=true"), a(c).wrap('<div class="owl-video-frame" />').insertAfter(e.find(".owl-video")), this._playing = e.addClass("owl-video-playing"));
  }, e.prototype.isInFullScreen = function () {
    var b = c.fullscreenElement || c.mozFullScreenElement || c.webkitFullscreenElement;
    return b && a(b).parent().hasClass("owl-video-frame");
  }, e.prototype.destroy = function () {
    var a, b;

    this._core.$element.off("click.owl.video");

    for (a in this._handlers) {
      this._core.$element.off(a, this._handlers[a]);
    }

    for (b in Object.getOwnPropertyNames(this)) {
      "function" != typeof this[b] && (this[b] = null);
    }
  }, a.fn.owlCarousel.Constructor.Plugins.Video = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function e(b) {
    this.core = b, this.core.options = a.extend({}, e.Defaults, this.core.options), this.swapping = !0, this.previous = d, this.next = d, this.handlers = {
      "change.owl.carousel": a.proxy(function (a) {
        a.namespace && "position" == a.property.name && (this.previous = this.core.current(), this.next = a.property.value);
      }, this),
      "drag.owl.carousel dragged.owl.carousel translated.owl.carousel": a.proxy(function (a) {
        a.namespace && (this.swapping = "translated" == a.type);
      }, this),
      "translate.owl.carousel": a.proxy(function (a) {
        a.namespace && this.swapping && (this.core.options.animateOut || this.core.options.animateIn) && this.swap();
      }, this)
    }, this.core.$element.on(this.handlers);
  };

  e.Defaults = {
    animateOut: !1,
    animateIn: !1
  }, e.prototype.swap = function () {
    if (1 === this.core.settings.items && a.support.animation && a.support.transition) {
      this.core.speed(0);
      var b,
          c = a.proxy(this.clear, this),
          d = this.core.$stage.children().eq(this.previous),
          e = this.core.$stage.children().eq(this.next),
          f = this.core.settings.animateIn,
          g = this.core.settings.animateOut;
      this.core.current() !== this.previous && (g && (b = this.core.coordinates(this.previous) - this.core.coordinates(this.next), d.one(a.support.animation.end, c).css({
        left: b + "px"
      }).addClass("animated owl-animated-out").addClass(g)), f && e.one(a.support.animation.end, c).addClass("animated owl-animated-in").addClass(f));
    }
  }, e.prototype.clear = function (b) {
    a(b.target).css({
      left: ""
    }).removeClass("animated owl-animated-out owl-animated-in").removeClass(this.core.settings.animateIn).removeClass(this.core.settings.animateOut), this.core.onTransitionEnd();
  }, e.prototype.destroy = function () {
    var a, b;

    for (a in this.handlers) {
      this.core.$element.off(a, this.handlers[a]);
    }

    for (b in Object.getOwnPropertyNames(this)) {
      "function" != typeof this[b] && (this[b] = null);
    }
  }, a.fn.owlCarousel.Constructor.Plugins.Animate = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  var e = function e(b) {
    this._core = b, this._call = null, this._time = 0, this._timeout = 0, this._paused = !0, this._handlers = {
      "changed.owl.carousel": a.proxy(function (a) {
        a.namespace && "settings" === a.property.name ? this._core.settings.autoplay ? this.play() : this.stop() : a.namespace && "position" === a.property.name && this._paused && (this._time = 0);
      }, this),
      "initialized.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.autoplay && this.play();
      }, this),
      "play.owl.autoplay": a.proxy(function (a, b, c) {
        a.namespace && this.play(b, c);
      }, this),
      "stop.owl.autoplay": a.proxy(function (a) {
        a.namespace && this.stop();
      }, this),
      "mouseover.owl.autoplay": a.proxy(function () {
        this._core.settings.autoplayHoverPause && this._core.is("rotating") && this.pause();
      }, this),
      "mouseleave.owl.autoplay": a.proxy(function () {
        this._core.settings.autoplayHoverPause && this._core.is("rotating") && this.play();
      }, this),
      "touchstart.owl.core": a.proxy(function () {
        this._core.settings.autoplayHoverPause && this._core.is("rotating") && this.pause();
      }, this),
      "touchend.owl.core": a.proxy(function () {
        this._core.settings.autoplayHoverPause && this.play();
      }, this)
    }, this._core.$element.on(this._handlers), this._core.options = a.extend({}, e.Defaults, this._core.options);
  };

  e.Defaults = {
    autoplay: !1,
    autoplayTimeout: 5e3,
    autoplayHoverPause: !1,
    autoplaySpeed: !1
  }, e.prototype._next = function (d) {
    this._call = b.setTimeout(a.proxy(this._next, this, d), this._timeout * (Math.round(this.read() / this._timeout) + 1) - this.read()), this._core.is("interacting") || c.hidden || this._core.next(d || this._core.settings.autoplaySpeed);
  }, e.prototype.read = function () {
    return new Date().getTime() - this._time;
  }, e.prototype.play = function (c, d) {
    var e;
    this._core.is("rotating") || this._core.enter("rotating"), c = c || this._core.settings.autoplayTimeout, e = Math.min(this._time % (this._timeout || c), c), this._paused ? (this._time = this.read(), this._paused = !1) : b.clearTimeout(this._call), this._time += this.read() % c - e, this._timeout = c, this._call = b.setTimeout(a.proxy(this._next, this, d), c - e);
  }, e.prototype.stop = function () {
    this._core.is("rotating") && (this._time = 0, this._paused = !0, b.clearTimeout(this._call), this._core.leave("rotating"));
  }, e.prototype.pause = function () {
    this._core.is("rotating") && !this._paused && (this._time = this.read(), this._paused = !0, b.clearTimeout(this._call));
  }, e.prototype.destroy = function () {
    var a, b;
    this.stop();

    for (a in this._handlers) {
      this._core.$element.off(a, this._handlers[a]);
    }

    for (b in Object.getOwnPropertyNames(this)) {
      "function" != typeof this[b] && (this[b] = null);
    }
  }, a.fn.owlCarousel.Constructor.Plugins.autoplay = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  "use strict";

  var e = function e(b) {
    this._core = b, this._initialized = !1, this._pages = [], this._controls = {}, this._templates = [], this.$element = this._core.$element, this._overrides = {
      next: this._core.next,
      prev: this._core.prev,
      to: this._core.to
    }, this._handlers = {
      "prepared.owl.carousel": a.proxy(function (b) {
        b.namespace && this._core.settings.dotsData && this._templates.push('<div class="' + this._core.settings.dotClass + '">' + a(b.content).find("[data-dot]").addBack("[data-dot]").attr("data-dot") + "</div>");
      }, this),
      "added.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.dotsData && this._templates.splice(a.position, 0, this._templates.pop());
      }, this),
      "remove.owl.carousel": a.proxy(function (a) {
        a.namespace && this._core.settings.dotsData && this._templates.splice(a.position, 1);
      }, this),
      "changed.owl.carousel": a.proxy(function (a) {
        a.namespace && "position" == a.property.name && this.draw();
      }, this),
      "initialized.owl.carousel": a.proxy(function (a) {
        a.namespace && !this._initialized && (this._core.trigger("initialize", null, "navigation"), this.initialize(), this.update(), this.draw(), this._initialized = !0, this._core.trigger("initialized", null, "navigation"));
      }, this),
      "refreshed.owl.carousel": a.proxy(function (a) {
        a.namespace && this._initialized && (this._core.trigger("refresh", null, "navigation"), this.update(), this.draw(), this._core.trigger("refreshed", null, "navigation"));
      }, this)
    }, this._core.options = a.extend({}, e.Defaults, this._core.options), this.$element.on(this._handlers);
  };

  e.Defaults = {
    nav: !1,
    navText: ['<span aria-label="Previous">&#x2039;</span>', '<span aria-label="Next">&#x203a;</span>'],
    navSpeed: !1,
    navElement: 'button type="button" role="presentation"',
    navContainer: !1,
    navContainerClass: "owl-nav",
    navClass: ["owl-prev", "owl-next"],
    slideBy: 1,
    dotClass: "owl-dot",
    dotsClass: "owl-dots",
    dots: !0,
    dotsEach: !1,
    dotsData: !1,
    dotsSpeed: !1,
    dotsContainer: !1
  }, e.prototype.initialize = function () {
    var b,
        c = this._core.settings;
    this._controls.$relative = (c.navContainer ? a(c.navContainer) : a("<div>").addClass(c.navContainerClass).appendTo(this.$element)).addClass("disabled"), this._controls.$previous = a("<" + c.navElement + ">").addClass(c.navClass[0]).html(c.navText[0]).prependTo(this._controls.$relative).on("click", a.proxy(function (a) {
      this.prev(c.navSpeed);
    }, this)), this._controls.$next = a("<" + c.navElement + ">").addClass(c.navClass[1]).html(c.navText[1]).appendTo(this._controls.$relative).on("click", a.proxy(function (a) {
      this.next(c.navSpeed);
    }, this)), c.dotsData || (this._templates = [a('<button role="button">').addClass(c.dotClass).append(a("<span>")).prop("outerHTML")]), this._controls.$absolute = (c.dotsContainer ? a(c.dotsContainer) : a("<div>").addClass(c.dotsClass).appendTo(this.$element)).addClass("disabled"), this._controls.$absolute.on("click", "button", a.proxy(function (b) {
      var d = a(b.target).parent().is(this._controls.$absolute) ? a(b.target).index() : a(b.target).parent().index();
      b.preventDefault(), this.to(d, c.dotsSpeed);
    }, this));

    for (b in this._overrides) {
      this._core[b] = a.proxy(this[b], this);
    }
  }, e.prototype.destroy = function () {
    var a, b, c, d, e;
    e = this._core.settings;

    for (a in this._handlers) {
      this.$element.off(a, this._handlers[a]);
    }

    for (b in this._controls) {
      "$relative" === b && e.navContainer ? this._controls[b].html("") : this._controls[b].remove();
    }

    for (d in this.overides) {
      this._core[d] = this._overrides[d];
    }

    for (c in Object.getOwnPropertyNames(this)) {
      "function" != typeof this[c] && (this[c] = null);
    }
  }, e.prototype.update = function () {
    var a,
        b,
        c,
        d = this._core.clones().length / 2,
        e = d + this._core.items().length,
        f = this._core.maximum(!0),
        g = this._core.settings,
        h = g.center || g.autoWidth || g.dotsData ? 1 : g.dotsEach || g.items;

    if ("page" !== g.slideBy && (g.slideBy = Math.min(g.slideBy, g.items)), g.dots || "page" == g.slideBy) for (this._pages = [], a = d, b = 0, c = 0; a < e; a++) {
      if (b >= h || 0 === b) {
        if (this._pages.push({
          start: Math.min(f, a - d),
          end: a - d + h - 1
        }), Math.min(f, a - d) === f) break;
        b = 0, ++c;
      }

      b += this._core.mergers(this._core.relative(a));
    }
  }, e.prototype.draw = function () {
    var b,
        c = this._core.settings,
        d = this._core.items().length <= c.items,
        e = this._core.relative(this._core.current()),
        f = c.loop || c.rewind;

    this._controls.$relative.toggleClass("disabled", !c.nav || d), c.nav && (this._controls.$previous.toggleClass("disabled", !f && e <= this._core.minimum(!0)), this._controls.$next.toggleClass("disabled", !f && e >= this._core.maximum(!0))), this._controls.$absolute.toggleClass("disabled", !c.dots || d), c.dots && (b = this._pages.length - this._controls.$absolute.children().length, c.dotsData && 0 !== b ? this._controls.$absolute.html(this._templates.join("")) : b > 0 ? this._controls.$absolute.append(new Array(b + 1).join(this._templates[0])) : b < 0 && this._controls.$absolute.children().slice(b).remove(), this._controls.$absolute.find(".active").removeClass("active"), this._controls.$absolute.children().eq(a.inArray(this.current(), this._pages)).addClass("active"));
  }, e.prototype.onTrigger = function (b) {
    var c = this._core.settings;
    b.page = {
      index: a.inArray(this.current(), this._pages),
      count: this._pages.length,
      size: c && (c.center || c.autoWidth || c.dotsData ? 1 : c.dotsEach || c.items)
    };
  }, e.prototype.current = function () {
    var b = this._core.relative(this._core.current());

    return a.grep(this._pages, a.proxy(function (a, c) {
      return a.start <= b && a.end >= b;
    }, this)).pop();
  }, e.prototype.getPosition = function (b) {
    var c,
        d,
        e = this._core.settings;
    return "page" == e.slideBy ? (c = a.inArray(this.current(), this._pages), d = this._pages.length, b ? ++c : --c, c = this._pages[(c % d + d) % d].start) : (c = this._core.relative(this._core.current()), d = this._core.items().length, b ? c += e.slideBy : c -= e.slideBy), c;
  }, e.prototype.next = function (b) {
    a.proxy(this._overrides.to, this._core)(this.getPosition(!0), b);
  }, e.prototype.prev = function (b) {
    a.proxy(this._overrides.to, this._core)(this.getPosition(!1), b);
  }, e.prototype.to = function (b, c, d) {
    var e;
    !d && this._pages.length ? (e = this._pages.length, a.proxy(this._overrides.to, this._core)(this._pages[(b % e + e) % e].start, c)) : a.proxy(this._overrides.to, this._core)(b, c);
  }, a.fn.owlCarousel.Constructor.Plugins.Navigation = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  "use strict";

  var e = function e(c) {
    this._core = c, this._hashes = {}, this.$element = this._core.$element, this._handlers = {
      "initialized.owl.carousel": a.proxy(function (c) {
        c.namespace && "URLHash" === this._core.settings.startPosition && a(b).trigger("hashchange.owl.navigation");
      }, this),
      "prepared.owl.carousel": a.proxy(function (b) {
        if (b.namespace) {
          var c = a(b.content).find("[data-hash]").addBack("[data-hash]").attr("data-hash");
          if (!c) return;
          this._hashes[c] = b.content;
        }
      }, this),
      "changed.owl.carousel": a.proxy(function (c) {
        if (c.namespace && "position" === c.property.name) {
          var d = this._core.items(this._core.relative(this._core.current())),
              e = a.map(this._hashes, function (a, b) {
            return a === d ? b : null;
          }).join();

          if (!e || b.location.hash.slice(1) === e) return;
          b.location.hash = e;
        }
      }, this)
    }, this._core.options = a.extend({}, e.Defaults, this._core.options), this.$element.on(this._handlers), a(b).on("hashchange.owl.navigation", a.proxy(function (a) {
      var c = b.location.hash.substring(1),
          e = this._core.$stage.children(),
          f = this._hashes[c] && e.index(this._hashes[c]);

      f !== d && f !== this._core.current() && this._core.to(this._core.relative(f), !1, !0);
    }, this));
  };

  e.Defaults = {
    URLhashListener: !1
  }, e.prototype.destroy = function () {
    var c, d;
    a(b).off("hashchange.owl.navigation");

    for (c in this._handlers) {
      this._core.$element.off(c, this._handlers[c]);
    }

    for (d in Object.getOwnPropertyNames(this)) {
      "function" != typeof this[d] && (this[d] = null);
    }
  }, a.fn.owlCarousel.Constructor.Plugins.Hash = e;
}(window.Zepto || window.jQuery, window, document), function (a, b, c, d) {
  function e(b, c) {
    var e = !1,
        f = b.charAt(0).toUpperCase() + b.slice(1);
    return a.each((b + " " + h.join(f + " ") + f).split(" "), function (a, b) {
      if (g[b] !== d) return e = !c || b, !1;
    }), e;
  }

  function f(a) {
    return e(a, !0);
  }

  var g = a("<support>").get(0).style,
      h = "Webkit Moz O ms".split(" "),
      i = {
    transition: {
      end: {
        WebkitTransition: "webkitTransitionEnd",
        MozTransition: "transitionend",
        OTransition: "oTransitionEnd",
        transition: "transitionend"
      }
    },
    animation: {
      end: {
        WebkitAnimation: "webkitAnimationEnd",
        MozAnimation: "animationend",
        OAnimation: "oAnimationEnd",
        animation: "animationend"
      }
    }
  },
      j = {
    csstransforms: function csstransforms() {
      return !!e("transform");
    },
    csstransforms3d: function csstransforms3d() {
      return !!e("perspective");
    },
    csstransitions: function csstransitions() {
      return !!e("transition");
    },
    cssanimations: function cssanimations() {
      return !!e("animation");
    }
  };
  j.csstransitions() && (a.support.transition = new String(f("transition")), a.support.transition.end = i.transition.end[a.support.transition]), j.cssanimations() && (a.support.animation = new String(f("animation")), a.support.animation.end = i.animation.end[a.support.animation]), j.csstransforms() && (a.support.transform = new String(f("transform")), a.support.transform3d = j.csstransforms3d());
}(window.Zepto || window.jQuery, window, document);
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*! Select2 4.1.0-beta.1 | https://github.com/select2/select2/blob/master/LICENSE.md */
!function (n) {
  "function" == typeof define && define.amd ? define(["jquery"], n) : "object" == (typeof module === "undefined" ? "undefined" : _typeof(module)) && module.exports ? module.exports = function (e, t) {
    return void 0 === t && (t = "undefined" != typeof window ? require("jquery") : require("jquery")(e)), n(t), t;
  } : n(jQuery);
}(function (d) {
  var e = function () {
    if (d && d.fn && d.fn.select2 && d.fn.select2.amd) var e = d.fn.select2.amd;

    var t, n, i, h, s, _r, f, g, m, v, y, _, o, a, w, l;

    function b(e, t) {
      return o.call(e, t);
    }

    function c(e, t) {
      var n,
          i,
          o,
          s,
          r,
          a,
          l,
          c,
          u,
          d,
          p,
          h = t && t.split("/"),
          f = y.map,
          g = f && f["*"] || {};

      if (e) {
        for (r = (e = e.split("/")).length - 1, y.nodeIdCompat && w.test(e[r]) && (e[r] = e[r].replace(w, "")), "." === e[0].charAt(0) && h && (e = h.slice(0, h.length - 1).concat(e)), u = 0; u < e.length; u++) {
          if ("." === (p = e[u])) e.splice(u, 1), u -= 1;else if (".." === p) {
            if (0 === u || 1 === u && ".." === e[2] || ".." === e[u - 1]) continue;
            0 < u && (e.splice(u - 1, 2), u -= 2);
          }
        }

        e = e.join("/");
      }

      if ((h || g) && f) {
        for (u = (n = e.split("/")).length; 0 < u; u -= 1) {
          if (i = n.slice(0, u).join("/"), h) for (d = h.length; 0 < d; d -= 1) {
            if (o = (o = f[h.slice(0, d).join("/")]) && o[i]) {
              s = o, a = u;
              break;
            }
          }
          if (s) break;
          !l && g && g[i] && (l = g[i], c = u);
        }

        !s && l && (s = l, a = c), s && (n.splice(0, a, s), e = n.join("/"));
      }

      return e;
    }

    function x(t, n) {
      return function () {
        var e = a.call(arguments, 0);
        return "string" != typeof e[0] && 1 === e.length && e.push(null), _r.apply(h, e.concat([t, n]));
      };
    }

    function A(t) {
      return function (e) {
        m[t] = e;
      };
    }

    function D(e) {
      if (b(v, e)) {
        var t = v[e];
        delete v[e], _[e] = !0, s.apply(h, t);
      }

      if (!b(m, e) && !b(_, e)) throw new Error("No " + e);
      return m[e];
    }

    function u(e) {
      var t,
          n = e ? e.indexOf("!") : -1;
      return -1 < n && (t = e.substring(0, n), e = e.substring(n + 1, e.length)), [t, e];
    }

    function S(e) {
      return e ? u(e) : [];
    }

    return e && e.requirejs || (e ? n = e : e = {}, m = {}, v = {}, y = {}, _ = {}, o = Object.prototype.hasOwnProperty, a = [].slice, w = /\.js$/, f = function f(e, t) {
      var n,
          i = u(e),
          o = i[0],
          s = t[1];
      return e = i[1], o && (n = D(o = c(o, s))), o ? e = n && n.normalize ? n.normalize(e, function (t) {
        return function (e) {
          return c(e, t);
        };
      }(s)) : c(e, s) : (o = (i = u(e = c(e, s)))[0], e = i[1], o && (n = D(o))), {
        f: o ? o + "!" + e : e,
        n: e,
        pr: o,
        p: n
      };
    }, g = {
      require: function require(e) {
        return x(e);
      },
      exports: function exports(e) {
        var t = m[e];
        return void 0 !== t ? t : m[e] = {};
      },
      module: function module(e) {
        return {
          id: e,
          uri: "",
          exports: m[e],
          config: function (e) {
            return function () {
              return y && y.config && y.config[e] || {};
            };
          }(e)
        };
      }
    }, s = function s(e, t, n, i) {
      var o,
          s,
          r,
          a,
          l,
          c,
          u,
          d = [],
          p = _typeof(n);

      if (c = S(i = i || e), "undefined" == p || "function" == p) {
        for (t = !t.length && n.length ? ["require", "exports", "module"] : t, l = 0; l < t.length; l += 1) {
          if ("require" === (s = (a = f(t[l], c)).f)) d[l] = g.require(e);else if ("exports" === s) d[l] = g.exports(e), u = !0;else if ("module" === s) o = d[l] = g.module(e);else if (b(m, s) || b(v, s) || b(_, s)) d[l] = D(s);else {
            if (!a.p) throw new Error(e + " missing " + s);
            a.p.load(a.n, x(i, !0), A(s), {}), d[l] = m[s];
          }
        }

        r = n ? n.apply(m[e], d) : void 0, e && (o && o.exports !== h && o.exports !== m[e] ? m[e] = o.exports : r === h && u || (m[e] = r));
      } else e && (m[e] = n);
    }, t = n = _r = function r(e, t, n, i, o) {
      if ("string" == typeof e) return g[e] ? g[e](t) : D(f(e, S(t)).f);

      if (!e.splice) {
        if ((y = e).deps && _r(y.deps, y.callback), !t) return;
        t.splice ? (e = t, t = n, n = null) : e = h;
      }

      return t = t || function () {}, "function" == typeof n && (n = i, i = o), i ? s(h, e, t, n) : setTimeout(function () {
        s(h, e, t, n);
      }, 4), _r;
    }, _r.config = function (e) {
      return _r(e);
    }, t._defined = m, (i = function i(e, t, n) {
      if ("string" != typeof e) throw new Error("See almond README: incorrect module build, no module name");
      t.splice || (n = t, t = []), b(m, e) || b(v, e) || (v[e] = [e, t, n]);
    }).amd = {
      jQuery: !0
    }, e.requirejs = t, e.require = n, e.define = i), e.define("almond", function () {}), e.define("jquery", [], function () {
      var e = d || $;
      return null == e && console && console.error && console.error("Select2: An instance of jQuery or a jQuery-compatible library was not found. Make sure that you are including jQuery before Select2 on your web page."), e;
    }), e.define("select2/utils", ["jquery"], function (s) {
      var o = {};

      function u(e) {
        var t = e.prototype,
            n = [];

        for (var i in t) {
          "function" == typeof t[i] && "constructor" !== i && n.push(i);
        }

        return n;
      }

      o.Extend = function (e, t) {
        var n = {}.hasOwnProperty;

        function i() {
          this.constructor = e;
        }

        for (var o in t) {
          n.call(t, o) && (e[o] = t[o]);
        }

        return i.prototype = t.prototype, e.prototype = new i(), e.__super__ = t.prototype, e;
      }, o.Decorate = function (i, o) {
        var e = u(o),
            t = u(i);

        function s() {
          var e = Array.prototype.unshift,
              t = o.prototype.constructor.length,
              n = i.prototype.constructor;
          0 < t && (e.call(arguments, i.prototype.constructor), n = o.prototype.constructor), n.apply(this, arguments);
        }

        o.displayName = i.displayName, s.prototype = new function () {
          this.constructor = s;
        }();

        for (var n = 0; n < t.length; n++) {
          var r = t[n];
          s.prototype[r] = i.prototype[r];
        }

        function a(e) {
          var t = function t() {};

          e in s.prototype && (t = s.prototype[e]);
          var n = o.prototype[e];
          return function () {
            return Array.prototype.unshift.call(arguments, t), n.apply(this, arguments);
          };
        }

        for (var l = 0; l < e.length; l++) {
          var c = e[l];
          s.prototype[c] = a(c);
        }

        return s;
      };

      function e() {
        this.listeners = {};
      }

      e.prototype.on = function (e, t) {
        this.listeners = this.listeners || {}, e in this.listeners ? this.listeners[e].push(t) : this.listeners[e] = [t];
      }, e.prototype.trigger = function (e) {
        var t = Array.prototype.slice,
            n = t.call(arguments, 1);
        this.listeners = this.listeners || {}, null == n && (n = []), 0 === n.length && n.push({}), (n[0]._type = e) in this.listeners && this.invoke(this.listeners[e], t.call(arguments, 1)), "*" in this.listeners && this.invoke(this.listeners["*"], arguments);
      }, e.prototype.invoke = function (e, t) {
        for (var n = 0, i = e.length; n < i; n++) {
          e[n].apply(this, t);
        }
      }, o.Observable = e, o.generateChars = function (e) {
        for (var t = "", n = 0; n < e; n++) {
          t += Math.floor(36 * Math.random()).toString(36);
        }

        return t;
      }, o.bind = function (e, t) {
        return function () {
          e.apply(t, arguments);
        };
      }, o._convertData = function (e) {
        for (var t in e) {
          var n = t.split("-"),
              i = e;

          if (1 !== n.length) {
            for (var o = 0; o < n.length; o++) {
              var s = n[o];
              (s = s.substring(0, 1).toLowerCase() + s.substring(1)) in i || (i[s] = {}), o == n.length - 1 && (i[s] = e[t]), i = i[s];
            }

            delete e[t];
          }
        }

        return e;
      }, o.hasScroll = function (e, t) {
        var n = s(t),
            i = t.style.overflowX,
            o = t.style.overflowY;
        return (i !== o || "hidden" !== o && "visible" !== o) && ("scroll" === i || "scroll" === o || n.innerHeight() < t.scrollHeight || n.innerWidth() < t.scrollWidth);
      }, o.escapeMarkup = function (e) {
        var t = {
          "\\": "&#92;",
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
          "/": "&#47;"
        };
        return "string" != typeof e ? e : String(e).replace(/[&<>"'\/\\]/g, function (e) {
          return t[e];
        });
      }, o.__cache = {};
      var n = 0;
      return o.GetUniqueElementId = function (e) {
        var t = e.getAttribute("data-select2-id");
        return null != t || (t = e.id ? "select2-data-" + e.id : "select2-data-" + (++n).toString() + "-" + o.generateChars(4), e.setAttribute("data-select2-id", t)), t;
      }, o.StoreData = function (e, t, n) {
        var i = o.GetUniqueElementId(e);
        o.__cache[i] || (o.__cache[i] = {}), o.__cache[i][t] = n;
      }, o.GetData = function (e, t) {
        var n = o.GetUniqueElementId(e);
        return t ? o.__cache[n] && null != o.__cache[n][t] ? o.__cache[n][t] : s(e).data(t) : o.__cache[n];
      }, o.RemoveData = function (e) {
        var t = o.GetUniqueElementId(e);
        null != o.__cache[t] && delete o.__cache[t], e.removeAttribute("data-select2-id");
      }, o.copyNonInternalCssClasses = function (e, t) {
        var n = e.getAttribute("class").trim().split(/\s+/);
        n = n.filter(function (e) {
          return 0 === e.indexOf("select2-");
        });
        var i = t.getAttribute("class").trim().split(/\s+/);
        i = i.filter(function (e) {
          return 0 !== e.indexOf("select2-");
        });
        var o = n.concat(i);
        e.setAttribute("class", o.join(" "));
      }, o;
    }), e.define("select2/results", ["jquery", "./utils"], function (h, f) {
      function i(e, t, n) {
        this.$element = e, this.data = n, this.options = t, i.__super__.constructor.call(this);
      }

      return f.Extend(i, f.Observable), i.prototype.render = function () {
        var e = h('<ul class="select2-results__options" role="listbox"></ul>');
        return this.options.get("multiple") && e.attr("aria-multiselectable", "true"), this.$results = e;
      }, i.prototype.clear = function () {
        this.$results.empty();
      }, i.prototype.displayMessage = function (e) {
        var t = this.options.get("escapeMarkup");
        this.clear(), this.hideLoading();
        var n = h('<li role="alert" aria-live="assertive" class="select2-results__option"></li>'),
            i = this.options.get("translations").get(e.message);
        n.append(t(i(e.args))), n[0].className += " select2-results__message", this.$results.append(n);
      }, i.prototype.hideMessages = function () {
        this.$results.find(".select2-results__message").remove();
      }, i.prototype.append = function (e) {
        this.hideLoading();
        var t = [];

        if (null != e.results && 0 !== e.results.length) {
          e.results = this.sort(e.results);

          for (var n = 0; n < e.results.length; n++) {
            var i = e.results[n],
                o = this.option(i);
            t.push(o);
          }

          this.$results.append(t);
        } else 0 === this.$results.children().length && this.trigger("results:message", {
          message: "noResults"
        });
      }, i.prototype.position = function (e, t) {
        t.find(".select2-results").append(e);
      }, i.prototype.sort = function (e) {
        return this.options.get("sorter")(e);
      }, i.prototype.highlightFirstItem = function () {
        var e = this.$results.find(".select2-results__option--selectable"),
            t = e.filter(".select2-results__option--selected");
        0 < t.length ? t.first().trigger("mouseenter") : e.first().trigger("mouseenter"), this.ensureHighlightVisible();
      }, i.prototype.setClasses = function () {
        var t = this;
        this.data.current(function (e) {
          var i = e.map(function (e) {
            return e.id.toString();
          });
          t.$results.find(".select2-results__option--selectable").each(function () {
            var e = h(this),
                t = f.GetData(this, "data"),
                n = "" + t.id;
            null != t.element && t.element.selected || null == t.element && -1 < i.indexOf(n) ? (this.classList.add("select2-results__option--selected"), e.attr("aria-selected", "true")) : (this.classList.remove("select2-results__option--selected"), e.attr("aria-selected", "false"));
          });
        });
      }, i.prototype.showLoading = function (e) {
        this.hideLoading();
        var t = {
          disabled: !0,
          loading: !0,
          text: this.options.get("translations").get("searching")(e)
        },
            n = this.option(t);
        n.className += " loading-results", this.$results.prepend(n);
      }, i.prototype.hideLoading = function () {
        this.$results.find(".loading-results").remove();
      }, i.prototype.option = function (e) {
        var t = document.createElement("li");
        t.classList.add("select2-results__option"), t.classList.add("select2-results__option--selectable");
        var n = {
          role: "option"
        },
            i = window.Element.prototype.matches || window.Element.prototype.msMatchesSelector || window.Element.prototype.webkitMatchesSelector;

        for (var o in (null != e.element && i.call(e.element, ":disabled") || null == e.element && e.disabled) && (n["aria-disabled"] = "true", t.classList.remove("select2-results__option--selectable"), t.classList.add("select2-results__option--disabled")), null == e.id && t.classList.remove("select2-results__option--selectable"), null != e._resultId && (t.id = e._resultId), e.title && (t.title = e.title), e.children && (n.role = "group", n["aria-label"] = e.text, t.classList.remove("select2-results__option--selectable"), t.classList.add("select2-results__option--group")), n) {
          var s = n[o];
          t.setAttribute(o, s);
        }

        if (e.children) {
          var r = h(t),
              a = document.createElement("strong");
          a.className = "select2-results__group", this.template(e, a);

          for (var l = [], c = 0; c < e.children.length; c++) {
            var u = e.children[c],
                d = this.option(u);
            l.push(d);
          }

          var p = h("<ul></ul>", {
            class: "select2-results__options select2-results__options--nested"
          });
          p.append(l), r.append(a), r.append(p);
        } else this.template(e, t);

        return f.StoreData(t, "data", e), t;
      }, i.prototype.bind = function (t, e) {
        var l = this,
            n = t.id + "-results";
        this.$results.attr("id", n), t.on("results:all", function (e) {
          l.clear(), l.append(e.data), t.isOpen() && (l.setClasses(), l.highlightFirstItem());
        }), t.on("results:append", function (e) {
          l.append(e.data), t.isOpen() && l.setClasses();
        }), t.on("query", function (e) {
          l.hideMessages(), l.showLoading(e);
        }), t.on("select", function () {
          t.isOpen() && (l.setClasses(), l.options.get("scrollAfterSelect") && l.highlightFirstItem());
        }), t.on("unselect", function () {
          t.isOpen() && (l.setClasses(), l.options.get("scrollAfterSelect") && l.highlightFirstItem());
        }), t.on("open", function () {
          l.$results.attr("aria-expanded", "true"), l.$results.attr("aria-hidden", "false"), l.setClasses(), l.ensureHighlightVisible();
        }), t.on("close", function () {
          l.$results.attr("aria-expanded", "false"), l.$results.attr("aria-hidden", "true"), l.$results.removeAttr("aria-activedescendant");
        }), t.on("results:toggle", function () {
          var e = l.getHighlightedResults();
          0 !== e.length && e.trigger("mouseup");
        }), t.on("results:select", function () {
          var e = l.getHighlightedResults();

          if (0 !== e.length) {
            var t = f.GetData(e[0], "data");
            e.hasClass("select2-results__option--selected") ? l.trigger("close", {}) : l.trigger("select", {
              data: t
            });
          }
        }), t.on("results:previous", function () {
          var e = l.getHighlightedResults(),
              t = l.$results.find(".select2-results__option--selectable"),
              n = t.index(e);

          if (!(n <= 0)) {
            var i = n - 1;
            0 === e.length && (i = 0);
            var o = t.eq(i);
            o.trigger("mouseenter");
            var s = l.$results.offset().top,
                r = o.offset().top,
                a = l.$results.scrollTop() + (r - s);
            0 === i ? l.$results.scrollTop(0) : r - s < 0 && l.$results.scrollTop(a);
          }
        }), t.on("results:next", function () {
          var e = l.getHighlightedResults(),
              t = l.$results.find(".select2-results__option--selectable"),
              n = t.index(e) + 1;

          if (!(n >= t.length)) {
            var i = t.eq(n);
            i.trigger("mouseenter");
            var o = l.$results.offset().top + l.$results.outerHeight(!1),
                s = i.offset().top + i.outerHeight(!1),
                r = l.$results.scrollTop() + s - o;
            0 === n ? l.$results.scrollTop(0) : o < s && l.$results.scrollTop(r);
          }
        }), t.on("results:focus", function (e) {
          e.element[0].classList.add("select2-results__option--highlighted"), e.element[0].setAttribute("aria-selected", "true");
        }), t.on("results:message", function (e) {
          l.displayMessage(e);
        }), h.fn.mousewheel && this.$results.on("mousewheel", function (e) {
          var t = l.$results.scrollTop(),
              n = l.$results.get(0).scrollHeight - t + e.deltaY,
              i = 0 < e.deltaY && t - e.deltaY <= 0,
              o = e.deltaY < 0 && n <= l.$results.height();
          i ? (l.$results.scrollTop(0), e.preventDefault(), e.stopPropagation()) : o && (l.$results.scrollTop(l.$results.get(0).scrollHeight - l.$results.height()), e.preventDefault(), e.stopPropagation());
        }), this.$results.on("mouseup", ".select2-results__option--selectable", function (e) {
          var t = h(this),
              n = f.GetData(this, "data");
          t.hasClass("select2-results__option--selected") ? l.options.get("multiple") ? l.trigger("unselect", {
            originalEvent: e,
            data: n
          }) : l.trigger("close", {}) : l.trigger("select", {
            originalEvent: e,
            data: n
          });
        }), this.$results.on("mouseenter", ".select2-results__option--selectable", function (e) {
          var t = f.GetData(this, "data");
          l.getHighlightedResults().removeClass("select2-results__option--highlighted").attr("aria-selected", "false"), l.trigger("results:focus", {
            data: t,
            element: h(this)
          });
        });
      }, i.prototype.getHighlightedResults = function () {
        return this.$results.find(".select2-results__option--highlighted");
      }, i.prototype.destroy = function () {
        this.$results.remove();
      }, i.prototype.ensureHighlightVisible = function () {
        var e = this.getHighlightedResults();

        if (0 !== e.length) {
          var t = this.$results.find(".select2-results__option--selectable").index(e),
              n = this.$results.offset().top,
              i = e.offset().top,
              o = this.$results.scrollTop() + (i - n),
              s = i - n;
          o -= 2 * e.outerHeight(!1), t <= 2 ? this.$results.scrollTop(0) : (s > this.$results.outerHeight() || s < 0) && this.$results.scrollTop(o);
        }
      }, i.prototype.template = function (e, t) {
        var n = this.options.get("templateResult"),
            i = this.options.get("escapeMarkup"),
            o = n(e, t);
        null == o ? t.style.display = "none" : "string" == typeof o ? t.innerHTML = i(o) : h(t).append(o);
      }, i;
    }), e.define("select2/keys", [], function () {
      return {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        ESC: 27,
        SPACE: 32,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        DELETE: 46
      };
    }), e.define("select2/selection/base", ["jquery", "../utils", "../keys"], function (n, i, o) {
      function s(e, t) {
        this.$element = e, this.options = t, s.__super__.constructor.call(this);
      }

      return i.Extend(s, i.Observable), s.prototype.render = function () {
        var e = n('<span class="select2-selection" role="combobox"  aria-haspopup="true" aria-expanded="false"></span>');
        return this._tabindex = 0, null != i.GetData(this.$element[0], "old-tabindex") ? this._tabindex = i.GetData(this.$element[0], "old-tabindex") : null != this.$element.attr("tabindex") && (this._tabindex = this.$element.attr("tabindex")), e.attr("title", this.$element.attr("title")), e.attr("tabindex", this._tabindex), e.attr("aria-disabled", "false"), this.$selection = e;
      }, s.prototype.bind = function (e, t) {
        var n = this,
            i = e.id + "-results";
        this.container = e, this.$selection.on("focus", function (e) {
          n.trigger("focus", e);
        }), this.$selection.on("blur", function (e) {
          n._handleBlur(e);
        }), this.$selection.on("keydown", function (e) {
          n.trigger("keypress", e), e.which === o.SPACE && e.preventDefault();
        }), e.on("results:focus", function (e) {
          n.$selection.attr("aria-activedescendant", e.data._resultId);
        }), e.on("selection:update", function (e) {
          n.update(e.data);
        }), e.on("open", function () {
          n.$selection.attr("aria-expanded", "true"), n.$selection.attr("aria-owns", i), n._attachCloseHandler(e);
        }), e.on("close", function () {
          n.$selection.attr("aria-expanded", "false"), n.$selection.removeAttr("aria-activedescendant"), n.$selection.removeAttr("aria-owns"), n.$selection.trigger("focus"), n._detachCloseHandler(e);
        }), e.on("enable", function () {
          n.$selection.attr("tabindex", n._tabindex), n.$selection.attr("aria-disabled", "false");
        }), e.on("disable", function () {
          n.$selection.attr("tabindex", "-1"), n.$selection.attr("aria-disabled", "true");
        });
      }, s.prototype._handleBlur = function (e) {
        var t = this;
        window.setTimeout(function () {
          document.activeElement == t.$selection[0] || n.contains(t.$selection[0], document.activeElement) || t.trigger("blur", e);
        }, 1);
      }, s.prototype._attachCloseHandler = function (e) {
        n(document.body).on("mousedown.select2." + e.id, function (e) {
          var t = n(e.target).closest(".select2");
          n(".select2.select2-container--open").each(function () {
            this != t[0] && i.GetData(this, "element").select2("close");
          });
        });
      }, s.prototype._detachCloseHandler = function (e) {
        n(document.body).off("mousedown.select2." + e.id);
      }, s.prototype.position = function (e, t) {
        t.find(".selection").append(e);
      }, s.prototype.destroy = function () {
        this._detachCloseHandler(this.container);
      }, s.prototype.update = function (e) {
        throw new Error("The `update` method must be defined in child classes.");
      }, s.prototype.isEnabled = function () {
        return !this.isDisabled();
      }, s.prototype.isDisabled = function () {
        return this.options.get("disabled");
      }, s;
    }), e.define("select2/selection/single", ["jquery", "./base", "../utils", "../keys"], function (e, t, n, i) {
      function o() {
        o.__super__.constructor.apply(this, arguments);
      }

      return n.Extend(o, t), o.prototype.render = function () {
        var e = o.__super__.render.call(this);

        return e[0].classList.add("select2-selection--single"), e.html('<span class="select2-selection__rendered"></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span>'), e;
      }, o.prototype.bind = function (t, e) {
        var n = this;

        o.__super__.bind.apply(this, arguments);

        var i = t.id + "-container";
        this.$selection.find(".select2-selection__rendered").attr("id", i).attr("role", "textbox").attr("aria-readonly", "true"), this.$selection.attr("aria-labelledby", i), this.$selection.on("mousedown", function (e) {
          1 === e.which && n.trigger("toggle", {
            originalEvent: e
          });
        }), this.$selection.on("focus", function (e) {}), this.$selection.on("blur", function (e) {}), t.on("focus", function (e) {
          t.isOpen() || n.$selection.trigger("focus");
        });
      }, o.prototype.clear = function () {
        var e = this.$selection.find(".select2-selection__rendered");
        e.empty(), e.removeAttr("title");
      }, o.prototype.display = function (e, t) {
        var n = this.options.get("templateSelection");
        return this.options.get("escapeMarkup")(n(e, t));
      }, o.prototype.selectionContainer = function () {
        return e("<span></span>");
      }, o.prototype.update = function (e) {
        if (0 !== e.length) {
          var t = e[0],
              n = this.$selection.find(".select2-selection__rendered"),
              i = this.display(t, n);
          n.empty().append(i);
          var o = t.title || t.text;
          o ? n.attr("title", o) : n.removeAttr("title");
        } else this.clear();
      }, o;
    }), e.define("select2/selection/multiple", ["jquery", "./base", "../utils"], function (o, e, d) {
      function s(e, t) {
        s.__super__.constructor.apply(this, arguments);
      }

      return d.Extend(s, e), s.prototype.render = function () {
        var e = s.__super__.render.call(this);

        return e[0].classList.add("select2-selection--multiple"), e.html('<ul class="select2-selection__rendered"></ul>'), e;
      }, s.prototype.bind = function (e, t) {
        var i = this;

        s.__super__.bind.apply(this, arguments);

        var n = e.id + "-container";
        this.$selection.find(".select2-selection__rendered").attr("id", n), this.$selection.on("click", function (e) {
          i.trigger("toggle", {
            originalEvent: e
          });
        }), this.$selection.on("click", ".select2-selection__choice__remove", function (e) {
          if (!i.isDisabled()) {
            var t = o(this).parent(),
                n = d.GetData(t[0], "data");
            i.trigger("unselect", {
              originalEvent: e,
              data: n
            });
          }
        }), this.$selection.on("keydown", ".select2-selection__choice__remove", function (e) {
          i.isDisabled() || e.stopPropagation();
        });
      }, s.prototype.clear = function () {
        var e = this.$selection.find(".select2-selection__rendered");
        e.empty(), e.removeAttr("title");
      }, s.prototype.display = function (e, t) {
        var n = this.options.get("templateSelection");
        return this.options.get("escapeMarkup")(n(e, t));
      }, s.prototype.selectionContainer = function () {
        return o('<li class="select2-selection__choice"><button type="button" class="select2-selection__choice__remove" tabindex="-1"><span aria-hidden="true">&times;</span></button><span class="select2-selection__choice__display"></span></li>');
      }, s.prototype.update = function (e) {
        if (this.clear(), 0 !== e.length) {
          for (var t = [], n = this.$selection.find(".select2-selection__rendered").attr("id") + "-choice-", i = 0; i < e.length; i++) {
            var o = e[i],
                s = this.selectionContainer(),
                r = this.display(o, s),
                a = n + d.generateChars(4) + "-";
            o.id ? a += o.id : a += d.generateChars(4), s.find(".select2-selection__choice__display").append(r).attr("id", a);
            var l = o.title || o.text;
            l && s.attr("title", l);
            var c = this.options.get("translations").get("removeItem"),
                u = s.find(".select2-selection__choice__remove");
            u.attr("title", c()), u.attr("aria-label", c()), u.attr("aria-describedby", a), d.StoreData(s[0], "data", o), t.push(s);
          }

          this.$selection.find(".select2-selection__rendered").append(t);
        }
      }, s;
    }), e.define("select2/selection/placeholder", [], function () {
      function e(e, t, n) {
        this.placeholder = this.normalizePlaceholder(n.get("placeholder")), e.call(this, t, n);
      }

      return e.prototype.normalizePlaceholder = function (e, t) {
        return "string" == typeof t && (t = {
          id: "",
          text: t
        }), t;
      }, e.prototype.createPlaceholder = function (e, t) {
        var n = this.selectionContainer();
        return n.html(this.display(t)), n[0].classList.add("select2-selection__placeholder"), n[0].classList.remove("select2-selection__choice"), n;
      }, e.prototype.update = function (e, t) {
        var n = 1 == t.length && t[0].id != this.placeholder.id;
        if (1 < t.length || n) return e.call(this, t);
        this.clear();
        var i = this.createPlaceholder(this.placeholder);
        this.$selection.find(".select2-selection__rendered").append(i);
      }, e;
    }), e.define("select2/selection/allowClear", ["jquery", "../keys", "../utils"], function (s, i, a) {
      function e() {}

      return e.prototype.bind = function (e, t, n) {
        var i = this;
        e.call(this, t, n), null == this.placeholder && this.options.get("debug") && window.console && console.error && console.error("Select2: The `allowClear` option should be used in combination with the `placeholder` option."), this.$selection.on("mousedown", ".select2-selection__clear", function (e) {
          i._handleClear(e);
        }), t.on("keypress", function (e) {
          i._handleKeyboardClear(e, t);
        });
      }, e.prototype._handleClear = function (e, t) {
        if (!this.isDisabled()) {
          var n = this.$selection.find(".select2-selection__clear");

          if (0 !== n.length) {
            t.stopPropagation();
            var i = a.GetData(n[0], "data"),
                o = this.$element.val();
            this.$element.val(this.placeholder.id);
            var s = {
              data: i
            };
            if (this.trigger("clear", s), s.prevented) this.$element.val(o);else {
              for (var r = 0; r < i.length; r++) {
                if (s = {
                  data: i[r]
                }, this.trigger("unselect", s), s.prevented) return void this.$element.val(o);
              }

              this.$element.trigger("input").trigger("change"), this.trigger("toggle", {});
            }
          }
        }
      }, e.prototype._handleKeyboardClear = function (e, t, n) {
        n.isOpen() || t.which != i.DELETE && t.which != i.BACKSPACE || this._handleClear(t);
      }, e.prototype.update = function (e, t) {
        if (e.call(this, t), this.$selection.find(".select2-selection__clear").remove(), !(0 < this.$selection.find(".select2-selection__placeholder").length || 0 === t.length)) {
          var n = this.$selection.find(".select2-selection__rendered").attr("id"),
              i = this.options.get("translations").get("removeAllItems"),
              o = s('<button type="button" class="select2-selection__clear" tabindex="-1"><span aria-hidden="true">&times;</span></button>');
          o.attr("title", i()), o.attr("aria-label", i()), o.attr("aria-describedby", n), a.StoreData(o[0], "data", t), this.$selection.prepend(o);
        }
      }, e;
    }), e.define("select2/selection/search", ["jquery", "../utils", "../keys"], function (i, l, c) {
      function e(e, t, n) {
        e.call(this, t, n);
      }

      return e.prototype.render = function (e) {
        var t = i('<span class="select2-search select2-search--inline"><input class="select2-search__field" type="search" tabindex="-1" autocorrect="off" autocapitalize="none" spellcheck="false" role="searchbox" aria-autocomplete="list" /></span>');
        this.$searchContainer = t, this.$search = t.find("input"), this.$search.prop("autocomplete", this.options.get("autocomplete"));
        var n = e.call(this);
        return this._transferTabIndex(), n.append(this.$searchContainer), n;
      }, e.prototype.bind = function (e, t, n) {
        var i = this,
            o = t.id + "-results",
            s = t.id + "-container";
        e.call(this, t, n), i.$search.attr("aria-describedby", s), t.on("open", function () {
          i.$search.attr("aria-controls", o), i.$search.trigger("focus");
        }), t.on("close", function () {
          i.$search.val(""), i.resizeSearch(), i.$search.removeAttr("aria-controls"), i.$search.removeAttr("aria-activedescendant"), i.$search.trigger("focus");
        }), t.on("enable", function () {
          i.$search.prop("disabled", !1), i._transferTabIndex();
        }), t.on("disable", function () {
          i.$search.prop("disabled", !0);
        }), t.on("focus", function (e) {
          i.$search.trigger("focus");
        }), t.on("results:focus", function (e) {
          e.data._resultId ? i.$search.attr("aria-activedescendant", e.data._resultId) : i.$search.removeAttr("aria-activedescendant");
        }), this.$selection.on("focusin", ".select2-search--inline", function (e) {
          i.trigger("focus", e);
        }), this.$selection.on("focusout", ".select2-search--inline", function (e) {
          i._handleBlur(e);
        }), this.$selection.on("keydown", ".select2-search--inline", function (e) {
          if (e.stopPropagation(), i.trigger("keypress", e), i._keyUpPrevented = e.isDefaultPrevented(), e.which === c.BACKSPACE && "" === i.$search.val()) {
            var t = i.$selection.find(".select2-selection__choice").last();

            if (0 < t.length) {
              var n = l.GetData(t[0], "data");
              i.searchRemoveChoice(n), e.preventDefault();
            }
          }
        }), this.$selection.on("click", ".select2-search--inline", function (e) {
          i.$search.val() && e.stopPropagation();
        });
        var r = document.documentMode,
            a = r && r <= 11;
        this.$selection.on("input.searchcheck", ".select2-search--inline", function (e) {
          a ? i.$selection.off("input.search input.searchcheck") : i.$selection.off("keyup.search");
        }), this.$selection.on("keyup.search input.search", ".select2-search--inline", function (e) {
          if (a && "input" === e.type) i.$selection.off("input.search input.searchcheck");else {
            var t = e.which;
            t != c.SHIFT && t != c.CTRL && t != c.ALT && t != c.TAB && i.handleSearch(e);
          }
        });
      }, e.prototype._transferTabIndex = function (e) {
        this.$search.attr("tabindex", this.$selection.attr("tabindex")), this.$selection.attr("tabindex", "-1");
      }, e.prototype.createPlaceholder = function (e, t) {
        this.$search.attr("placeholder", t.text);
      }, e.prototype.update = function (e, t) {
        var n = this.$search[0] == document.activeElement;
        this.$search.attr("placeholder", ""), e.call(this, t), this.resizeSearch(), n && this.$search.trigger("focus");
      }, e.prototype.handleSearch = function () {
        if (this.resizeSearch(), !this._keyUpPrevented) {
          var e = this.$search.val();
          this.trigger("query", {
            term: e
          });
        }

        this._keyUpPrevented = !1;
      }, e.prototype.searchRemoveChoice = function (e, t) {
        this.trigger("unselect", {
          data: t
        }), this.$search.val(t.text), this.handleSearch();
      }, e.prototype.resizeSearch = function () {
        this.$search.css("width", "25px");
        var e = "100%";
        "" === this.$search.attr("placeholder") && (e = .75 * (this.$search.val().length + 1) + "em");
        this.$search.css("width", e);
      }, e;
    }), e.define("select2/selection/selectionCss", ["../utils"], function (i) {
      function e() {}

      return e.prototype.render = function (e) {
        var t = e.call(this),
            n = this.options.get("selectionCssClass") || "";
        return -1 !== n.indexOf(":all:") && (n = n.replace(":all:", ""), i.copyNonInternalCssClasses(t[0], this.$element[0])), t.addClass(n), t;
      }, e;
    }), e.define("select2/selection/eventRelay", ["jquery"], function (r) {
      function e() {}

      return e.prototype.bind = function (e, t, n) {
        var i = this,
            o = ["open", "opening", "close", "closing", "select", "selecting", "unselect", "unselecting", "clear", "clearing"],
            s = ["opening", "closing", "selecting", "unselecting", "clearing"];
        e.call(this, t, n), t.on("*", function (e, t) {
          if (-1 !== o.indexOf(e)) {
            t = t || {};
            var n = r.Event("select2:" + e, {
              params: t
            });
            i.$element.trigger(n), -1 !== s.indexOf(e) && (t.prevented = n.isDefaultPrevented());
          }
        });
      }, e;
    }), e.define("select2/translation", ["jquery", "require"], function (t, n) {
      function i(e) {
        this.dict = e || {};
      }

      return i.prototype.all = function () {
        return this.dict;
      }, i.prototype.get = function (e) {
        return this.dict[e];
      }, i.prototype.extend = function (e) {
        this.dict = t.extend({}, e.all(), this.dict);
      }, i._cache = {}, i.loadPath = function (e) {
        if (!(e in i._cache)) {
          var t = n(e);
          i._cache[e] = t;
        }

        return new i(i._cache[e]);
      }, i;
    }), e.define("select2/diacritics", [], function () {
      return {
        "Ⓐ": "A",
        "Ａ": "A",
        "À": "A",
        "Á": "A",
        "Â": "A",
        "Ầ": "A",
        "Ấ": "A",
        "Ẫ": "A",
        "Ẩ": "A",
        "Ã": "A",
        "Ā": "A",
        "Ă": "A",
        "Ằ": "A",
        "Ắ": "A",
        "Ẵ": "A",
        "Ẳ": "A",
        "Ȧ": "A",
        "Ǡ": "A",
        "Ä": "A",
        "Ǟ": "A",
        "Ả": "A",
        "Å": "A",
        "Ǻ": "A",
        "Ǎ": "A",
        "Ȁ": "A",
        "Ȃ": "A",
        "Ạ": "A",
        "Ậ": "A",
        "Ặ": "A",
        "Ḁ": "A",
        "Ą": "A",
        "Ⱥ": "A",
        "Ɐ": "A",
        "Ꜳ": "AA",
        "Æ": "AE",
        "Ǽ": "AE",
        "Ǣ": "AE",
        "Ꜵ": "AO",
        "Ꜷ": "AU",
        "Ꜹ": "AV",
        "Ꜻ": "AV",
        "Ꜽ": "AY",
        "Ⓑ": "B",
        "Ｂ": "B",
        "Ḃ": "B",
        "Ḅ": "B",
        "Ḇ": "B",
        "Ƀ": "B",
        "Ƃ": "B",
        "Ɓ": "B",
        "Ⓒ": "C",
        "Ｃ": "C",
        "Ć": "C",
        "Ĉ": "C",
        "Ċ": "C",
        "Č": "C",
        "Ç": "C",
        "Ḉ": "C",
        "Ƈ": "C",
        "Ȼ": "C",
        "Ꜿ": "C",
        "Ⓓ": "D",
        "Ｄ": "D",
        "Ḋ": "D",
        "Ď": "D",
        "Ḍ": "D",
        "Ḑ": "D",
        "Ḓ": "D",
        "Ḏ": "D",
        "Đ": "D",
        "Ƌ": "D",
        "Ɗ": "D",
        "Ɖ": "D",
        "Ꝺ": "D",
        "Ǳ": "DZ",
        "Ǆ": "DZ",
        "ǲ": "Dz",
        "ǅ": "Dz",
        "Ⓔ": "E",
        "Ｅ": "E",
        "È": "E",
        "É": "E",
        "Ê": "E",
        "Ề": "E",
        "Ế": "E",
        "Ễ": "E",
        "Ể": "E",
        "Ẽ": "E",
        "Ē": "E",
        "Ḕ": "E",
        "Ḗ": "E",
        "Ĕ": "E",
        "Ė": "E",
        "Ë": "E",
        "Ẻ": "E",
        "Ě": "E",
        "Ȅ": "E",
        "Ȇ": "E",
        "Ẹ": "E",
        "Ệ": "E",
        "Ȩ": "E",
        "Ḝ": "E",
        "Ę": "E",
        "Ḙ": "E",
        "Ḛ": "E",
        "Ɛ": "E",
        "Ǝ": "E",
        "Ⓕ": "F",
        "Ｆ": "F",
        "Ḟ": "F",
        "Ƒ": "F",
        "Ꝼ": "F",
        "Ⓖ": "G",
        "Ｇ": "G",
        "Ǵ": "G",
        "Ĝ": "G",
        "Ḡ": "G",
        "Ğ": "G",
        "Ġ": "G",
        "Ǧ": "G",
        "Ģ": "G",
        "Ǥ": "G",
        "Ɠ": "G",
        "Ꞡ": "G",
        "Ᵹ": "G",
        "Ꝿ": "G",
        "Ⓗ": "H",
        "Ｈ": "H",
        "Ĥ": "H",
        "Ḣ": "H",
        "Ḧ": "H",
        "Ȟ": "H",
        "Ḥ": "H",
        "Ḩ": "H",
        "Ḫ": "H",
        "Ħ": "H",
        "Ⱨ": "H",
        "Ⱶ": "H",
        "Ɥ": "H",
        "Ⓘ": "I",
        "Ｉ": "I",
        "Ì": "I",
        "Í": "I",
        "Î": "I",
        "Ĩ": "I",
        "Ī": "I",
        "Ĭ": "I",
        "İ": "I",
        "Ï": "I",
        "Ḯ": "I",
        "Ỉ": "I",
        "Ǐ": "I",
        "Ȉ": "I",
        "Ȋ": "I",
        "Ị": "I",
        "Į": "I",
        "Ḭ": "I",
        "Ɨ": "I",
        "Ⓙ": "J",
        "Ｊ": "J",
        "Ĵ": "J",
        "Ɉ": "J",
        "Ⓚ": "K",
        "Ｋ": "K",
        "Ḱ": "K",
        "Ǩ": "K",
        "Ḳ": "K",
        "Ķ": "K",
        "Ḵ": "K",
        "Ƙ": "K",
        "Ⱪ": "K",
        "Ꝁ": "K",
        "Ꝃ": "K",
        "Ꝅ": "K",
        "Ꞣ": "K",
        "Ⓛ": "L",
        "Ｌ": "L",
        "Ŀ": "L",
        "Ĺ": "L",
        "Ľ": "L",
        "Ḷ": "L",
        "Ḹ": "L",
        "Ļ": "L",
        "Ḽ": "L",
        "Ḻ": "L",
        "Ł": "L",
        "Ƚ": "L",
        "Ɫ": "L",
        "Ⱡ": "L",
        "Ꝉ": "L",
        "Ꝇ": "L",
        "Ꞁ": "L",
        "Ǉ": "LJ",
        "ǈ": "Lj",
        "Ⓜ": "M",
        "Ｍ": "M",
        "Ḿ": "M",
        "Ṁ": "M",
        "Ṃ": "M",
        "Ɱ": "M",
        "Ɯ": "M",
        "Ⓝ": "N",
        "Ｎ": "N",
        "Ǹ": "N",
        "Ń": "N",
        "Ñ": "N",
        "Ṅ": "N",
        "Ň": "N",
        "Ṇ": "N",
        "Ņ": "N",
        "Ṋ": "N",
        "Ṉ": "N",
        "Ƞ": "N",
        "Ɲ": "N",
        "Ꞑ": "N",
        "Ꞥ": "N",
        "Ǌ": "NJ",
        "ǋ": "Nj",
        "Ⓞ": "O",
        "Ｏ": "O",
        "Ò": "O",
        "Ó": "O",
        "Ô": "O",
        "Ồ": "O",
        "Ố": "O",
        "Ỗ": "O",
        "Ổ": "O",
        "Õ": "O",
        "Ṍ": "O",
        "Ȭ": "O",
        "Ṏ": "O",
        "Ō": "O",
        "Ṑ": "O",
        "Ṓ": "O",
        "Ŏ": "O",
        "Ȯ": "O",
        "Ȱ": "O",
        "Ö": "O",
        "Ȫ": "O",
        "Ỏ": "O",
        "Ő": "O",
        "Ǒ": "O",
        "Ȍ": "O",
        "Ȏ": "O",
        "Ơ": "O",
        "Ờ": "O",
        "Ớ": "O",
        "Ỡ": "O",
        "Ở": "O",
        "Ợ": "O",
        "Ọ": "O",
        "Ộ": "O",
        "Ǫ": "O",
        "Ǭ": "O",
        "Ø": "O",
        "Ǿ": "O",
        "Ɔ": "O",
        "Ɵ": "O",
        "Ꝋ": "O",
        "Ꝍ": "O",
        "Œ": "OE",
        "Ƣ": "OI",
        "Ꝏ": "OO",
        "Ȣ": "OU",
        "Ⓟ": "P",
        "Ｐ": "P",
        "Ṕ": "P",
        "Ṗ": "P",
        "Ƥ": "P",
        "Ᵽ": "P",
        "Ꝑ": "P",
        "Ꝓ": "P",
        "Ꝕ": "P",
        "Ⓠ": "Q",
        "Ｑ": "Q",
        "Ꝗ": "Q",
        "Ꝙ": "Q",
        "Ɋ": "Q",
        "Ⓡ": "R",
        "Ｒ": "R",
        "Ŕ": "R",
        "Ṙ": "R",
        "Ř": "R",
        "Ȑ": "R",
        "Ȓ": "R",
        "Ṛ": "R",
        "Ṝ": "R",
        "Ŗ": "R",
        "Ṟ": "R",
        "Ɍ": "R",
        "Ɽ": "R",
        "Ꝛ": "R",
        "Ꞧ": "R",
        "Ꞃ": "R",
        "Ⓢ": "S",
        "Ｓ": "S",
        "ẞ": "S",
        "Ś": "S",
        "Ṥ": "S",
        "Ŝ": "S",
        "Ṡ": "S",
        "Š": "S",
        "Ṧ": "S",
        "Ṣ": "S",
        "Ṩ": "S",
        "Ș": "S",
        "Ş": "S",
        "Ȿ": "S",
        "Ꞩ": "S",
        "Ꞅ": "S",
        "Ⓣ": "T",
        "Ｔ": "T",
        "Ṫ": "T",
        "Ť": "T",
        "Ṭ": "T",
        "Ț": "T",
        "Ţ": "T",
        "Ṱ": "T",
        "Ṯ": "T",
        "Ŧ": "T",
        "Ƭ": "T",
        "Ʈ": "T",
        "Ⱦ": "T",
        "Ꞇ": "T",
        "Ꜩ": "TZ",
        "Ⓤ": "U",
        "Ｕ": "U",
        "Ù": "U",
        "Ú": "U",
        "Û": "U",
        "Ũ": "U",
        "Ṹ": "U",
        "Ū": "U",
        "Ṻ": "U",
        "Ŭ": "U",
        "Ü": "U",
        "Ǜ": "U",
        "Ǘ": "U",
        "Ǖ": "U",
        "Ǚ": "U",
        "Ủ": "U",
        "Ů": "U",
        "Ű": "U",
        "Ǔ": "U",
        "Ȕ": "U",
        "Ȗ": "U",
        "Ư": "U",
        "Ừ": "U",
        "Ứ": "U",
        "Ữ": "U",
        "Ử": "U",
        "Ự": "U",
        "Ụ": "U",
        "Ṳ": "U",
        "Ų": "U",
        "Ṷ": "U",
        "Ṵ": "U",
        "Ʉ": "U",
        "Ⓥ": "V",
        "Ｖ": "V",
        "Ṽ": "V",
        "Ṿ": "V",
        "Ʋ": "V",
        "Ꝟ": "V",
        "Ʌ": "V",
        "Ꝡ": "VY",
        "Ⓦ": "W",
        "Ｗ": "W",
        "Ẁ": "W",
        "Ẃ": "W",
        "Ŵ": "W",
        "Ẇ": "W",
        "Ẅ": "W",
        "Ẉ": "W",
        "Ⱳ": "W",
        "Ⓧ": "X",
        "Ｘ": "X",
        "Ẋ": "X",
        "Ẍ": "X",
        "Ⓨ": "Y",
        "Ｙ": "Y",
        "Ỳ": "Y",
        "Ý": "Y",
        "Ŷ": "Y",
        "Ỹ": "Y",
        "Ȳ": "Y",
        "Ẏ": "Y",
        "Ÿ": "Y",
        "Ỷ": "Y",
        "Ỵ": "Y",
        "Ƴ": "Y",
        "Ɏ": "Y",
        "Ỿ": "Y",
        "Ⓩ": "Z",
        "Ｚ": "Z",
        "Ź": "Z",
        "Ẑ": "Z",
        "Ż": "Z",
        "Ž": "Z",
        "Ẓ": "Z",
        "Ẕ": "Z",
        "Ƶ": "Z",
        "Ȥ": "Z",
        "Ɀ": "Z",
        "Ⱬ": "Z",
        "Ꝣ": "Z",
        "ⓐ": "a",
        "ａ": "a",
        "ẚ": "a",
        "à": "a",
        "á": "a",
        "â": "a",
        "ầ": "a",
        "ấ": "a",
        "ẫ": "a",
        "ẩ": "a",
        "ã": "a",
        "ā": "a",
        "ă": "a",
        "ằ": "a",
        "ắ": "a",
        "ẵ": "a",
        "ẳ": "a",
        "ȧ": "a",
        "ǡ": "a",
        "ä": "a",
        "ǟ": "a",
        "ả": "a",
        "å": "a",
        "ǻ": "a",
        "ǎ": "a",
        "ȁ": "a",
        "ȃ": "a",
        "ạ": "a",
        "ậ": "a",
        "ặ": "a",
        "ḁ": "a",
        "ą": "a",
        "ⱥ": "a",
        "ɐ": "a",
        "ꜳ": "aa",
        "æ": "ae",
        "ǽ": "ae",
        "ǣ": "ae",
        "ꜵ": "ao",
        "ꜷ": "au",
        "ꜹ": "av",
        "ꜻ": "av",
        "ꜽ": "ay",
        "ⓑ": "b",
        "ｂ": "b",
        "ḃ": "b",
        "ḅ": "b",
        "ḇ": "b",
        "ƀ": "b",
        "ƃ": "b",
        "ɓ": "b",
        "ⓒ": "c",
        "ｃ": "c",
        "ć": "c",
        "ĉ": "c",
        "ċ": "c",
        "č": "c",
        "ç": "c",
        "ḉ": "c",
        "ƈ": "c",
        "ȼ": "c",
        "ꜿ": "c",
        "ↄ": "c",
        "ⓓ": "d",
        "ｄ": "d",
        "ḋ": "d",
        "ď": "d",
        "ḍ": "d",
        "ḑ": "d",
        "ḓ": "d",
        "ḏ": "d",
        "đ": "d",
        "ƌ": "d",
        "ɖ": "d",
        "ɗ": "d",
        "ꝺ": "d",
        "ǳ": "dz",
        "ǆ": "dz",
        "ⓔ": "e",
        "ｅ": "e",
        "è": "e",
        "é": "e",
        "ê": "e",
        "ề": "e",
        "ế": "e",
        "ễ": "e",
        "ể": "e",
        "ẽ": "e",
        "ē": "e",
        "ḕ": "e",
        "ḗ": "e",
        "ĕ": "e",
        "ė": "e",
        "ë": "e",
        "ẻ": "e",
        "ě": "e",
        "ȅ": "e",
        "ȇ": "e",
        "ẹ": "e",
        "ệ": "e",
        "ȩ": "e",
        "ḝ": "e",
        "ę": "e",
        "ḙ": "e",
        "ḛ": "e",
        "ɇ": "e",
        "ɛ": "e",
        "ǝ": "e",
        "ⓕ": "f",
        "ｆ": "f",
        "ḟ": "f",
        "ƒ": "f",
        "ꝼ": "f",
        "ⓖ": "g",
        "ｇ": "g",
        "ǵ": "g",
        "ĝ": "g",
        "ḡ": "g",
        "ğ": "g",
        "ġ": "g",
        "ǧ": "g",
        "ģ": "g",
        "ǥ": "g",
        "ɠ": "g",
        "ꞡ": "g",
        "ᵹ": "g",
        "ꝿ": "g",
        "ⓗ": "h",
        "ｈ": "h",
        "ĥ": "h",
        "ḣ": "h",
        "ḧ": "h",
        "ȟ": "h",
        "ḥ": "h",
        "ḩ": "h",
        "ḫ": "h",
        "ẖ": "h",
        "ħ": "h",
        "ⱨ": "h",
        "ⱶ": "h",
        "ɥ": "h",
        "ƕ": "hv",
        "ⓘ": "i",
        "ｉ": "i",
        "ì": "i",
        "í": "i",
        "î": "i",
        "ĩ": "i",
        "ī": "i",
        "ĭ": "i",
        "ï": "i",
        "ḯ": "i",
        "ỉ": "i",
        "ǐ": "i",
        "ȉ": "i",
        "ȋ": "i",
        "ị": "i",
        "į": "i",
        "ḭ": "i",
        "ɨ": "i",
        "ı": "i",
        "ⓙ": "j",
        "ｊ": "j",
        "ĵ": "j",
        "ǰ": "j",
        "ɉ": "j",
        "ⓚ": "k",
        "ｋ": "k",
        "ḱ": "k",
        "ǩ": "k",
        "ḳ": "k",
        "ķ": "k",
        "ḵ": "k",
        "ƙ": "k",
        "ⱪ": "k",
        "ꝁ": "k",
        "ꝃ": "k",
        "ꝅ": "k",
        "ꞣ": "k",
        "ⓛ": "l",
        "ｌ": "l",
        "ŀ": "l",
        "ĺ": "l",
        "ľ": "l",
        "ḷ": "l",
        "ḹ": "l",
        "ļ": "l",
        "ḽ": "l",
        "ḻ": "l",
        "ſ": "l",
        "ł": "l",
        "ƚ": "l",
        "ɫ": "l",
        "ⱡ": "l",
        "ꝉ": "l",
        "ꞁ": "l",
        "ꝇ": "l",
        "ǉ": "lj",
        "ⓜ": "m",
        "ｍ": "m",
        "ḿ": "m",
        "ṁ": "m",
        "ṃ": "m",
        "ɱ": "m",
        "ɯ": "m",
        "ⓝ": "n",
        "ｎ": "n",
        "ǹ": "n",
        "ń": "n",
        "ñ": "n",
        "ṅ": "n",
        "ň": "n",
        "ṇ": "n",
        "ņ": "n",
        "ṋ": "n",
        "ṉ": "n",
        "ƞ": "n",
        "ɲ": "n",
        "ŉ": "n",
        "ꞑ": "n",
        "ꞥ": "n",
        "ǌ": "nj",
        "ⓞ": "o",
        "ｏ": "o",
        "ò": "o",
        "ó": "o",
        "ô": "o",
        "ồ": "o",
        "ố": "o",
        "ỗ": "o",
        "ổ": "o",
        "õ": "o",
        "ṍ": "o",
        "ȭ": "o",
        "ṏ": "o",
        "ō": "o",
        "ṑ": "o",
        "ṓ": "o",
        "ŏ": "o",
        "ȯ": "o",
        "ȱ": "o",
        "ö": "o",
        "ȫ": "o",
        "ỏ": "o",
        "ő": "o",
        "ǒ": "o",
        "ȍ": "o",
        "ȏ": "o",
        "ơ": "o",
        "ờ": "o",
        "ớ": "o",
        "ỡ": "o",
        "ở": "o",
        "ợ": "o",
        "ọ": "o",
        "ộ": "o",
        "ǫ": "o",
        "ǭ": "o",
        "ø": "o",
        "ǿ": "o",
        "ɔ": "o",
        "ꝋ": "o",
        "ꝍ": "o",
        "ɵ": "o",
        "œ": "oe",
        "ƣ": "oi",
        "ȣ": "ou",
        "ꝏ": "oo",
        "ⓟ": "p",
        "ｐ": "p",
        "ṕ": "p",
        "ṗ": "p",
        "ƥ": "p",
        "ᵽ": "p",
        "ꝑ": "p",
        "ꝓ": "p",
        "ꝕ": "p",
        "ⓠ": "q",
        "ｑ": "q",
        "ɋ": "q",
        "ꝗ": "q",
        "ꝙ": "q",
        "ⓡ": "r",
        "ｒ": "r",
        "ŕ": "r",
        "ṙ": "r",
        "ř": "r",
        "ȑ": "r",
        "ȓ": "r",
        "ṛ": "r",
        "ṝ": "r",
        "ŗ": "r",
        "ṟ": "r",
        "ɍ": "r",
        "ɽ": "r",
        "ꝛ": "r",
        "ꞧ": "r",
        "ꞃ": "r",
        "ⓢ": "s",
        "ｓ": "s",
        "ß": "s",
        "ś": "s",
        "ṥ": "s",
        "ŝ": "s",
        "ṡ": "s",
        "š": "s",
        "ṧ": "s",
        "ṣ": "s",
        "ṩ": "s",
        "ș": "s",
        "ş": "s",
        "ȿ": "s",
        "ꞩ": "s",
        "ꞅ": "s",
        "ẛ": "s",
        "ⓣ": "t",
        "ｔ": "t",
        "ṫ": "t",
        "ẗ": "t",
        "ť": "t",
        "ṭ": "t",
        "ț": "t",
        "ţ": "t",
        "ṱ": "t",
        "ṯ": "t",
        "ŧ": "t",
        "ƭ": "t",
        "ʈ": "t",
        "ⱦ": "t",
        "ꞇ": "t",
        "ꜩ": "tz",
        "ⓤ": "u",
        "ｕ": "u",
        "ù": "u",
        "ú": "u",
        "û": "u",
        "ũ": "u",
        "ṹ": "u",
        "ū": "u",
        "ṻ": "u",
        "ŭ": "u",
        "ü": "u",
        "ǜ": "u",
        "ǘ": "u",
        "ǖ": "u",
        "ǚ": "u",
        "ủ": "u",
        "ů": "u",
        "ű": "u",
        "ǔ": "u",
        "ȕ": "u",
        "ȗ": "u",
        "ư": "u",
        "ừ": "u",
        "ứ": "u",
        "ữ": "u",
        "ử": "u",
        "ự": "u",
        "ụ": "u",
        "ṳ": "u",
        "ų": "u",
        "ṷ": "u",
        "ṵ": "u",
        "ʉ": "u",
        "ⓥ": "v",
        "ｖ": "v",
        "ṽ": "v",
        "ṿ": "v",
        "ʋ": "v",
        "ꝟ": "v",
        "ʌ": "v",
        "ꝡ": "vy",
        "ⓦ": "w",
        "ｗ": "w",
        "ẁ": "w",
        "ẃ": "w",
        "ŵ": "w",
        "ẇ": "w",
        "ẅ": "w",
        "ẘ": "w",
        "ẉ": "w",
        "ⱳ": "w",
        "ⓧ": "x",
        "ｘ": "x",
        "ẋ": "x",
        "ẍ": "x",
        "ⓨ": "y",
        "ｙ": "y",
        "ỳ": "y",
        "ý": "y",
        "ŷ": "y",
        "ỹ": "y",
        "ȳ": "y",
        "ẏ": "y",
        "ÿ": "y",
        "ỷ": "y",
        "ẙ": "y",
        "ỵ": "y",
        "ƴ": "y",
        "ɏ": "y",
        "ỿ": "y",
        "ⓩ": "z",
        "ｚ": "z",
        "ź": "z",
        "ẑ": "z",
        "ż": "z",
        "ž": "z",
        "ẓ": "z",
        "ẕ": "z",
        "ƶ": "z",
        "ȥ": "z",
        "ɀ": "z",
        "ⱬ": "z",
        "ꝣ": "z",
        "Ά": "Α",
        "Έ": "Ε",
        "Ή": "Η",
        "Ί": "Ι",
        "Ϊ": "Ι",
        "Ό": "Ο",
        "Ύ": "Υ",
        "Ϋ": "Υ",
        "Ώ": "Ω",
        "ά": "α",
        "έ": "ε",
        "ή": "η",
        "ί": "ι",
        "ϊ": "ι",
        "ΐ": "ι",
        "ό": "ο",
        "ύ": "υ",
        "ϋ": "υ",
        "ΰ": "υ",
        "ώ": "ω",
        "ς": "σ",
        "’": "'"
      };
    }), e.define("select2/data/base", ["../utils"], function (i) {
      function n(e, t) {
        n.__super__.constructor.call(this);
      }

      return i.Extend(n, i.Observable), n.prototype.current = function (e) {
        throw new Error("The `current` method must be defined in child classes.");
      }, n.prototype.query = function (e, t) {
        throw new Error("The `query` method must be defined in child classes.");
      }, n.prototype.bind = function (e, t) {}, n.prototype.destroy = function () {}, n.prototype.generateResultId = function (e, t) {
        var n = e.id + "-result-";
        return n += i.generateChars(4), null != t.id ? n += "-" + t.id.toString() : n += "-" + i.generateChars(4), n;
      }, n;
    }), e.define("select2/data/select", ["./base", "../utils", "jquery"], function (e, l, c) {
      function n(e, t) {
        this.$element = e, this.options = t, n.__super__.constructor.call(this);
      }

      return l.Extend(n, e), n.prototype.current = function (e) {
        var t = this;
        e(Array.prototype.map.call(this.$element[0].querySelectorAll(":checked"), function (e) {
          return t.item(c(e));
        }));
      }, n.prototype.select = function (o) {
        var s = this;
        if (o.selected = !0, null != o.element && "option" === o.element.tagName.toLowerCase()) return o.element.selected = !0, void this.$element.trigger("input").trigger("change");
        if (this.$element.prop("multiple")) this.current(function (e) {
          var t = [];
          (o = [o]).push.apply(o, e);

          for (var n = 0; n < o.length; n++) {
            var i = o[n].id;
            -1 === t.indexOf(i) && t.push(i);
          }

          s.$element.val(t), s.$element.trigger("input").trigger("change");
        });else {
          var e = o.id;
          this.$element.val(e), this.$element.trigger("input").trigger("change");
        }
      }, n.prototype.unselect = function (o) {
        var s = this;

        if (this.$element.prop("multiple")) {
          if (o.selected = !1, null != o.element && "option" === o.element.tagName.toLowerCase()) return o.element.selected = !1, void this.$element.trigger("input").trigger("change");
          this.current(function (e) {
            for (var t = [], n = 0; n < e.length; n++) {
              var i = e[n].id;
              i !== o.id && -1 === t.indexOf(i) && t.push(i);
            }

            s.$element.val(t), s.$element.trigger("input").trigger("change");
          });
        }
      }, n.prototype.bind = function (e, t) {
        var n = this;
        (this.container = e).on("select", function (e) {
          n.select(e.data);
        }), e.on("unselect", function (e) {
          n.unselect(e.data);
        });
      }, n.prototype.destroy = function () {
        this.$element.find("*").each(function () {
          l.RemoveData(this);
        });
      }, n.prototype.query = function (i, e) {
        var o = [],
            s = this;
        this.$element.children().each(function () {
          if ("option" === this.tagName.toLowerCase() || "optgroup" === this.tagName.toLowerCase()) {
            var e = c(this),
                t = s.item(e),
                n = s.matches(i, t);
            null !== n && o.push(n);
          }
        }), e({
          results: o
        });
      }, n.prototype.addOptions = function (e) {
        this.$element.append(e);
      }, n.prototype.option = function (e) {
        var t;
        e.children ? (t = document.createElement("optgroup")).label = e.text : void 0 !== (t = document.createElement("option")).textContent ? t.textContent = e.text : t.innerText = e.text, void 0 !== e.id && (t.value = e.id), e.disabled && (t.disabled = !0), e.selected && (t.selected = !0), e.title && (t.title = e.title);

        var n = this._normalizeItem(e);

        return n.element = t, l.StoreData(t, "data", n), c(t);
      }, n.prototype.item = function (e) {
        var t = {};
        if (null != (t = l.GetData(e[0], "data"))) return t;
        var n = e[0];
        if ("option" === n.tagName.toLowerCase()) t = {
          id: e.val(),
          text: e.text(),
          disabled: e.prop("disabled"),
          selected: e.prop("selected"),
          title: e.prop("title")
        };else if ("optgroup" === n.tagName.toLowerCase()) {
          t = {
            text: e.prop("label"),
            children: [],
            title: e.prop("title")
          };

          for (var i = e.children("option"), o = [], s = 0; s < i.length; s++) {
            var r = c(i[s]),
                a = this.item(r);
            o.push(a);
          }

          t.children = o;
        }
        return (t = this._normalizeItem(t)).element = e[0], l.StoreData(e[0], "data", t), t;
      }, n.prototype._normalizeItem = function (e) {
        e !== Object(e) && (e = {
          id: e,
          text: e
        });
        return null != (e = c.extend({}, {
          text: ""
        }, e)).id && (e.id = e.id.toString()), null != e.text && (e.text = e.text.toString()), null == e._resultId && e.id && null != this.container && (e._resultId = this.generateResultId(this.container, e)), c.extend({}, {
          selected: !1,
          disabled: !1
        }, e);
      }, n.prototype.matches = function (e, t) {
        return this.options.get("matcher")(e, t);
      }, n;
    }), e.define("select2/data/array", ["./select", "../utils", "jquery"], function (e, t, f) {
      function i(e, t) {
        this._dataToConvert = t.get("data") || [], i.__super__.constructor.call(this, e, t);
      }

      return t.Extend(i, e), i.prototype.bind = function (e, t) {
        i.__super__.bind.call(this, e, t), this.addOptions(this.convertToOptions(this._dataToConvert));
      }, i.prototype.select = function (n) {
        var e = this.$element.find("option").filter(function (e, t) {
          return t.value == n.id.toString();
        });
        0 === e.length && (e = this.option(n), this.addOptions(e)), i.__super__.select.call(this, n);
      }, i.prototype.convertToOptions = function (e) {
        var t = this,
            n = this.$element.find("option"),
            i = n.map(function () {
          return t.item(f(this)).id;
        }).get(),
            o = [];

        function s(e) {
          return function () {
            return f(this).val() == e.id;
          };
        }

        for (var r = 0; r < e.length; r++) {
          var a = this._normalizeItem(e[r]);

          if (0 <= i.indexOf(a.id)) {
            var l = n.filter(s(a)),
                c = this.item(l),
                u = f.extend(!0, {}, a, c),
                d = this.option(u);
            l.replaceWith(d);
          } else {
            var p = this.option(a);

            if (a.children) {
              var h = this.convertToOptions(a.children);
              p.append(h);
            }

            o.push(p);
          }
        }

        return o;
      }, i;
    }), e.define("select2/data/ajax", ["./array", "../utils", "jquery"], function (e, t, s) {
      function n(e, t) {
        this.ajaxOptions = this._applyDefaults(t.get("ajax")), null != this.ajaxOptions.processResults && (this.processResults = this.ajaxOptions.processResults), n.__super__.constructor.call(this, e, t);
      }

      return t.Extend(n, e), n.prototype._applyDefaults = function (e) {
        var t = {
          data: function data(e) {
            return s.extend({}, e, {
              q: e.term
            });
          },
          transport: function transport(e, t, n) {
            var i = s.ajax(e);
            return i.then(t), i.fail(n), i;
          }
        };
        return s.extend({}, t, e, !0);
      }, n.prototype.processResults = function (e) {
        return e;
      }, n.prototype.query = function (n, i) {
        var o = this;
        null != this._request && (s.isFunction(this._request.abort) && this._request.abort(), this._request = null);
        var t = s.extend({
          type: "GET"
        }, this.ajaxOptions);

        function e() {
          var e = t.transport(t, function (e) {
            var t = o.processResults(e, n);
            o.options.get("debug") && window.console && console.error && (t && t.results && Array.isArray(t.results) || console.error("Select2: The AJAX results did not return an array in the `results` key of the response.")), i(t);
          }, function () {
            "status" in e && (0 === e.status || "0" === e.status) || o.trigger("results:message", {
              message: "errorLoading"
            });
          });
          o._request = e;
        }

        "function" == typeof t.url && (t.url = t.url.call(this.$element, n)), "function" == typeof t.data && (t.data = t.data.call(this.$element, n)), this.ajaxOptions.delay && null != n.term ? (this._queryTimeout && window.clearTimeout(this._queryTimeout), this._queryTimeout = window.setTimeout(e, this.ajaxOptions.delay)) : e();
      }, n;
    }), e.define("select2/data/tags", ["jquery"], function (t) {
      function e(e, t, n) {
        var i = n.get("tags"),
            o = n.get("createTag");
        void 0 !== o && (this.createTag = o);
        var s = n.get("insertTag");
        if (void 0 !== s && (this.insertTag = s), e.call(this, t, n), Array.isArray(i)) for (var r = 0; r < i.length; r++) {
          var a = i[r],
              l = this._normalizeItem(a),
              c = this.option(l);

          this.$element.append(c);
        }
      }

      return e.prototype.query = function (e, c, u) {
        var d = this;
        this._removeOldTags(), null != c.term && null == c.page ? e.call(this, c, function e(t, n) {
          for (var i = t.results, o = 0; o < i.length; o++) {
            var s = i[o],
                r = null != s.children && !e({
              results: s.children
            }, !0);
            if ((s.text || "").toUpperCase() === (c.term || "").toUpperCase() || r) return !n && (t.data = i, void u(t));
          }

          if (n) return !0;
          var a = d.createTag(c);

          if (null != a) {
            var l = d.option(a);
            l.attr("data-select2-tag", !0), d.addOptions([l]), d.insertTag(i, a);
          }

          t.results = i, u(t);
        }) : e.call(this, c, u);
      }, e.prototype.createTag = function (e, t) {
        if (null == t.term) return null;
        var n = t.term.trim();
        return "" === n ? null : {
          id: n,
          text: n
        };
      }, e.prototype.insertTag = function (e, t, n) {
        t.unshift(n);
      }, e.prototype._removeOldTags = function (e) {
        this.$element.find("option[data-select2-tag]").each(function () {
          this.selected || t(this).remove();
        });
      }, e;
    }), e.define("select2/data/tokenizer", ["jquery"], function (d) {
      function e(e, t, n) {
        var i = n.get("tokenizer");
        void 0 !== i && (this.tokenizer = i), e.call(this, t, n);
      }

      return e.prototype.bind = function (e, t, n) {
        e.call(this, t, n), this.$search = t.dropdown.$search || t.selection.$search || n.find(".select2-search__field");
      }, e.prototype.query = function (e, t, n) {
        var i = this;
        t.term = t.term || "";
        var o = this.tokenizer(t, this.options, function (e) {
          var t = i._normalizeItem(e);

          if (!i.$element.find("option").filter(function () {
            return d(this).val() === t.id;
          }).length) {
            var n = i.option(t);
            n.attr("data-select2-tag", !0), i._removeOldTags(), i.addOptions([n]);
          }

          !function (e) {
            i.trigger("select", {
              data: e
            });
          }(t);
        });
        o.term !== t.term && (this.$search.length && (this.$search.val(o.term), this.$search.trigger("focus")), t.term = o.term), e.call(this, t, n);
      }, e.prototype.tokenizer = function (e, t, n, i) {
        for (var o = n.get("tokenSeparators") || [], s = t.term, r = 0, a = this.createTag || function (e) {
          return {
            id: e.term,
            text: e.term
          };
        }; r < s.length;) {
          var l = s[r];

          if (-1 !== o.indexOf(l)) {
            var c = s.substr(0, r),
                u = a(d.extend({}, t, {
              term: c
            }));
            null != u ? (i(u), s = s.substr(r + 1) || "", r = 0) : r++;
          } else r++;
        }

        return {
          term: s
        };
      }, e;
    }), e.define("select2/data/minimumInputLength", [], function () {
      function e(e, t, n) {
        this.minimumInputLength = n.get("minimumInputLength"), e.call(this, t, n);
      }

      return e.prototype.query = function (e, t, n) {
        t.term = t.term || "", t.term.length < this.minimumInputLength ? this.trigger("results:message", {
          message: "inputTooShort",
          args: {
            minimum: this.minimumInputLength,
            input: t.term,
            params: t
          }
        }) : e.call(this, t, n);
      }, e;
    }), e.define("select2/data/maximumInputLength", [], function () {
      function e(e, t, n) {
        this.maximumInputLength = n.get("maximumInputLength"), e.call(this, t, n);
      }

      return e.prototype.query = function (e, t, n) {
        t.term = t.term || "", 0 < this.maximumInputLength && t.term.length > this.maximumInputLength ? this.trigger("results:message", {
          message: "inputTooLong",
          args: {
            maximum: this.maximumInputLength,
            input: t.term,
            params: t
          }
        }) : e.call(this, t, n);
      }, e;
    }), e.define("select2/data/maximumSelectionLength", [], function () {
      function e(e, t, n) {
        this.maximumSelectionLength = n.get("maximumSelectionLength"), e.call(this, t, n);
      }

      return e.prototype.bind = function (e, t, n) {
        var i = this;
        e.call(this, t, n), t.on("select", function () {
          i._checkIfMaximumSelected();
        });
      }, e.prototype.query = function (e, t, n) {
        var i = this;

        this._checkIfMaximumSelected(function () {
          e.call(i, t, n);
        });
      }, e.prototype._checkIfMaximumSelected = function (e, n) {
        var i = this;
        this.current(function (e) {
          var t = null != e ? e.length : 0;
          0 < i.maximumSelectionLength && t >= i.maximumSelectionLength ? i.trigger("results:message", {
            message: "maximumSelected",
            args: {
              maximum: i.maximumSelectionLength
            }
          }) : n && n();
        });
      }, e;
    }), e.define("select2/dropdown", ["jquery", "./utils"], function (t, e) {
      function n(e, t) {
        this.$element = e, this.options = t, n.__super__.constructor.call(this);
      }

      return e.Extend(n, e.Observable), n.prototype.render = function () {
        var e = t('<span class="select2-dropdown"><span class="select2-results"></span></span>');
        return e.attr("dir", this.options.get("dir")), this.$dropdown = e;
      }, n.prototype.bind = function () {}, n.prototype.position = function (e, t) {}, n.prototype.destroy = function () {
        this.$dropdown.remove();
      }, n;
    }), e.define("select2/dropdown/search", ["jquery"], function (s) {
      function e() {}

      return e.prototype.render = function (e) {
        var t = e.call(this),
            n = s('<span class="select2-search select2-search--dropdown"><input class="select2-search__field" type="search" tabindex="-1" autocorrect="off" autocapitalize="none" spellcheck="false" role="searchbox" aria-autocomplete="list" /></span>');
        return this.$searchContainer = n, this.$search = n.find("input"), this.$search.prop("autocomplete", this.options.get("autocomplete")), t.prepend(n), t;
      }, e.prototype.bind = function (e, t, n) {
        var i = this,
            o = t.id + "-results";
        e.call(this, t, n), this.$search.on("keydown", function (e) {
          i.trigger("keypress", e), i._keyUpPrevented = e.isDefaultPrevented();
        }), this.$search.on("input", function (e) {
          s(this).off("keyup");
        }), this.$search.on("keyup input", function (e) {
          i.handleSearch(e);
        }), t.on("open", function () {
          i.$search.attr("tabindex", 0), i.$search.attr("aria-controls", o), i.$search.trigger("focus"), window.setTimeout(function () {
            i.$search.trigger("focus");
          }, 0);
        }), t.on("close", function () {
          i.$search.attr("tabindex", -1), i.$search.removeAttr("aria-controls"), i.$search.removeAttr("aria-activedescendant"), i.$search.val(""), i.$search.trigger("blur");
        }), t.on("focus", function () {
          t.isOpen() || i.$search.trigger("focus");
        }), t.on("results:all", function (e) {
          null != e.query.term && "" !== e.query.term || (i.showSearch(e) ? i.$searchContainer[0].classList.remove("select2-search--hide") : i.$searchContainer[0].classList.add("select2-search--hide"));
        }), t.on("results:focus", function (e) {
          e.data._resultId ? i.$search.attr("aria-activedescendant", e.data._resultId) : i.$search.removeAttr("aria-activedescendant");
        });
      }, e.prototype.handleSearch = function (e) {
        if (!this._keyUpPrevented) {
          var t = this.$search.val();
          this.trigger("query", {
            term: t
          });
        }

        this._keyUpPrevented = !1;
      }, e.prototype.showSearch = function (e, t) {
        return !0;
      }, e;
    }), e.define("select2/dropdown/hidePlaceholder", [], function () {
      function e(e, t, n, i) {
        this.placeholder = this.normalizePlaceholder(n.get("placeholder")), e.call(this, t, n, i);
      }

      return e.prototype.append = function (e, t) {
        t.results = this.removePlaceholder(t.results), e.call(this, t);
      }, e.prototype.normalizePlaceholder = function (e, t) {
        return "string" == typeof t && (t = {
          id: "",
          text: t
        }), t;
      }, e.prototype.removePlaceholder = function (e, t) {
        for (var n = t.slice(0), i = t.length - 1; 0 <= i; i--) {
          var o = t[i];
          this.placeholder.id === o.id && n.splice(i, 1);
        }

        return n;
      }, e;
    }), e.define("select2/dropdown/infiniteScroll", ["jquery"], function (n) {
      function e(e, t, n, i) {
        this.lastParams = {}, e.call(this, t, n, i), this.$loadingMore = this.createLoadingMore(), this.loading = !1;
      }

      return e.prototype.append = function (e, t) {
        this.$loadingMore.remove(), this.loading = !1, e.call(this, t), this.showLoadingMore(t) && (this.$results.append(this.$loadingMore), this.loadMoreIfNeeded());
      }, e.prototype.bind = function (e, t, n) {
        var i = this;
        e.call(this, t, n), t.on("query", function (e) {
          i.lastParams = e, i.loading = !0;
        }), t.on("query:append", function (e) {
          i.lastParams = e, i.loading = !0;
        }), this.$results.on("scroll", this.loadMoreIfNeeded.bind(this));
      }, e.prototype.loadMoreIfNeeded = function () {
        var e = n.contains(document.documentElement, this.$loadingMore[0]);

        if (!this.loading && e) {
          var t = this.$results.offset().top + this.$results.outerHeight(!1);
          this.$loadingMore.offset().top + this.$loadingMore.outerHeight(!1) <= t + 50 && this.loadMore();
        }
      }, e.prototype.loadMore = function () {
        this.loading = !0;
        var e = n.extend({}, {
          page: 1
        }, this.lastParams);
        e.page++, this.trigger("query:append", e);
      }, e.prototype.showLoadingMore = function (e, t) {
        return t.pagination && t.pagination.more;
      }, e.prototype.createLoadingMore = function () {
        var e = n('<li class="select2-results__option select2-results__option--load-more"role="option" aria-disabled="true"></li>'),
            t = this.options.get("translations").get("loadingMore");
        return e.html(t(this.lastParams)), e;
      }, e;
    }), e.define("select2/dropdown/attachBody", ["jquery", "../utils"], function (f, a) {
      function e(e, t, n) {
        this.$dropdownParent = f(n.get("dropdownParent") || document.body), e.call(this, t, n);
      }

      return e.prototype.bind = function (e, t, n) {
        var i = this;
        e.call(this, t, n), t.on("open", function () {
          i._showDropdown(), i._attachPositioningHandler(t), i._bindContainerResultHandlers(t);
        }), t.on("close", function () {
          i._hideDropdown(), i._detachPositioningHandler(t);
        }), this.$dropdownContainer.on("mousedown", function (e) {
          e.stopPropagation();
        });
      }, e.prototype.destroy = function (e) {
        e.call(this), this.$dropdownContainer.remove();
      }, e.prototype.position = function (e, t, n) {
        t.attr("class", n.attr("class")), t[0].classList.remove("select2"), t[0].classList.add("select2-container--open"), t.css({
          position: "absolute",
          top: -999999
        }), this.$container = n;
      }, e.prototype.render = function (e) {
        var t = f("<span></span>"),
            n = e.call(this);
        return t.append(n), this.$dropdownContainer = t;
      }, e.prototype._hideDropdown = function (e) {
        this.$dropdownContainer.detach();
      }, e.prototype._bindContainerResultHandlers = function (e, t) {
        if (!this._containerResultsHandlersBound) {
          var n = this;
          t.on("results:all", function () {
            n._positionDropdown(), n._resizeDropdown();
          }), t.on("results:append", function () {
            n._positionDropdown(), n._resizeDropdown();
          }), t.on("results:message", function () {
            n._positionDropdown(), n._resizeDropdown();
          }), t.on("select", function () {
            n._positionDropdown(), n._resizeDropdown();
          }), t.on("unselect", function () {
            n._positionDropdown(), n._resizeDropdown();
          }), this._containerResultsHandlersBound = !0;
        }
      }, e.prototype._attachPositioningHandler = function (e, t) {
        var n = this,
            i = "scroll.select2." + t.id,
            o = "resize.select2." + t.id,
            s = "orientationchange.select2." + t.id,
            r = this.$container.parents().filter(a.hasScroll);
        r.each(function () {
          a.StoreData(this, "select2-scroll-position", {
            x: f(this).scrollLeft(),
            y: f(this).scrollTop()
          });
        }), r.on(i, function (e) {
          var t = a.GetData(this, "select2-scroll-position");
          f(this).scrollTop(t.y);
        }), f(window).on(i + " " + o + " " + s, function (e) {
          n._positionDropdown(), n._resizeDropdown();
        });
      }, e.prototype._detachPositioningHandler = function (e, t) {
        var n = "scroll.select2." + t.id,
            i = "resize.select2." + t.id,
            o = "orientationchange.select2." + t.id;
        this.$container.parents().filter(a.hasScroll).off(n), f(window).off(n + " " + i + " " + o);
      }, e.prototype._positionDropdown = function () {
        var e = f(window),
            t = this.$dropdown[0].classList.contains("select2-dropdown--above"),
            n = this.$dropdown[0].classList.contains("select2-dropdown--below"),
            i = null,
            o = this.$container.offset();
        o.bottom = o.top + this.$container.outerHeight(!1);
        var s = {
          height: this.$container.outerHeight(!1)
        };
        s.top = o.top, s.bottom = o.top + s.height;
        var r = this.$dropdown.outerHeight(!1),
            a = e.scrollTop(),
            l = e.scrollTop() + e.height(),
            c = a < o.top - r,
            u = l > o.bottom + r,
            d = {
          left: o.left,
          top: s.bottom
        },
            p = this.$dropdownParent;
        "static" === p.css("position") && (p = p.offsetParent());
        var h = {
          top: 0,
          left: 0
        };
        (f.contains(document.body, p[0]) || p[0].isConnected) && (h = p.offset()), d.top -= h.top, d.left -= h.left, t || n || (i = "below"), u || !c || t ? !c && u && t && (i = "below") : i = "above", ("above" == i || t && "below" !== i) && (d.top = s.top - h.top - r), null != i && (this.$dropdown[0].classList.remove("select2-dropdown--below"), this.$dropdown[0].classList.remove("select2-dropdown--above"), this.$dropdown[0].classList.add("select2-dropdown--" + i), this.$container[0].classList.remove("select2-container--below"), this.$container[0].classList.remove("select2-container--above"), this.$container[0].classList.add("select2-container--" + i)), this.$dropdownContainer.css(d);
      }, e.prototype._resizeDropdown = function () {
        var e = {
          width: this.$container.outerWidth(!1) + "px"
        };
        this.options.get("dropdownAutoWidth") && (e.minWidth = e.width, e.position = "relative", e.width = "auto"), this.$dropdown.css(e);
      }, e.prototype._showDropdown = function (e) {
        this.$dropdownContainer.appendTo(this.$dropdownParent), this._positionDropdown(), this._resizeDropdown();
      }, e;
    }), e.define("select2/dropdown/minimumResultsForSearch", [], function () {
      function e(e, t, n, i) {
        this.minimumResultsForSearch = n.get("minimumResultsForSearch"), this.minimumResultsForSearch < 0 && (this.minimumResultsForSearch = 1 / 0), e.call(this, t, n, i);
      }

      return e.prototype.showSearch = function (e, t) {
        return !(function e(t) {
          for (var n = 0, i = 0; i < t.length; i++) {
            var o = t[i];
            o.children ? n += e(o.children) : n++;
          }

          return n;
        }(t.data.results) < this.minimumResultsForSearch) && e.call(this, t);
      }, e;
    }), e.define("select2/dropdown/selectOnClose", ["../utils"], function (s) {
      function e() {}

      return e.prototype.bind = function (e, t, n) {
        var i = this;
        e.call(this, t, n), t.on("close", function (e) {
          i._handleSelectOnClose(e);
        });
      }, e.prototype._handleSelectOnClose = function (e, t) {
        if (t && null != t.originalSelect2Event) {
          var n = t.originalSelect2Event;
          if ("select" === n._type || "unselect" === n._type) return;
        }

        var i = this.getHighlightedResults();

        if (!(i.length < 1)) {
          var o = s.GetData(i[0], "data");
          null != o.element && o.element.selected || null == o.element && o.selected || this.trigger("select", {
            data: o
          });
        }
      }, e;
    }), e.define("select2/dropdown/closeOnSelect", [], function () {
      function e() {}

      return e.prototype.bind = function (e, t, n) {
        var i = this;
        e.call(this, t, n), t.on("select", function (e) {
          i._selectTriggered(e);
        }), t.on("unselect", function (e) {
          i._selectTriggered(e);
        });
      }, e.prototype._selectTriggered = function (e, t) {
        var n = t.originalEvent;
        n && (n.ctrlKey || n.metaKey) || this.trigger("close", {
          originalEvent: n,
          originalSelect2Event: t
        });
      }, e;
    }), e.define("select2/dropdown/dropdownCss", ["../utils"], function (i) {
      function e() {}

      return e.prototype.render = function (e) {
        var t = e.call(this),
            n = this.options.get("dropdownCssClass") || "";
        return -1 !== n.indexOf(":all:") && (n = n.replace(":all:", ""), i.copyNonInternalCssClasses(t[0], this.$element[0])), t.addClass(n), t;
      }, e;
    }), e.define("select2/i18n/en", [], function () {
      return {
        errorLoading: function errorLoading() {
          return "The results could not be loaded.";
        },
        inputTooLong: function inputTooLong(e) {
          var t = e.input.length - e.maximum,
              n = "Please delete " + t + " character";
          return 1 != t && (n += "s"), n;
        },
        inputTooShort: function inputTooShort(e) {
          return "Please enter " + (e.minimum - e.input.length) + " or more characters";
        },
        loadingMore: function loadingMore() {
          return "Loading more results…";
        },
        maximumSelected: function maximumSelected(e) {
          var t = "You can only select " + e.maximum + " item";
          return 1 != e.maximum && (t += "s"), t;
        },
        noResults: function noResults() {
          return "No results found";
        },
        searching: function searching() {
          return "Searching…";
        },
        removeAllItems: function removeAllItems() {
          return "Remove all items";
        },
        removeItem: function removeItem() {
          return "Remove item";
        }
      };
    }), e.define("select2/defaults", ["jquery", "./results", "./selection/single", "./selection/multiple", "./selection/placeholder", "./selection/allowClear", "./selection/search", "./selection/selectionCss", "./selection/eventRelay", "./utils", "./translation", "./diacritics", "./data/select", "./data/array", "./data/ajax", "./data/tags", "./data/tokenizer", "./data/minimumInputLength", "./data/maximumInputLength", "./data/maximumSelectionLength", "./dropdown", "./dropdown/search", "./dropdown/hidePlaceholder", "./dropdown/infiniteScroll", "./dropdown/attachBody", "./dropdown/minimumResultsForSearch", "./dropdown/selectOnClose", "./dropdown/closeOnSelect", "./dropdown/dropdownCss", "./i18n/en"], function (l, s, r, a, c, u, d, p, h, f, g, t, m, v, y, _, w, b, $, x, A, D, S, O, E, L, C, T, q, e) {
      function n() {
        this.reset();
      }

      return n.prototype.apply = function (e) {
        if (null == (e = l.extend(!0, {}, this.defaults, e)).dataAdapter && (null != e.ajax ? e.dataAdapter = y : null != e.data ? e.dataAdapter = v : e.dataAdapter = m, 0 < e.minimumInputLength && (e.dataAdapter = f.Decorate(e.dataAdapter, b)), 0 < e.maximumInputLength && (e.dataAdapter = f.Decorate(e.dataAdapter, $)), 0 < e.maximumSelectionLength && (e.dataAdapter = f.Decorate(e.dataAdapter, x)), e.tags && (e.dataAdapter = f.Decorate(e.dataAdapter, _)), null == e.tokenSeparators && null == e.tokenizer || (e.dataAdapter = f.Decorate(e.dataAdapter, w))), null == e.resultsAdapter && (e.resultsAdapter = s, null != e.ajax && (e.resultsAdapter = f.Decorate(e.resultsAdapter, O)), null != e.placeholder && (e.resultsAdapter = f.Decorate(e.resultsAdapter, S)), e.selectOnClose && (e.resultsAdapter = f.Decorate(e.resultsAdapter, C))), null == e.dropdownAdapter) {
          if (e.multiple) e.dropdownAdapter = A;else {
            var t = f.Decorate(A, D);
            e.dropdownAdapter = t;
          }
          0 !== e.minimumResultsForSearch && (e.dropdownAdapter = f.Decorate(e.dropdownAdapter, L)), e.closeOnSelect && (e.dropdownAdapter = f.Decorate(e.dropdownAdapter, T)), null != e.dropdownCssClass && (e.dropdownAdapter = f.Decorate(e.dropdownAdapter, q)), e.dropdownAdapter = f.Decorate(e.dropdownAdapter, E);
        }

        null == e.selectionAdapter && (e.multiple ? e.selectionAdapter = a : e.selectionAdapter = r, null != e.placeholder && (e.selectionAdapter = f.Decorate(e.selectionAdapter, c)), e.allowClear && (e.selectionAdapter = f.Decorate(e.selectionAdapter, u)), e.multiple && (e.selectionAdapter = f.Decorate(e.selectionAdapter, d)), null != e.selectionCssClass && (e.selectionAdapter = f.Decorate(e.selectionAdapter, p)), e.selectionAdapter = f.Decorate(e.selectionAdapter, h)), e.language = this._resolveLanguage(e.language), e.language.push("en");

        for (var n = [], i = 0; i < e.language.length; i++) {
          var o = e.language[i];
          -1 === n.indexOf(o) && n.push(o);
        }

        return e.language = n, e.translations = this._processTranslations(e.language, e.debug), e;
      }, n.prototype.reset = function () {
        function a(e) {
          return e.replace(/[^\u0000-\u007E]/g, function (e) {
            return t[e] || e;
          });
        }

        this.defaults = {
          amdLanguageBase: "./i18n/",
          autocomplete: "off",
          closeOnSelect: !0,
          debug: !1,
          dropdownAutoWidth: !1,
          escapeMarkup: f.escapeMarkup,
          language: {},
          matcher: function e(t, n) {
            if (null == t.term || "" === t.term.trim()) return n;

            if (n.children && 0 < n.children.length) {
              for (var i = l.extend(!0, {}, n), o = n.children.length - 1; 0 <= o; o--) {
                null == e(t, n.children[o]) && i.children.splice(o, 1);
              }

              return 0 < i.children.length ? i : e(t, i);
            }

            var s = a(n.text).toUpperCase(),
                r = a(t.term).toUpperCase();
            return -1 < s.indexOf(r) ? n : null;
          },
          minimumInputLength: 0,
          maximumInputLength: 0,
          maximumSelectionLength: 0,
          minimumResultsForSearch: 0,
          selectOnClose: !1,
          scrollAfterSelect: !1,
          sorter: function sorter(e) {
            return e;
          },
          templateResult: function templateResult(e) {
            return e.text;
          },
          templateSelection: function templateSelection(e) {
            return e.text;
          },
          theme: "default",
          width: "resolve"
        };
      }, n.prototype.applyFromElement = function (e, t) {
        var n = e.language,
            i = this.defaults.language,
            o = t.prop("lang"),
            s = t.closest("[lang]").prop("lang"),
            r = Array.prototype.concat.call(this._resolveLanguage(o), this._resolveLanguage(n), this._resolveLanguage(i), this._resolveLanguage(s));
        return e.language = r, e;
      }, n.prototype._resolveLanguage = function (e) {
        if (!e) return [];
        if (l.isEmptyObject(e)) return [];
        if (l.isPlainObject(e)) return [e];
        var t;
        t = Array.isArray(e) ? e : [e];

        for (var n = [], i = 0; i < t.length; i++) {
          if (n.push(t[i]), "string" == typeof t[i] && 0 < t[i].indexOf("-")) {
            var o = t[i].split("-")[0];
            n.push(o);
          }
        }

        return n;
      }, n.prototype._processTranslations = function (e, t) {
        for (var n = new g(), i = 0; i < e.length; i++) {
          var o = new g(),
              s = e[i];
          if ("string" == typeof s) try {
            o = g.loadPath(s);
          } catch (e) {
            try {
              s = this.defaults.amdLanguageBase + s, o = g.loadPath(s);
            } catch (e) {
              t && window.console && console.warn && console.warn('Select2: The language file for "' + s + '" could not be automatically loaded. A fallback will be used instead.');
            }
          } else o = l.isPlainObject(s) ? new g(s) : s;
          n.extend(o);
        }

        return n;
      }, n.prototype.set = function (e, t) {
        var n = {};
        n[l.camelCase(e)] = t;

        var i = f._convertData(n);

        l.extend(!0, this.defaults, i);
      }, new n();
    }), e.define("select2/options", ["jquery", "./defaults", "./utils"], function (d, n, p) {
      function e(e, t) {
        this.options = e, null != t && this.fromElement(t), null != t && (this.options = n.applyFromElement(this.options, t)), this.options = n.apply(this.options);
      }

      return e.prototype.fromElement = function (e) {
        var t = ["select2"];
        null == this.options.multiple && (this.options.multiple = e.prop("multiple")), null == this.options.disabled && (this.options.disabled = e.prop("disabled")), null == this.options.autocomplete && e.prop("autocomplete") && (this.options.autocomplete = e.prop("autocomplete")), null == this.options.dir && (e.prop("dir") ? this.options.dir = e.prop("dir") : e.closest("[dir]").prop("dir") ? this.options.dir = e.closest("[dir]").prop("dir") : this.options.dir = "ltr"), e.prop("disabled", this.options.disabled), e.prop("multiple", this.options.multiple), p.GetData(e[0], "select2Tags") && (this.options.debug && window.console && console.warn && console.warn('Select2: The `data-select2-tags` attribute has been changed to use the `data-data` and `data-tags="true"` attributes and will be removed in future versions of Select2.'), p.StoreData(e[0], "data", p.GetData(e[0], "select2Tags")), p.StoreData(e[0], "tags", !0)), p.GetData(e[0], "ajaxUrl") && (this.options.debug && window.console && console.warn && console.warn("Select2: The `data-ajax-url` attribute has been changed to `data-ajax--url` and support for the old attribute will be removed in future versions of Select2."), e.attr("ajax--url", p.GetData(e[0], "ajaxUrl")), p.StoreData(e[0], "ajax-Url", p.GetData(e[0], "ajaxUrl")));
        var n = {};

        function i(e, t) {
          return t.toUpperCase();
        }

        for (var o = 0; o < e[0].attributes.length; o++) {
          var s = e[0].attributes[o].name,
              r = "data-";

          if (s.substr(0, r.length) == r) {
            var a = s.substring(r.length),
                l = p.GetData(e[0], a);
            n[a.replace(/-([a-z])/g, i)] = l;
          }
        }

        d.fn.jquery && "1." == d.fn.jquery.substr(0, 2) && e[0].dataset && (n = d.extend(!0, {}, e[0].dataset, n));
        var c = d.extend(!0, {}, p.GetData(e[0]), n);

        for (var u in c = p._convertData(c)) {
          -1 < t.indexOf(u) || (d.isPlainObject(this.options[u]) ? d.extend(this.options[u], c[u]) : this.options[u] = c[u]);
        }

        return this;
      }, e.prototype.get = function (e) {
        return this.options[e];
      }, e.prototype.set = function (e, t) {
        this.options[e] = t;
      }, e;
    }), e.define("select2/core", ["jquery", "./options", "./utils", "./keys"], function (t, c, u, i) {
      var d = function d(e, t) {
        null != u.GetData(e[0], "select2") && u.GetData(e[0], "select2").destroy(), this.$element = e, this.id = this._generateId(e), t = t || {}, this.options = new c(t, e), d.__super__.constructor.call(this);
        var n = e.attr("tabindex") || 0;
        u.StoreData(e[0], "old-tabindex", n), e.attr("tabindex", "-1");
        var i = this.options.get("dataAdapter");
        this.dataAdapter = new i(e, this.options);
        var o = this.render();

        this._placeContainer(o);

        var s = this.options.get("selectionAdapter");
        this.selection = new s(e, this.options), this.$selection = this.selection.render(), this.selection.position(this.$selection, o);
        var r = this.options.get("dropdownAdapter");
        this.dropdown = new r(e, this.options), this.$dropdown = this.dropdown.render(), this.dropdown.position(this.$dropdown, o);
        var a = this.options.get("resultsAdapter");
        this.results = new a(e, this.options, this.dataAdapter), this.$results = this.results.render(), this.results.position(this.$results, this.$dropdown);
        var l = this;
        this._bindAdapters(), this._registerDomEvents(), this._registerDataEvents(), this._registerSelectionEvents(), this._registerDropdownEvents(), this._registerResultsEvents(), this._registerEvents(), this.dataAdapter.current(function (e) {
          l.trigger("selection:update", {
            data: e
          });
        }), e[0].classList.add("select2-hidden-accessible"), e.attr("aria-hidden", "true"), this._syncAttributes(), u.StoreData(e[0], "select2", this), e.data("select2", this);
      };

      return u.Extend(d, u.Observable), d.prototype._generateId = function (e) {
        return "select2-" + (null != e.attr("id") ? e.attr("id") : null != e.attr("name") ? e.attr("name") + "-" + u.generateChars(2) : u.generateChars(4)).replace(/(:|\.|\[|\]|,)/g, "");
      }, d.prototype._placeContainer = function (e) {
        e.insertAfter(this.$element);

        var t = this._resolveWidth(this.$element, this.options.get("width"));

        null != t && e.css("width", t);
      }, d.prototype._resolveWidth = function (e, t) {
        var n = /^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i;

        if ("resolve" == t) {
          var i = this._resolveWidth(e, "style");

          return null != i ? i : this._resolveWidth(e, "element");
        }

        if ("element" == t) {
          var o = e.outerWidth(!1);
          return o <= 0 ? "auto" : o + "px";
        }

        if ("style" != t) return "computedstyle" != t ? t : window.getComputedStyle(e[0]).width;
        var s = e.attr("style");
        if ("string" != typeof s) return null;

        for (var r = s.split(";"), a = 0, l = r.length; a < l; a += 1) {
          var c = r[a].replace(/\s/g, "").match(n);
          if (null !== c && 1 <= c.length) return c[1];
        }

        return null;
      }, d.prototype._bindAdapters = function () {
        this.dataAdapter.bind(this, this.$container), this.selection.bind(this, this.$container), this.dropdown.bind(this, this.$container), this.results.bind(this, this.$container);
      }, d.prototype._registerDomEvents = function () {
        var t = this;
        this.$element.on("change.select2", function () {
          t.dataAdapter.current(function (e) {
            t.trigger("selection:update", {
              data: e
            });
          });
        }), this.$element.on("focus.select2", function (e) {
          t.trigger("focus", e);
        }), this._syncA = u.bind(this._syncAttributes, this), this._syncS = u.bind(this._syncSubtree, this), this._observer = new window.MutationObserver(function (e) {
          t._syncA(), t._syncS(e);
        }), this._observer.observe(this.$element[0], {
          attributes: !0,
          childList: !0,
          subtree: !1
        });
      }, d.prototype._registerDataEvents = function () {
        var n = this;
        this.dataAdapter.on("*", function (e, t) {
          n.trigger(e, t);
        });
      }, d.prototype._registerSelectionEvents = function () {
        var n = this,
            i = ["toggle", "focus"];
        this.selection.on("toggle", function () {
          n.toggleDropdown();
        }), this.selection.on("focus", function (e) {
          n.focus(e);
        }), this.selection.on("*", function (e, t) {
          -1 === i.indexOf(e) && n.trigger(e, t);
        });
      }, d.prototype._registerDropdownEvents = function () {
        var n = this;
        this.dropdown.on("*", function (e, t) {
          n.trigger(e, t);
        });
      }, d.prototype._registerResultsEvents = function () {
        var n = this;
        this.results.on("*", function (e, t) {
          n.trigger(e, t);
        });
      }, d.prototype._registerEvents = function () {
        var n = this;
        this.on("open", function () {
          n.$container[0].classList.add("select2-container--open");
        }), this.on("close", function () {
          n.$container[0].classList.remove("select2-container--open");
        }), this.on("enable", function () {
          n.$container[0].classList.remove("select2-container--disabled");
        }), this.on("disable", function () {
          n.$container[0].classList.add("select2-container--disabled");
        }), this.on("blur", function () {
          n.$container[0].classList.remove("select2-container--focus");
        }), this.on("query", function (t) {
          n.isOpen() || n.trigger("open", {}), this.dataAdapter.query(t, function (e) {
            n.trigger("results:all", {
              data: e,
              query: t
            });
          });
        }), this.on("query:append", function (t) {
          this.dataAdapter.query(t, function (e) {
            n.trigger("results:append", {
              data: e,
              query: t
            });
          });
        }), this.on("keypress", function (e) {
          var t = e.which;
          n.isOpen() ? t === i.ESC || t === i.TAB || t === i.UP && e.altKey ? (n.close(e), e.preventDefault()) : t === i.ENTER ? (n.trigger("results:select", {}), e.preventDefault()) : t === i.SPACE && e.ctrlKey ? (n.trigger("results:toggle", {}), e.preventDefault()) : t === i.UP ? (n.trigger("results:previous", {}), e.preventDefault()) : t === i.DOWN && (n.trigger("results:next", {}), e.preventDefault()) : (t === i.ENTER || t === i.SPACE || t === i.DOWN && e.altKey) && (n.open(), e.preventDefault());
        });
      }, d.prototype._syncAttributes = function () {
        this.options.set("disabled", this.$element.prop("disabled")), this.isDisabled() ? (this.isOpen() && this.close(), this.trigger("disable", {})) : this.trigger("enable", {});
      }, d.prototype._isChangeMutation = function (e) {
        var t = this;
        if (e.addedNodes && 0 < e.addedNodes.length) for (var n = 0; n < e.addedNodes.length; n++) {
          if (e.addedNodes[n].selected) return !0;
        } else {
          if (e.removedNodes && 0 < e.removedNodes.length) return !0;
          if (Array.isArray(e)) return e.some(function (e) {
            return t._isChangeMutation(e);
          });
        }
        return !1;
      }, d.prototype._syncSubtree = function (e) {
        var t = this._isChangeMutation(e),
            n = this;

        t && this.dataAdapter.current(function (e) {
          n.trigger("selection:update", {
            data: e
          });
        });
      }, d.prototype.trigger = function (e, t) {
        var n = d.__super__.trigger,
            i = {
          open: "opening",
          close: "closing",
          select: "selecting",
          unselect: "unselecting",
          clear: "clearing"
        };

        if (void 0 === t && (t = {}), e in i) {
          var o = i[e],
              s = {
            prevented: !1,
            name: e,
            args: t
          };
          if (n.call(this, o, s), s.prevented) return void (t.prevented = !0);
        }

        n.call(this, e, t);
      }, d.prototype.toggleDropdown = function () {
        this.isDisabled() || (this.isOpen() ? this.close() : this.open());
      }, d.prototype.open = function () {
        this.isOpen() || this.isDisabled() || this.trigger("query", {});
      }, d.prototype.close = function (e) {
        this.isOpen() && this.trigger("close", {
          originalEvent: e
        });
      }, d.prototype.isEnabled = function () {
        return !this.isDisabled();
      }, d.prototype.isDisabled = function () {
        return this.options.get("disabled");
      }, d.prototype.isOpen = function () {
        return this.$container[0].classList.contains("select2-container--open");
      }, d.prototype.hasFocus = function () {
        return this.$container[0].classList.contains("select2-container--focus");
      }, d.prototype.focus = function (e) {
        this.hasFocus() || (this.$container[0].classList.add("select2-container--focus"), this.trigger("focus", {}));
      }, d.prototype.enable = function (e) {
        this.options.get("debug") && window.console && console.warn && console.warn('Select2: The `select2("enable")` method has been deprecated and will be removed in later Select2 versions. Use $element.prop("disabled") instead.'), null != e && 0 !== e.length || (e = [!0]);
        var t = !e[0];
        this.$element.prop("disabled", t);
      }, d.prototype.data = function () {
        this.options.get("debug") && 0 < arguments.length && window.console && console.warn && console.warn('Select2: Data can no longer be set using `select2("data")`. You should consider setting the value instead using `$element.val()`.');
        var t = [];
        return this.dataAdapter.current(function (e) {
          t = e;
        }), t;
      }, d.prototype.val = function (e) {
        if (this.options.get("debug") && window.console && console.warn && console.warn('Select2: The `select2("val")` method has been deprecated and will be removed in later Select2 versions. Use $element.val() instead.'), null == e || 0 === e.length) return this.$element.val();
        var t = e[0];
        Array.isArray(t) && (t = t.map(function (e) {
          return e.toString();
        })), this.$element.val(t).trigger("input").trigger("change");
      }, d.prototype.destroy = function () {
        this.$container.remove(), this._observer.disconnect(), this._observer = null, this._syncA = null, this._syncS = null, this.$element.off(".select2"), this.$element.attr("tabindex", u.GetData(this.$element[0], "old-tabindex")), this.$element[0].classList.remove("select2-hidden-accessible"), this.$element.attr("aria-hidden", "false"), u.RemoveData(this.$element[0]), this.$element.removeData("select2"), this.dataAdapter.destroy(), this.selection.destroy(), this.dropdown.destroy(), this.results.destroy(), this.dataAdapter = null, this.selection = null, this.dropdown = null, this.results = null;
      }, d.prototype.render = function () {
        var e = t('<span class="select2 select2-container"><span class="selection"></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>');
        return e.attr("dir", this.options.get("dir")), this.$container = e, this.$container[0].classList.add("select2-container--" + this.options.get("theme")), u.StoreData(e[0], "element", this.$element), e;
      }, d;
    }), e.define("select2/dropdown/attachContainer", [], function () {
      function e(e, t, n) {
        e.call(this, t, n);
      }

      return e.prototype.position = function (e, t, n) {
        n.find(".dropdown-wrapper").append(t), t[0].classList.add("select2-dropdown--below"), n[0].classList.add("select2-container--below");
      }, e;
    }), e.define("select2/dropdown/stopPropagation", [], function () {
      function e() {}

      return e.prototype.bind = function (e, t, n) {
        e.call(this, t, n);
        this.$dropdown.on(["blur", "change", "click", "dblclick", "focus", "focusin", "focusout", "input", "keydown", "keyup", "keypress", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseover", "mouseup", "search", "touchend", "touchstart"].join(" "), function (e) {
          e.stopPropagation();
        });
      }, e;
    }), e.define("select2/selection/stopPropagation", [], function () {
      function e() {}

      return e.prototype.bind = function (e, t, n) {
        e.call(this, t, n);
        this.$selection.on(["blur", "change", "click", "dblclick", "focus", "focusin", "focusout", "input", "keydown", "keyup", "keypress", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseover", "mouseup", "search", "touchend", "touchstart"].join(" "), function (e) {
          e.stopPropagation();
        });
      }, e;
    }), l = function l(p) {
      var h,
          f,
          e = ["wheel", "mousewheel", "DOMMouseScroll", "MozMousePixelScroll"],
          t = "onwheel" in document || 9 <= document.documentMode ? ["wheel"] : ["mousewheel", "DomMouseScroll", "MozMousePixelScroll"],
          g = Array.prototype.slice;
      if (p.event.fixHooks) for (var n = e.length; n;) {
        p.event.fixHooks[e[--n]] = p.event.mouseHooks;
      }
      var m = p.event.special.mousewheel = {
        version: "3.1.12",
        setup: function setup() {
          if (this.addEventListener) for (var e = t.length; e;) {
            this.addEventListener(t[--e], i, !1);
          } else this.onmousewheel = i;
          p.data(this, "mousewheel-line-height", m.getLineHeight(this)), p.data(this, "mousewheel-page-height", m.getPageHeight(this));
        },
        teardown: function teardown() {
          if (this.removeEventListener) for (var e = t.length; e;) {
            this.removeEventListener(t[--e], i, !1);
          } else this.onmousewheel = null;
          p.removeData(this, "mousewheel-line-height"), p.removeData(this, "mousewheel-page-height");
        },
        getLineHeight: function getLineHeight(e) {
          var t = p(e),
              n = t["offsetParent" in p.fn ? "offsetParent" : "parent"]();
          return n.length || (n = p("body")), parseInt(n.css("fontSize"), 10) || parseInt(t.css("fontSize"), 10) || 16;
        },
        getPageHeight: function getPageHeight(e) {
          return p(e).height();
        },
        settings: {
          adjustOldDeltas: !0,
          normalizeOffset: !0
        }
      };

      function i(e) {
        var t,
            n = e || window.event,
            i = g.call(arguments, 1),
            o = 0,
            s = 0,
            r = 0,
            a = 0,
            l = 0;

        if ((e = p.event.fix(n)).type = "mousewheel", "detail" in n && (r = -1 * n.detail), "wheelDelta" in n && (r = n.wheelDelta), "wheelDeltaY" in n && (r = n.wheelDeltaY), "wheelDeltaX" in n && (s = -1 * n.wheelDeltaX), "axis" in n && n.axis === n.HORIZONTAL_AXIS && (s = -1 * r, r = 0), o = 0 === r ? s : r, "deltaY" in n && (o = r = -1 * n.deltaY), "deltaX" in n && (s = n.deltaX, 0 === r && (o = -1 * s)), 0 !== r || 0 !== s) {
          if (1 === n.deltaMode) {
            var c = p.data(this, "mousewheel-line-height");
            o *= c, r *= c, s *= c;
          } else if (2 === n.deltaMode) {
            var u = p.data(this, "mousewheel-page-height");
            o *= u, r *= u, s *= u;
          }

          if (t = Math.max(Math.abs(r), Math.abs(s)), (!f || t < f) && y(n, f = t) && (f /= 40), y(n, t) && (o /= 40, s /= 40, r /= 40), o = Math[1 <= o ? "floor" : "ceil"](o / f), s = Math[1 <= s ? "floor" : "ceil"](s / f), r = Math[1 <= r ? "floor" : "ceil"](r / f), m.settings.normalizeOffset && this.getBoundingClientRect) {
            var d = this.getBoundingClientRect();
            a = e.clientX - d.left, l = e.clientY - d.top;
          }

          return e.deltaX = s, e.deltaY = r, e.deltaFactor = f, e.offsetX = a, e.offsetY = l, e.deltaMode = 0, i.unshift(e, o, s, r), h && clearTimeout(h), h = setTimeout(v, 200), (p.event.dispatch || p.event.handle).apply(this, i);
        }
      }

      function v() {
        f = null;
      }

      function y(e, t) {
        return m.settings.adjustOldDeltas && "mousewheel" === e.type && t % 120 == 0;
      }

      p.fn.extend({
        mousewheel: function mousewheel(e) {
          return e ? this.bind("mousewheel", e) : this.trigger("mousewheel");
        },
        unmousewheel: function unmousewheel(e) {
          return this.unbind("mousewheel", e);
        }
      });
    }, "function" == typeof e.define && e.define.amd ? e.define("jquery-mousewheel", ["jquery"], l) : "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) ? module.exports = l : l(d), e.define("jquery.select2", ["jquery", "jquery-mousewheel", "./select2/core", "./select2/defaults", "./select2/utils"], function (o, e, s, t, r) {
      if (null == o.fn.select2) {
        var a = ["open", "close", "destroy"];

        o.fn.select2 = function (t) {
          if ("object" == _typeof(t = t || {})) return this.each(function () {
            var e = o.extend(!0, {}, t);
            new s(o(this), e);
          }), this;
          if ("string" != typeof t) throw new Error("Invalid arguments for Select2: " + t);
          var n,
              i = Array.prototype.slice.call(arguments, 1);
          return this.each(function () {
            var e = r.GetData(this, "select2");
            null == e && window.console && console.error && console.error("The select2('" + t + "') method was called on an element that is not using Select2."), n = e[t].apply(e, i);
          }), -1 < a.indexOf(t) ? this : n;
        };
      }

      return null == o.fn.select2.defaults && (o.fn.select2.defaults = t), s;
    }), {
      define: e.define,
      require: e.require
    };
  }(),
      t = e.require("jquery.select2");

  return d.fn.select2.amd = e, t;
});
"use strict";

/**
 * skip-link-focus-fix.js
 *
 * Helps with accessibility for keyboard only users.
 *
 * Learn more: https://git.io/vWdr2
 */
(function () {
  var is_webkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1,
      is_opera = navigator.userAgent.toLowerCase().indexOf('opera') > -1,
      is_ie = navigator.userAgent.toLowerCase().indexOf('msie') > -1;

  if ((is_webkit || is_opera || is_ie) && document.getElementById && window.addEventListener) {
    window.addEventListener('hashchange', function () {
      var id = location.hash.substring(1),
          element;

      if (!/^[A-z0-9_-]+$/.test(id)) {
        return;
      }

      element = document.getElementById(id);

      if (element) {
        if (!/^(?:a|select|input|button|textarea)$/i.test(element.tagName)) {
          element.tabIndex = -1;
        }

        element.focus();
      }
    }, false);
  }
})();
"use strict";

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Swiper 7.0.5
 * Most modern mobile touch slider and framework with hardware accelerated transitions
 * https://swiperjs.com
 *
 * Copyright 2014-2021 Vladimir Kharlampidi
 *
 * Released under the MIT License
 *
 * Released on: September 9, 2021
 */
!function (e, t) {
  "object" == (typeof exports === "undefined" ? "undefined" : _typeof(exports)) && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).Swiper = t();
}(void 0, function () {
  "use strict";

  function e(e) {
    return null !== e && "object" == _typeof(e) && "constructor" in e && e.constructor === Object;
  }

  function t() {
    var s = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var a = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    Object.keys(a).forEach(function (i) {
      void 0 === s[i] ? s[i] = a[i] : e(a[i]) && e(s[i]) && Object.keys(a[i]).length > 0 && t(s[i], a[i]);
    });
  }

  var s = {
    body: {},
    addEventListener: function addEventListener() {},
    removeEventListener: function removeEventListener() {},
    activeElement: {
      blur: function blur() {},
      nodeName: ""
    },
    querySelector: function querySelector() {
      return null;
    },
    querySelectorAll: function querySelectorAll() {
      return [];
    },
    getElementById: function getElementById() {
      return null;
    },
    createEvent: function createEvent() {
      return {
        initEvent: function initEvent() {}
      };
    },
    createElement: function createElement() {
      return {
        children: [],
        childNodes: [],
        style: {},
        setAttribute: function setAttribute() {},
        getElementsByTagName: function getElementsByTagName() {
          return [];
        }
      };
    },
    createElementNS: function createElementNS() {
      return {};
    },
    importNode: function importNode() {
      return null;
    },
    location: {
      hash: "",
      host: "",
      hostname: "",
      href: "",
      origin: "",
      pathname: "",
      protocol: "",
      search: ""
    }
  };

  function a() {
    var e = "undefined" != typeof document ? document : {};
    return t(e, s), e;
  }

  var i = {
    document: s,
    navigator: {
      userAgent: ""
    },
    location: {
      hash: "",
      host: "",
      hostname: "",
      href: "",
      origin: "",
      pathname: "",
      protocol: "",
      search: ""
    },
    history: {
      replaceState: function replaceState() {},
      pushState: function pushState() {},
      go: function go() {},
      back: function back() {}
    },
    CustomEvent: function CustomEvent() {
      return this;
    },
    addEventListener: function addEventListener() {},
    removeEventListener: function removeEventListener() {},
    getComputedStyle: function getComputedStyle() {
      return {
        getPropertyValue: function getPropertyValue() {
          return "";
        }
      };
    },
    Image: function Image() {},
    Date: function Date() {},
    screen: {},
    setTimeout: function setTimeout() {},
    clearTimeout: function clearTimeout() {},
    matchMedia: function matchMedia() {
      return {};
    },
    requestAnimationFrame: function requestAnimationFrame(e) {
      return "undefined" == typeof setTimeout ? (e(), null) : setTimeout(e, 0);
    },
    cancelAnimationFrame: function cancelAnimationFrame(e) {
      "undefined" != typeof setTimeout && clearTimeout(e);
    }
  };

  function r() {
    var e = "undefined" != typeof window ? window : {};
    return t(e, i), e;
  }

  var n = /*#__PURE__*/function (_Array) {
    _inherits(n, _Array);

    var _super = _createSuper(n);

    function n(e) {
      var _this;

      _classCallCheck(this, n);

      _this = _super.call.apply(_super, [this].concat(_toConsumableArray(e || []))), function (e) {
        var t = e.__proto__;
        Object.defineProperty(e, "__proto__", {
          get: function get() {
            return t;
          },
          set: function set(e) {
            t.__proto__ = e;
          }
        });
      }(_assertThisInitialized(_this));
      return _this;
    }

    return n;
  }( /*#__PURE__*/_wrapNativeSuper(Array));

  function l() {
    var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var t = [];
    return e.forEach(function (e) {
      Array.isArray(e) ? t.push.apply(t, _toConsumableArray(l(e))) : t.push(e);
    }), t;
  }

  function o(e, t) {
    return Array.prototype.filter.call(e, t);
  }

  function d(e, t) {
    var s = r(),
        i = a();
    var l = [];
    if (!t && e instanceof n) return e;
    if (!e) return new n(l);

    if ("string" == typeof e) {
      var _s = e.trim();

      if (_s.indexOf("<") >= 0 && _s.indexOf(">") >= 0) {
        var _e = "div";
        0 === _s.indexOf("<li") && (_e = "ul"), 0 === _s.indexOf("<tr") && (_e = "tbody"), 0 !== _s.indexOf("<td") && 0 !== _s.indexOf("<th") || (_e = "tr"), 0 === _s.indexOf("<tbody") && (_e = "table"), 0 === _s.indexOf("<option") && (_e = "select");

        var _t = i.createElement(_e);

        _t.innerHTML = _s;

        for (var _e2 = 0; _e2 < _t.childNodes.length; _e2 += 1) {
          l.push(_t.childNodes[_e2]);
        }
      } else l = function (e, t) {
        if ("string" != typeof e) return [e];
        var s = [],
            a = t.querySelectorAll(e);

        for (var _e3 = 0; _e3 < a.length; _e3 += 1) {
          s.push(a[_e3]);
        }

        return s;
      }(e.trim(), t || i);
    } else if (e.nodeType || e === s || e === i) l.push(e);else if (Array.isArray(e)) {
      if (e instanceof n) return e;
      l = e;
    }

    return new n(function (e) {
      var t = [];

      for (var _s2 = 0; _s2 < e.length; _s2 += 1) {
        -1 === t.indexOf(e[_s2]) && t.push(e[_s2]);
      }

      return t;
    }(l));
  }

  d.fn = n.prototype;
  var c = {
    addClass: function addClass() {
      for (var _len = arguments.length, e = new Array(_len), _key = 0; _key < _len; _key++) {
        e[_key] = arguments[_key];
      }

      var t = l(e.map(function (e) {
        return e.split(" ");
      }));
      return this.forEach(function (e) {
        var _e$classList;

        (_e$classList = e.classList).add.apply(_e$classList, _toConsumableArray(t));
      }), this;
    },
    removeClass: function removeClass() {
      for (var _len2 = arguments.length, e = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        e[_key2] = arguments[_key2];
      }

      var t = l(e.map(function (e) {
        return e.split(" ");
      }));
      return this.forEach(function (e) {
        var _e$classList2;

        (_e$classList2 = e.classList).remove.apply(_e$classList2, _toConsumableArray(t));
      }), this;
    },
    hasClass: function hasClass() {
      for (var _len3 = arguments.length, e = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        e[_key3] = arguments[_key3];
      }

      var t = l(e.map(function (e) {
        return e.split(" ");
      }));
      return o(this, function (e) {
        return t.filter(function (t) {
          return e.classList.contains(t);
        }).length > 0;
      }).length > 0;
    },
    toggleClass: function toggleClass() {
      for (var _len4 = arguments.length, e = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        e[_key4] = arguments[_key4];
      }

      var t = l(e.map(function (e) {
        return e.split(" ");
      }));
      this.forEach(function (e) {
        t.forEach(function (t) {
          e.classList.toggle(t);
        });
      });
    },
    attr: function attr(e, t) {
      if (1 === arguments.length && "string" == typeof e) return this[0] ? this[0].getAttribute(e) : void 0;

      for (var _s3 = 0; _s3 < this.length; _s3 += 1) {
        if (2 === arguments.length) this[_s3].setAttribute(e, t);else for (var _t2 in e) {
          this[_s3][_t2] = e[_t2], this[_s3].setAttribute(_t2, e[_t2]);
        }
      }

      return this;
    },
    removeAttr: function removeAttr(e) {
      for (var _t3 = 0; _t3 < this.length; _t3 += 1) {
        this[_t3].removeAttribute(e);
      }

      return this;
    },
    transform: function transform(e) {
      for (var _t4 = 0; _t4 < this.length; _t4 += 1) {
        this[_t4].style.transform = e;
      }

      return this;
    },
    transition: function transition(e) {
      for (var _t5 = 0; _t5 < this.length; _t5 += 1) {
        this[_t5].style.transitionDuration = "string" != typeof e ? "".concat(e, "ms") : e;
      }

      return this;
    },
    on: function on() {
      var _e5, _e6;

      for (var _len5 = arguments.length, e = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        e[_key5] = arguments[_key5];
      }

      var t = e[0],
          s = e[1],
          a = e[2],
          i = e[3];

      function r(e) {
        var t = e.target;
        if (!t) return;
        var i = e.target.dom7EventData || [];
        if (i.indexOf(e) < 0 && i.unshift(e), d(t).is(s)) a.apply(t, i);else {
          var _e4 = d(t).parents();

          for (var _t6 = 0; _t6 < _e4.length; _t6 += 1) {
            d(_e4[_t6]).is(s) && a.apply(_e4[_t6], i);
          }
        }
      }

      function n(e) {
        var t = e && e.target && e.target.dom7EventData || [];
        t.indexOf(e) < 0 && t.unshift(e), a.apply(this, t);
      }

      "function" == typeof e[1] && ((_e5 = e, _e6 = _slicedToArray(_e5, 3), t = _e6[0], a = _e6[1], i = _e6[2], _e5), s = void 0), i || (i = !1);
      var l = t.split(" ");
      var o;

      for (var _e7 = 0; _e7 < this.length; _e7 += 1) {
        var _t7 = this[_e7];
        if (s) for (o = 0; o < l.length; o += 1) {
          var _e8 = l[o];
          _t7.dom7LiveListeners || (_t7.dom7LiveListeners = {}), _t7.dom7LiveListeners[_e8] || (_t7.dom7LiveListeners[_e8] = []), _t7.dom7LiveListeners[_e8].push({
            listener: a,
            proxyListener: r
          }), _t7.addEventListener(_e8, r, i);
        } else for (o = 0; o < l.length; o += 1) {
          var _e9 = l[o];
          _t7.dom7Listeners || (_t7.dom7Listeners = {}), _t7.dom7Listeners[_e9] || (_t7.dom7Listeners[_e9] = []), _t7.dom7Listeners[_e9].push({
            listener: a,
            proxyListener: n
          }), _t7.addEventListener(_e9, n, i);
        }
      }

      return this;
    },
    off: function off() {
      var _e10, _e11;

      for (var _len6 = arguments.length, e = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        e[_key6] = arguments[_key6];
      }

      var t = e[0],
          s = e[1],
          a = e[2],
          i = e[3];
      "function" == typeof e[1] && ((_e10 = e, _e11 = _slicedToArray(_e10, 3), t = _e11[0], a = _e11[1], i = _e11[2], _e10), s = void 0), i || (i = !1);
      var r = t.split(" ");

      for (var _e12 = 0; _e12 < r.length; _e12 += 1) {
        var _t8 = r[_e12];

        for (var _e13 = 0; _e13 < this.length; _e13 += 1) {
          var _r = this[_e13];

          var _n2 = void 0;

          if (!s && _r.dom7Listeners ? _n2 = _r.dom7Listeners[_t8] : s && _r.dom7LiveListeners && (_n2 = _r.dom7LiveListeners[_t8]), _n2 && _n2.length) for (var _e14 = _n2.length - 1; _e14 >= 0; _e14 -= 1) {
            var _s4 = _n2[_e14];
            a && _s4.listener === a || a && _s4.listener && _s4.listener.dom7proxy && _s4.listener.dom7proxy === a ? (_r.removeEventListener(_t8, _s4.proxyListener, i), _n2.splice(_e14, 1)) : a || (_r.removeEventListener(_t8, _s4.proxyListener, i), _n2.splice(_e14, 1));
          }
        }
      }

      return this;
    },
    trigger: function trigger() {
      for (var _len7 = arguments.length, e = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        e[_key7] = arguments[_key7];
      }

      var t = r(),
          s = e[0].split(" "),
          a = e[1];

      for (var _i2 = 0; _i2 < s.length; _i2 += 1) {
        var _r2 = s[_i2];

        for (var _s5 = 0; _s5 < this.length; _s5 += 1) {
          var _i3 = this[_s5];

          if (t.CustomEvent) {
            var _s6 = new t.CustomEvent(_r2, {
              detail: a,
              bubbles: !0,
              cancelable: !0
            });

            _i3.dom7EventData = e.filter(function (e, t) {
              return t > 0;
            }), _i3.dispatchEvent(_s6), _i3.dom7EventData = [], delete _i3.dom7EventData;
          }
        }
      }

      return this;
    },
    transitionEnd: function transitionEnd(e) {
      var t = this;
      return e && t.on("transitionend", function s(a) {
        a.target === this && (e.call(this, a), t.off("transitionend", s));
      }), this;
    },
    outerWidth: function outerWidth(e) {
      if (this.length > 0) {
        if (e) {
          var _e15 = this.styles();

          return this[0].offsetWidth + parseFloat(_e15.getPropertyValue("margin-right")) + parseFloat(_e15.getPropertyValue("margin-left"));
        }

        return this[0].offsetWidth;
      }

      return null;
    },
    outerHeight: function outerHeight(e) {
      if (this.length > 0) {
        if (e) {
          var _e16 = this.styles();

          return this[0].offsetHeight + parseFloat(_e16.getPropertyValue("margin-top")) + parseFloat(_e16.getPropertyValue("margin-bottom"));
        }

        return this[0].offsetHeight;
      }

      return null;
    },
    styles: function styles() {
      var e = r();
      return this[0] ? e.getComputedStyle(this[0], null) : {};
    },
    offset: function offset() {
      if (this.length > 0) {
        var _e17 = r(),
            _t9 = a(),
            _s7 = this[0],
            _i4 = _s7.getBoundingClientRect(),
            _n3 = _t9.body,
            _l = _s7.clientTop || _n3.clientTop || 0,
            _o = _s7.clientLeft || _n3.clientLeft || 0,
            _d2 = _s7 === _e17 ? _e17.scrollY : _s7.scrollTop,
            _c = _s7 === _e17 ? _e17.scrollX : _s7.scrollLeft;

        return {
          top: _i4.top + _d2 - _l,
          left: _i4.left + _c - _o
        };
      }

      return null;
    },
    css: function css(e, t) {
      var s = r();
      var a;

      if (1 === arguments.length) {
        if ("string" != typeof e) {
          for (a = 0; a < this.length; a += 1) {
            for (var _t10 in e) {
              this[a].style[_t10] = e[_t10];
            }
          }

          return this;
        }

        if (this[0]) return s.getComputedStyle(this[0], null).getPropertyValue(e);
      }

      if (2 === arguments.length && "string" == typeof e) {
        for (a = 0; a < this.length; a += 1) {
          this[a].style[e] = t;
        }

        return this;
      }

      return this;
    },
    each: function each(e) {
      return e ? (this.forEach(function (t, s) {
        e.apply(t, [t, s]);
      }), this) : this;
    },
    html: function html(e) {
      if (void 0 === e) return this[0] ? this[0].innerHTML : null;

      for (var _t11 = 0; _t11 < this.length; _t11 += 1) {
        this[_t11].innerHTML = e;
      }

      return this;
    },
    text: function text(e) {
      if (void 0 === e) return this[0] ? this[0].textContent.trim() : null;

      for (var _t12 = 0; _t12 < this.length; _t12 += 1) {
        this[_t12].textContent = e;
      }

      return this;
    },
    is: function is(e) {
      var t = r(),
          s = a(),
          i = this[0];
      var l, o;
      if (!i || void 0 === e) return !1;

      if ("string" == typeof e) {
        if (i.matches) return i.matches(e);
        if (i.webkitMatchesSelector) return i.webkitMatchesSelector(e);
        if (i.msMatchesSelector) return i.msMatchesSelector(e);

        for (l = d(e), o = 0; o < l.length; o += 1) {
          if (l[o] === i) return !0;
        }

        return !1;
      }

      if (e === s) return i === s;
      if (e === t) return i === t;

      if (e.nodeType || e instanceof n) {
        for (l = e.nodeType ? [e] : e, o = 0; o < l.length; o += 1) {
          if (l[o] === i) return !0;
        }

        return !1;
      }

      return !1;
    },
    index: function index() {
      var e,
          t = this[0];

      if (t) {
        for (e = 0; null !== (t = t.previousSibling);) {
          1 === t.nodeType && (e += 1);
        }

        return e;
      }
    },
    eq: function eq(e) {
      if (void 0 === e) return this;
      var t = this.length;
      if (e > t - 1) return d([]);

      if (e < 0) {
        var _s8 = t + e;

        return d(_s8 < 0 ? [] : [this[_s8]]);
      }

      return d([this[e]]);
    },
    append: function append() {
      var t;
      var s = a();

      for (var _a = 0; _a < arguments.length; _a += 1) {
        t = _a < 0 || arguments.length <= _a ? undefined : arguments[_a];

        for (var _e18 = 0; _e18 < this.length; _e18 += 1) {
          if ("string" == typeof t) {
            var _a2 = s.createElement("div");

            for (_a2.innerHTML = t; _a2.firstChild;) {
              this[_e18].appendChild(_a2.firstChild);
            }
          } else if (t instanceof n) for (var _s9 = 0; _s9 < t.length; _s9 += 1) {
            this[_e18].appendChild(t[_s9]);
          } else this[_e18].appendChild(t);
        }
      }

      return this;
    },
    prepend: function prepend(e) {
      var t = a();
      var s, i;

      for (s = 0; s < this.length; s += 1) {
        if ("string" == typeof e) {
          var _a3 = t.createElement("div");

          for (_a3.innerHTML = e, i = _a3.childNodes.length - 1; i >= 0; i -= 1) {
            this[s].insertBefore(_a3.childNodes[i], this[s].childNodes[0]);
          }
        } else if (e instanceof n) for (i = 0; i < e.length; i += 1) {
          this[s].insertBefore(e[i], this[s].childNodes[0]);
        } else this[s].insertBefore(e, this[s].childNodes[0]);
      }

      return this;
    },
    next: function next(e) {
      return this.length > 0 ? e ? this[0].nextElementSibling && d(this[0].nextElementSibling).is(e) ? d([this[0].nextElementSibling]) : d([]) : this[0].nextElementSibling ? d([this[0].nextElementSibling]) : d([]) : d([]);
    },
    nextAll: function nextAll(e) {
      var t = [];
      var s = this[0];
      if (!s) return d([]);

      for (; s.nextElementSibling;) {
        var _a4 = s.nextElementSibling;
        e ? d(_a4).is(e) && t.push(_a4) : t.push(_a4), s = _a4;
      }

      return d(t);
    },
    prev: function prev(e) {
      if (this.length > 0) {
        var _t13 = this[0];
        return e ? _t13.previousElementSibling && d(_t13.previousElementSibling).is(e) ? d([_t13.previousElementSibling]) : d([]) : _t13.previousElementSibling ? d([_t13.previousElementSibling]) : d([]);
      }

      return d([]);
    },
    prevAll: function prevAll(e) {
      var t = [];
      var s = this[0];
      if (!s) return d([]);

      for (; s.previousElementSibling;) {
        var _a5 = s.previousElementSibling;
        e ? d(_a5).is(e) && t.push(_a5) : t.push(_a5), s = _a5;
      }

      return d(t);
    },
    parent: function parent(e) {
      var t = [];

      for (var _s10 = 0; _s10 < this.length; _s10 += 1) {
        null !== this[_s10].parentNode && (e ? d(this[_s10].parentNode).is(e) && t.push(this[_s10].parentNode) : t.push(this[_s10].parentNode));
      }

      return d(t);
    },
    parents: function parents(e) {
      var t = [];

      for (var _s11 = 0; _s11 < this.length; _s11 += 1) {
        var _a6 = this[_s11].parentNode;

        for (; _a6;) {
          e ? d(_a6).is(e) && t.push(_a6) : t.push(_a6), _a6 = _a6.parentNode;
        }
      }

      return d(t);
    },
    closest: function closest(e) {
      var t = this;
      return void 0 === e ? d([]) : (t.is(e) || (t = t.parents(e).eq(0)), t);
    },
    find: function find(e) {
      var t = [];

      for (var _s12 = 0; _s12 < this.length; _s12 += 1) {
        var _a7 = this[_s12].querySelectorAll(e);

        for (var _e19 = 0; _e19 < _a7.length; _e19 += 1) {
          t.push(_a7[_e19]);
        }
      }

      return d(t);
    },
    children: function children(e) {
      var t = [];

      for (var _s13 = 0; _s13 < this.length; _s13 += 1) {
        var _a8 = this[_s13].children;

        for (var _s14 = 0; _s14 < _a8.length; _s14 += 1) {
          e && !d(_a8[_s14]).is(e) || t.push(_a8[_s14]);
        }
      }

      return d(t);
    },
    filter: function filter(e) {
      return d(o(this, e));
    },
    remove: function remove() {
      for (var _e20 = 0; _e20 < this.length; _e20 += 1) {
        this[_e20].parentNode && this[_e20].parentNode.removeChild(this[_e20]);
      }

      return this;
    }
  };

  function p(e) {
    var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    return setTimeout(e, t);
  }

  function u() {
    return Date.now();
  }

  function h(e) {
    var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "x";
    var s = r();
    var a, i, n;

    var l = function (e) {
      var t = r();
      var s;
      return t.getComputedStyle && (s = t.getComputedStyle(e, null)), !s && e.currentStyle && (s = e.currentStyle), s || (s = e.style), s;
    }(e);

    return s.WebKitCSSMatrix ? (i = l.transform || l.webkitTransform, i.split(",").length > 6 && (i = i.split(", ").map(function (e) {
      return e.replace(",", ".");
    }).join(", ")), n = new s.WebKitCSSMatrix("none" === i ? "" : i)) : (n = l.MozTransform || l.OTransform || l.MsTransform || l.msTransform || l.transform || l.getPropertyValue("transform").replace("translate(", "matrix(1, 0, 0, 1,"), a = n.toString().split(",")), "x" === t && (i = s.WebKitCSSMatrix ? n.m41 : 16 === a.length ? parseFloat(a[12]) : parseFloat(a[4])), "y" === t && (i = s.WebKitCSSMatrix ? n.m42 : 16 === a.length ? parseFloat(a[13]) : parseFloat(a[5])), i || 0;
  }

  function m(e) {
    return "object" == _typeof(e) && null !== e && e.constructor && "Object" === Object.prototype.toString.call(e).slice(8, -1);
  }

  function f() {
    var t = Object(arguments.length <= 0 ? undefined : arguments[0]),
        s = ["__proto__", "constructor", "prototype"];

    for (var _i5 = 1; _i5 < arguments.length; _i5 += 1) {
      var _r3 = _i5 < 0 || arguments.length <= _i5 ? undefined : arguments[_i5];

      if (null != _r3 && (a = _r3, !("undefined" != typeof window && void 0 !== window.HTMLElement ? a instanceof HTMLElement : a && (1 === a.nodeType || 11 === a.nodeType)))) {
        var _e21 = Object.keys(Object(_r3)).filter(function (e) {
          return s.indexOf(e) < 0;
        });

        for (var _s15 = 0, _a9 = _e21.length; _s15 < _a9; _s15 += 1) {
          var _a10 = _e21[_s15],
              _i6 = Object.getOwnPropertyDescriptor(_r3, _a10);

          void 0 !== _i6 && _i6.enumerable && (m(t[_a10]) && m(_r3[_a10]) ? _r3[_a10].__swiper__ ? t[_a10] = _r3[_a10] : f(t[_a10], _r3[_a10]) : !m(t[_a10]) && m(_r3[_a10]) ? (t[_a10] = {}, _r3[_a10].__swiper__ ? t[_a10] = _r3[_a10] : f(t[_a10], _r3[_a10])) : t[_a10] = _r3[_a10]);
        }
      }
    }

    var a;
    return t;
  }

  function g(e, t, s) {
    e.style.setProperty(t, s);
  }

  function v(_ref) {
    var e = _ref.swiper,
        t = _ref.targetPosition,
        s = _ref.side;
    var a = r(),
        i = -e.translate;
    var n,
        l = null;
    var o = e.params.speed;
    e.wrapperEl.style.scrollSnapType = "none", a.cancelAnimationFrame(e.cssModeFrameID);

    var d = t > i ? "next" : "prev",
        c = function c(e, t) {
      return "next" === d && e >= t || "prev" === d && e <= t;
    },
        p = function p() {
      n = new Date().getTime(), null === l && (l = n);
      var r = Math.max(Math.min((n - l) / o, 1), 0),
          d = .5 - Math.cos(r * Math.PI) / 2;
      var u = i + d * (t - i);
      if (c(u, t) && (u = t), e.wrapperEl.scrollTo(_defineProperty({}, s, u)), c(u, t)) return e.wrapperEl.style.overflow = "hidden", e.wrapperEl.style.scrollSnapType = "", setTimeout(function () {
        e.wrapperEl.style.overflow = "", e.wrapperEl.scrollTo(_defineProperty({}, s, u));
      }), void a.cancelAnimationFrame(e.cssModeFrameID);
      e.cssModeFrameID = a.requestAnimationFrame(p);
    };

    p();
  }

  var w, b, x;

  function y() {
    return w || (w = function () {
      var e = r(),
          t = a();
      return {
        smoothScroll: t.documentElement && "scrollBehavior" in t.documentElement.style,
        touch: !!("ontouchstart" in e || e.DocumentTouch && t instanceof e.DocumentTouch),
        passiveListener: function () {
          var t = !1;

          try {
            var _s16 = Object.defineProperty({}, "passive", {
              get: function get() {
                t = !0;
              }
            });

            e.addEventListener("testPassiveListener", null, _s16);
          } catch (e) {}

          return t;
        }(),
        gestures: "ongesturestart" in e
      };
    }()), w;
  }

  function E() {
    var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return b || (b = function () {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          e = _ref2.userAgent;

      var t = y(),
          s = r(),
          a = s.navigator.platform,
          i = e || s.navigator.userAgent,
          n = {
        ios: !1,
        android: !1
      },
          l = s.screen.width,
          o = s.screen.height,
          d = i.match(/(Android);?[\s\/]+([\d.]+)?/);
      var c = i.match(/(iPad).*OS\s([\d_]+)/);
      var p = i.match(/(iPod)(.*OS\s([\d_]+))?/),
          u = !c && i.match(/(iPhone\sOS|iOS)\s([\d_]+)/),
          h = "Win32" === a;
      var m = "MacIntel" === a;
      return !c && m && t.touch && ["1024x1366", "1366x1024", "834x1194", "1194x834", "834x1112", "1112x834", "768x1024", "1024x768", "820x1180", "1180x820", "810x1080", "1080x810"].indexOf("".concat(l, "x").concat(o)) >= 0 && (c = i.match(/(Version)\/([\d.]+)/), c || (c = [0, 1, "13_0_0"]), m = !1), d && !h && (n.os = "android", n.android = !0), (c || u || p) && (n.os = "ios", n.ios = !0), n;
    }(e)), b;
  }

  function T() {
    return x || (x = function () {
      var e = r();
      return {
        isSafari: function () {
          var t = e.navigator.userAgent.toLowerCase();
          return t.indexOf("safari") >= 0 && t.indexOf("chrome") < 0 && t.indexOf("android") < 0;
        }(),
        isWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(e.navigator.userAgent)
      };
    }()), x;
  }

  Object.keys(c).forEach(function (e) {
    Object.defineProperty(d.fn, e, {
      value: c[e],
      writable: !0
    });
  });
  var C = {
    on: function on(e, t, s) {
      var a = this;
      if ("function" != typeof t) return a;
      var i = s ? "unshift" : "push";
      return e.split(" ").forEach(function (e) {
        a.eventsListeners[e] || (a.eventsListeners[e] = []), a.eventsListeners[e][i](t);
      }), a;
    },
    once: function once(e, t, s) {
      var a = this;
      if ("function" != typeof t) return a;

      function i() {
        for (var _len8 = arguments.length, s = new Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
          s[_key8] = arguments[_key8];
        }

        a.off(e, i), i.__emitterProxy && delete i.__emitterProxy, t.apply(a, s);
      }

      return i.__emitterProxy = t, a.on(e, i, s);
    },
    onAny: function onAny(e, t) {
      var s = this;
      if ("function" != typeof e) return s;
      var a = t ? "unshift" : "push";
      return s.eventsAnyListeners.indexOf(e) < 0 && s.eventsAnyListeners[a](e), s;
    },
    offAny: function offAny(e) {
      var t = this;
      if (!t.eventsAnyListeners) return t;
      var s = t.eventsAnyListeners.indexOf(e);
      return s >= 0 && t.eventsAnyListeners.splice(s, 1), t;
    },
    off: function off(e, t) {
      var s = this;
      return s.eventsListeners ? (e.split(" ").forEach(function (e) {
        void 0 === t ? s.eventsListeners[e] = [] : s.eventsListeners[e] && s.eventsListeners[e].forEach(function (a, i) {
          (a === t || a.__emitterProxy && a.__emitterProxy === t) && s.eventsListeners[e].splice(i, 1);
        });
      }), s) : s;
    },
    emit: function emit() {
      var t = this;
      if (!t.eventsListeners) return t;
      var s, a, i;

      for (var _len9 = arguments.length, e = new Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        e[_key9] = arguments[_key9];
      }

      "string" == typeof e[0] || Array.isArray(e[0]) ? (s = e[0], a = e.slice(1, e.length), i = t) : (s = e[0].events, a = e[0].data, i = e[0].context || t), a.unshift(i);
      return (Array.isArray(s) ? s : s.split(" ")).forEach(function (e) {
        t.eventsAnyListeners && t.eventsAnyListeners.length && t.eventsAnyListeners.forEach(function (t) {
          t.apply(i, [e].concat(_toConsumableArray(a)));
        }), t.eventsListeners && t.eventsListeners[e] && t.eventsListeners[e].forEach(function (e) {
          e.apply(i, a);
        });
      }), t;
    }
  };

  function $(_ref3) {
    var e = _ref3.swiper,
        t = _ref3.runCallbacks,
        s = _ref3.direction,
        a = _ref3.step;
    var i = e.activeIndex,
        r = e.previousIndex;
    var n = s;

    if (n || (n = i > r ? "next" : i < r ? "prev" : "reset"), e.emit("transition".concat(a)), t && i !== r) {
      if ("reset" === n) return void e.emit("slideResetTransition".concat(a));
      e.emit("slideChangeTransition".concat(a)), "next" === n ? e.emit("slideNextTransition".concat(a)) : e.emit("slidePrevTransition".concat(a));
    }
  }

  function S(e) {
    var t = this,
        s = a(),
        i = r(),
        n = t.touchEventsData,
        l = t.params,
        o = t.touches,
        c = t.enabled;
    if (!c) return;
    if (t.animating && l.preventInteractionOnTransition) return;
    !t.animating && l.cssMode && l.loop && t.loopFix();
    var p = e;
    p.originalEvent && (p = p.originalEvent);
    var h = d(p.target);
    if ("wrapper" === l.touchEventsTarget && !h.closest(t.wrapperEl).length) return;
    if (n.isTouchEvent = "touchstart" === p.type, !n.isTouchEvent && "which" in p && 3 === p.which) return;
    if (!n.isTouchEvent && "button" in p && p.button > 0) return;
    if (n.isTouched && n.isMoved) return;
    !!l.noSwipingClass && "" !== l.noSwipingClass && p.target && p.target.shadowRoot && e.path && e.path[0] && (h = d(e.path[0]));
    var m = l.noSwipingSelector ? l.noSwipingSelector : ".".concat(l.noSwipingClass),
        f = !(!p.target || !p.target.shadowRoot);
    if (l.noSwiping && (f ? function (e) {
      var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this;
      return function t(s) {
        return s && s !== a() && s !== r() ? (s.assignedSlot && (s = s.assignedSlot), s.closest(e) || t(s.getRootNode().host)) : null;
      }(t);
    }(m, p.target) : h.closest(m)[0])) return void (t.allowClick = !0);
    if (l.swipeHandler && !h.closest(l.swipeHandler)[0]) return;
    o.currentX = "touchstart" === p.type ? p.targetTouches[0].pageX : p.pageX, o.currentY = "touchstart" === p.type ? p.targetTouches[0].pageY : p.pageY;
    var g = o.currentX,
        v = o.currentY,
        w = l.edgeSwipeDetection || l.iOSEdgeSwipeDetection,
        b = l.edgeSwipeThreshold || l.iOSEdgeSwipeThreshold;

    if (w && (g <= b || g >= i.innerWidth - b)) {
      if ("prevent" !== w) return;
      e.preventDefault();
    }

    if (Object.assign(n, {
      isTouched: !0,
      isMoved: !1,
      allowTouchCallbacks: !0,
      isScrolling: void 0,
      startMoving: void 0
    }), o.startX = g, o.startY = v, n.touchStartTime = u(), t.allowClick = !0, t.updateSize(), t.swipeDirection = void 0, l.threshold > 0 && (n.allowThresholdMove = !1), "touchstart" !== p.type) {
      var _e22 = !0;

      h.is(n.focusableElements) && (_e22 = !1), s.activeElement && d(s.activeElement).is(n.focusableElements) && s.activeElement !== h[0] && s.activeElement.blur();

      var _a11 = _e22 && t.allowTouchMove && l.touchStartPreventDefault;

      !l.touchStartForcePreventDefault && !_a11 || h[0].isContentEditable || p.preventDefault();
    }

    t.emit("touchStart", p);
  }

  function M(e) {
    var t = a(),
        s = this,
        i = s.touchEventsData,
        r = s.params,
        n = s.touches,
        l = s.rtlTranslate,
        o = s.enabled;
    if (!o) return;
    var c = e;
    if (c.originalEvent && (c = c.originalEvent), !i.isTouched) return void (i.startMoving && i.isScrolling && s.emit("touchMoveOpposite", c));
    if (i.isTouchEvent && "touchmove" !== c.type) return;
    var p = "touchmove" === c.type && c.targetTouches && (c.targetTouches[0] || c.changedTouches[0]),
        h = "touchmove" === c.type ? p.pageX : c.pageX,
        m = "touchmove" === c.type ? p.pageY : c.pageY;
    if (c.preventedByNestedSwiper) return n.startX = h, void (n.startY = m);
    if (!s.allowTouchMove) return s.allowClick = !1, void (i.isTouched && (Object.assign(n, {
      startX: h,
      startY: m,
      currentX: h,
      currentY: m
    }), i.touchStartTime = u()));
    if (i.isTouchEvent && r.touchReleaseOnEdges && !r.loop) if (s.isVertical()) {
      if (m < n.startY && s.translate <= s.maxTranslate() || m > n.startY && s.translate >= s.minTranslate()) return i.isTouched = !1, void (i.isMoved = !1);
    } else if (h < n.startX && s.translate <= s.maxTranslate() || h > n.startX && s.translate >= s.minTranslate()) return;
    if (i.isTouchEvent && t.activeElement && c.target === t.activeElement && d(c.target).is(i.focusableElements)) return i.isMoved = !0, void (s.allowClick = !1);
    if (i.allowTouchCallbacks && s.emit("touchMove", c), c.targetTouches && c.targetTouches.length > 1) return;
    n.currentX = h, n.currentY = m;
    var f = n.currentX - n.startX,
        g = n.currentY - n.startY;
    if (s.params.threshold && Math.sqrt(Math.pow(f, 2) + Math.pow(g, 2)) < s.params.threshold) return;

    if (void 0 === i.isScrolling) {
      var _e23;

      s.isHorizontal() && n.currentY === n.startY || s.isVertical() && n.currentX === n.startX ? i.isScrolling = !1 : f * f + g * g >= 25 && (_e23 = 180 * Math.atan2(Math.abs(g), Math.abs(f)) / Math.PI, i.isScrolling = s.isHorizontal() ? _e23 > r.touchAngle : 90 - _e23 > r.touchAngle);
    }

    if (i.isScrolling && s.emit("touchMoveOpposite", c), void 0 === i.startMoving && (n.currentX === n.startX && n.currentY === n.startY || (i.startMoving = !0)), i.isScrolling) return void (i.isTouched = !1);
    if (!i.startMoving) return;
    s.allowClick = !1, !r.cssMode && c.cancelable && c.preventDefault(), r.touchMoveStopPropagation && !r.nested && c.stopPropagation(), i.isMoved || (r.loop && !r.cssMode && s.loopFix(), i.startTranslate = s.getTranslate(), s.setTransition(0), s.animating && s.$wrapperEl.trigger("webkitTransitionEnd transitionend"), i.allowMomentumBounce = !1, !r.grabCursor || !0 !== s.allowSlideNext && !0 !== s.allowSlidePrev || s.setGrabCursor(!0), s.emit("sliderFirstMove", c)), s.emit("sliderMove", c), i.isMoved = !0;
    var v = s.isHorizontal() ? f : g;
    n.diff = v, v *= r.touchRatio, l && (v = -v), s.swipeDirection = v > 0 ? "prev" : "next", i.currentTranslate = v + i.startTranslate;
    var w = !0,
        b = r.resistanceRatio;

    if (r.touchReleaseOnEdges && (b = 0), v > 0 && i.currentTranslate > s.minTranslate() ? (w = !1, r.resistance && (i.currentTranslate = s.minTranslate() - 1 + Math.pow(-s.minTranslate() + i.startTranslate + v, b))) : v < 0 && i.currentTranslate < s.maxTranslate() && (w = !1, r.resistance && (i.currentTranslate = s.maxTranslate() + 1 - Math.pow(s.maxTranslate() - i.startTranslate - v, b))), w && (c.preventedByNestedSwiper = !0), !s.allowSlideNext && "next" === s.swipeDirection && i.currentTranslate < i.startTranslate && (i.currentTranslate = i.startTranslate), !s.allowSlidePrev && "prev" === s.swipeDirection && i.currentTranslate > i.startTranslate && (i.currentTranslate = i.startTranslate), s.allowSlidePrev || s.allowSlideNext || (i.currentTranslate = i.startTranslate), r.threshold > 0) {
      if (!(Math.abs(v) > r.threshold || i.allowThresholdMove)) return void (i.currentTranslate = i.startTranslate);
      if (!i.allowThresholdMove) return i.allowThresholdMove = !0, n.startX = n.currentX, n.startY = n.currentY, i.currentTranslate = i.startTranslate, void (n.diff = s.isHorizontal() ? n.currentX - n.startX : n.currentY - n.startY);
    }

    r.followFinger && !r.cssMode && ((r.freeMode && r.freeMode.enabled && s.freeMode || r.watchSlidesProgress) && (s.updateActiveIndex(), s.updateSlidesClasses()), s.params.freeMode && r.freeMode.enabled && s.freeMode && s.freeMode.onTouchMove(), s.updateProgress(i.currentTranslate), s.setTranslate(i.currentTranslate));
  }

  function P(e) {
    var t = this,
        s = t.touchEventsData,
        a = t.params,
        i = t.touches,
        r = t.rtlTranslate,
        n = t.slidesGrid,
        l = t.enabled;
    if (!l) return;
    var o = e;
    if (o.originalEvent && (o = o.originalEvent), s.allowTouchCallbacks && t.emit("touchEnd", o), s.allowTouchCallbacks = !1, !s.isTouched) return s.isMoved && a.grabCursor && t.setGrabCursor(!1), s.isMoved = !1, void (s.startMoving = !1);
    a.grabCursor && s.isMoved && s.isTouched && (!0 === t.allowSlideNext || !0 === t.allowSlidePrev) && t.setGrabCursor(!1);
    var d = u(),
        c = d - s.touchStartTime;
    if (t.allowClick && (t.updateClickedSlide(o), t.emit("tap click", o), c < 300 && d - s.lastClickTime < 300 && t.emit("doubleTap doubleClick", o)), s.lastClickTime = u(), p(function () {
      t.destroyed || (t.allowClick = !0);
    }), !s.isTouched || !s.isMoved || !t.swipeDirection || 0 === i.diff || s.currentTranslate === s.startTranslate) return s.isTouched = !1, s.isMoved = !1, void (s.startMoving = !1);
    var h;
    if (s.isTouched = !1, s.isMoved = !1, s.startMoving = !1, h = a.followFinger ? r ? t.translate : -t.translate : -s.currentTranslate, a.cssMode) return;
    if (t.params.freeMode && a.freeMode.enabled) return void t.freeMode.onTouchEnd({
      currentPos: h
    });
    var m = 0,
        f = t.slidesSizesGrid[0];

    for (var _e24 = 0; _e24 < n.length; _e24 += _e24 < a.slidesPerGroupSkip ? 1 : a.slidesPerGroup) {
      var _t14 = _e24 < a.slidesPerGroupSkip - 1 ? 1 : a.slidesPerGroup;

      void 0 !== n[_e24 + _t14] ? h >= n[_e24] && h < n[_e24 + _t14] && (m = _e24, f = n[_e24 + _t14] - n[_e24]) : h >= n[_e24] && (m = _e24, f = n[n.length - 1] - n[n.length - 2]);
    }

    var g = (h - n[m]) / f,
        v = m < a.slidesPerGroupSkip - 1 ? 1 : a.slidesPerGroup;

    if (c > a.longSwipesMs) {
      if (!a.longSwipes) return void t.slideTo(t.activeIndex);
      "next" === t.swipeDirection && (g >= a.longSwipesRatio ? t.slideTo(m + v) : t.slideTo(m)), "prev" === t.swipeDirection && (g > 1 - a.longSwipesRatio ? t.slideTo(m + v) : t.slideTo(m));
    } else {
      if (!a.shortSwipes) return void t.slideTo(t.activeIndex);
      t.navigation && (o.target === t.navigation.nextEl || o.target === t.navigation.prevEl) ? o.target === t.navigation.nextEl ? t.slideTo(m + v) : t.slideTo(m) : ("next" === t.swipeDirection && t.slideTo(m + v), "prev" === t.swipeDirection && t.slideTo(m));
    }
  }

  function k() {
    var e = this,
        t = e.params,
        s = e.el;
    if (s && 0 === s.offsetWidth) return;
    t.breakpoints && e.setBreakpoint();
    var a = e.allowSlideNext,
        i = e.allowSlidePrev,
        r = e.snapGrid;
    e.allowSlideNext = !0, e.allowSlidePrev = !0, e.updateSize(), e.updateSlides(), e.updateSlidesClasses(), ("auto" === t.slidesPerView || t.slidesPerView > 1) && e.isEnd && !e.isBeginning && !e.params.centeredSlides ? e.slideTo(e.slides.length - 1, 0, !1, !0) : e.slideTo(e.activeIndex, 0, !1, !0), e.autoplay && e.autoplay.running && e.autoplay.paused && e.autoplay.run(), e.allowSlidePrev = i, e.allowSlideNext = a, e.params.watchOverflow && r !== e.snapGrid && e.checkOverflow();
  }

  function z(e) {
    var t = this;
    t.enabled && (t.allowClick || (t.params.preventClicks && e.preventDefault(), t.params.preventClicksPropagation && t.animating && (e.stopPropagation(), e.stopImmediatePropagation())));
  }

  function O() {
    var e = this,
        t = e.wrapperEl,
        s = e.rtlTranslate,
        a = e.enabled;
    if (!a) return;
    var i;
    e.previousTranslate = e.translate, e.isHorizontal() ? e.translate = -t.scrollLeft : e.translate = -t.scrollTop, -0 === e.translate && (e.translate = 0), e.updateActiveIndex(), e.updateSlidesClasses();
    var r = e.maxTranslate() - e.minTranslate();
    i = 0 === r ? 0 : (e.translate - e.minTranslate()) / r, i !== e.progress && e.updateProgress(s ? -e.translate : e.translate), e.emit("setTranslate", e.translate, !1);
  }

  var I = !1;

  function L() {}

  var A = function A(e, t) {
    var s = a(),
        i = e.params,
        r = e.touchEvents,
        n = e.el,
        l = e.wrapperEl,
        o = e.device,
        d = e.support,
        c = !!i.nested,
        p = "on" === t ? "addEventListener" : "removeEventListener",
        u = t;

    if (d.touch) {
      var _t15 = !("touchstart" !== r.start || !d.passiveListener || !i.passiveListeners) && {
        passive: !0,
        capture: !1
      };

      n[p](r.start, e.onTouchStart, _t15), n[p](r.move, e.onTouchMove, d.passiveListener ? {
        passive: !1,
        capture: c
      } : c), n[p](r.end, e.onTouchEnd, _t15), r.cancel && n[p](r.cancel, e.onTouchEnd, _t15);
    } else n[p](r.start, e.onTouchStart, !1), s[p](r.move, e.onTouchMove, c), s[p](r.end, e.onTouchEnd, !1);

    (i.preventClicks || i.preventClicksPropagation) && n[p]("click", e.onClick, !0), i.cssMode && l[p]("scroll", e.onScroll), i.updateOnWindowResize ? e[u](o.ios || o.android ? "resize orientationchange observerUpdate" : "resize observerUpdate", k, !0) : e[u]("observerUpdate", k, !0);
  };

  var D = function D(e, t) {
    return e.grid && t.grid && t.grid.rows > 1;
  };

  var G = {
    init: !0,
    direction: "horizontal",
    touchEventsTarget: "wrapper",
    initialSlide: 0,
    speed: 300,
    cssMode: !1,
    updateOnWindowResize: !0,
    resizeObserver: !0,
    nested: !1,
    createElements: !1,
    enabled: !0,
    focusableElements: "input, select, option, textarea, button, video, label",
    width: null,
    height: null,
    preventInteractionOnTransition: !1,
    userAgent: null,
    url: null,
    edgeSwipeDetection: !1,
    edgeSwipeThreshold: 20,
    autoHeight: !1,
    setWrapperSize: !1,
    virtualTranslate: !1,
    effect: "slide",
    breakpoints: void 0,
    breakpointsBase: "window",
    spaceBetween: 0,
    slidesPerView: 1,
    slidesPerGroup: 1,
    slidesPerGroupSkip: 0,
    slidesPerGroupAuto: !1,
    centeredSlides: !1,
    centeredSlidesBounds: !1,
    slidesOffsetBefore: 0,
    slidesOffsetAfter: 0,
    normalizeSlideIndex: !0,
    centerInsufficientSlides: !1,
    watchOverflow: !0,
    roundLengths: !1,
    touchRatio: 1,
    touchAngle: 45,
    simulateTouch: !0,
    shortSwipes: !0,
    longSwipes: !0,
    longSwipesRatio: .5,
    longSwipesMs: 300,
    followFinger: !0,
    allowTouchMove: !0,
    threshold: 0,
    touchMoveStopPropagation: !1,
    touchStartPreventDefault: !0,
    touchStartForcePreventDefault: !1,
    touchReleaseOnEdges: !1,
    uniqueNavElements: !0,
    resistance: !0,
    resistanceRatio: .85,
    watchSlidesProgress: !1,
    grabCursor: !1,
    preventClicks: !0,
    preventClicksPropagation: !0,
    slideToClickedSlide: !1,
    preloadImages: !0,
    updateOnImagesReady: !0,
    loop: !1,
    loopAdditionalSlides: 0,
    loopedSlides: null,
    loopFillGroupWithBlank: !1,
    loopPreventsSlide: !0,
    allowSlidePrev: !0,
    allowSlideNext: !0,
    swipeHandler: null,
    noSwiping: !0,
    noSwipingClass: "swiper-no-swiping",
    noSwipingSelector: null,
    passiveListeners: !0,
    containerModifierClass: "swiper-",
    slideClass: "swiper-slide",
    slideBlankClass: "swiper-slide-invisible-blank",
    slideActiveClass: "swiper-slide-active",
    slideDuplicateActiveClass: "swiper-slide-duplicate-active",
    slideVisibleClass: "swiper-slide-visible",
    slideDuplicateClass: "swiper-slide-duplicate",
    slideNextClass: "swiper-slide-next",
    slideDuplicateNextClass: "swiper-slide-duplicate-next",
    slidePrevClass: "swiper-slide-prev",
    slideDuplicatePrevClass: "swiper-slide-duplicate-prev",
    wrapperClass: "swiper-wrapper",
    runCallbacksOnInit: !0,
    _emitClasses: !1
  };

  function N(e, t) {
    return function () {
      var s = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var a = Object.keys(s)[0],
          i = s[a];
      "object" == _typeof(i) && null !== i ? (["navigation", "pagination", "scrollbar"].indexOf(a) >= 0 && !0 === e[a] && (e[a] = {
        auto: !0
      }), a in e && "enabled" in i ? (!0 === e[a] && (e[a] = {
        enabled: !0
      }), "object" != _typeof(e[a]) || "enabled" in e[a] || (e[a].enabled = !0), e[a] || (e[a] = {
        enabled: !1
      }), f(t, s)) : f(t, s)) : f(t, s);
    };
  }

  var B = {
    eventsEmitter: C,
    update: {
      updateSize: function updateSize() {
        var e = this;
        var t, s;
        var a = e.$el;
        t = void 0 !== e.params.width && null !== e.params.width ? e.params.width : a[0].clientWidth, s = void 0 !== e.params.height && null !== e.params.height ? e.params.height : a[0].clientHeight, 0 === t && e.isHorizontal() || 0 === s && e.isVertical() || (t = t - parseInt(a.css("padding-left") || 0, 10) - parseInt(a.css("padding-right") || 0, 10), s = s - parseInt(a.css("padding-top") || 0, 10) - parseInt(a.css("padding-bottom") || 0, 10), Number.isNaN(t) && (t = 0), Number.isNaN(s) && (s = 0), Object.assign(e, {
          width: t,
          height: s,
          size: e.isHorizontal() ? t : s
        }));
      },
      updateSlides: function updateSlides() {
        var e = this;

        function t(t) {
          return e.isHorizontal() ? t : {
            width: "height",
            "margin-top": "margin-left",
            "margin-bottom ": "margin-right",
            "margin-left": "margin-top",
            "margin-right": "margin-bottom",
            "padding-left": "padding-top",
            "padding-right": "padding-bottom",
            marginRight: "marginBottom"
          }[t];
        }

        function s(e, s) {
          return parseFloat(e.getPropertyValue(t(s)) || 0);
        }

        var a = e.params,
            i = e.$wrapperEl,
            r = e.size,
            n = e.rtlTranslate,
            l = e.wrongRTL,
            o = e.virtual && a.virtual.enabled,
            d = o ? e.virtual.slides.length : e.slides.length,
            c = i.children(".".concat(e.params.slideClass)),
            p = o ? e.virtual.slides.length : c.length;
        var u = [];
        var h = [],
            m = [];
        var f = a.slidesOffsetBefore;
        "function" == typeof f && (f = a.slidesOffsetBefore.call(e));
        var v = a.slidesOffsetAfter;
        "function" == typeof v && (v = a.slidesOffsetAfter.call(e));
        var w = e.snapGrid.length,
            b = e.slidesGrid.length;
        var x = a.spaceBetween,
            y = -f,
            E = 0,
            T = 0;
        if (void 0 === r) return;
        "string" == typeof x && x.indexOf("%") >= 0 && (x = parseFloat(x.replace("%", "")) / 100 * r), e.virtualSize = -x, n ? c.css({
          marginLeft: "",
          marginBottom: "",
          marginTop: ""
        }) : c.css({
          marginRight: "",
          marginBottom: "",
          marginTop: ""
        }), a.centeredSlides && a.cssMode && (g(e.wrapperEl, "--swiper-centered-offset-before", ""), g(e.wrapperEl, "--swiper-centered-offset-after", ""));
        var C = a.grid && a.grid.rows > 1 && e.grid;
        var $;
        C && e.grid.initSlides(p);
        var S = "auto" === a.slidesPerView && a.breakpoints && Object.keys(a.breakpoints).filter(function (e) {
          return void 0 !== a.breakpoints[e].slidesPerView;
        }).length > 0;

        for (var _i7 = 0; _i7 < p; _i7 += 1) {
          $ = 0;

          var _n4 = c.eq(_i7);

          if (C && e.grid.updateSlide(_i7, _n4, p, t), "none" !== _n4.css("display")) {
            if ("auto" === a.slidesPerView) {
              S && (c[_i7].style[t("width")] = "");

              var _r4 = getComputedStyle(_n4[0]),
                  _l2 = _n4[0].style.transform,
                  _o2 = _n4[0].style.webkitTransform;

              if (_l2 && (_n4[0].style.transform = "none"), _o2 && (_n4[0].style.webkitTransform = "none"), a.roundLengths) $ = e.isHorizontal() ? _n4.outerWidth(!0) : _n4.outerHeight(!0);else {
                var _e25 = s(_r4, "width"),
                    _t16 = s(_r4, "padding-left"),
                    _a12 = s(_r4, "padding-right"),
                    _i8 = s(_r4, "margin-left"),
                    _l3 = s(_r4, "margin-right"),
                    _o3 = _r4.getPropertyValue("box-sizing");

                if (_o3 && "border-box" === _o3) $ = _e25 + _i8 + _l3;else {
                  var _n4$ = _n4[0],
                      _s17 = _n4$.clientWidth,
                      _r5 = _n4$.offsetWidth;
                  $ = _e25 + _t16 + _a12 + _i8 + _l3 + (_r5 - _s17);
                }
              }
              _l2 && (_n4[0].style.transform = _l2), _o2 && (_n4[0].style.webkitTransform = _o2), a.roundLengths && ($ = Math.floor($));
            } else $ = (r - (a.slidesPerView - 1) * x) / a.slidesPerView, a.roundLengths && ($ = Math.floor($)), c[_i7] && (c[_i7].style[t("width")] = "".concat($, "px"));

            c[_i7] && (c[_i7].swiperSlideSize = $), m.push($), a.centeredSlides ? (y = y + $ / 2 + E / 2 + x, 0 === E && 0 !== _i7 && (y = y - r / 2 - x), 0 === _i7 && (y = y - r / 2 - x), Math.abs(y) < .001 && (y = 0), a.roundLengths && (y = Math.floor(y)), T % a.slidesPerGroup == 0 && u.push(y), h.push(y)) : (a.roundLengths && (y = Math.floor(y)), (T - Math.min(e.params.slidesPerGroupSkip, T)) % e.params.slidesPerGroup == 0 && u.push(y), h.push(y), y = y + $ + x), e.virtualSize += $ + x, E = $, T += 1;
          }
        }

        if (e.virtualSize = Math.max(e.virtualSize, r) + v, n && l && ("slide" === a.effect || "coverflow" === a.effect) && i.css({
          width: "".concat(e.virtualSize + a.spaceBetween, "px")
        }), a.setWrapperSize && i.css(_defineProperty({}, t("width"), "".concat(e.virtualSize + a.spaceBetween, "px"))), C && e.grid.updateWrapperSize($, u, t), !a.centeredSlides) {
          var _t17 = [];

          for (var _s18 = 0; _s18 < u.length; _s18 += 1) {
            var _i9 = u[_s18];
            a.roundLengths && (_i9 = Math.floor(_i9)), u[_s18] <= e.virtualSize - r && _t17.push(_i9);
          }

          u = _t17, Math.floor(e.virtualSize - r) - Math.floor(u[u.length - 1]) > 1 && u.push(e.virtualSize - r);
        }

        if (0 === u.length && (u = [0]), 0 !== a.spaceBetween) {
          var _s19 = e.isHorizontal() && n ? "marginLeft" : t("marginRight");

          c.filter(function (e, t) {
            return !a.cssMode || t !== c.length - 1;
          }).css(_defineProperty({}, _s19, "".concat(x, "px")));
        }

        if (a.centeredSlides && a.centeredSlidesBounds) {
          var _e26 = 0;
          m.forEach(function (t) {
            _e26 += t + (a.spaceBetween ? a.spaceBetween : 0);
          }), _e26 -= a.spaceBetween;

          var _t18 = _e26 - r;

          u = u.map(function (e) {
            return e < 0 ? -f : e > _t18 ? _t18 + v : e;
          });
        }

        if (a.centerInsufficientSlides) {
          var _e27 = 0;

          if (m.forEach(function (t) {
            _e27 += t + (a.spaceBetween ? a.spaceBetween : 0);
          }), _e27 -= a.spaceBetween, _e27 < r) {
            var _t19 = (r - _e27) / 2;

            u.forEach(function (e, s) {
              u[s] = e - _t19;
            }), h.forEach(function (e, s) {
              h[s] = e + _t19;
            });
          }
        }

        if (Object.assign(e, {
          slides: c,
          snapGrid: u,
          slidesGrid: h,
          slidesSizesGrid: m
        }), a.centeredSlides && a.cssMode && !a.centeredSlidesBounds) {
          g(e.wrapperEl, "--swiper-centered-offset-before", -u[0] + "px"), g(e.wrapperEl, "--swiper-centered-offset-after", e.size / 2 - m[m.length - 1] / 2 + "px");

          var _t20 = -e.snapGrid[0],
              _s20 = -e.slidesGrid[0];

          e.snapGrid = e.snapGrid.map(function (e) {
            return e + _t20;
          }), e.slidesGrid = e.slidesGrid.map(function (e) {
            return e + _s20;
          });
        }

        p !== d && e.emit("slidesLengthChange"), u.length !== w && (e.params.watchOverflow && e.checkOverflow(), e.emit("snapGridLengthChange")), h.length !== b && e.emit("slidesGridLengthChange"), a.watchSlidesProgress && e.updateSlidesOffset();
      },
      updateAutoHeight: function updateAutoHeight(e) {
        var t = this,
            s = [],
            a = t.virtual && t.params.virtual.enabled;
        var i,
            r = 0;
        "number" == typeof e ? t.setTransition(e) : !0 === e && t.setTransition(t.params.speed);

        var n = function n(e) {
          return a ? t.slides.filter(function (t) {
            return parseInt(t.getAttribute("data-swiper-slide-index"), 10) === e;
          })[0] : t.slides.eq(e)[0];
        };

        if ("auto" !== t.params.slidesPerView && t.params.slidesPerView > 1) {
          if (t.params.centeredSlides) t.visibleSlides.each(function (e) {
            s.push(e);
          });else for (i = 0; i < Math.ceil(t.params.slidesPerView); i += 1) {
            var _e28 = t.activeIndex + i;

            if (_e28 > t.slides.length && !a) break;
            s.push(n(_e28));
          }
        } else s.push(n(t.activeIndex));

        for (i = 0; i < s.length; i += 1) {
          if (void 0 !== s[i]) {
            var _e29 = s[i].offsetHeight;
            r = _e29 > r ? _e29 : r;
          }
        }

        r && t.$wrapperEl.css("height", "".concat(r, "px"));
      },
      updateSlidesOffset: function updateSlidesOffset() {
        var e = this,
            t = e.slides;

        for (var _s21 = 0; _s21 < t.length; _s21 += 1) {
          t[_s21].swiperSlideOffset = e.isHorizontal() ? t[_s21].offsetLeft : t[_s21].offsetTop;
        }
      },
      updateSlidesProgress: function updateSlidesProgress() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this && this.translate || 0;
        var t = this,
            s = t.params,
            a = t.slides,
            i = t.rtlTranslate;
        if (0 === a.length) return;
        void 0 === a[0].swiperSlideOffset && t.updateSlidesOffset();
        var r = -e;
        i && (r = e), a.removeClass(s.slideVisibleClass), t.visibleSlidesIndexes = [], t.visibleSlides = [];

        for (var _e30 = 0; _e30 < a.length; _e30 += 1) {
          var _n5 = a[_e30];
          var _l4 = _n5.swiperSlideOffset;
          s.cssMode && s.centeredSlides && (_l4 -= a[0].swiperSlideOffset);

          var _o4 = (r + (s.centeredSlides ? t.minTranslate() : 0) - _l4) / (_n5.swiperSlideSize + s.spaceBetween),
              _d3 = -(r - _l4),
              _c2 = _d3 + t.slidesSizesGrid[_e30];

          (_d3 >= 0 && _d3 < t.size - 1 || _c2 > 1 && _c2 <= t.size || _d3 <= 0 && _c2 >= t.size) && (t.visibleSlides.push(_n5), t.visibleSlidesIndexes.push(_e30), a.eq(_e30).addClass(s.slideVisibleClass)), _n5.progress = i ? -_o4 : _o4;
        }

        t.visibleSlides = d(t.visibleSlides);
      },
      updateProgress: function updateProgress(e) {
        var t = this;

        if (void 0 === e) {
          var _s22 = t.rtlTranslate ? -1 : 1;

          e = t && t.translate && t.translate * _s22 || 0;
        }

        var s = t.params,
            a = t.maxTranslate() - t.minTranslate();
        var i = t.progress,
            r = t.isBeginning,
            n = t.isEnd;
        var l = r,
            o = n;
        0 === a ? (i = 0, r = !0, n = !0) : (i = (e - t.minTranslate()) / a, r = i <= 0, n = i >= 1), Object.assign(t, {
          progress: i,
          isBeginning: r,
          isEnd: n
        }), (s.watchSlidesProgress || s.centeredSlides && s.autoHeight) && t.updateSlidesProgress(e), r && !l && t.emit("reachBeginning toEdge"), n && !o && t.emit("reachEnd toEdge"), (l && !r || o && !n) && t.emit("fromEdge"), t.emit("progress", i);
      },
      updateSlidesClasses: function updateSlidesClasses() {
        var e = this,
            t = e.slides,
            s = e.params,
            a = e.$wrapperEl,
            i = e.activeIndex,
            r = e.realIndex,
            n = e.virtual && s.virtual.enabled;
        var l;
        t.removeClass("".concat(s.slideActiveClass, " ").concat(s.slideNextClass, " ").concat(s.slidePrevClass, " ").concat(s.slideDuplicateActiveClass, " ").concat(s.slideDuplicateNextClass, " ").concat(s.slideDuplicatePrevClass)), l = n ? e.$wrapperEl.find(".".concat(s.slideClass, "[data-swiper-slide-index=\"").concat(i, "\"]")) : t.eq(i), l.addClass(s.slideActiveClass), s.loop && (l.hasClass(s.slideDuplicateClass) ? a.children(".".concat(s.slideClass, ":not(.").concat(s.slideDuplicateClass, ")[data-swiper-slide-index=\"").concat(r, "\"]")).addClass(s.slideDuplicateActiveClass) : a.children(".".concat(s.slideClass, ".").concat(s.slideDuplicateClass, "[data-swiper-slide-index=\"").concat(r, "\"]")).addClass(s.slideDuplicateActiveClass));
        var o = l.nextAll(".".concat(s.slideClass)).eq(0).addClass(s.slideNextClass);
        s.loop && 0 === o.length && (o = t.eq(0), o.addClass(s.slideNextClass));
        var d = l.prevAll(".".concat(s.slideClass)).eq(0).addClass(s.slidePrevClass);
        s.loop && 0 === d.length && (d = t.eq(-1), d.addClass(s.slidePrevClass)), s.loop && (o.hasClass(s.slideDuplicateClass) ? a.children(".".concat(s.slideClass, ":not(.").concat(s.slideDuplicateClass, ")[data-swiper-slide-index=\"").concat(o.attr("data-swiper-slide-index"), "\"]")).addClass(s.slideDuplicateNextClass) : a.children(".".concat(s.slideClass, ".").concat(s.slideDuplicateClass, "[data-swiper-slide-index=\"").concat(o.attr("data-swiper-slide-index"), "\"]")).addClass(s.slideDuplicateNextClass), d.hasClass(s.slideDuplicateClass) ? a.children(".".concat(s.slideClass, ":not(.").concat(s.slideDuplicateClass, ")[data-swiper-slide-index=\"").concat(d.attr("data-swiper-slide-index"), "\"]")).addClass(s.slideDuplicatePrevClass) : a.children(".".concat(s.slideClass, ".").concat(s.slideDuplicateClass, "[data-swiper-slide-index=\"").concat(d.attr("data-swiper-slide-index"), "\"]")).addClass(s.slideDuplicatePrevClass)), e.emitSlidesClasses();
      },
      updateActiveIndex: function updateActiveIndex(e) {
        var t = this,
            s = t.rtlTranslate ? t.translate : -t.translate,
            a = t.slidesGrid,
            i = t.snapGrid,
            r = t.params,
            n = t.activeIndex,
            l = t.realIndex,
            o = t.snapIndex;
        var d,
            c = e;

        if (void 0 === c) {
          for (var _e31 = 0; _e31 < a.length; _e31 += 1) {
            void 0 !== a[_e31 + 1] ? s >= a[_e31] && s < a[_e31 + 1] - (a[_e31 + 1] - a[_e31]) / 2 ? c = _e31 : s >= a[_e31] && s < a[_e31 + 1] && (c = _e31 + 1) : s >= a[_e31] && (c = _e31);
          }

          r.normalizeSlideIndex && (c < 0 || void 0 === c) && (c = 0);
        }

        if (i.indexOf(s) >= 0) d = i.indexOf(s);else {
          var _e32 = Math.min(r.slidesPerGroupSkip, c);

          d = _e32 + Math.floor((c - _e32) / r.slidesPerGroup);
        }
        if (d >= i.length && (d = i.length - 1), c === n) return void (d !== o && (t.snapIndex = d, t.emit("snapIndexChange")));
        var p = parseInt(t.slides.eq(c).attr("data-swiper-slide-index") || c, 10);
        Object.assign(t, {
          snapIndex: d,
          realIndex: p,
          previousIndex: n,
          activeIndex: c
        }), t.emit("activeIndexChange"), t.emit("snapIndexChange"), l !== p && t.emit("realIndexChange"), (t.initialized || t.params.runCallbacksOnInit) && t.emit("slideChange");
      },
      updateClickedSlide: function updateClickedSlide(e) {
        var t = this,
            s = t.params,
            a = d(e.target).closest(".".concat(s.slideClass))[0];
        var i,
            r = !1;
        if (a) for (var _e33 = 0; _e33 < t.slides.length; _e33 += 1) {
          if (t.slides[_e33] === a) {
            r = !0, i = _e33;
            break;
          }
        }
        if (!a || !r) return t.clickedSlide = void 0, void (t.clickedIndex = void 0);
        t.clickedSlide = a, t.virtual && t.params.virtual.enabled ? t.clickedIndex = parseInt(d(a).attr("data-swiper-slide-index"), 10) : t.clickedIndex = i, s.slideToClickedSlide && void 0 !== t.clickedIndex && t.clickedIndex !== t.activeIndex && t.slideToClickedSlide();
      }
    },
    translate: {
      getTranslate: function getTranslate() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.isHorizontal() ? "x" : "y";
        var t = this.params,
            s = this.rtlTranslate,
            a = this.translate,
            i = this.$wrapperEl;
        if (t.virtualTranslate) return s ? -a : a;
        if (t.cssMode) return a;
        var r = h(i[0], e);
        return s && (r = -r), r || 0;
      },
      setTranslate: function setTranslate(e, t) {
        var s = this,
            a = s.rtlTranslate,
            i = s.params,
            r = s.$wrapperEl,
            n = s.wrapperEl,
            l = s.progress;
        var o,
            d = 0,
            c = 0;
        s.isHorizontal() ? d = a ? -e : e : c = e, i.roundLengths && (d = Math.floor(d), c = Math.floor(c)), i.cssMode ? n[s.isHorizontal() ? "scrollLeft" : "scrollTop"] = s.isHorizontal() ? -d : -c : i.virtualTranslate || r.transform("translate3d(".concat(d, "px, ").concat(c, "px, 0px)")), s.previousTranslate = s.translate, s.translate = s.isHorizontal() ? d : c;
        var p = s.maxTranslate() - s.minTranslate();
        o = 0 === p ? 0 : (e - s.minTranslate()) / p, o !== l && s.updateProgress(e), s.emit("setTranslate", s.translate, t);
      },
      minTranslate: function minTranslate() {
        return -this.snapGrid[0];
      },
      maxTranslate: function maxTranslate() {
        return -this.snapGrid[this.snapGrid.length - 1];
      },
      translateTo: function translateTo() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.params.speed;
        var s = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : !0;
        var a = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : !0;
        var i = arguments.length > 4 ? arguments[4] : undefined;
        var r = this,
            n = r.params,
            l = r.wrapperEl;
        if (r.animating && n.preventInteractionOnTransition) return !1;
        var o = r.minTranslate(),
            d = r.maxTranslate();
        var c;

        if (c = a && e > o ? o : a && e < d ? d : e, r.updateProgress(c), n.cssMode) {
          var _e34 = r.isHorizontal();

          if (0 === t) l[_e34 ? "scrollLeft" : "scrollTop"] = -c;else {
            var _l$scrollTo;

            if (!r.support.smoothScroll) return v({
              swiper: r,
              targetPosition: -c,
              side: _e34 ? "left" : "top"
            }), !0;
            l.scrollTo((_l$scrollTo = {}, _defineProperty(_l$scrollTo, _e34 ? "left" : "top", -c), _defineProperty(_l$scrollTo, "behavior", "smooth"), _l$scrollTo));
          }
          return !0;
        }

        return 0 === t ? (r.setTransition(0), r.setTranslate(c), s && (r.emit("beforeTransitionStart", t, i), r.emit("transitionEnd"))) : (r.setTransition(t), r.setTranslate(c), s && (r.emit("beforeTransitionStart", t, i), r.emit("transitionStart")), r.animating || (r.animating = !0, r.onTranslateToWrapperTransitionEnd || (r.onTranslateToWrapperTransitionEnd = function (e) {
          r && !r.destroyed && e.target === this && (r.$wrapperEl[0].removeEventListener("transitionend", r.onTranslateToWrapperTransitionEnd), r.$wrapperEl[0].removeEventListener("webkitTransitionEnd", r.onTranslateToWrapperTransitionEnd), r.onTranslateToWrapperTransitionEnd = null, delete r.onTranslateToWrapperTransitionEnd, s && r.emit("transitionEnd"));
        }), r.$wrapperEl[0].addEventListener("transitionend", r.onTranslateToWrapperTransitionEnd), r.$wrapperEl[0].addEventListener("webkitTransitionEnd", r.onTranslateToWrapperTransitionEnd))), !0;
      }
    },
    transition: {
      setTransition: function setTransition(e, t) {
        var s = this;
        s.params.cssMode || s.$wrapperEl.transition(e), s.emit("setTransition", e, t);
      },
      transitionStart: function transitionStart() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : !0;
        var t = arguments.length > 1 ? arguments[1] : undefined;
        var s = this,
            a = s.params;
        a.cssMode || (a.autoHeight && s.updateAutoHeight(), $({
          swiper: s,
          runCallbacks: e,
          direction: t,
          step: "Start"
        }));
      },
      transitionEnd: function transitionEnd() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : !0;
        var t = arguments.length > 1 ? arguments[1] : undefined;
        var s = this,
            a = s.params;
        s.animating = !1, a.cssMode || (s.setTransition(0), $({
          swiper: s,
          runCallbacks: e,
          direction: t,
          step: "End"
        }));
      }
    },
    slide: {
      slideTo: function slideTo() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.params.speed;
        var s = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : !0;
        var a = arguments.length > 3 ? arguments[3] : undefined;
        var i = arguments.length > 4 ? arguments[4] : undefined;
        if ("number" != typeof e && "string" != typeof e) throw new Error("The 'index' argument cannot have type other than 'number' or 'string'. [".concat(_typeof(e), "] given."));

        if ("string" == typeof e) {
          var _t21 = parseInt(e, 10);

          if (!isFinite(_t21)) throw new Error("The passed-in 'index' (string) couldn't be converted to 'number'. [".concat(e, "] given."));
          e = _t21;
        }

        var r = this;
        var n = e;
        n < 0 && (n = 0);
        var l = r.params,
            o = r.snapGrid,
            d = r.slidesGrid,
            c = r.previousIndex,
            p = r.activeIndex,
            u = r.rtlTranslate,
            h = r.wrapperEl,
            m = r.enabled;
        if (r.animating && l.preventInteractionOnTransition || !m && !a && !i) return !1;
        var f = Math.min(r.params.slidesPerGroupSkip, n);
        var g = f + Math.floor((n - f) / r.params.slidesPerGroup);
        g >= o.length && (g = o.length - 1), (p || l.initialSlide || 0) === (c || 0) && s && r.emit("beforeSlideChangeStart");
        var w = -o[g];
        if (r.updateProgress(w), l.normalizeSlideIndex) for (var _e35 = 0; _e35 < d.length; _e35 += 1) {
          var _t22 = -Math.floor(100 * w),
              _s23 = Math.floor(100 * d[_e35]),
              _a13 = Math.floor(100 * d[_e35 + 1]);

          void 0 !== d[_e35 + 1] ? _t22 >= _s23 && _t22 < _a13 - (_a13 - _s23) / 2 ? n = _e35 : _t22 >= _s23 && _t22 < _a13 && (n = _e35 + 1) : _t22 >= _s23 && (n = _e35);
        }

        if (r.initialized && n !== p) {
          if (!r.allowSlideNext && w < r.translate && w < r.minTranslate()) return !1;
          if (!r.allowSlidePrev && w > r.translate && w > r.maxTranslate() && (p || 0) !== n) return !1;
        }

        var b;
        if (b = n > p ? "next" : n < p ? "prev" : "reset", u && -w === r.translate || !u && w === r.translate) return r.updateActiveIndex(n), l.autoHeight && r.updateAutoHeight(), r.updateSlidesClasses(), "slide" !== l.effect && r.setTranslate(w), "reset" !== b && (r.transitionStart(s, b), r.transitionEnd(s, b)), !1;

        if (l.cssMode) {
          var _e36 = r.isHorizontal(),
              _s24 = u ? w : -w;

          if (0 === t) {
            var _t23 = r.virtual && r.params.virtual.enabled;

            _t23 && (r.wrapperEl.style.scrollSnapType = "none"), h[_e36 ? "scrollLeft" : "scrollTop"] = _s24, _t23 && requestAnimationFrame(function () {
              r.wrapperEl.style.scrollSnapType = "";
            });
          } else {
            var _h$scrollTo;

            if (!r.support.smoothScroll) return v({
              swiper: r,
              targetPosition: _s24,
              side: _e36 ? "left" : "top"
            }), !0;
            h.scrollTo((_h$scrollTo = {}, _defineProperty(_h$scrollTo, _e36 ? "left" : "top", _s24), _defineProperty(_h$scrollTo, "behavior", "smooth"), _h$scrollTo));
          }

          return !0;
        }

        return 0 === t ? (r.setTransition(0), r.setTranslate(w), r.updateActiveIndex(n), r.updateSlidesClasses(), r.emit("beforeTransitionStart", t, a), r.transitionStart(s, b), r.transitionEnd(s, b)) : (r.setTransition(t), r.setTranslate(w), r.updateActiveIndex(n), r.updateSlidesClasses(), r.emit("beforeTransitionStart", t, a), r.transitionStart(s, b), r.animating || (r.animating = !0, r.onSlideToWrapperTransitionEnd || (r.onSlideToWrapperTransitionEnd = function (e) {
          r && !r.destroyed && e.target === this && (r.$wrapperEl[0].removeEventListener("transitionend", r.onSlideToWrapperTransitionEnd), r.$wrapperEl[0].removeEventListener("webkitTransitionEnd", r.onSlideToWrapperTransitionEnd), r.onSlideToWrapperTransitionEnd = null, delete r.onSlideToWrapperTransitionEnd, r.transitionEnd(s, b));
        }), r.$wrapperEl[0].addEventListener("transitionend", r.onSlideToWrapperTransitionEnd), r.$wrapperEl[0].addEventListener("webkitTransitionEnd", r.onSlideToWrapperTransitionEnd))), !0;
      },
      slideToLoop: function slideToLoop() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.params.speed;
        var s = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : !0;
        var a = arguments.length > 3 ? arguments[3] : undefined;
        var i = this;
        var r = e;
        return i.params.loop && (r += i.loopedSlides), i.slideTo(r, t, s, a);
      },
      slideNext: function slideNext() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.params.speed;
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : !0;
        var s = arguments.length > 2 ? arguments[2] : undefined;
        var a = this,
            i = a.animating,
            r = a.enabled,
            n = a.params;
        if (!r) return a;
        var l = n.slidesPerGroup;
        "auto" === n.slidesPerView && 1 === n.slidesPerGroup && n.slidesPerGroupAuto && (l = Math.max(a.slidesPerViewDynamic("current", !0), 1));
        var o = a.activeIndex < n.slidesPerGroupSkip ? 1 : l;

        if (n.loop) {
          if (i && n.loopPreventsSlide) return !1;
          a.loopFix(), a._clientLeft = a.$wrapperEl[0].clientLeft;
        }

        return a.slideTo(a.activeIndex + o, e, t, s);
      },
      slidePrev: function slidePrev() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.params.speed;
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : !0;
        var s = arguments.length > 2 ? arguments[2] : undefined;
        var a = this,
            i = a.params,
            r = a.animating,
            n = a.snapGrid,
            l = a.slidesGrid,
            o = a.rtlTranslate,
            d = a.enabled;
        if (!d) return a;

        if (i.loop) {
          if (r && i.loopPreventsSlide) return !1;
          a.loopFix(), a._clientLeft = a.$wrapperEl[0].clientLeft;
        }

        function c(e) {
          return e < 0 ? -Math.floor(Math.abs(e)) : Math.floor(e);
        }

        var p = c(o ? a.translate : -a.translate),
            u = n.map(function (e) {
          return c(e);
        });
        var h = n[u.indexOf(p) - 1];

        if (void 0 === h && i.cssMode) {
          var _e37;

          n.forEach(function (t, s) {
            p >= t && (_e37 = s);
          }), void 0 !== _e37 && (h = n[_e37 > 0 ? _e37 - 1 : _e37]);
        }

        var m = 0;
        return void 0 !== h && (m = l.indexOf(h), m < 0 && (m = a.activeIndex - 1), "auto" === i.slidesPerView && 1 === i.slidesPerGroup && i.slidesPerGroupAuto && (m = m - a.slidesPerViewDynamic("previous", !0) + 1, m = Math.max(m, 0))), a.slideTo(m, e, t, s);
      },
      slideReset: function slideReset() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.params.speed;
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : !0;
        var s = arguments.length > 2 ? arguments[2] : undefined;
        return this.slideTo(this.activeIndex, e, t, s);
      },
      slideToClosest: function slideToClosest() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.params.speed;
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : !0;
        var s = arguments.length > 2 ? arguments[2] : undefined;
        var a = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : .5;
        var i = this;
        var r = i.activeIndex;
        var n = Math.min(i.params.slidesPerGroupSkip, r),
            l = n + Math.floor((r - n) / i.params.slidesPerGroup),
            o = i.rtlTranslate ? i.translate : -i.translate;

        if (o >= i.snapGrid[l]) {
          var _e38 = i.snapGrid[l];
          o - _e38 > (i.snapGrid[l + 1] - _e38) * a && (r += i.params.slidesPerGroup);
        } else {
          var _e39 = i.snapGrid[l - 1];
          o - _e39 <= (i.snapGrid[l] - _e39) * a && (r -= i.params.slidesPerGroup);
        }

        return r = Math.max(r, 0), r = Math.min(r, i.slidesGrid.length - 1), i.slideTo(r, e, t, s);
      },
      slideToClickedSlide: function slideToClickedSlide() {
        var e = this,
            t = e.params,
            s = e.$wrapperEl,
            a = "auto" === t.slidesPerView ? e.slidesPerViewDynamic() : t.slidesPerView;
        var i,
            r = e.clickedIndex;

        if (t.loop) {
          if (e.animating) return;
          i = parseInt(d(e.clickedSlide).attr("data-swiper-slide-index"), 10), t.centeredSlides ? r < e.loopedSlides - a / 2 || r > e.slides.length - e.loopedSlides + a / 2 ? (e.loopFix(), r = s.children(".".concat(t.slideClass, "[data-swiper-slide-index=\"").concat(i, "\"]:not(.").concat(t.slideDuplicateClass, ")")).eq(0).index(), p(function () {
            e.slideTo(r);
          })) : e.slideTo(r) : r > e.slides.length - a ? (e.loopFix(), r = s.children(".".concat(t.slideClass, "[data-swiper-slide-index=\"").concat(i, "\"]:not(.").concat(t.slideDuplicateClass, ")")).eq(0).index(), p(function () {
            e.slideTo(r);
          })) : e.slideTo(r);
        } else e.slideTo(r);
      }
    },
    loop: {
      loopCreate: function loopCreate() {
        var e = this,
            t = a(),
            s = e.params,
            i = e.$wrapperEl;
        i.children(".".concat(s.slideClass, ".").concat(s.slideDuplicateClass)).remove();
        var r = i.children(".".concat(s.slideClass));

        if (s.loopFillGroupWithBlank) {
          var _e40 = s.slidesPerGroup - r.length % s.slidesPerGroup;

          if (_e40 !== s.slidesPerGroup) {
            for (var _a14 = 0; _a14 < _e40; _a14 += 1) {
              var _e41 = d(t.createElement("div")).addClass("".concat(s.slideClass, " ").concat(s.slideBlankClass));

              i.append(_e41);
            }

            r = i.children(".".concat(s.slideClass));
          }
        }

        "auto" !== s.slidesPerView || s.loopedSlides || (s.loopedSlides = r.length), e.loopedSlides = Math.ceil(parseFloat(s.loopedSlides || s.slidesPerView, 10)), e.loopedSlides += s.loopAdditionalSlides, e.loopedSlides > r.length && (e.loopedSlides = r.length);
        var n = [],
            l = [];
        r.each(function (t, s) {
          var a = d(t);
          s < e.loopedSlides && l.push(t), s < r.length && s >= r.length - e.loopedSlides && n.push(t), a.attr("data-swiper-slide-index", s);
        });

        for (var _e42 = 0; _e42 < l.length; _e42 += 1) {
          i.append(d(l[_e42].cloneNode(!0)).addClass(s.slideDuplicateClass));
        }

        for (var _e43 = n.length - 1; _e43 >= 0; _e43 -= 1) {
          i.prepend(d(n[_e43].cloneNode(!0)).addClass(s.slideDuplicateClass));
        }
      },
      loopFix: function loopFix() {
        var e = this;
        e.emit("beforeLoopFix");
        var t = e.activeIndex,
            s = e.slides,
            a = e.loopedSlides,
            i = e.allowSlidePrev,
            r = e.allowSlideNext,
            n = e.snapGrid,
            l = e.rtlTranslate;
        var o;
        e.allowSlidePrev = !0, e.allowSlideNext = !0;
        var d = -n[t] - e.getTranslate();

        if (t < a) {
          o = s.length - 3 * a + t, o += a;
          e.slideTo(o, 0, !1, !0) && 0 !== d && e.setTranslate((l ? -e.translate : e.translate) - d);
        } else if (t >= s.length - a) {
          o = -s.length + t + a, o += a;
          e.slideTo(o, 0, !1, !0) && 0 !== d && e.setTranslate((l ? -e.translate : e.translate) - d);
        }

        e.allowSlidePrev = i, e.allowSlideNext = r, e.emit("loopFix");
      },
      loopDestroy: function loopDestroy() {
        var e = this.$wrapperEl,
            t = this.params,
            s = this.slides;
        e.children(".".concat(t.slideClass, ".").concat(t.slideDuplicateClass, ",.").concat(t.slideClass, ".").concat(t.slideBlankClass)).remove(), s.removeAttr("data-swiper-slide-index");
      }
    },
    grabCursor: {
      setGrabCursor: function setGrabCursor(e) {
        var t = this;
        if (t.support.touch || !t.params.simulateTouch || t.params.watchOverflow && t.isLocked || t.params.cssMode) return;
        var s = "container" === t.params.touchEventsTarget ? t.el : t.wrapperEl;
        s.style.cursor = "move", s.style.cursor = e ? "-webkit-grabbing" : "-webkit-grab", s.style.cursor = e ? "-moz-grabbin" : "-moz-grab", s.style.cursor = e ? "grabbing" : "grab";
      },
      unsetGrabCursor: function unsetGrabCursor() {
        var e = this;
        e.support.touch || e.params.watchOverflow && e.isLocked || e.params.cssMode || (e["container" === e.params.touchEventsTarget ? "el" : "wrapperEl"].style.cursor = "");
      }
    },
    events: {
      attachEvents: function attachEvents() {
        var e = this,
            t = a(),
            s = e.params,
            i = e.support;
        e.onTouchStart = S.bind(e), e.onTouchMove = M.bind(e), e.onTouchEnd = P.bind(e), s.cssMode && (e.onScroll = O.bind(e)), e.onClick = z.bind(e), i.touch && !I && (t.addEventListener("touchstart", L), I = !0), A(e, "on");
      },
      detachEvents: function detachEvents() {
        A(this, "off");
      }
    },
    breakpoints: {
      setBreakpoint: function setBreakpoint() {
        var e = this,
            t = e.activeIndex,
            s = e.initialized,
            _e$loopedSlides = e.loopedSlides,
            a = _e$loopedSlides === void 0 ? 0 : _e$loopedSlides,
            i = e.params,
            r = e.$el,
            n = i.breakpoints;
        if (!n || n && 0 === Object.keys(n).length) return;
        var l = e.getBreakpoint(n, e.params.breakpointsBase, e.el);
        if (!l || e.currentBreakpoint === l) return;
        var o = (l in n ? n[l] : void 0) || e.originalParams,
            d = D(e, i),
            c = D(e, o),
            p = i.enabled;
        d && !c ? (r.removeClass("".concat(i.containerModifierClass, "grid ").concat(i.containerModifierClass, "grid-column")), e.emitContainerClasses()) : !d && c && (r.addClass("".concat(i.containerModifierClass, "grid")), (o.grid.fill && "column" === o.grid.fill || !o.grid.fill && "column" === i.grid.fill) && r.addClass("".concat(i.containerModifierClass, "grid-column")), e.emitContainerClasses());
        var u = o.direction && o.direction !== i.direction,
            h = i.loop && (o.slidesPerView !== i.slidesPerView || u);
        u && s && e.changeDirection(), f(e.params, o);
        var m = e.params.enabled;
        Object.assign(e, {
          allowTouchMove: e.params.allowTouchMove,
          allowSlideNext: e.params.allowSlideNext,
          allowSlidePrev: e.params.allowSlidePrev
        }), p && !m ? e.disable() : !p && m && e.enable(), e.currentBreakpoint = l, e.emit("_beforeBreakpoint", o), h && s && (e.loopDestroy(), e.loopCreate(), e.updateSlides(), e.slideTo(t - a + e.loopedSlides, 0, !1)), e.emit("breakpoint", o);
      },
      getBreakpoint: function getBreakpoint(e) {
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "window";
        var s = arguments.length > 2 ? arguments[2] : undefined;
        if (!e || "container" === t && !s) return;
        var a = !1;
        var i = r(),
            n = "window" === t ? i.innerHeight : s.clientHeight,
            l = Object.keys(e).map(function (e) {
          if ("string" == typeof e && 0 === e.indexOf("@")) {
            var _t24 = parseFloat(e.substr(1));

            return {
              value: n * _t24,
              point: e
            };
          }

          return {
            value: e,
            point: e
          };
        });
        l.sort(function (e, t) {
          return parseInt(e.value, 10) - parseInt(t.value, 10);
        });

        for (var _e44 = 0; _e44 < l.length; _e44 += 1) {
          var _l$_e = l[_e44],
              _r6 = _l$_e.point,
              _n6 = _l$_e.value;
          "window" === t ? i.matchMedia("(min-width: ".concat(_n6, "px)")).matches && (a = _r6) : _n6 <= s.clientWidth && (a = _r6);
        }

        return a || "max";
      }
    },
    checkOverflow: {
      checkOverflow: function checkOverflow() {
        var e = this,
            t = e.isLocked,
            s = e.params,
            a = s.slidesOffsetBefore;

        if (a) {
          var _t25 = e.slides.length - 1,
              _s25 = e.slidesGrid[_t25] + e.slidesSizesGrid[_t25] + 2 * a;

          e.isLocked = e.size > _s25;
        } else e.isLocked = 1 === e.snapGrid.length;

        !0 === s.allowSlideNext && (e.allowSlideNext = !e.isLocked), !0 === s.allowSlidePrev && (e.allowSlidePrev = !e.isLocked), t && t !== e.isLocked && (e.isEnd = !1), t !== e.isLocked && e.emit(e.isLocked ? "lock" : "unlock");
      }
    },
    classes: {
      addClasses: function addClasses() {
        var e = this,
            t = e.classNames,
            s = e.params,
            a = e.rtl,
            i = e.$el,
            r = e.device,
            n = e.support,
            l = function (e, t) {
          var s = [];
          return e.forEach(function (e) {
            "object" == _typeof(e) ? Object.keys(e).forEach(function (a) {
              e[a] && s.push(t + a);
            }) : "string" == typeof e && s.push(t + e);
          }), s;
        }(["initialized", s.direction, {
          "pointer-events": !n.touch
        }, {
          "free-mode": e.params.freeMode && s.freeMode.enabled
        }, {
          autoheight: s.autoHeight
        }, {
          rtl: a
        }, {
          grid: s.grid && s.grid.rows > 1
        }, {
          "grid-column": s.grid && s.grid.rows > 1 && "column" === s.grid.fill
        }, {
          android: r.android
        }, {
          ios: r.ios
        }, {
          "css-mode": s.cssMode
        }, {
          centered: s.cssMode && s.centeredSlides
        }], s.containerModifierClass);

        t.push.apply(t, _toConsumableArray(l)), i.addClass(_toConsumableArray(t).join(" ")), e.emitContainerClasses();
      },
      removeClasses: function removeClasses() {
        var e = this.$el,
            t = this.classNames;
        e.removeClass(t.join(" ")), this.emitContainerClasses();
      }
    },
    images: {
      loadImage: function loadImage(e, t, s, a, i, n) {
        var l = r();
        var o;

        function c() {
          n && n();
        }

        d(e).parent("picture")[0] || e.complete && i ? c() : t ? (o = new l.Image(), o.onload = c, o.onerror = c, a && (o.sizes = a), s && (o.srcset = s), t && (o.src = t)) : c();
      },
      preloadImages: function preloadImages() {
        var e = this;

        function t() {
          null != e && e && !e.destroyed && (void 0 !== e.imagesLoaded && (e.imagesLoaded += 1), e.imagesLoaded === e.imagesToLoad.length && (e.params.updateOnImagesReady && e.update(), e.emit("imagesReady")));
        }

        e.imagesToLoad = e.$el.find("img");

        for (var _s26 = 0; _s26 < e.imagesToLoad.length; _s26 += 1) {
          var _a15 = e.imagesToLoad[_s26];
          e.loadImage(_a15, _a15.currentSrc || _a15.getAttribute("src"), _a15.srcset || _a15.getAttribute("srcset"), _a15.sizes || _a15.getAttribute("sizes"), !0, t);
        }
      }
    }
  },
      X = {};

  var H = /*#__PURE__*/function () {
    function H() {
      var _e45, _e46, _a$modules;

      _classCallCheck(this, H);

      var t, s;

      for (var _len10 = arguments.length, e = new Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        e[_key10] = arguments[_key10];
      }

      if (1 === e.length && e[0].constructor && "Object" === Object.prototype.toString.call(e[0]).slice(8, -1) ? s = e[0] : (_e45 = e, _e46 = _slicedToArray(_e45, 2), t = _e46[0], s = _e46[1], _e45), s || (s = {}), s = f({}, s), t && !s.el && (s.el = t), s.el && d(s.el).length > 1) {
        var _e47 = [];
        return d(s.el).each(function (t) {
          var a = f({}, s, {
            el: t
          });

          _e47.push(new H(a));
        }), _e47;
      }

      var a = this;
      a.__swiper__ = !0, a.support = y(), a.device = E({
        userAgent: s.userAgent
      }), a.browser = T(), a.eventsListeners = {}, a.eventsAnyListeners = [], a.modules = _toConsumableArray(a.__modules__), s.modules && Array.isArray(s.modules) && (_a$modules = a.modules).push.apply(_a$modules, _toConsumableArray(s.modules));
      var i = {};
      a.modules.forEach(function (e) {
        e({
          swiper: a,
          extendParams: N(s, i),
          on: a.on.bind(a),
          once: a.once.bind(a),
          off: a.off.bind(a),
          emit: a.emit.bind(a)
        });
      });
      var r = f({}, G, i);
      return a.params = f({}, r, X, s), a.originalParams = f({}, a.params), a.passedParams = f({}, s), a.params && a.params.on && Object.keys(a.params.on).forEach(function (e) {
        a.on(e, a.params.on[e]);
      }), a.params && a.params.onAny && a.onAny(a.params.onAny), a.$ = d, Object.assign(a, {
        enabled: a.params.enabled,
        el: t,
        classNames: [],
        slides: d(),
        slidesGrid: [],
        snapGrid: [],
        slidesSizesGrid: [],
        isHorizontal: function isHorizontal() {
          return "horizontal" === a.params.direction;
        },
        isVertical: function isVertical() {
          return "vertical" === a.params.direction;
        },
        activeIndex: 0,
        realIndex: 0,
        isBeginning: !0,
        isEnd: !1,
        translate: 0,
        previousTranslate: 0,
        progress: 0,
        velocity: 0,
        animating: !1,
        allowSlideNext: a.params.allowSlideNext,
        allowSlidePrev: a.params.allowSlidePrev,
        touchEvents: function () {
          var e = ["touchstart", "touchmove", "touchend", "touchcancel"],
              t = ["pointerdown", "pointermove", "pointerup"];
          return a.touchEventsTouch = {
            start: e[0],
            move: e[1],
            end: e[2],
            cancel: e[3]
          }, a.touchEventsDesktop = {
            start: t[0],
            move: t[1],
            end: t[2]
          }, a.support.touch || !a.params.simulateTouch ? a.touchEventsTouch : a.touchEventsDesktop;
        }(),
        touchEventsData: {
          isTouched: void 0,
          isMoved: void 0,
          allowTouchCallbacks: void 0,
          touchStartTime: void 0,
          isScrolling: void 0,
          currentTranslate: void 0,
          startTranslate: void 0,
          allowThresholdMove: void 0,
          focusableElements: a.params.focusableElements,
          lastClickTime: u(),
          clickTimeout: void 0,
          velocities: [],
          allowMomentumBounce: void 0,
          isTouchEvent: void 0,
          startMoving: void 0
        },
        allowClick: !0,
        allowTouchMove: a.params.allowTouchMove,
        touches: {
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          diff: 0
        },
        imagesToLoad: [],
        imagesLoaded: 0
      }), a.emit("_swiper"), a.params.init && a.init(), a;
    }

    _createClass(H, [{
      key: "enable",
      value: function enable() {
        var e = this;
        e.enabled || (e.enabled = !0, e.params.grabCursor && e.setGrabCursor(), e.emit("enable"));
      }
    }, {
      key: "disable",
      value: function disable() {
        var e = this;
        e.enabled && (e.enabled = !1, e.params.grabCursor && e.unsetGrabCursor(), e.emit("disable"));
      }
    }, {
      key: "setProgress",
      value: function setProgress(e, t) {
        var s = this;
        e = Math.min(Math.max(e, 0), 1);
        var a = s.minTranslate(),
            i = (s.maxTranslate() - a) * e + a;
        s.translateTo(i, void 0 === t ? 0 : t), s.updateActiveIndex(), s.updateSlidesClasses();
      }
    }, {
      key: "emitContainerClasses",
      value: function emitContainerClasses() {
        var e = this;
        if (!e.params._emitClasses || !e.el) return;
        var t = e.el.className.split(" ").filter(function (t) {
          return 0 === t.indexOf("swiper") || 0 === t.indexOf(e.params.containerModifierClass);
        });
        e.emit("_containerClasses", t.join(" "));
      }
    }, {
      key: "getSlideClasses",
      value: function getSlideClasses(e) {
        var t = this;
        return e.className.split(" ").filter(function (e) {
          return 0 === e.indexOf("swiper-slide") || 0 === e.indexOf(t.params.slideClass);
        }).join(" ");
      }
    }, {
      key: "emitSlidesClasses",
      value: function emitSlidesClasses() {
        var e = this;
        if (!e.params._emitClasses || !e.el) return;
        var t = [];
        e.slides.each(function (s) {
          var a = e.getSlideClasses(s);
          t.push({
            slideEl: s,
            classNames: a
          }), e.emit("_slideClass", s, a);
        }), e.emit("_slideClasses", t);
      }
    }, {
      key: "slidesPerViewDynamic",
      value: function slidesPerViewDynamic() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "current";
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : !1;
        var s = this.params,
            a = this.slides,
            i = this.slidesGrid,
            r = this.slidesSizesGrid,
            n = this.size,
            l = this.activeIndex;
        var o = 1;

        if (s.centeredSlides) {
          var _e48,
              _t26 = a[l].swiperSlideSize;

          for (var _s27 = l + 1; _s27 < a.length; _s27 += 1) {
            a[_s27] && !_e48 && (_t26 += a[_s27].swiperSlideSize, o += 1, _t26 > n && (_e48 = !0));
          }

          for (var _s28 = l - 1; _s28 >= 0; _s28 -= 1) {
            a[_s28] && !_e48 && (_t26 += a[_s28].swiperSlideSize, o += 1, _t26 > n && (_e48 = !0));
          }
        } else if ("current" === e) for (var _e49 = l + 1; _e49 < a.length; _e49 += 1) {
          (t ? i[_e49] + r[_e49] - i[l] < n : i[_e49] - i[l] < n) && (o += 1);
        } else for (var _e50 = l - 1; _e50 >= 0; _e50 -= 1) {
          i[l] - i[_e50] < n && (o += 1);
        }

        return o;
      }
    }, {
      key: "update",
      value: function update() {
        var e = this;
        if (!e || e.destroyed) return;
        var t = e.snapGrid,
            s = e.params;

        function a() {
          var t = e.rtlTranslate ? -1 * e.translate : e.translate,
              s = Math.min(Math.max(t, e.maxTranslate()), e.minTranslate());
          e.setTranslate(s), e.updateActiveIndex(), e.updateSlidesClasses();
        }

        var i;
        s.breakpoints && e.setBreakpoint(), e.updateSize(), e.updateSlides(), e.updateProgress(), e.updateSlidesClasses(), e.params.freeMode && e.params.freeMode.enabled ? (a(), e.params.autoHeight && e.updateAutoHeight()) : (i = ("auto" === e.params.slidesPerView || e.params.slidesPerView > 1) && e.isEnd && !e.params.centeredSlides ? e.slideTo(e.slides.length - 1, 0, !1, !0) : e.slideTo(e.activeIndex, 0, !1, !0), i || a()), s.watchOverflow && t !== e.snapGrid && e.checkOverflow(), e.emit("update");
      }
    }, {
      key: "changeDirection",
      value: function changeDirection(e) {
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : !0;
        var s = this,
            a = s.params.direction;
        return e || (e = "horizontal" === a ? "vertical" : "horizontal"), e === a || "horizontal" !== e && "vertical" !== e || (s.$el.removeClass("".concat(s.params.containerModifierClass).concat(a)).addClass("".concat(s.params.containerModifierClass).concat(e)), s.emitContainerClasses(), s.params.direction = e, s.slides.each(function (t) {
          "vertical" === e ? t.style.width = "" : t.style.height = "";
        }), s.emit("changeDirection"), t && s.update()), s;
      }
    }, {
      key: "mount",
      value: function mount(e) {
        var t = this;
        if (t.mounted) return !0;
        var s = d(e || t.params.el);
        if (!(e = s[0])) return !1;
        e.swiper = t;

        var i = function i() {
          return ".".concat((t.params.wrapperClass || "").trim().split(" ").join("."));
        };

        var r = function () {
          if (e && e.shadowRoot && e.shadowRoot.querySelector) {
            var _t27 = d(e.shadowRoot.querySelector(i()));

            return _t27.children = function (e) {
              return s.children(e);
            }, _t27;
          }

          return s.children(i());
        }();

        if (0 === r.length && t.params.createElements) {
          var _e51 = a().createElement("div");

          r = d(_e51), _e51.className = t.params.wrapperClass, s.append(_e51), s.children(".".concat(t.params.slideClass)).each(function (e) {
            r.append(e);
          });
        }

        return Object.assign(t, {
          $el: s,
          el: e,
          $wrapperEl: r,
          wrapperEl: r[0],
          mounted: !0,
          rtl: "rtl" === e.dir.toLowerCase() || "rtl" === s.css("direction"),
          rtlTranslate: "horizontal" === t.params.direction && ("rtl" === e.dir.toLowerCase() || "rtl" === s.css("direction")),
          wrongRTL: "-webkit-box" === r.css("display")
        }), !0;
      }
    }, {
      key: "init",
      value: function init(e) {
        var t = this;
        if (t.initialized) return t;
        return !1 === t.mount(e) || (t.emit("beforeInit"), t.params.breakpoints && t.setBreakpoint(), t.addClasses(), t.params.loop && t.loopCreate(), t.updateSize(), t.updateSlides(), t.params.watchOverflow && t.checkOverflow(), t.params.grabCursor && t.enabled && t.setGrabCursor(), t.params.preloadImages && t.preloadImages(), t.params.loop ? t.slideTo(t.params.initialSlide + t.loopedSlides, 0, t.params.runCallbacksOnInit, !1, !0) : t.slideTo(t.params.initialSlide, 0, t.params.runCallbacksOnInit, !1, !0), t.attachEvents(), t.initialized = !0, t.emit("init"), t.emit("afterInit")), t;
      }
    }, {
      key: "destroy",
      value: function destroy() {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : !0;
        var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : !0;
        var s = this,
            a = s.params,
            i = s.$el,
            r = s.$wrapperEl,
            n = s.slides;
        return void 0 === s.params || s.destroyed || (s.emit("beforeDestroy"), s.initialized = !1, s.detachEvents(), a.loop && s.loopDestroy(), t && (s.removeClasses(), i.removeAttr("style"), r.removeAttr("style"), n && n.length && n.removeClass([a.slideVisibleClass, a.slideActiveClass, a.slideNextClass, a.slidePrevClass].join(" ")).removeAttr("style").removeAttr("data-swiper-slide-index")), s.emit("destroy"), Object.keys(s.eventsListeners).forEach(function (e) {
          s.off(e);
        }), !1 !== e && (s.$el[0].swiper = null, function (e) {
          var t = e;
          Object.keys(t).forEach(function (e) {
            try {
              t[e] = null;
            } catch (e) {}

            try {
              delete t[e];
            } catch (e) {}
          });
        }(s)), s.destroyed = !0), null;
      }
    }], [{
      key: "extendDefaults",
      value: function extendDefaults(e) {
        f(X, e);
      }
    }, {
      key: "extendedDefaults",
      get: function get() {
        return X;
      }
    }, {
      key: "defaults",
      get: function get() {
        return G;
      }
    }, {
      key: "installModule",
      value: function installModule(e) {
        H.prototype.__modules__ || (H.prototype.__modules__ = []);
        var t = H.prototype.__modules__;
        "function" == typeof e && t.indexOf(e) < 0 && t.push(e);
      }
    }, {
      key: "use",
      value: function use(e) {
        return Array.isArray(e) ? (e.forEach(function (e) {
          return H.installModule(e);
        }), H) : (H.installModule(e), H);
      }
    }]);

    return H;
  }();

  function Y(e, t, s, i) {
    var r = a();
    return e.params.createElements && Object.keys(i).forEach(function (a) {
      if (!s[a] && !0 === s.auto) {
        var _n7 = e.$el.children(".".concat(i[a]))[0];
        _n7 || (_n7 = r.createElement("div"), _n7.className = i[a], e.$el.append(_n7)), s[a] = _n7, t[a] = _n7;
      }
    }), s;
  }

  function W() {
    var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return ".".concat(e.trim().replace(/([\.:!\/])/g, "\\$1").replace(/ /g, "."));
  }

  function R(e) {
    var t = this,
        s = t.$wrapperEl,
        a = t.params;
    if (a.loop && t.loopDestroy(), "object" == _typeof(e) && "length" in e) for (var _t28 = 0; _t28 < e.length; _t28 += 1) {
      e[_t28] && s.append(e[_t28]);
    } else s.append(e);
    a.loop && t.loopCreate(), a.observer || t.update();
  }

  function j(e) {
    var t = this,
        s = t.params,
        a = t.$wrapperEl,
        i = t.activeIndex;
    s.loop && t.loopDestroy();
    var r = i + 1;

    if ("object" == _typeof(e) && "length" in e) {
      for (var _t29 = 0; _t29 < e.length; _t29 += 1) {
        e[_t29] && a.prepend(e[_t29]);
      }

      r = i + e.length;
    } else a.prepend(e);

    s.loop && t.loopCreate(), s.observer || t.update(), t.slideTo(r, 0, !1);
  }

  function _(e, t) {
    var s = this,
        a = s.$wrapperEl,
        i = s.params,
        r = s.activeIndex;
    var n = r;
    i.loop && (n -= s.loopedSlides, s.loopDestroy(), s.slides = a.children(".".concat(i.slideClass)));
    var l = s.slides.length;
    if (e <= 0) return void s.prependSlide(t);
    if (e >= l) return void s.appendSlide(t);
    var o = n > e ? n + 1 : n;
    var d = [];

    for (var _t30 = l - 1; _t30 >= e; _t30 -= 1) {
      var _e52 = s.slides.eq(_t30);

      _e52.remove(), d.unshift(_e52);
    }

    if ("object" == _typeof(t) && "length" in t) {
      for (var _e53 = 0; _e53 < t.length; _e53 += 1) {
        t[_e53] && a.append(t[_e53]);
      }

      o = n > e ? n + t.length : n;
    } else a.append(t);

    for (var _e54 = 0; _e54 < d.length; _e54 += 1) {
      a.append(d[_e54]);
    }

    i.loop && s.loopCreate(), i.observer || s.update(), i.loop ? s.slideTo(o + s.loopedSlides, 0, !1) : s.slideTo(o, 0, !1);
  }

  function V(e) {
    var t = this,
        s = t.params,
        a = t.$wrapperEl,
        i = t.activeIndex;
    var r = i;
    s.loop && (r -= t.loopedSlides, t.loopDestroy(), t.slides = a.children(".".concat(s.slideClass)));
    var n,
        l = r;

    if ("object" == _typeof(e) && "length" in e) {
      for (var _s29 = 0; _s29 < e.length; _s29 += 1) {
        n = e[_s29], t.slides[n] && t.slides.eq(n).remove(), n < l && (l -= 1);
      }

      l = Math.max(l, 0);
    } else n = e, t.slides[n] && t.slides.eq(n).remove(), n < l && (l -= 1), l = Math.max(l, 0);

    s.loop && t.loopCreate(), s.observer || t.update(), s.loop ? t.slideTo(l + t.loopedSlides, 0, !1) : t.slideTo(l, 0, !1);
  }

  function q() {
    var e = this,
        t = [];

    for (var _s30 = 0; _s30 < e.slides.length; _s30 += 1) {
      t.push(_s30);
    }

    e.removeSlide(t);
  }

  function F(e) {
    var t = e.effect,
        s = e.swiper,
        a = e.on,
        i = e.setTranslate,
        r = e.setTransition,
        n = e.overwriteParams,
        l = e.perspective;
    a("beforeInit", function () {
      if (s.params.effect !== t) return;
      s.classNames.push("".concat(s.params.containerModifierClass).concat(t)), l && l() && s.classNames.push("".concat(s.params.containerModifierClass, "3d"));
      var e = n ? n() : {};
      Object.assign(s.params, e), Object.assign(s.originalParams, e);
    }), a("setTranslate", function () {
      s.params.effect === t && i();
    }), a("setTransition", function (e, a) {
      s.params.effect === t && r(a);
    });
  }

  function U(e, t) {
    return e.transformEl ? t.find(e.transformEl).css({
      "backface-visibility": "hidden",
      "-webkit-backface-visibility": "hidden"
    }) : t;
  }

  function K(_ref4) {
    var e = _ref4.swiper,
        t = _ref4.duration,
        s = _ref4.transformEl,
        a = _ref4.allSlides;
    var i = e.slides,
        r = e.activeIndex,
        n = e.$wrapperEl;

    if (e.params.virtualTranslate && 0 !== t) {
      var _t31,
          _l5 = !1;

      _t31 = a ? s ? i.find(s) : i : s ? i.eq(r).find(s) : i.eq(r), _t31.transitionEnd(function () {
        if (_l5) return;
        if (!e || e.destroyed) return;
        _l5 = !0, e.animating = !1;
        var t = ["webkitTransitionEnd", "transitionend"];

        for (var _e55 = 0; _e55 < t.length; _e55 += 1) {
          n.trigger(t[_e55]);
        }
      });
    }
  }

  function Z(e, t, s) {
    var a = "swiper-slide-shadow" + (s ? "-".concat(s) : ""),
        i = e.transformEl ? t.find(e.transformEl) : t;
    var r = i.children(".".concat(a));
    return r.length || (r = d("<div class=\"swiper-slide-shadow".concat(s ? "-".concat(s) : "", "\"></div>")), i.append(r)), r;
  }

  Object.keys(B).forEach(function (e) {
    Object.keys(B[e]).forEach(function (t) {
      H.prototype[t] = B[e][t];
    });
  }), H.use([function (_ref5) {
    var e = _ref5.swiper,
        t = _ref5.on,
        s = _ref5.emit;
    var a = r();
    var i = null;

    var n = function n() {
      e && !e.destroyed && e.initialized && (s("beforeResize"), s("resize"));
    },
        l = function l() {
      e && !e.destroyed && e.initialized && s("orientationchange");
    };

    t("init", function () {
      e.params.resizeObserver && void 0 !== a.ResizeObserver ? e && !e.destroyed && e.initialized && (i = new ResizeObserver(function (t) {
        var s = e.width,
            a = e.height;
        var i = s,
            r = a;
        t.forEach(function (_ref6) {
          var t = _ref6.contentBoxSize,
              s = _ref6.contentRect,
              a = _ref6.target;
          a && a !== e.el || (i = s ? s.width : (t[0] || t).inlineSize, r = s ? s.height : (t[0] || t).blockSize);
        }), i === s && r === a || n();
      }), i.observe(e.el)) : (a.addEventListener("resize", n), a.addEventListener("orientationchange", l));
    }), t("destroy", function () {
      i && i.unobserve && e.el && (i.unobserve(e.el), i = null), a.removeEventListener("resize", n), a.removeEventListener("orientationchange", l);
    });
  }, function (_ref7) {
    var e = _ref7.swiper,
        t = _ref7.extendParams,
        s = _ref7.on,
        a = _ref7.emit;

    var i = [],
        n = r(),
        l = function l(e) {
      var t = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var s = new (n.MutationObserver || n.WebkitMutationObserver)(function (e) {
        if (1 === e.length) return void a("observerUpdate", e[0]);

        var t = function t() {
          a("observerUpdate", e[0]);
        };

        n.requestAnimationFrame ? n.requestAnimationFrame(t) : n.setTimeout(t, 0);
      });
      s.observe(e, {
        attributes: void 0 === t.attributes || t.attributes,
        childList: void 0 === t.childList || t.childList,
        characterData: void 0 === t.characterData || t.characterData
      }), i.push(s);
    };

    t({
      observer: !1,
      observeParents: !1,
      observeSlideChildren: !1
    }), s("init", function () {
      if (e.params.observer) {
        if (e.params.observeParents) {
          var _t32 = e.$el.parents();

          for (var _e56 = 0; _e56 < _t32.length; _e56 += 1) {
            l(_t32[_e56]);
          }
        }

        l(e.$el[0], {
          childList: e.params.observeSlideChildren
        }), l(e.$wrapperEl[0], {
          attributes: !1
        });
      }
    }), s("destroy", function () {
      i.forEach(function (e) {
        e.disconnect();
      }), i.splice(0, i.length);
    });
  }]);
  var J = [function (_ref8) {
    var e = _ref8.swiper,
        t = _ref8.extendParams,
        s = _ref8.on;

    function a(t, s) {
      var a = e.params.virtual;
      if (a.cache && e.virtual.cache[s]) return e.virtual.cache[s];
      var i = a.renderSlide ? d(a.renderSlide.call(e, t, s)) : d("<div class=\"".concat(e.params.slideClass, "\" data-swiper-slide-index=\"").concat(s, "\">").concat(t, "</div>"));
      return i.attr("data-swiper-slide-index") || i.attr("data-swiper-slide-index", s), a.cache && (e.virtual.cache[s] = i), i;
    }

    function i(t) {
      var _e$params = e.params,
          s = _e$params.slidesPerView,
          i = _e$params.slidesPerGroup,
          r = _e$params.centeredSlides,
          _e$params$virtual = e.params.virtual,
          n = _e$params$virtual.addSlidesBefore,
          l = _e$params$virtual.addSlidesAfter,
          _e$virtual = e.virtual,
          o = _e$virtual.from,
          d = _e$virtual.to,
          c = _e$virtual.slides,
          p = _e$virtual.slidesGrid,
          u = _e$virtual.offset;
      e.updateActiveIndex();
      var h = e.activeIndex || 0;
      var m, f, g;
      m = e.rtlTranslate ? "right" : e.isHorizontal() ? "left" : "top", r ? (f = Math.floor(s / 2) + i + l, g = Math.floor(s / 2) + i + n) : (f = s + (i - 1) + l, g = i + n);
      var v = Math.max((h || 0) - g, 0),
          w = Math.min((h || 0) + f, c.length - 1),
          b = (e.slidesGrid[v] || 0) - (e.slidesGrid[0] || 0);

      function x() {
        e.updateSlides(), e.updateProgress(), e.updateSlidesClasses(), e.lazy && e.params.lazy.enabled && e.lazy.load();
      }

      if (Object.assign(e.virtual, {
        from: v,
        to: w,
        offset: b,
        slidesGrid: e.slidesGrid
      }), o === v && d === w && !t) return e.slidesGrid !== p && b !== u && e.slides.css(m, "".concat(b, "px")), void e.updateProgress();
      if (e.params.virtual.renderExternal) return e.params.virtual.renderExternal.call(e, {
        offset: b,
        from: v,
        to: w,
        slides: function () {
          var e = [];

          for (var _t33 = v; _t33 <= w; _t33 += 1) {
            e.push(c[_t33]);
          }

          return e;
        }()
      }), void (e.params.virtual.renderExternalUpdate && x());
      var y = [],
          E = [];
      if (t) e.$wrapperEl.find(".".concat(e.params.slideClass)).remove();else for (var _t34 = o; _t34 <= d; _t34 += 1) {
        (_t34 < v || _t34 > w) && e.$wrapperEl.find(".".concat(e.params.slideClass, "[data-swiper-slide-index=\"").concat(_t34, "\"]")).remove();
      }

      for (var _e57 = 0; _e57 < c.length; _e57 += 1) {
        _e57 >= v && _e57 <= w && (void 0 === d || t ? E.push(_e57) : (_e57 > d && E.push(_e57), _e57 < o && y.push(_e57)));
      }

      E.forEach(function (t) {
        e.$wrapperEl.append(a(c[t], t));
      }), y.sort(function (e, t) {
        return t - e;
      }).forEach(function (t) {
        e.$wrapperEl.prepend(a(c[t], t));
      }), e.$wrapperEl.children(".swiper-slide").css(m, "".concat(b, "px")), x();
    }

    t({
      virtual: {
        enabled: !1,
        slides: [],
        cache: !0,
        renderSlide: null,
        renderExternal: null,
        renderExternalUpdate: !0,
        addSlidesBefore: 0,
        addSlidesAfter: 0
      }
    }), e.virtual = {
      cache: {},
      from: void 0,
      to: void 0,
      slides: [],
      offset: 0,
      slidesGrid: []
    }, s("beforeInit", function () {
      e.params.virtual.enabled && (e.virtual.slides = e.params.virtual.slides, e.classNames.push("".concat(e.params.containerModifierClass, "virtual")), e.params.watchSlidesProgress = !0, e.originalParams.watchSlidesProgress = !0, e.params.initialSlide || i());
    }), s("setTranslate", function () {
      e.params.virtual.enabled && i();
    }), s("init update resize", function () {
      e.params.virtual.enabled && e.params.cssMode && g(e.wrapperEl, "--swiper-virtual-size", "".concat(e.virtualSize, "px"));
    }), Object.assign(e.virtual, {
      appendSlide: function appendSlide(t) {
        if ("object" == _typeof(t) && "length" in t) for (var _s31 = 0; _s31 < t.length; _s31 += 1) {
          t[_s31] && e.virtual.slides.push(t[_s31]);
        } else e.virtual.slides.push(t);
        i(!0);
      },
      prependSlide: function prependSlide(t) {
        var s = e.activeIndex;
        var a = s + 1,
            r = 1;

        if (Array.isArray(t)) {
          for (var _s32 = 0; _s32 < t.length; _s32 += 1) {
            t[_s32] && e.virtual.slides.unshift(t[_s32]);
          }

          a = s + t.length, r = t.length;
        } else e.virtual.slides.unshift(t);

        if (e.params.virtual.cache) {
          var _t35 = e.virtual.cache,
              _s33 = {};
          Object.keys(_t35).forEach(function (e) {
            var a = _t35[e],
                i = a.attr("data-swiper-slide-index");
            i && a.attr("data-swiper-slide-index", parseInt(i, 10) + 1), _s33[parseInt(e, 10) + r] = a;
          }), e.virtual.cache = _s33;
        }

        i(!0), e.slideTo(a, 0);
      },
      removeSlide: function removeSlide(t) {
        if (null == t) return;
        var s = e.activeIndex;
        if (Array.isArray(t)) for (var _a16 = t.length - 1; _a16 >= 0; _a16 -= 1) {
          e.virtual.slides.splice(t[_a16], 1), e.params.virtual.cache && delete e.virtual.cache[t[_a16]], t[_a16] < s && (s -= 1), s = Math.max(s, 0);
        } else e.virtual.slides.splice(t, 1), e.params.virtual.cache && delete e.virtual.cache[t], t < s && (s -= 1), s = Math.max(s, 0);
        i(!0), e.slideTo(s, 0);
      },
      removeAllSlides: function removeAllSlides() {
        e.virtual.slides = [], e.params.virtual.cache && (e.virtual.cache = {}), i(!0), e.slideTo(0, 0);
      },
      update: i
    });
  }, function (_ref9) {
    var e = _ref9.swiper,
        t = _ref9.extendParams,
        s = _ref9.on,
        i = _ref9.emit;
    var n = a(),
        l = r();

    function o(t) {
      if (!e.enabled) return;
      var s = e.rtlTranslate;
      var a = t;
      a.originalEvent && (a = a.originalEvent);
      var r = a.keyCode || a.charCode,
          o = e.params.keyboard.pageUpDown,
          d = o && 33 === r,
          c = o && 34 === r,
          p = 37 === r,
          u = 39 === r,
          h = 38 === r,
          m = 40 === r;
      if (!e.allowSlideNext && (e.isHorizontal() && u || e.isVertical() && m || c)) return !1;
      if (!e.allowSlidePrev && (e.isHorizontal() && p || e.isVertical() && h || d)) return !1;

      if (!(a.shiftKey || a.altKey || a.ctrlKey || a.metaKey || n.activeElement && n.activeElement.nodeName && ("input" === n.activeElement.nodeName.toLowerCase() || "textarea" === n.activeElement.nodeName.toLowerCase()))) {
        if (e.params.keyboard.onlyInViewport && (d || c || p || u || h || m)) {
          var _t36 = !1;

          if (e.$el.parents(".".concat(e.params.slideClass)).length > 0 && 0 === e.$el.parents(".".concat(e.params.slideActiveClass)).length) return;

          var _a17 = e.$el,
              _i10 = _a17[0].clientWidth,
              _r7 = _a17[0].clientHeight,
              _n8 = l.innerWidth,
              _o5 = l.innerHeight,
              _d4 = e.$el.offset();

          s && (_d4.left -= e.$el[0].scrollLeft);
          var _c3 = [[_d4.left, _d4.top], [_d4.left + _i10, _d4.top], [_d4.left, _d4.top + _r7], [_d4.left + _i10, _d4.top + _r7]];

          for (var _e58 = 0; _e58 < _c3.length; _e58 += 1) {
            var _s34 = _c3[_e58];

            if (_s34[0] >= 0 && _s34[0] <= _n8 && _s34[1] >= 0 && _s34[1] <= _o5) {
              if (0 === _s34[0] && 0 === _s34[1]) continue;
              _t36 = !0;
            }
          }

          if (!_t36) return;
        }

        e.isHorizontal() ? ((d || c || p || u) && (a.preventDefault ? a.preventDefault() : a.returnValue = !1), ((c || u) && !s || (d || p) && s) && e.slideNext(), ((d || p) && !s || (c || u) && s) && e.slidePrev()) : ((d || c || h || m) && (a.preventDefault ? a.preventDefault() : a.returnValue = !1), (c || m) && e.slideNext(), (d || h) && e.slidePrev()), i("keyPress", r);
      }
    }

    function c() {
      e.keyboard.enabled || (d(n).on("keydown", o), e.keyboard.enabled = !0);
    }

    function p() {
      e.keyboard.enabled && (d(n).off("keydown", o), e.keyboard.enabled = !1);
    }

    e.keyboard = {
      enabled: !1
    }, t({
      keyboard: {
        enabled: !1,
        onlyInViewport: !0,
        pageUpDown: !0
      }
    }), s("init", function () {
      e.params.keyboard.enabled && c();
    }), s("destroy", function () {
      e.keyboard.enabled && p();
    }), Object.assign(e.keyboard, {
      enable: c,
      disable: p
    });
  }, function (_ref10) {
    var e = _ref10.swiper,
        t = _ref10.extendParams,
        s = _ref10.on,
        a = _ref10.emit;
    var i = r();
    var n;
    t({
      mousewheel: {
        enabled: !1,
        releaseOnEdges: !1,
        invert: !1,
        forceToAxis: !1,
        sensitivity: 1,
        eventsTarget: "container",
        thresholdDelta: null,
        thresholdTime: null
      }
    }), e.mousewheel = {
      enabled: !1
    };
    var l,
        o = u();
    var c = [];

    function h() {
      e.enabled && (e.mouseEntered = !0);
    }

    function m() {
      e.enabled && (e.mouseEntered = !1);
    }

    function f(t) {
      return !(e.params.mousewheel.thresholdDelta && t.delta < e.params.mousewheel.thresholdDelta) && !(e.params.mousewheel.thresholdTime && u() - o < e.params.mousewheel.thresholdTime) && (t.delta >= 6 && u() - o < 60 || (t.direction < 0 ? e.isEnd && !e.params.loop || e.animating || (e.slideNext(), a("scroll", t.raw)) : e.isBeginning && !e.params.loop || e.animating || (e.slidePrev(), a("scroll", t.raw)), o = new i.Date().getTime(), !1));
    }

    function g(t) {
      var s = t,
          i = !0;
      if (!e.enabled) return;
      var r = e.params.mousewheel;
      e.params.cssMode && s.preventDefault();
      var o = e.$el;
      if ("container" !== e.params.mousewheel.eventsTarget && (o = d(e.params.mousewheel.eventsTarget)), !e.mouseEntered && !o[0].contains(s.target) && !r.releaseOnEdges) return !0;
      s.originalEvent && (s = s.originalEvent);
      var h = 0;

      var m = e.rtlTranslate ? -1 : 1,
          g = function (e) {
        var t = 0,
            s = 0,
            a = 0,
            i = 0;
        return "detail" in e && (s = e.detail), "wheelDelta" in e && (s = -e.wheelDelta / 120), "wheelDeltaY" in e && (s = -e.wheelDeltaY / 120), "wheelDeltaX" in e && (t = -e.wheelDeltaX / 120), "axis" in e && e.axis === e.HORIZONTAL_AXIS && (t = s, s = 0), a = 10 * t, i = 10 * s, "deltaY" in e && (i = e.deltaY), "deltaX" in e && (a = e.deltaX), e.shiftKey && !a && (a = i, i = 0), (a || i) && e.deltaMode && (1 === e.deltaMode ? (a *= 40, i *= 40) : (a *= 800, i *= 800)), a && !t && (t = a < 1 ? -1 : 1), i && !s && (s = i < 1 ? -1 : 1), {
          spinX: t,
          spinY: s,
          pixelX: a,
          pixelY: i
        };
      }(s);

      if (r.forceToAxis) {
        if (e.isHorizontal()) {
          if (!(Math.abs(g.pixelX) > Math.abs(g.pixelY))) return !0;
          h = -g.pixelX * m;
        } else {
          if (!(Math.abs(g.pixelY) > Math.abs(g.pixelX))) return !0;
          h = -g.pixelY;
        }
      } else h = Math.abs(g.pixelX) > Math.abs(g.pixelY) ? -g.pixelX * m : -g.pixelY;
      if (0 === h) return !0;
      r.invert && (h = -h);
      var v = e.getTranslate() + h * r.sensitivity;

      if (v >= e.minTranslate() && (v = e.minTranslate()), v <= e.maxTranslate() && (v = e.maxTranslate()), i = !!e.params.loop || !(v === e.minTranslate() || v === e.maxTranslate()), i && e.params.nested && s.stopPropagation(), e.params.freeMode && e.params.freeMode.enabled) {
        var _t37 = {
          time: u(),
          delta: Math.abs(h),
          direction: Math.sign(h)
        },
            _i11 = l && _t37.time < l.time + 500 && _t37.delta <= l.delta && _t37.direction === l.direction;

        if (!_i11) {
          l = void 0, e.params.loop && e.loopFix();

          var _o6 = e.getTranslate() + h * r.sensitivity;

          var _d5 = e.isBeginning,
              _u = e.isEnd;

          if (_o6 >= e.minTranslate() && (_o6 = e.minTranslate()), _o6 <= e.maxTranslate() && (_o6 = e.maxTranslate()), e.setTransition(0), e.setTranslate(_o6), e.updateProgress(), e.updateActiveIndex(), e.updateSlidesClasses(), (!_d5 && e.isBeginning || !_u && e.isEnd) && e.updateSlidesClasses(), e.params.freeMode.sticky) {
            clearTimeout(n), n = void 0, c.length >= 15 && c.shift();

            var _s35 = c.length ? c[c.length - 1] : void 0,
                _a18 = c[0];

            if (c.push(_t37), _s35 && (_t37.delta > _s35.delta || _t37.direction !== _s35.direction)) c.splice(0);else if (c.length >= 15 && _t37.time - _a18.time < 500 && _a18.delta - _t37.delta >= 1 && _t37.delta <= 6) {
              var _s36 = h > 0 ? .8 : .2;

              l = _t37, c.splice(0), n = p(function () {
                e.slideToClosest(e.params.speed, !0, void 0, _s36);
              }, 0);
            }
            n || (n = p(function () {
              l = _t37, c.splice(0), e.slideToClosest(e.params.speed, !0, void 0, .5);
            }, 500));
          }

          if (_i11 || a("scroll", s), e.params.autoplay && e.params.autoplayDisableOnInteraction && e.autoplay.stop(), _o6 === e.minTranslate() || _o6 === e.maxTranslate()) return !0;
        }
      } else {
        var _s37 = {
          time: u(),
          delta: Math.abs(h),
          direction: Math.sign(h),
          raw: t
        };
        c.length >= 2 && c.shift();

        var _a19 = c.length ? c[c.length - 1] : void 0;

        if (c.push(_s37), _a19 ? (_s37.direction !== _a19.direction || _s37.delta > _a19.delta || _s37.time > _a19.time + 150) && f(_s37) : f(_s37), function (t) {
          var s = e.params.mousewheel;

          if (t.direction < 0) {
            if (e.isEnd && !e.params.loop && s.releaseOnEdges) return !0;
          } else if (e.isBeginning && !e.params.loop && s.releaseOnEdges) return !0;

          return !1;
        }(_s37)) return !0;
      }

      return s.preventDefault ? s.preventDefault() : s.returnValue = !1, !1;
    }

    function v(t) {
      var s = e.$el;
      "container" !== e.params.mousewheel.eventsTarget && (s = d(e.params.mousewheel.eventsTarget)), s[t]("mouseenter", h), s[t]("mouseleave", m), s[t]("wheel", g);
    }

    function w() {
      return e.params.cssMode ? (e.wrapperEl.removeEventListener("wheel", g), !0) : !e.mousewheel.enabled && (v("on"), e.mousewheel.enabled = !0, !0);
    }

    function b() {
      return e.params.cssMode ? (e.wrapperEl.addEventListener(event, g), !0) : !!e.mousewheel.enabled && (v("off"), e.mousewheel.enabled = !1, !0);
    }

    s("init", function () {
      !e.params.mousewheel.enabled && e.params.cssMode && b(), e.params.mousewheel.enabled && w();
    }), s("destroy", function () {
      e.params.cssMode && w(), e.mousewheel.enabled && b();
    }), Object.assign(e.mousewheel, {
      enable: w,
      disable: b
    });
  }, function (_ref11) {
    var e = _ref11.swiper,
        t = _ref11.extendParams,
        s = _ref11.on,
        a = _ref11.emit;

    function i(t) {
      var s;
      return t && (s = d(t), e.params.uniqueNavElements && "string" == typeof t && s.length > 1 && 1 === e.$el.find(t).length && (s = e.$el.find(t))), s;
    }

    function r(t, s) {
      var a = e.params.navigation;
      t && t.length > 0 && (t[s ? "addClass" : "removeClass"](a.disabledClass), t[0] && "BUTTON" === t[0].tagName && (t[0].disabled = s), e.params.watchOverflow && e.enabled && t[e.isLocked ? "addClass" : "removeClass"](a.lockClass));
    }

    function n() {
      if (e.params.loop) return;
      var _e$navigation = e.navigation,
          t = _e$navigation.$nextEl,
          s = _e$navigation.$prevEl;
      r(s, e.isBeginning), r(t, e.isEnd);
    }

    function l(t) {
      t.preventDefault(), e.isBeginning && !e.params.loop || e.slidePrev();
    }

    function o(t) {
      t.preventDefault(), e.isEnd && !e.params.loop || e.slideNext();
    }

    function c() {
      var t = e.params.navigation;
      if (e.params.navigation = Y(e, e.originalParams.navigation, e.params.navigation, {
        nextEl: "swiper-button-next",
        prevEl: "swiper-button-prev"
      }), !t.nextEl && !t.prevEl) return;
      var s = i(t.nextEl),
          a = i(t.prevEl);
      s && s.length > 0 && s.on("click", o), a && a.length > 0 && a.on("click", l), Object.assign(e.navigation, {
        $nextEl: s,
        nextEl: s && s[0],
        $prevEl: a,
        prevEl: a && a[0]
      }), e.enabled || (s && s.addClass(t.lockClass), a && a.addClass(t.lockClass));
    }

    function p() {
      var _e$navigation2 = e.navigation,
          t = _e$navigation2.$nextEl,
          s = _e$navigation2.$prevEl;
      t && t.length && (t.off("click", o), t.removeClass(e.params.navigation.disabledClass)), s && s.length && (s.off("click", l), s.removeClass(e.params.navigation.disabledClass));
    }

    t({
      navigation: {
        nextEl: null,
        prevEl: null,
        hideOnClick: !1,
        disabledClass: "swiper-button-disabled",
        hiddenClass: "swiper-button-hidden",
        lockClass: "swiper-button-lock"
      }
    }), e.navigation = {
      nextEl: null,
      $nextEl: null,
      prevEl: null,
      $prevEl: null
    }, s("init", function () {
      c(), n();
    }), s("toEdge fromEdge lock unlock", function () {
      n();
    }), s("destroy", function () {
      p();
    }), s("enable disable", function () {
      var _e$navigation3 = e.navigation,
          t = _e$navigation3.$nextEl,
          s = _e$navigation3.$prevEl;
      t && t[e.enabled ? "removeClass" : "addClass"](e.params.navigation.lockClass), s && s[e.enabled ? "removeClass" : "addClass"](e.params.navigation.lockClass);
    }), s("click", function (t, s) {
      var _e$navigation4 = e.navigation,
          i = _e$navigation4.$nextEl,
          r = _e$navigation4.$prevEl,
          n = s.target;

      if (e.params.navigation.hideOnClick && !d(n).is(r) && !d(n).is(i)) {
        if (e.pagination && e.params.pagination && e.params.pagination.clickable && (e.pagination.el === n || e.pagination.el.contains(n))) return;

        var _t38;

        i ? _t38 = i.hasClass(e.params.navigation.hiddenClass) : r && (_t38 = r.hasClass(e.params.navigation.hiddenClass)), a(!0 === _t38 ? "navigationShow" : "navigationHide"), i && i.toggleClass(e.params.navigation.hiddenClass), r && r.toggleClass(e.params.navigation.hiddenClass);
      }
    }), Object.assign(e.navigation, {
      update: n,
      init: c,
      destroy: p
    });
  }, function (_ref12) {
    var e = _ref12.swiper,
        t = _ref12.extendParams,
        s = _ref12.on,
        a = _ref12.emit;
    var i = "swiper-pagination";
    var r;
    t({
      pagination: {
        el: null,
        bulletElement: "span",
        clickable: !1,
        hideOnClick: !1,
        renderBullet: null,
        renderProgressbar: null,
        renderFraction: null,
        renderCustom: null,
        progressbarOpposite: !1,
        type: "bullets",
        dynamicBullets: !1,
        dynamicMainBullets: 1,
        formatFractionCurrent: function formatFractionCurrent(e) {
          return e;
        },
        formatFractionTotal: function formatFractionTotal(e) {
          return e;
        },
        bulletClass: "".concat(i, "-bullet"),
        bulletActiveClass: "".concat(i, "-bullet-active"),
        modifierClass: "".concat(i, "-"),
        currentClass: "".concat(i, "-current"),
        totalClass: "".concat(i, "-total"),
        hiddenClass: "".concat(i, "-hidden"),
        progressbarFillClass: "".concat(i, "-progressbar-fill"),
        progressbarOppositeClass: "".concat(i, "-progressbar-opposite"),
        clickableClass: "".concat(i, "-clickable"),
        lockClass: "".concat(i, "-lock"),
        horizontalClass: "".concat(i, "-horizontal"),
        verticalClass: "".concat(i, "-vertical")
      }
    }), e.pagination = {
      el: null,
      $el: null,
      bullets: []
    };
    var n = 0;

    function l() {
      return !e.params.pagination.el || !e.pagination.el || !e.pagination.$el || 0 === e.pagination.$el.length;
    }

    function o(t, s) {
      var a = e.params.pagination.bulletActiveClass;
      t[s]().addClass("".concat(a, "-").concat(s))[s]().addClass("".concat(a, "-").concat(s, "-").concat(s));
    }

    function c() {
      var t = e.rtl,
          s = e.params.pagination;
      if (l()) return;
      var i = e.virtual && e.params.virtual.enabled ? e.virtual.slides.length : e.slides.length,
          c = e.pagination.$el;
      var p;
      var u = e.params.loop ? Math.ceil((i - 2 * e.loopedSlides) / e.params.slidesPerGroup) : e.snapGrid.length;

      if (e.params.loop ? (p = Math.ceil((e.activeIndex - e.loopedSlides) / e.params.slidesPerGroup), p > i - 1 - 2 * e.loopedSlides && (p -= i - 2 * e.loopedSlides), p > u - 1 && (p -= u), p < 0 && "bullets" !== e.params.paginationType && (p = u + p)) : p = void 0 !== e.snapIndex ? e.snapIndex : e.activeIndex || 0, "bullets" === s.type && e.pagination.bullets && e.pagination.bullets.length > 0) {
        var _a20 = e.pagination.bullets;

        var _i12, _l6, _u2;

        if (s.dynamicBullets && (r = _a20.eq(0)[e.isHorizontal() ? "outerWidth" : "outerHeight"](!0), c.css(e.isHorizontal() ? "width" : "height", r * (s.dynamicMainBullets + 4) + "px"), s.dynamicMainBullets > 1 && void 0 !== e.previousIndex && (n += p - e.previousIndex, n > s.dynamicMainBullets - 1 ? n = s.dynamicMainBullets - 1 : n < 0 && (n = 0)), _i12 = p - n, _l6 = _i12 + (Math.min(_a20.length, s.dynamicMainBullets) - 1), _u2 = (_l6 + _i12) / 2), _a20.removeClass(["", "-next", "-next-next", "-prev", "-prev-prev", "-main"].map(function (e) {
          return "".concat(s.bulletActiveClass).concat(e);
        }).join(" ")), c.length > 1) _a20.each(function (e) {
          var t = d(e),
              a = t.index();
          a === p && t.addClass(s.bulletActiveClass), s.dynamicBullets && (a >= _i12 && a <= _l6 && t.addClass("".concat(s.bulletActiveClass, "-main")), a === _i12 && o(t, "prev"), a === _l6 && o(t, "next"));
        });else {
          var _t39 = _a20.eq(p),
              _r8 = _t39.index();

          if (_t39.addClass(s.bulletActiveClass), s.dynamicBullets) {
            var _t40 = _a20.eq(_i12),
                _n9 = _a20.eq(_l6);

            for (var _e59 = _i12; _e59 <= _l6; _e59 += 1) {
              _a20.eq(_e59).addClass("".concat(s.bulletActiveClass, "-main"));
            }

            if (e.params.loop) {
              if (_r8 >= _a20.length - s.dynamicMainBullets) {
                for (var _e60 = s.dynamicMainBullets; _e60 >= 0; _e60 -= 1) {
                  _a20.eq(_a20.length - _e60).addClass("".concat(s.bulletActiveClass, "-main"));
                }

                _a20.eq(_a20.length - s.dynamicMainBullets - 1).addClass("".concat(s.bulletActiveClass, "-prev"));
              } else o(_t40, "prev"), o(_n9, "next");
            } else o(_t40, "prev"), o(_n9, "next");
          }
        }

        if (s.dynamicBullets) {
          var _i13 = Math.min(_a20.length, s.dynamicMainBullets + 4),
              _n10 = (r * _i13 - r) / 2 - _u2 * r,
              _l7 = t ? "right" : "left";

          _a20.css(e.isHorizontal() ? _l7 : "top", "".concat(_n10, "px"));
        }
      }

      if ("fraction" === s.type && (c.find(W(s.currentClass)).text(s.formatFractionCurrent(p + 1)), c.find(W(s.totalClass)).text(s.formatFractionTotal(u))), "progressbar" === s.type) {
        var _t41;

        _t41 = s.progressbarOpposite ? e.isHorizontal() ? "vertical" : "horizontal" : e.isHorizontal() ? "horizontal" : "vertical";

        var _a21 = (p + 1) / u;

        var _i14 = 1,
            _r9 = 1;
        "horizontal" === _t41 ? _i14 = _a21 : _r9 = _a21, c.find(W(s.progressbarFillClass)).transform("translate3d(0,0,0) scaleX(".concat(_i14, ") scaleY(").concat(_r9, ")")).transition(e.params.speed);
      }

      "custom" === s.type && s.renderCustom ? (c.html(s.renderCustom(e, p + 1, u)), a("paginationRender", c[0])) : a("paginationUpdate", c[0]), e.params.watchOverflow && e.enabled && c[e.isLocked ? "addClass" : "removeClass"](s.lockClass);
    }

    function p() {
      var t = e.params.pagination;
      if (l()) return;
      var s = e.virtual && e.params.virtual.enabled ? e.virtual.slides.length : e.slides.length,
          i = e.pagination.$el;
      var r = "";

      if ("bullets" === t.type) {
        var _a22 = e.params.loop ? Math.ceil((s - 2 * e.loopedSlides) / e.params.slidesPerGroup) : e.snapGrid.length;

        e.params.freeMode && e.params.freeMode.enabled && !e.params.loop && _a22 > s && (_a22 = s);

        for (var _s38 = 0; _s38 < _a22; _s38 += 1) {
          t.renderBullet ? r += t.renderBullet.call(e, _s38, t.bulletClass) : r += "<".concat(t.bulletElement, " class=\"").concat(t.bulletClass, "\"></").concat(t.bulletElement, ">");
        }

        i.html(r), e.pagination.bullets = i.find(W(t.bulletClass));
      }

      "fraction" === t.type && (r = t.renderFraction ? t.renderFraction.call(e, t.currentClass, t.totalClass) : "<span class=\"".concat(t.currentClass, "\"></span> / <span class=\"").concat(t.totalClass, "\"></span>"), i.html(r)), "progressbar" === t.type && (r = t.renderProgressbar ? t.renderProgressbar.call(e, t.progressbarFillClass) : "<span class=\"".concat(t.progressbarFillClass, "\"></span>"), i.html(r)), "custom" !== t.type && a("paginationRender", e.pagination.$el[0]);
    }

    function u() {
      e.params.pagination = Y(e, e.originalParams.pagination, e.params.pagination, {
        el: "swiper-pagination"
      });
      var t = e.params.pagination;
      if (!t.el) return;
      var s = d(t.el);
      0 !== s.length && (e.params.uniqueNavElements && "string" == typeof t.el && s.length > 1 && (s = e.$el.find(t.el), s.length > 1 && (s = s.filter(function (t) {
        return d(t).parents(".swiper")[0] === e.el;
      }))), "bullets" === t.type && t.clickable && s.addClass(t.clickableClass), s.addClass(t.modifierClass + t.type), s.addClass(t.modifierClass + e.params.direction), "bullets" === t.type && t.dynamicBullets && (s.addClass("".concat(t.modifierClass).concat(t.type, "-dynamic")), n = 0, t.dynamicMainBullets < 1 && (t.dynamicMainBullets = 1)), "progressbar" === t.type && t.progressbarOpposite && s.addClass(t.progressbarOppositeClass), t.clickable && s.on("click", W(t.bulletClass), function (t) {
        t.preventDefault();
        var s = d(this).index() * e.params.slidesPerGroup;
        e.params.loop && (s += e.loopedSlides), e.slideTo(s);
      }), Object.assign(e.pagination, {
        $el: s,
        el: s[0]
      }), e.enabled || s.addClass(t.lockClass));
    }

    function h() {
      var t = e.params.pagination;
      if (l()) return;
      var s = e.pagination.$el;
      s.removeClass(t.hiddenClass), s.removeClass(t.modifierClass + t.type), s.removeClass(t.modifierClass + e.params.direction), e.pagination.bullets && e.pagination.bullets.removeClass && e.pagination.bullets.removeClass(t.bulletActiveClass), t.clickable && s.off("click", W(t.bulletClass));
    }

    s("init", function () {
      u(), p(), c();
    }), s("activeIndexChange", function () {
      (e.params.loop || void 0 === e.snapIndex) && c();
    }), s("snapIndexChange", function () {
      e.params.loop || c();
    }), s("slidesLengthChange", function () {
      e.params.loop && (p(), c());
    }), s("snapGridLengthChange", function () {
      e.params.loop || (p(), c());
    }), s("destroy", function () {
      h();
    }), s("enable disable", function () {
      var t = e.pagination.$el;
      t && t[e.enabled ? "removeClass" : "addClass"](e.params.pagination.lockClass);
    }), s("lock unlock", function () {
      c();
    }), s("click", function (t, s) {
      var i = s.target,
          r = e.pagination.$el;

      if (e.params.pagination.el && e.params.pagination.hideOnClick && r.length > 0 && !d(i).hasClass(e.params.pagination.bulletClass)) {
        if (e.navigation && (e.navigation.nextEl && i === e.navigation.nextEl || e.navigation.prevEl && i === e.navigation.prevEl)) return;

        var _t42 = r.hasClass(e.params.pagination.hiddenClass);

        a(!0 === _t42 ? "paginationShow" : "paginationHide"), r.toggleClass(e.params.pagination.hiddenClass);
      }
    }), Object.assign(e.pagination, {
      render: p,
      update: c,
      init: u,
      destroy: h
    });
  }, function (_ref13) {
    var e = _ref13.swiper,
        t = _ref13.extendParams,
        s = _ref13.on,
        i = _ref13.emit;
    var r = a();
    var n,
        l,
        o,
        c,
        u = !1,
        h = null,
        m = null;

    function f() {
      if (!e.params.scrollbar.el || !e.scrollbar.el) return;
      var t = e.scrollbar,
          s = e.rtlTranslate,
          a = e.progress,
          i = t.$dragEl,
          r = t.$el,
          n = e.params.scrollbar;
      var d = l,
          c = (o - l) * a;
      s ? (c = -c, c > 0 ? (d = l - c, c = 0) : -c + l > o && (d = o + c)) : c < 0 ? (d = l + c, c = 0) : c + l > o && (d = o - c), e.isHorizontal() ? (i.transform("translate3d(".concat(c, "px, 0, 0)")), i[0].style.width = "".concat(d, "px")) : (i.transform("translate3d(0px, ".concat(c, "px, 0)")), i[0].style.height = "".concat(d, "px")), n.hide && (clearTimeout(h), r[0].style.opacity = 1, h = setTimeout(function () {
        r[0].style.opacity = 0, r.transition(400);
      }, 1e3));
    }

    function g() {
      if (!e.params.scrollbar.el || !e.scrollbar.el) return;
      var t = e.scrollbar,
          s = t.$dragEl,
          a = t.$el;
      s[0].style.width = "", s[0].style.height = "", o = e.isHorizontal() ? a[0].offsetWidth : a[0].offsetHeight, c = e.size / (e.virtualSize + e.params.slidesOffsetBefore - (e.params.centeredSlides ? e.snapGrid[0] : 0)), l = "auto" === e.params.scrollbar.dragSize ? o * c : parseInt(e.params.scrollbar.dragSize, 10), e.isHorizontal() ? s[0].style.width = "".concat(l, "px") : s[0].style.height = "".concat(l, "px"), a[0].style.display = c >= 1 ? "none" : "", e.params.scrollbar.hide && (a[0].style.opacity = 0), e.params.watchOverflow && e.enabled && t.$el[e.isLocked ? "addClass" : "removeClass"](e.params.scrollbar.lockClass);
    }

    function v(t) {
      return e.isHorizontal() ? "touchstart" === t.type || "touchmove" === t.type ? t.targetTouches[0].clientX : t.clientX : "touchstart" === t.type || "touchmove" === t.type ? t.targetTouches[0].clientY : t.clientY;
    }

    function w(t) {
      var s = e.scrollbar,
          a = e.rtlTranslate,
          i = s.$el;
      var r;
      r = (v(t) - i.offset()[e.isHorizontal() ? "left" : "top"] - (null !== n ? n : l / 2)) / (o - l), r = Math.max(Math.min(r, 1), 0), a && (r = 1 - r);
      var d = e.minTranslate() + (e.maxTranslate() - e.minTranslate()) * r;
      e.updateProgress(d), e.setTranslate(d), e.updateActiveIndex(), e.updateSlidesClasses();
    }

    function b(t) {
      var s = e.params.scrollbar,
          a = e.scrollbar,
          r = e.$wrapperEl,
          l = a.$el,
          o = a.$dragEl;
      u = !0, n = t.target === o[0] || t.target === o ? v(t) - t.target.getBoundingClientRect()[e.isHorizontal() ? "left" : "top"] : null, t.preventDefault(), t.stopPropagation(), r.transition(100), o.transition(100), w(t), clearTimeout(m), l.transition(0), s.hide && l.css("opacity", 1), e.params.cssMode && e.$wrapperEl.css("scroll-snap-type", "none"), i("scrollbarDragStart", t);
    }

    function x(t) {
      var s = e.scrollbar,
          a = e.$wrapperEl,
          r = s.$el,
          n = s.$dragEl;
      u && (t.preventDefault ? t.preventDefault() : t.returnValue = !1, w(t), a.transition(0), r.transition(0), n.transition(0), i("scrollbarDragMove", t));
    }

    function y(t) {
      var s = e.params.scrollbar,
          a = e.scrollbar,
          r = e.$wrapperEl,
          n = a.$el;
      u && (u = !1, e.params.cssMode && (e.$wrapperEl.css("scroll-snap-type", ""), r.transition("")), s.hide && (clearTimeout(m), m = p(function () {
        n.css("opacity", 0), n.transition(400);
      }, 1e3)), i("scrollbarDragEnd", t), s.snapOnRelease && e.slideToClosest());
    }

    function E(t) {
      var s = e.scrollbar,
          a = e.touchEventsTouch,
          i = e.touchEventsDesktop,
          n = e.params,
          l = e.support,
          o = s.$el[0],
          d = !(!l.passiveListener || !n.passiveListeners) && {
        passive: !1,
        capture: !1
      },
          c = !(!l.passiveListener || !n.passiveListeners) && {
        passive: !0,
        capture: !1
      };
      if (!o) return;
      var p = "on" === t ? "addEventListener" : "removeEventListener";
      l.touch ? (o[p](a.start, b, d), o[p](a.move, x, d), o[p](a.end, y, c)) : (o[p](i.start, b, d), r[p](i.move, x, d), r[p](i.end, y, c));
    }

    function T() {
      var t = e.scrollbar,
          s = e.$el;
      e.params.scrollbar = Y(e, e.originalParams.scrollbar, e.params.scrollbar, {
        el: "swiper-scrollbar"
      });
      var a = e.params.scrollbar;
      if (!a.el) return;
      var i = d(a.el);
      e.params.uniqueNavElements && "string" == typeof a.el && i.length > 1 && 1 === s.find(a.el).length && (i = s.find(a.el));
      var r = i.find(".".concat(e.params.scrollbar.dragClass));
      0 === r.length && (r = d("<div class=\"".concat(e.params.scrollbar.dragClass, "\"></div>")), i.append(r)), Object.assign(t, {
        $el: i,
        el: i[0],
        $dragEl: r,
        dragEl: r[0]
      }), a.draggable && e.params.scrollbar.el && E("on"), i && i[e.enabled ? "removeClass" : "addClass"](e.params.scrollbar.lockClass);
    }

    function C() {
      e.params.scrollbar.el && E("off");
    }

    t({
      scrollbar: {
        el: null,
        dragSize: "auto",
        hide: !1,
        draggable: !1,
        snapOnRelease: !0,
        lockClass: "swiper-scrollbar-lock",
        dragClass: "swiper-scrollbar-drag"
      }
    }), e.scrollbar = {
      el: null,
      dragEl: null,
      $el: null,
      $dragEl: null
    }, s("init", function () {
      T(), g(), f();
    }), s("update resize observerUpdate lock unlock", function () {
      g();
    }), s("setTranslate", function () {
      f();
    }), s("setTransition", function (t, s) {
      !function (t) {
        e.params.scrollbar.el && e.scrollbar.el && e.scrollbar.$dragEl.transition(t);
      }(s);
    }), s("enable disable", function () {
      var t = e.scrollbar.$el;
      t && t[e.enabled ? "removeClass" : "addClass"](e.params.scrollbar.lockClass);
    }), s("destroy", function () {
      C();
    }), Object.assign(e.scrollbar, {
      updateSize: g,
      setTranslate: f,
      init: T,
      destroy: C
    });
  }, function (_ref14) {
    var e = _ref14.swiper,
        t = _ref14.extendParams,
        s = _ref14.on;
    t({
      parallax: {
        enabled: !1
      }
    });

    var a = function a(t, s) {
      var a = e.rtl,
          i = d(t),
          r = a ? -1 : 1,
          n = i.attr("data-swiper-parallax") || "0";
      var l = i.attr("data-swiper-parallax-x"),
          o = i.attr("data-swiper-parallax-y");
      var c = i.attr("data-swiper-parallax-scale"),
          p = i.attr("data-swiper-parallax-opacity");

      if (l || o ? (l = l || "0", o = o || "0") : e.isHorizontal() ? (l = n, o = "0") : (o = n, l = "0"), l = l.indexOf("%") >= 0 ? parseInt(l, 10) * s * r + "%" : l * s * r + "px", o = o.indexOf("%") >= 0 ? parseInt(o, 10) * s + "%" : o * s + "px", null != p) {
        var _e61 = p - (p - 1) * (1 - Math.abs(s));

        i[0].style.opacity = _e61;
      }

      if (null == c) i.transform("translate3d(".concat(l, ", ").concat(o, ", 0px)"));else {
        var _e62 = c - (c - 1) * (1 - Math.abs(s));

        i.transform("translate3d(".concat(l, ", ").concat(o, ", 0px) scale(").concat(_e62, ")"));
      }
    },
        i = function i() {
      var t = e.$el,
          s = e.slides,
          i = e.progress,
          r = e.snapGrid;
      t.children("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y], [data-swiper-parallax-opacity], [data-swiper-parallax-scale]").each(function (e) {
        a(e, i);
      }), s.each(function (t, s) {
        var n = t.progress;
        e.params.slidesPerGroup > 1 && "auto" !== e.params.slidesPerView && (n += Math.ceil(s / 2) - i * (r.length - 1)), n = Math.min(Math.max(n, -1), 1), d(t).find("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y], [data-swiper-parallax-opacity], [data-swiper-parallax-scale]").each(function (e) {
          a(e, n);
        });
      });
    };

    s("beforeInit", function () {
      e.params.parallax.enabled && (e.params.watchSlidesProgress = !0, e.originalParams.watchSlidesProgress = !0);
    }), s("init", function () {
      e.params.parallax.enabled && i();
    }), s("setTranslate", function () {
      e.params.parallax.enabled && i();
    }), s("setTransition", function (t, s) {
      e.params.parallax.enabled && function () {
        var t = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : e.params.speed;
        var s = e.$el;
        s.find("[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y], [data-swiper-parallax-opacity], [data-swiper-parallax-scale]").each(function (e) {
          var s = d(e);
          var a = parseInt(s.attr("data-swiper-parallax-duration"), 10) || t;
          0 === t && (a = 0), s.transition(a);
        });
      }(s);
    });
  }, function (_ref15) {
    var e = _ref15.swiper,
        t = _ref15.extendParams,
        s = _ref15.on,
        a = _ref15.emit;
    var i = r();
    t({
      zoom: {
        enabled: !1,
        maxRatio: 3,
        minRatio: 1,
        toggle: !0,
        containerClass: "swiper-zoom-container",
        zoomedSlideClass: "swiper-slide-zoomed"
      }
    }), e.zoom = {
      enabled: !1
    };
    var n,
        l,
        o,
        c = 1,
        p = !1;
    var u = {
      $slideEl: void 0,
      slideWidth: void 0,
      slideHeight: void 0,
      $imageEl: void 0,
      $imageWrapEl: void 0,
      maxRatio: 3
    },
        m = {
      isTouched: void 0,
      isMoved: void 0,
      currentX: void 0,
      currentY: void 0,
      minX: void 0,
      minY: void 0,
      maxX: void 0,
      maxY: void 0,
      width: void 0,
      height: void 0,
      startX: void 0,
      startY: void 0,
      touchesStart: {},
      touchesCurrent: {}
    },
        f = {
      x: void 0,
      y: void 0,
      prevPositionX: void 0,
      prevPositionY: void 0,
      prevTime: void 0
    };
    var g = 1;

    function v(e) {
      if (e.targetTouches.length < 2) return 1;
      var t = e.targetTouches[0].pageX,
          s = e.targetTouches[0].pageY,
          a = e.targetTouches[1].pageX,
          i = e.targetTouches[1].pageY;
      return Math.sqrt(Math.pow(a - t, 2) + Math.pow(i - s, 2));
    }

    function w(t) {
      var s = e.support,
          a = e.params.zoom;

      if (l = !1, o = !1, !s.gestures) {
        if ("touchstart" !== t.type || "touchstart" === t.type && t.targetTouches.length < 2) return;
        l = !0, u.scaleStart = v(t);
      }

      u.$slideEl && u.$slideEl.length || (u.$slideEl = d(t.target).closest(".".concat(e.params.slideClass)), 0 === u.$slideEl.length && (u.$slideEl = e.slides.eq(e.activeIndex)), u.$imageEl = u.$slideEl.find(".".concat(a.containerClass)).eq(0).find("img, svg, canvas, picture, .swiper-zoom-target"), u.$imageWrapEl = u.$imageEl.parent(".".concat(a.containerClass)), u.maxRatio = u.$imageWrapEl.attr("data-swiper-zoom") || a.maxRatio, 0 !== u.$imageWrapEl.length) ? (u.$imageEl && u.$imageEl.transition(0), p = !0) : u.$imageEl = void 0;
    }

    function b(t) {
      var s = e.support,
          a = e.params.zoom,
          i = e.zoom;

      if (!s.gestures) {
        if ("touchmove" !== t.type || "touchmove" === t.type && t.targetTouches.length < 2) return;
        o = !0, u.scaleMove = v(t);
      }

      u.$imageEl && 0 !== u.$imageEl.length ? (s.gestures ? i.scale = t.scale * c : i.scale = u.scaleMove / u.scaleStart * c, i.scale > u.maxRatio && (i.scale = u.maxRatio - 1 + Math.pow(i.scale - u.maxRatio + 1, .5)), i.scale < a.minRatio && (i.scale = a.minRatio + 1 - Math.pow(a.minRatio - i.scale + 1, .5)), u.$imageEl.transform("translate3d(0,0,0) scale(".concat(i.scale, ")"))) : "gesturechange" === t.type && w(t);
    }

    function x(t) {
      var s = e.device,
          a = e.support,
          i = e.params.zoom,
          r = e.zoom;

      if (!a.gestures) {
        if (!l || !o) return;
        if ("touchend" !== t.type || "touchend" === t.type && t.changedTouches.length < 2 && !s.android) return;
        l = !1, o = !1;
      }

      u.$imageEl && 0 !== u.$imageEl.length && (r.scale = Math.max(Math.min(r.scale, u.maxRatio), i.minRatio), u.$imageEl.transition(e.params.speed).transform("translate3d(0,0,0) scale(".concat(r.scale, ")")), c = r.scale, p = !1, 1 === r.scale && (u.$slideEl = void 0));
    }

    function y(t) {
      var s = e.zoom;
      if (!u.$imageEl || 0 === u.$imageEl.length) return;
      if (e.allowClick = !1, !m.isTouched || !u.$slideEl) return;
      m.isMoved || (m.width = u.$imageEl[0].offsetWidth, m.height = u.$imageEl[0].offsetHeight, m.startX = h(u.$imageWrapEl[0], "x") || 0, m.startY = h(u.$imageWrapEl[0], "y") || 0, u.slideWidth = u.$slideEl[0].offsetWidth, u.slideHeight = u.$slideEl[0].offsetHeight, u.$imageWrapEl.transition(0));
      var a = m.width * s.scale,
          i = m.height * s.scale;

      if (!(a < u.slideWidth && i < u.slideHeight)) {
        if (m.minX = Math.min(u.slideWidth / 2 - a / 2, 0), m.maxX = -m.minX, m.minY = Math.min(u.slideHeight / 2 - i / 2, 0), m.maxY = -m.minY, m.touchesCurrent.x = "touchmove" === t.type ? t.targetTouches[0].pageX : t.pageX, m.touchesCurrent.y = "touchmove" === t.type ? t.targetTouches[0].pageY : t.pageY, !m.isMoved && !p) {
          if (e.isHorizontal() && (Math.floor(m.minX) === Math.floor(m.startX) && m.touchesCurrent.x < m.touchesStart.x || Math.floor(m.maxX) === Math.floor(m.startX) && m.touchesCurrent.x > m.touchesStart.x)) return void (m.isTouched = !1);
          if (!e.isHorizontal() && (Math.floor(m.minY) === Math.floor(m.startY) && m.touchesCurrent.y < m.touchesStart.y || Math.floor(m.maxY) === Math.floor(m.startY) && m.touchesCurrent.y > m.touchesStart.y)) return void (m.isTouched = !1);
        }

        t.cancelable && t.preventDefault(), t.stopPropagation(), m.isMoved = !0, m.currentX = m.touchesCurrent.x - m.touchesStart.x + m.startX, m.currentY = m.touchesCurrent.y - m.touchesStart.y + m.startY, m.currentX < m.minX && (m.currentX = m.minX + 1 - Math.pow(m.minX - m.currentX + 1, .8)), m.currentX > m.maxX && (m.currentX = m.maxX - 1 + Math.pow(m.currentX - m.maxX + 1, .8)), m.currentY < m.minY && (m.currentY = m.minY + 1 - Math.pow(m.minY - m.currentY + 1, .8)), m.currentY > m.maxY && (m.currentY = m.maxY - 1 + Math.pow(m.currentY - m.maxY + 1, .8)), f.prevPositionX || (f.prevPositionX = m.touchesCurrent.x), f.prevPositionY || (f.prevPositionY = m.touchesCurrent.y), f.prevTime || (f.prevTime = Date.now()), f.x = (m.touchesCurrent.x - f.prevPositionX) / (Date.now() - f.prevTime) / 2, f.y = (m.touchesCurrent.y - f.prevPositionY) / (Date.now() - f.prevTime) / 2, Math.abs(m.touchesCurrent.x - f.prevPositionX) < 2 && (f.x = 0), Math.abs(m.touchesCurrent.y - f.prevPositionY) < 2 && (f.y = 0), f.prevPositionX = m.touchesCurrent.x, f.prevPositionY = m.touchesCurrent.y, f.prevTime = Date.now(), u.$imageWrapEl.transform("translate3d(".concat(m.currentX, "px, ").concat(m.currentY, "px,0)"));
      }
    }

    function E() {
      var t = e.zoom;
      u.$slideEl && e.previousIndex !== e.activeIndex && (u.$imageEl && u.$imageEl.transform("translate3d(0,0,0) scale(1)"), u.$imageWrapEl && u.$imageWrapEl.transform("translate3d(0,0,0)"), t.scale = 1, c = 1, u.$slideEl = void 0, u.$imageEl = void 0, u.$imageWrapEl = void 0);
    }

    function T(t) {
      var s = e.zoom,
          a = e.params.zoom;
      if (u.$slideEl || (t && t.target && (u.$slideEl = d(t.target).closest(".".concat(e.params.slideClass))), u.$slideEl || (e.params.virtual && e.params.virtual.enabled && e.virtual ? u.$slideEl = e.$wrapperEl.children(".".concat(e.params.slideActiveClass)) : u.$slideEl = e.slides.eq(e.activeIndex)), u.$imageEl = u.$slideEl.find(".".concat(a.containerClass)).eq(0).find("img, svg, canvas, picture, .swiper-zoom-target"), u.$imageWrapEl = u.$imageEl.parent(".".concat(a.containerClass))), !u.$imageEl || 0 === u.$imageEl.length || !u.$imageWrapEl || 0 === u.$imageWrapEl.length) return;
      var r, n, l, o, p, h, f, g, v, w, b, x, y, E, T, C, $, S;
      e.params.cssMode && (e.wrapperEl.style.overflow = "hidden", e.wrapperEl.style.touchAction = "none"), u.$slideEl.addClass("".concat(a.zoomedSlideClass)), void 0 === m.touchesStart.x && t ? (r = "touchend" === t.type ? t.changedTouches[0].pageX : t.pageX, n = "touchend" === t.type ? t.changedTouches[0].pageY : t.pageY) : (r = m.touchesStart.x, n = m.touchesStart.y), s.scale = u.$imageWrapEl.attr("data-swiper-zoom") || a.maxRatio, c = u.$imageWrapEl.attr("data-swiper-zoom") || a.maxRatio, t ? ($ = u.$slideEl[0].offsetWidth, S = u.$slideEl[0].offsetHeight, l = u.$slideEl.offset().left + i.scrollX, o = u.$slideEl.offset().top + i.scrollY, p = l + $ / 2 - r, h = o + S / 2 - n, v = u.$imageEl[0].offsetWidth, w = u.$imageEl[0].offsetHeight, b = v * s.scale, x = w * s.scale, y = Math.min($ / 2 - b / 2, 0), E = Math.min(S / 2 - x / 2, 0), T = -y, C = -E, f = p * s.scale, g = h * s.scale, f < y && (f = y), f > T && (f = T), g < E && (g = E), g > C && (g = C)) : (f = 0, g = 0), u.$imageWrapEl.transition(300).transform("translate3d(".concat(f, "px, ").concat(g, "px,0)")), u.$imageEl.transition(300).transform("translate3d(0,0,0) scale(".concat(s.scale, ")"));
    }

    function C() {
      var t = e.zoom,
          s = e.params.zoom;
      u.$slideEl || (e.params.virtual && e.params.virtual.enabled && e.virtual ? u.$slideEl = e.$wrapperEl.children(".".concat(e.params.slideActiveClass)) : u.$slideEl = e.slides.eq(e.activeIndex), u.$imageEl = u.$slideEl.find(".".concat(s.containerClass)).eq(0).find("img, svg, canvas, picture, .swiper-zoom-target"), u.$imageWrapEl = u.$imageEl.parent(".".concat(s.containerClass))), u.$imageEl && 0 !== u.$imageEl.length && u.$imageWrapEl && 0 !== u.$imageWrapEl.length && (e.params.cssMode && (e.wrapperEl.style.overflow = "", e.wrapperEl.style.touchAction = ""), t.scale = 1, c = 1, u.$imageWrapEl.transition(300).transform("translate3d(0,0,0)"), u.$imageEl.transition(300).transform("translate3d(0,0,0) scale(1)"), u.$slideEl.removeClass("".concat(s.zoomedSlideClass)), u.$slideEl = void 0);
    }

    function $(t) {
      var s = e.zoom;
      s.scale && 1 !== s.scale ? C() : T(t);
    }

    function S() {
      var t = e.support;
      return {
        passiveListener: !("touchstart" !== e.touchEvents.start || !t.passiveListener || !e.params.passiveListeners) && {
          passive: !0,
          capture: !1
        },
        activeListenerWithCapture: !t.passiveListener || {
          passive: !1,
          capture: !0
        }
      };
    }

    function M() {
      return ".".concat(e.params.slideClass);
    }

    function P(t) {
      var _S = S(),
          s = _S.passiveListener,
          a = M();

      e.$wrapperEl[t]("gesturestart", a, w, s), e.$wrapperEl[t]("gesturechange", a, b, s), e.$wrapperEl[t]("gestureend", a, x, s);
    }

    function k() {
      n || (n = !0, P("on"));
    }

    function z() {
      n && (n = !1, P("off"));
    }

    function O() {
      var t = e.zoom;
      if (t.enabled) return;
      t.enabled = !0;

      var s = e.support,
          _S2 = S(),
          a = _S2.passiveListener,
          i = _S2.activeListenerWithCapture,
          r = M();

      s.gestures ? (e.$wrapperEl.on(e.touchEvents.start, k, a), e.$wrapperEl.on(e.touchEvents.end, z, a)) : "touchstart" === e.touchEvents.start && (e.$wrapperEl.on(e.touchEvents.start, r, w, a), e.$wrapperEl.on(e.touchEvents.move, r, b, i), e.$wrapperEl.on(e.touchEvents.end, r, x, a), e.touchEvents.cancel && e.$wrapperEl.on(e.touchEvents.cancel, r, x, a)), e.$wrapperEl.on(e.touchEvents.move, ".".concat(e.params.zoom.containerClass), y, i);
    }

    function I() {
      var t = e.zoom;
      if (!t.enabled) return;
      var s = e.support;
      t.enabled = !1;

      var _S3 = S(),
          a = _S3.passiveListener,
          i = _S3.activeListenerWithCapture,
          r = M();

      s.gestures ? (e.$wrapperEl.off(e.touchEvents.start, k, a), e.$wrapperEl.off(e.touchEvents.end, z, a)) : "touchstart" === e.touchEvents.start && (e.$wrapperEl.off(e.touchEvents.start, r, w, a), e.$wrapperEl.off(e.touchEvents.move, r, b, i), e.$wrapperEl.off(e.touchEvents.end, r, x, a), e.touchEvents.cancel && e.$wrapperEl.off(e.touchEvents.cancel, r, x, a)), e.$wrapperEl.off(e.touchEvents.move, ".".concat(e.params.zoom.containerClass), y, i);
    }

    Object.defineProperty(e.zoom, "scale", {
      get: function get() {
        return g;
      },
      set: function set(e) {
        if (g !== e) {
          var _t43 = u.$imageEl ? u.$imageEl[0] : void 0,
              _s39 = u.$slideEl ? u.$slideEl[0] : void 0;

          a("zoomChange", e, _t43, _s39);
        }

        g = e;
      }
    }), s("init", function () {
      e.params.zoom.enabled && O();
    }), s("destroy", function () {
      I();
    }), s("touchStart", function (t, s) {
      e.zoom.enabled && function (t) {
        var s = e.device;
        u.$imageEl && 0 !== u.$imageEl.length && (m.isTouched || (s.android && t.cancelable && t.preventDefault(), m.isTouched = !0, m.touchesStart.x = "touchstart" === t.type ? t.targetTouches[0].pageX : t.pageX, m.touchesStart.y = "touchstart" === t.type ? t.targetTouches[0].pageY : t.pageY));
      }(s);
    }), s("touchEnd", function (t, s) {
      e.zoom.enabled && function () {
        var t = e.zoom;
        if (!u.$imageEl || 0 === u.$imageEl.length) return;
        if (!m.isTouched || !m.isMoved) return m.isTouched = !1, void (m.isMoved = !1);
        m.isTouched = !1, m.isMoved = !1;
        var s = 300,
            a = 300;
        var i = f.x * s,
            r = m.currentX + i,
            n = f.y * a,
            l = m.currentY + n;
        0 !== f.x && (s = Math.abs((r - m.currentX) / f.x)), 0 !== f.y && (a = Math.abs((l - m.currentY) / f.y));
        var o = Math.max(s, a);
        m.currentX = r, m.currentY = l;
        var d = m.width * t.scale,
            c = m.height * t.scale;
        m.minX = Math.min(u.slideWidth / 2 - d / 2, 0), m.maxX = -m.minX, m.minY = Math.min(u.slideHeight / 2 - c / 2, 0), m.maxY = -m.minY, m.currentX = Math.max(Math.min(m.currentX, m.maxX), m.minX), m.currentY = Math.max(Math.min(m.currentY, m.maxY), m.minY), u.$imageWrapEl.transition(o).transform("translate3d(".concat(m.currentX, "px, ").concat(m.currentY, "px,0)"));
      }();
    }), s("doubleTap", function (t, s) {
      !e.animating && e.params.zoom.enabled && e.zoom.enabled && e.params.zoom.toggle && $(s);
    }), s("transitionEnd", function () {
      e.zoom.enabled && e.params.zoom.enabled && E();
    }), s("slideChange", function () {
      e.zoom.enabled && e.params.zoom.enabled && e.params.cssMode && E();
    }), Object.assign(e.zoom, {
      enable: O,
      disable: I,
      in: T,
      out: C,
      toggle: $
    });
  }, function (_ref16) {
    var e = _ref16.swiper,
        t = _ref16.extendParams,
        s = _ref16.on,
        a = _ref16.emit;
    t({
      lazy: {
        checkInView: !1,
        enabled: !1,
        loadPrevNext: !1,
        loadPrevNextAmount: 1,
        loadOnTransitionStart: !1,
        scrollingElement: "",
        elementClass: "swiper-lazy",
        loadingClass: "swiper-lazy-loading",
        loadedClass: "swiper-lazy-loaded",
        preloaderClass: "swiper-lazy-preloader"
      }
    }), e.lazy = {};
    var i = !1,
        n = !1;

    function l(t) {
      var s = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : !0;
      var i = e.params.lazy;
      if (void 0 === t) return;
      if (0 === e.slides.length) return;
      var r = e.virtual && e.params.virtual.enabled ? e.$wrapperEl.children(".".concat(e.params.slideClass, "[data-swiper-slide-index=\"").concat(t, "\"]")) : e.slides.eq(t),
          n = r.find(".".concat(i.elementClass, ":not(.").concat(i.loadedClass, "):not(.").concat(i.loadingClass, ")"));
      !r.hasClass(i.elementClass) || r.hasClass(i.loadedClass) || r.hasClass(i.loadingClass) || n.push(r[0]), 0 !== n.length && n.each(function (t) {
        var n = d(t);
        n.addClass(i.loadingClass);
        var o = n.attr("data-background"),
            c = n.attr("data-src"),
            p = n.attr("data-srcset"),
            u = n.attr("data-sizes"),
            h = n.parent("picture");
        e.loadImage(n[0], c || o, p, u, !1, function () {
          if (null != e && e && (!e || e.params) && !e.destroyed) {
            if (o ? (n.css("background-image", "url(\"".concat(o, "\")")), n.removeAttr("data-background")) : (p && (n.attr("srcset", p), n.removeAttr("data-srcset")), u && (n.attr("sizes", u), n.removeAttr("data-sizes")), h.length && h.children("source").each(function (e) {
              var t = d(e);
              t.attr("data-srcset") && (t.attr("srcset", t.attr("data-srcset")), t.removeAttr("data-srcset"));
            }), c && (n.attr("src", c), n.removeAttr("data-src"))), n.addClass(i.loadedClass).removeClass(i.loadingClass), r.find(".".concat(i.preloaderClass)).remove(), e.params.loop && s) {
              var _t44 = r.attr("data-swiper-slide-index");

              if (r.hasClass(e.params.slideDuplicateClass)) {
                l(e.$wrapperEl.children("[data-swiper-slide-index=\"".concat(_t44, "\"]:not(.").concat(e.params.slideDuplicateClass, ")")).index(), !1);
              } else {
                l(e.$wrapperEl.children(".".concat(e.params.slideDuplicateClass, "[data-swiper-slide-index=\"").concat(_t44, "\"]")).index(), !1);
              }
            }

            a("lazyImageReady", r[0], n[0]), e.params.autoHeight && e.updateAutoHeight();
          }
        }), a("lazyImageLoad", r[0], n[0]);
      });
    }

    function o() {
      var t = e.$wrapperEl,
          s = e.params,
          a = e.slides,
          i = e.activeIndex,
          r = e.virtual && s.virtual.enabled,
          o = s.lazy;
      var c = s.slidesPerView;

      function p(e) {
        if (r) {
          if (t.children(".".concat(s.slideClass, "[data-swiper-slide-index=\"").concat(e, "\"]")).length) return !0;
        } else if (a[e]) return !0;

        return !1;
      }

      function u(e) {
        return r ? d(e).attr("data-swiper-slide-index") : d(e).index();
      }

      if ("auto" === c && (c = 0), n || (n = !0), e.params.watchSlidesProgress) t.children(".".concat(s.slideVisibleClass)).each(function (e) {
        l(r ? d(e).attr("data-swiper-slide-index") : d(e).index());
      });else if (c > 1) for (var _e63 = i; _e63 < i + c; _e63 += 1) {
        p(_e63) && l(_e63);
      } else l(i);
      if (o.loadPrevNext) if (c > 1 || o.loadPrevNextAmount && o.loadPrevNextAmount > 1) {
        var _e64 = o.loadPrevNextAmount,
            _t45 = c,
            _s40 = Math.min(i + _t45 + Math.max(_e64, _t45), a.length),
            _r10 = Math.max(i - Math.max(_t45, _e64), 0);

        for (var _e65 = i + c; _e65 < _s40; _e65 += 1) {
          p(_e65) && l(_e65);
        }

        for (var _e66 = _r10; _e66 < i; _e66 += 1) {
          p(_e66) && l(_e66);
        }
      } else {
        var _e67 = t.children(".".concat(s.slideNextClass));

        _e67.length > 0 && l(u(_e67));

        var _a23 = t.children(".".concat(s.slidePrevClass));

        _a23.length > 0 && l(u(_a23));
      }
    }

    function c() {
      var t = r();
      if (!e || e.destroyed) return;
      var s = e.params.lazy.scrollingElement ? d(e.params.lazy.scrollingElement) : d(t),
          a = s[0] === t,
          n = a ? t.innerWidth : s[0].offsetWidth,
          l = a ? t.innerHeight : s[0].offsetHeight,
          p = e.$el.offset(),
          u = e.rtlTranslate;
      var h = !1;
      u && (p.left -= e.$el[0].scrollLeft);
      var m = [[p.left, p.top], [p.left + e.width, p.top], [p.left, p.top + e.height], [p.left + e.width, p.top + e.height]];

      for (var _e68 = 0; _e68 < m.length; _e68 += 1) {
        var _t46 = m[_e68];

        if (_t46[0] >= 0 && _t46[0] <= n && _t46[1] >= 0 && _t46[1] <= l) {
          if (0 === _t46[0] && 0 === _t46[1]) continue;
          h = !0;
        }
      }

      var f = !("touchstart" !== e.touchEvents.start || !e.support.passiveListener || !e.params.passiveListeners) && {
        passive: !0,
        capture: !1
      };
      h ? (o(), s.off("scroll", c, f)) : i || (i = !0, s.on("scroll", c, f));
    }

    s("beforeInit", function () {
      e.params.lazy.enabled && e.params.preloadImages && (e.params.preloadImages = !1);
    }), s("init", function () {
      e.params.lazy.enabled && (e.params.lazy.checkInView ? c() : o());
    }), s("scroll", function () {
      e.params.freeMode && e.params.freeMode.enabled && !e.params.freeMode.sticky && o();
    }), s("scrollbarDragMove resize _freeModeNoMomentumRelease", function () {
      e.params.lazy.enabled && (e.params.lazy.checkInView ? c() : o());
    }), s("transitionStart", function () {
      e.params.lazy.enabled && (e.params.lazy.loadOnTransitionStart || !e.params.lazy.loadOnTransitionStart && !n) && (e.params.lazy.checkInView ? c() : o());
    }), s("transitionEnd", function () {
      e.params.lazy.enabled && !e.params.lazy.loadOnTransitionStart && (e.params.lazy.checkInView ? c() : o());
    }), s("slideChange", function () {
      var _e$params2 = e.params,
          t = _e$params2.lazy,
          s = _e$params2.cssMode,
          a = _e$params2.watchSlidesProgress,
          i = _e$params2.touchReleaseOnEdges,
          r = _e$params2.resistanceRatio;
      t.enabled && (s || a && (i || 0 === r)) && o();
    }), Object.assign(e.lazy, {
      load: o,
      loadInSlide: l
    });
  }, function (_ref17) {
    var e = _ref17.swiper,
        t = _ref17.extendParams,
        s = _ref17.on;

    function a(e, t) {
      var s = function () {
        var e, t, s;
        return function (a, i) {
          for (t = -1, e = a.length; e - t > 1;) {
            s = e + t >> 1, a[s] <= i ? t = s : e = s;
          }

          return e;
        };
      }();

      var a, i;
      return this.x = e, this.y = t, this.lastIndex = e.length - 1, this.interpolate = function (e) {
        return e ? (i = s(this.x, e), a = i - 1, (e - this.x[a]) * (this.y[i] - this.y[a]) / (this.x[i] - this.x[a]) + this.y[a]) : 0;
      }, this;
    }

    function i() {
      e.controller.control && e.controller.spline && (e.controller.spline = void 0, delete e.controller.spline);
    }

    t({
      controller: {
        control: void 0,
        inverse: !1,
        by: "slide"
      }
    }), e.controller = {
      control: void 0
    }, s("beforeInit", function () {
      e.controller.control = e.params.controller.control;
    }), s("update", function () {
      i();
    }), s("resize", function () {
      i();
    }), s("observerUpdate", function () {
      i();
    }), s("setTranslate", function (t, s, a) {
      e.controller.control && e.controller.setTranslate(s, a);
    }), s("setTransition", function (t, s, a) {
      e.controller.control && e.controller.setTransition(s, a);
    }), Object.assign(e.controller, {
      setTranslate: function setTranslate(t, s) {
        var i = e.controller.control;
        var r, n;
        var l = e.constructor;

        function o(t) {
          var s = e.rtlTranslate ? -e.translate : e.translate;
          "slide" === e.params.controller.by && (!function (t) {
            e.controller.spline || (e.controller.spline = e.params.loop ? new a(e.slidesGrid, t.slidesGrid) : new a(e.snapGrid, t.snapGrid));
          }(t), n = -e.controller.spline.interpolate(-s)), n && "container" !== e.params.controller.by || (r = (t.maxTranslate() - t.minTranslate()) / (e.maxTranslate() - e.minTranslate()), n = (s - e.minTranslate()) * r + t.minTranslate()), e.params.controller.inverse && (n = t.maxTranslate() - n), t.updateProgress(n), t.setTranslate(n, e), t.updateActiveIndex(), t.updateSlidesClasses();
        }

        if (Array.isArray(i)) for (var _e69 = 0; _e69 < i.length; _e69 += 1) {
          i[_e69] !== s && i[_e69] instanceof l && o(i[_e69]);
        } else i instanceof l && s !== i && o(i);
      },
      setTransition: function setTransition(t, s) {
        var a = e.constructor,
            i = e.controller.control;
        var r;

        function n(s) {
          s.setTransition(t, e), 0 !== t && (s.transitionStart(), s.params.autoHeight && p(function () {
            s.updateAutoHeight();
          }), s.$wrapperEl.transitionEnd(function () {
            i && (s.params.loop && "slide" === e.params.controller.by && s.loopFix(), s.transitionEnd());
          }));
        }

        if (Array.isArray(i)) for (r = 0; r < i.length; r += 1) {
          i[r] !== s && i[r] instanceof a && n(i[r]);
        } else i instanceof a && s !== i && n(i);
      }
    });
  }, function (_ref18) {
    var e = _ref18.swiper,
        t = _ref18.extendParams,
        s = _ref18.on;
    t({
      a11y: {
        enabled: !0,
        notificationClass: "swiper-notification",
        prevSlideMessage: "Previous slide",
        nextSlideMessage: "Next slide",
        firstSlideMessage: "This is the first slide",
        lastSlideMessage: "This is the last slide",
        paginationBulletMessage: "Go to slide {{index}}",
        slideLabelMessage: "{{index}} / {{slidesLength}}",
        containerMessage: null,
        containerRoleDescriptionMessage: null,
        itemRoleDescriptionMessage: null,
        slideRole: "group"
      }
    });
    var a = null;

    function i(e) {
      var t = a;
      0 !== t.length && (t.html(""), t.html(e));
    }

    function r(e) {
      e.attr("tabIndex", "0");
    }

    function n(e) {
      e.attr("tabIndex", "-1");
    }

    function l(e, t) {
      e.attr("role", t);
    }

    function o(e, t) {
      e.attr("aria-roledescription", t);
    }

    function c(e, t) {
      e.attr("aria-label", t);
    }

    function p(e) {
      e.attr("aria-disabled", !0);
    }

    function u(e) {
      e.attr("aria-disabled", !1);
    }

    function h(t) {
      if (13 !== t.keyCode && 32 !== t.keyCode) return;
      var s = e.params.a11y,
          a = d(t.target);
      e.navigation && e.navigation.$nextEl && a.is(e.navigation.$nextEl) && (e.isEnd && !e.params.loop || e.slideNext(), e.isEnd ? i(s.lastSlideMessage) : i(s.nextSlideMessage)), e.navigation && e.navigation.$prevEl && a.is(e.navigation.$prevEl) && (e.isBeginning && !e.params.loop || e.slidePrev(), e.isBeginning ? i(s.firstSlideMessage) : i(s.prevSlideMessage)), e.pagination && a.is(W(e.params.pagination.bulletClass)) && a[0].click();
    }

    function m() {
      if (e.params.loop || !e.navigation) return;
      var _e$navigation5 = e.navigation,
          t = _e$navigation5.$nextEl,
          s = _e$navigation5.$prevEl;
      s && s.length > 0 && (e.isBeginning ? (p(s), n(s)) : (u(s), r(s))), t && t.length > 0 && (e.isEnd ? (p(t), n(t)) : (u(t), r(t)));
    }

    function f() {
      return e.pagination && e.params.pagination.clickable && e.pagination.bullets && e.pagination.bullets.length;
    }

    var g = function g(e, t, s) {
      r(e), "BUTTON" !== e[0].tagName && (l(e, "button"), e.on("keydown", h)), c(e, s), function (e, t) {
        e.attr("aria-controls", t);
      }(e, t);
    };

    function v() {
      var t = e.params.a11y;
      e.$el.append(a);
      var s = e.$el;
      t.containerRoleDescriptionMessage && o(s, t.containerRoleDescriptionMessage), t.containerMessage && c(s, t.containerMessage);
      var i = e.$wrapperEl,
          r = i.attr("id") || "swiper-wrapper-".concat(function () {
        var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 16;
        return "x".repeat(e).replace(/x/g, function () {
          return Math.round(16 * Math.random()).toString(16);
        });
      }(16)),
          n = e.params.autoplay && e.params.autoplay.enabled ? "off" : "polite";
      var p;
      p = r, i.attr("id", p), function (e, t) {
        e.attr("aria-live", t);
      }(i, n), t.itemRoleDescriptionMessage && o(d(e.slides), t.itemRoleDescriptionMessage), l(d(e.slides), t.slideRole);
      var u = e.params.loop ? e.slides.filter(function (t) {
        return !t.classList.contains(e.params.slideDuplicateClass);
      }).length : e.slides.length;
      var m, v;
      e.slides.each(function (s, a) {
        var i = d(s),
            r = e.params.loop ? parseInt(i.attr("data-swiper-slide-index"), 10) : a;
        c(i, t.slideLabelMessage.replace(/\{\{index\}\}/, r + 1).replace(/\{\{slidesLength\}\}/, u));
      }), e.navigation && e.navigation.$nextEl && (m = e.navigation.$nextEl), e.navigation && e.navigation.$prevEl && (v = e.navigation.$prevEl), m && m.length && g(m, r, t.nextSlideMessage), v && v.length && g(v, r, t.prevSlideMessage), f() && e.pagination.$el.on("keydown", W(e.params.pagination.bulletClass), h);
    }

    s("beforeInit", function () {
      a = d("<span class=\"".concat(e.params.a11y.notificationClass, "\" aria-live=\"assertive\" aria-atomic=\"true\"></span>"));
    }), s("afterInit", function () {
      e.params.a11y.enabled && (v(), m());
    }), s("toEdge", function () {
      e.params.a11y.enabled && m();
    }), s("fromEdge", function () {
      e.params.a11y.enabled && m();
    }), s("paginationUpdate", function () {
      e.params.a11y.enabled && function () {
        var t = e.params.a11y;
        f() && e.pagination.bullets.each(function (s) {
          var a = d(s);
          r(a), e.params.pagination.renderBullet || (l(a, "button"), c(a, t.paginationBulletMessage.replace(/\{\{index\}\}/, a.index() + 1)));
        });
      }();
    }), s("destroy", function () {
      e.params.a11y.enabled && function () {
        var t, s;
        a && a.length > 0 && a.remove(), e.navigation && e.navigation.$nextEl && (t = e.navigation.$nextEl), e.navigation && e.navigation.$prevEl && (s = e.navigation.$prevEl), t && t.off("keydown", h), s && s.off("keydown", h), f() && e.pagination.$el.off("keydown", W(e.params.pagination.bulletClass), h);
      }();
    });
  }, function (_ref19) {
    var e = _ref19.swiper,
        t = _ref19.extendParams,
        s = _ref19.on;
    t({
      history: {
        enabled: !1,
        root: "",
        replaceState: !1,
        key: "slides"
      }
    });
    var a = !1,
        i = {};

    var n = function n(e) {
      return e.toString().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
    },
        l = function l(e) {
      var t = r();
      var s;
      s = e ? new URL(e) : t.location;
      var a = s.pathname.slice(1).split("/").filter(function (e) {
        return "" !== e;
      }),
          i = a.length;
      return {
        key: a[i - 2],
        value: a[i - 1]
      };
    },
        o = function o(t, s) {
      var i = r();
      if (!a || !e.params.history.enabled) return;
      var l;
      l = e.params.url ? new URL(e.params.url) : i.location;
      var o = e.slides.eq(s);
      var d = n(o.attr("data-history"));

      if (e.params.history.root.length > 0) {
        var _s41 = e.params.history.root;
        "/" === _s41[_s41.length - 1] && (_s41 = _s41.slice(0, _s41.length - 1)), d = "".concat(_s41, "/").concat(t, "/").concat(d);
      } else l.pathname.includes(t) || (d = "".concat(t, "/").concat(d));

      var c = i.history.state;
      c && c.value === d || (e.params.history.replaceState ? i.history.replaceState({
        value: d
      }, null, d) : i.history.pushState({
        value: d
      }, null, d));
    },
        d = function d(t, s, a) {
      if (s) for (var _i15 = 0, _r11 = e.slides.length; _i15 < _r11; _i15 += 1) {
        var _r12 = e.slides.eq(_i15);

        if (n(_r12.attr("data-history")) === s && !_r12.hasClass(e.params.slideDuplicateClass)) {
          var _s42 = _r12.index();

          e.slideTo(_s42, t, a);
        }
      } else e.slideTo(0, t, a);
    },
        c = function c() {
      i = l(e.params.url), d(e.params.speed, e.paths.value, !1);
    };

    s("init", function () {
      e.params.history.enabled && function () {
        var t = r();

        if (e.params.history) {
          if (!t.history || !t.history.pushState) return e.params.history.enabled = !1, void (e.params.hashNavigation.enabled = !0);
          a = !0, i = l(e.params.url), (i.key || i.value) && (d(0, i.value, e.params.runCallbacksOnInit), e.params.history.replaceState || t.addEventListener("popstate", c));
        }
      }();
    }), s("destroy", function () {
      e.params.history.enabled && function () {
        var t = r();
        e.params.history.replaceState || t.removeEventListener("popstate", c);
      }();
    }), s("transitionEnd _freeModeNoMomentumRelease", function () {
      a && o(e.params.history.key, e.activeIndex);
    }), s("slideChange", function () {
      a && e.params.cssMode && o(e.params.history.key, e.activeIndex);
    });
  }, function (_ref20) {
    var e = _ref20.swiper,
        t = _ref20.extendParams,
        s = _ref20.emit,
        i = _ref20.on;
    var n = !1;
    var l = a(),
        o = r();
    t({
      hashNavigation: {
        enabled: !1,
        replaceState: !1,
        watchState: !1
      }
    });

    var c = function c() {
      s("hashChange");
      var t = l.location.hash.replace("#", "");

      if (t !== e.slides.eq(e.activeIndex).attr("data-hash")) {
        var _s43 = e.$wrapperEl.children(".".concat(e.params.slideClass, "[data-hash=\"").concat(t, "\"]")).index();

        if (void 0 === _s43) return;
        e.slideTo(_s43);
      }
    },
        p = function p() {
      if (n && e.params.hashNavigation.enabled) if (e.params.hashNavigation.replaceState && o.history && o.history.replaceState) o.history.replaceState(null, null, "#".concat(e.slides.eq(e.activeIndex).attr("data-hash")) || ""), s("hashSet");else {
        var _t47 = e.slides.eq(e.activeIndex),
            _a24 = _t47.attr("data-hash") || _t47.attr("data-history");

        l.location.hash = _a24 || "", s("hashSet");
      }
    };

    i("init", function () {
      e.params.hashNavigation.enabled && function () {
        if (!e.params.hashNavigation.enabled || e.params.history && e.params.history.enabled) return;
        n = !0;
        var t = l.location.hash.replace("#", "");

        if (t) {
          var _s44 = 0;

          for (var _a25 = 0, _i16 = e.slides.length; _a25 < _i16; _a25 += 1) {
            var _i17 = e.slides.eq(_a25);

            if ((_i17.attr("data-hash") || _i17.attr("data-history")) === t && !_i17.hasClass(e.params.slideDuplicateClass)) {
              var _t48 = _i17.index();

              e.slideTo(_t48, _s44, e.params.runCallbacksOnInit, !0);
            }
          }
        }

        e.params.hashNavigation.watchState && d(o).on("hashchange", c);
      }();
    }), i("destroy", function () {
      e.params.hashNavigation.enabled && e.params.hashNavigation.watchState && d(o).off("hashchange", c);
    }), i("transitionEnd _freeModeNoMomentumRelease", function () {
      n && p();
    }), i("slideChange", function () {
      n && e.params.cssMode && p();
    });
  }, function (_ref21) {
    var e = _ref21.swiper,
        t = _ref21.extendParams,
        s = _ref21.on,
        i = _ref21.emit;
    var r;

    function n() {
      var t = e.slides.eq(e.activeIndex);
      var s = e.params.autoplay.delay;
      t.attr("data-swiper-autoplay") && (s = t.attr("data-swiper-autoplay") || e.params.autoplay.delay), clearTimeout(r), r = p(function () {
        var t;
        e.params.autoplay.reverseDirection ? e.params.loop ? (e.loopFix(), t = e.slidePrev(e.params.speed, !0, !0), i("autoplay")) : e.isBeginning ? e.params.autoplay.stopOnLastSlide ? o() : (t = e.slideTo(e.slides.length - 1, e.params.speed, !0, !0), i("autoplay")) : (t = e.slidePrev(e.params.speed, !0, !0), i("autoplay")) : e.params.loop ? (e.loopFix(), t = e.slideNext(e.params.speed, !0, !0), i("autoplay")) : e.isEnd ? e.params.autoplay.stopOnLastSlide ? o() : (t = e.slideTo(0, e.params.speed, !0, !0), i("autoplay")) : (t = e.slideNext(e.params.speed, !0, !0), i("autoplay")), (e.params.cssMode && e.autoplay.running || !1 === t) && n();
      }, s);
    }

    function l() {
      return void 0 === r && !e.autoplay.running && (e.autoplay.running = !0, i("autoplayStart"), n(), !0);
    }

    function o() {
      return !!e.autoplay.running && void 0 !== r && (r && (clearTimeout(r), r = void 0), e.autoplay.running = !1, i("autoplayStop"), !0);
    }

    function d(t) {
      e.autoplay.running && (e.autoplay.paused || (r && clearTimeout(r), e.autoplay.paused = !0, 0 !== t && e.params.autoplay.waitForTransition ? ["transitionend", "webkitTransitionEnd"].forEach(function (t) {
        e.$wrapperEl[0].addEventListener(t, u);
      }) : (e.autoplay.paused = !1, n())));
    }

    function c() {
      var t = a();
      "hidden" === t.visibilityState && e.autoplay.running && d(), "visible" === t.visibilityState && e.autoplay.paused && (n(), e.autoplay.paused = !1);
    }

    function u(t) {
      e && !e.destroyed && e.$wrapperEl && t.target === e.$wrapperEl[0] && (["transitionend", "webkitTransitionEnd"].forEach(function (t) {
        e.$wrapperEl[0].removeEventListener(t, u);
      }), e.autoplay.paused = !1, e.autoplay.running ? n() : o());
    }

    function h() {
      e.params.autoplay.disableOnInteraction ? o() : d(), ["transitionend", "webkitTransitionEnd"].forEach(function (t) {
        e.$wrapperEl[0].removeEventListener(t, u);
      });
    }

    function m() {
      e.params.autoplay.disableOnInteraction || (e.autoplay.paused = !1, n());
    }

    e.autoplay = {
      running: !1,
      paused: !1
    }, t({
      autoplay: {
        enabled: !1,
        delay: 3e3,
        waitForTransition: !0,
        disableOnInteraction: !0,
        stopOnLastSlide: !1,
        reverseDirection: !1,
        pauseOnMouseEnter: !1
      }
    }), s("init", function () {
      if (e.params.autoplay.enabled) {
        l();
        a().addEventListener("visibilitychange", c), e.params.autoplay.pauseOnMouseEnter && (e.$el.on("mouseenter", h), e.$el.on("mouseleave", m));
      }
    }), s("beforeTransitionStart", function (t, s, a) {
      e.autoplay.running && (a || !e.params.autoplay.disableOnInteraction ? e.autoplay.pause(s) : o());
    }), s("sliderFirstMove", function () {
      e.autoplay.running && (e.params.autoplay.disableOnInteraction ? o() : d());
    }), s("touchEnd", function () {
      e.params.cssMode && e.autoplay.paused && !e.params.autoplay.disableOnInteraction && n();
    }), s("destroy", function () {
      e.$el.off("mouseenter", h), e.$el.off("mouseleave", m), e.autoplay.running && o();
      a().removeEventListener("visibilitychange", c);
    }), Object.assign(e.autoplay, {
      pause: d,
      run: n,
      start: l,
      stop: o
    });
  }, function (_ref22) {
    var e = _ref22.swiper,
        t = _ref22.extendParams,
        s = _ref22.on;
    t({
      thumbs: {
        swiper: null,
        multipleActiveThumbs: !0,
        autoScrollOffset: 0,
        slideThumbActiveClass: "swiper-slide-thumb-active",
        thumbsContainerClass: "swiper-thumbs"
      }
    });
    var a = !1,
        i = !1;

    function r() {
      var t = e.thumbs.swiper;
      if (!t) return;
      var s = t.clickedIndex,
          a = t.clickedSlide;
      if (a && d(a).hasClass(e.params.thumbs.slideThumbActiveClass)) return;
      if (null == s) return;
      var i;

      if (i = t.params.loop ? parseInt(d(t.clickedSlide).attr("data-swiper-slide-index"), 10) : s, e.params.loop) {
        var _t49 = e.activeIndex;
        e.slides.eq(_t49).hasClass(e.params.slideDuplicateClass) && (e.loopFix(), e._clientLeft = e.$wrapperEl[0].clientLeft, _t49 = e.activeIndex);

        var _s45 = e.slides.eq(_t49).prevAll("[data-swiper-slide-index=\"".concat(i, "\"]")).eq(0).index(),
            _a26 = e.slides.eq(_t49).nextAll("[data-swiper-slide-index=\"".concat(i, "\"]")).eq(0).index();

        i = void 0 === _s45 ? _a26 : void 0 === _a26 ? _s45 : _a26 - _t49 < _t49 - _s45 ? _a26 : _s45;
      }

      e.slideTo(i);
    }

    function n() {
      var t = e.params.thumbs;
      if (a) return !1;
      a = !0;
      var s = e.constructor;
      if (t.swiper instanceof s) e.thumbs.swiper = t.swiper, Object.assign(e.thumbs.swiper.originalParams, {
        watchSlidesProgress: !0,
        slideToClickedSlide: !1
      }), Object.assign(e.thumbs.swiper.params, {
        watchSlidesProgress: !0,
        slideToClickedSlide: !1
      });else if (m(t.swiper)) {
        var _a27 = Object.assign({}, t.swiper);

        Object.assign(_a27, {
          watchSlidesProgress: !0,
          slideToClickedSlide: !1
        }), e.thumbs.swiper = new s(_a27), i = !0;
      }
      return e.thumbs.swiper.$el.addClass(e.params.thumbs.thumbsContainerClass), e.thumbs.swiper.on("tap", r), !0;
    }

    function l(t) {
      var s = e.thumbs.swiper;
      if (!s) return;
      var a = "auto" === s.params.slidesPerView ? s.slidesPerViewDynamic() : s.params.slidesPerView,
          i = e.params.thumbs.autoScrollOffset,
          r = i && !s.params.loop;

      if (e.realIndex !== s.realIndex || r) {
        var _n11,
            _l8,
            _o7 = s.activeIndex;

        if (s.params.loop) {
          s.slides.eq(_o7).hasClass(s.params.slideDuplicateClass) && (s.loopFix(), s._clientLeft = s.$wrapperEl[0].clientLeft, _o7 = s.activeIndex);

          var _t50 = s.slides.eq(_o7).prevAll("[data-swiper-slide-index=\"".concat(e.realIndex, "\"]")).eq(0).index(),
              _a28 = s.slides.eq(_o7).nextAll("[data-swiper-slide-index=\"".concat(e.realIndex, "\"]")).eq(0).index();

          _n11 = void 0 === _t50 ? _a28 : void 0 === _a28 ? _t50 : _a28 - _o7 == _o7 - _t50 ? s.params.slidesPerGroup > 1 ? _a28 : _o7 : _a28 - _o7 < _o7 - _t50 ? _a28 : _t50, _l8 = e.activeIndex > e.previousIndex ? "next" : "prev";
        } else _n11 = e.realIndex, _l8 = _n11 > e.previousIndex ? "next" : "prev";

        r && (_n11 += "next" === _l8 ? i : -1 * i), s.visibleSlidesIndexes && s.visibleSlidesIndexes.indexOf(_n11) < 0 && (s.params.centeredSlides ? _n11 = _n11 > _o7 ? _n11 - Math.floor(a / 2) + 1 : _n11 + Math.floor(a / 2) - 1 : _n11 > _o7 && s.params.slidesPerGroup, s.slideTo(_n11, t ? 0 : void 0));
      }

      var n = 1;
      var l = e.params.thumbs.slideThumbActiveClass;
      if (e.params.slidesPerView > 1 && !e.params.centeredSlides && (n = e.params.slidesPerView), e.params.thumbs.multipleActiveThumbs || (n = 1), n = Math.floor(n), s.slides.removeClass(l), s.params.loop || s.params.virtual && s.params.virtual.enabled) for (var _t51 = 0; _t51 < n; _t51 += 1) {
        s.$wrapperEl.children("[data-swiper-slide-index=\"".concat(e.realIndex + _t51, "\"]")).addClass(l);
      } else for (var _t52 = 0; _t52 < n; _t52 += 1) {
        s.slides.eq(e.realIndex + _t52).addClass(l);
      }
    }

    e.thumbs = {
      swiper: null
    }, s("beforeInit", function () {
      var t = e.params.thumbs;
      t && t.swiper && (n(), l(!0));
    }), s("slideChange update resize observerUpdate", function () {
      e.thumbs.swiper && l();
    }), s("setTransition", function (t, s) {
      var a = e.thumbs.swiper;
      a && a.setTransition(s);
    }), s("beforeDestroy", function () {
      var t = e.thumbs.swiper;
      t && i && t && t.destroy();
    }), Object.assign(e.thumbs, {
      init: n,
      update: l
    });
  }, function (_ref23) {
    var e = _ref23.swiper,
        t = _ref23.extendParams,
        s = _ref23.emit,
        a = _ref23.once;
    t({
      freeMode: {
        enabled: !1,
        momentum: !0,
        momentumRatio: 1,
        momentumBounce: !0,
        momentumBounceRatio: 1,
        momentumVelocityRatio: 1,
        sticky: !1,
        minimumVelocity: .02
      }
    }), Object.assign(e, {
      freeMode: {
        onTouchMove: function onTouchMove() {
          var t = e.touchEventsData,
              s = e.touches;
          0 === t.velocities.length && t.velocities.push({
            position: s[e.isHorizontal() ? "startX" : "startY"],
            time: t.touchStartTime
          }), t.velocities.push({
            position: s[e.isHorizontal() ? "currentX" : "currentY"],
            time: u()
          });
        },
        onTouchEnd: function onTouchEnd(_ref24) {
          var t = _ref24.currentPos;
          var i = e.params,
              r = e.$wrapperEl,
              n = e.rtlTranslate,
              l = e.snapGrid,
              o = e.touchEventsData,
              d = u() - o.touchStartTime;
          if (t < -e.minTranslate()) e.slideTo(e.activeIndex);else if (t > -e.maxTranslate()) e.slides.length < l.length ? e.slideTo(l.length - 1) : e.slideTo(e.slides.length - 1);else {
            if (i.freeMode.momentum) {
              if (o.velocities.length > 1) {
                var _t54 = o.velocities.pop(),
                    _s46 = o.velocities.pop(),
                    _a29 = _t54.position - _s46.position,
                    _r13 = _t54.time - _s46.time;

                e.velocity = _a29 / _r13, e.velocity /= 2, Math.abs(e.velocity) < i.freeMode.minimumVelocity && (e.velocity = 0), (_r13 > 150 || u() - _t54.time > 300) && (e.velocity = 0);
              } else e.velocity = 0;

              e.velocity *= i.freeMode.momentumVelocityRatio, o.velocities.length = 0;

              var _t53 = 1e3 * i.freeMode.momentumRatio;

              var _d6 = e.velocity * _t53;

              var _c4 = e.translate + _d6;

              n && (_c4 = -_c4);

              var _p,
                  _h = !1;

              var _m = 20 * Math.abs(e.velocity) * i.freeMode.momentumBounceRatio;

              var _f;

              if (_c4 < e.maxTranslate()) i.freeMode.momentumBounce ? (_c4 + e.maxTranslate() < -_m && (_c4 = e.maxTranslate() - _m), _p = e.maxTranslate(), _h = !0, o.allowMomentumBounce = !0) : _c4 = e.maxTranslate(), i.loop && i.centeredSlides && (_f = !0);else if (_c4 > e.minTranslate()) i.freeMode.momentumBounce ? (_c4 - e.minTranslate() > _m && (_c4 = e.minTranslate() + _m), _p = e.minTranslate(), _h = !0, o.allowMomentumBounce = !0) : _c4 = e.minTranslate(), i.loop && i.centeredSlides && (_f = !0);else if (i.freeMode.sticky) {
                var _t55;

                for (var _e70 = 0; _e70 < l.length; _e70 += 1) {
                  if (l[_e70] > -_c4) {
                    _t55 = _e70;
                    break;
                  }
                }

                _c4 = Math.abs(l[_t55] - _c4) < Math.abs(l[_t55 - 1] - _c4) || "next" === e.swipeDirection ? l[_t55] : l[_t55 - 1], _c4 = -_c4;
              }

              if (_f && a("transitionEnd", function () {
                e.loopFix();
              }), 0 !== e.velocity) {
                if (_t53 = n ? Math.abs((-_c4 - e.translate) / e.velocity) : Math.abs((_c4 - e.translate) / e.velocity), i.freeMode.sticky) {
                  var _s47 = Math.abs((n ? -_c4 : _c4) - e.translate),
                      _a30 = e.slidesSizesGrid[e.activeIndex];

                  _t53 = _s47 < _a30 ? i.speed : _s47 < 2 * _a30 ? 1.5 * i.speed : 2.5 * i.speed;
                }
              } else if (i.freeMode.sticky) return void e.slideToClosest();

              i.freeMode.momentumBounce && _h ? (e.updateProgress(_p), e.setTransition(_t53), e.setTranslate(_c4), e.transitionStart(!0, e.swipeDirection), e.animating = !0, r.transitionEnd(function () {
                e && !e.destroyed && o.allowMomentumBounce && (s("momentumBounce"), e.setTransition(i.speed), setTimeout(function () {
                  e.setTranslate(_p), r.transitionEnd(function () {
                    e && !e.destroyed && e.transitionEnd();
                  });
                }, 0));
              })) : e.velocity ? (s("_freeModeNoMomentumRelease"), e.updateProgress(_c4), e.setTransition(_t53), e.setTranslate(_c4), e.transitionStart(!0, e.swipeDirection), e.animating || (e.animating = !0, r.transitionEnd(function () {
                e && !e.destroyed && e.transitionEnd();
              }))) : e.updateProgress(_c4), e.updateActiveIndex(), e.updateSlidesClasses();
            } else {
              if (i.freeMode.sticky) return void e.slideToClosest();
              i.freeMode && s("_freeModeNoMomentumRelease");
            }

            (!i.freeMode.momentum || d >= i.longSwipesMs) && (e.updateProgress(), e.updateActiveIndex(), e.updateSlidesClasses());
          }
        }
      }
    });
  }, function (_ref25) {
    var e = _ref25.swiper,
        t = _ref25.extendParams;
    var s, a, i;
    t({
      grid: {
        rows: 1,
        fill: "column"
      }
    }), e.grid = {
      initSlides: function initSlides(t) {
        var r = e.params.slidesPerView,
            _e$params$grid = e.params.grid,
            n = _e$params$grid.rows,
            l = _e$params$grid.fill;
        a = s / n, i = Math.floor(t / n), s = Math.floor(t / n) === t / n ? t : Math.ceil(t / n) * n, "auto" !== r && "row" === l && (s = Math.max(s, r * n));
      },
      updateSlide: function updateSlide(t, r, n, l) {
        var _e$params3 = e.params,
            o = _e$params3.slidesPerGroup,
            d = _e$params3.spaceBetween,
            _e$params$grid2 = e.params.grid,
            c = _e$params$grid2.rows,
            p = _e$params$grid2.fill;
        var u, h, m;

        if ("row" === p && o > 1) {
          var _e71 = Math.floor(t / (o * c)),
              _a31 = t - c * o * _e71,
              _i18 = 0 === _e71 ? o : Math.min(Math.ceil((n - _e71 * c * o) / c), o);

          m = Math.floor(_a31 / _i18), h = _a31 - m * _i18 + _e71 * o, u = h + m * s / c, r.css({
            "-webkit-order": u,
            order: u
          });
        } else "column" === p ? (h = Math.floor(t / c), m = t - h * c, (h > i || h === i && m === c - 1) && (m += 1, m >= c && (m = 0, h += 1))) : (m = Math.floor(t / a), h = t - m * a);

        r.css(l("margin-top"), 0 !== m ? d && "".concat(d, "px") : "");
      },
      updateWrapperSize: function updateWrapperSize(t, a, i) {
        var _e$params4 = e.params,
            r = _e$params4.spaceBetween,
            n = _e$params4.centeredSlides,
            l = _e$params4.roundLengths,
            o = e.params.grid.rows;

        if (e.virtualSize = (t + r) * s, e.virtualSize = Math.ceil(e.virtualSize / o) - r, e.$wrapperEl.css(_defineProperty({}, i("width"), "".concat(e.virtualSize + r, "px"))), n) {
          a.splice(0, a.length);
          var _t56 = [];

          for (var _s48 = 0; _s48 < a.length; _s48 += 1) {
            var _i19 = a[_s48];
            l && (_i19 = Math.floor(_i19)), a[_s48] < e.virtualSize + a[0] && _t56.push(_i19);
          }

          a.push.apply(a, _t56);
        }
      }
    };
  }, function (_ref26) {
    var e = _ref26.swiper;
    Object.assign(e, {
      appendSlide: R.bind(e),
      prependSlide: j.bind(e),
      addSlide: _.bind(e),
      removeSlide: V.bind(e),
      removeAllSlides: q.bind(e)
    });
  }, function (_ref27) {
    var e = _ref27.swiper,
        t = _ref27.extendParams,
        s = _ref27.on;
    t({
      fadeEffect: {
        crossFade: !1,
        transformEl: null
      }
    }), F({
      effect: "fade",
      swiper: e,
      on: s,
      setTranslate: function setTranslate() {
        var t = e.slides,
            s = e.params.fadeEffect;

        for (var _a32 = 0; _a32 < t.length; _a32 += 1) {
          var _t57 = e.slides.eq(_a32);

          var _i20 = -_t57[0].swiperSlideOffset;

          e.params.virtualTranslate || (_i20 -= e.translate);
          var _r14 = 0;
          e.isHorizontal() || (_r14 = _i20, _i20 = 0);

          var _n12 = e.params.fadeEffect.crossFade ? Math.max(1 - Math.abs(_t57[0].progress), 0) : 1 + Math.min(Math.max(_t57[0].progress, -1), 0);

          U(s, _t57).css({
            opacity: _n12
          }).transform("translate3d(".concat(_i20, "px, ").concat(_r14, "px, 0px)"));
        }
      },
      setTransition: function setTransition(t) {
        var s = e.params.fadeEffect.transformEl;
        (s ? e.slides.find(s) : e.slides).transition(t), K({
          swiper: e,
          duration: t,
          transformEl: s,
          allSlides: !0
        });
      },
      overwriteParams: function overwriteParams() {
        return {
          slidesPerView: 1,
          slidesPerGroup: 1,
          watchSlidesProgress: !0,
          spaceBetween: 0,
          virtualTranslate: !e.params.cssMode
        };
      }
    });
  }, function (_ref28) {
    var e = _ref28.swiper,
        t = _ref28.extendParams,
        s = _ref28.on;
    t({
      cubeEffect: {
        slideShadows: !0,
        shadow: !0,
        shadowOffset: 20,
        shadowScale: .94
      }
    }), F({
      effect: "cube",
      swiper: e,
      on: s,
      setTranslate: function setTranslate() {
        var t = e.$el,
            s = e.$wrapperEl,
            a = e.slides,
            i = e.width,
            r = e.height,
            n = e.rtlTranslate,
            l = e.size,
            o = e.browser,
            c = e.params.cubeEffect,
            p = e.isHorizontal(),
            u = e.virtual && e.params.virtual.enabled;
        var h,
            m = 0;
        c.shadow && (p ? (h = s.find(".swiper-cube-shadow"), 0 === h.length && (h = d('<div class="swiper-cube-shadow"></div>'), s.append(h)), h.css({
          height: "".concat(i, "px")
        })) : (h = t.find(".swiper-cube-shadow"), 0 === h.length && (h = d('<div class="swiper-cube-shadow"></div>'), t.append(h))));

        for (var _e72 = 0; _e72 < a.length; _e72 += 1) {
          var _t58 = a.eq(_e72);

          var _s49 = _e72;
          u && (_s49 = parseInt(_t58.attr("data-swiper-slide-index"), 10));

          var _i21 = 90 * _s49,
              _r15 = Math.floor(_i21 / 360);

          n && (_i21 = -_i21, _r15 = Math.floor(-_i21 / 360));

          var _o8 = Math.max(Math.min(_t58[0].progress, 1), -1);

          var _h2 = 0,
              _f2 = 0,
              _g = 0;
          _s49 % 4 == 0 ? (_h2 = 4 * -_r15 * l, _g = 0) : (_s49 - 1) % 4 == 0 ? (_h2 = 0, _g = 4 * -_r15 * l) : (_s49 - 2) % 4 == 0 ? (_h2 = l + 4 * _r15 * l, _g = l) : (_s49 - 3) % 4 == 0 && (_h2 = -l, _g = 3 * l + 4 * l * _r15), n && (_h2 = -_h2), p || (_f2 = _h2, _h2 = 0);

          var _v = "rotateX(".concat(p ? 0 : -_i21, "deg) rotateY(").concat(p ? _i21 : 0, "deg) translate3d(").concat(_h2, "px, ").concat(_f2, "px, ").concat(_g, "px)");

          if (_o8 <= 1 && _o8 > -1 && (m = 90 * _s49 + 90 * _o8, n && (m = 90 * -_s49 - 90 * _o8)), _t58.transform(_v), c.slideShadows) {
            var _e73 = p ? _t58.find(".swiper-slide-shadow-left") : _t58.find(".swiper-slide-shadow-top"),
                _s50 = p ? _t58.find(".swiper-slide-shadow-right") : _t58.find(".swiper-slide-shadow-bottom");

            0 === _e73.length && (_e73 = d("<div class=\"swiper-slide-shadow-".concat(p ? "left" : "top", "\"></div>")), _t58.append(_e73)), 0 === _s50.length && (_s50 = d("<div class=\"swiper-slide-shadow-".concat(p ? "right" : "bottom", "\"></div>")), _t58.append(_s50)), _e73.length && (_e73[0].style.opacity = Math.max(-_o8, 0)), _s50.length && (_s50[0].style.opacity = Math.max(_o8, 0));
          }
        }

        if (s.css({
          "-webkit-transform-origin": "50% 50% -".concat(l / 2, "px"),
          "transform-origin": "50% 50% -".concat(l / 2, "px")
        }), c.shadow) if (p) h.transform("translate3d(0px, ".concat(i / 2 + c.shadowOffset, "px, ").concat(-i / 2, "px) rotateX(90deg) rotateZ(0deg) scale(").concat(c.shadowScale, ")"));else {
          var _e74 = Math.abs(m) - 90 * Math.floor(Math.abs(m) / 90),
              _t59 = 1.5 - (Math.sin(2 * _e74 * Math.PI / 360) / 2 + Math.cos(2 * _e74 * Math.PI / 360) / 2),
              _s51 = c.shadowScale,
              _a33 = c.shadowScale / _t59,
              _i22 = c.shadowOffset;

          h.transform("scale3d(".concat(_s51, ", 1, ").concat(_a33, ") translate3d(0px, ").concat(r / 2 + _i22, "px, ").concat(-r / 2 / _a33, "px) rotateX(-90deg)"));
        }
        var f = o.isSafari || o.isWebView ? -l / 2 : 0;
        s.transform("translate3d(0px,0,".concat(f, "px) rotateX(").concat(e.isHorizontal() ? 0 : m, "deg) rotateY(").concat(e.isHorizontal() ? -m : 0, "deg)"));
      },
      setTransition: function setTransition(t) {
        var s = e.$el,
            a = e.slides;
        a.transition(t).find(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").transition(t), e.params.cubeEffect.shadow && !e.isHorizontal() && s.find(".swiper-cube-shadow").transition(t);
      },
      perspective: function perspective() {
        return !0;
      },
      overwriteParams: function overwriteParams() {
        return {
          slidesPerView: 1,
          slidesPerGroup: 1,
          watchSlidesProgress: !0,
          resistanceRatio: 0,
          spaceBetween: 0,
          centeredSlides: !1,
          virtualTranslate: !0
        };
      }
    });
  }, function (_ref29) {
    var e = _ref29.swiper,
        t = _ref29.extendParams,
        s = _ref29.on;
    t({
      flipEffect: {
        slideShadows: !0,
        limitRotation: !0,
        transformEl: null
      }
    }), F({
      effect: "flip",
      swiper: e,
      on: s,
      setTranslate: function setTranslate() {
        var t = e.slides,
            s = e.rtlTranslate,
            a = e.params.flipEffect;

        for (var _i23 = 0; _i23 < t.length; _i23 += 1) {
          var _r16 = t.eq(_i23);

          var _n13 = _r16[0].progress;
          e.params.flipEffect.limitRotation && (_n13 = Math.max(Math.min(_r16[0].progress, 1), -1));
          var _l9 = _r16[0].swiperSlideOffset;

          var _o9 = -180 * _n13,
              _d7 = 0,
              _c5 = e.params.cssMode ? -_l9 - e.translate : -_l9,
              _p2 = 0;

          if (e.isHorizontal() ? s && (_o9 = -_o9) : (_p2 = _c5, _c5 = 0, _d7 = -_o9, _o9 = 0), _r16[0].style.zIndex = -Math.abs(Math.round(_n13)) + t.length, a.slideShadows) {
            var _t60 = e.isHorizontal() ? _r16.find(".swiper-slide-shadow-left") : _r16.find(".swiper-slide-shadow-top"),
                _s52 = e.isHorizontal() ? _r16.find(".swiper-slide-shadow-right") : _r16.find(".swiper-slide-shadow-bottom");

            0 === _t60.length && (_t60 = Z(a, _r16, e.isHorizontal() ? "left" : "top")), 0 === _s52.length && (_s52 = Z(a, _r16, e.isHorizontal() ? "right" : "bottom")), _t60.length && (_t60[0].style.opacity = Math.max(-_n13, 0)), _s52.length && (_s52[0].style.opacity = Math.max(_n13, 0));
          }

          var _u3 = "translate3d(".concat(_c5, "px, ").concat(_p2, "px, 0px) rotateX(").concat(_d7, "deg) rotateY(").concat(_o9, "deg)");

          U(a, _r16).transform(_u3);
        }
      },
      setTransition: function setTransition(t) {
        var s = e.params.flipEffect.transformEl;
        (s ? e.slides.find(s) : e.slides).transition(t).find(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").transition(t), K({
          swiper: e,
          duration: t,
          transformEl: s
        });
      },
      perspective: function perspective() {
        return !0;
      },
      overwriteParams: function overwriteParams() {
        return {
          slidesPerView: 1,
          slidesPerGroup: 1,
          watchSlidesProgress: !0,
          spaceBetween: 0,
          virtualTranslate: !e.params.cssMode
        };
      }
    });
  }, function (_ref30) {
    var e = _ref30.swiper,
        t = _ref30.extendParams,
        s = _ref30.on;
    t({
      coverflowEffect: {
        rotate: 50,
        stretch: 0,
        depth: 100,
        scale: 1,
        modifier: 1,
        slideShadows: !0,
        transformEl: null
      }
    }), F({
      effect: "coverflow",
      swiper: e,
      on: s,
      setTranslate: function setTranslate() {
        var t = e.width,
            s = e.height,
            a = e.slides,
            i = e.slidesSizesGrid,
            r = e.params.coverflowEffect,
            n = e.isHorizontal(),
            l = e.translate,
            o = n ? t / 2 - l : s / 2 - l,
            d = n ? r.rotate : -r.rotate,
            c = r.depth;

        for (var _e75 = 0, _t61 = a.length; _e75 < _t61; _e75 += 1) {
          var _t62 = a.eq(_e75),
              _s53 = i[_e75],
              _l10 = (o - _t62[0].swiperSlideOffset - _s53 / 2) / _s53 * r.modifier;

          var _p3 = n ? d * _l10 : 0,
              _u4 = n ? 0 : d * _l10,
              _h3 = -c * Math.abs(_l10),
              _m2 = r.stretch;

          "string" == typeof _m2 && -1 !== _m2.indexOf("%") && (_m2 = parseFloat(r.stretch) / 100 * _s53);

          var _f3 = n ? 0 : _m2 * _l10,
              _g2 = n ? _m2 * _l10 : 0,
              _v2 = 1 - (1 - r.scale) * Math.abs(_l10);

          Math.abs(_g2) < .001 && (_g2 = 0), Math.abs(_f3) < .001 && (_f3 = 0), Math.abs(_h3) < .001 && (_h3 = 0), Math.abs(_p3) < .001 && (_p3 = 0), Math.abs(_u4) < .001 && (_u4 = 0), Math.abs(_v2) < .001 && (_v2 = 0);

          var _w = "translate3d(".concat(_g2, "px,").concat(_f3, "px,").concat(_h3, "px)  rotateX(").concat(_u4, "deg) rotateY(").concat(_p3, "deg) scale(").concat(_v2, ")");

          if (U(r, _t62).transform(_w), _t62[0].style.zIndex = 1 - Math.abs(Math.round(_l10)), r.slideShadows) {
            var _e76 = n ? _t62.find(".swiper-slide-shadow-left") : _t62.find(".swiper-slide-shadow-top"),
                _s54 = n ? _t62.find(".swiper-slide-shadow-right") : _t62.find(".swiper-slide-shadow-bottom");

            0 === _e76.length && (_e76 = Z(r, _t62, n ? "left" : "top")), 0 === _s54.length && (_s54 = Z(r, _t62, n ? "right" : "bottom")), _e76.length && (_e76[0].style.opacity = _l10 > 0 ? _l10 : 0), _s54.length && (_s54[0].style.opacity = -_l10 > 0 ? -_l10 : 0);
          }
        }
      },
      setTransition: function setTransition(t) {
        var s = e.params.coverflowEffect.transformEl;
        (s ? e.slides.find(s) : e.slides).transition(t).find(".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left").transition(t);
      },
      perspective: function perspective() {
        return !0;
      },
      overwriteParams: function overwriteParams() {
        return {
          watchSlidesProgress: !0
        };
      }
    });
  }, function (_ref31) {
    var e = _ref31.swiper,
        t = _ref31.extendParams,
        s = _ref31.on;
    t({
      creativeEffect: {
        transformEl: null,
        limitProgress: 1,
        shadowPerProgress: !1,
        progressMultiplier: 1,
        perspective: !0,
        prev: {
          translate: [0, 0, 0],
          rotate: [0, 0, 0],
          opacity: 1,
          scale: 1
        },
        next: {
          translate: [0, 0, 0],
          rotate: [0, 0, 0],
          opacity: 1,
          scale: 1
        }
      }
    });

    var a = function a(e) {
      return "string" == typeof e ? e : "".concat(e, "px");
    };

    F({
      effect: "creative",
      swiper: e,
      on: s,
      setTranslate: function setTranslate() {
        var t = e.slides,
            s = e.params.creativeEffect,
            i = s.progressMultiplier;

        var _loop = function _loop(_r17) {
          var n = t.eq(_r17),
              l = n[0].progress,
              o = Math.min(Math.max(n[0].progress, -s.limitProgress), s.limitProgress),
              d = n[0].swiperSlideOffset,
              c = [e.params.cssMode ? -d - e.translate : -d, 0, 0],
              p = [0, 0, 0];
          var u = !1;
          e.isHorizontal() || (c[1] = c[0], c[0] = 0);
          var h = {
            translate: [0, 0, 0],
            rotate: [0, 0, 0],
            scale: 1,
            opacity: 1
          };
          o < 0 ? (h = s.next, u = !0) : o > 0 && (h = s.prev, u = !0), c.forEach(function (e, t) {
            c[t] = "calc(".concat(e, "px + (").concat(a(h.translate[t]), " * ").concat(Math.abs(o * i), "))");
          }), p.forEach(function (e, t) {
            p[t] = h.rotate[t] * Math.abs(o * i);
          }), n[0].style.zIndex = -Math.abs(Math.round(l)) + t.length;
          var m = c.join(", "),
              f = "rotateX(".concat(p[0], "deg) rotateY(").concat(p[1], "deg) rotateZ(").concat(p[2], "deg)"),
              g = o < 0 ? "scale(".concat(1 + (1 - h.scale) * o * i, ")") : "scale(".concat(1 - (1 - h.scale) * o * i, ")"),
              v = o < 0 ? 1 + (1 - h.opacity) * o * i : 1 - (1 - h.opacity) * o * i,
              w = "translate3d(".concat(m, ") ").concat(f, " ").concat(g);

          if (u && h.shadow || !u) {
            var _e77 = n.children(".swiper-slide-shadow");

            if (0 === _e77.length && h.shadow && (_e77 = Z(s, n)), _e77.length) {
              var _t63 = s.shadowPerProgress ? o * (1 / s.limitProgress) : o;

              _e77[0].style.opacity = Math.min(Math.max(Math.abs(_t63), 0), 1);
            }
          }

          var b = U(s, n);
          b.transform(w).css({
            opacity: v
          }), h.origin && b.css("transform-origin", h.origin);
        };

        for (var _r17 = 0; _r17 < t.length; _r17 += 1) {
          _loop(_r17);
        }
      },
      setTransition: function setTransition(t) {
        var s = e.params.creativeEffect.transformEl;
        (s ? e.slides.find(s) : e.slides).transition(t).find(".swiper-slide-shadow").transition(t), K({
          swiper: e,
          duration: t,
          transformEl: s
        });
      },
      perspective: function perspective() {
        return e.params.creativeEffect.perspective;
      },
      overwriteParams: function overwriteParams() {
        return {
          watchSlidesProgress: !0,
          virtualTranslate: !e.params.cssMode
        };
      }
    });
  }, function (_ref32) {
    var e = _ref32.swiper,
        t = _ref32.extendParams,
        s = _ref32.on;
    t({
      cardsEffect: {
        slideShadows: !0,
        transformEl: null
      }
    }), F({
      effect: "cards",
      swiper: e,
      on: s,
      setTranslate: function setTranslate() {
        var t = e.slides,
            s = e.activeIndex,
            a = e.params.cardsEffect,
            _e$touchEventsData = e.touchEventsData,
            i = _e$touchEventsData.startTranslate,
            r = _e$touchEventsData.isTouched,
            n = e.translate;

        for (var _l11 = 0; _l11 < t.length; _l11 += 1) {
          var _o10 = t.eq(_l11),
              _d8 = _o10[0].progress,
              _c6 = Math.min(Math.max(_d8, -4), 4);

          var _p4 = _o10[0].swiperSlideOffset;
          e.params.centeredSlides && !e.params.cssMode && e.$wrapperEl.transform("translateX(".concat(e.minTranslate(), "px)")), e.params.centeredSlides && e.params.cssMode && (_p4 -= t[0].swiperSlideOffset);

          var _u5 = e.params.cssMode ? -_p4 - e.translate : -_p4,
              _h4 = 0;

          var _m3 = -100 * Math.abs(_c6);

          var _f4 = 1,
              _g3 = -2 * _c6,
              _v3 = 8 - .75 * Math.abs(_c6);

          var _w2 = (_l11 === s || _l11 === s - 1) && _c6 > 0 && _c6 < 1 && (r || e.params.cssMode) && n < i,
              _b = (_l11 === s || _l11 === s + 1) && _c6 < 0 && _c6 > -1 && (r || e.params.cssMode) && n > i;

          if (_w2 || _b) {
            var _e78 = Math.pow(1 - Math.abs((Math.abs(_c6) - .5) / .5), .5);

            _g3 += -28 * _c6 * _e78, _f4 += -.5 * _e78, _v3 += 96 * _e78, _h4 = -25 * _e78 * Math.abs(_c6) + "%";
          }

          if (_u5 = _c6 < 0 ? "calc(".concat(_u5, "px + (").concat(_v3 * Math.abs(_c6), "%))") : _c6 > 0 ? "calc(".concat(_u5, "px + (-").concat(_v3 * Math.abs(_c6), "%))") : "".concat(_u5, "px"), !e.isHorizontal()) {
            var _e79 = _h4;
            _h4 = _u5, _u5 = _e79;
          }

          var _x = "\n        translate3d(".concat(_u5, ", ").concat(_h4, ", ").concat(_m3, "px)\n        rotateZ(").concat(_g3, "deg)\n        scale(").concat(_c6 < 0 ? "" + (1 + (1 - _f4) * _c6) : "" + (1 - (1 - _f4) * _c6), ")\n      ");

          if (a.slideShadows) {
            var _e80 = _o10.find(".swiper-slide-shadow");

            0 === _e80.length && (_e80 = Z(a, _o10)), _e80.length && (_e80[0].style.opacity = Math.min(Math.max((Math.abs(_c6) - .5) / .5, 0), 1));
          }

          _o10[0].style.zIndex = -Math.abs(Math.round(_d8)) + t.length;
          U(a, _o10).transform(_x);
        }
      },
      setTransition: function setTransition(t) {
        var s = e.params.cardsEffect.transformEl;
        (s ? e.slides.find(s) : e.slides).transition(t).find(".swiper-slide-shadow").transition(t), K({
          swiper: e,
          duration: t,
          transformEl: s
        });
      },
      perspective: function perspective() {
        return !0;
      },
      overwriteParams: function overwriteParams() {
        return {
          watchSlidesProgress: !0,
          virtualTranslate: !e.params.cssMode
        };
      }
    });
  }];
  return H.use(J), H;
});
"use strict";

/*! WOW - v1.0.2 - 2014-10-28
* Copyright (c) 2014 Matthieu Aussaguel; Licensed MIT */
(function () {
  var a,
      b,
      c,
      d,
      e,
      f = function f(a, b) {
    return function () {
      return a.apply(b, arguments);
    };
  },
      g = [].indexOf || function (a) {
    for (var b = 0, c = this.length; c > b; b++) {
      if (b in this && this[b] === a) return b;
    }

    return -1;
  };

  b = function () {
    function a() {}

    return a.prototype.extend = function (a, b) {
      var c, d;

      for (c in b) {
        d = b[c], null == a[c] && (a[c] = d);
      }

      return a;
    }, a.prototype.isMobile = function (a) {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(a);
    }, a.prototype.addEvent = function (a, b, c) {
      return null != a.addEventListener ? a.addEventListener(b, c, !1) : null != a.attachEvent ? a.attachEvent("on" + b, c) : a[b] = c;
    }, a.prototype.removeEvent = function (a, b, c) {
      return null != a.removeEventListener ? a.removeEventListener(b, c, !1) : null != a.detachEvent ? a.detachEvent("on" + b, c) : delete a[b];
    }, a.prototype.innerHeight = function () {
      return "innerHeight" in window ? window.innerHeight : document.documentElement.clientHeight;
    }, a;
  }(), c = this.WeakMap || this.MozWeakMap || (c = function () {
    function a() {
      this.keys = [], this.values = [];
    }

    return a.prototype.get = function (a) {
      var b, c, d, e, f;

      for (f = this.keys, b = d = 0, e = f.length; e > d; b = ++d) {
        if (c = f[b], c === a) return this.values[b];
      }
    }, a.prototype.set = function (a, b) {
      var c, d, e, f, g;

      for (g = this.keys, c = e = 0, f = g.length; f > e; c = ++e) {
        if (d = g[c], d === a) return void (this.values[c] = b);
      }

      return this.keys.push(a), this.values.push(b);
    }, a;
  }()), a = this.MutationObserver || this.WebkitMutationObserver || this.MozMutationObserver || (a = function () {
    function a() {
      "undefined" != typeof console && null !== console && console.warn("MutationObserver is not supported by your browser."), "undefined" != typeof console && null !== console && console.warn("WOW.js cannot detect dom mutations, please call .sync() after loading new content.");
    }

    return a.notSupported = !0, a.prototype.observe = function () {}, a;
  }()), d = this.getComputedStyle || function (a) {
    return this.getPropertyValue = function (b) {
      var c;
      return "float" === b && (b = "styleFloat"), e.test(b) && b.replace(e, function (a, b) {
        return b.toUpperCase();
      }), (null != (c = a.currentStyle) ? c[b] : void 0) || null;
    }, this;
  }, e = /(\-([a-z]){1})/g, this.WOW = function () {
    function e(a) {
      null == a && (a = {}), this.scrollCallback = f(this.scrollCallback, this), this.scrollHandler = f(this.scrollHandler, this), this.start = f(this.start, this), this.scrolled = !0, this.config = this.util().extend(a, this.defaults), this.animationNameCache = new c();
    }

    return e.prototype.defaults = {
      boxClass: "wow",
      animateClass: "animated",
      offset: 0,
      mobile: !0,
      live: !0
    }, e.prototype.init = function () {
      var a;
      return this.element = window.document.documentElement, "interactive" === (a = document.readyState) || "complete" === a ? this.start() : this.util().addEvent(document, "DOMContentLoaded", this.start), this.finished = [];
    }, e.prototype.start = function () {
      var b, c, d, e;
      if (this.stopped = !1, this.boxes = function () {
        var a, c, d, e;

        for (d = this.element.querySelectorAll("." + this.config.boxClass), e = [], a = 0, c = d.length; c > a; a++) {
          b = d[a], e.push(b);
        }

        return e;
      }.call(this), this.all = function () {
        var a, c, d, e;

        for (d = this.boxes, e = [], a = 0, c = d.length; c > a; a++) {
          b = d[a], e.push(b);
        }

        return e;
      }.call(this), this.boxes.length) if (this.disabled()) this.resetStyle();else for (e = this.boxes, c = 0, d = e.length; d > c; c++) {
        b = e[c], this.applyStyle(b, !0);
      }
      return this.disabled() || (this.util().addEvent(window, "scroll", this.scrollHandler), this.util().addEvent(window, "resize", this.scrollHandler), this.interval = setInterval(this.scrollCallback, 50)), this.config.live ? new a(function (a) {
        return function (b) {
          var c, d, e, f, g;

          for (g = [], e = 0, f = b.length; f > e; e++) {
            d = b[e], g.push(function () {
              var a, b, e, f;

              for (e = d.addedNodes || [], f = [], a = 0, b = e.length; b > a; a++) {
                c = e[a], f.push(this.doSync(c));
              }

              return f;
            }.call(a));
          }

          return g;
        };
      }(this)).observe(document.body, {
        childList: !0,
        subtree: !0
      }) : void 0;
    }, e.prototype.stop = function () {
      return this.stopped = !0, this.util().removeEvent(window, "scroll", this.scrollHandler), this.util().removeEvent(window, "resize", this.scrollHandler), null != this.interval ? clearInterval(this.interval) : void 0;
    }, e.prototype.sync = function () {
      return a.notSupported ? this.doSync(this.element) : void 0;
    }, e.prototype.doSync = function (a) {
      var b, c, d, e, f;

      if (null == a && (a = this.element), 1 === a.nodeType) {
        for (a = a.parentNode || a, e = a.querySelectorAll("." + this.config.boxClass), f = [], c = 0, d = e.length; d > c; c++) {
          b = e[c], g.call(this.all, b) < 0 ? (this.boxes.push(b), this.all.push(b), this.stopped || this.disabled() ? this.resetStyle() : this.applyStyle(b, !0), f.push(this.scrolled = !0)) : f.push(void 0);
        }

        return f;
      }
    }, e.prototype.show = function (a) {
      return this.applyStyle(a), a.className = "" + a.className + " " + this.config.animateClass;
    }, e.prototype.applyStyle = function (a, b) {
      var c, d, e;
      return d = a.getAttribute("data-wow-duration"), c = a.getAttribute("data-wow-delay"), e = a.getAttribute("data-wow-iteration"), this.animate(function (f) {
        return function () {
          return f.customStyle(a, b, d, c, e);
        };
      }(this));
    }, e.prototype.animate = function () {
      return "requestAnimationFrame" in window ? function (a) {
        return window.requestAnimationFrame(a);
      } : function (a) {
        return a();
      };
    }(), e.prototype.resetStyle = function () {
      var a, b, c, d, e;

      for (d = this.boxes, e = [], b = 0, c = d.length; c > b; b++) {
        a = d[b], e.push(a.style.visibility = "visible");
      }

      return e;
    }, e.prototype.customStyle = function (a, b, c, d, e) {
      return b && this.cacheAnimationName(a), a.style.visibility = b ? "hidden" : "visible", c && this.vendorSet(a.style, {
        animationDuration: c
      }), d && this.vendorSet(a.style, {
        animationDelay: d
      }), e && this.vendorSet(a.style, {
        animationIterationCount: e
      }), this.vendorSet(a.style, {
        animationName: b ? "none" : this.cachedAnimationName(a)
      }), a;
    }, e.prototype.vendors = ["moz", "webkit"], e.prototype.vendorSet = function (a, b) {
      var c, d, e, f;
      f = [];

      for (c in b) {
        d = b[c], a["" + c] = d, f.push(function () {
          var b, f, g, h;

          for (g = this.vendors, h = [], b = 0, f = g.length; f > b; b++) {
            e = g[b], h.push(a["" + e + c.charAt(0).toUpperCase() + c.substr(1)] = d);
          }

          return h;
        }.call(this));
      }

      return f;
    }, e.prototype.vendorCSS = function (a, b) {
      var c, e, f, g, h, i;

      for (e = d(a), c = e.getPropertyCSSValue(b), i = this.vendors, g = 0, h = i.length; h > g; g++) {
        f = i[g], c = c || e.getPropertyCSSValue("-" + f + "-" + b);
      }

      return c;
    }, e.prototype.animationName = function (a) {
      var b;

      try {
        b = this.vendorCSS(a, "animation-name").cssText;
      } catch (c) {
        b = d(a).getPropertyValue("animation-name");
      }

      return "none" === b ? "" : b;
    }, e.prototype.cacheAnimationName = function (a) {
      return this.animationNameCache.set(a, this.animationName(a));
    }, e.prototype.cachedAnimationName = function (a) {
      return this.animationNameCache.get(a);
    }, e.prototype.scrollHandler = function () {
      return this.scrolled = !0;
    }, e.prototype.scrollCallback = function () {
      var a;
      return !this.scrolled || (this.scrolled = !1, this.boxes = function () {
        var b, c, d, e;

        for (d = this.boxes, e = [], b = 0, c = d.length; c > b; b++) {
          a = d[b], a && (this.isVisible(a) ? this.show(a) : e.push(a));
        }

        return e;
      }.call(this), this.boxes.length || this.config.live) ? void 0 : this.stop();
    }, e.prototype.offsetTop = function (a) {
      for (var b; void 0 === a.offsetTop;) {
        a = a.parentNode;
      }

      for (b = a.offsetTop; a = a.offsetParent;) {
        b += a.offsetTop;
      }

      return b;
    }, e.prototype.isVisible = function (a) {
      var b, c, d, e, f;
      return c = a.getAttribute("data-wow-offset") || this.config.offset, f = window.pageYOffset, e = f + Math.min(this.element.clientHeight, this.util().innerHeight()) - c, d = this.offsetTop(a), b = d + a.clientHeight, e >= d && b >= f;
    }, e.prototype.util = function () {
      return null != this._util ? this._util : this._util = new b();
    }, e.prototype.disabled = function () {
      return !this.config.mobile && this.util().isMobile(navigator.userAgent);
    }, e;
  }();
}).call(void 0);