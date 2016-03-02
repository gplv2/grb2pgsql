/*jslint node: true, maxerr: 50, indent: 4 */
"use strict";

//$(document).ready(function () {
   var asset_styled = new OpenLayers.Style({
      //fillColor: "white",
      //pointRadius: 1,
      //fontWeight: "normal",
      //fontColor: "#000000",
      // fontSize: "1px",
      strokeColor: "${speed_color}",
      // strokeColor: "#ff9933",
      strokeWidth: 3,
      pointerEvents: "all",
      fillOpacity: 0.6,
      cursor: "pointer",
      // label : "${highway}",
      labelOutlineColor: "white",
      labelOutlineWidth: 3,
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   /* Hover/select style */
   var asset_temp_styled = new OpenLayers.Style({
      fillColor: "white",
      strokeColor: "#ff9933",
      strokeWidth: 4,
      pointerEvents: "all",
      fillOpacity: 0.4,
      cursor: "pointer",
      label : "${building}",
      labelOutlineColor: "white",
      labelOutlineWidth: 4,
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });
   
   /* stylemaps */
   var vectorlayer_style = new OpenLayers.StyleMap({
      'default' : asset_styled,
      'temporary' : asset_temp_styled
   });

   vectorlayer_style.styles['default'].addRules([
      new OpenLayers.Rule({
         maxScaleDenominator: 60000000,
         minScaleDenominator: 433344,
         symbolizer: {
            fillColor: "white",
            fontColor: "#333333",
            fontWeight: "bolder",
            strokeColor: "${speed_color}",
            pointRadius: 8,
            fontSize: "8px"
            }
      }),
      new OpenLayers.Rule({
         maxScaleDenominator: 433344,
         minScaleDenominator: 54168,
         symbolizer: {
            fillColor: "orange",
            fontColor: "#333333",
            strokeColor: "${speed_color}",
            fontWeight: "bolder",
            pointRadius: 14,
            fontSize: "11px"
            }
      }),
      new OpenLayers.Rule({
         maxScaleDenominator: 54168,
         minScaleDenominator: 1,
         symbolizer: {
            fillColor: "#E6EA18",
            fontColor: "#333333",
            strokeColor: "${speed_color}",
            fontWeight: "bolder",
            pointRadius: 20,
            fontSize: "20px"
            }
      })
   ]);
//});
