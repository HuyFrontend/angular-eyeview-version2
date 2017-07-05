L.Control.Filter = L.Control.extend({
  options: {
    className: '',
    parentTarget: null
  },

  /**
   * Return true to indicate that current target is container
   * Return false if container or target not exist or not click on that elem
   * @param target
   * @param container
   * @returns {*}
   * @private
   */
  _isClickOnElem: function (target, container) {
    if (target && container) {
      return target.closest(container).length || target.is(container);
    }
  },

  /**
   * Show hide filter panel when click on app
   * @param e
   * @private
   */
  _checkOutside: function (e) {
    let self = this;
    let target = $(e.target);

    if (!self._isClickOnElem(target, self._container)) {
      // Not click on the filter area


      if (self._isClickOnElem(target, self.options.parentTarget)) {
        // if click on button
        // Then toggle
        if (!self._isShown) {

          // If not show -> Load then show
        } else {
          self._hideFilter();
        }
        self._map.doubleClickZoom.disable(); //disable zoom when double click on filter icon
      } else {
        // Always hide filter when click outside
        self._hideFilter();
        self._map.doubleClickZoom.enable();
      }
    }
  },

  /**
   * Hide filter
   * @private
   */
  _hideFilter: function () {
    let self = this;
    self._isShown = false;
    self._container.classList.remove('show');
  },

  /**
   * Show filter
   * @private
   */
  _showFilter: function () {
    let self = this;
    self._isShown = true;
    self._container.classList.add('show');
  },

  /**
   * Toggle filter
   * @private
   */
  _toggleFilter: function () {
    let self = this;
    self._isShown = !self._isShown;
    self._container.classList.toggle('show');
  },

  /**
   * Load technology list from server
   * @param successCb
   * @param errorCb
   */
  loadTechnologies: function (successCb, errorCb) {
    let self = this;
    self._technologies = [];
    L.NETWORK.CELLFILTERS = 'ALL';
    //wait back-end
    self._technologies = [];
    $.ajax({
      method: 'GET',
      async: false, // Enable sync of ajax when get technology
      url: `${L.NETWORK.CONSTANT.domain}/api/${L.NETWORK.CONSTANT.version}/common/technology/${L.NETWORK.CONSTANT.operatorId}/band`,
      headers: {
        'Authorization': 'Bearer ' + L.NETWORK.CONSTANT.token
      },
      success: (data)=> {
        self._technologies = data;
        successCb();
      },
      error: ()=> {
        errorCb();
      }
    });
  },


  /**
   * Function add to map
   * @param map
   * @returns {div|*}
   */
  onAdd: function (map) {
    let self = this;
    self._map = map;

    // region DOM Node creation
    self._container = L.DomUtil.create('div', 'window-overlay control-filter ' + self.options.className);
    self._content = L.DomUtil.create('div', 'content');

    return self._container;
  },

  /**
   * Create HTML Dom of options: CheckAll - UnCheckAll
   * @returns {div}
   * @private
   */
  _createDomOptions: function () {
    let self = this;
    let domOptions = L.DomUtil.create('div', 'options');

    // Setup dom for option: check all
    let domOptionCheckAll = L.DomUtil.create('label', 'label-options');
    domOptionCheckAll.innerHTML = `<i class="fa fa-check"></i> Check All`;

    // Bind event "click" for check all
    $(domOptionCheckAll)
      .off()
      .on('click', (e)=> {
        // Set checked for all checkbox on filtering
        $(self._container).find('[type="checkbox"]').prop('checked', true);

      });

    // Setup dom for option: uncheck all
    let domOptionUnCheckAll = L.DomUtil.create('label', 'label-options');
    domOptionUnCheckAll.innerHTML = `<i class="fa fa-times"></i> Uncheck All`;

    // Bind event "click" for uncheck all
    $(domOptionUnCheckAll)
      .off()
      .on('click', (e)=> {
        // Set checked for all checkbox on filtering
        $(self._container).find('[type="checkbox"]').prop('checked', false);

      });

    domOptions.appendChild(domOptionCheckAll); // append "checkall" dom to domOptions
    domOptions.appendChild(domOptionUnCheckAll); // append "uncheck all" dom to domOptions

    return domOptions;
  },

  /**
   * Create HTML Dom for technology list. Include: checkbox & label
   * @returns {*}
   * @private
   */
  _createDomTechnologies: function () {
    let self = this;

    if (!self._technologies.length) {
      let domNoRecords = L.DomUtil.create('label', 'no-filter-data');
      domNoRecords.innerHTML = `The filter data is being proceeded or you're not upload any data yet, please come back in a few minutes.`;
      return domNoRecords;
    }

    // Create dom obj for technology list
    let domTechnologies = L.DomUtil.create('ul');

    _.forEach(self._technologies, (technology)=> {
      // Create dom obj for technology checkbox item
      let domTechnologyItem = self._createDomCheckbox('filter-technology', technology.technology, technology.technology, 'first_level');

      // Create dom obj for band list
      let domBands = L.DomUtil.create('ol', 'filterItem');

      _.forEach(technology.bands, (band)=> {
        // Create dom of band checkbox item
        let domBandItem = self._createDomCheckbox('filter-band[' + technology.technology + ']', band, band, '');
        domBands.appendChild(domBandItem);
      });

      domTechnologyItem.appendChild(domBands); // Append Bands to technology dom
      domTechnologies.appendChild(domTechnologyItem); // Append technology dom to DOM of technologies
    });

    return domTechnologies;
  },

  /**
   * Create dom for a checkbox item in cell filter
   * @param name
   * @param value
   * @param label
   * @param className
   * @returns {li}
   * @private
   */
  _createDomCheckbox: function (name, value, label, className) {
    let self = this;

    // Create dom object "li"
    let domTechnologyItem = L.DomUtil.create('li', 'filterTitle ' + className);

    // Create dom obj for hold html inside it
    let domTechnologyItemGroup = L.DomUtil.create('label', 'custom-control custom-checkbox', domTechnologyItem);

    // Declare checkbox for dom
    let domTechnologyItemInput = L.DomUtil.create('input', 'custom-control-input');
    domTechnologyItemInput.type = 'checkbox';

    // Bind attribute for checkbox
    $(domTechnologyItemInput).attr('name', name);
    $(domTechnologyItemInput).val(value);
    $(domTechnologyItemInput).prop('checked', true);

    // Bind event for checkbox
    $(domTechnologyItemInput)
      .off()
      .on('change', (e)=> {
        let ele = $(e.currentTarget);

        // Auto detect sub checkboxes and set checked / unchecked for onces
        let isChecked = ele.prop('checked');
        ele.closest('li').find('[type="checkbox"]').prop('checked', isChecked);


      });

    // Append checkbox to technology dom
    domTechnologyItemGroup.appendChild(domTechnologyItemInput);

    // Declare icon & label for technology dom
    let domTechnologyItemIcon = L.DomUtil.create('span', 'custom-control-indicator', domTechnologyItemGroup);
    let domTechnologyItemLabel = L.DomUtil.create('span', 'custom-control-description', domTechnologyItemGroup);
    domTechnologyItemLabel.innerHTML = label;

    return domTechnologyItem;
  },





  /**
   * Check show / hide of cells in L.NETWORK.CAMERAES
   */

  disable: function () {
    let self = this;
    self.options.parentTarget.classList.add('disabled');
  },
  enable: function () {
    let self = this;
    self.options.parentTarget.classList.remove('disabled');
  }
});

L.control.filter = function (map) {
  /**
   * Declare cell filter button
   * See: app/vendors/leaflet/Leaflet.Control.Button.js
   */
  let filterButton = new L.Control.CustomButton({
    className: 'fa fa-filter',
    style: {
      width: '26px',
      height: '26px',
      cursor: 'pointer',
      'background-color': 'white',
      'font-size': '22px',
      'text-align': 'center',
      color: '#333'
    }
  });

  // Render button to map
  map.addControl(filterButton);

  // Render filter sidebar
  let options = {
    className: 'cell-filter-box',
    parentTarget: filterButton._container
  };
  return new L.Control.Filter(options);
};
