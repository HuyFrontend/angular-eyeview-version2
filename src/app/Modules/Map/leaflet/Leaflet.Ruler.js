L.DragPath = L.Path.extend({
  initialize: function (e, t, s) {
    L.Path.prototype.initialize.call(this, e, t, s)
    // , this.sheet = s.sheet, this.is_calibrating = s.calibration
    // this.sheet.on("change:calibration", this.calibrate, this), this.sheet.on("delete:calibration", this.deleteCalibration, this)
  },
  impostorOptions: {
    stroke: "#ff0000",
    "stroke-linejoin": "round",
    "stroke-linecap": "round",
    "stroke-opacity": 0,
    "stroke-width": 2,
    fill: "none"
  },
  _initElements: function () {
    L.Path.prototype._initElements.call(this);
    // var e = this._dragImpostor = this._createElement("path");
    // for (var t in this.impostorOptions) e.setAttribute(t, this.impostorOptions[t]);
    // this._container.appendChild(e);
  },
  _updatePath: function () {
    L.Path.prototype._updatePath.call(this);
    // var e = this._path.getAttribute("d");
    // this._dragImpostor.setAttribute("d", e)
  },
  _initEvents: function () {
    L.Path.prototype._initEvents.call(this);
    // if (this.options.clickable) {
    //   L.DomEvent.on(this._container, "click", this._onMouseClick, this);
    //   for (var e = ["dblclick", "mousedown", "mouseover", "mouseout", "mousemove", "contextmenu"], t = 0; t < e.length; t++) L.DomEvent.on(this._container, e[t], this._fireMouseEvent, this)
    // }
  }
});

L.LineRuler = L.DragPath.extend({
  initialize: function (e, t, s) {
    L.Path.prototype.initialize.call(this, s), this._start = e, this._end = t
  },
  options: {
    fillOpacity: 1,
    metric: true,
    stroke: true,
    weight: 2,
    color: "#ff0000",
    opacity: 1,
    calibration: !1,
    clickable: !0
  },
  _isDrawing: false,
  isDrawing: function () {
    return this._isDrawing;
  },
  projectLatlngs: function () {
    this._startPoint = this._map.latLngToLayerPoint(this._start), this._endPoint = this._map.latLngToLayerPoint(this._end)
  },
  getBounds: function () {
    return new L.LatLngBounds(this._start, this._end)
  },
  setEndpoints: function (e, t) {
    this._start = e, this._end = t, this.redraw()
  },
  getPathString: function () {
    if (!L.Browser.svg) return "";
    var e = this._startPoint,
      t = this._endPoint,
      s = "M" + e.x + "," + e.y;
    return s += "L" + t.x + "," + t.y
  },
  _onMouseOver: function () {
    if (this.isDrawing()) return;
    this._path.setAttribute("stroke", "#1A6680");
    this._text.setAttribute("fill", "#1A6680");
  },
  _onMouseOut: function () {
    if (this.isDrawing()) return;
    this._path.setAttribute("stroke", "#ff0000");
    this._text.setAttribute("fill", "#ff0000");
  },
  _initEvents: function () {
    L.DragPath.prototype._initEvents.call(this);
    // if (this.options.clickable) {
    //   L.DomEvent.on(this._container, "click", this._onMouseClick, this);
    //   for (var e = ["dblclick", "mousedown", "mouseover", "mouseout", "mousemove", "contextmenu"], t = 0; t < e.length; t++) L.DomEvent.on(this._container, e[t], this._fireMouseEvent, this)
    // }

    // hover event
    L.DomEvent.on(this._path, 'mouseover', this._onMouseOver, this);
    L.DomEvent.on(this._path, 'mouseout', this._onMouseOut, this);
  }
});

L.Edit.LineRuler = L.Edit.Rectangle.extend({
  save: function () {
    var e = this._shape.getSheet(),
      t = L.Helpers.divisor(e),
      s = L.Helpers.scaleAndRoundLatLng(this._shape._start, t),
      i = L.Helpers.scaleAndRoundLatLng(this._shape._end, t),
      n = L.Helpers.boundsToFrame(this._shape.getBounds(), t);
    this._annotation || this.createNewAnnotation();
    var a = [n[0] - 100, n[1] - 100, n[2] + 200, n[3] + 200];
    this._annotation.save({
      start: s,
      end: i,
      frame: a
    });
  },
  _setupNewAnnotation: function (e) {
    e.set({
      type: "line",
      init_zoom: 1
    })
  },
  _cornerCursors: function () {
    return ["crosshair", "crosshair"]
  },
  _onMarkerDragStart: function (e) {
    L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);
    var t = this._getCorners(),
      s = e.target,
      i = s._cornerIndex;
    this._oppositeCorner = t[(i + 1) % 2];
    this._toggleCornerMarkers(0, i);
    $(this._map._container).addClass("leaflet-drawing");
  },
  _onMarkerDragEnd: function (e) {
    L.Edit.Rectangle.prototype._onMarkerDragEnd.call(this, e), $(this._map._container).removeClass("leaflet-drawing")
  },
  _getCenter: function () {
    var e = this._shape._start,
      t = this._shape._end,
      s = -(e.lat - t.lat) / 2,
      i = -(e.lng - t.lng) / 2;
    return new L.LatLng(e.lat + s, e.lng + i)
  },
  _move: function (e) {
    var t = this._shape._start,
      s = this._shape._end,
      i = this._getCenter(),
      n = (this._getCorners(), [e.lat - i.lat, e.lng - i.lng]),
      a = new L.LatLng(t.lat + n[0], t.lng + n[1]),
      r = new L.LatLng(s.lat + n[0], s.lng + n[1]);
    this._shape.setEndpoints(a, r);
    this._repositionCornerMarkers();
    this._toggleCornerMarkers(1);
  },
  _resize: function (e) {
    this._oppositeCorner == this._shape._start ? this._shape.setEndpoints(this._shape._start, e) : this._shape.setEndpoints(e, this._shape._end)
  },
  _getCorners: function () {
    return [this._shape._start, this._shape._end]
  },
  _createPopover: function () {
    L.Edit.SimpleShape.prototype._createPopover.call(this);
    var e = this._shape._start,
      t = this._shape._end;
    pos = e.lat < t.lat ? e : t, this._shape.openPopup(pos)
  },
  _repositionCenterMarker: function () {
    var centerLatLng = this._getCenter();
    this._moveMarker.setLatLng(centerLatLng);
  }
});

L.Ruler = L.LineRuler.extend({
  initialize: function (e, t) {
    L.LineRuler.prototype.initialize.call(this, e, t);
    // , this.sheet = s.sheet, this.is_calibrating = s.calibration
    // this.sheet.on("change:calibration", this.calibrate, this), this.sheet.on("delete:calibration", this.deleteCalibration, this)

    this.on('edit', function (e) {
      this._saveMarkup();
    }.bind(this));
  },
  projectLatlngs: function () {
    L.LineRuler.prototype.projectLatlngs.call(this);
    var e = this._map.getZoom();
    // Add this for init value if not matching switch case
    this.maxfontSz = 10, this.max_tick_width = 8;
    switch (e) {
      case 13:
      case 14:
        this.maxfontSz = 14, this.max_tick_width = 10;
        break;
      case 15:
      case 16:
        this.maxfontSz = 18, this.max_tick_width = 20;
        break;
      case 17:
        this.maxfontSz = 20, this.max_tick_width = 30;
        break;
      case 18:
        this.maxfontSz = 30, this.max_tick_width = 40;
    }
    this._updatePath();
  },
  setCalibrateScale: function () {
    var distance = this._end.distanceTo(this._start);
    var subtext = L.GeometryUtil.readableDistance(distance, this.options.metric);
    this._text.textContent = subtext;
  },
  calibrate: function () {
    L.LineRuler.prototype._updatePath.call(this)
  },
  calculateLength: function () {
    var e = this._end.lat - this._start.lat,
      t = this._end.lng - this._start.lng,
      s = Math.sqrt(Math.pow(e, 2) + Math.pow(t, 2));
    return s
  },
  _initPath: function () {
    L.LineRuler.prototype._initPath.call(this);
    var e, t = "";
    if (!this._text) {
      e = this.options.color, this._text = this._createElement("text"), this._text.setAttribute('class', 'leaflet-clickable'), this.is_calibrating && (this.editing._annotation && (t = this.editing._annotation.get("size_string")), this._text.appendChild(document.createTextNode(t))), this._container.appendChild(this._text);
      var s = this;
      _.defer(function () {
        s.updateTextPos(), s._updatePath()
      }), $(this._text).attr({
        "text-anchor": "middle",
        "font-size": 17,
        fill: e
      })
    }
  },
  getPathString: function () {
    var e, t = this._startPoint,
      s = this._endPoint,
      i = Math.atan2(t.y - s.y, t.x - s.x),
      n = Math.cos(i),
      a = Math.sin(i),
      r = Math.sin(i + Math.PI / 6),
      o = Math.cos(i + Math.PI / 6),
      l = Math.sqrt(Math.pow(t.y - s.y, 2) + Math.pow(t.x - s.x, 2));
    this.txtBox = null;
    try {
      this.txtBox = this._text.getBoundingClientRect()
    } catch (c) {
      this.txtBox = {
        top: this._text.offsetTop,
        left: this._text.offsetLeft
      }
    }
    var h = Math.sqrt(Math.pow(this.txtBox.width * n, 2), Math.pow(this.txtBox.height * a, 2));
    this.space = Math.max(1.5 * h, 2 * this.txtBox.height);

    var d = l / 4;
    d > this.maxfontSz && (d = this.maxfontSz), this._text.setAttribute("font-size", d);
    var p = l / 3;

    var text_y = 0;
    var text_x = 0;

    return p > this.max_tick_width && (p = this.max_tick_width), e = "M" + t.x + "," + t.y, e += "L" + (t.x - p / 2 * a) + "," + (t.y + p / 2 * n), e += "L" + (t.x + p / 2 * a) + "," + (t.y - p / 2 * n), this.is_calibrating && (e += "M" + t.x + "," + t.y, e += "L" + (t.x - p / 2 * r) + "," + (t.y + p / 2 * o), e += "L" + (t.x + p / 2 * r) + "," + (t.y - p / 2 * o), e += "L" + (t.x + p / 2 * r) + "," + (t.y - p / 2 * o), e += "L" + (t.x - p / 2 * r) + "," + (t.y + p / 2 * o), e += "M" + s.x + "," + s.y, e += "L" + (s.x - p / 2 * r) + "," + (s.y + p / 2 * o), e += "L" + (s.x + p / 2 * r) + "," + (s.y - p / 2 * o), e += "L" + (s.x + p / 2 * r) + "," + (s.y - p / 2 * o), e += "L" + (s.x - p / 2 * r) + "," + (s.y + p / 2 * o)), e += "M" + t.x + "," + t.y, l > this.space ? (e += "L" + (t.x - n * (l / 2 - this.space / 2)) + "," + (t.y - a * (l / 2 - this.space / 2)), e += "M" + (t.x - n * (l / 2 + this.space / 2)) + "," + (t.y - a * (l / 2 + this.space / 2)), e += "L" + s.x + "," + s.y) : e += "M" + s.x + "," + s.y, e += "L" + (s.x - p / 2 * a) + "," + (s.y + p / 2 * n), e += "L" + (s.x + p / 2 * a) + "," + (s.y - p / 2 * n), e += "L" + s.x + "," + s.y, this.updateTextPos(), this.text_width = this.txtBox.width, this.text_height = this.txtBox.height, text_x = t.x - n * (l / 2), text_y = t.y - a * (l / 2) + this.txtBox.height / 3, $(this._text).attr({
      x: text_x,
      y: text_y
    }), L.Browser.svg ? e : ""
  },
  updateTextPos: function () {
    {
      var e = this._startPoint,
        t = this._endPoint,
        s = Math.atan2(e.y - t.y, e.x - t.x);
      Math.cos(s), Math.sin(s), Math.sqrt(Math.pow(e.y - t.y, 2) + Math.pow(e.x - t.x, 2))
    }
  },
  _updatePath: function () {
    this.setCalibrateScale(), this.calibrate(), L.LineRuler.prototype._updatePath.call(this)
  },
  deleteCalibration: function () {
    this.is_calibrating || this._updatePath()
  },
  _onTextMouseOver: function () {
    if (this.isDrawing()) return;
    this._text.setAttribute("fill", "#1A6680");
    this._path.setAttribute("stroke", "#1A6680");
  },
  _onTextMouseOut: function () {
    if (this.isDrawing()) return;
    this._text.setAttribute("fill", "#ff0000");
    this._path.setAttribute("stroke", "#ff0000");
  },
  _removeRuler: function () {
    if (this.editing && this.editing.enabled()) {
      // disable editing mode
      this.editing.disable();
    }

    // Unbind event
    this._map.off('click', this._disableEdit, this);

    // Remove ruler from map
    this._map.removeLayer(this);
    // Validate ruler id
    if (!this.id) {
      return;
    }
    // Remove Ruler from server
    $.ajax({
      method: 'DELETE',
      url: `${L.NETWORK.CONSTANT.domain}/api/${L.NETWORK.CONSTANT.version}/markup/${this.id}`,
      headers: {
        'Authorization': 'Bearer ' + L.NETWORK.CONSTANT.token
      }
    });
  },
  _initEvents: function () {
    var self = this;
    L.LineRuler.prototype._initEvents.call(this);

    // hover event
    L.DomEvent.on(this._text, 'mouseover', this._onTextMouseOver, this);
    L.DomEvent.on(this._text, 'mouseout', this._onTextMouseOut, this);

    // Bind remove event on ruler
    this.bindContextMenu({
      contextmenu: true,
      contextmenuWidth: 140,
      contextmenuInheritItems: false,
      contextmenuItems: [{
        text: 'Remove',
        callback: function () {
          self._removeRuler();
        }
      }]
    });

    // Enable editing on click to ruler label
    L.DomEvent.on(this._text, 'click', function () {
      if (this.editing.enabled()) {
        return;
      }
      this._disableAllEdit();
      this.editing.enable();
      this._map.on('click', this._disableEdit, this);
    }, this);
  },
  _timeout: null,
  _saveMarkup: function () {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    this._timeout = setTimeout(function () {
      // Generate locations
      let locations = [];

      // _start
      locations.push({
        lat: this._start.lat,
        lon: this._start.lng
      });

      // _end
      locations.push({
        lat: this._end.lat,
        lon: this._end.lng
      });

      // Detect method and url
      let method = this.id ? "PUT" : "POST";
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
          type: L.NETWORK.MARKUPTYPES.RULER,
          content: JSON.stringify(this.options),
          locations: locations,
          operatorId: L.NETWORK.CONSTANT.operatorId
        }),
        success: function (response) {
          if (!response) {
            return;
          }
          this.id = response.id;
          this.markupId = response.id;
          L.NETWORK.MARKUPS.push(this);
        }.bind(this)
      });
    }.bind(this), 500);
  },
  _disableEdit: function () {
    this.editing.disable();
  },
  _disableAllEdit: function () {
  }
});

L.Draw.Ruler = L.Draw.SimpleShape.extend({
  options: {},
  initialize: function (e, t) {
    this.type = "ruler";
    L.Draw.SimpleShape.prototype.initialize.call(this, e, t);
    this._rulers = [];
  },
  _initialLabelText: "Click and drag to draw ruler",
  _makeShapeOptions: function () {
    return _.extend({}, this.options)
  },
  _drawShape: function (e) {
    if (this._shape) {
      this._shape._isDrawing = true;
      this._shape.setEndpoints(this._startLatLng, e);
    } else {
      this._shape = new L.Ruler(this._startLatLng, e, this._makeShapeOptions());
      this._map.addLayer(this._shape);
    }
  },
  _fireCreatedEvent: function () {
    var e = new L.Ruler(this._startLatLng, this._shape._end, this._makeShapeOptions());
    L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, e);
    this._rulers.push(e);
    // Save Ruler to server
    e._saveMarkup();
  },
  removeRulers: function () {
    var l = this._rulers.length;
    for (var i = 0; i < l; i++) {
      this._map.removeLayer(this._rulers[i]);
    }
    this._rulers = [];
    this.disable();
  },
  _getTooltipText: function () {
    return {
      text: this._endLabelText,
      subtext: 'Right click on ruler to remove'
    };
  }
});

L.Edit.Ruler = L.Edit.LineRuler.extend({
  _setupNewAnnotation: function (e) {
    var t = L.Helpers.divisor(this._shape.getSheet()),
      s = L.Helpers.boundsToFrame(this._shape.getBounds(), t);
    e.set({
      type: "ruler",
      init_zoom: 1,
      frame: s
    })
  },
  _openPopover: function () {
    L.Edit.LineRuler.prototype._openPopover.call(this);
    this._shape.is_calibrating && this.openEditPopup();
  },
  shouldShowEditPopup: function () {
    return this._annotation ? this._annotation && this._annotation.get("calibration") : this._shape.is_calibrating ? !0 : !1
  },
  openEditPopup: function () {
    this._pushMasterBtn || (this._pushMasterBtn = $("#pushToMaster"));
    var e = JST["annotations/ruler_edit_popup"],
      t = e(this._shape);
    this._shape.bindPopup(t, {
      closeButton: !1,
      offset: new L.Point(0, 0)
    }), this._shape.openPopup(this._shape.northLatLng());
    var s = page.data.currentUser.canToggleAnnotationEdit(this._annotation);
    s && $(this._shape._popup._container).find("#pushMasterPlaceholder").html(this._pushMasterBtn), this._editView = new L.Edit.CalibrationEditor({
      model: this._annotation,
      el: this._shape._popup._contentNode,
      shape: this._shape,
      editing: this
    }), this._editView.render()
  },
  _overrideStyle: function (e) {
    "color" in e && $(this._shape._text).attr({
      fill: e.color
    }), delete e.dashArray
  },
  _onMarkerDragStart: function (e) {
    L.Edit.LineRuler.prototype._onMarkerDragStart.call(this, e);
  },
  _onMarkerDrag: function (e) {
    L.Edit.LineRuler.prototype._onMarkerDrag.call(this, e);
    this._repositionCenterMarker();
  },
  _onMarkerDragEnd: function (e) {
    L.Edit.LineRuler.prototype._onMarkerDragEnd.call(this, e);
    var t = e.target;
    t.setOpacity(1);
  },
  removeHooks: function () {
    this._editView && (this._editView.remove(), this._editView = null), L.Edit.Rectangle.prototype.removeHooks.call(this)
  },
  _onTextDragMove: function () {
    var e = this._shape._path,
      t = this._shape._text,
      s = L.DomUtil.getPosition(e);
    t.setAttribute("dy", s.y);
    t.setAttribute("dx", s.x);
  },
  _onLayerDragStart: function () {
    L.Edit.LineRuler.prototype._onLayerDragStart.call(this), this._boundDragHandler || (this._boundDragHandler = _.bind(this._onTextDragMove, this)), this._shape.on("drag", this._boundDragHandler)
  },
  _onLayerDragEnd: function () {
    this._toggleCornerMarkers(1), this._shape.off("drag", this._boundDragHandler);
    var e = (this._shape._path, this._shape._text);
    e.setAttribute("dy", 0), e.setAttribute("dx", 0)
  },
  _move: function (e) {
    L.Edit.LineRuler.prototype._move.call(this, e);
  },
  _applyEdit: function (e) {
    "COLOR" == e.editType && (this._annotation.set({
      color: e.color
    }), e.save && this.save())
  }
});

L.Ruler.addInitHook(function () {
  L.Edit.Ruler && (this.editing = new L.Edit.Ruler(this), this.options.editable && this.editing.enable());
});
