#!/bin/bash

# $search  = array('LBLTYPE', 'OIDN', 'OPNDATUM', 'hoofdgebouw','bijgebouw','afdak','ingezonken garagetoegang','verheven garagetoegang');
# $replace = array('building', 'source:geometry:oidn', 'source:geometry:date','house','shed','roof','garage1','garage2');

# sed -e 's/Find/Replace/g;s/Find/Replace/g;[....];/Find/Replace/g'

-e 's/LBLTYPE/building/g;s/OIDN/source:geometry:oidn/g;s/OPNDATUM/source:geometry:date/g;s/hoofdgebouw/house/g;s/bijgebouw/shed/g'


-e 's/ visible="true"/ version="1" timestamp="1970-01-01T00:00:01Z" changeset="1" visible="true"/g'
