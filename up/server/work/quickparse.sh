#!/bin/bash
echo "Reset counter $file"
echo "15715818" > ogr2osm.id

#for file in GRBgis_20001/Shapefile/Gbg*.shp
#for file in GRBgis_20001/Shapefile/Gba20001.shp GRBgis_10000/Shapefile/Gba10000.shp
#for file in GRBgis_30000/Shapefile/Gba30000.shp
for file in GRBgis_30000/Shapefile/Gbg30000.shp

do
 echo "Processing $file"
 dirname=$(dirname "$file")
 filename=$(basename "$file")
 extension="${filename##*.}"
 filename="${filename%.*}"

 echo $dirname
 echo "Cleanup parsed"
 echo "=============="
 rm -Rf "${filename}_parsed"
 echo "OGR FILE INFO"
 echo "============="
 /usr/local/bin/ogrinfo -al -so ${dirname}/${filename}.shp
 echo ""

 echo "OGR2OGR"
 echo "======="
 echo /usr/local/bin/ogr2ogr -s_srs "EPSG:31370" -t_srs "EPSG:4326" "${filename}_parsed" ${dirname}/${filename}.shp -overwrite
 /usr/local/bin/ogr2ogr -s_srs "EPSG:31370" -t_srs "EPSG:4326" "${filename}_parsed" ${dirname}/${filename}.shp -overwrite

 echo ""
 echo "OGR2OSM"
 echo "======="
 rm -f "${filename}.osm"
 echo /usr/local/bin/ogr2osm/ogr2osm.py --idfile=ogr2osm.id --positive-id --saveid=ogr2osm.id "${filename}_parsed/${filename}.shp"
 /usr/local/bin/ogr2osm/ogr2osm.py --idfile=ogr2osm.id --positive-id --saveid=ogr2osm.id "${filename}_parsed/${filename}.shp"
 echo ""

# GBG
#sed -e 's/LBLTYPE/building/g;s/OIDN/source:geometry:oidn/g;s/UIDN/source:geometry:uidn/g;s/OPNDATUM/source:geometry:date/g;s/hoofdgebouw/house/g;s/bijgebouw/shed/g;s/tag k=\"TYPE\"\sv=\"[0-9]\+\"/tag k="source:geometry:entity" v="Gbg"/g' -i "${filename}.osm"
#sed -e 's/ visible="true"/ version="1" timestamp="1970-01-01T00:00:01Z" changeset="1" visible="true"/g' -i "${filename}.osm"

# GBA
sed -e 's/LBLTYPE/building/g;s/OIDN/source:geometry:oidn/g;s/UIDN/source:geometry:uidn/g;s/OPNDATUM/source:geometry:date/g;s/\"afdak\"/\"roof\"/g;s/\"ingezonken garagetoegang\"/\"garage3\"/g;s/\"verheven garagetoegang\"/\"garage4\"/g;s/tag k=\"TYPE\"\sv=\"[0-9]\+\"/tag k="source:geometry:entity" v="Gba"/g' -i "${filename}.osm"
sed -e 's/ visible="true"/ version="1" timestamp="1970-01-01T00:00:01Z" changeset="1" visible="true"/g' -i "${filename}.osm"

# echo "GRB2OSM"
# echo "======="
# # addressing vectors
# startname=${filename:0:3}
# restname=${filename:3}
# echo /usr/local/bin/grb2osm/grb2osm.php -f "${dirname}/Tbl${startname}Adr${restname}.dbf" -i "${filename}.osm" -o "${filename}_addressed.osm"
# /usr/local/bin/grb2osm/grb2osm.php -f "${dirname}/Tbl${startname}Adr${restname}.dbf" -i "${filename}.osm" -o "${filename}_addressed.osm"
#exit;

 # echo -n $file
 # do something on $f
done

exit;

for file in GRBgis_30000/Shapefile/Gbg30000.shp

do
 echo "Processing $file"
 dirname=$(dirname "$file")
 filename=$(basename "$file")
 extension="${filename##*.}"
 filename="${filename%.*}"

 echo $dirname
 echo "Cleanup parsed"
 echo "=============="
##TEMP rm -Rf "*_parsed"
 echo "OGR FILE INFO"
 echo "============="
 /usr/local/bin/ogrinfo -al -so ${dirname}/${filename}.shp
 echo ""

 echo "OGR2OGR"
 echo "======="
 echo /usr/local/bin/ogr2ogr -s_srs "EPSG:31370" -t_srs "EPSG:4326" "${filename}_parsed" ${dirname}/${filename}.shp -overwrite
 /usr/local/bin/ogr2ogr -s_srs "EPSG:31370" -t_srs "EPSG:4326" "${filename}_parsed" ${dirname}/${filename}.shp -overwrite

 echo ""
 echo "OGR2OSM"
 echo "======="
##TEMP rm -f "${filename}.osm"
 echo /usr/local/bin/ogr2osm/ogr2osm.py --idfile=ogr2osm.id --positive-id --saveid=ogr2osm.id "${filename}_parsed/${filename}.shp"
 /usr/local/bin/ogr2osm/ogr2osm.py --idfile=ogr2osm.id --positive-id --saveid=ogr2osm.id "${filename}_parsed/${filename}.shp"
 echo ""

# GBG
sed -e 's/LBLTYPE/building/g;s/OIDN/source:geometry:oidn/g;s/UIDN/source:geometry:uidn/g;s/OPNDATUM/source:geometry:date/g;s/hoofdgebouw/house/g;s/bijgebouw/shed/g;s/tag k=\"TYPE\"\sv=\"[0-9]\+\"/tag k="source:geometry:entity" v="Gbg"/g' -i "${filename}.osm"
sed -e 's/ visible="true"/ version="1" timestamp="1970-01-01T00:00:01Z" changeset="1" visible="true"/g' -i "${filename}.osm"

# GBA
#sed -e 's/LBLTYPE/building/g;s/OIDN/source:geometry:oidn/g;s/UIDN/source:geometry:uidn/g;s/OPNDATUM/source:geometry:date/g;s/\"afdak\"/\"roof\"/g;s/\"ingezonken garagetoegang\"/\"garage3\"/g;s/\"verheven garagetoegang\"/\"garage4\"/g;s/tag k=\"TYPE\"\sv=\"[0-9]\+\"/tag k="source:geometry:entity" v="Gba"/g' -i "${filename}.osm"
#sed -e 's/ visible="true"/ version="1" timestamp="1970-01-01T00:00:01Z" changeset="1" visible="true"/g' -i "${filename}.osm"

# echo "GRB2OSM"
# echo "======="
# # addressing vectors
# startname=${filename:0:3}
# restname=${filename:3}
# echo /usr/local/bin/grb2osm/grb2osm.php -f "${dirname}/Tbl${startname}Adr${restname}.dbf" -i "${filename}.osm" -o "${filename}_addressed.osm"
# /usr/local/bin/grb2osm/grb2osm.php -f "${dirname}/Tbl${startname}Adr${restname}.dbf" -i "${filename}.osm" -o "${filename}_addressed.osm"
#exit;

 # echo -n $file
 # do something on $f
done

exit;

echo "OSMOSIS MERGE"
echo "============="
##TEMPrm -f merged.osm
osmosis --rx Gbg10000.osm --rx Gbg20001.osm --rx Gba10000.osm --rx Gba20001.osm --merge --merge --merge --wx merged.osm

#  postgresql work

CREATE INDEX planet_osm_source_index_p ON planet_osm_polygon USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");
CREATE INDEX planet_osm_source_index_o ON planet_osm_point USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");
CREATE INDEX planet_osm_source_index_n ON planet_osm_nodes USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");
CREATE INDEX planet_osm_source_index_l ON planet_osm_line USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");
CREATE INDEX planet_osm_source_index_r ON planet_osm_rels USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");
CREATE INDEX planet_osm_source_index_w ON planet_osm_ways USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");

 echo ""
 echo "IMPORT"
 echo "======"
/usr/bin/osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data merged.osm

# echo /usr/bin/osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data "${filename}_addressed.osm"
# /usr/bin/osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data "${filename}_addressed.osm"

 echo ""
 echo "Flush cache"
 echo "==========="
 # flush redish cache
echo "flushall" | redis-cli 
 

exit;

echo "OSMOSIS MERGE"
echo "============="
##TEMPrm -f merged.osm
osmosis --rx Gbg10000.osm --rx Gbg20001.osm --rx Gba10000.osm --rx Gba20001.osm --merge --merge --merge --wx merged.osm

#  postgresql work

CREATE INDEX planet_osm_source_index_p ON planet_osm_polygon USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");
CREATE INDEX planet_osm_source_index_o ON planet_osm_point USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");
CREATE INDEX planet_osm_source_index_n ON planet_osm_nodes USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");
CREATE INDEX planet_osm_source_index_l ON planet_osm_line USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");
CREATE INDEX planet_osm_source_index_r ON planet_osm_rels USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");
CREATE INDEX planet_osm_source_index_w ON planet_osm_ways USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");

 echo ""
 echo "IMPORT"
 echo "======"
/usr/bin/osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data merged.osm

# echo /usr/bin/osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data "${filename}_addressed.osm"
# /usr/bin/osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data "${filename}_addressed.osm"

 echo ""
 echo "Flush cache"
 echo "==========="
 # flush redish cache
echo "flushall" | redis-cli 
 
