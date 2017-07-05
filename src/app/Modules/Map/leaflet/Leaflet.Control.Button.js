L.Control.CustomButton = L.Control.extend({

  // Control Default options
  options: {
    position: 'topright',                     // Position of control to the container
    className: '',                            // Class name of button
    notification: false,                      // Show notification?
    hasNotificationClass: 'has-notification'  // Custom class for added when notification = true?
  },
  // Called when element is added to map
  onAdd: function (map) {
    // Create a button
    this._container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-button ' + this.options.className);

    // Add class notification if show notification
    if (this.options.notification) {
      this._container.classList.add(this.options.hasNotificationClass);
    }

    // Set style from options
    for (var key in this.options.style) {
      this._container.style[key] = this.options.style[key];
    }

    // Attach event click
    this._container.onclick = this.options.handler;

    return this._container;
  },
  // Set notification for button
  setNotification: function (hasNotification) {
    if (hasNotification) {
      this._container.classList.add(this.options.hasNotificationClass);
    }else{
      this._container.classList.remove(this.options.hasNotificationClass);
    }
  }
});
L.control.customButton = function (options) {
  return new L.Control.CustomButton(options);
};