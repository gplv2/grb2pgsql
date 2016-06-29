/*jslint node: true, maxerr: 50, indent: 4 */
"use strict";

// vim: tabstop=3;softtabstop=3;shiftwidth=3;expandtab

var streets = []; // list of streets with the addresses divided in several categories + extra info

// REMOTECONTROL BINDINGS
function filterForJosm() {    
   filterStrategy.setFilter(null);
   mergeStrategy.setFilter(null);
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
                  //console.log(item)k;
                  //console.log(feature.attributes);
                  if(!item.attributes.tags['source:geometry:entity']) {
                     $("#msg").html("Warning : "+ "The features from overpass are missing the entity tag, add the entity (Gbg, Knw ..) , this will improve and correct the filtering.").removeClass().addClass("notice warn");
                        // Entity is missing, probably a legacy test import
                     if(item.attributes.tags['source:geometry:oidn'] === feature.attributes['source:geometry:oidn']) {
                        //console.log("found match: " + item.attributes.tags['source:geometry:oidn']);
                        ret = false;
                     }
                  } else {
                     if(item.attributes.tags['source:geometry:oidn'] === feature.attributes['source:geometry:oidn'] &&
                        item.attributes.tags['source:geometry:entity'] === feature.attributes['source:geometry:entity']) {
                        ret = false;
                     }
                  }
               });
            return ret;
        }
    });
    mergeStrategy.setFilter(overpassfilter);
   $("#msg").html("<br/>Info : "+ "Filtered vector layer GRB with overpass data").removeClass().addClass("notice success");
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
         $('#msg').removeClass().addClass("notice success").html("JOSM is ready");
         var geodetic = new OpenLayers.Projection("EPSG:4326");

         var myurl =  "http://localhost:8111/load_data?new_layer=true&layer_name="+newlayername+"&data=";

         var geoJSON = new OpenLayers.Format.GeoJSON({
            internalProjection: map.getProjectionObject(),
            externalProjection: geodetic
         });

         var mylayers = map.getLayersByName('GRB - Vector Source');
      //console.log(mylayers[0].features);
/*
               $.each(mylayers.features, function(i, item) {
                  if(!item.attributes.tags['source:geometry:entity']) {
                        ret = false;
                  }
               });
*/

      
         var json = geoJSON.write( mylayers[0].features );

         //console.log(json);
         var mylayers = null;

         // From npm module
         // console.log(json);
         // console.log("parsing json");
         // Command line simplify using mapshaper: 
         // -simplify 85% dp keep-shapes stats -o format=geojson /home/glenn/out.geojson

         var xml = '';
         //var opts = { pct: 75 , method: 'dp', keep_shapes: true };
         var threshhold = Number($( "#dpslider" ).slider( "value" ));
         if (threshhold != 100 && threshhold) {
            $('#msg').removeClass().addClass("notice info").html("Simplifying ways (overnode removal)...");
            // console.log("simplifying");
            var dataset = mapshaper.internal.importContent({json: {content: JSON.parse(json)}});

            var opts = { pct: (threshhold/100) , method: 'dp', keep_shapes: true };

            var ms = mapshaper.simplify(dataset, opts);

            var output = mapshaper.internal.exportFileContent(dataset, {format: 'geojson'});

            $('#msg').removeClass().addClass("notice info").html("export to OSM-XML format");

            xml = geos(JSON.parse(output[0].content));
            //var xml = geos(JSON.parse(json));
         } else {
            $('#msg').removeClass().addClass("notice info").html("Not simplifying.");
            // console.log("Not simplifying");
            xml = geos(JSON.parse(json));
         }

         //console.log(xml);
         var json = null;
         var req = new XMLHttpRequest();
         req.onreadystatechange = function()
         {
            if (req.readyState == 4 && req.status == 400)
               // something went wrong. Alert the user with appropriate messages
               testJosmVersion();
         };
         $('#msg').removeClass().addClass("notice info").html("Exporting XML to JOSM");
         req.open("GET", myurl + encodeURIComponent(xml), true);
         req.send(null);
      }
   }).fail(function (jqXHR, textStatus, errorThrown) {
           $('#msg').removeClass().addClass("notice error").html("Fail to get JOSM version using remote control, is it running ?");
         //console.log(errorThrown);
   });
}

function openAreaInJosm() {
   $.ajax({
      url: "//localhost:8111/version",
      dataType: "json",
      timeout: 5000 // 5 second wait
   }).done(function (data) {
      var version = data.protocolversion;
      if (version.minor < 6) {
         $('#msg').removeClass().addClass("notice error").html("Your JOSM installation does not yet support load_data requests. Please update JOSM to version 7643 or newer");
      } else {
         $('#msg').removeClass().addClass("notice success").html("JOSM is ready");
         var geodetic = new OpenLayers.Projection("EPSG:4326");

         function generateId(len) {
            var arr = new Uint8Array((len || 40) / 2);
            window.crypto.getRandomValues(arr);
            return [].map.call(arr, function(n) { return n.toString(16); }).join("");
         }

         var bounds = map.getExtent();
         bounds.transform(map.getProjectionObject(), geodetic);
         var myurl = "http://localhost:8111/load_and_zoom?new_layer=true&layer_name=" + generateId(10) + "&" + "left=" + bounds.left + "&right=" + bounds.right + "&top=" + bounds.top + "&bottom=" + bounds.bottom;
         console.log(myurl);

         var req = new XMLHttpRequest();
         req.onreadystatechange = function()
         {
            if (req.readyState == 4 && req.status == 400)
               // something went wrong. Alert the user with appropriate messages
               testJosmVersion();
         };
         $('#msg').removeClass().addClass("notice info").html("Opening area in JOSM");
         var req = new XMLHttpRequest();
         req.open("GET", myurl, true);
         req.send(null);
      }
   }).fail(function (jqXHR, textStatus, errorThrown) {
           $('#msg').removeClass().addClass("notice error").html("Fail to get JOSM version using remote control, is it running ?");
         //console.log(errorThrown);
   });
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
