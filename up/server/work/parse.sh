#!/bin/bash
#for file in G*/Shapefile/Gbg*.shp
for file in G*/Shapefile/Gbg23096B500.shp

do
 echo "Processing $file"
 dirname=$(dirname "$file")
 filename=$(basename "$file")
 extension="${filename##*.}"
 filename="${filename%.*}"

#echo $dirname
 rm -Rf "*_parsed"
 echo "OGR FILE INFO"
 echo "============="
 /usr/local/bin/ogrinfo -al -so ${dirname}/${filename}.shp
 echo -n ""

 echo "OGR2OGR"
 echo "======="
 echo /usr/local/bin/ogr2ogr -s_srs "EPSG:31370" -t_srs "EPSG:4326" "${filename}_parsed" ${dirname}/${filename}.shp -overwrite
 #/usr/local/bin/ogr2ogr -overwrite -t_srs EPSG:3857 -s_srs "ESRI::${dirname}/${filename}.prj" "${filename}_parsed" ${dirname}/${filename}.shp
 #/usr/local/bin/ogr2ogr -overwrite -t_srs EPSG:900931 -s_srs "ESRI::${dirname}/${filename}.prj" "${filename}_parsed" ${dirname}/${filename}.shp
 #/usr/local/bin/ogr2ogr -overwrite -t_srs EPSG:900931 "${filename}_parsed" ${dirname}/${filename}.shp
 #/usr/local/bin/ogr2ogr -s_srs "EPSG:31370" -t_srs "EPSG:4326" Gbg23096B500_parsed GRBgis_23096B500/Shapefile/Gbg23096B500.shp -overwrite
 
 #ogr2osm.py Gbg11024B500_parsed/Gbg11024B500.shp

 echo -n ""
 echo "OGR2OSM"
 echo "======="
 rm -f "${filename}.osm"
 echo ogr2osm.py "${filename}_parsed/${filename}.shp"
 ogr2osm.py "${filename}_parsed/${filename}.shp"
 echo -n ""

 echo "GRB2OSM"
 echo "======="
 # addressing vectors
 startname=${filename:0:3}
 restname=${filename:3}
 echo /usr/local/bin/grb2osm/grb2osm.php -f "${dirname}/Tbl${startname}Adr${restname}.dbf" -i "${filename}.osm" -o "${filename}_addressed.osm"
 /usr/local/bin/grb2osm/grb2osm.php -f "${dirname}/Tbl${startname}Adr${restname}.dbf" -i "${filename}.osm" -o "${filename}_addressed.osm"

 # echo -n $file
 # do something on $f
 echo -n ""
 echo "IMPORT"
 echo "======"
 echo osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data "${filename}_addressed.osm"
 osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data "${filename}_addressed.osm"

 echo -n ""
 echo "Flush cache"
 echo "==========="
 # flush redish cache
 echo "flushall" | redis-cli 
exit;
done
 
