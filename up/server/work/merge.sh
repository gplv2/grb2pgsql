osmosis --rx Gbg04000.osm
--rx Gbg10000.osm
--rx Gbg20001.osm
--rx Gbg30000.osm
--rx Gbg40000.osm
--rx Gbg70000.osm
--rx Gba04000.osm
--rx Gba10000.osm
--rx Gba20001.osm
--rx Gba30000.osm
--rx Gba40000.osm
--rx Gba70000.osm
--merge
--merge
--merge
--merge
--merge
--merge
--merge
--merge
--merge
--merge
--merge
--wx merged.osm


osmosis --rx Gbg04000.osm --rx Gbg10000.osm --rx Gbg20001.osm --rx Gbg30000.osm --rx Gba40000.osm --rx Gba70000.osm --rx Gba04000.osm --rx Gba10000.osm --rx ^C-merge --merge --merge --merge --merge --wx merged.osm

