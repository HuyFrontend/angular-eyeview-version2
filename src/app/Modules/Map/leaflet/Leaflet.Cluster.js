L.Cluster = L.Marker.extend({
  /**
   * Initialize Cluster Map Item
   * - set latLng for cluster
   * - set Icon options for Cluster Marker
   * - Render Cluster to map
   *
   * @param map
   * @param data
   */
  initialize: function (map, data) {
    let self = this;
    self._cellMarkers = [];

    // Setup default variables
    self._cellHeight = 180;
    self._thickness = 0.0004;
    self._deg = 40;
    self._noClicks = 0;
    self._disableOpacity = 0.2;

    self._map = map;
    self.data = data;

    // Parse lat, lng for cluster
    let lat = parseFloat(self.data.latitude || self.data.lat || self.data.location.lat);
    let lng = parseFloat(self.data.longitude || self.data.lon || self.data.lng || self.data.location.lon);
    self.latLng = L.latLng(lat, lng);

    let c = ' marker-cluster-';
    if (self.data.count < 10) {
      c += 'small';
    } else if (self.data.count < 100) {
      c += 'medium';
    } else {
      c += 'large';
    }

    // Set icon options
    self.options.icon = L.divIcon({
      // className: "labelClass",
      className: 'marker-cluster' + c,
      removeOutsideVisibleBounds: true,
      html: `
        <div><span>${self.data.count}</span></div>
      `,
      iconSize: new L.Point(40, 40)
    });

    // Initialize bts marker
    L.Marker.prototype.initialize.call(this, self.latLng);

    // Set cluster marker to map
    self.addTo(map);
  },

  /**
   * Revert a cluster marker to default
   */
  revertDefault: function () {
    let self = this;
    self._noClicks = 0;
    self.setOpacity(1);
    self.setZIndexOffset(17);
  },

});

L.cluster = function (map, data) {
  // Render BTS Marker
  return new L.Cluster(map, data);
};
