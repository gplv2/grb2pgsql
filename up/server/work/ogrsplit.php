#!/usr/bin/php
<?php

// Extent: (4.175366, 50.990834) - (5.262536, 51.505145)

$ll = "Extent: (4.175366, 50.990834) - (5.262536, 51.505145)";

echo $ll . PHP_EOL;

$res = preg_match("/Extent: \(([-+]?[0-9]*\.?[0-9]+), ([-+]?[0-9]*\.?[0-9]+)\) - \(([-+]?[0-9]*\.?[0-9]+), ([-+]?[0-9]*\.?[0-9]+)\)/", $ll ,$matches);

list ($all, $bbox_left, $bbox_bottom, $bbox_right, $bbox_top) = $matches;

// print_r($matches);

$w= $bbox_right - $bbox_left;
$h= $bbox_top - $bbox_bottom;

$grid=10;

$box_w=$w/$grid;
$box_h=$h/$grid;

$boxt=$bbox_top;
$boxb=$bbox_bottom;
$boxr=$bbox_right;
$boxl=$bbox_left;

echo "{ \"type\": \"FeatureCollection\", \"features\": [";

$count=0;
for($i=0;$i<$grid;$i++) {
   for($j=0;$j<$grid;$j++) {
      // echo sprintf("        l           b          r           t\n");
      //echo sprintf("BBOX = (%s, %s) - (%s, %s)\n",$bbox_left, $bbox_bottom, $bbox_right, $bbox_bottom);
      echo sprintf("{\"type\":\"Polygon\",\"coordinates\":[[[%s,%s],[%s, %s],[%s, %s],[%s, %s]]]}\n", $bbox_left, $bbox_bottom, $bbox_bottom, $bbox_right, $bbox_right, $bbox_top, $bbox_top, $bbox_left);

      $bbox_top+=$box_w;
      $bbox_bottom+=$box_h;
   }
   $bbox_top=$boxt;
   $bbox_bottom=$boxb;

   $bbox_left+=$box_w;
   $bbox_right+=$box_h;
}

echo "] }";


{ "type": "FeatureCollection",
    "features": [
      { "type": "Feature",
         "geometry": {
           "type": "Polygon",
           "coordinates": [
             [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]
             ]
         },
         "properties": {
           "prop2": "value2",
           "prop3": {"this": "that"}
           }
         }
       ]
     }
