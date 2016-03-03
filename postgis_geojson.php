<?php

/** Error reporting */
error_reporting(E_ALL);

// vim: tabstop=3:softtabstop=3:shiftwidth=3:noexpandtab

/**
 * PostGIS to GeoJSON
 * requires php5-redis
 * Query a PostGIS table or view and return the results in GeoJSON format, suitable for use in OpenLayers, Leaflet, etc.
 * 
 * @param      string      $bbox       Bounding box of request *REQUIRED*
 * @param      string      $geotable   The PostGIS layer name *REQUIRED*
 * @param      string      $geomfield  The PostGIS geometry field *OPTIONAL*  defaults to 900913 in serverside
 * @param      string      $srid       The SRID of the returned GeoJSON *OPTIONAL (If omitted, EPSG: 4326 will be used)*
 * @param      string      $parameters SQL WHERE clause parameters *OPTIONAL*
 * @param      string      $orderby    SQL ORDER BY constraint *OPTIONAL*
 * @param      string      $sort       SQL ORDER BY sort order (ASC or DESC) *OPTIONAL*
 * @param      string      $limit      Limit number of results returned *OPTIONAL*
 * @param      string      $offset     Offset used in conjunction with limit *OPTIONAL*
 * @return     string                  geojson string
 */
ini_set('zlib.output_compression', 1);

// http://jibbering.com/blog/?p=514


// I'm serious about not wanting any client or proxy caching..
header('Content-Type: application/json');
$headexpires = gmdate('D, d M Y H:i:s') . " GMT";
header("Last-Modified: " . $headexpires);
header("Pragma: no-cache");
header("Expires: " . $headexpires);
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);

//@mb_internal_encoding('UTF-8');
//setlocale(LC_ALL, 'en_US.UTF-8');

function escapeJsonString($value) { # list from www.json.org: (\b backspace, \f formfeed)
  $escapers = array("\\", "/", "\"", "\n", "\r", "\t", "\x08", "\x0c");
  $replacements = array("\\\\", "\\/", "\\\"", "\\n", "\\r", "\\t", "\\f", "\\b");
  $result = str_replace($escapers, $replacements, $value);
  return $result;
}

$geotable = 'planet_osm_polygon';
$geomfield = 'way';
$srid = '900913';


/* test if we are called from the CLI */
if (!defined('STDIN')) {
   if (empty($_REQUEST['srid'])) {
      $srid = '900913';
      //$srid = '3857';
      //$srid = '4326';
   } else {
      $srid = $_REQUEST['srid'];
   }
   if (!empty($_REQUEST['parameters'])) {
      $parameters = $_REQUEST['parameters'];
   }

   if (!empty($_REQUEST['orderby'])) {
      $orderby    = $_REQUEST['orderby'];
   }

   if (empty($_REQUEST['sort'])) {
      $sort = 'ASC';
   } else {
      $sort = $_REQUEST['sort'];
   }

   if (!empty($_REQUEST['limit'])) {
      $limit      = $_REQUEST['limit'];
   }

   if (!empty($_REQUEST['offset'])) {
      $offset     = $_REQUEST['offset'];
   }

   if (!empty($_REQUEST['bbox'])) {
      $bbox = $_REQUEST['bbox'];
      list($bbox_west, $bbox_south, $bbox_east, $bbox_north) = preg_split("/,/", $bbox);
   }
} else {
/*
    [osm_id] => -14968
    [addr:housename] => 
    [addr:housenumber] => 
    [addr:interpolation] => 
    [addr:street] => 
    [addr:flats] => 
    [building] => shed
    [source:geometry:date] => 2008-06-10
    [source:geometry:oidn] => 629316
    [source:geometry] => GRB
    [source] => GRB
*/
   //$fields="*";
   $srid = '900913';
   $bbox="382234.25632491,6566593.3158132,669484.60858063,6697453.5082192";
   list($bbox_west, $bbox_south, $bbox_east, $bbox_north) = preg_split("/,/", $bbox);
   //list($bbox['south'], $bbox['west'], $bbox['east'], $bbox['north']) = preg_split("/,/", $bbox['full']); // west, south, east, north
}
$fields = "osm_id, \"addr:housename\", \"addr:housenumber\", \"addr:interpolation\", \"addr:street\", \"addr:flats\", building, highway ,  \"source:geometry:entity\", \"source:geometry:date\", \"source:geometry:oidn\", \"source:geometry\", \"source:geometry:uidn\", source";

# Build SQL SELECT statement and return the geometry as a GeoJSON element in EPSG: 4326
$sql  = "SELECT " . pg_escape_string($fields) . ", st_asgeojson(ST_Transform(" . pg_escape_string($geomfield) . ",$srid)) AS geojson FROM " . pg_escape_string($geotable);
$sql .= sprintf(" WHERE " . pg_escape_string("way") . " && ST_SetSRID('BOX3D(%s %s, %s %s)'::box3d, %s)", $bbox_west, $bbox_south, $bbox_east, $bbox_north, $srid);
//$sql .= sprintf(" WHERE \"source:geometry:entity\"= 'Gba' AND \"source:geometry:oidn\"='67064' AND " . pg_escape_string("way") . " && ST_SetSRID('BOX3D(%s %s, %s %s)'::box3d, %s)", $bbox_west, $bbox_south, $bbox_east, $bbox_north, $srid);

//if (strlen(trim($parameters)) == 0) {
//$sql .= " WHERE " . pg_escape_string($parameters); }

if (!empty($orderby)){
    $sql .= " ORDER BY " . pg_escape_string($orderby) . " " . $sort;
}
if (!empty($limit)){
    $sql .= " LIMIT " . pg_escape_string($limit);
}
    // $sql .= " LIMIT 20";
if (!empty($offset)){
    $sql .= " OFFSET " . pg_escape_string($offset);
}

//echo $sql;

$redis = new Redis();
$redis->connect('127.0.0.1'); // port 6379 by default

// Sometimes a layer doesn't refresh in openlayers, I noticed that the only difference is that the difference between a good
// and a bad request is the header 'Vary: Accept-Encoding'
// http://stackoverflow.com/questions/14540490/is-vary-accept-encoding-overkill
// http://stackoverflow.com/questions/7848796/what-does-varyaccept-encoding-mean

// $redis->setOption(Redis::OPT_SERIALIZER, Redis::SERIALIZER_PHP);  // use built-in serialize/unserialize

$redis->setOption(Redis::OPT_PREFIX, 'grb:');   // use custom prefix on all keys

$cachekey=md5($sql);

if($redis->exists($cachekey)) {
   header("X-Redis-Cached: true");
   $result = $redis->get($cachekey);
   $uncompressed = @gzuncompress($result);
   if ($uncompressed !== false) {
      echo $uncompressed;
   } else {
      echo $result;
   }
   exit;
}

# Connect to PostgreSQL database
$conn = pg_pconnect("dbname='grb' user='grb-data' password='snowball11..' host='localhost'");
if (!$conn) {
    echo json_encode(pg_last_error());
    //echo "Not connected : " . pg_error();
    exit;
}

# Try query or error
$rs = pg_query($conn, $sql);
if (!$rs) {
    echo json_encode(pg_last_error());
    // echo json_encode($sql); exit;
    exit;
}

# Build GeoJSON
$output    = '';
$rowOutput = '';

$rec_count = pg_num_rows ( $rs );

while ($row = pg_fetch_assoc($rs)) {
    $rowOutput = (strlen($rowOutput) > 0 ? ',' : '') . '{"type": "Feature", "geometry": ' . $row['geojson'] . ', "properties": {';
    $props = '';
    $id    = '';
	//print_r($row);exit;
    foreach ($row as $key => $val) {
        if ($key !== 'geojson') {
            if (strlen($val)>0) {
              $props .= (strlen($props) > 0 ? ',' : '') . '"' . $key . '":"' . escapeJsonString($val) . '"';
            }
        }
        if ($key == 'id') {
            $id .= ',"id":"' . escapeJsonString($val) . '"';
        }
    }
    
    $rowOutput .= $props . '}';
    $rowOutput .= $id;
    $rowOutput .= '}';
    $output .= $rowOutput;
}


$output = '{ "type": "FeatureCollection", "features": [ ' . $output . ' ]}';
if ($rec_count) {
   $compressed = gzcompress($output, 9);
   $redis->set($cachekey, $compressed);
}
echo $output;
?>
