L.Control.Legend = L.Control.extend({
  includes: L.Mixin.Events, // fires event

  options: {
    sourceData: null,			// source data for rendering
    container: null,      // Specify container to add to
    position: 'bottomleft'
  },
  initialize: function (options){
    L.Util.setOptions(this, options || {});
    this._layer = this.options.layer || new L.LayerGroup();
  },

  onAdd: function (map){
    var $this = this;
    this._map = map;
    this._container = L.DomUtil.create('div', 'leaflet-control-legend');
    _.each(this.options.sourceData, function (dt){
      $this._createRow(dt.color, dt.name);
    });
    this.setLayer(this._layer);
    map.on({
      'resize': this._handleAutoresize
    }, this);
    return this._container;
  },

  addTo: function (map){
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

  _createRow: function (color, name){
    var borderRadius = '20px';
    var border = '1px solid white';
    var container = L.DomUtil.create('div', 'legend-container-row', this._container);
    var divColor = L.DomUtil.create('div', 'legend-color', container);
    var labelName = L.DomUtil.create('label', 'legend-name', container);
    labelName.textContent = name;
    divColor.style['background-color'] = color;
    divColor.style['-moz-border-radius'] = borderRadius;
    divColor.style[' -webkit-border-radius'] = borderRadius;
    divColor.style['border-radius'] = borderRadius;
    divColor.style['border'] = border;
  },

  setLayer: function (layer){
    this._layer = layer;
    this._layer.addTo(this._map);
    return this;
  },

  _handleAutoresize: function (){	//autoresize this._input
  }
});


L.Map.addInitHook(function (){
  if (this.options.legendControl) {
    this.legendControl = L.control.search(this.options.legendControl);
    this.addControl(this.legendControl);
  }
});

L.control.legend = function (options){
  return new L.Control.Legend(options);
};