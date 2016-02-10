/*jslint node: true, maxerr: 50, indent: 4 */
"use strict";

// vim: tabstop=3:softtabstop=3:shiftwidth=3:expandtab

var streets = []; // list of streets with the addresses divided in several categories + extra info

// REMOTECONTROL BINDINGS
function openInJosm(layerName)
{
   var url =  "http://localhost:8111/load_data?new_layer=true&layer_name="+layerName+"&data=";
   var xml =  osm_geojson.geojson2osm(osmInfo)
   console.log(xml);

   var req = new XMLHttpRequest();
   req.onreadystatechange = function()
   {
      if (req.readyState == 4 && req.status == 400)
         // something went wrong. Alert the user with appropriate messages
         testJosmVersion();
   };
   req.open("GET", url + encodeURIComponent(xml), true);
   req.send(null);
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
   //console.log(vector_layer);
}
