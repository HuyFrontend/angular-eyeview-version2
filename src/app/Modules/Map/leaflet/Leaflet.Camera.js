L.Camera = L.Marker.extend({
  /**
   * Initialize Camera Map Item
   * - set latLng for camera
   * - set Icon options for Camera Marker
   * - Render Camera to map
   *
   * @param map
   * @param camera
   * @param options
   */
  initialize: function(map, camera, options) {
    let self = this;

    // Setup default variables
    self._cellMarkers = [];
    self._cellHeight = 180;
    self._thickness = 0.0004;
    self._deg = 40;
    self._noClicks = 0;
    self._disableOpacity = 1;

    self._map = map;
    self._camera = camera;
    self.data = camera;

    // Merge custom options to marker options
    self.options = _.merge(self.options, options);
    self.isRenderCell = options.isRenderCell;

    // Parse lat, lng for camera
    let lat = parseFloat(self.data.points.location.lat);
    let lng = parseFloat(self.data.points.location.lon);

    let latlng = L.latLng(lat, lng),
      newLatLng = latlng;
    if (_.find(L.NETWORK.CAMERAES, { latLng: latlng })) {
      // Find out camera in current place -> need to margin
      let coordsInPixel = self._map.latLngToContainerPoint(latlng);
      coordsInPixel.y += 20;
      newLatLng = self._map.containerPointToLatLng(coordsInPixel);
    }
    self._latLng = latlng;
    self._newlatLng = newLatLng;

    // Initialize camera marker
    L.Marker.prototype.initialize.call(this, newLatLng);

    // Set camera marker to map
    //self.addTo(map);
    self.geotagPhotoControl = L.FeatureGroup.geotagPhotoControl(
      self._map,
      self.data,
      self.options
    );
  },

  hiddenFOV: function() {
    this.geotagPhotoControl.hiddenFOV();
  },

  showFOV: function() {
    this.geotagPhotoControl.showFOV();
  },
  getHiddenFOVStatus: function() {
    return this.geotagPhotoControl.getHiddenFOVStatus();
  },
  setHiddenFOVStatus: function(status) {
    this.geotagPhotoControl.setHiddenFOVStatus(status);
  },

  setFocusEffect: function() {
    this.geotagPhotoControl.setFocusEffect();
  },

  setFieldOfView: function() {
    let self = this;
    self.geotagPhotoControl = L.FeatureGroup.geotagPhotoControl(
      self._map,
      self.data,
      self.options
    );
  },
  getMessageCountIcon: function() {
    let self = this;
    let iconClassName = "l-camera-ico";

    if (!self._cellMarkers || !self._cellMarkers.length) {
      iconClassName += " is-empty-cell-markers";
    }

    return L.divIcon({
      className: iconClassName,
      removeOutsideVisibleBounds: true,
      // html: !self.data.cells.length ? `
      //   <div class="label-name">
      //     <span class="camera-icon"></span>
      //     <span class="camera-name">${self.data.camera.cameraname}</span>
      //   </div>
      // ` : `
      //   <div class="label-name">
      //     <span class="camera-cell-icon"></span>
      //     <span class="camera-name">${self.data.camera.cameraname}</span>
      //   </div>
      // `
      html: `
        <div class="label-name">
          <span class="camera-name">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span class="camera-name">${self.data.points.pointname}</span>
        </div>
      `
    });
  },
  bindMarkerMessageCount: function() {
    let self = this;
    self.setIcon(self.getMessageCountIcon());
  },
  /**
   * Revert a camera marker to default
   */
  revertDefault: function() {
    let self = this;

    self._noClicks = 0;

    self.setOpacity(1);
    self.setZIndexOffset(1000);

    // Re-bind icon
    self.setIcon(self.getMessageCountIcon());
  },

  /**
 * When add new Camera Marker to Map
 * - Render camera marker to map
 *
 * @param map
 */
  onAdd: function(map) {
    let self = this;

    //Render camera marker to map
    L.Marker.prototype.onAdd.call(this, map);

    // Render cell to map
    self.setBlur();

    //Re-bind icon
    self.setIcon(self.getMessageCountIcon());

    //Create field of view for camera
    self.setFieldOfView();

    // Set onclick event
    self.on("click", self.onClick);

    //Bind context menu for
    self.bindContextMenu(self._getContextMenuOption());
  },

  /**
   * When camera marker removed from Map
   * - Off the events
   *
   * @param map
   */
  onRemove: function(map) {
    let self = this;
    // Off the events
    self.off("click");

    if (
      typeof self.geotagPhotoControl !== "undefined" &&
      self.geotagPhotoControl != null
    ) {
      let cameraCap = self.geotagPhotoControl.cameraCaptchure;
      if (typeof cameraCap !== "undefined" && cameraCap != null) {
        map.removeLayer(cameraCap);
      }
    }

    L.Marker.prototype.onRemove.call(this, map);
  },

  /**
   * When click to a camera marker on map
   * - Set focus for clicked camera
   * - Set blur for other
   */
  onClick: function() {
    let self = this;
    _.forEach(L.NETWORK.CAMERAES, cameraMarker => {
      if (
        cameraMarker.data.points[L.NETWORK.DATAFIELDS.CAMERA_ID] ===
        self.data.points[L.NETWORK.DATAFIELDS.CAMERA_ID]
      ) {
        cameraMarker.setFocus();
        cameraMarker.setIcon(cameraMarker.getMessageCountIcon());
      } else {
        cameraMarker.setBlur();
        cameraMarker.setIcon(cameraMarker.getMessageCountIcon());
      }
    });
  },

  /**
   * Set blur when click to camera marker on map
   */
  setBlur: function() {
    let self = this;

    self.revertDefault(); // Revert default information for camera marker
    self.setOpacity(self._disableOpacity); // Decrease opacity for other camera markers
  },

  /**
   * Set focus when click to camera marker on map
   */
  setFocus: function() {
    let self = this;
    L.NETWORK.ACTIVECAMERA = self; // enable focus flag of camera marker

    self._noClicks++; // Increase number of clicks

    self.setZIndexOffset(1010);
    self.setOpacity(1);
  },

  removeCamera: function() {
    let self = this;
    // Remove from map
    self.geotagPhotoControl.removeCamera();
    //self._map.removeLayer(self);
  },

  /**
   * Create data for each row in popup
   * - First col: label
   * - Second col: data
   *
   * Example:
   * <tr>
   *     <td class="bg-info" style="width: 50%;">antennatype</td>
   *     <td class="">DAS</td>
   * </tr>
   *
   * @param label
   * @param value
   * @returns {tr}
   * @private
   */
  _createPopupRowData: function(label, value) {
    // Create dom obj for one row
    let domRow = L.DomUtil.create("tr", "");

    // Create dom obj for label
    let domRowDataLabel = L.DomUtil.create("td", "bg-info", domRow);
    $(domRowDataLabel).css("width", "50%");
    domRowDataLabel.innerHTML = label;

    // Create dom obj for data
    let domRowDataValue = L.DomUtil.create("td", "", domRow);
    domRowDataValue.innerHTML = value;

    return domRow;
  },

  /**
   * Bind HTML content of a popup to a camera marker.
   * Then trigger camera popup to open
   * @private
   */
  _openPopupInfo: function(latLng) {
    let self = this;

    // Declare DOM for camera popup
    let domCameraPopupContent = L.DomUtil.create("div", "popup-container");

    // Declare DOM for table content
    // This is main content of camera popup info
    let domCameraPopupContentTable = L.DomUtil.create("table", "table");
    let domCameraPopupContentTableBody = L.DomUtil.create("tbody", "");

    /**
     * Create structure of row for popup
     * @param key
     * @param value
     */
    let createRow = (key, value) => {
      if (L.NETWORK.CAMERAPOPUPEXCEPTFIELDS.indexOf(key) > -1) {
        return;
      }
      key = L.NETWORK.COLUMN_CONVERSION[key] || key;
      if (
        key == "pointname" ||
        key == "address" ||
        key == "bearing" ||
        key == "fieldofview"
      ) {
        // Get fields of camera data and bind to popup
        domCameraPopupContentTableBody.appendChild(
          self._createPopupRowData(key, value)
        );
      }
    };

    // Create rows with camera data
    _.forOwn(self.data.points, (value, key) => createRow(key, value));

    // Create rows with optional fields
    _.forEach(self.data.points[L.NETWORK.DATAFIELDS.OPTIONAL_FIELDS], f => {
      createRow(f.key, f.value);
    });

    // Append main content to popup content
    domCameraPopupContentTable.appendChild(domCameraPopupContentTableBody);
    domCameraPopupContent.appendChild(domCameraPopupContentTable);

    /**
     * Render popup to the camera marker
     * See: http://leafletjs.com/reference-1.0.0.html#popup
     */
    self._popup = L.popup({
      closeButton: true,
      closePopupOnClick: false
    })
      .setLatLng(latLng)
      .setContent(domCameraPopupContent)
      .openOn(self._map);
  },

  _getContextMenuOption: function() {
    var self = this;

    /**
     * Declare context menu items for camera marker
     * See: https://github.com/aratcliffe/Leaflet.contextmenu
     */
    let contextMenuItems = [
      {
        text: "Overview",
        callback: () => {
          // Display popup when click to a camera marker
          self._openPopupInfo(self.getLatLng());
        }
      }
      //  {
      //    text: 'View Camera',
      //    callback: () => {

      //      self.options.on &&
      //      self.options.on['viewcamera'] &&
      //      self.options.on['viewcamera'](_.extend(angular.copy(self.data.points), { id: self.data.points.pointid }), 'viewcamera');
      //    }
      //  }
    ];

    return {
      contextmenu: true,
      contextmenuWidth: 140,
      contextmenuInheritItems: false,
      contextmenuItems: contextMenuItems
    };
  }
});

L.camera = function(map, cam, options) {
  // Render Camera Marker
  return new L.Camera(map, cam, options);
};
