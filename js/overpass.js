/*jslint node: true, maxerr: 50, indent: 4 */
"use strict";

// vim: tabstop=3:softtabstop=3:shiftwidth=3:expandtab

var streets = []; // list of streets with the addresses divided in several categories + extra info

// REMOTECONTROL BINDINGS
function openInJosm(layerName) {
   var bounds = map.getExtent();
   bounds.transform(map.getProjectionObject(), geodetic);
   // console.log(bounds.toBBOX());
   // console.log(bounds);
   $("#msg").html("Info : "+ bounds.toBBOX()).removeClass().addClass("notice success");

    var parent_filter = new OpenLayers.Filter.Logical({
        type: OpenLayers.Filter.Logical.AND,
        filters: [filter1, filter2]
    });

   var filter1 = new OpenLayers.Filter.Spatial({
      projection: "EPSG:4326",
      type: OpenLayers.Filter.Spatial.BBOX,
      value: bounds
   });

   var filter2  = new OpenLayers.Filter.Comparison({
        projection: "EPSG:4326",
        type: OpenLayers.Filter.Comparison.LIKE,
        property: "source:geometry:oidn",
        value: trackeddev
        evaluate: function(feature) {
            return false;
        }
    });

    var filter_null = new OpenLayers.Filter.Comparison({
        type: OpenLayers.Filter.Comparison.IS_NULL,
        property: "source"
    });

   var parent_filter = new OpenLayers.Filter.Logical({
        type: OpenLayers.Filter.Logical.AND,
        filters: [filter1, filter2]
   });

   filterStrategy.setFilter(parent_filter);
   // vector_layer.filter.activate(); 
   // vector_layer.refresh({force: true}); -> this throws a weird error, not really needed

   //var webmercator  = new OpenLayers.Projection("EPSG:3857");
   var geodetic     = new OpenLayers.Projection("EPSG:4326");
   //var mercator     = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection

   var url =  "http://localhost:8111/load_data?new_layer=true&layer_name="+layerName+"&data=";
   var geoJSON = new OpenLayers.Format.GeoJSON({
      internalProjection: map.getProjectionObject(),
      externalProjection: geodetic
   });

   var mylayers = map.getLayersByName('GRB - Vector Source');
   //console.log(mylayers[0].features);
   var json = geoJSON.write( mylayers[0].features );
   var mylayers = null;
   var xml =  osm_geojson.geojson2osm(json);
   var json = null;

   var req = new XMLHttpRequest();
   req.onreadystatechange = function()
   {
      if (req.readyState == 4 && req.status == 400)
         // something went wrong. Alert the user with appropriate messages
         testJosmVersion();
   };
   req.open("GET", url + encodeURIComponent(xml), true);
   req.send(null);
   filterStrategy.setFilter(null);
}

function openStreetInJosm(streetNumber)
{
   var street = streets[streetNumber];
   // Get the BBOX of the addresses in the street, and add some margins
   var link = "http://localhost:8111/load_and_zoom"+
      "?left=" + (street.l - 0.001) +
      "&right=" + (street.r + 0.001) +
      "&top=" + (street.t + 0.0005) +
      "&bottom=" + (street.b - 0.0005);

   var req = new XMLHttpRequest();
   req.open("GET", link, true);
   req.send(null);
}

function testJosmVersion() {
   $.ajax({
      url: "//localhost:8111/version",
      dataType: "json",
      timeout: 5000 // 5 second wait
        }).done(function (data) {
      //console.log(data);
      var version = data.protocolversion;
      if (version.minor < 6) {
         $('#msg').removeClass().addClass("notice error").html("Your JOSM installation does not yet support load_data requests. Please update JOSM to version 7643 or newer");
      } else {
         $('#msg').removeClass().addClass("notice success").html("JOSM minor version " + version.minor);
      }
   }).fail(function (jqXHR, textStatus, errorThrown) {
           $('#msg').removeClass().addClass("notice error").html("Fail to get JOSM version using remote control, is it running ?");
      //console.log(errorThrown);
   });
}

function escapeXML(str)
{
   return str.replace(/&/g, "&amp;")
      .replace(/'/g, "&apos;")
      .replace(/>/g, "&gt;")
      .replace(/</g, "&lt;");
}

function addOverpassLayer() {
   var geodetic     = new OpenLayers.Projection("EPSG:4326");
   // map.removeLayer('OverPass').
   overpass_layer.destroyFeatures();
   var geojson_format = new OpenLayers.Format.GeoJSON({
      internalProjection: map.getProjectionObject(),
      externalProjection: geodetic
   });
   overpass_layer.addFeatures(geojson_format.read(osmInfo));
   //map.addLayer(overpass_layer);
   overpass_layer.setVisibility(true);
   overpass_layer.refresh();
   //console.log(overpass_layer);
}
