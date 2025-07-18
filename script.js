//store list of road names for search suggeston
let roadNamesList = [];

// Define colours for ownership colours
const ownershipColors = {
  "Anaaj Mandi": "red",
  "Ghaziabad Developement Authority": "orange",
  "Ghaziabad Nagar Nigam": "green",
  "Private Colony Road": "blue",
  "PWD": "purple",
  "Railway": "brown",
  "Under NDRF": "cyan",
  "Under NHAI": "magenta",
  "Under Reserve Police Lines": "black"
};

const materialColors = {
  "Bitumin": "#3e3e3e",             // Dark gray
  "CC": "#8080ff",                  // Light blue
  "Interlocking Road": "#ff9933",  // Orange
  "Kacchi Road": "#996633" ,       // Brown
  "Proposed Road": "#aaaaaa" //gray
};



//Define Basemap Layers
const basemaps = {
    osm: new ol.layer.Tile({
      source: new ol.source.OSM()
    }),
    satellite: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      })
    }),
    topo: new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      })
    }),
  };
  //keep track of currently active base layer
  let activeBaseLayer = basemaps.osm;
  
  //Initialize basemap with active base layer
  const map = new ol.Map({
  target: 'map',
  layers: [activeBaseLayer],
  view: new ol.View({
    center: ol.proj.fromLonLat([77.45, 28.67]),
    zoom: 13 //initial zoom level
  })
  });
  
  // Layers from geoserver
  const wardLayer = new ol.layer.Image({
  source: new ol.source.ImageWMS({
    url: 'http://localhost:8080/geoserver/New_layout/wms',
    params: {
      'LAYERS': 'ghaziabad:Dummy_Ward_Boundary',
      'TILED': true
    },
    ratio: 1,
    serverType: 'geoserver'
  })
  });
  
  const zoneLayer = new ol.layer.Image({
  source: new ol.source.ImageWMS({
    url: 'http://localhost:8080/geoserver/New_layout/wms',
    params: {
      'LAYERS': 'ghaziabad:Dummy_Zone_Boundary',
      'TILED': true
    },
    ratio: 1,
    serverType: 'geoserver'
  })
  });
  
  // Dummyq12 Vector Layer
const dummyq12Source = new ol.source.Vector();
//vector layer with single colour style for all dummyq12 roads
const dummyq12Layer = new ol.layer.Vector({
  source: dummyq12Source,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#007bff', // single color for all roads
      width: 3
    })
  })
});
//add dummyq12 to map
map.addLayer(dummyq12Layer);



// highlight style for road selection
  const highlightStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'yellow',
    width: 6,
  }),
});

//highlight road from table and zoom to it

function highlightAndZoomToRoad(roadName) {
  // Reset styles of all features in roadsource
  roadSource.getFeatures().forEach(feature => {
    feature.setStyle(null);
  });

  // Find the feature with the matching road name(case insensitive)
  const targetFeature = roadSource.getFeatures().find(feature => {
    return feature.get('roadName') && feature.get('roadName').toLowerCase() === roadName.toLowerCase();
  });

  if (targetFeature) {
    // Apply highlight style to the highlighted road
    targetFeature.setStyle(new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'magenta',
        width: 4
      })
    }));

    // Zoom to the feature
    const geometry = targetFeature.getGeometry();
    if (geometry) {
      map.getView().fit(geometry, {
        duration: 800,
        maxZoom: 15,
        padding: [40, 40, 40, 40]
      });
    }
  } else {
    console.warn('Road not found on map:', roadName);
  }
}


  // Layer Setup 
  map.addLayer(wardLayer);
  map.addLayer(zoneLayer);
 
  //Switching Basemap Layer
  document.getElementById('basemap-select').addEventListener('change', function() {
  const selected = this.value;
  if (basemaps[selected]) {
    map.removeLayer(activeBaseLayer);
    activeBaseLayer = basemaps[selected];
    map.getLayers().insertAt(0, activeBaseLayer);
  }
  });


  
  // Custom zoom controls
  document.getElementById('zoom-in').addEventListener('click', () => {
  const view = map.getView();
  view.animate({ zoom: view.getZoom() + 1, duration: 300 });
  });
  
  document.getElementById('zoom-out').addEventListener('click', () => {
  const view = map.getView();
  view.animate({ zoom: view.getZoom() - 1, duration: 300 });
  });
  
  document.getElementById('home-btn').addEventListener('click', () => {
  map.getView().animate({
    center: ol.proj.fromLonLat([77.45, 28.67]),
    zoom: 12,
    duration: 800
  });
  });
  
  //Full screen button
  document.getElementById('fullscreen-btn').addEventListener('click', () => {
  const mapContainer = document.getElementById('map-container');
  if (!document.fullscreenElement) {
    mapContainer.requestFullscreen().catch(err => console.error(`Error attempting fullscreen: ${err.message}`));
  } else {
    document.exitFullscreen();
  }
  });

  
  
  document.getElementById('search-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') performSearch();
  });
  document.querySelector('.search-btn').addEventListener('click', performSearch);
  
function performSearch(value) {
  const query = (value || document.getElementById('search-input').value).trim().toLowerCase();

  dummyq12Source.getFeatures().forEach(f => f.setStyle(null));

  if (!query || query === 'null') {
    console.log('Cleared highlights');
    return;
  }

  let found = false;

  dummyq12Source.getFeatures().forEach(feature => {
    const roadName = (feature.get('roadName') || '').toLowerCase();
    if (roadName.includes(query)) {
      found = true;

      feature.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'cyan',
          width: 6
        })
      }));

      const extent = feature.getGeometry().getExtent();
      if (!(extent[0] === extent[2] && extent[1] === extent[3])) {//to check that area is not zero
        map.getView().fit(extent, {
          duration: 1000,
          maxZoom: 18,
          padding: [50, 50, 50, 50]
        });
      }
    }
  });

  if (!found) {
    alert('No matching road found in Dummyq12 layer.');
  }
}


//Search Dropdown

const searchInput = document.getElementById('search-input');
const suggestionsBox = document.getElementById('search-suggestions');

searchInput.addEventListener('input', function () {
  const query = this.value.trim().toLowerCase();
  suggestionsBox.innerHTML = '';

  if (!query) {
    suggestionsBox.style.display = 'none';
    return;
  }

  const matches = roadNamesList.filter(name => name.toLowerCase().includes(query));

  matches.forEach(name => {
    const div = document.createElement('div');
    div.textContent = name;
    div.addEventListener('click', function () {
      searchInput.value = name;
      suggestionsBox.innerHTML = '';
      suggestionsBox.style.display = 'none';
      performSearch(name); // Trigger highlight
    });
    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = matches.length ? 'block' : 'none';
});

//show dropdown of all roads
searchInput.addEventListener('focus', function () {
  const query = this.value.trim().toLowerCase();
  suggestionsBox.innerHTML = '';

  const matches = roadNamesList.filter(name =>
    name.toLowerCase().includes(query)
  );

  matches.forEach(name => {
    const div = document.createElement('div');
    div.textContent = name;
    div.addEventListener('click', function () {
      searchInput.value = name;
      suggestionsBox.innerHTML = '';
      suggestionsBox.style.display = 'none';
      performSearch(name);
    });
    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = matches.length ? 'block' : 'none';
});
//close dropdown when clicked outside
document.addEventListener('click', function (e) {
  if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
    suggestionsBox.style.display = 'none';
  }
});



  // Coordinates + Scale
  map.on('pointermove', function(evt) {
  const coordinate = ol.proj.toLonLat(evt.coordinate);
  document.getElementById('coordinates').textContent = `Lat: ${coordinate[1].toFixed(4)}°, Lon: ${coordinate[0].toFixed(4)}°`;
  });
  
  function updateScale() {
  const view = map.getView();
  const resolution = view.getResolution();
  const units = view.getProjection().getUnits();
  const dpi = 96;
  const mpu = ol.proj.Units.METERS_PER_UNIT[units];
  const scale = resolution * mpu * 39.37 * dpi;
  let scaleText, scaleWidth;
  
  if (scale >= 1000000) {
    scaleText = Math.round(scale / 1000000) + ' M';
    scaleWidth = 100;
  } else if (scale >= 1000) {
    scaleText = Math.round(scale / 1000) + ' K';
    scaleWidth = 80;
  } else {
    scaleText = Math.round(scale) + ' m';
    scaleWidth = 60;
  }
  
  document.getElementById('scale-line').style.width = scaleWidth + 'px';
  document.getElementById('scale-text').textContent = scaleText;
  }
  
  map.getView().on(['change:resolution', 'change:center'], updateScale);
  map.once('postrender', updateScale);
  document.addEventListener('fullscreenchange', () => setTimeout(() => map.updateSize(), 100));
  window.addEventListener('resize', () => map.updateSize());
  
  // document.getElementById('layer-toggle-btn').addEventListener('click', () => {
  // const layerBox = document.getElementById('layer-checkboxes');
  // layerBox.style.display = layerBox.style.display === 'block' ? 'none' : 'block';
  // });





  //for road layer

  const popupContainer = document.getElementById('popup');
const popupContent = document.getElementById('popup-content');

const popupOverlay = new ol.Overlay({//openlayer overlay to show popup on the map
  element: popupContainer,
  positioning: 'bottom-center',// bottom centre of clicked coordinate is at clicked coordinate
  stopEvent: false,
});
map.addOverlay(popupOverlay);


//Load dummyq12roads from backend
function loadDummyq12Roads() {
  fetch('http://localhost:8081/api/road/all')
    .then(response => response.json()) // fetches json data of all roads from backend
    .then(data => {
      dummyq12Source.clear();
      roadNamesList = [];

      data.forEach(road => {
        if (road.wkt) {
          const feature = new ol.format.WKT().readFeature(road.wkt, {
            dataProjection: 'EPSG:32644',
            featureProjection: 'EPSG:3857'
          });

          feature.setProperties({
            roadName: road.roadName,
            zoneName: road.zoneName,
            wardName: road.wardName,
            ownership: road.ownership,
            condition: road.condition
          });

          dummyq12Source.addFeature(feature);

          if (road.roadName) {
            roadNamesList.push(road.roadName);
          }
        }
      });
    })
    .catch(err => console.error('Error loading Dummyq12:', err));
}

// load maaterial dropdown

function loadMaterialOptions() {
  fetch('http://localhost:8081/api/road/all')
    .then(res => res.json())
    .then(data => {
      const materialSet = new Set();
      data.forEach(road => {
        if (road.carriageM) {
          materialSet.add(road.carriageM.trim());
        }
      });

      const materialFilter = document.getElementById('materialFilter');
      materialFilter.innerHTML = `
        <option value="">Select Material</option>

        <option value="All">All</option>
      `;

      materialSet.forEach(material => {
        const option = document.createElement('option');
        option.value = material;
        option.textContent = material;
        materialFilter.appendChild(option);
      });
    })
    .catch(err => console.error('Error loading materials:', err));
}




//handle material dropdown change

document.getElementById('materialFilter').addEventListener('change', applyAllFilters);

document.getElementById('categoryFilter').addEventListener('change', applyAllFilters);



  
  document.getElementById('wardToggle').addEventListener('change', function() {
  wardLayer.setVisible(this.checked);
  });
  document.getElementById('zoneToggle').addEventListener('change', function() {
  zoneLayer.setVisible(this.checked);
  });
  document.getElementById('dummyToggle').addEventListener('change', function() {
  dummyq12Layer.setVisible(this.checked);

  if (this.checked && dummyq12Source.getFeatures().length === 0) {
    loadDummyq12Roads();
  }
});

  
  // Road layers
  const wktFormat = new ol.format.WKT();
  const roadSource = new ol.source.Vector();
  const roadLayer = new ol.layer.Vector({
  source: roadSource,
  style: function(feature) {
    const condition = feature.get('condition');
    let color = 'gray';
    if (condition === 'Good') color = 'green';
    else if (condition === 'Moderate') color = 'orange';
    else if (condition === 'Poor') color = 'red';
  
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: color,
        width: 3
      })
    });
  }
  });
  map.addLayer(roadLayer);
  
  // Draggable functionality
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  
  function initializeDraggable() {
  const statsBox = document.getElementById('statistics-box');
  const dragHandle = document.querySelector('.drag-handle');
  
  dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = statsBox.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    statsBox.style.cursor = 'grabbing';
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const statsBox = document.getElementById('statistics-box');
    const newX = e.clientX - dragOffsetX;
    const newY = e.clientY - dragOffsetY;
    
    // Ensure the box stays within viewport
    const maxX = window.innerWidth - statsBox.offsetWidth;
    const maxY = window.innerHeight - statsBox.offsetHeight;
    
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));
    
    statsBox.style.left = constrainedX + 'px';
    statsBox.style.top = constrainedY + 'px';
    statsBox.style.transform = 'none';
    statsBox.style.position = 'fixed';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.querySelector('.drag-handle').style.cursor = 'grab';
    }
  });
  }
  
  // Enhanced statistics functionality
  function calculateStatistics(data) {
    const stats = {
      total: data.length,
      totalLength: 0,
      good: { count: 0, length: 0 },
      moderate: { count: 0, length: 0 },
      poor: { count: 0, length: 0 },
      ownership: {},
      category: {}
    };
  
    data.forEach(road => {
      const length = parseFloat(road.lengthMet) || 0;
      stats.totalLength += length;
  
      // Condition breakdown
      switch (road.condition) {
        case 'Good':
          stats.good.count++;
          stats.good.length += length;
          break;
        case 'Moderate':
          stats.moderate.count++;
          stats.moderate.length += length;
          break;
        case 'Poor':
          stats.poor.count++;
          stats.poor.length += length;
          break;
      }
  
      // Ownership breakdown
      const ownership = road.ownership || 'Unknown';
      if (!stats.ownership[ownership]) {
        stats.ownership[ownership] = { count: 0, length: 0 };
      }
      stats.ownership[ownership].count++;
      stats.ownership[ownership].length += length;
  
      // Category breakdown (assuming you have category data)
      const category = road.category || road.roadType || 'Local'; // Fallback to Local if no category
      if (!stats.category[category]) {
        stats.category[category] = { count: 0, length: 0 };
      }
      stats.category[category].count++;
      stats.category[category].length += length;
    });
  
    return stats;
  }
  
  function updateStatisticsDisplay(stats, filterType, filterValue) {
    const statsBox = document.getElementById('statistics-box');

     // Reset position to bottom left each time before showing
  statsBox.style.position = 'fixed';
  statsBox.style.left = '16px';
  statsBox.style.bottom = '80px';
  statsBox.style.top = '';
  statsBox.style.right = '';
  statsBox.style.transform = 'none';

    const title = document.getElementById('statistics-title');
    
    // Set title based on filter type
    let titleText = 'Road Statistics';
    if (filterType === 'ward') titleText = `Ward: ${filterValue}`;
    else if (filterType === 'zone') titleText = `Zone: ${filterValue}`;
    else if (filterType === 'condition') titleText = `Condition: ${filterValue}`;
    else if (filterType === 'ownership') titleText = `Ownership: ${filterValue}`;
    
    title.textContent = titleText;
  
    // Update total statistics
    document.getElementById('total-roads').textContent = stats.total;
    document.getElementById('total-length').textContent = `${(stats.totalLength / 1000).toFixed(2)} km`;
  
    // Update condition breakdown
    document.getElementById('good-count').textContent = stats.good.count;
    document.getElementById('good-length').textContent = `${(stats.good.length / 1000).toFixed(2)} km`;
    
    document.getElementById('moderate-count').textContent = stats.moderate.count;
    document.getElementById('moderate-length').textContent = `${(stats.moderate.length / 1000).toFixed(2)} km`;
    
    document.getElementById('poor-count').textContent = stats.poor.count;
    document.getElementById('poor-length').textContent = `${(stats.poor.length / 1000).toFixed(2)} km`;
  
    // Update ownership breakdown
    const ownershipContainer = document.getElementById('ownership-breakdown');
    ownershipContainer.innerHTML = '';
    Object.entries(stats.ownership).forEach(([owner, data]) => {
      const ownershipItem = document.createElement('div');
      ownershipItem.className = 'ownership-item';
      ownershipItem.innerHTML = `
        <span class="ownership-label">${owner}:</span>
        <span class="ownership-stats">
          ${data.count} roads, ${(data.length / 1000).toFixed(2)} km
        </span>
      `;
      ownershipContainer.appendChild(ownershipItem);
    });
  
    // Update category breakdown
    const categoryContainer = document.getElementById('category-breakdown');
    categoryContainer.innerHTML = '';
    Object.entries(stats.category).forEach(([category, data]) => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.innerHTML = `
        <span class="category-label">${category}:</span>
        <span class="category-stats">
          ${data.count} roads, ${(data.length / 1000).toFixed(2)} km
        </span>
      `;
      categoryContainer.appendChild(categoryItem);
    });
  
    // Show the statistics box
    statsBox.style.display = 'block';

      document.getElementById('statistics-content').style.display = 'block';

  }
  
  function hideStatistics() {
    document.getElementById('statistics-box').style.display = 'none';
    isMinimized = false;
  }
  
  
  
  // Event listeners for statistics controls
  document.getElementById('close-stats').addEventListener('click', hideStatistics);

  
  // Initialize draggable functionality
  initializeDraggable();
  
  function addRoadFeatures(data, filterType = '', filterValue = '') {
  roadSource.clear();

  data.forEach(road => {
    if (road.wkt) {
      const feature = wktFormat.readFeature(road.wkt, {
        dataProjection: 'EPSG:32644',
        featureProjection: 'EPSG:3857'
      });

      feature.setProperties({
        gid: road.gid,
        zoneName: road.zoneName,
        zoneNo: road.zoneNo,
        wardName: road.wardName,
        wardNo: road.wardNo,
        ownership: road.ownership,
        roadName: road.roadName,
        condition: road.condition,
        lengthMet: road.lengthMet,
        
        category: road.category || road.roadType || 'Local'
      });

      // ✅ FIX: define color before using it
     let colorBy = document.getElementById('colorBy').value;
let color = 'gray';

if (colorBy === 'ownership') {
  color = ownershipColors[road.ownership] || 'gray';
} else if (colorBy === 'condition') {
  if (road.condition === 'Good') color = 'green';
  else if (road.condition === 'Moderate') color = 'orange';
  else if (road.condition === 'Poor') color = 'red';
} else if (colorBy === 'material') {
  color = materialColors[road.carriageM] || 'gray';
} else {
  // fallback if colorBy is not selected
  if (filterType === 'ownership' || filterType === 'ownershipAll') {
    color = ownershipColors[road.ownership] || 'gray';
  } else if (filterType === 'condition' || filterType === 'conditionAll') {
    if (road.condition === 'Good') color = 'green';
    else if (road.condition === 'Moderate') color = 'orange';
    else if (road.condition === 'Poor') color = 'red';
  }
}



      feature.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: color,
          width: 3
        })
      }));

      roadSource.addFeature(feature);
    }
  });

  if (data.length > 0 && filterType) {
    const stats = calculateStatistics(data);
    updateStatisticsDisplay(stats, filterType, filterValue);
  } else if (data.length === 0) {
    hideStatistics();
  }
}





  
function fetchRoadsByWard(wardNo) {
  console.log(`Fetching multi-ward roads for wardNo: ${wardNo}`);
  fetch(`http://localhost:8081/api/multiwardroads/ward?wardNo=${encodeURIComponent(wardNo)}`)
    .then(res => res.json())
    .then(data => {
      console.log('Multi-ward ward road data:', data);

      // Convert and map the backend response to frontend expected format
      const converted = data.map(road => ({
        gid: road.gisId || '', // you can also use originalRoadGid if needed
        zoneName: road.zoneName || '',
        zoneNo: road.zoneNo || '',
        wardName: road.clippedWardName || '',
        wardNo: road.clippedWardNo || '',
        ownership: road.ownership || '',
        roadName: road.roadName || '',
        roadMeter: road.rowMeter || '',
        lengthMet: road.lengthWithinWard || 0, // ✅ Use clipped length
        rowcls: road.rowcls || '',
        carriageW: road.carriageW || '',
        carriageM: road.carriageM || '',
        condition: road.condition || '',
        category: road.category || '',
        wkt: road.wkt || ''
      }));

      addRoadFeatures(converted, 'ward', wardNo);
      updateRoadTable(converted);
    })
    .catch(err => console.error('Error fetching ward roads:', err));
}



  function fetchRoadsByZone(zoneNo) {
  console.log(`Fetching roads for zoneNo: ${zoneNo}`);
  fetch(`http://localhost:8081/api/road/zone?zoneNo=${encodeURIComponent(zoneNo)}`)
    .then(res => res.json())
    .then(data => {
      console.log('Zone road data:', data);
      updateRoadTable(data);

      addRoadFeatures(data, 'zone', zoneNo);
             
    })
    .catch(err => console.error('Error fetching zone roads:', err));
  }
  
  function fetchRoadsByCondition(condition) {
  console.log(`Fetching roads for condition: ${condition}`);
  roadSource.clear();
  dummyq12Layer.setVisible(false);
  document.getElementById('dummyToggle').checked = false;

  let url = '';

  if (condition === "All") {
    url = 'http://localhost:8081/api/road/all';  // ✅ Fetch all roads for All option
  } else {
    url = `http://localhost:8081/api/road/condition?condition=${encodeURIComponent(condition)}`;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log('Condition road data:', data);

      if (condition === "All") {
        addRoadFeatures(data, 'conditionAll', 'All');  // ✅ Special type for All condition
      } else {
        addRoadFeatures(data, 'condition', condition);
      }

      updateRoadTable(data);
      renderConditionPie(data);

    })
    .catch(err => console.error('Error fetching condition roads:', err));
}


  
 function fetchRoadsByOwnership(ownership) {
  roadSource.clear();
  fetch(`http://localhost:8081/api/road/ownership?ownership=${encodeURIComponent(ownership)}`)
    .then(res => res.json())
    .then(data => {
      addRoadFeatures(data, 'ownership', ownership);  // ✅ This tells addRoadFeatures to use ownership coloring
      updateRoadTable(data);
    })
    .catch(err => console.error('Error fetching ownership roads:', err));
}

function fetchAllOwnershipRoads() {
  roadSource.clear();

  const baseURL = ward && ward !== 'All'
  ? `http://localhost:8081/api/multiwardroads/ward?wardNo=${encodeURIComponent(ward)}`
  : 'http://localhost:8081/api/road/all';

fetch(baseURL)
  .then(res => res.json())
  .then(data => {
    // If using multiwardroads API, convert data
    const isMultiWard = baseURL.includes('multiwardroads');

    const converted = isMultiWard
      ? data.map(road => ({
          gid: road.gisId || '',
          zoneName: road.zoneName || '',
          zoneNo: road.zoneNo || '',
          wardName: road.clippedWardName || '',
          wardNo: road.clippedWardNo || '',
          ownership: road.ownership || '',
          roadName: road.roadName || '',
          roadMeter: road.rowMeter || '',
          lengthMet: road.lengthWithinWard || 0,
          rowcls: road.rowcls || '',
          carriageW: road.carriageW || '',
          carriageM: road.carriageM || '',
          condition: road.condition || '',
          category: road.category || '',
          wkt: road.wkt || ''
        }))
      : data;

    const filtered = converted.filter(road => {
      const matchCategory = !category || category === "All" || road.category === category;
      const matchZone = !zone || road.zoneNo === zone;
      const matchWard = !ward || ward === "All" || road.wardNo === ward;
      const matchOwnership = !ownership || road.ownership === ownership;
      const matchCondition = !condition || condition === "All" || road.condition === condition;
      const matchMaterial = !material || material === "All" || road.carriageM === material;
      return matchZone && matchWard && matchOwnership && matchCondition && matchMaterial && matchCategory;
    });

    addRoadFeatures(filtered);
    updateRoadTable(filtered);
    if (filtered.length > 0) {
      updateStatisticsDisplay(calculateStatistics(filtered));
      drawSidebarCharts(filtered);
    } else {
      hideStatistics();
      clearSidebarCharts();
    }
  });

}
//so that basemap doesn't overlap
dummyq12Layer.setVisible(false);
document.getElementById('dummyToggle').checked = false;


// to interconnect all options

function applyAllFilters() {
  const zone = document.getElementById('zone-select').value;
  const ward = document.getElementById('ward-select').value;
  const ownership = document.getElementById('ownershipFilter').value;
  const condition = document.getElementById('roadConditionFilter').value;
  const material = document.getElementById('materialFilter').value;
  const category = document.getElementById('categoryFilter').value;


  fetch('http://localhost:8081/api/road/all')
    .then(res => res.json())
    .then(data => {
      const filtered = data.filter(road => {
        const matchCategory = !category || category === "All" || road.category === category;
        const matchZone = !zone || road.zoneNo === zone;
        const matchWard = !ward || ward === "All" || road.wardNo === ward;

        const matchOwnership = !ownership || road.ownership === ownership;
        const matchCondition = !condition || condition === "All" || road.condition === condition;
        const matchMaterial = !material || material === "All" || road.carriageM === material;
        return matchZone && matchWard && matchOwnership && matchCondition && matchMaterial && matchCategory;
      });

      addRoadFeatures(filtered); // highlight & style on map
 // highlight & add to map
      updateRoadTable(filtered); // show in table
      updateStatisticsDisplay(calculateStatistics(filtered)); // show stats
      drawSidebarCharts(filtered);

    });
}




  document.getElementById('ward-select').addEventListener('change', applyAllFilters);


  // Zone select ke basis pe ward dropdown dynamic ho raha hai –

document.getElementById('zone-select').addEventListener('change', function () {
  const selectedZone = this.value;
  const wardDropdown = document.getElementById('ward-select');
  const wardContainer = wardDropdown.parentElement;

  if (selectedZone) {
    wardContainer.style.display = 'block';
    wardDropdown.innerHTML = `
  <option value="">Select Ward</option>
  <option value="All">All Wards</option>
`;


    fetch(`http://localhost:8081/api/road/allWardsByZoneNo?zoneNo=${encodeURIComponent(selectedZone)}`)
      .then(response => response.json())
      .then(data => {
        data.forEach(entry => {
          const option = document.createElement('option');
          option.value = entry.wardNo;
          option.textContent = entry.wardName;
          wardDropdown.appendChild(option);
        });
      })
      .catch(error => console.error('Error loading wards:', error));
  } else {
    wardContainer.style.display = 'none';
    wardDropdown.innerHTML = '<option value="">Select Ward</option>';
  }

  applyAllFilters();  // ✅ THIS is now your main logic for displaying filtered roads
});



//highlight selected ward

function highlightWardOnMap(wardName) {
  wardSource.getFeatures().forEach(feature => {
    const featureWard = feature.get('ward_name'); // 🔁 Make sure this matches your actual GeoServer field

    if (featureWard === wardName) {
      feature.setStyle(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'green',
          width: 4
        }),
        fill: new ol.style.Fill({
          color: 'rgba(0, 255, 0, 0.2)' // Light green
        })
      }));

      const geom = feature.getGeometry();
      if (geom) {
        map.getView().fit(geom, {
          padding: [50, 50, 50, 50],
          duration: 1000
        });
      }
    } else {
      feature.setStyle(null); // Reset others
    }
  });
}

function clearWardHighlight() {
  wardSource.getFeatures().forEach(feature => feature.setStyle(null));
}




  
document.getElementById('roadConditionFilter').addEventListener('change', applyAllFilters);




//for legends
// === Toggle Condition Legend ===
document.getElementById('roadConditionFilter').addEventListener('change', function () {
  const condition = this.value;
  const legendBox = document.getElementById('condition-legend');

  if (condition) {
    legendBox.style.display = 'block';
  } else {
    legendBox.style.display = 'none';
    document.getElementById('condition-pie-container').style.display = 'none';
if (conditionPieChart) conditionPieChart.destroy();

  }
});




  
document.getElementById('ownershipFilter').addEventListener('change', applyAllFilters);



  
  // Listen to Zone dropdown change (to populate ownership list)
  document.getElementById('zone-select').addEventListener('change', async function () {
    const selectedZone = this.value;
      // ✅ Show the Ward dropdown container
  document.getElementById('ward-container').style.display = 'block';
    const ownerDropdown = document.getElementById('road-owner-filter');
    const roadDropdown = document.getElementById('roads-dropdown');
  
    if (!selectedZone) return;
  
    try {
      const response = await fetch(`http://localhost:8080/api/road/zone?zoneName=${selectedZone}`);
      const roads = await response.json();
  
      // Extract unique owners
      const uniqueOwners = [...new Set(roads.map(road => road.ownership).filter(Boolean))];
  
      // Populate ownership dropdown if elements exist
      if (ownerDropdown) {
        ownerDropdown.innerHTML = '<option value="">Select Ownership</option>';
        uniqueOwners.forEach(owner => {
          const option = document.createElement('option');
          option.value = owner;
          option.textContent = owner;
          ownerDropdown.appendChild(option);
        });
      }
  
      // Optionally populate all roads at first
      if (roadDropdown) {
        roadDropdown.innerHTML = '<option value="">Select Road</option>';
        roads.forEach(road => {
          const option = document.createElement('option');
          option.value = road.gid;
          option.textContent = road.roadName || `Road ${road.gid}`;
          roadDropdown.appendChild(option);
        });
      }
  
      // Store roads for filtering later
      window.zoneRoadsData = roads;
  
    } catch (error) {
      console.error('Error fetching roads by zone:', error);
    }
  });
  

// Map pe click karne se popup aata hai – basic info show karne ke liye 👆🗺️

map.on('singleclick', function(evt) {
  console.log('Clicked at:', evt.coordinate);

  const features = map.getFeaturesAtPixel(evt.pixel, { hitTolerance: 10 });

  if (features && features.length > 0) {
    const feature = features[0];
    const props = feature.getProperties();

    console.log('Feature found:', props);

    let html = `<strong>Road Details:</strong><br>`;
    html += `Road Name: ${props.roadName || 'N/A'}<br>`;
    html += `Zone: ${props.zoneName || 'N/A'}<br>`;
    html += `Ward: ${props.wardName || 'N/A'}<br>`;
    html += `Ownership: ${props.ownership || 'N/A'}<br>`;
    html += `Condition: ${props.condition || 'N/A'}<br>`;

    popupContent.innerHTML = html;
    popupOverlay.setPosition(evt.coordinate);

  } else {
    console.log('No feature found at click');
    popupOverlay.setPosition(undefined);
  }
});

//to hide dummyq12 layer

['zone-select', 'ward-select'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', () => {
      dummyq12Layer.setVisible(false);
      document.getElementById('dummyToggle').checked = false;
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('road-table-toggle');
  const wrapper = document.getElementById('road-table-wrapper');

  toggleBtn.addEventListener('click', () => {
    wrapper.classList.toggle('hidden');
    toggleBtn.textContent = wrapper.classList.contains('hidden') ? '▼ Road Data' : '▲ Road Data';
  });
});


function updateRoadTable(data) {
  const tbody = document.getElementById('road-table').querySelector('tbody');
  tbody.innerHTML = '';

  data.forEach(road => {
    const row = document.createElement('tr');
    const conditionClass =
      road.condition === 'Good' ? 'condition-good' :
      road.condition === 'Moderate' ? 'condition-moderate' :
      road.condition === 'Poor' ? 'condition-poor' : '';

    const showDetails = road.fromMultiWard || (road.originalWardNo && road.originalWardNo.includes(','));

    row.innerHTML = `
      <td>${road.gid || ''}</td>
      <td>${road.id || ''}</td>
      <td>${road.zoneName || ''}</td>
      <td>${road.zoneNo || ''}</td>
      <td>${road.wardName || ''}</td>
      <td>${road.wardNo || ''}</td>
      <td>${road.ownership || ''}</td>
      <td>${road.roadName || ''}</td>
      <td>${road.roadMeter || ''}</td>
      <td>${road.lengthMet || ''}</td>
      <td>${road.rowcls || ''}</td>
      <td>${road.carriageW || ''}</td>
      <td>${road.carriageM || ''}</td>
      <td class="${conditionClass}">${road.condition || ''}</td>
      <td>${road.category || ''}</td>
      <td>
        ${showDetails ? `<button class="details-btn" onclick="fetchWardwiseBreakdown('${road.roadName.replace(/'/g, "\\'")}')">Details</button>` : ''}
      </td>
    `;

    row.addEventListener('click', () => {
      document.querySelectorAll('#road-table tbody tr').forEach(r => r.classList.remove('selected-row'));
      row.classList.add('selected-row');
      highlightAndZoomToRoad(road.roadName);
    });

    tbody.appendChild(row);
  });
}

// Basemap dropdown toggle karne ka button – isse hi satellite se OSM switch karte hain 🗺️

document.getElementById('basemap-toggle-btn').addEventListener('click', () => {
  const dropdown = document.getElementById('basemap-dropdown-content');
  dropdown.classList.toggle('hidden');
});


let conditionPieChart = null;

function renderConditionPie(data) {
  const conditionCounts = { Good: 0, Moderate: 0, Poor: 0 };

  data.forEach(road => {
    if (road.condition === 'Good') conditionCounts.Good++;
    else if (road.condition === 'Moderate') conditionCounts.Moderate++;
    else if (road.condition === 'Poor') conditionCounts.Poor++;
  });

  const ctx = document.getElementById('condition-pie').getContext('2d');

  if (conditionPieChart) conditionPieChart.destroy();

  conditionPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Good', 'Moderate', 'Poor'],
      datasets: [{
        data: [
          conditionCounts.Good,
          conditionCounts.Moderate,
          conditionCounts.Poor
        ],
        backgroundColor: ['green', 'orange', 'red']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Road Condition Distribution'
        }
      }
    }
  });

  document.getElementById('condition-pie-container').style.display = 'block';
}
document.addEventListener('DOMContentLoaded', () => {
  loadMaterialOptions();
});


document.getElementById('colorBy').addEventListener('change', () => {
  applyAllFilters(); // re-color filtered roads
});






// Replace kiya ha purana drawSidebarCharts function with this fixed version:

let chartCondition, chartOwnership, chartCategory, chartMaterial;
// Chart draw ho raha hai yahan se logic  banaya hai

function drawSidebarCharts(data) {
  console.log('Drawing sidebar charts with data:', data?.length || 0, 'records');
  
  if (!data || data.length === 0) {
    console.warn('No data provided for charts');
    return;
  }

  const countBy = (keyFn) => {
    const result = {};
    data.forEach(r => {
      const key = keyFn(r) || 'Unknown';
      result[key] = (result[key] || 0) + 1;
    });
    return result;
  };

  const makePie = (canvasId, chartVar, label, dataMap, colorMap = null) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with ID '${canvasId}' not found`);
      return null;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error(`Could not get 2D context for canvas '${canvasId}'`);
      return null;
    }
    
    // Destroy existing chart if it exists
    if (chartVar) {
      chartVar.destroy();
    }
    
    const labels = Object.keys(dataMap);
    const values = Object.values(dataMap);
    
    // Skip if no data
    if (labels.length === 0) {
      console.warn(`No data for chart '${label}'`);
      return null;
    }
    
    // Generate colors - use colorMap if provided, otherwise default colors
    let colors;
    if (colorMap) {
      colors = labels.map(label => colorMap[label] || '#gray');
    } else {
      colors = [
        '#60a5fa', '#facc15', '#4ade80', '#f87171',
        '#c084fc', '#fb923c', '#94a3b8', '#10b981', 
        '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4'
      ];
    }
    
    console.log(`Creating chart for ${label}:`, { labels, values });
    
    // Create new chart and return it
    return new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 1,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: { 
            display: true, 
            text: label,
            font: { size: 14, weight: 'bold' }
          },
          legend: { 
            position: 'bottom',
            labels: {
              font: { size: 10 },
              padding: 10,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  };

  // Create charts with proper color mapping
  const conditionColors = {
    'Good': '#4ade80',
    'Moderate': '#facc15', 
    'Poor': '#f87171'
  };

  const ownershipColors = {
    "Anaaj Mandi": "red",
    "Ghaziabad Developement Authority": "orange",
    "Ghaziabad Nagar Nigam": "green",
    "Private Colony Road": "blue",
    "PWD": "purple",
    "Railway": "brown",
    "Under NDRF": "cyan",
    "Under NHAI": "magenta",
    "Under Reserve Police Lines": "black"
  };

  const materialColors = {
    "Bitumin": "#3e3e3e",
    "CC": "#8080ff",
    "Interlocking Road": "#ff9933",
    "Kacchi Road": "#996633",
    "Proposed Road": "#aaaaaa"
  };

  try {
    // Create charts and store references
    chartCondition = makePie('chart-condition', chartCondition, 'Road Condition', 
                           countBy(r => r.condition), conditionColors);
    
    chartOwnership = makePie('chart-ownership', chartOwnership, 'Ownership', 
                           countBy(r => r.ownership), ownershipColors);
    
    chartCategory = makePie('chart-category', chartCategory, 'Category', 
                          countBy(r => r.category || r.roadType || 'Local'));
    
    chartMaterial = makePie('chart-material', chartMaterial, 'Material', 
                          countBy(r => r.carriageM), materialColors);
    
    console.log('Charts created successfully');
    
    // Make sure sidebar is visible if charts are created
    const sidebar = document.getElementById('sidebar');
    if (sidebar && !sidebar.classList.contains('open')) {
      // Optionally auto-open sidebar when charts are drawn
      // sidebar.classList.add('open');
    }
    
  } catch (error) {
    console.error('Error creating charts:', error);
  }
}

// Enhanced applyAllFilters function with chart integration
// Saare filters ek sath apply ho rahe hain – zone, ward, condition, sab kuch ek hi jagah se 

function applyAllFilters() {
  const zone = document.getElementById('zone-select').value;
  const ward = document.getElementById('ward-select').value;
  const ownership = document.getElementById('ownershipFilter').value;
  const condition = document.getElementById('roadConditionFilter').value;
  const material = document.getElementById('materialFilter').value;
  const category = document.getElementById('categoryFilter').value;

  console.log('Applying filters:', { zone, ward, ownership, condition, material, category });

  fetch('http://localhost:8081/api/road/all')
    .then(res => res.json())
    .then(data => {
      console.log('Fetched data:', data.length, 'records');
      
      const filtered = data.filter(road => {
        const matchCategory = !category || category === "All" || road.category === category;
        const matchZone = !zone || road.zoneNo === zone;
        const matchWard = !ward || ward === "All" || road.wardNo === ward;
        const matchOwnership = !ownership || road.ownership === ownership;
        const matchCondition = !condition || condition === "All" || road.condition === condition;
        const matchMaterial = !material || material === "All" || road.carriageM === material;
        return matchZone && matchWard && matchOwnership && matchCondition && matchMaterial && matchCategory;
      });

      console.log('Filtered data:', filtered.length, 'records');

      // Update map, table, and statistics
      addRoadFeatures(filtered);
      updateRoadTable(filtered);
      
      if (filtered.length > 0) {
        updateStatisticsDisplay(calculateStatistics(filtered));
        
        // Draw sidebar charts with filtered data
        drawSidebarCharts(filtered);
      } else {
        hideStatistics();
        // Clear charts when no data
        clearSidebarCharts();
      }
    })
    .catch(err => {
      console.error('Error in applyAllFilters:', err);
    });
}

// Function to clear all charts
function clearSidebarCharts() {
  [chartCondition, chartOwnership, chartCategory, chartMaterial].forEach(chart => {
    if (chart) {
      chart.destroy();
    }
  });
  chartCondition = chartOwnership = chartCategory = chartMaterial = null;
}

// Enhanced sidebar toggle with chart refresh
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    
    // Refresh charts when sidebar opens (in case of resize issues)
    setTimeout(() => {
      if (sidebar.classList.contains('open')) {
        // Trigger chart refresh if there's data
        const hasData = document.getElementById('road-table').querySelector('tbody').children.length > 0;
        if (hasData) {
          // Get current filtered data and redraw charts
          const currentData = Array.from(document.getElementById('road-table').querySelector('tbody').children).map(row => {
            const cells = row.children;
            return {
              condition: cells[13]?.textContent || '',
              ownership: cells[6]?.textContent || '',
              category: cells[14]?.textContent || '',
              carriageM: cells[12]?.textContent || ''
            };
          });
          drawSidebarCharts(currentData);
        }
      }
    }, 300); // Allow time for CSS transition
  });
}

// Initialize charts when page loads with dummy data if needed
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing charts...');
  
  // Load initial data for charts
  fetch('http://localhost:8081/api/road/all')
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        // Take first 100 records as sample to avoid overwhelming the charts initially
        const sampleData = data.slice(0, 100);
        drawSidebarCharts(sampleData);
      }
    })
    .catch(err => console.error('Error loading initial chart data:', err));
    // Yaha pe theme button ha for dark mode 

    const themeToggleBtn = document.createElement('button');
    themeToggleBtn.innerText = '🌗';
    themeToggleBtn.title = 'Toggle Theme';
    themeToggleBtn.classList.add('control-btn');
    document.querySelector('.left-controls').appendChild(themeToggleBtn);
    
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
    
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-theme');
    }
    
});

// Add Chart.js error handling
Chart.defaults.plugins.legend.onClick = function(e, legendItem, legend) {
  const index = legendItem.datasetIndex;
  const ci = legend.chart;
  const meta = ci.getDatasetMeta(index);
  meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
  ci.update();
};

// Ensure Chart.js is loaded before using
if (typeof Chart === 'undefined') {
  console.error('Chart.js is not loaded. Please include Chart.js library.');
} else {
  console.log('Chart.js loaded successfully');
}



function exportTableToCSV(filename) {
  const table = document.getElementById('road-table');
  let csv = [];

  const rows = table.querySelectorAll('tr');
  for (let i = 0; i < rows.length; i++) {
    let row = [], cols = rows[i].querySelectorAll('td, th');
    for (let j = 0; j < cols.length; j++) {
      row.push(`"${cols[j].innerText.replace(/"/g, '""')}"`);
    }
    csv.push(row.join(','));
  }

  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // ✅ Screenshot download after CSV
  html2canvas(document.getElementById('map'), {
    useCORS: true,
    allowTaint: true
  }).then(canvas => {
    const imageData = canvas.toDataURL('image/png');
    const imgLink = document.createElement('a');
    imgLink.href = imageData;
    imgLink.download = 'map-screenshot.png';
    document.body.appendChild(imgLink);
    imgLink.click();
    document.body.removeChild(imgLink);
  });
}

document.getElementById('download-csv').addEventListener('click', () => {
  exportTableToCSV('filtered_roads.csv');
});






const legends = {
  condition: [
    { label: 'Good', color: '#4ade80' },
    { label: 'Moderate', color: '#facc15' },
    { label: 'Poor', color: '#f87171' }
  ],
  ownership: [
    { label: 'Anaaj Mandi', color: 'red' },
    { label: 'Ghaziabad Developement Authority', color: 'orange' },
    { label: 'Ghaziabad Nagar Nigam', color: 'green' },
    { label: 'Private Colony Road', color: 'blue' },
    { label: 'PWD', color: 'purple' },
    { label: 'Railway', color: 'brown' },
    { label: 'Under NDRF', color: 'cyan' },
    { label: 'Under NHAI', color: 'magenta' },
    { label: 'Under Reserve Police Lines', color: 'black' }
  ],
  material: [
    { label: 'Bitumin', color: '#3e3e3e' },
    { label: 'CC', color: '#8080ff' },
    { label: 'Interlocking Road', color: '#ff9933' },
    { label: 'Kacchi Road', color: '#996633' },
    { label: 'Proposed Road', color: '#aaaaaa' }
  ]
};


function updateLegend(type) {
  const container = document.getElementById('legend-container');
  container.innerHTML = ''; // Clear previous legend

  if (!type || !legends[type]) {
    container.style.display = 'none'; // Hide if default selected
    return;
  }

  container.style.display = 'block'; // Show legend
  legends[type].forEach(item => {
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <div class="legend-color" style="background:${item.color}"></div>
      <span>${item.label}</span>
    `;
    container.appendChild(legendItem);
  });
}

// Connect with your dropdown
document.getElementById('colorBy').addEventListener('change', function() {
  const selected = this.value;
  updateLegend(selected);
});

// Initialize legend on page load (if needed)
updateLegend(document.getElementById('colorBy').value);



function fetchWardwiseBreakdown(roadName) {
  fetch(`http://localhost:8081/api/multiwardroads/search?name=${encodeURIComponent(roadName)}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('ward-length-details');
      const title = document.getElementById('popup-road-name');
      const popup = document.getElementById('ward-length-popup');

      title.textContent = `📍 ${roadName}`;
      container.innerHTML = '';

      const grouped = {};

      data.forEach(entry => {
        const ward = entry.clippedWardName || entry.wardName;
        const length = (entry.lengthWithinWard / 1000).toFixed(2); // in km
        grouped[ward] = length;
      });

      Object.entries(grouped).forEach(([ward, len]) => {
        const div = document.createElement('div');
        div.textContent = `- ${ward}: ${len} km`;
        container.appendChild(div);
      });

      popup.classList.remove('hidden');
    })
    .catch(err => console.error('Error fetching ward breakdown:', err));
}

function closeWardLengthPopup() {
  document.getElementById('ward-length-popup').classList.add('hidden');
}


function fetchWardwiseBreakdown(roadName) {
  fetch(`http://localhost:8081/api/multiwardroads/search?name=${encodeURIComponent(roadName)}`)
    .then(res => res.json())
    .then(data => {
      const popup = document.getElementById('ward-length-popup');
      const title = document.getElementById('popup-road-name');
      const container = document.getElementById('ward-length-details');

      title.textContent = `📍 ${roadName}`;
      container.innerHTML = '';

      if (!data || data.length === 0) {
        container.innerHTML = 'No data available.';
        return;
      }

      data.forEach(entry => {
        const ward = entry.clippedWardName || entry.wardName || 'Unknown';
        const length = entry.lengthWithinWard ? (entry.lengthWithinWard / 1000).toFixed(2) + ' km' : 'N/A';
        const div = document.createElement('div');
        div.textContent = `- ${ward}: ${length}`;
        container.appendChild(div);
      });

      popup.classList.remove('hidden');
    })
    .catch(err => {
      console.error('Error fetching ward breakdown:', err);
      alert('Failed to fetch ward-wise breakdown.');
    });
}

function closeWardLengthPopup() {
  document.getElementById('ward-length-popup').classList.add('hidden');
}


function showWardwiseBreakdown(roadName) {
  fetch(`http://localhost:8081/api/multiwardroads/search?name=${encodeURIComponent(roadName)}`)
    .then(res => res.json())
    .then(data => {
      const popup = document.getElementById('wardwise-road-breakdown');
      const title = document.getElementById('wardwise-title');
      const content = document.getElementById('wardwise-content');

      title.textContent = `📍 ${roadName}`;
      content.innerHTML = '';

      if (!data || data.length === 0) {
        content.innerHTML = `<div>No segment data found.</div>`;
        return;
      }

      data.forEach(segment => {
        const ward = segment.clippedWardName || 'Unknown Ward';
        const lengthKm = (segment.lengthWithinWard / 1000).toFixed(2);
        const div = document.createElement('div');
        div.className = 'wardwise-item';
        div.innerHTML = `<strong>${ward}</strong>: ${lengthKm} km`;
        content.appendChild(div);
      });

      popup.classList.remove('hidden');
    })
    .catch(err => {
      console.error('Error loading wardwise breakdown:', err);
      alert('Failed to load breakdown');
    });
}

function closeWardwisePopup() {
  document.getElementById('wardwise-road-breakdown').classList.add('hidden');
}
