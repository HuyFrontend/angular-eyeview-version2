L.Donut = L.Circle.extend({
  initialize: function(latlng, outerRadius, innerRadius, options) {
    L.Path.prototype.initialize.call(this, options);

    this._latlng = L.latLng(latlng);
    this._mOuterRadius = outerRadius;
    this._mInnerRadius = this._validateInnerRadius(outerRadius, innerRadius);
  },

  setRadius: function(outerRadius, innerRadius) {
    this._mOuterRadius = outerRadius;
    this._mInnerRadius = this._validateInnerRadius(outerRadius, innerRadius);
    return this.redraw();
  },

  projectLatlngs: function() {
    let lngRadius = this._getLngRadius(),
      latlng = this._latlng,
      outerPointLeft = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius[0].left]),
      outerPointTop = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius[0].top]),
      innerPointLeft = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius[1].left]),
      innerPointTop = this._map.latLngToLayerPoint([latlng.lat, latlng.lng - lngRadius[1].top]);

    this._point = this._map.latLngToLayerPoint(latlng);
    this._outerRadius = Math.max(this._point.x - outerPointLeft.x, 1);
    this._outerRadiusTop = Math.max(this._point.x - outerPointTop.x, 1);
    this._innerRadius = Math.max(this._point.x - innerPointLeft.x, 1);
    this._innerRadiusTop = Math.max(this._point.x - innerPointTop.x, 1);
  },

  getBounds: function() {
    let lngRadius = this._getLngRadius()[0],
      latRadius = this._getLatRadius()[0],
      latlng = this._latlng;

    return new L.LatLngBounds(
      [latlng.lat - latRadius, latlng.lng - lngRadius], [latlng.lat + latRadius, latlng.lng + lngRadius]);
  },

  getRadius: function() {
    return [this._mOuterRadius, this._mInnerRadius];
  },

  _getLatRadius: function() {
    return [{
      top: (this._mOuterRadius[0] / 40075017) * 360,
      left: (this._mOuterRadius[1] / 40075017) * 360
    }, {
      top: (this._mInnerRadius[0] / 40075017) * 360,
      left: (this._mInnerRadius[1] / 40075017) * 360
    }];
  },

  _getLngRadius: function() {
    let radii = this._getLatRadius();
    return [{
      top: (radii[0].top / Math.cos(L.LatLng.DEG_TO_RAD * this._latlng.lat)),
      left: (radii[0].left / Math.cos(L.LatLng.DEG_TO_RAD * this._latlng.lat))
    }, {
      top: (radii[1].top / Math.cos(L.LatLng.DEG_TO_RAD * this._latlng.lat)),
      left: (radii[1].left / Math.cos(L.LatLng.DEG_TO_RAD * this._latlng.lat))
    }];
  },

  _checkIfEmpty: function() {
    if (!this._map) {
      return false;
    }

    var vp = this._map._pathViewport,
      outerRadius = this._outerRadius,
      p = this._point;

    return p.x - outerRadius > vp.max.x || p.y - outerRadius > vp.max.y ||
      p.x + outerRadius < vp.min.x || p.y + outerRadius < vp.min.y;
  },

  _validateInnerRadius: function(outer, inner) {
    if (inner[0] >= outer[0] || inner[1] >= outer[1]) return [outer[0] - 1, outer[1] - 1];
    return inner;
  },

  getArc: function(pt, outerRadius, innerRadius, outerRadiusTop, innerRadiusTop) {
    var x2 = pt.x - 0.01;
    var y1 = pt.y - outerRadiusTop;
    var y2 = pt.y - innerRadiusTop;

    return [
      'M', pt.x, y1,
      'A', outerRadius, outerRadiusTop, 0, 1, 1, x2, y1,
      'M', x2, y2,
      'A', innerRadius, innerRadiusTop, 0, 1, 0, pt.x, y2,
      'Z'
    ].join(' ');
  },

  getPathString: function() {
    var p = this._point,
      outerRadius = this._outerRadius,
      outerRadiusTop = this._outerRadiusTop,
      innerRadius = this._innerRadius,
      innerRadiusTop = this._innerRadiusTop;

    if (this._checkIfEmpty()) {
      return '';
    }

    if (L.Browser.svg) {
      return this.getArc(p, outerRadius, innerRadius, outerRadiusTop, innerRadiusTop);
    } else { // TODO: VML Donut path
      p._round();
      r = Math.round(r);
      return 'AL ' + p.x + ',' + p.y + ' ' + outerRadius + ',' + outerRadius + ' 0,' + (65535 * 360);
    }
  }
});

L.donut = function(latlng, outerRadius, innerRadius, options) {
  return new L.Donut(latlng, outerRadius, innerRadius, options);
};
