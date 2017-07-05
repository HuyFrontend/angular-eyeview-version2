// Prototype for add cursor style to move marker
var oldInitIcon = L.Marker.prototype._initIcon;
L.Marker.prototype._initIcon = function () {
  oldInitIcon.call(this), this.options.cursor && (this._icon.style.cursor = this.options.cursor);
};

//custom draw text
L.Common = {
  getLatLngs: function () {
    return this._boundsToLatLngs(this.getBounds())
  },
  _boundsToLatLngs: function (e) {
    return e = L.latLngBounds(e), [e.getSouthWest(), e.getNorthWest(), e.getNorthEast(), e.getSouthEast()]
  },
  setLatLngs: function (e) {
    var t = this._convertLatLngs(e),
      s = new L.LatLngBounds(t[0], t[2]);
    return this._bounds = s, this.redraw()
  },
  _convertLatLngs: function (e) {
    var t, s;
    for (t = 0, s = e.length; s > t; t++) {
      if (L.Util.isArray(e[t]) && "number" != typeof e[t][0]) return;
      e[t] = L.latLng(e[t])
    }
    return e
  },
  bringToFront: function () {
    if (this._container) {
      var e = this._map._pathRoot;
      e.removeChild(this._container), e.appendChild(this._container)
    }
  },
  getSheet: function () {
    return page.data.sheet.toJSON()
  },
  getBounds: function () {
    return this._bounds
  },
  northLatLng: function () {
    var e = this.getLatLngs(),
      t = e[0].lng + (e[2].lng - e[0].lng) / 2;
    return new L.LatLng(e[0].lat, t)
  },
  setBounds: function (e) {
    this.setLatLngs(this._boundsToLatLngs(e))
  }
};

L.Path.include(L.Common);

L.Text = L.Path.extend({
  options: {
    text: {
      offsetText: {
        x: 3,
        y: 2,
        width: 6
      },
      fontColor: '#FF0000',
      fontStyle: '',
      fontSize: 10,
      fontWeight: '',
      textDecoration: ''
    },
    path: {
      borderColor: '#0033FF',
      borderStyle: ''
    },
    weight: 2,
    opacity: .5,
    fill: !0,
    fillOpacity: 0,
    clickable: !0
  },
  textSizeFactorMap: {
    xsmall: .003,
    small: .006,
    medium: .01,
    large: .024
  },
  BUFFER: 5,
  _timeout: null,
  initialize: function (e, t) {
    t = _.extend({
      style: {
        borderColor: "#ff0000", // red
        borderStyle: '', // solid
        fontColor: "#ff0000", // red
        fontSize: 12,
        fontStyle: '',
        fontWeight: '',
        oldBorderColor: "#ff0000",
        textDecoration: ''
      }
    }, t);
    L.Path.prototype.initialize.call(this, t);
    this._origFontSize = "";
    this.string = this.options.content || t.content || '';
    this._bounds = e;
    this._padding = new L.LatLngBounds(new L.LatLng(.008, 0), new L.LatLng(0, 0));
    this._latlngs = [this._bounds._northEast, this._bounds._southWest];

    // editor template
    this._wrapper = L.DomUtil.create('div', 'editTextAnnotation');
    this._textarea = this._createTextAreaInput(this.string, 'editTextAnnotationViewer', this._wrapper);
    this._styleButtons = L.DomUtil.create('div', 'textStylingButtons', this._wrapper);
    this._styleButtonsLine1 = L.DomUtil.create('ul', 'textStylingButtons_line1', this._styleButtons);
    this._styleButtonsLine1_Color = this._createColorPickerInput('fontcolor', this._styleButtonsLine1, 'fontColor');
    this._styleButtonsLine1_Bold = this._createStyleButton('<i class="fa fa-bold"></i>', 'bold', this._styleButtonsLine1, this._boldText);
    this._styleButtonsLine1_Italic = this._createStyleButton('<i class="fa fa-italic"></i>', 'italic', this._styleButtonsLine1, this._italicText);
    this._styleButtonsLine1_Underline = this._createStyleButton('<i class="fa fa-underline"></i>', 'underline', this._styleButtonsLine1, this._underlineText);
    this._styleButtonsLine1_FontSizeDescrease = this._createStyleButton('A-', 'fontsizedecrease', this._styleButtonsLine1, this._decreaseFontSize);
    this._styleButtonsLine1_FontSizeIncrease = this._createStyleButton('A+', 'fontsizeincrease', this._styleButtonsLine1, this._increaseFontSize);

    this._styleButtonsLine2 = L.DomUtil.create('ul', 'textStylingButtons_line2', this._styleButtons);
    this._styleButtonsLine2_BoxBorderColor = this._createColorPickerInput('boxbordercolor', this._styleButtonsLine2, 'borderColor');
    this._styleButtonsLine2_BoxBorder = this._createStyleButton('border', 'boxborder', this._styleButtonsLine2, this._borderStyleChange);
    this._styleButtonsLine2_Remove = this._createStyleButton('<i class="fa fa-trash"></i> Remove', 'remove', this._styleButtonsLine2, this._removeMarkup);

    this.bindPopup(this._wrapper, {
      minWidth: 250,
      closeButton: false
    });

    this.on("popupopen", function (e) {
      this._latlngs = [e.target._bounds._northEast, e.target._bounds._southWest];

      //set popup middle top text draw
      var latPopup = e.target._latlngs[0].lat;
      var lngPopup = (e.target._latlngs[0].lng + e.target._latlngs[1].lng) / 2;
      var latlngPopup = new L.latLng(latPopup, lngPopup);
      e.popup.setLatLng(latlngPopup);
      // compileText(e.target);
      e.target.editing.enable();
      e.target._map.on('click', this._popupClose(e));

      // focus to textarea
      e.target._textarea.focus();
    }.bind(this));

    this.on("popupclose", function (e) {
      e.target._map.off('click', this._popupClose(e));
    }.bind(this));

    this.on('edit', function (e) {
      // Sometimes, release the rectangle after moving too fast, the popup not open so we add timeout for hot fix.
      setTimeout(function () {
        this.openPopup();
      }.bind(this), 100);

      this._saveMarkup();
    }.bind(this));

    // Bind default content to map
    this.updateContent(this.string, this.options.style, true);

    this._updateEditorButtonsState();
  },
  _increaseFontSize: function () {
    this.options.style.fontSize++;
    if (this.options.style.fontSize >= 30) this.options.style.fontSize = 30;
    this.updateContent(this.string, this.options.style);
  },
  _decreaseFontSize: function () {
    this.options.style.fontSize--;
    if (this.options.style.fontSize <= 5) this.options.style.fontSize = 5;
    this.updateContent(this.string, this.options.style);
  },
  _boldText: function () {
    this.options.style.fontWeight = this.options.style.fontWeight === 'bold' ? '' : 'bold';
    this.updateContent(this.string, this.options.style);
  },
  _italicText: function () {
    this.options.style.fontStyle = this.options.style.fontStyle === 'italic' ? '' : 'italic';
    this.updateContent(this.string, this.options.style);
  },
  _underlineText: function () {
    this.options.style.textDecoration = this.options.style.textDecoration === 'underline' ? '' : 'underline';
    this.updateContent(this.string, this.options.style);
  },
  _borderStyleChange: function () {
    var borderStyles = ['5,5', '10,10'];
    var currentBorderStyle = _.find(borderStyles, function (el) {
      return this.options.style.borderStyle === el;
    }.bind(this));
    if (!currentBorderStyle) {
      currentBorderStyle = '';
    }

    if (currentBorderStyle === '5,5') currentBorderStyle = borderStyles[1];
    else if (currentBorderStyle === '10,10') currentBorderStyle = borderStyles[2];
    else if (currentBorderStyle === '') currentBorderStyle = borderStyles[0];
    else currentBorderStyle = borderStyles[2];
    this.options.style.borderStyle = currentBorderStyle;
    this.updateContent(this.string, this.options.style);
  },
  _createStyleButton: function (innerHTML, className, container, clickCb) {
    clickCb = clickCb || function () {
      };
    var wrapper = L.DomUtil.create('li', className, container);
    var styleButton = L.DomUtil.create('button', '', wrapper);
    styleButton.type = "button";
    styleButton.innerHTML = innerHTML;
    L.DomEvent.on(styleButton, 'click', clickCb, this);

    // this.on("popupclose", function (e) {
    //   L.DomEvent.off(styleButton, 'click');
    // }.bind(this));
    return styleButton;
  },
  _createColorPickerInput: function (className, container, updateAttribute) {
    var wrapper = L.DomUtil.create('li', className + ' color-picker', container);
    var input = L.DomUtil.create('input', '', wrapper);

    // Color picker init
    $(input).spectrum({
      color: this.options.style[updateAttribute] || "#f00",
      showButtons: false,
      move: function (color) {
        this.options.style[updateAttribute] = color.toHexString();
        this.updateContent(this.string, this.options.style);
      }.bind(this)
    });

    // this.on("popupclose", function (e) {
    //   $(input).spectrum('destroy');
    // }.bind(this));

    return input;
  },
  _createTextAreaInput: function (content, className, container) {
    var areaInput = L.DomUtil.create('textarea', 'editTextAnnotationViewer', container);
    areaInput.value = content;

    L.DomEvent.on(areaInput, 'keyup', function (e) {
      this.string = e.target.value;
      this.updateContent(this.string, this.options.style);
    }, this);

    return areaInput;
  },
  _updateEditorButtonsState: function () {
    // border style button
    if (this.options.style.borderStyle === '5,5') this._styleButtonsLine2_BoxBorder.style.borderStyle = 'dotted';
    else if (this.options.style.borderStyle === '10,10') this._styleButtonsLine2_BoxBorder.style.borderStyle = 'dashed';
    else if (this.options.style.borderStyle === '') this._styleButtonsLine2_BoxBorder.style.borderStyle = 'solid';
    else this._styleButtonsLine2_BoxBorder.style.borderStyle = 'solid';

    // Underline button
    if (this.options.style.textDecoration === 'underline') L.DomUtil.addClass(this._styleButtonsLine1_Underline, 'active');
    else L.DomUtil.removeClass(this._styleButtonsLine1_Underline, 'active');

    // Italic
    if (this.options.style.fontStyle === 'italic') L.DomUtil.addClass(this._styleButtonsLine1_Italic, 'active');
    else L.DomUtil.removeClass(this._styleButtonsLine1_Italic, 'active');

    // Bold
    if (this.options.style.fontWeight === 'bold') L.DomUtil.addClass(this._styleButtonsLine1_Bold, 'active');
    else L.DomUtil.removeClass(this._styleButtonsLine1_Bold, 'active');
  },
  fillable: function () {
    return !0;
  },
  projectLatlngs: function () {
    var e = this._map.latLngToLayerPoint(this._padding.getSouthWest()),
      t = this._map.latLngToLayerPoint(this._padding.getNorthEast()),
      s = this._map.latLngToLayerPoint(this._bounds.getNorthEast()),
      i = this._map.latLngToLayerPoint(this._bounds.getSouthWest());
    this._xPadding = Math.abs(e.x - t.x);
    this._yPadding = Math.abs(e.y - t.y);
    this._point = {};
    this._point.x = i.x;
    this._point.y = s.y;
    this._width = Math.abs(s.x - i.x);
    this._height = Math.abs(s.y - i.y);
  },
  getPathString: function () {
    var e, t = this._map.getZoom(),
      s = this._xPadding,
      i = 0;
    t = t - 13;

    if ("text_size" in this) {
      var n;
      if (window.txt) n = 2.5 * window.txt;
      else {
        if (!(this.text_size in this.textSizeFactorMap)) throw "Unknown Text Size";
        n = this.textSizeFactorMap[this.text_size]
      }
      var a = this._map.options.crs.getSize(t).y,
        r = this.getSheet();
      r.height < r.width && (a *= r.height / r.width);
      var o = a * r.width / 3e3;
      e = Math.round(n * o);
      var l = Math.pow(2, t - 3);
      s = this.BUFFER * l, i = e + this.BUFFER * l
    } else 5 === t ? (i = 12 * this._origFontSize, e = this._origFontSize * t * 3.3) :
      4 === t ? (i = 6 * this._origFontSize, e = this._origFontSize * t * 2) :
        3 === t ? (i = 3.05 * this._origFontSize, e = this._origFontSize * t * 1.37) :
          2 === t ? (i = 1.6 * this._origFontSize, e = this._origFontSize * t * 1) :
            1 === t ? (i = .65 * this._origFontSize, e = this._origFontSize * t * 0.9) :
              (i = .22 * this._origFontSize, e = .44 * this._origFontSize);

    return this.setStyle({
      "font-size": e
    }), {
      x: this._point.x + s,
      y: this._point.y + i,
      point: this._point
    }
  },
  _createElement: function (e) {
    return document.createElementNS(L.Path.SVG_NS, e)
  },
  _initElements: function () {
    this._map._initPathRoot();
    this._initPath();
    this._initStyle();
  },
  _initPath: function () {
    this._container = this._createElement("g"),
      this._path = this._createElement("rect"),
      this._container.appendChild(this._path),
      this._text = this._createElement("text"),
      this._text.appendChild(document.createTextNode("")),
      this._container.appendChild(this._text),
      this._map._pathRoot.appendChild(this._container),
      this._clipId = "clipText" + L.stamp(this), this._clipRect = this._createElement("rect");
    var e = this._createElement("clipPath");
    e.setAttribute("id", this._clipId), e.appendChild(this._clipRect), this._setClipping(!0);
    var t = this._map._pathRoot;
    t.appendChild(e), this.on("destroy", function () {
      t.removeChild(e)
    })
  },
  _setClipping: function (e) {
    e ? this._text.setAttribute("clip-path", "url(#" + this._clipId + ")") : this._text.removeAttribute("clip-path")
  },
  _initStyle: function () {
    this._updateStyle();
  },
  _updateStyle: function () {
    L.Path.prototype._updateStyle.call(this);
    this._updateElementStyle(this._path, this._text);
  },
  _updateElementStyle: function (path, text) {

    //update style for text
    var t = {
      fill: this.options.text.fontColor,
      "font-style": this.options.text.fontStyle,
      "font-size": this.options['font-size'],
      "font-weight": this.options.text.fontWeight,
      "text-decoration": this.options.text.textDecoration,
      "style": "white-space: pre",
      //"transform": "scale(0.95, 0.95)"
    };

    $(text).attr(t);

    //update style for path
    var p = {
      "stroke": this.options.path.borderColor,
      "stroke-dasharray": this.options.path.borderStyle
    };
    $(path).attr(p);
  },
  _appendTspan: function (e, t, s) {
    //append tspan into text tag
    var i = this._createElement("tspan");

    return e.trim() || (e = " "),
      i.appendChild(document.createTextNode(e)),
      i.setAttribute("x", t.x + this.options.text.offsetText.x),
    s && i.setAttribute("dy", _.isUndefined(window.ls) ?
      "1.15em" :
    "" + window.ls + "em"),

      this._text.appendChild(i), i
  },
  _wrapWords: function (e, t, s, n) {
    let self = this;
    let i = 0;

    //limit text for text draw
    for (var a, r, o = []; s.length;)
      if (a = s[0], e.firstChild.data = o.join(n) + n + a, e.getComputedTextLength() > this._width - this.options.text.offsetText.width) {
        if (0 === _.size(o)) {
          for (r = [], s.shift(), i = 0; i < a.length; i++) r.push(a.charAt(i));
          1 === r.length ? t.push(r[0]) : self._wrapWords(e, t, r, "")
        } else t.push(o.join(n));
        o = []
      } else o.push(s.shift()), 0 === s.length && t.push(o.join(n))
  },
  _updatePath: function () {
    var self = this;

    //write text into text draw
    var e = this.getPathString(),
      t = (this.string || "").split("\n"),
      s = [],
      i = self._appendTspan("", e, !1);

    $(this._text).attr({
      x: e.x + this.options.text.offsetText.x,
      y: e.y + this.options.text.offsetText.y
    }),
      _.forEach(t, function (e) {
        var t = e.split(" ");
        self._wrapWords(i, s, t, " ")
      }, this),
      $(this._text).empty(),
      _.forEach(_.flatten(s), function (t, s) {
        self._appendTspan(t, e, 0 !== s)
      }, this);
    var n = {
      x: e.point.x,
      y: e.point.y,
      width: this._width,
      height: this._height
    };
    $(this._path).attr(n), $(this._clipRect).attr(n)
  },
  // Update render result
  updateContent: function (content, options, init) {

    //init new object for text options
    var textOptions = {
      offsetText: {
        x: 3,
        y: 2,
        width: 6
      },
      fontColor: options.fontColor,
      fontStyle: options.fontStyle,
      fontSize: options.fontSize,
      fontWeight: options.fontWeight,
      textDecoration: options.textDecoration
    };

    //inti new object for path options
    var pathOptions = {
      borderColor: options.borderColor,
      borderStyle: options.borderStyle
    };


    //update text for text draw
    this.string = content;
    this._origFontSize = options.fontSize;

    //this.options.text.fontColor = options.fontColor;
    //this.options.text.fontStyle = options.fontStyle;
    //this.options.text.fontSize = options.fontSize;
    //this.options.text.fontWeight = options.fontWeight;
    //this.options.text.textDecoration = options.textDecoration;

    this.options.text = textOptions;

    //this.options.path.borderColor = options.borderColor;
    //this.options.path.borderStyle = options.borderStyle;

    this.options.path = pathOptions;

    this.options.style = options;

    this._updateEditorButtonsState();

    this.redraw();

    if (!init) {
      this._saveMarkup();
    }

  },
  _popupClose: function (e) {
    return function () {
      e.target.editing.disable();
    }
  },
  _saveMarkup: function () {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    this._timeout = setTimeout(function () {
      // Generate locations
      let locations = [];

      // getSouthWest
      locations.push({
        lat: this._bounds.getSouthWest().lat,
        lon: this._bounds.getSouthWest().lng
      });

      // getNorthEast
      locations.push({
        lat: this._bounds.getNorthEast().lat,
        lon: this._bounds.getNorthEast().lng
      });

      // getNorthWest
      locations.push({
        lat: this._bounds.getNorthWest().lat,
        lon: this._bounds.getNorthWest().lng
      });

      // getSouthEast
      locations.push({
        lat: this._bounds.getSouthEast().lat,
        lon: this._bounds.getSouthEast().lng
      });
      // Detect method and url
      let method = this.id ? "PUT" : "POST";
      console.log('trying to post', this.id);
      let url = this.id
        ? `${L.NETWORK.CONSTANT.domain}/api/${L.NETWORK.CONSTANT.version}/markup/${this.id}`
        : `${L.NETWORK.CONSTANT.domain}/api/${L.NETWORK.CONSTANT.version}/markup/`;
      // Make request to server
      $.ajax({
        method: method,
        url: url,
        headers: {
          'Authorization': 'Bearer ' + L.NETWORK.CONSTANT.token
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({
          type: L.NETWORK.MARKUPTYPES.TEXT,
          content: JSON.stringify({
            style: this.options.style,
            content: this.string
          }),
          locations: locations,
          operatorId: L.NETWORK.CONSTANT.operatorId
        }),
        success: function (response) {
          if (!response) {
            return;
          }
          // Update id to ruler
          this.id = response.id;
          this.markupId = response.id;
          L.NETWORK.MARKUPS.push(this);
        }.bind(this)
      });
    }.bind(this), 1000);
  },
  _removeMarkup: function () {
    var id = this.id;

    // disable editing mode
    this.editing.disable();

    // Remove rectangle
    this._map.removeLayer(this);

    if (id) {
      // Make remove request to server
      $.ajax({
        method: "DELETE",
        url: `${L.NETWORK.CONSTANT.domain}/api/${L.NETWORK.CONSTANT.version}/markup/${this.id}`,
        headers: {
          'Authorization': 'Bearer ' + L.NETWORK.CONSTANT.token
        }
      });
    }
  }
});

L.Text.include({
  toGeoJSON: function () {
    return L.GeoJSON.getFeature(this, {
      type: 'LineString',
      coordinates: L.GeoJSON.latLngsToCoords(this.getLatLngs())
    });
  }
});

L.Draw.Text = L.Draw.SimpleShape.extend({
  options: {},
  initialize: function (e, t) {
    this.type = "text";
    this._initialLabelText = L.drawLocal.draw.handlers.rectangle.tooltip.start;
    L.Draw.SimpleShape.prototype.initialize.call(this, e, t);
  },
  _drawShape: function (e) {
    // Dragging to draw rectangle box
    if (this._shape) {
      this._shape.setBounds(new L.LatLngBounds(this._startLatLng, e));
    } else {
      this._shape = new L.Text(new L.LatLngBounds(this._startLatLng, e), this.makeShapeOptions());
      this._map.addLayer(this._shape);
    }
  },
  _fireCreatedEvent: function () {
    var text = new L.Text(this._shape.getBounds(), this.makeShapeOptions());
    // fire draw:created event
    L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, text);
    // need timeout to make it happen
    setTimeout(function () {
      // disable drawing mode
      this.disable();
      // Open editor
      text.editing.enable();
      text.openPopup();
    }.bind(this));
  },
  makeShapeOptions: function () {
    var newOptions = _.extend(L.Text.prototype.options, this.options);
    return newOptions;
  },
  cancelText: function () {
    this.disable();
  }
});

L.Edit.Text = L.Edit.Rectangle.extend({
  _overrideStyle: function (e, t) {
    var s = this._annotation.attributes;
    ("bordered" in t || "selected" in t) && (e.stroke = s.selected || s.bordered, e.dashArray = s.selected && !s.bordered ? "10, 7" : null), "fillOpacity" in e && (e.fillOpacity = 0)
  },
  _onMarkerDragEnd: function (e) {
    var t = e.target;
    t.setOpacity(1);
    // this._fireEdit();
    L.Edit.Rectangle.prototype._onMarkerDragEnd.call(this, e);
  },
  _onMarkerDragStart: function (e) {
    this._shape.closePopup();
    L.Edit.Rectangle.prototype._onMarkerDragStart.call(this, e);
  },
  _annotationChanged: function (e) {
    //var t = e.attributes;
    //
    //this._shape.string = t.string || "",
    //  this._shape.text_size = t.text_size,
    //this._shape._origFontSize || (this._shape._origFontSize = this._shape.options["font-size"] / t.init_zoom);
    //
    //var s = this._computeStyle(t, e.changed);
    //_.isEmpty(s) || this._shape.setStyle(s), this._shape.redraw()

    //this._shape.redraw();
  },
  _setupNewAnnotation: function (e) {
    var t = L.Helpers.divisor(this._shape.getSheet()),
      s = L.Helpers.boundsToFrame(this._shape.getBounds(), t);
    e.set({
      text_size: "large",
      type: "text",
      bordered: !1,
      string: "",
      frame: s
    })
  },
  _onTextDragMove: function () {
    var e = this._shape._path,
      t = this._shape._text,
      s = L.DomUtil.getPosition(e);
    t.setAttribute("dy", s.y);
    for (var i = 0; i < t.childNodes.length; i++) t.childNodes[i].setAttribute("dx", s.x)
  },
  _onLayerDragStart: function () {
    this._boundDragHandler || (this._boundDragHandler = _.bind(this._onTextDragMove, this)), this._shape.on("drag", this._boundDragHandler), this._shape._setClipping(!1), L.Edit.Rectangle.prototype._onLayerDragStart.call(this)
  },
  _onLayerDragEnd: function () {
    this._toggleCornerMarkers(1), "" !== this._shape.string && this._fireEdit(), this._shape.off("drag", this._boundDragHandler), this._shape._setClipping(!0);
    var e = (this._shape._path, this._shape._text);
    e.setAttribute("dy", 0);
    for (var t = 0; t < e.childNodes.length; t++) e.childNodes[t].setAttribute("dx", 0)
  },
  _applyEdit: function (e) {
    "COLOR" === e.editType && this._shape.string && (this._annotation.set({
      color: e.color
    }), e.save && this.save())
  },
  // override
  // _createMarker: function (latlng) {
  //   var marker = new L.Marker(latlng, {
  //     icon: this.options.icon,
  //     zIndexOffset: this.options.zIndexOffset * 2
  //   });
  //
  //   this._markerGroup.addLayer(marker);
  //
  //   return marker;
  // },
  // override
  _createMarker: function (latLng, icon, i) {
    i = i || {};
    var n = {
      draggable: !0,
      icon: icon,
      zIndexOffset: 10
    };
    // See top for L.Marker new prototype
    var marker = new L.Marker(latLng, L.Util.extend(n, i));
    return this._bindMarker(marker), this._markerGroup.addLayer(marker), marker;
  },
  _cornerCursors: function () {
    return ["se-resize", "ne-resize", "nw-resize", "sw-resize"];
  },
  _getCorners: function () {
    var e = this._shape.getBounds(),
      t = e.getNorthWest(),
      i = e.getNorthEast(),
      n = e.getSouthEast(),
      o = e.getSouthWest();
    return [t, i, n, o];
  },
  // override
  _createResizeMarker: function () {
    var e = this._getCorners(),
      t = this._cornerCursors();
    this._resizeMarkers = [];
    for (var i = 0, n = e.length; n > i; i++) {
      var o = this._createMarker(e[i], this.options.resizeIcon, {
        cursor: t[i]
      });
      this._resizeMarkers.push(o);
      o._cornerIndex = i;
    }
  }
});

L.Text.addInitHook(function () {
  L.Edit.Text && (this.editing = new L.Edit.Text(this), this.options.editable && this.editing.enable())
});
