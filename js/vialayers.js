/*jslint node: true, maxerr: 50, indent: 4 */
"use strict";

var lat = 52.211051691569;
var lon = 5.877685546875;
var zoomlevel = 8;

var map;
var via_layer;
var via1_layer;
var via2_layer;
var via3_layer;

var pan1_layer;
var pan2_layer;

var event_layer;
var overpass_layer;
var agiv_layer;
var osmInfo;
var layerswitcher;
var filterStrategy;
var streetStrategy;
var buildingStrategy;
var mergeStrategy;
var parentFilter;
var newlayername='source-layer';
var isvecup = null;
var stuff = null;
var streetextents = null;

var overpassapi = "http://overpass-api.de/api/interpreter?data=";
var tile_url = "";

function initmap() {
    $('body').css('cursor', 'wait');
    // pink tile avoidance
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 2;

    var webmercator  = new OpenLayers.Projection("EPSG:3857");
    var geodetic     = new OpenLayers.Projection("EPSG:4326");
    var mercator     = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
    var lambert     = new OpenLayers.Projection("EPSG:31370"); // to Spherical Mercator Projection
    //projection: "EPSG:31370",

    $(window).resize(function() {
        //$('#log').append('<div>Handler for .resize() called.</div>');
        //var canvasheight=$('#map').parent().css('height');
        //var canvaswidth=$('#map').parent().css('width');
        //$('#map').css("height",canvasheight);
        //$('#map').css("width",canvaswidth);
    });

     $("#msg").html("start init()");
       layerswitcher = new OpenLayers.Control.LayerSwitcher();

       map = new OpenLayers.Map({
            div: "map",
            projection: mercator,
            displayProjection: geodetic,
            theme: null,
            controls: [
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.Navigation({'zoomWheelEnabled': true}),
                new OpenLayers.Control.MousePosition(),
                new OpenLayers.Control.LayerSwitcher(),
                new OpenLayers.Control.ScaleLine(),
                layerswitcher,
                //new OpenLayers.Control.PanZoomBar({ panIcons: false }),
                new OpenLayers.Control.Permalink(),                    
                new OpenLayers.Control.Zoom()
            ],
            units: 'm',
            allOverlays: false,
            //fractionalZoom: true,
            numZoomLevels: 20,

            layers: [
                new OpenLayers.Layer.OSM("OpenStreetMap", null, {
                  numZoomLevels: 20
                }),
            ]
        });

       var get_my_url = function (bounds) {
          //console.log(this.url);
          // console.log(this.map.getProjectionObject());
          var res = map.getResolution();
          var x = Math.round ((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
          var y = Math.round ((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
          var z = this.map.getZoom();
          
         if(!x || !y || !z) {
            console.log(x + ' / ' + y + ' / ' + z);
         }

          // var bounds = map.getExtent();
          // bounds.transform(map.getProjectionObject(), geodetic);


          //var path = 'tile_' + z + "_" + x + "-" + y + "." + this.type; 
          var path = z + "/" + x + "/" + y + "." + this.type;
          //console.log(path);
          var url = this.url;
          if (url instanceof Array) {
             url = this.selectUrl(path, url);
          }
          return url + path;
       }
/*
      // via_layer.setVisibility(true);

       via2_layer= new OpenLayers.Layer.TMS(
                       "Backup TMP NL",
                       "http://maps.via.nl/nld_temp/" ,{
                                type: 'png',
                                getURL: get_my_url,
                                numZoomLevels: 18
                                //projection: geodetic,
                                //displayProjection: mercator
                        }
                       );
      map.addLayer(via2_layer);
      // via_layer.setVisibility(true);
       via2_layer= new OpenLayers.Layer.TMS(
                       "(deprecated) OSM NL old",
                       "http://tilesold.byteless.net/osm/" ,{
                                type: 'png',
                                getURL: get_my_url,
                                numZoomLevels: 20
                                //projection: geodetic,
                                //displayProjection: mercator
                        }
                       );
      map.addLayer(via2_layer);
*/

       via_layer= new OpenLayers.Layer.TMS(
                       "Carto OSM NL (gis2 DB)",
                       "http://tilesnew.byteless.net/bosm/" ,{
                                type: 'png',
                                getURL: get_my_url,
                                numZoomLevels: 20
                                //projection: geodetic,
                                //displayProjection: mercator
                        }
                       );
      map.addLayer(via_layer);

       via3_layer= new OpenLayers.Layer.TMS(
                       "Carto OSM NL (gis1 DB)",
                       "http://tilesnew.byteless.net/osm/" ,{
                                type: 'png',
                                getURL: get_my_url,
                                numZoomLevels: 20
                                //projection: geodetic,
                                //displayProjection: mercator
                        }
                       );
      map.addLayer(via3_layer);

/*
       via1_layer= new OpenLayers.Layer.TMS(
                       "Backup OSM NL new ssl",
                       "https://tilesnew.byteless.net/osm/" ,{
                                type: 'png',
                                getURL: get_my_url,
                                numZoomLevels: 20
                                //projection: geodetic,
                                //displayProjection: mercator
                        }
                       );
       map.addLayer(via1_layer);
*/

       pan1_layer= new OpenLayers.Layer.TMS(
                       "Pandonia style (gis2 DB)",
                       "http://tilesnew.byteless.net/nld_temp/" ,{
                                type: 'png',
                                getURL: get_my_url,
                                numZoomLevels: 20
                                //projection: geodetic,
                                //displayProjection: mercator
                        }
                       );
      map.addLayer(pan1_layer);

       pan2_layer= new OpenLayers.Layer.TMS(
                       "Pandonia style (gis1 DB)",
                       "http://tilesnew.byteless.net/nld/" ,{
                                type: 'png',
                                getURL: get_my_url,
                                numZoomLevels: 20
                                //projection: geodetic,
                                //displayProjection: mercator
                        }
                       );

      map.addLayer(pan2_layer);

       var lonLat = new OpenLayers.LonLat(lon, lat).transform(geodetic, map.getProjectionObject());
       map.setCenter (lonLat, zoomlevel);

       map.events.register('zoomend', this, function (event) {
               var bounds = map.getExtent();
               bounds.transform(map.getProjectionObject(), geodetic);
               var center = bounds.getCenterLonLat();
               var setObject = { 'lat': center.lat, 'lon': center.lon, 'zoom':  map.getZoom() };
               $('#msg').html("lat: " + center.lat + " lon: " + center.lon + " / Scale: " + map.getScale() + " / ZoomLevel: " + map.getZoom() + " / Resolution: " + map.getResolution());
               });

    $('body').css('cursor', 'default');
}

$( document ).ready(function() {
    $("#msg").html("Action: DocReady");
    //console.log( "docready!" );

    $(function() {
        $('#msg').removeClass().addClass("notice info");
        $("#msg").html("Action: Init buttons");
/*
        $( "#refreshgrb" ).button().click(function( event ) {
            $('#msg').removeClass().addClass("notice info");
            via_layer.setVisibility(true);
            via_layer.refresh();
            event.preventDefault();
            return false; 
        });
*/
    });
    $("#msg").html("Action: docReadydone");

});

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

function toFixed(value, precision) {
    var power = Math.pow(10, precision || 0);
    return String(Math.round(value * power) / power);
}

/*

  var url = "/stuff.php?account="+ accountname + "&r="+Math.random();

    stuff = (function () {
        var stuff = null;
        $.ajax({
            'async': true,
            'global': false,
            'url': url,
            'dataType': "json",
            'success': function (data) {
            stuff = data;
            }
            });
        //console.log(stuff);
        return stuff;
        })();

*/
