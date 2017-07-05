L.MapToolbar = L.DrawToolbar.extend({
  getActions: function (handler) {
    return [
      /*{
       enabled: handler.removeRulers,
       title: "Remove all",
       text: "Remove all",
       callback: handler.removeRulers,
       context: handler
       },*/
      //{
      //  enabled: handler.cancelText,
      //  title: "Cancel",
      //  text: "Cancel",
      //  callback: handler.cancelText,
      //  context: handler
      //},
      {
        title: L.drawLocal.draw.toolbar.actions.title,
        text: L.drawLocal.draw.toolbar.actions.text,
        callback: this.disable,
        context: this
      }
    ];
  }
});

L.MapToolbar.include({
  getModeHandlers: function (map) {
    return [{
      enabled: true,
      handler: new L.Draw.Ruler(map, {
        repeatMode: false
      }),
      title: 'Ruler'
    }, {
      enabled: true,
      handler: new L.Draw.Text(map, {
        repeatMode: true
      }),
      title: 'Text'
    }, {
      enabled: true,
      handler: new L.Draw.Custom.Polygon(map, this.options.polygon),
      title: L.drawLocal.draw.toolbar.buttons.polygon
    }];
  }
});

L.Control.MapControl = L.Control.Draw.extend({
  initialize: function (options) {
    if (L.version < '0.7') {
      throw new Error('Leaflet.draw 0.2.3+ requires Leaflet 0.7.0+. Download latest from https://github.com/Leaflet/Leaflet/');
    }

    L.Control.prototype.initialize.call(this, options);

    var toolbar;

    this._toolbars = {};

    // Initialize toolbars
    if (L.MapToolbar && this.options.draw) {
      toolbar = new L.MapToolbar(this.options);

      this._toolbars[L.MapToolbar.TYPE] = toolbar;

      // Listen for when toolbar is enabled
      this._toolbars[L.MapToolbar.TYPE].on('enable', this._toolbarEnabled, this);
    }

    if (L.EditToolbar && this.options.edit) {
      toolbar = new L.EditToolbar(this.options.edit);

      this._toolbars[L.EditToolbar.TYPE] = toolbar;

      // Listen for when toolbar is enabled
      this._toolbars[L.EditToolbar.TYPE].on('enable', this._toolbarEnabled, this);
    }
  },
  disableToolbar: function () {
    for (var toolbarId in this._toolbars) {
      for(var mode in this._toolbars[toolbarId]._modes){
        this._toolbars[toolbarId]._modes[mode].button.classList.add('disabled');
      }
    }
  },
  enableToolbar: function () {
    for (var toolbarId in this._toolbars) {
      for(var mode in this._toolbars[toolbarId]._modes){
        this._toolbars[toolbarId]._modes[mode].button.classList.remove('disabled');
      }
    }
  }
});
