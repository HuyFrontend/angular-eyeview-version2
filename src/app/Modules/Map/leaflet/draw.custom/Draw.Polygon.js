L.DrawPolygon = L.Polygon.extend({
  initialize: function (latlngs, options) {
    let self = this;

    // Check valid options
    if (options) {
      self.options = options;
    }

    L.Polygon.prototype.initialize.call(self, latlngs, self.options);

    /**
     * Bind context menu
     * See: https://github.com/aratcliffe/Leaflet.contextmenu
     */
    self.bindContextMenu({
      contextmenu: true,
      contextmenuWidth: 140,
      contextmenuInheritItems: false,
      contextmenuItems: [{
        text: 'Edit',
        callback: function (e) {
          self._clickedLatLng = e.latlng;
          self._createPopup();
        }
      }, {
        text: 'Remove',
        callback: function () {
          self._removePolygon();
        }
      }]
    });

    /**
     * Setup event on:click for draw markup
     */
    self.on('click', function (e) {
      self.unbindPopup().closePopup();

      // Close edit mode of other markups
      _.forEach(L.NETWORK.MARKUPS, (o)=> {
        o.closePopup();
        if (o.editing && o !== self) {
          o.editing.disable();
        }
      });

      // Enable edit mode
      self.editing.enable();
    });

    /**
     * Setup event on:add for draw polygon
     */
    self.on('add', function (e) {
      if(!self.id){
        // Add new -> save
        self._savePolygon();
      }

      // Declare on:click for map
      self._map.on('click', ()=> {
        self._onMapClick();
      });
    });

    /**
     * Setup event on:click for draw polygon
     */
    self.on('edit', function (e) {
      // Auto enable edit mode after moving or resizing
      // This script for fix "auto disable edit mode issue"
      setTimeout(()=> {
        self.editing.enable();
      });

      // Update new markup options to server
      self._savePolygon();
    });
  },

  /**
   * Setup on add event
   * @param map
   */
  onAdd: function (map) {
    let self = this;
    self._map = map;

    L.Polygon.prototype.onAdd.call(self, map);
  },

  /**
   * Event on:remove of polygon markup
   * - Set off:viewreset
   * - Set off:moveend
   * - Set off:mousemove
   * - Set map off:click
   * @param map
   */
  onRemove: function (map) {
    let self = this;

    map
      .off('viewreset', self.projectLatlngs, self)
      .off('moveend', self._updatePath, self);

    // set off for click events
    if (self.options.clickable) {
      self._map.off('mousemove', self._onMouseMove, self);

      // Map off:click
      self._map.off('click', ()=> {
        self._onMapClick();
      }, self);
    }

    L.Circle.prototype.onRemove.call(self, map);
  },

  /**
   * When user click to Map will be close edit mode of markup
   * @private
   */
  _onMapClick: function () {
    let self = this;
    self.editing.disable();
  },

  /**
   * Create popup for polygon layer
   * @private
   */
  _createPopup: function () {
    let self = this;

    if (!self._map) {
      return;
    }

    // Create editor template
    self._wrapper = L.DomUtil.create('div', 'editDrawPopupAnnotation');
    self._styleButtons = L.DomUtil.create('div', 'textStylingButtons', self._wrapper);

    // Create first line of popup
    self._popupLine1 = L.DomUtil.create('ul', 'textStylingButtons_line1', self._styleButtons);

    self._createPopupColorPicker('fillcolor', self._popupLine1, 'fillColor', 'Fill Color');    // Create fill color picker
    self._createPopupColorPicker('strokecolor', self._popupLine1, 'color', 'Stroke Color');    // Create stroke color picker

    self._createPopupStrokeWeight('weight', self._popupLine1, 'weight', 'Stroke Width');    // Create stroke weight field
    self._createPopupBorderStyle('border', 'boxborder', self._popupLine1);    // Create stroke style field

    // Create second line of popup
    self._popupLine2 = L.DomUtil.create('ul', 'textStylingButtons_line2', self._styleButtons);
    self._createPopupOpacity('fillopacity', self._popupLine2, 'fillOpacity', 'Fill Opacity');    // Create fill opacity field
    self._createPopupOpacity('opacity', self._popupLine2, 'opacity', 'Stroke Opacity');    // Create stroke opacity field
    self._createPopupRemoveLayer(self._popupLine2, '', `<i class="fa fa-trash-o"></i> Remove`);    // Create stroke opacity field

    // Bind popup to polygon layer
    self.bindPopup(self._wrapper, {
      className: 'draw-item-layer-popup'
    });

    // Event on:popupopen
    self.on("popupopen", function (e) {
      self.editing.enable();
    });

    // Event on:popupclose
    self.on("popupclose", function (e) {
      self.editing.disable();
    });

    // Bind popup
    self.openPopup();
    self._popup.setLatLng(self._clickedLatLng);
  },

  /**
   * Create color picker and add to popup
   * - This picker will be bound to an option "updateAttribute"
   *
   * @param className
   * @param container
   * @param updateAttribute
   * @param labelText
   * @returns {input}
   * @private
   */
  _createPopupColorPicker: function (className, container, updateAttribute, labelText) {
    let self = this;

    // Create picker wrapper
    let wrapper = L.DomUtil.create('li', className + ' color-picker', container);

    // Create label
    let label = L.DomUtil.create('label', '');
    label.innerHTML = labelText;

    // Bind label to wrapper
    wrapper.appendChild(label);

    // Create input & bind to wrapper
    let input = L.DomUtil.create('input', '', wrapper);

    // Color picker init
    $(input).spectrum({
      color: self.options[updateAttribute] || "#f06eaa",
      showButtons: false,
      move: function (color) {
        self.options[updateAttribute] = color.toHexString();
        self.updateContent();
      }.bind(self)
    });

    return input;
  },

  /**
   * Create opacity input for popup of polygon
   * @param className
   * @param container
   * @param updateAttribute
   * @param labelText
   * @private
   */
  _createPopupOpacity: function (className, container, updateAttribute, labelText) {
    let self = this;

    // Create picker wrapper
    let wrapper = L.DomUtil.create('li', className + ' opacity-input', container);

    // Create label
    let label = L.DomUtil.create('label', '');
    label.innerHTML = labelText;

    // Bind label to wrapper
    wrapper.appendChild(label);

    // Create input range & bind to wrapper
    let input = L.DomUtil.create('input', '', wrapper);

    // Setup default attributes for input
    $(input).attr('type', 'range');
    $(input).attr('max', '100');
    $(input).attr('step', '10');

    // Set opacity value
    let opacityValue = parseFloat(self.options[updateAttribute]) * 100;
    $(input).val(opacityValue);

    // Set event:change for input range
    $(input).change((e)=> {
      self.options[updateAttribute] = parseFloat($(input).val()) / 100;
      self.updateContent();
    });
  },

  /**
   * Create stroke weight input for popup of polygon
   * @param className
   * @param container
   * @param updateAttribute
   * @param labelText
   * @private
   */
  _createPopupStrokeWeight: function (className, container, updateAttribute, labelText) {
    let self = this;

    // Create picker wrapper
    let wrapper = L.DomUtil.create('li', className + ' opacity-input', container);

    // Create label
    let label = L.DomUtil.create('label', '');
    label.innerHTML = labelText;

    // Bind label to wrapper
    wrapper.appendChild(label);

    // Create input range & bind to wrapper
    let input = L.DomUtil.create('input', '', wrapper);

    // Setup default attributes for input
    $(input).attr('type', 'range');
    $(input).attr('min', '0');
    $(input).attr('max', '30');
    $(input).attr('step', '1');

    // Set opacity value
    $(input).val(self.options[updateAttribute]);

    // Set event:change for input range
    $(input).change((e)=> {
      self.options[updateAttribute] = $(input).val();
      self.updateContent();
    });
  },

  /**
   * Create border style picker for popup of polygon
   * @param innerHTML
   * @param className
   * @param container
   * @returns {button}
   * @private
   */
  _createPopupBorderStyle: function (innerHTML, className, container) {
    let self = this;

    // Create button wrapper
    let wrapper = L.DomUtil.create('li', className, container);

    // Define css & text for button
    let styleButton = L.DomUtil.create('button', 'btn btn-default', wrapper);
    styleButton.type = "button";
    styleButton.innerHTML = innerHTML;

    // Update border style for button
    $(styleButton).css('border-style', self.options.borderStyle);

    // Setup event on:click
    $(styleButton).on('click', (e)=> {
      // Swap border style of polygon layer
      switch (self.options.borderStyle) {
        case 'solid':
          self.options.borderStyle = 'dotted';
          self.options.dashArray = "1, 5";
          break;
        case 'dotted':
          self.options.borderStyle = 'dashed';
          self.options.dashArray = "10,10";
          break;
        case 'dashed':
          self.options.borderStyle = 'solid';
          self.options.dashArray = "";
          break;
        default:
          self.options.borderStyle = 'dotted';
          self.options.dashArray = "1, 5";
          break;
      }

      // Update border style for button
      $(styleButton).css('border-style', self.options.borderStyle);

      // Update polygon layer on map
      self.updateContent();
    });

    return styleButton;
  },

  /**
   * Generate button remove polygon layer on map. This button will be rendered to popup
   * @param container
   * @param className
   * @param innerHTML
   * @returns {*}
   * @private
   */
  _createPopupRemoveLayer: function (container, className, innerHTML) {
    let self = this;

    // Create button wrapper
    let wrapper = L.DomUtil.create('li', className, container);

    // Define css & text for button
    let removeButton = L.DomUtil.create('button', 'btn btn-danger', wrapper);
    removeButton.type = "button";
    removeButton.innerHTML = innerHTML;

    // Setup event on:click
    $(removeButton)
      .off('click')
      .on('click', ()=> {
        self._removePolygon();
      });

    return removeButton;
  },

  // Update render result
  updateContent: function () {
    let self = this;
    self.updateStyle();
    self._savePolygon();
  },

  /**
   * Redraw polygon marker on map
   */
  updateStyle: function () {
    let self = this;

    if (!self._map) {
      return;
    }

    self.setStyle(self.options);
  },

  /**
   * Save draw polygon to server via API Request
   * @private
   */
  _savePolygon: function () {
    let self = this;

    if (self._timeout) {
      clearTimeout(self._timeout);
    }
    self._timeout = setTimeout(function () {

      let method = self.id ? "PUT" : "POST";
      let url = self.id
        ? `${L.NETWORK.CONSTANT.domain}/api/${L.NETWORK.CONSTANT.version}/markup/${self.id}`
        : `${L.NETWORK.CONSTANT.domain}/api/${L.NETWORK.CONSTANT.version}/markup/`

      let locations = [];
      _.forEach(self.getLatLngs(), (o)=> {
        locations.push({
          lat: o.lat,
          lon: o.lng,
        });
      });

      $.ajax({
        method: method,
        url: url,
        headers: {
          'Authorization': 'Bearer ' + L.NETWORK.CONSTANT.token
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({
          type: L.NETWORK.MARKUPTYPES.POLYGON,
          content: JSON.stringify(self.options),
          locations: locations,
          operatorId: L.NETWORK.CONSTANT.operatorId
        }),
        success: function (response) {
          if (!response) {
            return;
          }

          // Update id to markup
          self.id = response.id;
        }.bind(self)
      });
    }.bind(self), 500);
  },

  /**
   * Remove marker by using request to Server via API portal
   * @private
   */
  _removePolygon: function () {
    let self = this;

    let id = self.id;

    // Close popup
    self.closePopup();

    // disable editing mode
    self.editing.disable();

    // Remove rectangle
    self._map.removeLayer(self);

    if (id) {
      // Make remove request to server
      $.ajax({
        method: "DELETE",
        url: `${L.NETWORK.CONSTANT.domain}/api/${L.NETWORK.CONSTANT.version}/markup/${id}`,
        headers: {
          'Authorization': 'Bearer ' + L.NETWORK.CONSTANT.token
        }
      });
    }
  }
});

/**
 * Declare custom drawing polygon
 * See: leaflet-draw/src/draw/handler/Draw.Polygone.js
 * @type {{}}
 */
L.Draw.Custom = L.Draw.Custom || {};
L.Draw.Custom.Polygon = L.Draw.Polygon.extend({
  options: {
    showArea: false,
    shapeOptions: {
      stroke: true,
      color: '#f06eaa',
      weight: 4,
      opacity: 0.5,
      fill: true,
      fillColor: '#f06eaa', //same as color by default
      fillOpacity: 0.2,
      clickable: true
    },
    metric: true // Whether to use the metric measurement system or imperial
  },

  Poly: L.DrawPolygon
});
