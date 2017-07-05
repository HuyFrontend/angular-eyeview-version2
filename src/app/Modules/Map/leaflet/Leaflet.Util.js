function generatePointsCircle(map, latlng, list) {
  let count = list.length;
  let centerPt = map.latLngToLayerPoint(latlng);

  let markerRadius = 120;
  let circumference = markerRadius * count;
  let angleStep = (Math.PI * 2) / count;
  let groupRadius = circumference / (Math.PI * 2);
  let circleStartAngle = Math.PI / 6;
  let res = [];
  let i, angle;

  res.length = count;

  if (count === 1 || count === 2) {
    groupRadius = 60;
  }

  for (i = count - 1; i >= 0; i--) {
    angle = circleStartAngle + i * angleStep;
    list[i].position = new L.Point(centerPt.x + groupRadius * Math.cos(angle), centerPt.y + groupRadius * Math.sin(angle))._round();
  }

  return list;
}
/**
 * get lat radius of top and left ellipse
 * @param  {number} topRadius top radius in meter
 * @param  {number} leftRadius left radius in meter
 * @return {object}   distance by lattitude from center to top and left
 */
function getLatRadius(topRadius, leftRadius) {
  return {
    top: (topRadius / 40075017) * 360, //40075017 is perimeter of the earth in meter
    left: (leftRadius / 40075017) * 360
  };
}
/**
 * get longitudeRadius
 * @param  {L.LatLng} center
 * @param  {number} topRadius
 * @param  {number} leftRadius
 * @return {object}   distance by longitude from center to top and left
 */
function getLngRadius(center, topRadius, leftRadius) {
  let radii = getLatRadius(topRadius, leftRadius);
  return {
    top: (radii.top / Math.cos(L.LatLng.DEG_TO_RAD * center.lat)),
    left: (radii.left / Math.cos(L.LatLng.DEG_TO_RAD * center.lat))
  };
}

/**
 * get ellipse coords to render miji, uti, message
 * @param  {L.LatLng} center     center coord of ellipse
 * @param  {number} topRadius  top radius in meter
 * @param  {number} leftRadius left radius in meter
 * @return {Array[object]}   radius: radius of miji, uti, message circle; latLngs[0]: coords of miji (left of ellipse), latLngs[1]: coords of uti (right of ellipse), latLngs[2]: coords of message (top of ellipse)
 */
function getEllipseCoord(center, topRadius, leftRadius) {
  let lats = getLatRadius(topRadius, leftRadius);
  let lngs = getLngRadius(center, topRadius, leftRadius);
  let x1 = {
    lat: center.lat,
    lng: center.lng - lngs.left
  }, x2 = {
    lat: center.lat,
    lng: center.lng + lngs.left
  }, x3 = {
    lat: center.lat + lats.top,
    lng: center.lng
  };
  return [x1, x2, x3];
}


L.Util = L.Util || {};

/**
 * store the cell radius for cell type = das or omni
 * @type {number}
 */
L.Util.cellRadius = 30;
/**
 * Function trigger expand/collapse the group miji/uti on cell
 * @param latlng -> Lat long of group icon
 * @param list -> List item on group
 * @param isExpand -> true -> Exppand
 * @param isMiji -> true -> is miji
 */
L.Util.expandGroup = function (latlng, list, isExpand = true, isMiji) {
  let self = this;
  if (isMiji) {
    self.isExpandedMiji = isExpand;
  } else {
    self.isExpandedUti = isExpand;
  }
  if (isExpand) {
    let listMarker = generatePointsCircle(self._map, latlng, list);
    _.each(listMarker, function (e) {
      // e.setOpacity(1);
      e._icon && e._icon.classList.remove('no-display');
      e.msgCounting && e.msgCounting._icon && e.msgCounting._icon.classList.remove('no-display');
      setTimeout(function () {
        e.setLocation(self._map.layerPointToLatLng(e.position));
      });
    });
  } else {
    let pos = L.Util.getPosOnCell(self, isMiji ? 'miji' : 'uti');
    //set location and hide miji/uti item when collapse
    _.forEach(list, (item)=> {
      item.setLocation(pos);
      setTimeout(function () {
        item._icon && item._icon.classList.add('no-display');
        item.msgCounting && item.msgCounting._icon && item.msgCounting._icon.classList.add('no-display');
      }, 250);
    });
  }
};

/**
 * Get Position of miji/uti item on cell of bts based on type of cell (DAS, OMNI, SECROR)
 * @param self -> to get coords of cell
 * @param nodeType -> 'miji', 'uti','message'
 * @returns {*}
 */
L.Util.getPosOnCell = function (self, nodeType) {
  self = self || this;
  if (self.data.coords.length === 3) {
    self.data.coords.unshift(self.data.coords[0]);
  }
  switch (self.data[L.NETWORK.DATAFIELDS.ANTENNA_TYPE]) {
    case L.NETWORK.CELLTYPES.DAS:
    case L.NETWORK.CELLTYPES.OMNI:
      // Take the left coordinate for miji and right for uti on DAS or OMNI
      let coordList = {
        'alarm': self.data.coords[1],
        'message': self.data.coords[3],
      };
      return coordList[nodeType];
      break;
    case L.NETWORK.CELLTYPES.SECTOR:
    default:
      let factors = {
        'message': [1,3],
        'alarm': [3, 1]
      };
      return {
        lng: factors[nodeType][0] * (self.data.coords[0].lng + self.data.coords[3].lng) / 2 / (factors[nodeType][0] + factors[nodeType][1]) + factors[nodeType][1] * (self.data.coords[2].lng + self.data.coords[1].lng) / 2 / (factors[nodeType][0] + factors[nodeType][1]),
        lat: factors[nodeType][0] * (self.data.coords[0].lat + self.data.coords[3].lat) / 2 / (factors[nodeType][0] + factors[nodeType][1]) + factors[nodeType][1] * (self.data.coords[2].lat + self.data.coords[1].lat) / 2 / (factors[nodeType][0] + factors[nodeType][1])
      }
  }
};
/**
 * Function to find the new two vertices to add to the sector of a layerId at the position latLng
 * with the thickness of the cell is thickness and direction of the section is direction and the open-angle is deg
 * @param latLng
 * @param layerId
 * @param azimuth
 * @returns {*[]}
 */
L.Util.getCoordsFromVertice = function (latLng, layerId, azimuth) {
  let self = this;
  let direction = parseInt(azimuth) + self._cellHeight;

  let x1 = {
    lat: latLng.lat - (layerId + 1) * self._thickness * Math.cos(Math.PI / 180 * (direction - self._deg)),
    lng: latLng.lng - (layerId + 1) * self._thickness * Math.sin(Math.PI / 180 * (direction - self._deg))
  };
  let x2 = {
    lat: latLng.lat - (layerId + 1) * self._thickness * Math.cos(Math.PI / 180 * (direction + self._deg)),
    lng: latLng.lng - (layerId + 1) * self._thickness * Math.sin(Math.PI / 180 * (direction + self._deg))
  };
  return [x1, x2];
};
L.Util.getEllipseCoord = getEllipseCoord;
/**
 * Convert Degress to Radians
 * @param deg
 * @returns {number}
 * @constructor
 */
L.Util.deg2Rad = function (deg) {
  return deg * Math.PI / 180;
};

/**
 * Function to find nearest latlng
 * @param lat1
 * @param lon1
 * @param lat2
 * @param lon2
 * @returns {number}
 * @constructor
 */
L.Util.pythagorasEquirectangular = function (lat1, lon1, lat2, lon2) {
  lat1 = L.Util.deg2Rad(lat1);
  lat2 = L.Util.deg2Rad(lat2);
  lon1 = L.Util.deg2Rad(lon1);
  lon2 = L.Util.deg2Rad(lon2);
  let R = 6371; // km
  let x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
  let y = (lat2 - lat1);
  let d = Math.sqrt(x * x + y * y) * R;
  return d;
};

/**
 * Function to find index of an item which have nearest lat lon in list items
 * Reference: http://stackoverflow.com/questions/21279559/geolocation-closest-locationlat-long-from-my-position
 * @param latitude
 * @param longitude
 * @param items
 * @returns {*}
 */
L.Util.findNearestLatlng = function (latitude, longitude, items) {
  let mindif = 99999;
  let closest;

  _.forEach(items, (item, index)=> {
    let dif = L.Util.pythagorasEquirectangular(latitude, longitude, item.data.bts.location.lat, item.data.bts.location.lon);
    if (dif < mindif) {
      closest = index;
      mindif = dif;
    }
  });
  return closest;
};

// Text conversion
L.Util.keyToReadble = function (str) {
  return str.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, function (str) {
      return str.toUpperCase();
    });
};

// Text conversion
L.Util.keyToReadble = function (str) {
  return str.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, function (str) {
      return str.toUpperCase();
    });
};
