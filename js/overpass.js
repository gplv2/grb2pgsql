/*jslint node: true */
"use strict";

// vim: tabstop=3:softtabstop=3:shiftwidth=3:expandtab

var overpassapi = "http://overpass-api.de/api/interpreter?data=";

var osmInfo;
var streets = []; // list of streets with the addresses divided in several categories + extra info
   
/**
 * Get the data from osm, ret should be an empty array
 */
function getOsmInfo() {

    var webmercator  = new OpenLayers.Projection("EPSG:3857");
    var geodetic     = new OpenLayers.Projection("EPSG:4326");
    var mercator     = new OpenLayers.Projection("EPSG:900913"); 

    $('#msg').removeClass().addClass("notice info");

   var bounds = map.getExtent();
   bounds.transform(map.getProjectionObject(), geodetic);
   //bounds.toBBOX(); 
        console.log(bounds.toBBOX());

   var query = "<osm-script output=\"json\" timeout=\"250\">" +
                    "  <union>" +
                    "    <query type=\"way\">" +
                    "      <has-kv k=\"source:geometry:oidn\"/>" +
                    "      <bbox-query e=\"" + bounds.right + "\" n=\"" + bounds.top + "\" s=\"" + bounds.bottom + "\" w=\"" + bounds.left + "\"/>" +
                    "    </query>" +
                    "  </union>" +
                    "  <union>" +
                    "    <item/>" +
                    "    <recurse type=\"down\"/>" +
                    "  </union>" +
                    "  <print mode=\"meta\"/>" +
                    "</osm-script>";

   var req = new XMLHttpRequest();
   var overpasserror = "";
   req.onreadystatechange = function()
   {
      switch(req.readyState) {
         case 0:
            // 0: request not initialized 
               overpasserror = 'Overpass request not initialized';
               break;
         case 1:
            // 1: server connection established
               overpasserror = 'Overpass server connection established';
               break;
         case 2:
            // 2: request received 
               overpasserror = 'Overpass request received';
               break;
         case 3:
            // 3: processing request 
               overpasserror = 'Overpass processing request';
               break;
         case 4:
            // 4: request finished and response is ready
               overpasserror = 'Overpass request finished and response is ready';
               break;
         default:
               overpasserror = 'Overpass Unknown status';
            // unknown status
      }
      $("#msg").html("Info : "+ overpasserror).removeClass().addClass("notice info");

      if (req.readyState != 4)
         return;
      if (req.status != 200) {
            overpasserror = 'non "HTTP 200 OK" status: ' + req.status ;
            $("#msg").switchClass( "info", "error", 200, "easeInOutQuad" ).html("Error : "+ overpasserror).switchClass( "info", "error", 1000, "easeInOutQuad" );
         return;
      }

      var data ="";

      try {
         $("#msg").html("Info : " + "Parsing JSON").removeClass().addClass("notice info");
         data = JSON.parse(req.responseText);
         //osmInfo = req.responseText;
      } catch(e) {
         $('#msg').removeClass().addClass("notice error").html("Problem parsing Overpass JSON data" + e);
         return false;
      }
      $("#msg").html("Info : " + "Parsing OK").removeClass().addClass("notice success");
      //$("#msg").html("Info : " + "Parsing JSON").removeClass().addClass("notice info");
      osmInfo=osmtogeojson(data);
      console.log(osmInfo);
      // console.log(test);
      $("#msg").html("Info : " + "Adding GEOJSON to map").removeClass().addClass("notice info");
      addOverpassLayer();
   }
   //console.log("Overpass query:\n" + query);
   req.open("GET", overpassapi + encodeURIComponent(query), true);
   req.send(null);
}

// REMOTECONTROL BINDINGS
function openInJosm(type, streetData, layerName)
{

   var url =  "http://localhost:8111/load_data?new_layer=true&layer_name="+layerName+"&data=";
   var xml = getOsmXml(type, streetData);

   var req = new XMLHttpRequest();
   req.onreadystatechange = function()
   {
      if (req.readyState == 4 && req.status == 400)
         // something went wrong. Alert the user with appropriate messages
         testJosmVersion();
   }
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
   var layers = map.getLayersByName('OverPass');
   for(var layerIndex = 0; layerIndex < layers.length; layerIndex++)
   {
      map.removeLayer(layers[layerIndex]);
   }
   // map.removeLayer('OverPass').
   // overpass_layer.destroyFeatures();

   /* Halte style */
   var overpass_styled = new OpenLayers.Style({
      fillColor: "red",
      fillOpacity: 0.6,
      fontColor: "#000000",
      fontWeight: "light",
      pointRadius: 8,
      fontSize: "11px",
      strokeColor: "#ff9963",
      strokeWidth: 3,
      //externalGraphic: "${image_url}",
      // externalGraphic: "images/entrs.png",
      //externalGraphic: "http://www2.synctrace.com/images/entrs.png",
      pointerEvents: "all",
      //graphicName: 'star',
      labelOutlineColor: "white",
      labelOutlineWidth: 8,
      labelAlign: "cm",
      cursor: "pointer",
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   /* Halte select hover style */
   var overpass_temp_styled = new OpenLayers.Style({
      fillColor: "red",
      fontColor: "#000000",
      fontWeight: "normal",
      pointRadius: 8,
      fontSize: "11px",
      strokeColor: "#ff9933",
      strokeWidth: 2,
      // externalGraphic: null,
      pointerEvents: "all",
      fillOpacity: 0.3,
      //label : "${getNumber}",
      labelOutlineColor: "white",
      labelAlign: "rb",
      labelOutlineWidth: 8,
      cursor: "pointer",
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   } 
/*
, {
    context: {
      getLabel: function(feature) {
        return feature.properties.tags.source;
      },
      getNumber: function(feature) {
        return feature.properties.tags.building;
      }
    }
  }
*/
);

   var overpass_style = new OpenLayers.StyleMap({
      'default' : overpass_styled,
      'temporary' : overpass_temp_styled
   });

     /* Style the halte layer acc to res */
   overpass_style.styles['default'].addRules([
      new OpenLayers.Rule({
         maxScaleDenominator: 60000000,
         minScaleDenominator: 215000,
         symbolizer: {
            fillColor: "red",
            fillOpacity: 0.6,
            fontColor: "#000000",
            fontWeight: "light",
            pointRadius: 2,
            fontSize: "11px",
            strokeColor: "#ff9963",
            strokeWidth: 1,
            pointerEvents: "all",
            labelOutlineColor: "white",
            labelOutlineWidth: 8,
            labelAlign: "cm",
            cursor: "pointer",
            fontFamily: "sans-serif"
            }
         }),
      new OpenLayers.Rule({
         maxScaleDenominator: 215000,
         minScaleDenominator: 27000,
         symbolizer: {
            fillColor: "red",
            fillOpacity: 0.6,
            fontColor: "#000000",
            fontWeight: "light",
            pointRadius: 4,
            fontSize: "11px",
            strokeColor: "#ff9963",
            strokeWidth: 2,
            pointerEvents: "all",
            labelOutlineColor: "white",
            labelOutlineWidth: 8,
            labelAlign: "cm",
            cursor: "pointer",
            fontFamily: "sans-serif"

            }
         }),
      new OpenLayers.Rule({
         maxScaleDenominator: 27000,
         minScaleDenominator: 3384,
         symbolizer: {
            fillColor: "red",
            fillOpacity: 0.6,
            fontColor: "#000000",
            fontWeight: "light",
            pointRadius: 10,
            fontSize: "11px",
            strokeColor: "#ff9963",
            strokeWidth: 3,
            pointerEvents: "all",
            labelOutlineColor: "white",
            labelOutlineWidth: 8,
            labelAlign: "cm",
            cursor: "pointer",
            fontFamily: "sans-serif"

            }
         }),
      new OpenLayers.Rule({
         maxScaleDenominator: 3384,
         minScaleDenominator: 1,
         symbolizer: {
            fillColor: "red",
            fillOpacity: 0.6,
            fontColor: "#000000",
            fontWeight: "light",
            pointRadius: 10,
            fontSize: "11px",
            strokeColor: "#ff9963",
            strokeWidth: 3,
            //label : "${source}",
            labelAlign: "cm",
            //labelAlign: "cm",
            pointerEvents: "all",
            labelOutlineColor: "white",
            labelOutlineWidth: 8,
            cursor: "pointer",
            fontFamily: "sans-serif"
            }
         })
      ]);


   var mercator = new OpenLayers.Projection("EPSG:900913");
   var webmercator  = new OpenLayers.Projection("EPSG:3857");
   var geodetic     = new OpenLayers.Projection("EPSG:4326");

   var geojson_format = new OpenLayers.Format.GeoJSON({
         internalProjection: map.getProjectionObject(),
         externalProjection: geodetic
   });

   overpass_layer = new OpenLayers.Layer.Vector("OverPass", {
         styleMap: overpass_style,
         maxResolution: map.getResolutionForZoom(15),
         //minScale: 54168.1,
         strategies: [new OpenLayers.Strategy.Fixed()],
         //zoomOffset: 9, resolutions: [152.87405654907226, 76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
         zoomOffset: 10, resolutions: [76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
         format: geojson_format,
         isBaseLayer: false,
         extractStyles: true,
         extractAttributes: true
   }); 

   overpass_layer.addFeatures(geojson_format.read(osmInfo));
   map.addLayer(overpass_layer);
   overpass_layer.setVisibility(true);
   overpass_layer.refresh();
   //console.log(overpass_layer);
   //console.log(vector_layer);
}
