import turfBearing from "@turf/bearing";
import turfDistance from "@turf/distance";
import turfDestination from "@turf/destination";

// Define class instead of new element
L.FeatureGroup.geotagPhotoControl = function(map, camera, options) {
  return new L.FeatureGroup.GeotagPhotoControl(map, camera, options);
};

L.FeatureGroup.GeotagPhotoControl = L.FeatureGroup.extend({
  hiddenFOVStatus: false,
  options: {
    // Whether the camera is draggable with mouse/touch or not
    draggable: false,

    // Whether to show camera control buttons
    control: false,

    // Whether the angle of the field-of-view can be changed with a draggable marker
    angleMarker: false,

    minAngle: 1,
    maxAngle: 179,

    // Control button images
    controlCameraImg: "../img/leaflet/camera-icon.png",
    controlCrosshairImg: "../img/leaflet/crosshair-icon.png",

    cameraIcon: L.icon({
      fill: true,
      fillColor: "#39ac73",
      iconUrl: "../img/leaflet/camera.png",
      iconSize: [48, 28],
      iconAnchor: [19, 19]
    }),

    targetIcon: L.icon({
      iconUrl: "../img/leaflet/marker.png",
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    }),

    angleIcon: L.icon({
      iconUrl: "../img/leaflet/marker.png",
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    }),

    outlineStyle: {
      backgroundColor: "transparent",
      color: "black",
      opacity: 0.5,
      weight: 2,
      dashArray: "5, 7",
      lineCap: "round",
      lineJoin: "round"
    },

    fillStyle: {
      weight: 0,
      fillOpacity: 0.2,
      fillColor: "#3388ff"
    }
  },

  //map, camera, options
  initialize: function(map, camera, options) {
    let self = this;
    self._on = options.on;
    self.cameraCaptchure = self
      .createCameraCapture(map, camera)
      .addTo(self.map)
      .on("change", function(event) {
        var fieldOfView = this.getFieldOfView();
        console.log(JSON.stringify(fieldOfView, null, 2));
      });
  },

  removeCamera: function() {
    this.map.removeLayer(this.cameraCaptchure);
  },

  createCameraCapture: function(map, camera) {
    let self = this;
    self.map = map;
    self.data = camera;

    if (camera === null || camera === undefined) {
      console.log("Unable to access to camera");
    }

    if (
      typeof self.geotagPhotoControl !== "undefined" &&
      self.geotagPhotoControl != null
    ) {
      let cameraCap = self.geotagPhotoControl.cameraCaptchure;
      if (typeof cameraCap !== "undefined" && cameraCap != null) {
        map.removeLayer(cameraCap);
      }
    }

    //setup points data
    let lat = parseFloat(self.data.points.location.lat);
    let lng = parseFloat(self.data.points.location.lon);
    let latlng = L.latLng(lat, lng);
    self.bearing = parseFloat(self.data.points.bearing);
    self.angle = parseInt(self.data.points.fieldofview);
    self.distance = self.adjustDistanceZoom(self.map);

    let cameraPoint = [lng, lat];
    let targetPoint = self.destVincenty(lat, lng, self.bearing, self.distance);

    self.latLng = latlng;

    let featurePoints = {
      type: "Feature",
      properties: {
        angle: self.angle,
        bearing: self.bearing,
        distance: self.distance
      },
      geometry: {
        type: "GeometryCollection", //GeometryCollection with two geometries: Point: location of camera  & LineString: field of view
        geometries: [
          {
            type: "Point",
            coordinates: cameraPoint
          },
          {
            type: "Point",
            coordinates: targetPoint
          }
        ]
      }
    };

    return L.FeatureGroup.cameraCaptchure(
      featurePoints,
      self.data,
      self.options,
      self._on
    );
  },
  adjustDistanceZoom: function(map) {
    let defaultDistance = 250;
    let zoomLevel = map.getZoom();
    let aspectRatio = defaultDistance / zoomLevel;
    return aspectRatio;
  },
  setCameraAndTargetLatLng: function(cameraLatLng, targetLatLng) {
    self.cameraCaptchure.setCameraAndTargetLatLng(cameraLatLng, targetLatLng);
  },
  getBearing: function(cameraCoordinate, toCoordinate) {
    let from = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: cameraCoordinate
      }
    };

    let to = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: toCoordinate
      }
    };

    return turfBearing(from, to);
  },

  getDistance: function(cameraCoordinate, targetCoordinate) {
    let units = "miles";
    let from = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: cameraCoordinate
      }
    };

    var to = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: targetCoordinate
      }
    };
    return turfDistance(from, to, units);
  },
  getDestination: function(cameraCoordinate, distance, bearing) {
    let units = "miles";
    let point = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: cameraCoordinate
      }
    };

    return turfDestination(point, distance, bearing, units);
  },
  destVincenty: function(lat1, lon1, brng, dist) {
    var a = 6378137,
      b = 6356752.3142,
      f = 1 / 298.257223563, // WGS-84 ellipsiod
      s = dist,
      alpha1 = brng * Math.PI / 180,
      sinAlpha1 = Math.sin(alpha1),
      cosAlpha1 = Math.cos(alpha1),
      tanU1 = (1 - f) * Math.tan(lat1 * Math.PI / 180),
      cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1),
      sinU1 = tanU1 * cosU1,
      sigma1 = Math.atan2(tanU1, cosAlpha1),
      sinAlpha = cosU1 * sinAlpha1,
      cosSqAlpha = 1 - sinAlpha * sinAlpha,
      uSq = cosSqAlpha * (a * a - b * b) / (b * b),
      A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq))),
      B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq))),
      sigma = s / (b * A),
      sigmaP = 2 * Math.PI;
    while (Math.abs(sigma - sigmaP) > 1e-12) {
      var cos2SigmaM = Math.cos(2 * sigma1 + sigma),
        sinSigma = Math.sin(sigma),
        cosSigma = Math.cos(sigma),
        deltaSigma =
          B *
          sinSigma *
          (cos2SigmaM +
            B /
              4 *
              (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
                B /
                  6 *
                  cos2SigmaM *
                  (-3 + 4 * sinSigma * sinSigma) *
                  (-3 + 4 * cos2SigmaM * cos2SigmaM)));
      sigmaP = sigma;
      sigma = s / (b * A) + deltaSigma;
    }
    var tmp = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1,
      lat2 = Math.atan2(
        sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1,
        (1 - f) * Math.sqrt(sinAlpha * sinAlpha + tmp * tmp)
      ),
      lambda = Math.atan2(
        sinSigma * sinAlpha1,
        cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1
      ),
      C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha)),
      L =
        lambda -
        (1 - C) *
          f *
          sinAlpha *
          (sigma +
            C *
              sinSigma *
              (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM))),
      revAz = Math.atan2(sinAlpha, -tmp); // final bearing
    return [lon1 + L * 180 / Math.PI, lat2 * 180 / Math.PI];
  },

  hiddenFOV: function() {
    this.cameraCaptchure.hiddenFOV();
    this.setHiddenFOVStatus(true);
  },
  showFOV: function() {
    this.cameraCaptchure.showFOV();
    this.setHiddenFOVStatus(false);
  },
  getHiddenFOVStatus: function() {
    return this.hiddenFOVStatus;
  },
  setHiddenFOVStatus: function(status) {
    this.hiddenFOVStatus = status;
  },
  setFocusEffect: function() {
    this.cameraCaptchure.setFocusEffect();
  }
});
