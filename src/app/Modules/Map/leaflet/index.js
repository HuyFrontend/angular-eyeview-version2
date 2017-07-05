import leaflet from 'leaflet';
import spectrumColorpicker from 'spectrum-colorpicker';
import leafletMarkercluster from 'leaflet.markercluster';
import leafletDraw from 'leaflet-draw';
import leafletPulseIcon from 'leaflet-pulse-icon';
import leafletSidebar from 'leaflet-sidebar';
import leafletContextmenu from 'leaflet-contextmenu';
import { fromFeature } from 'field-of-view';

// Import custom drawing plugins
import './Leaflet.MapToolbar';
import './Leaflet.Ruler';
import './Leaflet.Text';
import './draw.custom/Draw.Polygon';

import './Draw.Custom';
import './Leaflet.Search.Control';
import './Leaflet.Legend.Control';
import './Leaflet.MarkerAddition';
import './Leaflet.Control.Loading';
import './Leaftet.Pulse.Text';
import './Leaflet.Donut';
import './Leaflet.Control.Button';
import './Leaflet.Camera';
import './Leaflet.Polygon';
import './Leaflet.Control.Filter';
import './Leaflet.Util';
import './Leaflet.Cluster';
import './Leaflet.Control.Alarm';

import './Leaflet.ManageCamera.Control';
import './Leaflet.Drone';
import './Leaflet.GeotagPhoto.CameraControl';
import './Leaflet.GeotagPhoto.FromFeature';
import './Leaflet.GeotagPhoto.Crosshair';
import './Leaflet.GeotagPhoto.Camera';
import './Leaflet.GeotagPhotoControl';

L.Icon.Default.imagePath = 'assets/img/leaflet';
