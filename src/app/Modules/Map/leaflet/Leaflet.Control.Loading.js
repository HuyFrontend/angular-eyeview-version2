L.Control.Loading = L.Control.extend({
  options: {
    position: 'topleft'
  },

  _count: 0,

  onAdd: function (map) {
    var controlDiv = L.DomUtil.create('div', 'leaflet-control-loading no-display');
    var controlUI = L.DomUtil.create('div', 'leaflet-control-command-interior', controlDiv);
    var spinner = L.DomUtil.create('img', '', controlUI);
    spinner.src = "/assets/svg/map-indicator.svg";

    var text = L.DomUtil.create('label', 'loading-text', controlUI);
    text.textContent = 'Loading ...';
    return controlDiv;
  },

  show: function () {
    this._count++;
    this._container.classList.remove('no-display');
  },

  hide: function () {
    this._count--;
    if (this._count < 0) {
      this._count = 0;
    }

    if (this._count === 0) {
      this._container.classList.add('no-display');
    }
  }
});

L.control.loading = function (options) {
  return new L.Control.Loading(options);
};
