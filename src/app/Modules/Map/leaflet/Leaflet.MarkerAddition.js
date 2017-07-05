var proto_initIcon = L.Marker.prototype._initIcon;
var proto_setPos = L.Marker.prototype._setPos;
var oldIE = (L.DomUtil.TRANSFORM === 'msTransform');

L.Marker.addInitHook(function() {
  this.options.rotationOrigin = this.options.rotationOrigin || 'center top';
  this.options.rotationAngle = this.options.rotationAngle || 0;
  this.options.textMuted = this.options.textMuted || false;
});

L.Marker.include({
  _initIcon: function() {
    proto_initIcon.call(this);
  },

  _setPos: function(pos) {
    proto_setPos.call(this, pos);

    if (this.options.rotationAngle) {
      this._icon.style[L.DomUtil.TRANSFORM + 'Origin'] = this.options.rotationOrigin || 'center top';

      if (oldIE) {
        // for IE 9, use the 2D rotation
        this._icon.style[L.DomUtil.TRANSFORM] = ' rotate(' + this.options.rotationAngle + 'deg)';
      } else {
        // for modern browsers, prefer the 3D accelerated version
        this._icon.style[L.DomUtil.TRANSFORM] += ' rotateZ(' + this.options.rotationAngle + 'deg)';
      }
    }

    if(this.options.textMuted) {
      this._icon.classList.add('text-muted');
    } else {
      this._icon.classList.remove('text-muted');
    }
  },

  setRotationAngle: function(angle) {
    this.options.rotationAngle = angle;
    this.update();
    return this;
  },

  setRotationOrigin: function(origin) {
    this.options.rotationOrigin = origin;
    this.update();
    return this;
  },

  setHightLight: function() {
    this._icon.classList.add("highlight");
  },

  disableHightLight: function() {
    this._icon.classList.remove("highlight");
  },

  setMessageCountAngle: function(angle) {
    if (this._icon.children[1]) {
      if (oldIE) {
        // for IE 9, use the 2D rotation
        this._icon.children[1].style[L.DomUtil.TRANSFORM] = ' rotate(' + '-' + this.options.rotationAngle + 'deg)';
      } else {
        // for modern browsers, prefer the 3D accelerated version
        this._icon.children[1].style[L.DomUtil.TRANSFORM] += ' rotateZ(' + '-' + this.options.rotationAngle + 'deg)';
      }
    }
  },

  showIndicator: function() {
    this._icon.classList.add('progress-cursor');
  },

  removeIndicator: function() {
    this._icon.classList.remove('progress-cursor');
  },

  setTextMuted: function() {
    this._icon.classList.add('text-muted');
  },

  removeTextMuted: function() {
    this._icon.classList.remove('text-muted');
  }
});
