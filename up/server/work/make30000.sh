#!/bin/bash
echo "Reset counter $file"
#echo "15715818" > ogr2osm.id

# fuse-zip -o ro ../php/files/GRBgis_40000.zip GRBgis_40000
# fusermount -u GRBgis_40000

#fuse-zip -o ro ../php/files/GRBgis_10000.zip GRBgis_10000
#fuse-zip -o ro ../php/files/GRBgis_20001.zip GRBgis_20001
#fuse-zip -o ro ../php/files/GRBgis_30000.zip GRBgis_30000
#fuse-zip -o ro ../php/files/GRBgis_40000.zip GRBgis_40000
#fuse-zip -o ro ../php/files/GRBgis_70000.zip GRBgis_70000
#fuse-zip -o ro ../php/files/GRBgis_04000.zip GRBgis_04000

#for file in GRBgis_*/Shapefile/Gba*.shp
#for file in GRBgis_40000/Shapefile/Gbg*.shp GRBgis_04000/Shapefile/Gbg*.shp GRBgis_70000/Shapefile/Gbg*.shp GRBgis_40000/Shapefile/Gba*.shp GRBgis_04000/Shapefile/Gba*.shp GRBgis_70000/Shapefile/Gba*.shp
#for file in GRBgis_40000/Shapefile/Knw*.shp GRBgis_04000/Shapefile/Knw*.shp GRBgis_70000/Shapefile/Knw*.shp GRBgis_40000/Shapefile/Gba*.shp GRBgis_04000/Shapefile/Gba*.shp GRBgis_70000/Shapefile/Gba*.shp
for file in GRBgis_*/Shapefile/Knw*.shp
# /var/www/geo/up/server/work/GRBgis_40000 /var/www/geo/up/server/work/GRBgis_04000 /var/www/geo/up/server/work/GRBgis_70000

do
 echo "Processing $file"
 dirname=$(dirname "$file")
 filename=$(basename "$file")
 extension="${filename##*.}"
 filename="${filename%.*}"
 entity=${filename:0:3} # Gba/Gbg

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

 echo "\n"
 echo "OGR2OSM"
 echo "======="
 rm -f "${filename}.osm"
 echo /usr/local/bin/ogr2osm/ogr2osm.py --idfile=ogr2osm.id --positive-id --saveid=ogr2osm.id "${filename}_parsed/${filename}.shp"
 /usr/local/bin/ogr2osm/ogr2osm.py --idfile=ogr2osm.id --positive-id --saveid=ogr2osm.id "${filename}_parsed/${filename}.shp"
 echo ""

# GBG
 if [ $entity == 'Gbg' ] 
    then
    echo "running gbg sed\n"
 	sed -e 's/LBLTYPE/building/g;s/OIDN/source:geometry:oidn/g;s/UIDN/source:geometry:uidn/g;s/OPNDATUM/source:geometry:date/g;s/hoofdgebouw/house/g;s/bijgebouw/shed/g;s/tag k=\"TYPE\"\sv=\"[0-9]\+\"/tag k="source:geometry:entity" v="Gbg"/g' -i "${filename}.osm"
 	sed -e 's/ visible="true"/ version="1" timestamp="1970-01-01T00:00:01Z" changeset="1" visible="true"/g' -i "${filename}.osm"
 fi

# GBG
 if [ $entity == 'Knw' ] 
    then
    echo "running gbg sed\n"
 	sed -e 's/LBLTYPE/building/g;s/OIDN/source:geometry:oidn/g;s/UIDN/source:geometry:uidn/g;s/OPNDATUM/source:geometry:date/g;s/hoofdgebouw/house/g;s/bijgebouw/shed/g;s/tag k=\"TYPE\"\sv=\"[0-9]\+\"/tag k="source:geometry:entity" v="Knw"/g' -i "${filename}.osm"
 	sed -e 's/ visible="true"/ version="1" timestamp="1970-01-01T00:00:01Z" changeset="1" visible="true"/g' -i "${filename}.osm"
 fi

# GBA
 if [ $entity == 'Gba' ] 
    then
    echo "running gba sed\n"
 	sed -e 's/LBLTYPE/building/g;s/OIDN/source:geometry:oidn/g;s/UIDN/source:geometry:uidn/g;s/OPNDATUM/source:geometry:date/g;s/\"afdak\"/\"roof\"/g;s/\"ingezonken garagetoegang\"/\"garage3\"/g;s/\"verheven garagetoegang\"/\"garage4\"/g;s/tag k=\"TYPE\"\sv=\"[0-9]\+\"/tag k="source:geometry:entity" v="Gba"/g' -i "${filename}.osm"
 	sed -e 's/ visible="true"/ version="1" timestamp="1970-01-01T00:00:01Z" changeset="1" visible="true"/g' -i "${filename}.osm"
 fi

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

exit

echo "OSMOSIS MERGE"
echo "============="
##TEMPrm -f merged.osm
#osmosis --rx Gbg10000.osm --rx Gbg20001.osm --rx Gbg30000.osm --rx Gba10000.osm --rx Gba20001.osm --rx Gba30000.osm --merge --merge --merge --merge --merge --wx merged.osm
#osmosis --rx Gbg10000.osm --rx Gbg20001.osm --rx Gba10000.osm --rx Gba20001.osm --merge --merge --merge --wx merged.osm

#osmosis --rx Gbg04000.osm --rx Gbg10000.osm --rx Gbg20001.osm --rx Gbg30000.osm --rx Gbg40000.osm --rx Gbg70000.osm --rx Gba04000.osm --rx Gba10000.osm --rx Gba20001.osm --rx Gba30000.osm --rx Gba40000.osm --rx Gba70000.osm --merge --merge --merge --merge --merge --merge --merge --merge --merge --merge --merge --wx merged.osm

#  postgresql work

 echo ""
 echo "IMPORT"
 echo "======"
#/usr/bin/osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data merged.osm

# echo /usr/bin/osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data "${filename}_addressed.osm"
# /usr/bin/osm2pgsql --slim --create --cache 1000 --number-processes 2 --hstore --style /usr/local/src/osm/openstreetmap-carto/openstreetmap-carto.style --multi-geometry -d grb -U grb-data "${filename}_addressed.osm"

echo 'CREATE INDEX planet_osm_source_index_p ON planet_osm_polygon USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");' | psql -U grb-data grb
echo 'CREATE INDEX planet_osm_source_ent_p ON planet_osm_polygon USING btree ("source:geometry:entity" COLLATE pg_catalog."default");' | psql -U grb-data grb
#echo 'CREATE INDEX planet_osm_source_index_o ON planet_osm_point USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");' | psql -U grb-data grb
#echo 'CREATE INDEX planet_osm_source_index_n ON planet_osm_nodes USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");' | psql -U grb-data grb
#echo 'CREATE INDEX planet_osm_source_index_l ON planet_osm_line USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");' | psql -U grb-data grb
#echo 'CREATE INDEX planet_osm_source_index_r ON planet_osm_rels USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");' | psql -U grb-data grb
#echo 'CREATE INDEX planet_osm_source_index_w ON planet_osm_ways USING btree ("source:geometry:oidn" COLLATE pg_catalog."default");' | psql -U grb-data grb

echo "UPDATE planet_osm_polygon SET "source" = 'GRB';" | psql -U grb-data grb
echo 'CREATE INDEX planet_osm_src_index_p ON planet_osm_polygon USING btree ("source" COLLATE pg_catalog."default");' | psql -U grb-data grb
echo "UPDATE planet_osm_polygon set highway='steps', building='' where building='trap';" | psql -U grb-data grb

exit;

# to change:

    <tag k="building" v="cabine"/>
    <tag k="building" v="chemische installatie"/>
    <tag k="building" v="cultuur-historisch monument"/>
    <tag k="building" v="golfbreker, strandhoofd en lage havendam"/>
    <tag k="building" v="havendam"/>
    <tag k="building" v="hoogspanningsmast / openbare TV mast"/>
    <tag k="building" v="koeltoren"/>
    <tag k="building" v="overbrugging"/>
    <tag k="building" v="pijler"/>
    <tag k="building" v="rooster"/>
    <tag k="building" v="schoorsteen"/>
    <tag k="building" v="silo, opslagtank"/>
    <tag k="building" v="staketsel"/>
    <tag k="building" v="tunnelmond"/>
    <tag k="building" v="waterbouwkundig constructie"/>
    <tag k="building" v="watertoren"/>


#/usr/local/bin/grb2osm/grb2osm.php -f GRBgis_20001/Shapefile/TblGbgAdr20001.dbf,GRBgis_10000/Shapefile/TblGbgAdr10000.dbf,GRBgis_30000/Shapefile/TblGbgAdr30000.dbf
/usr/local/bin/grb2osm/grb2osm.php -f GRBgis_20001/Shapefile/TblGbgAdr20001.dbf
/usr/local/bin/grb2osm/grb2osm.php -f GRBgis_10000/Shapefile/TblGbgAdr10000.dbf
/usr/local/bin/grb2osm/grb2osm.php -f GRBgis_30000/Shapefile/TblGbgAdr30000.dbf

 echo ""
 echo "Flush cache"
 echo "==========="
 # flush redish cache
echo "flushall" | redis-cli 
 

exit;

