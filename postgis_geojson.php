<?php
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
 * @param      string      $fields     Fields to be returned *OPTIONAL (If omitted, all fields will be returned)* NOTE- Uppercase field names should be wrapped in double quotes
 * @param      string      $parameters SQL WHERE clause parameters *OPTIONAL*
 * @param      string      $orderby    SQL ORDER BY constraint *OPTIONAL*
 * @param      string      $sort       SQL ORDER BY sort order (ASC or DESC) *OPTIONAL*
 * @param      string      $limit      Limit number of results returned *OPTIONAL*
 * @param      string      $offset     Offset used in conjunction with limit *OPTIONAL*
 * @return     string                  geojson string
 */
ini_set('zlib.output_compression', 1);

//@mb_internal_encoding('UTF-8');
//setlocale(LC_ALL, 'en_US.UTF-8');

$redis = new Redis();
$redis->connect('127.0.0.1'); // port 6379 by default

// $redis->setOption(Redis::OPT_SERIALIZER, Redis::SERIALIZER_PHP);  // use built-in serialize/unserialize
$redis->setOption(Redis::OPT_PREFIX, 'grb:');   // use custom prefix on all keys

$cachekey=md5(json_encode($_REQUEST)); // easy serialize of REQUEST params

if (count($_REQUEST)) {
   if($redis->exists($cachekey)) {
      header("X-Redis-Cached: true");
      $result = $redis->get($cachekey);
      $uncompressed = @gzuncompress($result);
      if ($uncompressed !== false) {
         echo $uncompressed;
         exit;
      } else {
         echo $result;
         exit;
      }
   }
}

function escapeJsonString($value) { # list from www.json.org: (\b backspace, \f formfeed)
  $escapers = array("\\", "/", "\"", "\n", "\r", "\t", "\x08", "\x0c");
  $replacements = array("\\\\", "\\/", "\\\"", "\\n", "\\r", "\\t", "\\f", "\\b");
  $result = str_replace($escapers, $replacements, $value);
  return $result;
}

$geotable = 'planet_osm_polygon';
$geomfield = 'way';

if (empty($_REQUEST['srid'])) {
    $srid = '900913';
    //$srid = '3857';
    //$srid = '4326';
} else {
    $srid = $_REQUEST['srid'];
}

if (empty($_REQUEST['fields'])) {
    $fields = '*';
} else {
    $fields = $_REQUEST['fields'];
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

# Connect to PostgreSQL database
$conn = pg_connect("dbname='grb' user='grb-data' password='snowball11..' host='localhost'");
if (!$conn) {
    echo "Not connected : " . pg_error();
    exit;
}

if (!empty($_REQUEST['bbox'])) {
   $bbox = $_REQUEST['bbox'];
   list($bbox_west, $bbox_south, $bbox_east, $bbox_north) = split(",", $bbox);
}

# Build SQL SELECT statement and return the geometry as a GeoJSON element in EPSG: 4326
$sql  = "SELECT " . pg_escape_string($fields) . ", st_asgeojson(ST_Transform(" . pg_escape_string($geomfield) . ",$srid)) AS geojson FROM " . pg_escape_string($geotable);
$sql .= sprintf(" WHERE \"way\" && ST_SetSRID('BOX3D(%s %s, %s %s)'::box3d, %s)", $bbox_west, $bbox_south, $bbox_east, $bbox_north, $srid);

//if (strlen(trim($parameters)) == 0) {
//$sql .= " WHERE " . pg_escape_string($parameters); }

if (!empty($orderby)){
    $sql .= " ORDER BY " . pg_escape_string($orderby) . " " . $sort;
}
if (!empty($limit)){
    $sql .= " LIMIT " . pg_escape_string($limit);
}
if (!empty($offset)){
    $sql .= " OFFSET " . pg_escape_string($offset);
}

# Try query or error
$rs = pg_query($conn, $sql);
if (!$rs) {
    echo "An SQL error occured.\n";
    exit;
}

# Build GeoJSON
$output    = '';
$rowOutput = '';

while ($row = pg_fetch_assoc($rs)) {
    $rowOutput = (strlen($rowOutput) > 0 ? ',' : '') . '{"type": "Feature", "geometry": ' . $row['geojson'] . ', "properties": {';
    $props = '';
    $id    = '';
    foreach ($row as $key => $val) {
        if ($key != "geojson") {
            $props .= (strlen($props) > 0 ? ',' : '') . '"' . $key . '":"' . escapeJsonString($val) . '"';
        }
        if ($key == "id") {
            $id .= ',"id":"' . escapeJsonString($val) . '"';
        }
    }
    
    $rowOutput .= $props . '}';
    $rowOutput .= $id;
    $rowOutput .= '}';
    $output .= $rowOutput;
}

$length=strlen($output);

$output = '{ "type": "FeatureCollection", "features": [ ' . $output . ' ]}';
$compressed = gzcompress($output, 9);

if ($length) {
   $redis->set($cachekey, $compressed);
}
echo $output;
?>
