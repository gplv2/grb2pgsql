#!/bin/bash
for file in G*/Shapefile/Gbg*.shp

do
 echo "Processing $file"
 dirname=$(dirname "$file")
 filename=$(basename "$file")
 extension="${filename##*.}"
 filename="${filename%.*}"

#echo $dirname
 rm -Rf "*_parsed"

 #echo ogr2ogr -t_srs EPSG:900913 -s_srs "ESRI::${filename}/Gbg23096B500.prj" "${filename}_parsed" $file
 echo ogr2ogr -t_srs EPSG:3857 -s_srs "ESRI::${dirname}/${filename}.prj" "${filename}_parsed" ${dirname}/${filename}.shp
 ogr2ogr -overwrite -t_srs EPSG:3857 -s_srs "ESRI::${dirname}/${filename}.prj" "${filename}_parsed" ${dirname}/${filename}.shp
 
 #ogr2osm.py Gbg11024B500_parsed/Gbg11024B500.shp
 rm -f "${filename}.osm"
 ogr2osm.py "${filename}_parsed/${filename}.shp"

 # addressing vectors
 startname=${filename:0:3}
 restname=${filename:3}
 echo /usr/local/bin/grb2osm/grb2osm.php -f "${dirname}/Tbl${startname}Adr${restname}.dbf" -i "${filename}.osm" -o "${filename}_addressed.osm"
 /usr/local/bin/grb2osm/grb2osm.php -f "${dirname}/Tbl${startname}Adr${restname}.dbf" -i "${filename}.osm" -o "${filename}_addressed.osm"

 #echo -n $file
 # do something on $f
done

