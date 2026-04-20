// main.js - ES6 Module
import Header from './components/header.js';
import Filters from './components/filters.js';
import LayerManager from './components/layermanager.js';
import Toolbar from './components/toolbar.js';
import MapView from './components/mapview.js';
import Statistics from './components/statistics.js';
import Hotspots from './components/hotspots.js';
import Reports from './components/reports.js';

// Render all components
document.getElementById('header-container').innerHTML = Header.render();
document.getElementById('filters-container').innerHTML = Filters.render();
document.getElementById('layers-container').innerHTML = LayerManager.render();
document.getElementById('toolbar-container').innerHTML = Toolbar.render();
document.getElementById('map-container').innerHTML = '<div id="map"></div>';
document.getElementById('status-container').innerHTML = '<div id="coordStatus">READY</div>';
document.getElementById('statistics-container').innerHTML = Statistics.render();
document.getElementById('hotspots-container').innerHTML = Hotspots.render();
document.getElementById('reports-container').innerHTML = Reports.render();

// Initialize functionality
MapView.init();
Filters.init();
LayerManager.init();
Statistics.init();
Hotspots.init();
Reports.init();
