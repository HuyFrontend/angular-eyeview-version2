L.Control.Alarm = L.Control.extend({

  // Some default options
  options: {
    position: 'topright',       // Posistion of alarm control to the map
    notification: false,        // Have notification (true/false)
    sidebar: {                  // Side bar config when click on control button
      position: 'right',        // Where wil the sidebar expanded?
      autoPan: false,           // (true/false) If true the map will be shifted when the sidebar is shown.
      onClickCell: null         // Function callback on click cell in alarm list
    }
  },
  // Function to hide sidebar
  hideSidebar: function () {
    this._sidebar.hide();

  },

  // Function to show sidebar
  showSidebar: function () {
    this._sidebar.show();
  },
  // Remove side bar - alarm results
  _removeSidebar: function () {
    $(this._sidebar.getContainer()).find('.alarm-sidebar').remove();
  },
  // Show loading
  _showLoading: function () {
    $(this.loadingElem).show();
  },
  // Hide loading
  _hideLoading: function () {
    $(this.loadingElem).hide();
  },

  // Append list into existing list (for scrolling event)
  appendList: function (list) {
    for (var i = 0; i < list.length; i++) {
      var el = document.createElement('a');
      el.setAttribute('href', '#');
      $(el).addClass('alarm-name');
      $(el).addClass('list-group-item');
      if (this._selectedItem == i) {
        $(el).addClass('active-item');
      }
      $(el).data('alarm', list[i]);
      $(el).data('alarmIndex', i + this._alarmList.length);
      $(el).text(list[i].cellName);
      var slogan = document.createElement('div');
      $(slogan).addClass('slogan-name');
      $(slogan).data('alarm', list[i]);
      $(slogan).data('alarmIndex', i + this._alarmList.length);
      $(slogan).text(list[i].slogan);
      el.appendChild(slogan);
      $(this._sidebar.getContainer()).find('.alarm-container')[0].appendChild(el);
    }
  },

  _resetFilter: function () {
    this._filter = {
      skip: 0,
      take: 15,
      noMore: false
    }
  },

  fetchingDataPromise: function (skip, take, keyword) {
    if (this._xhr) {
      this._xhr.abort();
    }
    return this._xhr = $.ajax({
      url: `${L.NETWORK.CONSTANT.domain}/api/${L.NETWORK.CONSTANT.version}/alarms/${L.NETWORK.CONSTANT.operatorId}/${L.NETWORK.CONSTANT.jobId}/active/keyword`,
      method: 'POST',
      data: {
        "keyword": keyword,
        "skip": skip,
        "take": take,
      },
      "headers": {
        'Authorization': 'Bearer ' + L.NETWORK.CONSTANT.token
      }
    })
  },
  // Search alarm
  _searchAlarm: function (text, hideLoading) {
    if (this._isFetchingData || this._filter.noMore) {
      return;
    }
    !hideLoading && this._removeSidebar();
    this._isFetchingData = true;
    !hideLoading && this._showLoading();
    this.fetchingDataPromise(this._filter.skip, this._filter.take, text).then(function (resp) {
      let list = [];
      if (resp && resp.data) {

        list = resp.data.alarms;
        this._filter.skip += this._filter.take;
        this._filter.noMore = list.length < this._filter.take;
        this._isFetchingData = false;
      }
      !hideLoading && this._hideLoading();
      !hideLoading && (this._alarmList = this._alarmList.splice(0, -1));
      this._alarmList.push.apply(this._alarmList, list);

      if (hideLoading) {
        // This is scroll case
        this.appendList(list);
      } else {
        // This is search new case
        this._renderListAlarms();
      }
    }.bind(this), function () {
      this._isFetchingData = false;
      !hideLoading && this._hideLoading();
      !hideLoading && (this._alarmList = this._alarmList.splice(0, -1));
    }.bind(this));
  },
  // Create search input
  _createInput: function (text) {
    var input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('placeholder', 'Search Alarms...');
    $(input).addClass('form-control');
    // $(input).val(text);
    $(input).bind('input', function (e) {
      setTimeout(function () {
        this._resetFilter();
        this._searchAlarm($(input).val());
      }.bind(this), 800);
    }.bind(this));
    this._inputEl = input;
    return input;
  },
  // Render search input
  _renderSearchBar: function (text) {
    let sidebarContainer = this._sidebar.getContainer();
    let sidebarChildNodes = _.toArray(sidebarContainer.childNodes), childNode;
    while (childNode = sidebarChildNodes.pop()) {
      sidebarContainer.removeChild(childNode);
    }
    let searchBar = document.createElement('div');
    searchBar.className = 'alarm-search-box';
    searchBar.appendChild(this._createInput(text));

    this._sidebar.getContainer().appendChild(searchBar);
  },
  // Function to matching name by key
  _matchName: function (searchText, alarm) {
    searchText = (searchText || "").toUpperCase();
    var matchingsmMatrix = ['slogan', 'cellName'].map(function (key) {
      return !alarm[key] || alarm[key].toUpperCase().indexOf(searchText) >= 0;
    });
    return matchingsmMatrix.indexOf(true) >= 0;
  },
  _renderLoading: function () {
    this.loadingElem = document.createElement('div');
    this.loadingElem.className = "leaflet-control-command-interior";
    this.loadingElem.innerHTML = '<img class="" src="/assets/svg/map-indicator.svg"><label class="loading-text">Loading ...</label>';
    this._sidebar.getContainer().appendChild(this.loadingElem);
    this._hideLoading();
  },
  // Render list alarms
  _renderListAlarms: function () {
    if (!this._alarmList) {
      return;
    }
    var rootParent = document.createElement('div');
    this._rootParent = rootParent;
    rootParent.className = 'alarm-sidebar';
    // Create list + Add event listener to each element in list
    var parentDiv = document.createElement('div');
    parentDiv.className = 'alarm-container';
    var renderRows = false;
    for (var i = 0; i < this._alarmList.length; i++) {
      renderRows = true;
      var el = document.createElement('a');
      el.setAttribute('href', '#');
      $(el).addClass('alarm-name');
      $(el).addClass('list-group-item');
      if (this._selectedItem == i) {
        $(el).addClass('active-item');
      }
      $(el).data('alarm', this._alarmList[i]);
      $(el).data('alarmIndex', i);
      $(el).text(this._alarmList[i].cellName);
      var slogan = document.createElement('div');
      $(slogan).addClass('slogan-name');
      $(slogan).data('alarm', this._alarmList[i]);
      $(slogan).data('alarmIndex', i);
      $(slogan).text(this._alarmList[i].slogan);
      el.appendChild(slogan);
      parentDiv.appendChild(el);
    }
    if (!renderRows) {
      // Create no result rows
      var textLabelEl = document.createElement('label');
      $(textLabelEl).addClass('text-left list-group-item');
      $(textLabelEl).text('No Alarm');
      parentDiv.appendChild(textLabelEl);
    }
    $(document).off('click.cellName', '.alarm-container .alarm-name');
    $(document).on('click.cellName', '.alarm-container .alarm-name', this._onClickCellName.bind(this));
    rootParent.appendChild(parentDiv);
    $(rootParent).on('scroll', function () {
      if ($(rootParent).scrollTop() + $(rootParent).innerHeight() >= $(rootParent)[0].scrollHeight - 50) {
        this._searchAlarm($(this._inputEl).val(), true);
      }
    }.bind(this));
    this._sidebar.getContainer().appendChild(rootParent);
    // $(rootParent).scrollTop(!scrollToTop && this._scrollTop || 0);
  },
  // On Click cell name
  _onClickCellName: function (e) {
    e.preventDefault();
    var _target = $(e.target);
    this.hideSidebar();
    this._selectedItem = _target.data('alarmIndex');
    this.options.sidebar.onClickCell && this.options.sidebar.onClickCell(_target.data('alarm'));
  },
  // Function called when creating instance
  initialize: function (options) {
    // Set default options
    L.setOptions(this, options);
    this._resetFilter();
    // Add side bar and register event for sidebar
    this._sidebar = L.control.sidebar(this.options.sidebar.id, {
      position: this.options.sidebar.position,
      autoPan: this.options.sidebar.autoPan
    })
    // Event before show the panel
      .on('show', function () {
        this._removeSidebar();
        this._renderSearchBar();
        this._renderLoading();
        // this._renderListAlarms();
      }.bind(this))
      .on('hide', function () {
        this._resetFilter();
        this._scrollTop = $(this._sidebar.getContainer()).find('.alarm-sidebar').scrollTop();
        this._searchKey = $(this._inputEl).val();
      }.bind(this))
      // Event after hide panel
      .on('hidden', function () {
        // Remove event listener + remove element
        this._inputEl && $(this._inputEl).off('input');
        this._rootParent && $(this._rootParent).off('scroll');
        $(document).off('click.cellName', '.alarm-container .alarm-name');
        this._removeSidebar();
      }.bind(this));
  },
  // Function called when element is called add to map
  onAdd: function (map) {
    // Create new button for control alarm then add to map
    this._alarmBtn = new L.Control.CustomButton({
      style: this.options.style,
      notification: this.options.notification,
      position: this.options.position,
      className: 'leaflet-control-button-alarm fa fa-exclamation-circle',
      handler: function () {
        if (!this._sidebar.isVisible()) {
          this._sidebar.show();
          this._showLoading();
          this.fetchingDataPromise(this._filter.skip, this._filter.take).then(function (resp) {
            this._alarmList = [];
            if (resp && resp.data) {
              var list = resp.data.alarms;
              this._filter.skip += this._filter.take;
              this._alarmList = list;
            }
            this._renderListAlarms();
            this._hideLoading();
          }.bind(this), function (resp) {
            this._alarmList = [];
            this._renderListAlarms();
            this._hideLoading();
          }.bind(this));
        } else {
          this._sidebar.hide();
        }
      }.bind(this)
    }).addTo(map);
    // Add control to map
    map.addControl(this._sidebar);
    // Return alarm button to caller
    return this._alarmBtn._container;
  },
  // Function for set notification for control Alarm
  setNotification: function (hasNotification) {
    this._alarmBtn.setNotification(hasNotification);
  }
});
// Define class instead of new element
L.control.alarm = function (options) {
  return new L.Control.Alarm(options);
};
