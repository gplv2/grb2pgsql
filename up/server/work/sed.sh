#!/bin/bash
#sed -e 's/LBLTYPE/building/g;s/OIDN/source:geometry:oidn/g;s/UIDN/source:geometry:uidn/g;s/OPNDATUM/source:geometry:date/g;s/hoofdgebouw/house/g;s/bijgebouw/shed/g;s/tag k="TYPE"\sv="[0-9]\+"/tag k="source:geometry:entity" v="Knw"/g' -i "${filename}.osm"

sed -e '
s/tag k=\"building\" v=\"schoorsteen\"/tag k=\"man_made\" v=\"chimney\"/g;s/tag k=\"building\" v=\"overbrugging\"/tag k=\"man_made\" v=\"bridge\"/g;s/tag k=\"building\" v=\"koeltoren\"/tag k=\"man_made\" v=\"tower\"\/><tag k=\"tower:type\" v=\"cooling\"/g;s/tag k=\"building\" v=\"silo, opslagtank\"/tag k=\"man_made\" v=\"storage_tank\"/g;s/tag k=\"building\" v=\"hoogspanningsmast \/ openbare TV mast\"/tag k=\"man_made\" v=\"mast\"\/><tag k=\"power\" v=\"tower\"/g;s/tag k=\"building\" v=\"watertoren\"/tag k=\"man_made\" v=\"watertower\"/g;s/tag k=\"building\" v=\"havendam\"/tag k=\"man_made\" v=\"breakwater\"/g;s/tag k=\"building\" v=\"golfbreker, strandhoofd en lage havendam\"/tag k=\"man_made\" v=\"groyne\"/g;s/tag k=\"building\" v=\"staketsel\"/tag k=\"man_made\" v=\"pier\"/g' knwmerged.osm 

    #<tag k="building" v="golfbreker, strandhoofd en lage havendam"/>
    #<tag k="building" v="havendam"/>
    #<tag k="building" v="hoogspanningsmast / openbare TV mast"/>
    #<tag k="building" v="koeltoren"/>
    ##<tag k="building" v="overbrugging"/>
    #<tag k="building" v="schoorsteen"/>
    #<tag k="building" v="silo, opslagtank"/>
    #<tag k="building" v="staketsel"/>
    #<tag k="building" v="watertoren"/>

#delete:
#
    #<tag k="building" v="waterbouwkundig constructie"/>
    #<tag k="building" v="cultuur-historisch monument"/>
    #<tag k="building" v="pijler"/>
    #<tag k="building" v="rooster"/>
    #<tag k="building" v="tunnelmond"/>
    #<tag k="building" v="cabine"/>
    #<tag k="building" v="chemische installatie"/>

