L.SectorPolygon = L.Polygon.extend({
  options: {
    color: '#000000', // Stroke color
    fillColor: '#000000', // Fill color
    fillOpacity: 0.5, // Fill opacity
    weight: 0.7 // Stroke weight
  },
  initialize: function (arrayCoord, options) {
    // this.options.fillColor = options.fillColor;
    L.Polygon.prototype.initialize.call(this, arrayCoord, options);
  }
});
L.EllipsePolygon = L.Donut.extend({
  options: {
    color: '#000000', // Stroke color
    fillColor: '#000000', // Fill color
    fillOpacity: 0.5, // Fill opacity
    weight: 1 // Stroke weight
  },
  initialize: function (latlng, outerRadius, innerRadius, options) {
    // this.options.fillColor = options.fillColor;
    L.Donut.prototype.initialize.call(this, latlng, outerRadius, innerRadius, options);
  }
});
L.sectorPolygon = function (options) {
  return new L.SectorPolygon(options);
};
L.ellipsePolygon = function (options) {
  return new L.EllipsePolygon(options);
};
