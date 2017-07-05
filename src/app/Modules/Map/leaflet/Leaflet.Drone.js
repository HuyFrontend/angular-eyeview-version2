
let droneIco = L.divIcon({
  html: '',
  iconSize: new L.Point(50, 50),
  iconAnchor: [25, 25],
  className: 'uti-drone-icon'
});
L.Marker.include({
  /**
   * Update icon base on source location
   */
  updateIcon: function () {
    this.setIcon(droneIco);

  }
});
L.Drone = L.Marker.extend({
  options: {
    icon: droneIco,
    repeatMode: false,
    zIndexOffset: 1000,
    className: 'drone_icon',
    title: '',
    alt: '',
    clickable: true,
    draggable: false,
    keyboard: true,
    opacity: 1,
    riseOnHover: false,
    riseOffset: 250
    // This should be > than the highest z-index any markers
  },

  initialize: function (map, latLng, data, options) {
    let self = this;
    self.data = data;
    if (!self.latlng) {
      self.latlng = latLng;
    }

    options.icon = droneIco;

    L.Marker.prototype.initialize.call(self, latLng, options);
    // Setup click event for UTI
    self.setOnclick();
    self.addTo(map);
  },

  onAdd: function (map) {
    let self = this;
    L.Marker.prototype.onAdd.call(self, map);
    self.on('mouseover', self._mouseOver, self);
    self.on('mouseout', self._mouseOut, self);
    self.on('dblclick', self._dblClick, self);
    self.bindContextMenu(self._getContextMenuOption());
    self.on('contextmenu', ()=> {
      // On Context menu -> If miji has connections then show "Remove Connection". Otherwise hide it.
      let removeConnectionOption = self._getRemoveConnectionContextMenuOption();
      if (self._hasConnections()) {
        // Insert menu
        self.replaceContextMenuItem(removeConnectionOption);
      } else {
        // Remove menu
        self.removeContextMenuItemWithIndex(removeConnectionOption.index);
      }
    });

  },
  removeDrone: function () {
    let self = this;
    // Remove from map
    self._map.removeLayer(self);
  },
  /**
   * When uti marker removed from Map
   * - Off the events
   *
   * @param map
   */
  onRemove: function (map) {
    let self = this;

    // Off the events
    self.off('mouseover');
    self._map.off('mousemove', self.onMouesMoveLayer);
    self.off('mouseout');
    self.off('contextmenu');
    self.off('dblclick');
    if (self._tooltip) {
      self._tooltip.dispose();
    }
    L.Marker.prototype.onRemove.call(self, map);
  },

  _getClassNameOfUtiPopup: function () {
    let self = this;
    return (self.data.isStreaming || self.data.sourceLocationNeed) && "custom-leaflet-popup" || "leaflet-popup-uti-triangle";
  },


  _getContextMenuOption: function () {
    let self = this;
    return {
      contextmenu: true,
      contextmenuWidth: 200,
      contextmenuInheritItems: false,
      contextmenuItems: [
        {
          text: 'View Camera',
          index: 1,
          callback: () => {
            //self.closePopup();
            //self.options.on['edit'] && self.options.on['edit'](self);
          }
        }
      ]
    };
  },
  _connection: null,
  /**
   * Update position of tooltip on mouse move
   * @param e
   */
  onMouesMoveLayer: function (e) {
    this._tooltip && this._tooltip.updatePosition(e.latlng);
  },
  _mouseOver: function (e) {
    let self = this;
    // Add event mouse move to map.
    // When mouse is move, update position of tooltip
    self._map.off('mousemove', self.onMouesMoveLayer).on('mousemove', self.onMouesMoveLayer.bind(this));
    L.DomUtil.addClass(self._icon, 'highlight');
    self._tooltip = new L.Draw.Tooltip(self._map);
    self._tooltip.updateContent({
      subtext: self.data.utiName,
      text: '<small>Double Click to edit view camera</small>'
    });
    self._tooltip.updatePosition(e.latlng);


  },
  _mouseOut: function (e) {
    let self = this;
    L.DomUtil.removeClass(self._icon, 'highlight');
    self._timeoutPopup && clearTimeout(self._timeoutPopup);
    if (self._tooltip) {
      self._tooltip.dispose();
    }

  },

  _dblClick: function (e) {
    let self = this;
    self._onClickTimedOut && clearTimeout(self._onClickTimedOut);
    self._timeoutPopup && clearTimeout(self._timeoutPopup);
    self._map.closePopup();
    self.options.on['edit'] && self.options.on['edit'](self);
    if (self._tooltip) {
      self._tooltip.dispose();
    }
  },
  setText: function (newText) {
    this._labelIcon.innerText = newText;
  },

  /**
   * Setup event:click for uti
   * - Show popup information of the selected uti
   */
  setOnclick: function () {
    let self = this;
    // Display popup when click to a uti
    self.on('click', (e) => {
      self._onClickTimedOut && clearTimeout(self._onClickTimedOut);
      // clear hover popup timeout
      self._timeoutPopup && clearTimeout(self._timeoutPopup);
      // hide frequencies popup
      if (self.imagePopup) {
        self.closePopup();
      }
      self.unbindPopup();
      self._onClickTimedOut = setTimeout(()=> {
        if (self.options.on && self.options.on['click']) {
          self.options.on['click'](e);
        } else {
          self._openPopupInfo();
        }
      }, 200);
    });
  },

  showImagesPopup: function () {
    let self = this;
    let popupResult = self.bindPopup(
      `
        <div class="leaflet-uti-imgs">
          <img src='assets/svg/ajax-loader.svg' width="20px" /> Loading ...
        </div>
      `
      , {
        closeOnClick: true,
        className: self._getClassNameOfUtiPopup()
      });

    self.imagePopup = popupResult;

    popupResult.openPopup();

    popupResult.on('popupclose', function (e) {
      self.imagePopup = null;
    });
  },

  bindImagesPopup: function (frequencies) {
    let self = this;

    // if popup was not initialized yet
    if (!self.imagePopup) {
      return;
    }

    // Remove frequency that don't have image
    frequencies = _.compact(_.map(frequencies, (f) => {
      if (f.imageUrl) {
        return f;
      }
    }));

    // If no frequency have image -> No need more job here.
    if (!frequencies.length) {
      self.closePopup();
      return;
    }

    self._tooltip && self._tooltip.dispose(); //close tooltip when open popup

    let imgHTML = _.map(frequencies, (f, $index) => {
      let className = $index ? "hideable" : 'hideable show"';
      let img = f.imageUrl;
      let typesStr = _.map(_.map(f.type, (type) => _.find(L.NETWORK.UTI_TYPES, {id: +type})), 'value').join(', ');
      let frequencyValue =
        `
          <table class="table table-condensed table-detail">
               <col width="150">
               <col width="300">
               <tr>
                  <th>Frequency:</th>
                  <td>${f.inteference} Mhz</td>            
               </tr>
               <tr>
                  <th>Description:</th>
                  <td>${f.description}</td>  
               </tr>
               <tr>
                  <th>Peak Signal Strength:</th>
                  <td>${f.peakSignalStrength} dBm</td>
               </tr>
               <tr>
                  <th>Type:</th>
                  <td>${typesStr}</td>
               </tr>
          </table>  
         `;
      return `
           <li id="${$index + 1}" class="${className}">
             <div class="carousel-img"><img src="${img}" alt="hinterground" /></div>
              <div class="description">
                  ${frequencyValue}
             </div>
           </li>
           
      `;
    }).join('');
    let carouselControl = "";
    //only display carousel control if frequency has 2 images and more
    if (frequencies.length > 1) {
      carouselControl = `
        <a class="left carousel-control" onclick="toggleSlide()" role="button" data-slide="prev">
          <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
          <span class="sr-only">Previous</span>
        </a>
        <a class="right carousel-control" onclick="toggleSlide(true)" role="button" data-slide="next">
          <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
          <span class="sr-only">Next</span>
        </a>
      `;
    }
    let popupContent = $(self.imagePopup._popup._container).find('.leaflet-uti-imgs');

    popupContent.html(
      `
        <label><b>${self.data.utiName}</b></label>
        <ul>
            ${imgHTML}
            ${carouselControl}
        </ul>
      `
      , {
        closeOnClick: true,
        className: self._getClassNameOfUtiPopup()
      });

    let currentIndex = 0;
    window.toggleSlide = function (direction) {
      let elements = $(self.imagePopup._popup._container).find(".leaflet-uti-imgs .hideable"); // gets all the "slides" in our slideshow
      $(elements).removeClass('show');
      let fn = !direction && prev || next;
      let makeVisible = fn(currentIndex, elements.length);
      currentIndex = makeVisible;
      $(elements[makeVisible]).addClass('show'); // show the previous or next slide
    };

    function prev(num, arrayLength) {
      return (num) ? num - 1 : arrayLength - 1;
    }

    function next(num, arrayLength) {
      return (num == arrayLength - 1) ? 0 : num + 1;
    }
  },

  /**
   * Bind popup loading icon when call ajax to load full data from server
   * @private
   */
  _bindPopupLoadingIcon: function () {
    let self = this;

    // Declare DOM for cell popup
    let domCellPopupContent = L.DomUtil.create('div', 'popup-container has-loader');
    domCellPopupContent.innerHTML = `<img src='assets/svg/ajax-loader.svg' width="20px" /> Loading ...`;

    /**
     * Render popup to the cell marker
     * See: http://leafletjs.com/reference-1.0.0.html#popup
     */
    self._utiInfoPopup = self.unbindPopup().bindPopup(domCellPopupContent, {
      closeButton: true,
      className: self._getClassNameOfUtiPopup()
    }).openPopup();

    self._utiInfoPopup.on('popupclose', () => {
      self._utiInfoPopup = null;
    });
  },

  /**
   * Bind popup content
   * @param data
   * @private
   */
  _bindPopupDataContent: function (data) {
    let self = this;

    self.data = data;
    // Declare DOM for cell popup
    let domCellPopupContent = L.DomUtil.create('div', 'popup-container');

    // Declare DOM for table content
    // This is main content of cell popup info
    let domCellPopupContentTable = L.DomUtil.create('table', 'table');
    let domCellPopupContentTableBody = L.DomUtil.create('tbody', '');

    _.forOwn(data, (value, key) => {
      if (L.NETWORK.UTIPOPUPEXCEPTFIELDS.indexOf(key) > -1) {
        return;
      }
      if (key === L.NETWORK.FIELDS.FREQUENCIES) {
        _.forOwn(value, (v, k) => {
          let typesStr = _.map(_.map(v.type, (type) => _.find(L.NETWORK.UTI_TYPES, {id: +type})), 'value').join(', ');
          let frequencyValue = `Frequency: ${v.inteference} Mhz<br>Description: ${v.description}<br>Peak Signal Stregth: ${v.peakSignalStrength} dBm<br>Type: ${typesStr}`;
          // ' + v.type.join(',') + '<br>' + v.description + '<br>' + v.peakSignalStrength;
          domCellPopupContentTableBody.appendChild(self._createPopupRowData("Frequency of Interference " + (1 + +k), frequencyValue));
        });
      } else {
        // Get fields of cell data and bind to popup
        let readableKey = L.Util.keyToReadble(key);
        domCellPopupContentTableBody.appendChild(self._createPopupRowData(readableKey, value));
      }
    });

    // Append main content to popup content
    domCellPopupContentTable.appendChild(domCellPopupContentTableBody);
    domCellPopupContent.appendChild(domCellPopupContentTable);

    /**
     * Render popup to the cell marker
     * See: http://leafletjs.com/reference-1.0.0.html#popup
     */
    self._utiInfoPopup = self.unbindPopup().bindPopup(domCellPopupContent, {
      closeButton: true,
      className: self._getClassNameOfUtiPopup()
    }).openPopup();

    self._utiInfoPopup.on('popupclose', () => {
      self._utiInfoPopup = null;
    });
  },

  /**
   * Bind HTML content of a popup to a uti.
   * Then trigger uti popup to open
   * @private
   */
  _openPopupInfo: function () {
    let self = this;
    let data = self.data;
    if (data && self._isLoadedData) {
      self._bindPopupDataContent(data);
    } else {
      // Open loading icon
      self._bindPopupLoadingIcon();

      self._isLoadedData = true;
      $.ajax({
        method: "GET",
        url: `${L.NETWORK.CONSTANT.domain}/api/${L.NETWORK.CONSTANT.version}/uti/${L.NETWORK.CONSTANT.operatorId}/${this.utiId}`,
        headers: {
          'Authorization': 'Bearer ' + L.NETWORK.CONSTANT.token
        },
        contentType: "application/json; charset=utf-8",
        success: self._bindPopupDataContent.bind(self)
      })
    }
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
  _createPopupRowData: function (label, value) {
    // Create dom obj for one row
    let domRow = L.DomUtil.create('tr', '');

    // Create dom obj for label
    let domRowDataLabel = L.DomUtil.create('td', 'bg-info', domRow);
    $(domRowDataLabel).css('width', '50%');
    domRowDataLabel.innerHTML = label;

    // Create dom obj for data
    let domRowDataValue = L.DomUtil.create('td', '', domRow);
    domRowDataValue.innerHTML = value;

    return domRow;
  },

  // Custom method
  getText: function () {
    return this._labelIcon.innerText || "";
  },


  updateData: function (data) {

    this.data = data;
    this._isLoadedData = true;
    this.updateIcon();
  },
  setLocation: function (latlng) {
    let self = this;
    self.setLatLng(latlng);

    self.data.location = {
      lat: latlng.lat,
      lon: latlng.lon || latlng.lng
    };

    self.update();
  },

  toggleDisplayUti: function (isDisplay) {
    let self = this;
    let fn = isDisplay && 'show' || 'hide';
    $(self._icon)[fn]();
    self.msgCounting && $(self.msgCounting._icon)[fn]();
    self.isDisplay = isDisplay;
  },

  highlightUti: function () {
    let self = this;
    //if uti in cell, expand and highlight it
    self._carrierCell && self._carrierCell.expandUties(self.getLatLng());

    // Show pulsing icon to indicate that new message is come to this uti
    self._icon && self._icon.classList.add('leaflet-icon-focused');
    self._timeoutHighlightEvent && clearTimeout(self._timeoutHighlightEvent);
    self._timeoutHighlightEvent = setTimeout(() => {
      self._icon && self._icon.classList.remove('leaflet-icon-focused');
    }, 3000);
  }
});

L.drone = function (map, droneData, options) {
  // UTI Marker
  let lat = parseFloat((droneData.location && droneData.location.lat) || droneData.latitude || droneData.lat);
  let lng = parseFloat((droneData.location && droneData.location.lon) || droneData.longitude || droneData.lon);

  let drone = new L.Drone(map, L.latLng(lat, lng), droneData, options);

  return drone;
};
