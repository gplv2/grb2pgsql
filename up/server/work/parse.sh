#!/bin/bash
echo "Reset counter $file"
#echo "2" > ogr2osm.id

#for file in GRBgis_10000/Shapefile/Gbg*.shp
for file in G*/Shapefile/Gbg*.shp
#for file in G*/Shapefile/Gbg23096B500.shp

do
 echo "Processing $file"
 dirname=$(dirname "$file")
 filename=$(basename "$file")
 extension="${filename##*.}"
 filename="${filename%.*}"

 echo $dirname
 echo "Cleanup parsed"
 echo "=============="
 rm -Rf "*_parsed"
 echo "OGR FILE INFO"
 echo "============="
 /usr/local/bin/ogrinfo -al -so ${dirname}/${filename}.shp
 echo ""

 echo "OGR2OGR"
 echo "======="
 echo /usr/local/bin/ogr2ogr -s_srs "EPSG:31370" -t_srs "EPSG:4326" "${filename}_parsed" ${dirname}/${filename}.shp -overwrite
 /usr/local/bin/ogr2ogr -s_srs "EPSG:31370" -t_srs "EPSG:4326" "${filename}_parsed" ${dirname}/${filename}.shp -overwrite
 #/usr/local/bin/ogr2ogr -overwrite -t_srs EPSG:3857 -s_srs "ESRI::${dirname}/${filename}.prj" "${filename}_parsed" ${dirname}/${filename}.shp
 #/usr/local/bin/ogr2ogr -overwrite -t_srs EPSG:900931 -s_srs "ESRI::${dirname}/${filename}.prj" "${filename}_parsed" ${dirname}/${filename}.shp
 #/usr/local/bin/ogr2ogr -overwrite -t_srs EPSG:900931 "${filename}_parsed" ${dirname}/${filename}.shp
 #/usr/local/bin/ogr2ogr -s_srs "EPSG:31370" -t_srs "EPSG:4326" Gbg23096B500_parsed GRBgis_23096B500/Shapefile/Gbg23096B500.shp -overwrite
 
 #ogr2osm.py Gbg11024B500_parsed/Gbg11024B500.shp

 echo ""
 echo "OGR2OSM"
 echo "======="
# parser.add_option("--idfile", dest="idfile", type=str, default=None,
#                    help="Read ID to start counting from from a file.")
#
#parser.add_option("--saveid", dest="saveid", type=str, default=None,
#                    help="Save last ID after execution to a file.")
#
# Positive IDs can cause big problems if used inappropriately so hide the help for this
#parser.add_option("--positive-id", dest="positiveID", action="store_true",
#                    help=optparse.SUPPRESS_HELP)

 rm -f "${filename}.osm"
 echo /usr/local/bin/ogr2osm/ogr2osm.py --idfile=ogr2osm.id --positive-id --saveid=ogr2osm.id "${filename}_parsed/${filename}.shp"
 /usr/local/bin/ogr2osm/ogr2osm.py --idfile=ogr2osm.id --positive-id --saveid=ogr2osm.id "${filename}_parsed/${filename}.shp"
 echo ""

# sed -e 's/LBLTYPE/building/g;s/OIDN/source:geometry:oidn/g;s/OPNDATUM/source:geometry:date/g;s/hoofdgebouw/house/g;s/bijgebouw/shed/g' -i "${filename}.osm"

 echo "GRB2OSM"
 echo "======="
 # addressing vectors
 startname=${filename:0:3}
 restname=${filename:3}
 echo /usr/local/bin/grb2osm/grb2osm.php -f "${dirname}/Tbl${startname}Adr${restname}.dbf" -i "${filename}.osm" -o "${filename}_addressed.osm"
 /usr/local/bin/grb2osm/grb2osm.php -f "${dirname}/Tbl${startname}Adr${restname}.dbf" -i "${filename}.osm" -o "${filename}_addressed.osm"

#exit;

 # echo -n $file
 # do something on $f
done

echo "OSMOSIS MERGE"
echo "============="
rm -f merged.osm
osmosis --rx Gbg10000.osm --rx Gbg11024B500_addressed.osm --rx Gbg12025B500_addressed.osm --rx Gbg23096B500_addressed.osm --rx Gbg46024B500_addressed.osm --rx Gbg23077B500_addressed.osm --merge --merge --merge --merge --merge --wx merged.osm

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
 
