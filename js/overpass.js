/*jslint node: true, maxerr: 50, indent: 4 */
"use strict";

// vim: tabstop=3;softtabstop=3;shiftwidth=3;expandtab

var streets = []; // list of streets with the addresses divided in several categories + extra info

// REMOTECONTROL BINDINGS
function filterForJosm() {
   // var webmercator  = new OpenLayers.Projection("EPSG:3857");
   var geodetic     = new OpenLayers.Projection("EPSG:4326");
   // var mercator     = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection

   newlayername='filtered-sourcelayer';

   var bounds = map.getExtent();

   var filter1 = new OpenLayers.Filter.Spatial({
      projection: geodetic,
      type: OpenLayers.Filter.Spatial.BBOX,
      value: bounds
   });
   filterStrategy.setFilter(filter1);

   /* Filter out all buildings that come back via overpass from source vector layer */
   var overpassfilter  = new OpenLayers.Filter.Comparison({
        type: OpenLayers.Filter.Comparison.LIKE,
        property: "source:geometry:oidn",
        evaluate: function(feature) {
               var ret = true;
               $.each(overpass_layer.features, function(i, item) {
                  //console.log("testing " + feature.attributes['source:geometry:oidn']);
                  //console.log(item);
                  //console.log(feature.attributes);
                  if(item.attributes.tags['source:geometry:oidn'] === feature.attributes['source:geometry:oidn']) {
                     //console.log("found match: " + item.attributes.tags['source:geometry:oidn']);
                     ret = false;
                  }
               });
            return ret;
        }
    });
    mergeStrategy.setFilter(overpassfilter);
   $("#msg").html("Info : "+ "Filtered vector layer GRB with overpass data").removeClass().addClass("notice success");
   //return true;
}

function openInJosm() {
   $.ajax({
      url: "//localhost:8111/version",
      dataType: "json",
      timeout: 5000 // 5 second wait
   }).done(function (data) {
      var version = data.protocolversion;
      if (version.minor < 6) {
         $('#msg').removeClass().addClass("notice error").html("Your JOSM installation does not yet support load_data requests. Please update JOSM to version 7643 or newer");
      } else {
         $('#msg').removeClass().addClass("notice success").html("JOSM is running");
         var geodetic = new OpenLayers.Projection("EPSG:4326");

         var myurl =  "http://localhost:8111/load_data?new_layer=true&layer_name="+newlayername+"&data=";

         var geoJSON = new OpenLayers.Format.GeoJSON({
            internalProjection: map.getProjectionObject(),
            externalProjection: geodetic
         });

         var mylayers = map.getLayersByName('GRB - Vector Source');
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
         req.open("GET", myurl + encodeURIComponent(xml), true);
         req.send(null);
      }
   }).fail(function (jqXHR, textStatus, errorThrown) {
           $('#msg').removeClass().addClass("notice error").html("Fail to get JOSM version using remote control, is it running ?");
         //console.log(errorThrown);
   });
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
