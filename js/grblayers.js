/*jslint node: true, maxerr: 50, indent: 4 */
"use strict";

var lon = 4.46795;
var lat = 50.97485;
var zoom = 18;
var map;
var vector_layer;
var overpass_layer;
var agiv_layer;
var osmInfo;

var overpassapi = "http://overpass-api.de/api/interpreter?data=";

var webmercator  = new OpenLayers.Projection("EPSG:3857");
var geodetic     = new OpenLayers.Projection("EPSG:4326");
var mercator     = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection

function init() {

    $( document ).ready(function() {
       $("#msg").html("Action: Ready");
       // console.log( "ready!" );
    });


       map = new OpenLayers.Map({
            div: "map",
       // projection: mercator,
            displayProjection: geodetic,
            theme: null,
            controls: [
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.Navigation({'zoomWheelEnabled': true}),
                new OpenLayers.Control.MousePosition(),
                new OpenLayers.Control.LayerSwitcher(),
                new OpenLayers.Control.ScaleLine(),
                //new OpenLayers.Control.PanZoomBar({ panIcons: false }),
                new OpenLayers.Control.Permalink(),                    
                new OpenLayers.Control.TouchNavigation({
                    dragPanOptions: {
                        enableKinetic: false
                    }
                }),
                new OpenLayers.Control.Zoom()
            ],
            units: 'm',
            allOverlays: false,
            //fractionalZoom: true,
            numZoomLevels: 20,
/*
            eventListeners: {
               "featuresadded": function() {
               this.map.zoomToExtent(this.getDataExtent());
               }
            },
*/
            layers: [
                new OpenLayers.Layer.OSM("OpenStreetMap", null, {
                })
                ]
        });

 // Make Belgium WMSlayers
       // http://grb.agiv.be/geodiensten/raadpleegdiensten/GRB/wms?request=getcapabilities&service=wms

      var refresh = new OpenLayers.Strategy.Refresh({force: true, active: true});
   
         // strategies: [new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 3}), refresh], 

         vector_layer = new OpenLayers.Layer.Vector("GRB", {
            strategies: [ new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 3}), refresh], 
            //maxResolution: map.getResolutionForZoom(15),
            //zoomOffset: 9, resolutions: [152.87405654907226, 76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            //zoomOffset: 10, resolutions: [76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            protocol: new OpenLayers.Protocol.HTTP({
                   url: "http://grbtiles.byteless.net/postgis_geojson.php?",
                   format: new OpenLayers.Format.GeoJSON({ 
                     extractAttributes: true
                })
            }),
            projection: mercator,
            //displayProjection: mercator
            isBaseLayer: false
         });

      var BEGRB = new OpenLayers.Layer.WMS("BE GRB basiskaart",
         "http://grb.agiv.be/geodiensten/raadpleegdiensten/GRB-basiskaart/wmsgr?",
         {'layers': 'GRB_BASISKAART', transparent: false, format: 'image/png'},
         {isBaseLayer: true, visibility: true}
         
         );
         map.addLayer(BEGRB);

        // Easily get bbox string (screen relative)
   var boxcontrol = new OpenLayers.Control();
   OpenLayers.Util.extend(boxcontrol, {
         draw: function () {
         // this Handler.Box will intercept the shift-mousedown
         // before Control.MouseDefault gets to see it
         this.box = new OpenLayers.Handler.Box( boxcontrol,
                  {"done": this.notice},
                  {keyMask: OpenLayers.Handler.MOD_SHIFT}
                );
         this.box.activate();
         },
         notice: function (bounds) {
         // OpenLayers.Console.userError(bounds);
      // bounds.transform(map.getProjectionObject(), new OpenLayers.Projection(mercator));
      console.log(bounds);
         $('#msg').removeClass().addClass("notice info").html("Bounding box: " + bounds.toBBOX() );
         }
   });

   map.addControl(boxcontrol);


         vector_layer = new OpenLayers.Layer.Vector("GRB", {
            strategies: [new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 3}), refresh], 
            //maxResolution: map.getResolutionForZoom(15),
            //zoomOffset: 9, resolutions: [152.87405654907226, 76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            //zoomOffset: 10, resolutions: [76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            protocol: new OpenLayers.Protocol.HTTP({
                   url: "http://grbtiles.byteless.net/postgis_geojson.php?",
                   format: new OpenLayers.Format.GeoJSON({ 
                     extractAttributes: true
                })
            }),
            projection: mercator,
            //displayProjection: mercator
            isBaseLayer: false
         });

      var selectCtrl = new OpenLayers.Control.SelectFeature(vector_layer,
        { clickout: true }
      );

      var highlightvector = new OpenLayers.Control.SelectFeature(vector_layer, {
         hover: true,
         highlightOnly: true,
         //autoActivate:true,
         toggle: true,
         renderIntent: "temporary",
         eventListeners: {
            // featurehighlighted: report
            featurehighlighted: onFeatureSelect,
            featureunhighlighted: onFeatureUnselect
         }
      });

       map.addControl(highlightvector);
       map.addControl(selectCtrl);
       highlightvector.activate();
       selectCtrl.activate();

      // Make sure the popup close box works even when not selected
      vector_layer.events.on({
         "featureselected": onFeatureSelect,
         "featureunselected": onFeatureUnselect
      });

      /* popup handling functions */
      function onPopupClose(evt) {
         selectCtrl.unselectAll();
      }

      function destroyPopups(event) {
         while( map.popups.length ) {
            map.removePopup(map.popups[0]);
         }
      }

      function onFeatureSelect(event) {
         destroyPopups(event);
         var feature = event.feature;
         if ( strcmp ('GRB', feature.layer.name) !== 0 ) {
           // Don't work on other layers
           return true;
         }


         // console.log(feature);
         // var content = "<h2>"+encHTML(feature.attributes.building) + "</h2>" + encHTML(feature.attributes.source);
         var content = '<div id="plopper"><fieldset>' + "<legend>"+encHTML(feature.attributes.building) + '</legend><ul id="atlist">' +
            // '<li>' + encHTML(feature.attributes.description) 
            //+ "<li>Building : "+ feature.attributes.building +"</li>"
            //+ "<li>Source    : "+ feature.attributes.source +"</li>"
            getdetails(feature.attributes) +
            // + "<li>Tijd server : "+ feature.attributes.server_time +"</li>"
            "</ul></fieldset></div>";

         var popup = new OpenLayers.Popup.FramedCloud("chicken",
            feature.geometry.getBounds().getCenterLonLat(),
            new OpenLayers.Size(200,200),
            content,
            null, true, onPopupClose);

         feature.popup = popup;
         popup.closeOnMove = false;

         /* TODO disable flickering */
         map.addPopup(popup);
      }

      function onFeatureUnselect(event) {
         var feature = event.feature;
         if(feature.popup) {
            map.removePopup(feature.popup);
            feature.popup.destroy();
            delete feature.popup;
         }
      }

      var report = function(e) {
         //console.log(e.type, e.feature.id);
      };

      //lonLat = new OpenLayers.LonLat(lon, lat).transform(geodetic, map.getProjectionObject());
      //map.setCenter (lonLat, zoom);
      vector_layer.setVisibility(true);

   /* Enable highlighting  */
      map.addControl(highlightvector);
      highlightvector.activate();

      var lonLat = new OpenLayers.LonLat(lon, lat).transform(geodetic, map.getProjectionObject());
      map.setCenter (lonLat, zoom);
      map.addLayer(vector_layer);

	  /* prepare overpass  layer 
      var layers = map.getLayersByName('OverPass');
      for(var layerIndex = 0; layerIndex < layers.length; layerIndex++)
         {
         map.removeLayer(layers[layerIndex]);
      }
     // map.removeLayer('OverPass').
     // overpass_layer.destroyFeatures();
    */

      /* Overpass style */
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

     /* Overpass select hover style */
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
         visibility: false,
         extractStyles: true,
         extractAttributes: true
   }); 

   map.addLayer(overpass_layer);
}

jQuery.fn.encHTML = function () {
return this.each(function(){
   var me   = jQuery(this);
   var html = me.html();
   me.html(html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
   });
};

jQuery.fn.decHTML = function () {
return this.each(function(){
   var me   = jQuery(this);
   var html = me.html();
   me.html(html.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'));
   });
};

jQuery.fn.isEncHTML = function (str) {
   if(str.search(/&amp;/g) != -1 || str.search(/&lt;/g) != -1 || str.search(/&gt;/g) != -1) {
      return true;
   } else {
      return false;
   }
};

function isEncHTML(str) {
   if(str.search(/&amp;/g) != -1 || str.search(/&lt;/g) != -1 || str.search(/&gt;/g) != -1) {
      return true;
   } else {
      return false;
   }
}

function decHTMLifEnc(str){
   if(isEncHTML(str)) {
      return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
   }
   return str;
}

function encHTML(str) {
   return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function strcmp (str1, str2) {
   // http://kevin.vanzonneveld.net
   // +   original by: Waldo Malqui Silva
   // +      input by: Steve Hilder
   // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
   // +    revised by: gorthaur
   // *     example 1: strcmp( 'waldo', 'owald' );
   // *     returns 1: 1
   // *     example 2: strcmp( 'owald', 'waldo' );
   // *     returns 2: -1
   return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
}

function getdetails(attributes) {
   var response = "<dl>";
       $.each(attributes, function(i, item) {
            //var option = '<option value="'+ item.groupid +'">'+ imag + item.groupdesc +'</option>';
            // item.groupdesc, item.groupid));
            //$('#selgroupid').append(option);
            if ( strcmp ('way', i) !== 0 && item.length !== 0 && strcmp ('z_order', i) !== 0 && strcmp ('way_area', i) !== 0) {
               response += "<dt>" + i +"</dt><dd>" + item + "</dd>";
               //console.log(response);
            }
        });
     response += "</dl>";
     return response;
}
   
/**
 * Get the data from osm, ret should be an empty array
 */
function getOsmInfo() {
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
   };
   //console.log("Overpass query:\n" + query);
   req.open("GET", overpassapi + encodeURIComponent(query), true);
   req.send(null);
}


$(function() {
    $('#msg').removeClass().addClass("notice info");
    $("#msg").html("Action: Init buttons");

    $( "#opass" ).button().click(function( event ) {
    $('#msg').removeClass().addClass("notice info").html("Action: Loading overpass data");
   getOsmInfo();
        event.preventDefault();
    });

    $( "#clrpopups" ).button().click(function( event ) {
    $('#msg').removeClass().addClass("notice info");
         while( map.popups.length ) {
            map.removePopup(map.popups[0]);
         }
        $("#msg").html("Action: Popups cleared");
        event.preventDefault();
      });

    $( "#vrfyjosm" ).button().click(function( event ) {
         $('#msg').removeClass().addClass("notice info");
         testJosmVersion();
        event.preventDefault();
      });
    $( "#refreshgrb" ).button().click(function( event ) {
         $('#msg').removeClass().addClass("notice info");
         vector_layer.setVisibility(true);
         vector_layer.refresh();
         event.preventDefault();
      });
});

