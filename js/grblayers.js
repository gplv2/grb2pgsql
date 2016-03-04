/*jslint node: true, maxerr: 50, indent: 4 */
"use strict";
var lon = 4.46795;
var lat = 50.97485;
var zoom = 9;
var map;
var vector_layer;
var event_layer;
var overpass_layer;
var agiv_layer;
var osmInfo;
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

function initmap() {
    $('body').css('cursor', 'wait');

/*
    $(function() {
      // setup graphic EQ
      $( "#master" ).slider({
        value: 100,
        orientation: "horizontal",
        range: "min",
        animate: true,
	min: 0,
        max: 100,
        //values: [ 75, 300 ],
        slide: function( event, ui ) {
          $('#msg').removeClass().addClass("notice info").html(" Info: Vector opacity: " + ui.value/100);
          // console.log(ui.value);
	  vector_layer.setOpacity(ui.value/100);
          vector_layer.refresh();
        }
      })
      $( "#master > div" ).removeClass('ui-widget-header');
    });
*/
    
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
       var layerswitcher = new OpenLayers.Control.LayerSwitcher();

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
                layerswitcher,
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
                  numZoomLevels: 20
                })
                ]
        });

      map.events.register('zoomend', this, function (event) {
         streetStrategy.setFilter(null);
         buildingStrategy.setFilter(null);
         $('#msg').html("Scale: " + map.getScale() + " / ZoomLevel: " + map.getZoom() + " / Resolution: " + map.getResolution());
         var bounds = map.getExtent();
         bounds.transform(map.getProjectionObject(), geodetic);
         var center = bounds.getCenterLonLat();
         var setObject = { 'lat': center.lat, 'lon': center.lon, 'zoom':  map.getZoom() };
         localStorage.setItem('defaultlocation', JSON.stringify(setObject) );
         //var retrievedObject = JSON.parse(localStorage.getItem('defaultlocation'));
         //console.log(retrievedObject);
    /*
    var x = map.getZoom();

    if( x < 15) {
         //map.zoomTo(15);
    }*/
      });

        $('body').css('cursor', 'default');

        layerswitcher.maximizeControl();

        // Make Belgium WMSlayers
       // http://grb.agiv.be/geodiensten/raadpleegdiensten/GRB/wms?request=getcapabilities&service=wms

        var refresh = new OpenLayers.Strategy.Refresh({force: true, active: true});
        var rrefresh = new OpenLayers.Strategy.Refresh({force: true, active: true});
        var boxStrategy = new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 2});

        filterStrategy = new OpenLayers.Strategy.Filter();
        mergeStrategy = new OpenLayers.Strategy.Filter();
        streetStrategy = new OpenLayers.Strategy.Filter();
        buildingStrategy = new OpenLayers.Strategy.Filter();

         vector_layer = new OpenLayers.Layer.Vector('GRB - Vector Source', {
            styleMap: vectorlayer_style,
            strategies: [ streetStrategy, buildingStrategy, filterStrategy, mergeStrategy, boxStrategy, refresh ], 
            maxScale: 800,
            minScale: 6772,
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

/*
	var draw = new OpenLayers.Control.DrawFeature(vector_layer, OpenLayers.Handler.Polygon);
	map.addControl(draw);
	draw.activate();
        vector_layer.events.register('loadend', vector_layer, function(){
            var extent = vector_layer.getDataExtent().toBBOX().replace(/,/g,", ");
            $("#msg").html("GRB source dataExtent:"+ extent).removeClass().addClass("notice info");
        });
*/

        var grb_wms = new OpenLayers.Layer.WMS(
            "GRB Basiskaart",
            "http://grb.agiv.be/geodiensten/raadpleegdiensten/GRB-basiskaart/wmsgr?",
            {
                LAYERS: 'GRB_BASISKAART',
                transparent: "false",
                //format: "image/png"
            },
            {
                strategies: [ new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 2}), refresh], 
                tiled: true,
                isBaseLayer: true,
                projection: mercator,
                visibility: true
            }
        );

        map.addLayer(grb_wms);

        var grb_wbn = new OpenLayers.Layer.WMS(
            "GRB - WBN+ Weg/water/..",
            "http://grb.agiv.be/geodiensten/raadpleegdiensten/GRB/wms?",
            {
                LAYERS: 'GRB_WBN,GRB_WVB,GRB_SBN,GRB_WTZ,GRB_WLAS,GRB_WGR,GRB_WGO,GRB_WRL,GRB_WKN,GRB_SNM,GRB_SNM_Links,GRB_SNM_Rechts',
                transparent: "true",
                //format: "image/png"
            },
            {
                strategies: [ new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 2}), refresh], 
                tiled: true,
                isBaseLayer: false,
                projection: mercator,
                visibility: false
            }
        );

        map.addLayer(grb_wbn);

        var grb_gem = new OpenLayers.Layer.WMS(
            "GRB - Gemeentegrenzen",
            "http://grb.agiv.be/geodiensten/raadpleegdiensten/GRB/wms?",
            {
                LAYERS: 'GEM_Grens',
                transparent: "true",
                //format: "image/png"
            },
            {
                strategies: [ new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 2}), refresh], 
                tiled: true,
                isBaseLayer: false,
                projection: mercator,
                visibility: false
            }
        );

        map.addLayer(grb_gem);

        var grb_knw = new OpenLayers.Layer.WMS(
            "GRB - KNW",
            "http://grb.agiv.be/geodiensten/raadpleegdiensten/GRB/wms?",
            {
                LAYERS: 'GRB_KNW',
                transparent: "true",
                //format: "image/png"
            },
            {
                strategies: [ new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 2}), refresh], 
                tiled: true,
                isBaseLayer: false,
                projection: mercator,
                visibility: false
            }
        );

        map.addLayer(grb_knw);

        var grb_gbg = new OpenLayers.Layer.WMS(
            "GRB - GBG Gebouw a/d grond",
            "http://grb.agiv.be/geodiensten/raadpleegdiensten/GRB/wms?",
            {
                LAYERS: 'GRB_GBG',
                transparent: "true",
                //format: "image/png"
            },
            {
                strategies: [ new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 2}), refresh], 
                tiled: true,
                isBaseLayer: false,
                projection: mercator,
                visibility: false
            }
        );
        map.addLayer(grb_gbg);

        var grb_gba = new OpenLayers.Layer.WMS(
            "GRB - GBA Gebouwaanhorigheid",
            "http://grb.agiv.be/geodiensten/raadpleegdiensten/GRB/wms?",
            {
                LAYERS: 'GRB_GBA',
                transparent: "true",
                //format: "image/png"
            },
            {
                strategies: [ new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 2}), refresh], 
                tiled: true,
                isBaseLayer: false,
                projection: mercator,
                visibility: false
            }
        );
        map.addLayer(grb_gba);


        var geojson_format = new OpenLayers.Format.GeoJSON({
            internalProjection: map.getProjectionObject(),
            externalProjection: geodetic
        });

        var grb_ortho = new OpenLayers.Layer.WMS(
            "Agiv Ortho",
            //"http://geo.agiv.be/ogc/wms/omkl?VERSION=1.1.1&",
            "http://geoservices.informatievlaanderen.be/raadpleegdiensten/OMW/wms?",
            {
                WIDTH: 512,
                HEIGHT: 512,
                VERSION: '1.1.1',
                LAYERS: 'OMWRGB15VL',
                FORMAT: "image/png"
            },
            {
                strategies: [ new OpenLayers.Strategy.BBOX({ratio: 2, resFactor: 2})], 
                tiled: true,
                isBaseLayer: true,
                projection: 'EPSG:3857',
                visibility: false
            }
        );

        map.addLayer(grb_ortho);

    /* shift-mouse1 Easily get bbox string (screen relative) */
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
            //console.log(bounds);
            $('#msg').removeClass().addClass("notice info").html("Bounding box: " + bounds.toBBOX() );
         }
   });

   map.addControl(boxcontrol);

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

      /* popup handling functions */
      function onPopupClose(evt) {
         selectCtrl.unselectAll();
      }

      function destroyPopups(event) {
         while( map.popups.length ) {
            map.removePopup(map.popups[0]);
         }
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

      function onFeatureSelect(event) {
         destroyPopups(event);
         if ( !$( "#popupswitch" ).prop( "checked" ) ) {
            return true;
         }

         var feature = event.feature;
         if ( strcmp ('GRB - Vector Source', feature.layer.name) !== 0 ) {
           // Don't work on other layers
           return true;
         }

         // var content = "<h2>"+encHTML(feature.attributes.building) + "</h2>" + encHTML(feature.attributes.source);
	 var featid='';
	 if (feature.attributes.building) {
		featid=feature.attributes.building;	
	 } else {
		featid=feature.attributes.highway;	
		//console.log(feature);
	 }
         var content = '<div id="plopper"><fieldset>' + "<legend>"+encHTML(featid) + '</legend>' +
            // '<li>' + encHTML(feature.attributes.description) 
            //+ "<li>Building : "+ feature.attributes.building +"</li>"
            //+ "<li>Source    : "+ feature.attributes.source +"</li>"
            getdetails(feature.attributes) +
            // + "<li>Tijd server : "+ feature.attributes.server_time +"</li>"
            "</ul></fieldset></div>";
         //console.log(content);

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

      //lonLat = new OpenLayers.LonLat(lon, lat).transform(geodetic, map.getProjectionObject());
      //map.setCenter (lonLat, zoom);

      // Make sure the popup close box works even when not selected
      //vector_layer.events.on({
      //});

	   vector_layer.events.on({
         "featureselected": onFeatureSelect,
         "featureunselected": onFeatureUnselect,
         "featuresadded": function() {
            $("#msg").html("Info : "+ "Loaded GRB import layer").removeClass().addClass("notice success");
         }
      });

      // create selection lists
      vector_layer.events.register('loadend', this, onloadvectorend);

      map.addLayer(vector_layer);
      vector_layer.setVisibility(true);
      /* Enable highlighting  */
      map.addControl(highlightvector);
      highlightvector.activate();

      // lon + lat + zoom 
      var retrievedObject = JSON.parse(localStorage.getItem('defaultlocation'));
      if ( retrievedObject ) {
         // var setObject = { 'lat': center.lat, 'lon': center.lon, 'zoom':  map.getZoom() };
         // localStorage.setItem('defaultlocation', JSON.stringify(setObject) );
         var lonLat = new OpenLayers.LonLat(retrievedObject.lon, retrievedObject.lat).transform(geodetic, map.getProjectionObject());
         map.setCenter (lonLat, retrievedObject.zoom);

      } else {
         var lonLat = new OpenLayers.LonLat(lon, lat).transform(geodetic, map.getProjectionObject());
         map.setCenter (lonLat, zoom);
      }

      /* remove existing overpass layer 
      var layers = map.getLayersByName('OverPass');
      for(var layerIndex = 0; layerIndex < layers.length; layerIndex++) {
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

   overpass_layer = new OpenLayers.Layer.Vector("Overpass - GRB Data in OSM", {
         styleMap: overpass_style,
         //maxResolution: map.getResolutionForZoom(15),
         //minScale: 54168.1,
         // strategies: [new OpenLayers.Strategy.Fixed()], // This throws an error when setting visibility to true , strange.
         //zoomOffset: 9, resolutions: [152.87405654907226, 76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
         //zoomOffset: 10, resolutions: [76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
         format: geojson_format,
         isBaseLayer: false,
         visibility: false,
         extractStyles: false,
         extractAttributes: true
   }); 

   map.addLayer(overpass_layer);
   map.setLayerIndex(overpass_layer, 0);

   //overpass_layer.destroyFeatures();
   //overpass_layer.addFeatures(geojson_format.read(osmInfo));
   //map.addLayer(overpass_layer);
   //overpass_layer.setVisibility(true);
   //overpass_layer.refresh();
   //console.log(overpass_layer);


//console.log(eventlayer_style);
/*
         event_layer = new OpenLayers.Layer.Vector('BXL - Traffic events/works', {
            styleMap: eventlayer_style,
            strategies: [new OpenLayers.Strategy.BBOX(), rrefresh ], 
            // projection: new OpenLayers.Projection("EPSG:31370"),
            // projection: geodetic,
            displayProjection: geodetic,
            //maxScale: 800,
            //minScale: 6772,
            //maxResolution: map.getResolutionForZoom(15),
            //zoomOffset: 9, resolutions: [152.87405654907226, 76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            //zoomOffset: 10, resolutions: [76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            protocol: new OpenLayers.Protocol.HTTP({
                   url: "http://grbtiles.byteless.net/proxy/traffic.php?",
                   format: new OpenLayers.Format.GeoJSON({ 
                        internalProjection: map.getProjectionObject(),
                        externalProjection: lambert,
                     })
                }),
            extractStyles: false,
            extractAttributes: true,
            //format: geojson_format,
            //displayProjection: mercator,
            isBaseLayer: false
         });

      event_layer.setVisibility(true);
      event_layer.refresh();
      map.addLayer(event_layer);

*/
      //var feature = event_layer.features;
//console.log(event_layer);

   function onloadvectorend(evt) {
         // isvecup = null; Always do this now
       isvecup = null;
       if(isvecup == null || isvecup == undefined) {
          // if(stuff !== null && stuff !== undefined) 
          // console.log(poilayer);
          $('#cntain').css("width", 'auto');
          $('#contentfilters').empty();
          $('#contentfilters').css("float", 'right');
          $('#contentfilters').append('<fieldset id="pset" style="width: 160px; display: inline-block; height: 56px;">');
          $('#pset').append('<legend class="fright">Street filter</legend>');
          $('#pset').append('<select id="seltagid" name="tagid" style="width:100%;">');
          $('#seltagid').append(new Option('*','None'));
          //stuff = vector_layer.features;
          //addr:street
          var streets = {} ;

          $.each(vector_layer.features, function(i, item) {
               if ( item.attributes['addr:street']) {
                  streets[item.attributes['addr:street']] = 1;
               }
          });

          var keys = [];
            for (var key in streets) {
               if (streets.hasOwnProperty(key)) {
               keys.push(key);
               }
            }
          keys.sort ();

          //console.log(keys);
          $.each(keys, function(i, item) {
               //$('#seltagid').append(new Option(item.['addr:street'], item.asdfsadf ));
               $('#seltagid').append(new Option(item, item));
          });
          // $('#pset').append('<div id="gicon"></div>');

          $('#contentfilters').append('</fieldset>');

          $('#seltagid').change(function() {
               //streetStrategy.setFilter(null);
               // vector_layer.refresh();
               var filterstring=$('#seltagid').val();
               var propertysearch='addr:street';

               if (filterstring == 'None') {
                    filterstring = ''
               }

               var myfilter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LIKE,
                    // property: "imei",
                    property: propertysearch,
                    value: filterstring
               });

                //console.log(filterstring);
               if (filterstring.length<=0) {
                    streetStrategy.setFilter(null);
               } else {
                    streetStrategy.setFilter(myfilter);
               }
               vector_layer.refresh();

               var bounds = vector_layer.getDataExtent();
               //map.getZoom()

               if(bounds !== null && bounds !== undefined) {
                    map.panTo(bounds.getCenterLonLat());
                    //map.zoomToExtent(bounds, true);
               }
         });

         // The building filter
         $('#contentfilters').append('<fieldset id="bset" style="width: 160px; display: inline-block; height: 56px;">');
         $('#bset').append('<legend class="fright">Building filter</legend>');
         $('#bset').append('<select id="selbtype" name="tagid" style="width:100%;">');
         $('#selbtype').append(new Option('*','None'));
         //stuff = vector_layer.features;
         //addr:street
         var buildings = {} ;

         $.each(vector_layer.features, function(i, item) {
               //console.log(item.attributes['building']);
               if ( item.attributes['building']) {
                  buildings[item.attributes['building']] = item.attributes['building'];
               }
         });

         var keys = [];
         for (var key in buildings) {
               if (buildings.hasOwnProperty(key)) {
                  keys.push(key);
               }
         }
         keys.sort ();

         // console.log(keys);
         $.each(keys, function(i, item) {
               //$('#selbtype').append(new Option(item.['addr:street'], item.asdfsadf ));
               $('#selbtype').append(new Option(item, item));
         });
         // $('#bset').append('<div id="gicon"></div>');
   
         $('#contentfilters').append('</fieldset>');

         $('#selbtype').change(function() {
               //buildingStrategy.setFilter(null);
               // vector_layer.refresh();
               var filterstring=$('#selbtype').val();
               var propertysearch='building';

               if (filterstring == 'None') {
                    filterstring = ''
               }

               var myfilter = new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.LIKE,
                    // property: "imei",
                    property: propertysearch,
                    value: filterstring
               });

                //console.log(filterstring);
               if (filterstring.length<=0) {
                    buildingStrategy.setFilter(null);
               } else {
                    buildingStrategy.setFilter(myfilter);
               }
               vector_layer.refresh();

               var bounds = vector_layer.getDataExtent();

               if(bounds !== null && bounds !== undefined) {
                    map.panTo(bounds.getCenterLonLat());
                    //map.zoomToExtent(bounds, true);
               }
        });
         //console.log(poilayer.features);
         isvecup = true;
   }
  }
}

/**
 * Get the data from osm, ret should be an empty array
 */
function getOsmInfo() {
    var geodetic     = new OpenLayers.Projection("EPSG:4326");
    $('#msg').removeClass().addClass("notice info");

   var bounds = map.getExtent();
   bounds.transform(map.getProjectionObject(), geodetic);
   //bounds.toBBOX(); 
   //console.log(bounds.toBBOX());

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
      } catch(e) {
         $('#msg').removeClass().addClass("notice error").html("Problem parsing Overpass JSON data" + e);
         return false;
      }
      $("#msg").html("Info : " + "Parsing OK").removeClass().addClass("notice success");
      //$("#msg").html("Info : " + "Parsing JSON").removeClass().addClass("notice info");
      //console.log(data);
      osmInfo=osmtogeojson(data);
      // console.log(test); 
      addOverpassLayer();
      //$("#msg").html("Info : " + "Added GEOJSON to map").removeClass().addClass("notice success");
   }
   //console.log("Overpass query:\n" + query);
   req.open("GET", overpassapi + encodeURIComponent(query), true);
   req.send(null);
}

$( document ).ready(function() {
    $("#msg").html("Action: DocReady");
    //console.log( "docready!" );

    $(function() {
        $('#msg').removeClass().addClass("notice info");
        $("#msg").html("Action: Init buttons");

        $( "#opass" ).button().click(function( event ) {
            $('#msg').removeClass().addClass("notice info").html("Action: Loading overpass data");
            $('body').css('cursor', 'wait');
            getOsmInfo();
            $('body').css('cursor', 'default');
            //event.preventDefault();
            //return false; 
        });

        $( "#fpass" ).button().click(function( event ) {
            $('#msg').removeClass().addClass("notice info").html("Action: Filtering GRB vector layer (overpass data / BBOX)");
            $('body').css('cursor', 'wait');
            filterForJosm();
            $('body').css('cursor', 'default');
            //event.preventDefault();
            //return false; 
        });

        $( "#popupswitch" ).button().click(function( event ) {
            if ( $( this ).prop( "checked" ) ) {
               $('#msg').removeClass().addClass("notice info").html("Config: Popup autoloading enabled.");
               $('#lbl_popupswitch > span').html("Disable Popups");
            } else {
               $('#msg').removeClass().addClass("notice info").html("Config: Popup autoloading disabled.");
               $('#lbl_popupswitch > span').html("Enable Popups");
               //$('body').css('cursor', 'wait');
               //$('body').css('cursor', 'default');
            }
         return true; 
        });

        $( "#labelswitch" ).button().click(function( event ) {
            if ( $( this ).prop( "checked" ) ) {
               $('#msg').removeClass().addClass("notice info").html("Config: Labels enabled.");
               $('#lbl_labelswitch > span').html("Labels off");
            } else {
               $('#msg').removeClass().addClass("notice info").html("Config: Labels disabled.");
               $('#lbl_labelswitch > span').html("Labels On");
               //$('body').css('cursor', 'wait');
               //$('body').css('cursor', 'default');
            }
         return true; 
        });



/*
        $( "#refreshgrb" ).button().click(function( event ) {
            $('#msg').removeClass().addClass("notice info");
            vector_layer.setVisibility(true);
            vector_layer.refresh();
            event.preventDefault();
            return false; 
        });
*/
        $( "#loadgrb" ).button().click(function( event ) {
            $('#msg').removeClass().addClass("notice info").html("Action: Loading vector GRB data in a new JOSM layer");
            $('body').css('cursor', 'wait');
            openInJosm();
            $('body').css('cursor', 'default');
            event.preventDefault();
            return false; 
        });
        $( "#loadarea" ).button().click(function( event ) {
            $('#msg').removeClass().addClass("notice info").html("Action: Opening area in JOSM");
            $('body').css('cursor', 'wait');
            openAreaInJosm();
            $('body').css('cursor', 'default');
            event.preventDefault();
            return false; 
        });
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
