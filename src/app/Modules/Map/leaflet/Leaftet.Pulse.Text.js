L.Icon.Pulse.Text = L.Icon.Pulse.extend({
  options: {
    text: '',
    onClick: function () {
    }
  },

  initialize: function (options) {
    L.setOptions(this, options);
    L.Icon.Pulse.prototype.initialize.call(this, options);
  },

  // Method of Leaflet to override
  createIcon: function (oldIcon) {
    var divIcon = L.Icon.Pulse.prototype.createIcon.call(this, oldIcon);
    this._labelIcon = L.DomUtil.create('span', 'icon-text', divIcon);
    this._labelIcon.innerText = this.options.text;

    L.DomEvent.on(divIcon, 'click', this.options.onClick, this);
    return divIcon;
  },

  // custom method
  // set icon text
  setIconText: function (newText) {
    this._labelIcon.innerText = newText;
  },
  // Custom method
  getIconText: function () {
    return this._labelIcon.innerText || "";
  }
});
L.icon.pulse.text = function (options) {
  return new L.Icon.Pulse.Text(options);
};
