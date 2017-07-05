L.Control.AdditionalInfo = L.Control.extend({
  includes: L.Mixin.Events, // fires event

  options: {
    sourceData: null,			// source data for rendering
    container: null,      // Specify container to add to
    position: 'topleft'
  },
  initialize: function (options) {
    L.Util.setOptions(this, options || {});
    this._layer = this.options.layer || new L.LayerGroup();
  },

  onAdd: function (map) {
    let $this = this;
    this._map = map;
    this._container = L.DomUtil.create('div', 'leaflet-control-additionalInfo');
    this._create();
    this.setLayer(this._layer);
    map.on({
      'resize': this._handleAutoresize
    }, this);
    return this._container;
  },

  addTo: function (map) {
    if (this.options.container) {
      this._container = this.onAdd(map);
      this._wrapper = L.DomUtil.get(this.options.container);
      this._wrapper.style.position = 'relative';
      this._wrapper.appendChild(this._container);
    }
    else {
      L.Control.prototype.addTo.call(this, map);
    }

    return this;
  },

  _clear: function () {
    this._container.innerHTML = '';
  },

  _createRow: function (data) {
    let container = L.DomUtil.create('div', 'additionalInfo-container-row', this._container);
    let label = L.DomUtil.create('div', 'additionalInfo-label', container);
    let value = L.DomUtil.create('label', 'additionalInfo-value', container);
    label.textContent = data.label + ': ';
    value.textContent = data.value;
  },

  _create: function () {
    let self = this;
    _.each(this.options.sourceData, function (dt) {
      self._createRow(dt);
    });
  },

  setLayer: function (layer) {
    this._layer = layer;
    this._layer.addTo(this._map);
    return this;
  },

  _handleAutoresize: function () {	//autoresize this._input
  },

  update: function (data) {
    this.options.sourceData = data;
    this._clear();
    this._create();
  }
});


L.Map.addInitHook(function () {
  if (this.options.additionalInfoControl) {
    this.additionalInfoControl = L.control.search(this.options.additionalInfoControl);
    this.addControl(this.additionalInfoControl);
  }
});

L.control.additionalInfo = function (options) {
  return new L.Control.AdditionalInfo(options);
};
