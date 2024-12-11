var map = L.map('map', { zoomControl: false, renderer: L.canvas() });
map.getContainer().style.backgroundColor = 'white'
var corners = [
  [
    47.3,
    1.5
  ],
  [
    50.3,
    1.5
  ],
  [
    50.3,
    6.2
  ],
  [
    47.3,
    6.2
  ],
  [
    47.3,
    1.5
  ]
]

var polygon = L.polygon(corners, {
  "color": "black",
  "fillOpacity": 0,
  "weight": 1,
}).addTo(map);

var textIcon = L.divIcon({
  className: 'custom-text-icon',
  html: '<b>LA CHAMPAGNE</b>',
  iconSize: [100, 0],
  iconAnchor: [-4, 0]
});

map.fitBounds(corners);

var info = L.control();
const clickedFeature = document.getElementById("feature")

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};

info.update = function (properties) {
  if (properties) {
    this._div.innerHTML = `
        <h4>${properties.nom || 'Non renseigné'}</h4>
        <p><strong>Surface (ca) :</strong> ${properties.surfaceplantee || 'Non renseigné'}</p>
        <p><strong>Cépages :</strong> ${properties.nomcepage || 'Non renseigné'}</p>
        <p><strong>Plantation :</strong> ${properties.anneeplantation || 'Non renseignée'}</p>
        <p><strong>Lieux-dit :</strong> ${properties.lieuxdit || 'Non renseigné'}</p>`;
  } else {
    this._div.innerHTML = 'Touchez une parcelle';
  }
};


info.addTo(map);

var marker = L.marker([50.3, 1.5], { icon: textIcon }).addTo(map);

const style1 = { color: "black", weight: 1, fillOpacity: 0 };
const style2 = { color: "black", weight: 0.6, fillOpacity: 0 };
const style3 = { color: "black", weight: 0.1, fillOpacity: 0 };
const style4 = { color: "black", fillColor: "#bf9000", weight: 0.2, opacity: 1, fillOpacity: 0.8 };
const style5 = { color: "black", fillColor: "#f59e0b", weight: 1.5, fillOpacity: 0.1 };
const style6 = { color: "#075985", weight: 1.5, fillOpacity: 0.5 };

const hstyle1 = { weight: 2, fillColor: "#22c55e", fillOpacity: 0.1, zoom: 50 };
const hstyle2 = { color: "black", weight: 2, fillOpacity: 0.2 };
const hstyle3 = { weight: 2 };

var Layer1 = null;
var Layer2 = null;
var Layer3 = null;
var Layer4 = null;
var Layer5 = null;
var Layer6 = null;

function getColor(c) {
  return c === "MEUNIER N" ? '#8b5cf6' :
    c === "PINOT NOIR N" ? '#f43f5e' :
      c === "CHARDONNAY B" ? '#22c55e' :
        (c) ? '#6fa8dc' :
          'white'
}

function getOpacity(c) {
  return (c) ? 0.8 : 0
}

function styleFeature(feature) {
  return {
    fillColor: getColor(feature.properties.nomcepage),
    weight: 0.4,
    opacity: 1,
    color: 'black',
    fillOpacity: getOpacity(feature.properties.nomcepage)
  };
}

function createLabel(e) {
  center = e.target.getBounds().getCenter()
  labelMarker = L.tooltip({
    permanent: false,
    className: 'tooltip',
    direction: 'center'
  })
    .setContent(e.target.feature.properties.nom)
    .setLatLng(center)
    .addTo(map);

}

function updateFeature(e, layerSource) {
  if (e.target.feature.properties.nom) {
    // Commencer à construire le contenu HTML
    clickedFeature.innerHTML = `
      <h4>${e.target.feature.properties.nom}</h4>
    `;

    if (layerSource === "Layer3") {
      const button = document.createElement("a");
      button.textContent = "+ informations";
      button.href = "#";
      button.style.display = "block";

      clickedFeature.appendChild(button);

      const modal = document.getElementById('modal');
      const modalContent = document.getElementById('modal-content');

      button.addEventListener('click', () => {
        fetch(`https://raw.githubusercontent.com/arthurchiquet/data/refs/heads/master/exploitations/${e.target.feature.properties.nom}.json`)
          .then(response => response.json())
          .then(data => {
            console.log(data)
            modalContent.innerHTML = `
              <h3>${data.Nom}</H3>
              <p>${data.Type}</p>
              <p>${data.Description}</p>
              <p>${data.Adresse}</p>
              <p>${data.T\u00e9l\u00e9phone}</p>
            `
          })
        modal.style.display = 'flex';
      });

      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          modal.style.display = 'none';
        }
      });
    }

    clickedFeature.style.textAlign = "center";
    clickedFeature.style.padding = "5px";
  }
}



function highlightLayer(e, style, layerSource) {
  var layer = e.target;
  layer.setStyle(style);
  createLabel(e);

  if (layerSource === "Layer3") {
    info.update(layer.feature.properties);
  }
}

function resetHighlightLayer(e, layerSource) {
  const layer = e.target;
  let layerReference = null

  switch (layerSource) {
    case 'Layer1':
      layerReference = Layer1;
      break;
    case 'Layer2':
      layerReference = Layer2;
      break;
    case 'Layer3':
      layerReference = Layer3;
      info.update();
      break;
    case 'Layer4':
      layerReference = Layer4;
      break;
    default:
      layerReference = null;
  }

  if (layerReference) {
    layerReference.resetStyle(layer);
  }

  if (labelMarker) {
    map.removeLayer(labelMarker);
  }
}

async function matchParcels(url3, url4, style, onEachFeature) {
  try {
    // Récupérer le GeoJSON
    const geoJsonResponse = await fetch(url3);
    if (!geoJsonResponse.ok) {
      throw new Error(`Échec de la récupération du GeoJSON : ${geoJsonResponse.statusText}`);
    }
    const geoJson = await geoJsonResponse.json();

    // Récupérer le dictionnaire des propriétés
    let idDict = {};
    try {
      const dictResponse = await fetch(url4);
      if (dictResponse.ok) {
        idDict = await dictResponse.json();
      } else {
        console.warn(`Échec de la récupération du dictionnaire : ${dictResponse.statusText}`);
      }
    } catch (dictError) {
      console.warn("Erreur lors du fetch du dictionnaire :", dictError);
    }

    // Appliquer les propriétés au GeoJSON si disponibles
    turf.featureEach(geoJson, (feature) => {
      const id = feature.id;
      if (id && idDict[id]) {
        feature.properties = { ...feature.properties, ...idDict[id] };
      }
    });
    return L.geoJSON(geoJson, {
      style: styleFeature,
      onEachFeature: onEachFeature
    }).addTo(map);

  } catch (error) {
    console.error("Erreur lors de la récupération ou du traitement des données :", error);
  }
}


async function clickAction(e, layerSource) {
  const layer = e.target
  updateFeature(e, layerSource)

  switch (layerSource) {
    case 'Layer1':
      map.fitBounds(e.target.getBounds());

      if (Layer3) {
        map.removeLayer(Layer3);
      }
      if (Layer4) {
        map.removeLayer(Layer4);
      }
      if (Layer5) {
        map.removeLayer(Layer5);
      }
      if (Layer6) {
        map.removeLayer(Layer6);
      }
      if (Layer2) {
        map.removeLayer(Layer2);
      }
      const url2 = `https://raw.githubusercontent.com/arthurchiquet/data/refs/heads/master/communes/${layer.feature.properties.code}.geojson`;
      Layer2 = addLayerToMap(url2, style2, (feature, layer) => onEachFeature(feature, layer, hstyle2, "Layer2"));
      break;

    case 'Layer2':
      map.fitBounds(e.target.getBounds());

      if (Layer3) {
        map.removeLayer(Layer3);
      }
      if (Layer4) {
        map.removeLayer(Layer4);
      }
      if (Layer5) {
        map.removeLayer(Layer5);
      }
      if (Layer6) {
        map.removeLayer(Layer6);
      }
      const url3 = `https://cadastre.data.gouv.fr/bundler/cadastre-etalab/communes/${layer.feature.properties.id}/geojson/parcelles`;
      const url4 = `https://cadastre.data.gouv.fr/bundler/cadastre-etalab/communes/${layer.feature.properties.id}/geojson/batiments`;
      const url5 = `https://raw.githubusercontent.com/arthurchiquet/data/refs/heads/master/communes/aoc/${layer.feature.properties.id}.geojson`
      const url6 = `https://raw.githubusercontent.com/arthurchiquet/data/refs/heads/master/parcelles/${layer.feature.properties.id}.json`
      const url7 = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/hydrographie-surfaces-deau/records?select=geo_shape&limit=50&refine=code_insee%3A${layer.feature.properties.id}`
      Layer4 = addLayerToMap(url4, style4, (feature, layer) => { }).bringToBack();
      Layer5 = addLayerToMap(url5, style5, (feature, layer) => { }).bringToBack();
      fetch(url7)
        .then(response => response.json())
        .then(data => {
          const geoJson = {
            "type": "FeatureCollection",
            "features": data.results.map(result => result.geo_shape)
          };
          Layer6 = L.geoJSON(geoJson, { style: style6 }).addTo(map);
        })
      Layer3 = await matchParcels(url3, url6, style3, (feature, layer) => onEachFeature(feature, layer, hstyle3, "Layer3"))
      break;

    default:
      console.log("Layer source non définie");
      break;
  }
}

function onEachFeature(feature, layer, style, layerSource) {
  layer.on({
    mouseover: function (e) { highlightLayer(e, style, layerSource); },
    mouseout: function (e) { resetHighlightLayer(e, layerSource); },
    click: function (e) { clickAction(e, layerSource); }
  });
}

function addLayerToMap(url, style, onEachFeature) {
  return L.geoJSON.ajax(url, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map);
}


Layer1 = L.geoJSON.ajax(`https://raw.githubusercontent.com/arthurchiquet/data/refs/heads/master/departements.geojson`, {
  style: style1,
  onEachFeature: function (feature, layer) {
    onEachFeature(feature, layer, hstyle1, "Layer1");
  }
}).addTo(map);
