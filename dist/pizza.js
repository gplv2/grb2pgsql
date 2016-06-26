(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.geos = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
/**
* geoJSON validation according to the GeoJSON spefication Version 1
* @module geoJSONValidation
* @class Main
* @exports {GJV} 
*/

(function(exports){

    var definitions = {};

    /**
     * Test an object to see if it is a function
     * @method isFunction 
     * @param object {Object}
     * @return {Boolean}
     */
    function isFunction(object) {
        return typeof(object) == 'function';
    }
    
    /**
     * A truthy test for objects
     * @method isObject
     * @param {Object}
     * @return {Boolean}
     */
    function isObject(object) {
        return object === Object(object);
    }

    /**
     * Formats error messages, calls the callback
     * @method done
     * @private
     * @param cb {Function} callback
     * @param [message] {Function} callback
     * @return {Boolean} is the object valid or not?
     */
    function _done(cb, message){
        var valid = false;

        if(typeof message === "string"){
            message = [message];

        }else if( Object.prototype.toString.call( message ) === '[object Array]' ) {
            if(message.length === 0){
                valid = true;
            }
        }else{
            valid = true;
        }

        if( isFunction(cb)){
            if(valid){
                cb(valid, []);
            }else{
                cb(valid, message);
            }
        }

        return valid;
    }

    /**
     * calls a custom definition if one is avalible for the given type
     * @method _customDefinitions 
     * @private
     * @param type {"String"} a GeoJSON object type
     * @param object {Object} the Object being tested 
     * @return {Array} an array of errors
     */
    function _customDefinitions(type, object){

        var errors;

        if(isFunction(definitions[type])){
            try{
                errors = definitions[type](object);
            }catch(e){
                errors = ["Problem with custom definition for '" + type + ": " + e];
            }
            if(typeof result === "string"){
                errors = [errors];
            }
            if(Object.prototype.toString.call( errors ) === '[object Array]'){
                return errors;
            }
        }
        return [];
    }

    /**
     * Define a custom validation function for one of GeoJSON objects
     * @method define 
     * @param type {GeoJSON Type} the type 
     * @param definition {Function} A validation function
     * @return {Boolean} Return true if the function was loaded corectly else false
     */
    exports.define = function(type, definition){
        if((type in all_types) && isFunction(definition)){
            //TODO: check to see if the type is valid
            definitions[type] = definition;
            return true;
        }
        return false;
    };

    /**
     * Determines if an object is a position or not
     * @method isPosition 
     * @param position {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isPosition = function(position, cb){

        var errors = [];

        //It must be an array
        if(Array.isArray(position)){
            //and the array must have more than one element
            if(position.length <= 1){
                errors.push("Position must be at least two elements");
            }
        }else{
            errors.push("Position must be an array");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("Position", position));

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a GeoJSON Object or not
     * @method isGeoJSONObject|valid
     * @param geoJSONObject {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isGeoJSONObject = exports.valid = function(geoJSONObject, cb){

        if(!isObject(geoJSONObject)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];
        if('type' in geoJSONObject){
            if(non_geo_types[geoJSONObject.type]){
                return non_geo_types[geoJSONObject.type](geoJSONObject, cb);
            }else if(geo_types[geoJSONObject.type]){
                return geo_types[geoJSONObject.type](geoJSONObject, cb);
            }else{
                errors.push('type must be one of: "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection", "Feature", or "FeatureCollection"');
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("GeoJSONObject", geoJSONObject));
        return _done(cb, errors);
    };

    /**
     * Determines if an object is a Geometry Object or not
     * @method isGeometryObject
     * @param geometryObject {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isGeometryObject = function(geometryObject, cb){

        if(!isObject(geometryObject)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('type' in geometryObject){
            if(geo_types[geometryObject.type]){
                return geo_types[geometryObject.type](geometryObject, cb);
            }else{
                errors.push('type must be one of: "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon" or "GeometryCollection"');
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("GeometryObject", geometryObject));
        return _done(cb, errors);
    };

    /**
     * Determines if an object is a Point or not
     * @method isPoint
     * @param point {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isPoint = function(point, cb) {

        if(!isObject(point)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in point){
            exports.isBbox(point.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in point){
            if(point.type !== "Point"){
                errors.push("type must be 'Point'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in point){
            exports.isPosition(point.coordinates, function(valid, err){
                if(!valid){
                    errors.push('Coordinates must be a single position');
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("Point", point));

        return _done(cb, errors);
    };

    /**
     * Determines if an array can be interperted as coordinates for a MultiPoint
     * @method isMultiPointCoor
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiPointCoor = function(coordinates, cb) {

        var errors = [];

        if(Array.isArray(coordinates)){
            coordinates.forEach(function(val, index){
                exports.isPosition(val, function(valid, err){
                    if(!valid){
                        //modify the err msg from "isPosition" to note the element number
                        err[0] = "at "+ index+ ": ".concat(err[0]);
                        //build a list of invalide positions
                        errors = errors.concat(err);
                    }
                });
            });
        }else{
            errors.push("coordinates must be an array");
        }

        return _done(cb, errors);
    };
    /**
     * Determines if an object is a MultiPoint or not
     * @method isMultiPoint
     * @param position {Object}
     * @param cb {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiPoint = function(multiPoint, cb) {

        if(!isObject(multiPoint)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in multiPoint){
            exports.isBbox(multiPoint.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in multiPoint){
            if(multiPoint.type !== "MultiPoint"){
                errors.push("type must be 'MultiPoint'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in multiPoint){
            exports.isMultiPointCoor(multiPoint.coordinates, function(valid, err){
                if(!valid){
                    errors =  errors.concat(err);
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("MultiPoint", multiPoint));

        return _done(cb, errors);
    };

    /**
     * Determines if an array can be interperted as coordinates for a lineString
     * @method isLineStringCoor
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isLineStringCoor = function(coordinates, cb) {

        var errors = [];
        if(Array.isArray(coordinates)){
            if(coordinates.length > 1){
                coordinates.forEach(function(val, index){
                    exports.isPosition(val, function(valid, err){
                        if(!valid){
                            //modify the err msg from "isPosition" to note the element number
                            err[0] = "at "+ index+ ": ".concat(err[0]);
                            //build a list of invalide positions
                            errors = errors.concat(err);
                        }
                    });
                });
            }else{
                errors.push("coordinates must have at least two elements");
            }
        }else{
            errors.push( "coordinates must be an array");
        }

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a lineString or not
     * @method isLineString
     * @param lineString {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isLineString = function(lineString, cb){

        if(!isObject(lineString)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in lineString){
            exports.isBbox(lineString.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in lineString){
            if(lineString.type !== "LineString"){
                errors.push("type must be 'LineString'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in lineString){
            exports.isLineStringCoor(lineString.coordinates, function(valid, err){
                if(!valid){
                    errors =  errors.concat(err);
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("LineString", lineString));

        return _done(cb, errors);
    };

    /**
     * Determines if an array can be interperted as coordinates for a MultiLineString
     * @method isMultiLineStringCoor
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiLineStringCoor = function(coordinates, cb) {
        var errors = [];
        if(Array.isArray(coordinates)){
            coordinates.forEach(function(val, index){
                exports.isLineStringCoor(val, function(valid, err){
                    if(!valid){
                        //modify the err msg from "isPosition" to note the element number
                        err[0] = "at "+ index+ ": ".concat(err[0]);
                        //build a list of invalide positions
                        errors = errors.concat(err);
                    }
                });
            });
        }else{
            errors.push("coordinates must be an array");
        }
        _done(cb, errors);
    };

    /**
     * Determines if an object is a MultiLine String or not
     * @method isMultiLineString
     * @param multilineString {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiLineString = function(multilineString, cb){

        if(!isObject(multilineString)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in multilineString){
            exports.isBbox(multilineString.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in multilineString){
            if(multilineString.type !== "MultiLineString"){
                errors.push("type must be 'MultiLineString'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in multilineString){
            exports.isMultiLineStringCoor(multilineString.coordinates, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("MultiPoint", multilineString));

        return _done(cb, errors);
    };

    /**
     * Determines if an array is a linear Ring String or not
     * @method isMultiLineString
     * @private
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    function _linearRingCoor(coordinates, cb) {

        var errors = [];
        if(Array.isArray(coordinates)){
            //4 or more positions

            coordinates.forEach(function(val, index){
                exports.isPosition(val, function(valid, err){
                    if(!valid){
                        //modify the err msg from "isPosition" to note the element number
                        err[0] = "at "+ index+ ": ".concat(err[0]);
                        //build a list of invalide positions
                        errors = errors.concat(err);
                    }
                });
            });

            // check the first and last positions to see if they are equivalent
            // TODO: maybe better checking?
            if(coordinates[0].toString() !== coordinates[coordinates.length -1 ].toString()){
                errors.push( "The first and last positions must be equivalent");
            }

            if(coordinates.length < 4){
                errors.push("coordinates must have at least four positions");
            }
        }else{
            errors.push("coordinates must be an array");
        }

        return _done(cb, errors);
    }

    /**
     * Determines if an array is valid Polygon Coordinates or not
     * @method _polygonCoor
     * @private
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isPolygonCoor = function (coordinates, cb){

        var errors = [];
        if(Array.isArray(coordinates)){
            coordinates.forEach(function(val, index){
                _linearRingCoor(val, function(valid, err){
                    if(!valid){
                        //modify the err msg from "isPosition" to note the element number
                        err[0] = "at "+ index+ ": ".concat(err[0]);
                        //build a list of invalid positions
                        errors = errors.concat(err);
                    }
                });
            });
        }else{
            errors.push("coordinates must be an array");
        }

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a valid Polygon
     * @method isPolygon
     * @param polygon {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isPolygon = function(polygon, cb){

        if(!isObject(polygon)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in polygon){
            exports.isBbox(polygon.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in polygon){
            if(polygon.type !== "Polygon"){
                errors.push("type must be 'Polygon'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in polygon){
            exports.isPolygonCoor(polygon.coordinates, function(valid, err) {
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("Polygon", polygon));

        return _done(cb, errors);
    };

    /**
     * Determines if an array can be interperted as coordinates for a MultiPolygon
     * @method isMultiPolygonCoor
     * @param coordinates {Array}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiPolygonCoor = function(coordinates, cb) {
        var errors = [];
        if(Array.isArray(coordinates)){
            coordinates.forEach(function(val, index){
                exports.isPolygonCoor(val, function(valid, err){
                    if(!valid){
                        //modify the err msg from "isPosition" to note the element number
                        err[0] = "at "+ index+ ": ".concat(err[0]);
                        //build a list of invalide positions
                        errors = errors.concat(err);
                    }
                });
            });
        }else{
            errors.push("coordinates must be an array");
        }

        _done(cb, errors);
    };

    /**
     * Determines if an object is a valid MultiPolygon
     * @method isMultiPolygon
     * @param multiPolygon {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isMultiPolygon = function(multiPolygon, cb){

        if(!isObject(multiPolygon)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in multiPolygon){
            exports.isBbox(multiPolygon.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in multiPolygon){
            if(multiPolygon.type !== "MultiPolygon"){
                errors.push("type must be 'MultiPolygon'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('coordinates' in multiPolygon){
            exports.isMultiPolygonCoor(multiPolygon.coordinates, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }else{
            errors.push("must have a member with the name 'coordinates'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("MultiPolygon", multiPolygon));

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a valid Geometry Collection
     * @method isGeometryCollection
     * @param geometryCollection {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isGeometryCollection = function(geometryCollection, cb){

        if(!isObject(geometryCollection)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in geometryCollection){
            exports.isBbox(geometryCollection.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in geometryCollection){
            if(geometryCollection.type !== "GeometryCollection"){
                errors.push("type must be 'GeometryCollection'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('geometries' in geometryCollection){
            if(Array.isArray(geometryCollection.geometries)){
                geometryCollection.geometries.forEach(function(val, index){
                    exports.isGeometryObject(val, function(valid, err){
                        if(!valid){
                            //modify the err msg from "isPosition" to note the element number
                            err[0] = "at "+ index+ ": ".concat(err[0]);
                            //build a list of invalide positions
                            errors = errors.concat(err);
                        }
                    });
                });
            }else{
                errors.push("'geometries' must be an array");
            }
        }else{
            errors.push("must have a member with the name 'geometries'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("GeometryCollection", geometryCollection));

        return _done( cb, errors);
    };

    /**
     * Determines if an object is a valid Feature
     * @method isFeature
     * @param feature {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isFeature = function(feature, cb){

        if(!isObject(feature)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in feature){
            exports.isBbox(feature.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in feature){
            if(feature.type !== "Feature"){
                errors.push("type must be 'feature'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if(!('properties' in feature)){
            errors.push("must have a member with the name 'properties'");
        }

        if('geometry' in feature){
            if(feature.geometry !== null){
                exports.isGeometryObject(feature.geometry, function(valid, err){
                    if(!valid){
                        errors = errors.concat(err);
                    }
                });
            }
        }else{
            errors.push("must have a member with the name 'geometry'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("Feature", feature));

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a valid Feature Collection
     * @method isFeatureCollection
     * @param featureCollection {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isFeatureCollection = function(featureCollection, cb){

        if(!isObject(featureCollection)){
            return _done(cb, ['must be a JSON Object']);
        }

        var errors = [];

        if('bbox' in featureCollection){
            exports.isBbox(featureCollection.bbox, function(valid, err){
                if(!valid){
                    errors = errors.concat(err);
                }
            });
        }

        if('type' in featureCollection){
            if(featureCollection.type !== "FeatureCollection"){
                errors.push("type must be 'FeatureCollection'");
            }
        }else{
            errors.push("must have a member with the name 'type'");
        }

        if('features' in featureCollection){
            if(Array.isArray(featureCollection.features)){
                featureCollection.features.forEach(function(val, index){
                    exports.isFeature(val, function(valid, err){
                        if(!valid){
                            //modify the err msg from "isPosition" to note the element number
                            err[0] = "at "+ index+ ": ".concat(err[0]);
                            //build a list of invalide positions
                            errors = errors.concat(err);
                        }
                    });
                });
            }else{
                errors.push("'features' must be an array");
            }
        }else{
            errors.push("must have a member with the name 'features'");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("FeatureCollection", featureCollection));

        return _done(cb, errors);
    };

    /**
     * Determines if an object is a valid Bounding Box
     * @method isBbox
     * @param bbox {Object}
     * @param [cb] {Function} the callback
     * @return {Boolean}
     */
    exports.isBbox = function(bbox, cb){
        var errors = [];
        if(Array.isArray(bbox)){
            if(bbox.length % 2 !== 0){
                errors.push("bbox, must be a 2*n array");
            }
        }else{
            errors.push("bbox must be an array");
        }

        //run custom checks
        errors = errors.concat(_customDefinitions("Bbox", bbox));

        _done(cb,errors);
    };

    var non_geo_types = {
        "Feature": exports.isFeature,
        "FeatureCollection": exports.isFeatureCollection
    },

    geo_types = {
        "Point": exports.isPoint,
        "MultiPoint": exports.isMultiPoint,
        "LineString": exports.isLineString,
        "MultiLineString": exports.isMultiLineString,
        "Polygon": exports.isPolygon,
        "MultiPolygon": exports.isMultiPolygon,
        "GeometryCollection": exports.isGeometryCollection,
    },

    all_types = {
        "Feature": exports.isFeature,
        "FeatureCollection": exports.isFeatureCollection,
        "Point": exports.isPoint,
        "MultiPoint": exports.isMultiPoint,
        "LineString": exports.isLineString,
        "MultiLineString": exports.isMultiLineString,
        "Polygon": exports.isPolygon,
        "MultiPolygon": exports.isMultiPolygon,
        "GeometryCollection": exports.isGeometryCollection,
        "Bbox": exports.isBox,
        "Position": exports.isPosition,
        "GeoJSON": exports.isGeoJSONObject,
        "GeometryObject": exports.isGeometryObject
    };

    exports.all_types = all_types;

})(typeof exports === 'undefined'? this['GJV']={}: exports);

},{}],3:[function(require,module,exports){
var jxon = require('jxon');
var gjcheck = require('geojson-validation');

function geojsontoosm(geojson) {
   // Accept a full geojson format FeatureCollection , not only an array of features
   // accept geojson as an object

   //console.log(typeof(geojson));
   if (typeof geojson === 'string') geojson = JSON.parse(geojson);
   switch (geojson.type) {
        case 'FeatureCollection':
             parsed_geojson = [];
             // console.log(geojson.features);
             for (var i = 0; i < geojson.features.length; i++) {
                  parsed_geojson.push(geojson.features[i]);
             }
        break;
        default:
             //console.log(geojson);
             parsed_geojson = geojson;
        break;
   }
   // console.log(parsed_geojson);

    var features = parsed_geojson.features || parsed_geojson.length>0 ? parsed_geojson : [parsed_geojson]

    var nodes = [], nodesIndex = {},
        ways = [],
        relations = [];
    var filtered_properties;

    //console.log(features);

    features.forEach(function(feature) { // feature can also be a pure GeoJSON geometry object
        if ( gjcheck.valid(feature) && gjcheck.isFeature(feature) ) {
            //console.log("this is valid GeoJSON!");
            // todo: GeometryCollection?
            var properties = feature.properties || {},
                  geometry = feature.geometry || feature
            // todo: ids if (feature.id && feature.id.match(/^(node|way|relation)\/(\d+)$/)) id = …
            // console.log(properties);
            //console.log(typeof(properties));
            delete properties['osm_id'];
            //console.log(properties);

            switch (geometry.type) {
            case "Point":
                processPoint(geometry.coordinates, properties, nodes, nodesIndex)
            break;
            case "LineString":
                processLineString(geometry.coordinates, properties, ways, nodes, nodesIndex)
            break;
            case "Polygon":
                processMultiPolygon([geometry.coordinates], properties, relations, ways, nodes, nodesIndex)
            break;
            case "Multipolygon":
                processMultiPolygon(geometry.coordinates, properties, relations, ways, nodes, nodesIndex)
            break;
            default:
                console.error("unknown or unsupported geometry type:", geometry.type);
            }
         }
   });

    //console.log(nodes, ways, relations)
    var lastNodeId = -1,
        lastWayId = -1,
        lastRelationId = -1
    function jxonTags(tags) {
        var res = []
        for (var k in tags) {
            res.push({
                "@k": k,
                "@v": tags[k]
            })
        }
        return res
    }
    var jxonData = {
        osm: {
            "@version": "0.6",
            "@generator": "geojsontoosm",
            "node": nodes.map(function(node) {
                node.id = lastNodeId--
                return {
                    "@id": node.id,
                    "@lat": node.lat,
                    "@lon": node.lon,
                    // todo: meta
                    "tag": jxonTags(node.tags)
                }
            }),
            "way": ways.map(function(way) {
                way.id = lastWayId--
                return {
                    "@id": way.id,
                    "nd": way.nodes.map(function(nd) { return {"@ref": nd.id} }),
                    "tag": jxonTags(way.tags)
                }
            }),
            "relation": relations.map(function(relation) {
                relation.id = lastRelationId--
                return {
                    "@id": relation.id,
                    "member": relation.members.map(function(member) {
                        return {
                            "@type": member.type,
                            "@ref": member.elem.id,
                            "@role": member.role
                        }
                    }),
                    "tag": jxonTags(relation.tags)
                    // todo: meta
                }
            })
        } 
    }
    // todo: sort by id
    return jxon.jsToString(jxonData)
}

function getNodeHash(coords) {
    return JSON.stringify(coords)
}
function emptyNode(coordinates, properties) {
    return {
        tags: properties,
        lat: coordinates[1],
        lon: coordinates[0]
    }
    // todo: meta
    // todo: move "nodesIndex[hash] = node" here
}

function processPoint(coordinates, properties, nodes, nodesIndex) {
    var hash = getNodeHash(coordinates),
        node
    if (!(node = nodesIndex[hash])) {
        nodes.push(node = emptyNode(coordinates, properties))
        nodesIndex[hash] = node
    } else {
        for (var k in properties) {
            node.tags[k] = properties[k]
        }
        // todo: meta
    }
}

function processLineString(coordinates, properties, ways, nodes, nodesIndex) {
    var way = {
        tags: properties,
        nodes: []
    }
    ways.push(way)
    // todo: meta
    coordinates.forEach(function(point) {
        var hash = getNodeHash(point),
            node
        if (!(node = nodesIndex[hash])) {
            nodes.push(node = emptyNode(point, {}))
            nodesIndex[hash] = node
        }
        way.nodes.push(node)
    })
}

function processMultiPolygon(coordinates, properties, relations, ways, nodes, nodesIndex) {
    // simple area with only 1 ring: -> closed way
    if (coordinates.length === 1 && coordinates[0].length === 1)
        return processLineString(coordinates[0][0], properties, ways, nodes, nodesIndex)
    // multipolygon
    var relation = {
        tags: properties,
        members: []
    }
    relation.tags["type"] = "multipolygon"
    relations.push(relation)
    // todo: meta
    coordinates.forEach(function(polygon) {
        polygon.forEach(function(ring, index) {
            var way = {
                tags: {},
                nodes: []
            }
            ways.push(way)
            relation.members.push({
                elem: way,
                type: "way",
                role: index===0 ? "outer" : "inner"
            })
            ring.forEach(function(point) {
                var hash = getNodeHash(point),
                    node
                if (!(node = nodesIndex[hash])) {
                    nodes.push(node = emptyNode(point, {}))
                    nodesIndex[hash] = node
                }
                way.nodes.push(node)
            })
        })
    })
}

module.exports = geojsontoosm;

},{"geojson-validation":2,"jxon":4}],4:[function(require,module,exports){
/*
 * JXON framework - Copyleft 2011 by Mozilla Developer Network
 *
 * Revision #1 - September 5, 2014
 *
 * https://developer.mozilla.org/en-US/docs/JXON
 *
 * This framework is released under the GNU Public License, version 3 or later.
 * http://www.gnu.org/licenses/gpl-3.0-standalone.html
 *
 * small modifications performed by the iD project:
 * https://github.com/openstreetmap/iD/commits/18aa33ba97b52cacf454e95c65d154000e052a1f/js/lib/jxon.js
 *
 * small modifications performed by user @bugreport0
 * https://github.com/tyrasd/JXON/pull/2/commits
 *
 * some additions and modifications by user @igord
 * https://github.com/tyrasd/JXON/pull/5/commits
 *
 * adapted for nodejs and npm by Martin Raifer <tyr.asd@gmail.com>
 */

 /*
  * Modifications:
  * - added config method that excepts objects with props:
  *   - valueKey (default: keyValue)
  *   - attrKey (default: keyAttributes)
  *   - attrPrefix (default: @)
  *   - lowerCaseTags (default: true)
  *   - trueIsEmpty (default: true)
  *   - autoDate (default: true)
  * - turning tag and attributes to lower case is optional
  * - optional turning boolean true to empty tag
  * - auto Date parsing is optional
  * - added parseXml method
  *
*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory(window));
    } else if (typeof exports === 'object') {
        if (typeof window === 'object' && window.DOMImplementation) {
            // Browserify. hardcode usage of browser's own XMLDom implementation
            // see https://github.com/tyrasd/jxon/issues/18
            module.exports = factory(window);
        } else {
            // Node. Does not work with strict CommonJS, but
            // only CommonJS-like environments that support module.exports,
            // like Node.
            module.exports = factory(require('xmldom'));
        }
    } else {
        // Browser globals (root is window)
        root.JXON = factory(window);
    }
}(this, function (xmlDom) {

    return new (function () {
      var
        sValProp = "keyValue",
        sAttrProp = "keyAttributes",
        sAttrsPref = "@",
        sLowCase = true,
        sEmptyTrue = true,
        sAutoDate = true,
        sIgnorePrefixed = false,
        parserErrorHandler,
        DOMParser,
        sParseValues = true, /* you can customize these values */
        aCache = [], rIsNull = /^\s*$/, rIsBool = /^(?:true|false)$/i;

      function parseText (sValue) {
        if (!sParseValues) return sValue;
        if (rIsNull.test(sValue)) { return null; }
        if (rIsBool.test(sValue)) { return sValue.toLowerCase() === "true"; }
        if (isFinite(sValue)) { return parseFloat(sValue); }
        if (sAutoDate && isFinite(Date.parse(sValue))) { return new Date(sValue); }
        return sValue;
      }

      function EmptyTree () { }
      EmptyTree.prototype.toString = function () { return "null"; };
      EmptyTree.prototype.valueOf = function () { return null; };

      function objectify (vValue) {
        return vValue === null ? new EmptyTree() : vValue instanceof Object ? vValue : new vValue.constructor(vValue);
      }

      function createObjTree (oParentNode, nVerb, bFreeze, bNesteAttr) {
        var
          nLevelStart = aCache.length, bChildren = oParentNode.hasChildNodes(),
          bAttributes = oParentNode.nodeType === oParentNode.ELEMENT_NODE && oParentNode.hasAttributes(), bHighVerb = Boolean(nVerb & 2);

        var
          sProp, vContent, nLength = 0, sCollectedTxt = "",
          vResult = bHighVerb ? {} : /* put here the default value for empty nodes: */ (sEmptyTrue ? true : '');

        if (bChildren) {
          for (var oNode, nItem = 0; nItem < oParentNode.childNodes.length; nItem++) {
            oNode = oParentNode.childNodes.item(nItem);
            if (oNode.nodeType === 4) { sCollectedTxt += oNode.nodeValue; } /* nodeType is "CDATASection" (4) */
            else if (oNode.nodeType === 3) { sCollectedTxt += oNode.nodeValue.trim(); } /* nodeType is "Text" (3) */
            else if (oNode.nodeType === 1 && !(sIgnorePrefixed && oNode.prefix)) { aCache.push(oNode); } /* nodeType is "Element" (1) */
          }
        }

        var nLevelEnd = aCache.length, vBuiltVal = parseText(sCollectedTxt);

        if (!bHighVerb && (bChildren || bAttributes)) { vResult = nVerb === 0 ? objectify(vBuiltVal) : {}; }

        for (var nElId = nLevelStart; nElId < nLevelEnd; nElId++) {
          sProp = aCache[nElId].nodeName;
          if (sLowCase) sProp = sProp.toLowerCase();
          vContent = createObjTree(aCache[nElId], nVerb, bFreeze, bNesteAttr);
          if (vResult.hasOwnProperty(sProp)) {
            if (vResult[sProp].constructor !== Array) { vResult[sProp] = [vResult[sProp]]; }
            vResult[sProp].push(vContent);
          } else {
            vResult[sProp] = vContent;
            nLength++;
          }
        }

        if (bAttributes) {
          var
            nAttrLen = oParentNode.attributes.length,
            sAPrefix = bNesteAttr ? "" : sAttrsPref, oAttrParent = bNesteAttr ? {} : vResult;

          for (var oAttrib, oAttribName, nAttrib = 0; nAttrib < nAttrLen; nLength++, nAttrib++) {
            oAttrib = oParentNode.attributes.item(nAttrib);
            oAttribName = oAttrib.name;
            if (sLowCase) oAttribName = oAttribName.toLowerCase();
            oAttrParent[sAPrefix + oAttribName] = parseText(oAttrib.value.trim());
          }

          if (bNesteAttr) {
            if (bFreeze) { Object.freeze(oAttrParent); }
            vResult[sAttrProp] = oAttrParent;
            nLength -= nAttrLen - 1;
          }
        }

        if (nVerb === 3 || (nVerb === 2 || nVerb === 1 && nLength > 0) && sCollectedTxt) {
          vResult[sValProp] = vBuiltVal;
        } else if (!bHighVerb && nLength === 0 && sCollectedTxt) {
          vResult = vBuiltVal;
        }

        if (bFreeze && (bHighVerb || nLength > 0)) { Object.freeze(vResult); }

        aCache.length = nLevelStart;

        return vResult;
      }

      function loadObjTree (oXMLDoc, oParentEl, oParentObj) {
        var vValue, oChild;

        if (oParentObj.constructor === String || oParentObj.constructor === Number || oParentObj.constructor === Boolean) {
          oParentEl.appendChild(oXMLDoc.createTextNode(oParentObj.toString())); /* verbosity level is 0 or 1 */
          if (oParentObj === oParentObj.valueOf()) { return; }
        } else if (oParentObj.constructor === Date) {
          oParentEl.appendChild(oXMLDoc.createTextNode(oParentObj.toGMTString()));
        }

        for (var sName in oParentObj) {
          vValue = oParentObj[sName];
          if (vValue === null) vValue = {};
          if (isFinite(sName) || vValue instanceof Function) { continue; } /* verbosity level is 0 */
          // when it is _
          if (sName === sValProp) {
            if (vValue !== null && vValue !== true) { oParentEl.appendChild(oXMLDoc.createTextNode(vValue.constructor === Date ? vValue.toGMTString() : String(vValue))); }
          } else if (sName === sAttrProp) { /* verbosity level is 3 */
            for (var sAttrib in vValue) { oParentEl.setAttribute(sAttrib, vValue[sAttrib]); }
          } else if (sName === sAttrsPref+'xmlns') {
            // do nothing: special handling of xml namespaces is done via createElementNS()
          } else if (sName.charAt(0) === sAttrsPref) {
            oParentEl.setAttribute(sName.slice(1), vValue);
          } else if (vValue.constructor === Array) {
            for (var nItem = 0; nItem < vValue.length; nItem++) {
              oChild = oXMLDoc.createElementNS(vValue[nItem][sAttrsPref+'xmlns'] || oParentEl.namespaceURI, sName);
              loadObjTree(oXMLDoc, oChild, vValue[nItem]);
              oParentEl.appendChild(oChild);
            }
          } else {
            oChild = oXMLDoc.createElementNS((vValue || {})[sAttrsPref+'xmlns'] || oParentEl.namespaceURI, sName);
            if (vValue instanceof Object) {
              loadObjTree(oXMLDoc, oChild, vValue);
            } else if (vValue !== null && vValue !== true) {
              oChild.appendChild(oXMLDoc.createTextNode(vValue.toString()));
            } else if (!sEmptyTrue && vValue === true) {
              oChild.appendChild(oXMLDoc.createTextNode(vValue.toString()));

            }
            oParentEl.appendChild(oChild);
          }
        }
      }

      this.xmlToJs = this.build = function (oXMLParent, nVerbosity /* optional */, bFreeze /* optional */, bNesteAttributes /* optional */) {
        var _nVerb = arguments.length > 1 && typeof nVerbosity === "number" ? nVerbosity & 3 : /* put here the default verbosity level: */ 1;
        return createObjTree(oXMLParent, _nVerb, bFreeze || false, arguments.length > 3 ? bNesteAttributes : _nVerb === 3);
      };

      this.jsToXml = this.unbuild = function (oObjTree, sNamespaceURI /* optional */, sQualifiedName /* optional */, oDocumentType /* optional */) {
        var documentImplementation = xmlDom.document && xmlDom.document.implementation || new xmlDom.DOMImplementation();
        var oNewDoc = documentImplementation.createDocument(sNamespaceURI || null, sQualifiedName || "", oDocumentType || null);
        loadObjTree(oNewDoc, oNewDoc.documentElement || oNewDoc, oObjTree);
        return oNewDoc;
      };

      this.config = function(o) {
        if (typeof o === 'undefined') {
            return {
                valueKey: sValProp,
                attrKey: sAttrProp,
                attrPrefix: sAttrsPref,
                lowerCaseTags: sLowCase,
                trueIsEmpty: sEmptyTrue,
                autoDate: sAutoDate,
                ignorePrefixNodes: sIgnorePrefixed,
                parseValues: sParseValues,
                parserErrorHandler: parserErrorHandler
            };
        }
        for (var k in o) {
          switch(k) {
            case 'valueKey':
              sValProp = o.valueKey;
              break;
            case 'attrKey':
              sAttrProp = o.attrKey;
              break;
            case 'attrPrefix':
              sAttrsPref = o.attrPrefix;
              break;
            case 'lowerCaseTags':
              sLowCase = o.lowerCaseTags;
              break;
            case 'trueIsEmpty':
              sEmptyTrue = o.trueIsEmpty;
              break;
            case 'autoDate':
              sAutoDate = o.autoDate;
              break;
            case 'ignorePrefixedNodes':
              sIgnorePrefixed = o.ignorePrefixedNodes;
              break;
            case 'parseValues':
              sParseValues = o.parseValues;
              break;
            case 'parserErrorHandler':
              parserErrorHandler = o.parserErrorHandler;
              DOMParser = new xmlDom.DOMParser({
                  errorHandler: parserErrorHandler,
                  locator: {}
              });
              break;
            default:
              break;
          }
        }
      };

      this.stringToXml = function(xmlStr) {
        if (!DOMParser) DOMParser = new xmlDom.DOMParser();
        return DOMParser.parseFromString(xmlStr, 'application/xml');
      };

      this.xmlToString = function (xmlObj) {
        if (typeof xmlObj.xml !== "undefined") {
          return xmlObj.xml;
        } else {
          return (new xmlDom.XMLSerializer()).serializeToString(xmlObj);
        }
      };

      this.stringToJs = function(str) {
        var xmlObj = this.stringToXml(str);
        return this.xmlToJs(xmlObj);
      };

      this.jsToString = this.stringify = function(oObjTree, sNamespaceURI /* optional */, sQualifiedName /* optional */, oDocumentType /* optional */) {
        return this.xmlToString(
          this.jsToXml(oObjTree, sNamespaceURI, sQualifiedName, oDocumentType)
        );
      };
    })();

}));

},{"xmldom":1}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi4uLy4uLy4uL3Vzci9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9lbXB0eS5qcyIsIm5vZGVfbW9kdWxlcy9nZW9qc29uLXZhbGlkYXRpb24vaW5kZXguanMiLCJub2RlX21vZHVsZXMvZ2VvanNvbnRvb3NtL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dlb2pzb250b29zbS9ub2RlX21vZHVsZXMvanhvbi9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbjNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIiLCIvKipcbiogZ2VvSlNPTiB2YWxpZGF0aW9uIGFjY29yZGluZyB0byB0aGUgR2VvSlNPTiBzcGVmaWNhdGlvbiBWZXJzaW9uIDFcbiogQG1vZHVsZSBnZW9KU09OVmFsaWRhdGlvblxuKiBAY2xhc3MgTWFpblxuKiBAZXhwb3J0cyB7R0pWfSBcbiovXG5cbihmdW5jdGlvbihleHBvcnRzKXtcblxuICAgIHZhciBkZWZpbml0aW9ucyA9IHt9O1xuXG4gICAgLyoqXG4gICAgICogVGVzdCBhbiBvYmplY3QgdG8gc2VlIGlmIGl0IGlzIGEgZnVuY3Rpb25cbiAgICAgKiBAbWV0aG9kIGlzRnVuY3Rpb24gXG4gICAgICogQHBhcmFtIG9iamVjdCB7T2JqZWN0fVxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNGdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZihvYmplY3QpID09ICdmdW5jdGlvbic7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIEEgdHJ1dGh5IHRlc3QgZm9yIG9iamVjdHNcbiAgICAgKiBAbWV0aG9kIGlzT2JqZWN0XG4gICAgICogQHBhcmFtIHtPYmplY3R9XG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc09iamVjdChvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdCA9PT0gT2JqZWN0KG9iamVjdCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRm9ybWF0cyBlcnJvciBtZXNzYWdlcywgY2FsbHMgdGhlIGNhbGxiYWNrXG4gICAgICogQG1ldGhvZCBkb25lXG4gICAgICogQHByaXZhdGVcbiAgICAgKiBAcGFyYW0gY2Ige0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAqIEBwYXJhbSBbbWVzc2FnZV0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGlzIHRoZSBvYmplY3QgdmFsaWQgb3Igbm90P1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9kb25lKGNiLCBtZXNzYWdlKXtcbiAgICAgICAgdmFyIHZhbGlkID0gZmFsc2U7XG5cbiAgICAgICAgaWYodHlwZW9mIG1lc3NhZ2UgPT09IFwic3RyaW5nXCIpe1xuICAgICAgICAgICAgbWVzc2FnZSA9IFttZXNzYWdlXTtcblxuICAgICAgICB9ZWxzZSBpZiggT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKCBtZXNzYWdlICkgPT09ICdbb2JqZWN0IEFycmF5XScgKSB7XG4gICAgICAgICAgICBpZihtZXNzYWdlLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICAgICAgdmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHZhbGlkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCBpc0Z1bmN0aW9uKGNiKSl7XG4gICAgICAgICAgICBpZih2YWxpZCl7XG4gICAgICAgICAgICAgICAgY2IodmFsaWQsIFtdKTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGNiKHZhbGlkLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWxpZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBjYWxscyBhIGN1c3RvbSBkZWZpbml0aW9uIGlmIG9uZSBpcyBhdmFsaWJsZSBmb3IgdGhlIGdpdmVuIHR5cGVcbiAgICAgKiBAbWV0aG9kIF9jdXN0b21EZWZpbml0aW9ucyBcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBwYXJhbSB0eXBlIHtcIlN0cmluZ1wifSBhIEdlb0pTT04gb2JqZWN0IHR5cGVcbiAgICAgKiBAcGFyYW0gb2JqZWN0IHtPYmplY3R9IHRoZSBPYmplY3QgYmVpbmcgdGVzdGVkIFxuICAgICAqIEByZXR1cm4ge0FycmF5fSBhbiBhcnJheSBvZiBlcnJvcnNcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfY3VzdG9tRGVmaW5pdGlvbnModHlwZSwgb2JqZWN0KXtcblxuICAgICAgICB2YXIgZXJyb3JzO1xuXG4gICAgICAgIGlmKGlzRnVuY3Rpb24oZGVmaW5pdGlvbnNbdHlwZV0pKXtcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBkZWZpbml0aW9uc1t0eXBlXShvYmplY3QpO1xuICAgICAgICAgICAgfWNhdGNoKGUpe1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtcIlByb2JsZW0gd2l0aCBjdXN0b20gZGVmaW5pdGlvbiBmb3IgJ1wiICsgdHlwZSArIFwiOiBcIiArIGVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW2Vycm9yc107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoIGVycm9ycyApID09PSAnW29iamVjdCBBcnJheV0nKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3JzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWZpbmUgYSBjdXN0b20gdmFsaWRhdGlvbiBmdW5jdGlvbiBmb3Igb25lIG9mIEdlb0pTT04gb2JqZWN0c1xuICAgICAqIEBtZXRob2QgZGVmaW5lIFxuICAgICAqIEBwYXJhbSB0eXBlIHtHZW9KU09OIFR5cGV9IHRoZSB0eXBlIFxuICAgICAqIEBwYXJhbSBkZWZpbml0aW9uIHtGdW5jdGlvbn0gQSB2YWxpZGF0aW9uIGZ1bmN0aW9uXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn0gUmV0dXJuIHRydWUgaWYgdGhlIGZ1bmN0aW9uIHdhcyBsb2FkZWQgY29yZWN0bHkgZWxzZSBmYWxzZVxuICAgICAqL1xuICAgIGV4cG9ydHMuZGVmaW5lID0gZnVuY3Rpb24odHlwZSwgZGVmaW5pdGlvbil7XG4gICAgICAgIGlmKCh0eXBlIGluIGFsbF90eXBlcykgJiYgaXNGdW5jdGlvbihkZWZpbml0aW9uKSl7XG4gICAgICAgICAgICAvL1RPRE86IGNoZWNrIHRvIHNlZSBpZiB0aGUgdHlwZSBpcyB2YWxpZFxuICAgICAgICAgICAgZGVmaW5pdGlvbnNbdHlwZV0gPSBkZWZpbml0aW9uO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIGlmIGFuIG9iamVjdCBpcyBhIHBvc2l0aW9uIG9yIG5vdFxuICAgICAqIEBtZXRob2QgaXNQb3NpdGlvbiBcbiAgICAgKiBAcGFyYW0gcG9zaXRpb24ge0FycmF5fVxuICAgICAqIEBwYXJhbSBbY2JdIHtGdW5jdGlvbn0gdGhlIGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBleHBvcnRzLmlzUG9zaXRpb24gPSBmdW5jdGlvbihwb3NpdGlvbiwgY2Ipe1xuXG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcblxuICAgICAgICAvL0l0IG11c3QgYmUgYW4gYXJyYXlcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShwb3NpdGlvbikpe1xuICAgICAgICAgICAgLy9hbmQgdGhlIGFycmF5IG11c3QgaGF2ZSBtb3JlIHRoYW4gb25lIGVsZW1lbnRcbiAgICAgICAgICAgIGlmKHBvc2l0aW9uLmxlbmd0aCA8PSAxKXtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChcIlBvc2l0aW9uIG11c3QgYmUgYXQgbGVhc3QgdHdvIGVsZW1lbnRzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKFwiUG9zaXRpb24gbXVzdCBiZSBhbiBhcnJheVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vcnVuIGN1c3RvbSBjaGVja3NcbiAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChfY3VzdG9tRGVmaW5pdGlvbnMoXCJQb3NpdGlvblwiLCBwb3NpdGlvbikpO1xuXG4gICAgICAgIHJldHVybiBfZG9uZShjYiwgZXJyb3JzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyBpZiBhbiBvYmplY3QgaXMgYSBHZW9KU09OIE9iamVjdCBvciBub3RcbiAgICAgKiBAbWV0aG9kIGlzR2VvSlNPTk9iamVjdHx2YWxpZFxuICAgICAqIEBwYXJhbSBnZW9KU09OT2JqZWN0IHtPYmplY3R9XG4gICAgICogQHBhcmFtIFtjYl0ge0Z1bmN0aW9ufSB0aGUgY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqL1xuICAgIGV4cG9ydHMuaXNHZW9KU09OT2JqZWN0ID0gZXhwb3J0cy52YWxpZCA9IGZ1bmN0aW9uKGdlb0pTT05PYmplY3QsIGNiKXtcblxuICAgICAgICBpZighaXNPYmplY3QoZ2VvSlNPTk9iamVjdCkpe1xuICAgICAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBbJ211c3QgYmUgYSBKU09OIE9iamVjdCddKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgaWYoJ3R5cGUnIGluIGdlb0pTT05PYmplY3Qpe1xuICAgICAgICAgICAgaWYobm9uX2dlb190eXBlc1tnZW9KU09OT2JqZWN0LnR5cGVdKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9uX2dlb190eXBlc1tnZW9KU09OT2JqZWN0LnR5cGVdKGdlb0pTT05PYmplY3QsIGNiKTtcbiAgICAgICAgICAgIH1lbHNlIGlmKGdlb190eXBlc1tnZW9KU09OT2JqZWN0LnR5cGVdKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2VvX3R5cGVzW2dlb0pTT05PYmplY3QudHlwZV0oZ2VvSlNPTk9iamVjdCwgY2IpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goJ3R5cGUgbXVzdCBiZSBvbmUgb2Y6IFwiUG9pbnRcIiwgXCJNdWx0aVBvaW50XCIsIFwiTGluZVN0cmluZ1wiLCBcIk11bHRpTGluZVN0cmluZ1wiLCBcIlBvbHlnb25cIiwgXCJNdWx0aVBvbHlnb25cIiwgXCJHZW9tZXRyeUNvbGxlY3Rpb25cIiwgXCJGZWF0dXJlXCIsIG9yIFwiRmVhdHVyZUNvbGxlY3Rpb25cIicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKFwibXVzdCBoYXZlIGEgbWVtYmVyIHdpdGggdGhlIG5hbWUgJ3R5cGUnXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9ydW4gY3VzdG9tIGNoZWNrc1xuICAgICAgICBlcnJvcnMgPSBlcnJvcnMuY29uY2F0KF9jdXN0b21EZWZpbml0aW9ucyhcIkdlb0pTT05PYmplY3RcIiwgZ2VvSlNPTk9iamVjdCkpO1xuICAgICAgICByZXR1cm4gX2RvbmUoY2IsIGVycm9ycyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgYW4gb2JqZWN0IGlzIGEgR2VvbWV0cnkgT2JqZWN0IG9yIG5vdFxuICAgICAqIEBtZXRob2QgaXNHZW9tZXRyeU9iamVjdFxuICAgICAqIEBwYXJhbSBnZW9tZXRyeU9iamVjdCB7T2JqZWN0fVxuICAgICAqIEBwYXJhbSBbY2JdIHtGdW5jdGlvbn0gdGhlIGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBleHBvcnRzLmlzR2VvbWV0cnlPYmplY3QgPSBmdW5jdGlvbihnZW9tZXRyeU9iamVjdCwgY2Ipe1xuXG4gICAgICAgIGlmKCFpc09iamVjdChnZW9tZXRyeU9iamVjdCkpe1xuICAgICAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBbJ211c3QgYmUgYSBKU09OIE9iamVjdCddKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZigndHlwZScgaW4gZ2VvbWV0cnlPYmplY3Qpe1xuICAgICAgICAgICAgaWYoZ2VvX3R5cGVzW2dlb21ldHJ5T2JqZWN0LnR5cGVdKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2VvX3R5cGVzW2dlb21ldHJ5T2JqZWN0LnR5cGVdKGdlb21ldHJ5T2JqZWN0LCBjYik7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaCgndHlwZSBtdXN0IGJlIG9uZSBvZjogXCJQb2ludFwiLCBcIk11bHRpUG9pbnRcIiwgXCJMaW5lU3RyaW5nXCIsIFwiTXVsdGlMaW5lU3RyaW5nXCIsIFwiUG9seWdvblwiLCBcIk11bHRpUG9seWdvblwiIG9yIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICd0eXBlJ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vcnVuIGN1c3RvbSBjaGVja3NcbiAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChfY3VzdG9tRGVmaW5pdGlvbnMoXCJHZW9tZXRyeU9iamVjdFwiLCBnZW9tZXRyeU9iamVjdCkpO1xuICAgICAgICByZXR1cm4gX2RvbmUoY2IsIGVycm9ycyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgYW4gb2JqZWN0IGlzIGEgUG9pbnQgb3Igbm90XG4gICAgICogQG1ldGhvZCBpc1BvaW50XG4gICAgICogQHBhcmFtIHBvaW50IHtPYmplY3R9XG4gICAgICogQHBhcmFtIFtjYl0ge0Z1bmN0aW9ufSB0aGUgY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqL1xuICAgIGV4cG9ydHMuaXNQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBjYikge1xuXG4gICAgICAgIGlmKCFpc09iamVjdChwb2ludCkpe1xuICAgICAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBbJ211c3QgYmUgYSBKU09OIE9iamVjdCddKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZignYmJveCcgaW4gcG9pbnQpe1xuICAgICAgICAgICAgZXhwb3J0cy5pc0Jib3gocG9pbnQuYmJveCwgZnVuY3Rpb24odmFsaWQsIGVycil7XG4gICAgICAgICAgICAgICAgaWYoIXZhbGlkKXtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoJ3R5cGUnIGluIHBvaW50KXtcbiAgICAgICAgICAgIGlmKHBvaW50LnR5cGUgIT09IFwiUG9pbnRcIil7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJ0eXBlIG11c3QgYmUgJ1BvaW50J1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICd0eXBlJ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCdjb29yZGluYXRlcycgaW4gcG9pbnQpe1xuICAgICAgICAgICAgZXhwb3J0cy5pc1Bvc2l0aW9uKHBvaW50LmNvb3JkaW5hdGVzLCBmdW5jdGlvbih2YWxpZCwgZXJyKXtcbiAgICAgICAgICAgICAgICBpZighdmFsaWQpe1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMucHVzaCgnQ29vcmRpbmF0ZXMgbXVzdCBiZSBhIHNpbmdsZSBwb3NpdGlvbicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKFwibXVzdCBoYXZlIGEgbWVtYmVyIHdpdGggdGhlIG5hbWUgJ2Nvb3JkaW5hdGVzJ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vcnVuIGN1c3RvbSBjaGVja3NcbiAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChfY3VzdG9tRGVmaW5pdGlvbnMoXCJQb2ludFwiLCBwb2ludCkpO1xuXG4gICAgICAgIHJldHVybiBfZG9uZShjYiwgZXJyb3JzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyBpZiBhbiBhcnJheSBjYW4gYmUgaW50ZXJwZXJ0ZWQgYXMgY29vcmRpbmF0ZXMgZm9yIGEgTXVsdGlQb2ludFxuICAgICAqIEBtZXRob2QgaXNNdWx0aVBvaW50Q29vclxuICAgICAqIEBwYXJhbSBjb29yZGluYXRlcyB7QXJyYXl9XG4gICAgICogQHBhcmFtIFtjYl0ge0Z1bmN0aW9ufSB0aGUgY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqL1xuICAgIGV4cG9ydHMuaXNNdWx0aVBvaW50Q29vciA9IGZ1bmN0aW9uKGNvb3JkaW5hdGVzLCBjYikge1xuXG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGNvb3JkaW5hdGVzKSl7XG4gICAgICAgICAgICBjb29yZGluYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaW5kZXgpe1xuICAgICAgICAgICAgICAgIGV4cG9ydHMuaXNQb3NpdGlvbih2YWwsIGZ1bmN0aW9uKHZhbGlkLCBlcnIpe1xuICAgICAgICAgICAgICAgICAgICBpZighdmFsaWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9tb2RpZnkgdGhlIGVyciBtc2cgZnJvbSBcImlzUG9zaXRpb25cIiB0byBub3RlIHRoZSBlbGVtZW50IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyWzBdID0gXCJhdCBcIisgaW5kZXgrIFwiOiBcIi5jb25jYXQoZXJyWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYnVpbGQgYSBsaXN0IG9mIGludmFsaWRlIHBvc2l0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcImNvb3JkaW5hdGVzIG11c3QgYmUgYW4gYXJyYXlcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gX2RvbmUoY2IsIGVycm9ycyk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIGlmIGFuIG9iamVjdCBpcyBhIE11bHRpUG9pbnQgb3Igbm90XG4gICAgICogQG1ldGhvZCBpc011bHRpUG9pbnRcbiAgICAgKiBAcGFyYW0gcG9zaXRpb24ge09iamVjdH1cbiAgICAgKiBAcGFyYW0gY2Ige0Z1bmN0aW9ufSB0aGUgY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqL1xuICAgIGV4cG9ydHMuaXNNdWx0aVBvaW50ID0gZnVuY3Rpb24obXVsdGlQb2ludCwgY2IpIHtcblxuICAgICAgICBpZighaXNPYmplY3QobXVsdGlQb2ludCkpe1xuICAgICAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBbJ211c3QgYmUgYSBKU09OIE9iamVjdCddKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZignYmJveCcgaW4gbXVsdGlQb2ludCl7XG4gICAgICAgICAgICBleHBvcnRzLmlzQmJveChtdWx0aVBvaW50LmJib3gsIGZ1bmN0aW9uKHZhbGlkLCBlcnIpe1xuICAgICAgICAgICAgICAgIGlmKCF2YWxpZCl7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCd0eXBlJyBpbiBtdWx0aVBvaW50KXtcbiAgICAgICAgICAgIGlmKG11bHRpUG9pbnQudHlwZSAhPT0gXCJNdWx0aVBvaW50XCIpe1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKFwidHlwZSBtdXN0IGJlICdNdWx0aVBvaW50J1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICd0eXBlJ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCdjb29yZGluYXRlcycgaW4gbXVsdGlQb2ludCl7XG4gICAgICAgICAgICBleHBvcnRzLmlzTXVsdGlQb2ludENvb3IobXVsdGlQb2ludC5jb29yZGluYXRlcywgZnVuY3Rpb24odmFsaWQsIGVycil7XG4gICAgICAgICAgICAgICAgaWYoIXZhbGlkKXtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzID0gIGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICdjb29yZGluYXRlcydcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL3J1biBjdXN0b20gY2hlY2tzXG4gICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoX2N1c3RvbURlZmluaXRpb25zKFwiTXVsdGlQb2ludFwiLCBtdWx0aVBvaW50KSk7XG5cbiAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBlcnJvcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIGlmIGFuIGFycmF5IGNhbiBiZSBpbnRlcnBlcnRlZCBhcyBjb29yZGluYXRlcyBmb3IgYSBsaW5lU3RyaW5nXG4gICAgICogQG1ldGhvZCBpc0xpbmVTdHJpbmdDb29yXG4gICAgICogQHBhcmFtIGNvb3JkaW5hdGVzIHtBcnJheX1cbiAgICAgKiBAcGFyYW0gW2NiXSB7RnVuY3Rpb259IHRoZSBjYWxsYmFja1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZXhwb3J0cy5pc0xpbmVTdHJpbmdDb29yID0gZnVuY3Rpb24oY29vcmRpbmF0ZXMsIGNiKSB7XG5cbiAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICBpZihBcnJheS5pc0FycmF5KGNvb3JkaW5hdGVzKSl7XG4gICAgICAgICAgICBpZihjb29yZGluYXRlcy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgICAgICBjb29yZGluYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaW5kZXgpe1xuICAgICAgICAgICAgICAgICAgICBleHBvcnRzLmlzUG9zaXRpb24odmFsLCBmdW5jdGlvbih2YWxpZCwgZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCF2YWxpZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9tb2RpZnkgdGhlIGVyciBtc2cgZnJvbSBcImlzUG9zaXRpb25cIiB0byBub3RlIHRoZSBlbGVtZW50IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVyclswXSA9IFwiYXQgXCIrIGluZGV4KyBcIjogXCIuY29uY2F0KGVyclswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9idWlsZCBhIGxpc3Qgb2YgaW52YWxpZGUgcG9zaXRpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKFwiY29vcmRpbmF0ZXMgbXVzdCBoYXZlIGF0IGxlYXN0IHR3byBlbGVtZW50c1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaCggXCJjb29yZGluYXRlcyBtdXN0IGJlIGFuIGFycmF5XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBlcnJvcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIGlmIGFuIG9iamVjdCBpcyBhIGxpbmVTdHJpbmcgb3Igbm90XG4gICAgICogQG1ldGhvZCBpc0xpbmVTdHJpbmdcbiAgICAgKiBAcGFyYW0gbGluZVN0cmluZyB7T2JqZWN0fVxuICAgICAqIEBwYXJhbSBbY2JdIHtGdW5jdGlvbn0gdGhlIGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBleHBvcnRzLmlzTGluZVN0cmluZyA9IGZ1bmN0aW9uKGxpbmVTdHJpbmcsIGNiKXtcblxuICAgICAgICBpZighaXNPYmplY3QobGluZVN0cmluZykpe1xuICAgICAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBbJ211c3QgYmUgYSBKU09OIE9iamVjdCddKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZignYmJveCcgaW4gbGluZVN0cmluZyl7XG4gICAgICAgICAgICBleHBvcnRzLmlzQmJveChsaW5lU3RyaW5nLmJib3gsIGZ1bmN0aW9uKHZhbGlkLCBlcnIpe1xuICAgICAgICAgICAgICAgIGlmKCF2YWxpZCl7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCd0eXBlJyBpbiBsaW5lU3RyaW5nKXtcbiAgICAgICAgICAgIGlmKGxpbmVTdHJpbmcudHlwZSAhPT0gXCJMaW5lU3RyaW5nXCIpe1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKFwidHlwZSBtdXN0IGJlICdMaW5lU3RyaW5nJ1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICd0eXBlJ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCdjb29yZGluYXRlcycgaW4gbGluZVN0cmluZyl7XG4gICAgICAgICAgICBleHBvcnRzLmlzTGluZVN0cmluZ0Nvb3IobGluZVN0cmluZy5jb29yZGluYXRlcywgZnVuY3Rpb24odmFsaWQsIGVycil7XG4gICAgICAgICAgICAgICAgaWYoIXZhbGlkKXtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzID0gIGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICdjb29yZGluYXRlcydcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL3J1biBjdXN0b20gY2hlY2tzXG4gICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoX2N1c3RvbURlZmluaXRpb25zKFwiTGluZVN0cmluZ1wiLCBsaW5lU3RyaW5nKSk7XG5cbiAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBlcnJvcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIGlmIGFuIGFycmF5IGNhbiBiZSBpbnRlcnBlcnRlZCBhcyBjb29yZGluYXRlcyBmb3IgYSBNdWx0aUxpbmVTdHJpbmdcbiAgICAgKiBAbWV0aG9kIGlzTXVsdGlMaW5lU3RyaW5nQ29vclxuICAgICAqIEBwYXJhbSBjb29yZGluYXRlcyB7QXJyYXl9XG4gICAgICogQHBhcmFtIFtjYl0ge0Z1bmN0aW9ufSB0aGUgY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqL1xuICAgIGV4cG9ydHMuaXNNdWx0aUxpbmVTdHJpbmdDb29yID0gZnVuY3Rpb24oY29vcmRpbmF0ZXMsIGNiKSB7XG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShjb29yZGluYXRlcykpe1xuICAgICAgICAgICAgY29vcmRpbmF0ZXMuZm9yRWFjaChmdW5jdGlvbih2YWwsIGluZGV4KXtcbiAgICAgICAgICAgICAgICBleHBvcnRzLmlzTGluZVN0cmluZ0Nvb3IodmFsLCBmdW5jdGlvbih2YWxpZCwgZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoIXZhbGlkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbW9kaWZ5IHRoZSBlcnIgbXNnIGZyb20gXCJpc1Bvc2l0aW9uXCIgdG8gbm90ZSB0aGUgZWxlbWVudCBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyclswXSA9IFwiYXQgXCIrIGluZGV4KyBcIjogXCIuY29uY2F0KGVyclswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2J1aWxkIGEgbGlzdCBvZiBpbnZhbGlkZSBwb3NpdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJjb29yZGluYXRlcyBtdXN0IGJlIGFuIGFycmF5XCIpO1xuICAgICAgICB9XG4gICAgICAgIF9kb25lKGNiLCBlcnJvcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIGlmIGFuIG9iamVjdCBpcyBhIE11bHRpTGluZSBTdHJpbmcgb3Igbm90XG4gICAgICogQG1ldGhvZCBpc011bHRpTGluZVN0cmluZ1xuICAgICAqIEBwYXJhbSBtdWx0aWxpbmVTdHJpbmcge09iamVjdH1cbiAgICAgKiBAcGFyYW0gW2NiXSB7RnVuY3Rpb259IHRoZSBjYWxsYmFja1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZXhwb3J0cy5pc011bHRpTGluZVN0cmluZyA9IGZ1bmN0aW9uKG11bHRpbGluZVN0cmluZywgY2Ipe1xuXG4gICAgICAgIGlmKCFpc09iamVjdChtdWx0aWxpbmVTdHJpbmcpKXtcbiAgICAgICAgICAgIHJldHVybiBfZG9uZShjYiwgWydtdXN0IGJlIGEgSlNPTiBPYmplY3QnXSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYoJ2Jib3gnIGluIG11bHRpbGluZVN0cmluZyl7XG4gICAgICAgICAgICBleHBvcnRzLmlzQmJveChtdWx0aWxpbmVTdHJpbmcuYmJveCwgZnVuY3Rpb24odmFsaWQsIGVycil7XG4gICAgICAgICAgICAgICAgaWYoIXZhbGlkKXtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoJ3R5cGUnIGluIG11bHRpbGluZVN0cmluZyl7XG4gICAgICAgICAgICBpZihtdWx0aWxpbmVTdHJpbmcudHlwZSAhPT0gXCJNdWx0aUxpbmVTdHJpbmdcIil7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJ0eXBlIG11c3QgYmUgJ011bHRpTGluZVN0cmluZydcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJtdXN0IGhhdmUgYSBtZW1iZXIgd2l0aCB0aGUgbmFtZSAndHlwZSdcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZignY29vcmRpbmF0ZXMnIGluIG11bHRpbGluZVN0cmluZyl7XG4gICAgICAgICAgICBleHBvcnRzLmlzTXVsdGlMaW5lU3RyaW5nQ29vcihtdWx0aWxpbmVTdHJpbmcuY29vcmRpbmF0ZXMsIGZ1bmN0aW9uKHZhbGlkLCBlcnIpe1xuICAgICAgICAgICAgICAgIGlmKCF2YWxpZCl7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICdjb29yZGluYXRlcydcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL3J1biBjdXN0b20gY2hlY2tzXG4gICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoX2N1c3RvbURlZmluaXRpb25zKFwiTXVsdGlQb2ludFwiLCBtdWx0aWxpbmVTdHJpbmcpKTtcblxuICAgICAgICByZXR1cm4gX2RvbmUoY2IsIGVycm9ycyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgYW4gYXJyYXkgaXMgYSBsaW5lYXIgUmluZyBTdHJpbmcgb3Igbm90XG4gICAgICogQG1ldGhvZCBpc011bHRpTGluZVN0cmluZ1xuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIGNvb3JkaW5hdGVzIHtBcnJheX1cbiAgICAgKiBAcGFyYW0gW2NiXSB7RnVuY3Rpb259IHRoZSBjYWxsYmFja1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZnVuY3Rpb24gX2xpbmVhclJpbmdDb29yKGNvb3JkaW5hdGVzLCBjYikge1xuXG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShjb29yZGluYXRlcykpe1xuICAgICAgICAgICAgLy80IG9yIG1vcmUgcG9zaXRpb25zXG5cbiAgICAgICAgICAgIGNvb3JkaW5hdGVzLmZvckVhY2goZnVuY3Rpb24odmFsLCBpbmRleCl7XG4gICAgICAgICAgICAgICAgZXhwb3J0cy5pc1Bvc2l0aW9uKHZhbCwgZnVuY3Rpb24odmFsaWQsIGVycil7XG4gICAgICAgICAgICAgICAgICAgIGlmKCF2YWxpZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL21vZGlmeSB0aGUgZXJyIG1zZyBmcm9tIFwiaXNQb3NpdGlvblwiIHRvIG5vdGUgdGhlIGVsZW1lbnQgbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJbMF0gPSBcImF0IFwiKyBpbmRleCsgXCI6IFwiLmNvbmNhdChlcnJbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9idWlsZCBhIGxpc3Qgb2YgaW52YWxpZGUgcG9zaXRpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcnMgPSBlcnJvcnMuY29uY2F0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBjaGVjayB0aGUgZmlyc3QgYW5kIGxhc3QgcG9zaXRpb25zIHRvIHNlZSBpZiB0aGV5IGFyZSBlcXVpdmFsZW50XG4gICAgICAgICAgICAvLyBUT0RPOiBtYXliZSBiZXR0ZXIgY2hlY2tpbmc/XG4gICAgICAgICAgICBpZihjb29yZGluYXRlc1swXS50b1N0cmluZygpICE9PSBjb29yZGluYXRlc1tjb29yZGluYXRlcy5sZW5ndGggLTEgXS50b1N0cmluZygpKXtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaCggXCJUaGUgZmlyc3QgYW5kIGxhc3QgcG9zaXRpb25zIG11c3QgYmUgZXF1aXZhbGVudFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoY29vcmRpbmF0ZXMubGVuZ3RoIDwgNCl7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJjb29yZGluYXRlcyBtdXN0IGhhdmUgYXQgbGVhc3QgZm91ciBwb3NpdGlvbnNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJjb29yZGluYXRlcyBtdXN0IGJlIGFuIGFycmF5XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBlcnJvcnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgYW4gYXJyYXkgaXMgdmFsaWQgUG9seWdvbiBDb29yZGluYXRlcyBvciBub3RcbiAgICAgKiBAbWV0aG9kIF9wb2x5Z29uQ29vclxuICAgICAqIEBwcml2YXRlXG4gICAgICogQHBhcmFtIGNvb3JkaW5hdGVzIHtBcnJheX1cbiAgICAgKiBAcGFyYW0gW2NiXSB7RnVuY3Rpb259IHRoZSBjYWxsYmFja1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZXhwb3J0cy5pc1BvbHlnb25Db29yID0gZnVuY3Rpb24gKGNvb3JkaW5hdGVzLCBjYil7XG5cbiAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICBpZihBcnJheS5pc0FycmF5KGNvb3JkaW5hdGVzKSl7XG4gICAgICAgICAgICBjb29yZGluYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaW5kZXgpe1xuICAgICAgICAgICAgICAgIF9saW5lYXJSaW5nQ29vcih2YWwsIGZ1bmN0aW9uKHZhbGlkLCBlcnIpe1xuICAgICAgICAgICAgICAgICAgICBpZighdmFsaWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9tb2RpZnkgdGhlIGVyciBtc2cgZnJvbSBcImlzUG9zaXRpb25cIiB0byBub3RlIHRoZSBlbGVtZW50IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyWzBdID0gXCJhdCBcIisgaW5kZXgrIFwiOiBcIi5jb25jYXQoZXJyWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYnVpbGQgYSBsaXN0IG9mIGludmFsaWQgcG9zaXRpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcnMgPSBlcnJvcnMuY29uY2F0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKFwiY29vcmRpbmF0ZXMgbXVzdCBiZSBhbiBhcnJheVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBfZG9uZShjYiwgZXJyb3JzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyBpZiBhbiBvYmplY3QgaXMgYSB2YWxpZCBQb2x5Z29uXG4gICAgICogQG1ldGhvZCBpc1BvbHlnb25cbiAgICAgKiBAcGFyYW0gcG9seWdvbiB7T2JqZWN0fVxuICAgICAqIEBwYXJhbSBbY2JdIHtGdW5jdGlvbn0gdGhlIGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBleHBvcnRzLmlzUG9seWdvbiA9IGZ1bmN0aW9uKHBvbHlnb24sIGNiKXtcblxuICAgICAgICBpZighaXNPYmplY3QocG9seWdvbikpe1xuICAgICAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBbJ211c3QgYmUgYSBKU09OIE9iamVjdCddKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZignYmJveCcgaW4gcG9seWdvbil7XG4gICAgICAgICAgICBleHBvcnRzLmlzQmJveChwb2x5Z29uLmJib3gsIGZ1bmN0aW9uKHZhbGlkLCBlcnIpe1xuICAgICAgICAgICAgICAgIGlmKCF2YWxpZCl7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCd0eXBlJyBpbiBwb2x5Z29uKXtcbiAgICAgICAgICAgIGlmKHBvbHlnb24udHlwZSAhPT0gXCJQb2x5Z29uXCIpe1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKFwidHlwZSBtdXN0IGJlICdQb2x5Z29uJ1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICd0eXBlJ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCdjb29yZGluYXRlcycgaW4gcG9seWdvbil7XG4gICAgICAgICAgICBleHBvcnRzLmlzUG9seWdvbkNvb3IocG9seWdvbi5jb29yZGluYXRlcywgZnVuY3Rpb24odmFsaWQsIGVycikge1xuICAgICAgICAgICAgICAgIGlmKCF2YWxpZCl7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICdjb29yZGluYXRlcydcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL3J1biBjdXN0b20gY2hlY2tzXG4gICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoX2N1c3RvbURlZmluaXRpb25zKFwiUG9seWdvblwiLCBwb2x5Z29uKSk7XG5cbiAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBlcnJvcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIGlmIGFuIGFycmF5IGNhbiBiZSBpbnRlcnBlcnRlZCBhcyBjb29yZGluYXRlcyBmb3IgYSBNdWx0aVBvbHlnb25cbiAgICAgKiBAbWV0aG9kIGlzTXVsdGlQb2x5Z29uQ29vclxuICAgICAqIEBwYXJhbSBjb29yZGluYXRlcyB7QXJyYXl9XG4gICAgICogQHBhcmFtIFtjYl0ge0Z1bmN0aW9ufSB0aGUgY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAqL1xuICAgIGV4cG9ydHMuaXNNdWx0aVBvbHlnb25Db29yID0gZnVuY3Rpb24oY29vcmRpbmF0ZXMsIGNiKSB7XG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShjb29yZGluYXRlcykpe1xuICAgICAgICAgICAgY29vcmRpbmF0ZXMuZm9yRWFjaChmdW5jdGlvbih2YWwsIGluZGV4KXtcbiAgICAgICAgICAgICAgICBleHBvcnRzLmlzUG9seWdvbkNvb3IodmFsLCBmdW5jdGlvbih2YWxpZCwgZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgaWYoIXZhbGlkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbW9kaWZ5IHRoZSBlcnIgbXNnIGZyb20gXCJpc1Bvc2l0aW9uXCIgdG8gbm90ZSB0aGUgZWxlbWVudCBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyclswXSA9IFwiYXQgXCIrIGluZGV4KyBcIjogXCIuY29uY2F0KGVyclswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2J1aWxkIGEgbGlzdCBvZiBpbnZhbGlkZSBwb3NpdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJjb29yZGluYXRlcyBtdXN0IGJlIGFuIGFycmF5XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgX2RvbmUoY2IsIGVycm9ycyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgYW4gb2JqZWN0IGlzIGEgdmFsaWQgTXVsdGlQb2x5Z29uXG4gICAgICogQG1ldGhvZCBpc011bHRpUG9seWdvblxuICAgICAqIEBwYXJhbSBtdWx0aVBvbHlnb24ge09iamVjdH1cbiAgICAgKiBAcGFyYW0gW2NiXSB7RnVuY3Rpb259IHRoZSBjYWxsYmFja1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZXhwb3J0cy5pc011bHRpUG9seWdvbiA9IGZ1bmN0aW9uKG11bHRpUG9seWdvbiwgY2Ipe1xuXG4gICAgICAgIGlmKCFpc09iamVjdChtdWx0aVBvbHlnb24pKXtcbiAgICAgICAgICAgIHJldHVybiBfZG9uZShjYiwgWydtdXN0IGJlIGEgSlNPTiBPYmplY3QnXSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYoJ2Jib3gnIGluIG11bHRpUG9seWdvbil7XG4gICAgICAgICAgICBleHBvcnRzLmlzQmJveChtdWx0aVBvbHlnb24uYmJveCwgZnVuY3Rpb24odmFsaWQsIGVycil7XG4gICAgICAgICAgICAgICAgaWYoIXZhbGlkKXtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoJ3R5cGUnIGluIG11bHRpUG9seWdvbil7XG4gICAgICAgICAgICBpZihtdWx0aVBvbHlnb24udHlwZSAhPT0gXCJNdWx0aVBvbHlnb25cIil7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJ0eXBlIG11c3QgYmUgJ011bHRpUG9seWdvbidcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJtdXN0IGhhdmUgYSBtZW1iZXIgd2l0aCB0aGUgbmFtZSAndHlwZSdcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZignY29vcmRpbmF0ZXMnIGluIG11bHRpUG9seWdvbil7XG4gICAgICAgICAgICBleHBvcnRzLmlzTXVsdGlQb2x5Z29uQ29vcihtdWx0aVBvbHlnb24uY29vcmRpbmF0ZXMsIGZ1bmN0aW9uKHZhbGlkLCBlcnIpe1xuICAgICAgICAgICAgICAgIGlmKCF2YWxpZCl7XG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICdjb29yZGluYXRlcydcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL3J1biBjdXN0b20gY2hlY2tzXG4gICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoX2N1c3RvbURlZmluaXRpb25zKFwiTXVsdGlQb2x5Z29uXCIsIG11bHRpUG9seWdvbikpO1xuXG4gICAgICAgIHJldHVybiBfZG9uZShjYiwgZXJyb3JzKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyBpZiBhbiBvYmplY3QgaXMgYSB2YWxpZCBHZW9tZXRyeSBDb2xsZWN0aW9uXG4gICAgICogQG1ldGhvZCBpc0dlb21ldHJ5Q29sbGVjdGlvblxuICAgICAqIEBwYXJhbSBnZW9tZXRyeUNvbGxlY3Rpb24ge09iamVjdH1cbiAgICAgKiBAcGFyYW0gW2NiXSB7RnVuY3Rpb259IHRoZSBjYWxsYmFja1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZXhwb3J0cy5pc0dlb21ldHJ5Q29sbGVjdGlvbiA9IGZ1bmN0aW9uKGdlb21ldHJ5Q29sbGVjdGlvbiwgY2Ipe1xuXG4gICAgICAgIGlmKCFpc09iamVjdChnZW9tZXRyeUNvbGxlY3Rpb24pKXtcbiAgICAgICAgICAgIHJldHVybiBfZG9uZShjYiwgWydtdXN0IGJlIGEgSlNPTiBPYmplY3QnXSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYoJ2Jib3gnIGluIGdlb21ldHJ5Q29sbGVjdGlvbil7XG4gICAgICAgICAgICBleHBvcnRzLmlzQmJveChnZW9tZXRyeUNvbGxlY3Rpb24uYmJveCwgZnVuY3Rpb24odmFsaWQsIGVycil7XG4gICAgICAgICAgICAgICAgaWYoIXZhbGlkKXtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoJ3R5cGUnIGluIGdlb21ldHJ5Q29sbGVjdGlvbil7XG4gICAgICAgICAgICBpZihnZW9tZXRyeUNvbGxlY3Rpb24udHlwZSAhPT0gXCJHZW9tZXRyeUNvbGxlY3Rpb25cIil7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJ0eXBlIG11c3QgYmUgJ0dlb21ldHJ5Q29sbGVjdGlvbidcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJtdXN0IGhhdmUgYSBtZW1iZXIgd2l0aCB0aGUgbmFtZSAndHlwZSdcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZignZ2VvbWV0cmllcycgaW4gZ2VvbWV0cnlDb2xsZWN0aW9uKXtcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZ2VvbWV0cnlDb2xsZWN0aW9uLmdlb21ldHJpZXMpKXtcbiAgICAgICAgICAgICAgICBnZW9tZXRyeUNvbGxlY3Rpb24uZ2VvbWV0cmllcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaW5kZXgpe1xuICAgICAgICAgICAgICAgICAgICBleHBvcnRzLmlzR2VvbWV0cnlPYmplY3QodmFsLCBmdW5jdGlvbih2YWxpZCwgZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCF2YWxpZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9tb2RpZnkgdGhlIGVyciBtc2cgZnJvbSBcImlzUG9zaXRpb25cIiB0byBub3RlIHRoZSBlbGVtZW50IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVyclswXSA9IFwiYXQgXCIrIGluZGV4KyBcIjogXCIuY29uY2F0KGVyclswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9idWlsZCBhIGxpc3Qgb2YgaW52YWxpZGUgcG9zaXRpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKFwiJ2dlb21ldHJpZXMnIG11c3QgYmUgYW4gYXJyYXlcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJtdXN0IGhhdmUgYSBtZW1iZXIgd2l0aCB0aGUgbmFtZSAnZ2VvbWV0cmllcydcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL3J1biBjdXN0b20gY2hlY2tzXG4gICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoX2N1c3RvbURlZmluaXRpb25zKFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIsIGdlb21ldHJ5Q29sbGVjdGlvbikpO1xuXG4gICAgICAgIHJldHVybiBfZG9uZSggY2IsIGVycm9ycyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgYW4gb2JqZWN0IGlzIGEgdmFsaWQgRmVhdHVyZVxuICAgICAqIEBtZXRob2QgaXNGZWF0dXJlXG4gICAgICogQHBhcmFtIGZlYXR1cmUge09iamVjdH1cbiAgICAgKiBAcGFyYW0gW2NiXSB7RnVuY3Rpb259IHRoZSBjYWxsYmFja1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZXhwb3J0cy5pc0ZlYXR1cmUgPSBmdW5jdGlvbihmZWF0dXJlLCBjYil7XG5cbiAgICAgICAgaWYoIWlzT2JqZWN0KGZlYXR1cmUpKXtcbiAgICAgICAgICAgIHJldHVybiBfZG9uZShjYiwgWydtdXN0IGJlIGEgSlNPTiBPYmplY3QnXSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXJyb3JzID0gW107XG5cbiAgICAgICAgaWYoJ2Jib3gnIGluIGZlYXR1cmUpe1xuICAgICAgICAgICAgZXhwb3J0cy5pc0Jib3goZmVhdHVyZS5iYm94LCBmdW5jdGlvbih2YWxpZCwgZXJyKXtcbiAgICAgICAgICAgICAgICBpZighdmFsaWQpe1xuICAgICAgICAgICAgICAgICAgICBlcnJvcnMgPSBlcnJvcnMuY29uY2F0KGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZigndHlwZScgaW4gZmVhdHVyZSl7XG4gICAgICAgICAgICBpZihmZWF0dXJlLnR5cGUgIT09IFwiRmVhdHVyZVwiKXtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChcInR5cGUgbXVzdCBiZSAnZmVhdHVyZSdcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJtdXN0IGhhdmUgYSBtZW1iZXIgd2l0aCB0aGUgbmFtZSAndHlwZSdcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZighKCdwcm9wZXJ0aWVzJyBpbiBmZWF0dXJlKSl7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICdwcm9wZXJ0aWVzJ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCdnZW9tZXRyeScgaW4gZmVhdHVyZSl7XG4gICAgICAgICAgICBpZihmZWF0dXJlLmdlb21ldHJ5ICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICBleHBvcnRzLmlzR2VvbWV0cnlPYmplY3QoZmVhdHVyZS5nZW9tZXRyeSwgZnVuY3Rpb24odmFsaWQsIGVycil7XG4gICAgICAgICAgICAgICAgICAgIGlmKCF2YWxpZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcnMgPSBlcnJvcnMuY29uY2F0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICdnZW9tZXRyeSdcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL3J1biBjdXN0b20gY2hlY2tzXG4gICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoX2N1c3RvbURlZmluaXRpb25zKFwiRmVhdHVyZVwiLCBmZWF0dXJlKSk7XG5cbiAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBlcnJvcnMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIGlmIGFuIG9iamVjdCBpcyBhIHZhbGlkIEZlYXR1cmUgQ29sbGVjdGlvblxuICAgICAqIEBtZXRob2QgaXNGZWF0dXJlQ29sbGVjdGlvblxuICAgICAqIEBwYXJhbSBmZWF0dXJlQ29sbGVjdGlvbiB7T2JqZWN0fVxuICAgICAqIEBwYXJhbSBbY2JdIHtGdW5jdGlvbn0gdGhlIGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBleHBvcnRzLmlzRmVhdHVyZUNvbGxlY3Rpb24gPSBmdW5jdGlvbihmZWF0dXJlQ29sbGVjdGlvbiwgY2Ipe1xuXG4gICAgICAgIGlmKCFpc09iamVjdChmZWF0dXJlQ29sbGVjdGlvbikpe1xuICAgICAgICAgICAgcmV0dXJuIF9kb25lKGNiLCBbJ211c3QgYmUgYSBKU09OIE9iamVjdCddKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcblxuICAgICAgICBpZignYmJveCcgaW4gZmVhdHVyZUNvbGxlY3Rpb24pe1xuICAgICAgICAgICAgZXhwb3J0cy5pc0Jib3goZmVhdHVyZUNvbGxlY3Rpb24uYmJveCwgZnVuY3Rpb24odmFsaWQsIGVycil7XG4gICAgICAgICAgICAgICAgaWYoIXZhbGlkKXtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdChlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoJ3R5cGUnIGluIGZlYXR1cmVDb2xsZWN0aW9uKXtcbiAgICAgICAgICAgIGlmKGZlYXR1cmVDb2xsZWN0aW9uLnR5cGUgIT09IFwiRmVhdHVyZUNvbGxlY3Rpb25cIil7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJ0eXBlIG11c3QgYmUgJ0ZlYXR1cmVDb2xsZWN0aW9uJ1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICd0eXBlJ1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCdmZWF0dXJlcycgaW4gZmVhdHVyZUNvbGxlY3Rpb24pe1xuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShmZWF0dXJlQ29sbGVjdGlvbi5mZWF0dXJlcykpe1xuICAgICAgICAgICAgICAgIGZlYXR1cmVDb2xsZWN0aW9uLmZlYXR1cmVzLmZvckVhY2goZnVuY3Rpb24odmFsLCBpbmRleCl7XG4gICAgICAgICAgICAgICAgICAgIGV4cG9ydHMuaXNGZWF0dXJlKHZhbCwgZnVuY3Rpb24odmFsaWQsIGVycil7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZighdmFsaWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbW9kaWZ5IHRoZSBlcnIgbXNnIGZyb20gXCJpc1Bvc2l0aW9uXCIgdG8gbm90ZSB0aGUgZWxlbWVudCBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJbMF0gPSBcImF0IFwiKyBpbmRleCsgXCI6IFwiLmNvbmNhdChlcnJbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vYnVpbGQgYSBsaXN0IG9mIGludmFsaWRlIHBvc2l0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBlcnJvcnMucHVzaChcIidmZWF0dXJlcycgbXVzdCBiZSBhbiBhcnJheVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChcIm11c3QgaGF2ZSBhIG1lbWJlciB3aXRoIHRoZSBuYW1lICdmZWF0dXJlcydcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvL3J1biBjdXN0b20gY2hlY2tzXG4gICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoX2N1c3RvbURlZmluaXRpb25zKFwiRmVhdHVyZUNvbGxlY3Rpb25cIiwgZmVhdHVyZUNvbGxlY3Rpb24pKTtcblxuICAgICAgICByZXR1cm4gX2RvbmUoY2IsIGVycm9ycyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgaWYgYW4gb2JqZWN0IGlzIGEgdmFsaWQgQm91bmRpbmcgQm94XG4gICAgICogQG1ldGhvZCBpc0Jib3hcbiAgICAgKiBAcGFyYW0gYmJveCB7T2JqZWN0fVxuICAgICAqIEBwYXJhbSBbY2JdIHtGdW5jdGlvbn0gdGhlIGNhbGxiYWNrXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBleHBvcnRzLmlzQmJveCA9IGZ1bmN0aW9uKGJib3gsIGNiKXtcbiAgICAgICAgdmFyIGVycm9ycyA9IFtdO1xuICAgICAgICBpZihBcnJheS5pc0FycmF5KGJib3gpKXtcbiAgICAgICAgICAgIGlmKGJib3gubGVuZ3RoICUgMiAhPT0gMCl7XG4gICAgICAgICAgICAgICAgZXJyb3JzLnB1c2goXCJiYm94LCBtdXN0IGJlIGEgMipuIGFycmF5XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKFwiYmJveCBtdXN0IGJlIGFuIGFycmF5XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9ydW4gY3VzdG9tIGNoZWNrc1xuICAgICAgICBlcnJvcnMgPSBlcnJvcnMuY29uY2F0KF9jdXN0b21EZWZpbml0aW9ucyhcIkJib3hcIiwgYmJveCkpO1xuXG4gICAgICAgIF9kb25lKGNiLGVycm9ycyk7XG4gICAgfTtcblxuICAgIHZhciBub25fZ2VvX3R5cGVzID0ge1xuICAgICAgICBcIkZlYXR1cmVcIjogZXhwb3J0cy5pc0ZlYXR1cmUsXG4gICAgICAgIFwiRmVhdHVyZUNvbGxlY3Rpb25cIjogZXhwb3J0cy5pc0ZlYXR1cmVDb2xsZWN0aW9uXG4gICAgfSxcblxuICAgIGdlb190eXBlcyA9IHtcbiAgICAgICAgXCJQb2ludFwiOiBleHBvcnRzLmlzUG9pbnQsXG4gICAgICAgIFwiTXVsdGlQb2ludFwiOiBleHBvcnRzLmlzTXVsdGlQb2ludCxcbiAgICAgICAgXCJMaW5lU3RyaW5nXCI6IGV4cG9ydHMuaXNMaW5lU3RyaW5nLFxuICAgICAgICBcIk11bHRpTGluZVN0cmluZ1wiOiBleHBvcnRzLmlzTXVsdGlMaW5lU3RyaW5nLFxuICAgICAgICBcIlBvbHlnb25cIjogZXhwb3J0cy5pc1BvbHlnb24sXG4gICAgICAgIFwiTXVsdGlQb2x5Z29uXCI6IGV4cG9ydHMuaXNNdWx0aVBvbHlnb24sXG4gICAgICAgIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IGV4cG9ydHMuaXNHZW9tZXRyeUNvbGxlY3Rpb24sXG4gICAgfSxcblxuICAgIGFsbF90eXBlcyA9IHtcbiAgICAgICAgXCJGZWF0dXJlXCI6IGV4cG9ydHMuaXNGZWF0dXJlLFxuICAgICAgICBcIkZlYXR1cmVDb2xsZWN0aW9uXCI6IGV4cG9ydHMuaXNGZWF0dXJlQ29sbGVjdGlvbixcbiAgICAgICAgXCJQb2ludFwiOiBleHBvcnRzLmlzUG9pbnQsXG4gICAgICAgIFwiTXVsdGlQb2ludFwiOiBleHBvcnRzLmlzTXVsdGlQb2ludCxcbiAgICAgICAgXCJMaW5lU3RyaW5nXCI6IGV4cG9ydHMuaXNMaW5lU3RyaW5nLFxuICAgICAgICBcIk11bHRpTGluZVN0cmluZ1wiOiBleHBvcnRzLmlzTXVsdGlMaW5lU3RyaW5nLFxuICAgICAgICBcIlBvbHlnb25cIjogZXhwb3J0cy5pc1BvbHlnb24sXG4gICAgICAgIFwiTXVsdGlQb2x5Z29uXCI6IGV4cG9ydHMuaXNNdWx0aVBvbHlnb24sXG4gICAgICAgIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IGV4cG9ydHMuaXNHZW9tZXRyeUNvbGxlY3Rpb24sXG4gICAgICAgIFwiQmJveFwiOiBleHBvcnRzLmlzQm94LFxuICAgICAgICBcIlBvc2l0aW9uXCI6IGV4cG9ydHMuaXNQb3NpdGlvbixcbiAgICAgICAgXCJHZW9KU09OXCI6IGV4cG9ydHMuaXNHZW9KU09OT2JqZWN0LFxuICAgICAgICBcIkdlb21ldHJ5T2JqZWN0XCI6IGV4cG9ydHMuaXNHZW9tZXRyeU9iamVjdFxuICAgIH07XG5cbiAgICBleHBvcnRzLmFsbF90eXBlcyA9IGFsbF90eXBlcztcblxufSkodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnPyB0aGlzWydHSlYnXT17fTogZXhwb3J0cyk7XG4iLCJ2YXIganhvbiA9IHJlcXVpcmUoJ2p4b24nKTtcbnZhciBnamNoZWNrID0gcmVxdWlyZSgnZ2VvanNvbi12YWxpZGF0aW9uJyk7XG5cbmZ1bmN0aW9uIGdlb2pzb250b29zbShnZW9qc29uKSB7XG4gICAvLyBBY2NlcHQgYSBmdWxsIGdlb2pzb24gZm9ybWF0IEZlYXR1cmVDb2xsZWN0aW9uICwgbm90IG9ubHkgYW4gYXJyYXkgb2YgZmVhdHVyZXNcbiAgIC8vIGFjY2VwdCBnZW9qc29uIGFzIGFuIG9iamVjdFxuXG4gICAvL2NvbnNvbGUubG9nKHR5cGVvZihnZW9qc29uKSk7XG4gICBpZiAodHlwZW9mIGdlb2pzb24gPT09ICdzdHJpbmcnKSBnZW9qc29uID0gSlNPTi5wYXJzZShnZW9qc29uKTtcbiAgIHN3aXRjaCAoZ2VvanNvbi50eXBlKSB7XG4gICAgICAgIGNhc2UgJ0ZlYXR1cmVDb2xsZWN0aW9uJzpcbiAgICAgICAgICAgICBwYXJzZWRfZ2VvanNvbiA9IFtdO1xuICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGdlb2pzb24uZmVhdHVyZXMpO1xuICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2VvanNvbi5mZWF0dXJlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgcGFyc2VkX2dlb2pzb24ucHVzaChnZW9qc29uLmZlYXR1cmVzW2ldKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgIC8vY29uc29sZS5sb2coZ2VvanNvbik7XG4gICAgICAgICAgICAgcGFyc2VkX2dlb2pzb24gPSBnZW9qc29uO1xuICAgICAgICBicmVhaztcbiAgIH1cbiAgIC8vIGNvbnNvbGUubG9nKHBhcnNlZF9nZW9qc29uKTtcblxuICAgIHZhciBmZWF0dXJlcyA9IHBhcnNlZF9nZW9qc29uLmZlYXR1cmVzIHx8IHBhcnNlZF9nZW9qc29uLmxlbmd0aD4wID8gcGFyc2VkX2dlb2pzb24gOiBbcGFyc2VkX2dlb2pzb25dXG5cbiAgICB2YXIgbm9kZXMgPSBbXSwgbm9kZXNJbmRleCA9IHt9LFxuICAgICAgICB3YXlzID0gW10sXG4gICAgICAgIHJlbGF0aW9ucyA9IFtdO1xuICAgIHZhciBmaWx0ZXJlZF9wcm9wZXJ0aWVzO1xuXG4gICAgLy9jb25zb2xlLmxvZyhmZWF0dXJlcyk7XG5cbiAgICBmZWF0dXJlcy5mb3JFYWNoKGZ1bmN0aW9uKGZlYXR1cmUpIHsgLy8gZmVhdHVyZSBjYW4gYWxzbyBiZSBhIHB1cmUgR2VvSlNPTiBnZW9tZXRyeSBvYmplY3RcbiAgICAgICAgaWYgKCBnamNoZWNrLnZhbGlkKGZlYXR1cmUpICYmIGdqY2hlY2suaXNGZWF0dXJlKGZlYXR1cmUpICkge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcInRoaXMgaXMgdmFsaWQgR2VvSlNPTiFcIik7XG4gICAgICAgICAgICAvLyB0b2RvOiBHZW9tZXRyeUNvbGxlY3Rpb24/XG4gICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IGZlYXR1cmUucHJvcGVydGllcyB8fCB7fSxcbiAgICAgICAgICAgICAgICAgIGdlb21ldHJ5ID0gZmVhdHVyZS5nZW9tZXRyeSB8fCBmZWF0dXJlXG4gICAgICAgICAgICAvLyB0b2RvOiBpZHMgaWYgKGZlYXR1cmUuaWQgJiYgZmVhdHVyZS5pZC5tYXRjaCgvXihub2RlfHdheXxyZWxhdGlvbilcXC8oXFxkKykkLykpIGlkID0g4oCmXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhwcm9wZXJ0aWVzKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2codHlwZW9mKHByb3BlcnRpZXMpKTtcbiAgICAgICAgICAgIGRlbGV0ZSBwcm9wZXJ0aWVzWydvc21faWQnXTtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2cocHJvcGVydGllcyk7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoZ2VvbWV0cnkudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcIlBvaW50XCI6XG4gICAgICAgICAgICAgICAgcHJvY2Vzc1BvaW50KGdlb21ldHJ5LmNvb3JkaW5hdGVzLCBwcm9wZXJ0aWVzLCBub2Rlcywgbm9kZXNJbmRleClcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIkxpbmVTdHJpbmdcIjpcbiAgICAgICAgICAgICAgICBwcm9jZXNzTGluZVN0cmluZyhnZW9tZXRyeS5jb29yZGluYXRlcywgcHJvcGVydGllcywgd2F5cywgbm9kZXMsIG5vZGVzSW5kZXgpXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJQb2x5Z29uXCI6XG4gICAgICAgICAgICAgICAgcHJvY2Vzc011bHRpUG9seWdvbihbZ2VvbWV0cnkuY29vcmRpbmF0ZXNdLCBwcm9wZXJ0aWVzLCByZWxhdGlvbnMsIHdheXMsIG5vZGVzLCBub2Rlc0luZGV4KVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiTXVsdGlwb2x5Z29uXCI6XG4gICAgICAgICAgICAgICAgcHJvY2Vzc011bHRpUG9seWdvbihnZW9tZXRyeS5jb29yZGluYXRlcywgcHJvcGVydGllcywgcmVsYXRpb25zLCB3YXlzLCBub2Rlcywgbm9kZXNJbmRleClcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwidW5rbm93biBvciB1bnN1cHBvcnRlZCBnZW9tZXRyeSB0eXBlOlwiLCBnZW9tZXRyeS50eXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgIH0pO1xuXG4gICAgLy9jb25zb2xlLmxvZyhub2Rlcywgd2F5cywgcmVsYXRpb25zKVxuICAgIHZhciBsYXN0Tm9kZUlkID0gLTEsXG4gICAgICAgIGxhc3RXYXlJZCA9IC0xLFxuICAgICAgICBsYXN0UmVsYXRpb25JZCA9IC0xXG4gICAgZnVuY3Rpb24ganhvblRhZ3ModGFncykge1xuICAgICAgICB2YXIgcmVzID0gW11cbiAgICAgICAgZm9yICh2YXIgayBpbiB0YWdzKSB7XG4gICAgICAgICAgICByZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgXCJAa1wiOiBrLFxuICAgICAgICAgICAgICAgIFwiQHZcIjogdGFnc1trXVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzXG4gICAgfVxuICAgIHZhciBqeG9uRGF0YSA9IHtcbiAgICAgICAgb3NtOiB7XG4gICAgICAgICAgICBcIkB2ZXJzaW9uXCI6IFwiMC42XCIsXG4gICAgICAgICAgICBcIkBnZW5lcmF0b3JcIjogXCJnZW9qc29udG9vc21cIixcbiAgICAgICAgICAgIFwibm9kZVwiOiBub2Rlcy5tYXAoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgICAgIG5vZGUuaWQgPSBsYXN0Tm9kZUlkLS1cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBcIkBpZFwiOiBub2RlLmlkLFxuICAgICAgICAgICAgICAgICAgICBcIkBsYXRcIjogbm9kZS5sYXQsXG4gICAgICAgICAgICAgICAgICAgIFwiQGxvblwiOiBub2RlLmxvbixcbiAgICAgICAgICAgICAgICAgICAgLy8gdG9kbzogbWV0YVxuICAgICAgICAgICAgICAgICAgICBcInRhZ1wiOiBqeG9uVGFncyhub2RlLnRhZ3MpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBcIndheVwiOiB3YXlzLm1hcChmdW5jdGlvbih3YXkpIHtcbiAgICAgICAgICAgICAgICB3YXkuaWQgPSBsYXN0V2F5SWQtLVxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIFwiQGlkXCI6IHdheS5pZCxcbiAgICAgICAgICAgICAgICAgICAgXCJuZFwiOiB3YXkubm9kZXMubWFwKGZ1bmN0aW9uKG5kKSB7IHJldHVybiB7XCJAcmVmXCI6IG5kLmlkfSB9KSxcbiAgICAgICAgICAgICAgICAgICAgXCJ0YWdcIjoganhvblRhZ3Mod2F5LnRhZ3MpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBcInJlbGF0aW9uXCI6IHJlbGF0aW9ucy5tYXAoZnVuY3Rpb24ocmVsYXRpb24pIHtcbiAgICAgICAgICAgICAgICByZWxhdGlvbi5pZCA9IGxhc3RSZWxhdGlvbklkLS1cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBcIkBpZFwiOiByZWxhdGlvbi5pZCxcbiAgICAgICAgICAgICAgICAgICAgXCJtZW1iZXJcIjogcmVsYXRpb24ubWVtYmVycy5tYXAoZnVuY3Rpb24obWVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIjogbWVtYmVyLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJAcmVmXCI6IG1lbWJlci5lbGVtLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQHJvbGVcIjogbWVtYmVyLnJvbGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgIFwidGFnXCI6IGp4b25UYWdzKHJlbGF0aW9uLnRhZ3MpXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvZG86IG1ldGFcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IFxuICAgIH1cbiAgICAvLyB0b2RvOiBzb3J0IGJ5IGlkXG4gICAgcmV0dXJuIGp4b24uanNUb1N0cmluZyhqeG9uRGF0YSlcbn1cblxuZnVuY3Rpb24gZ2V0Tm9kZUhhc2goY29vcmRzKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGNvb3Jkcylcbn1cbmZ1bmN0aW9uIGVtcHR5Tm9kZShjb29yZGluYXRlcywgcHJvcGVydGllcykge1xuICAgIHJldHVybiB7XG4gICAgICAgIHRhZ3M6IHByb3BlcnRpZXMsXG4gICAgICAgIGxhdDogY29vcmRpbmF0ZXNbMV0sXG4gICAgICAgIGxvbjogY29vcmRpbmF0ZXNbMF1cbiAgICB9XG4gICAgLy8gdG9kbzogbWV0YVxuICAgIC8vIHRvZG86IG1vdmUgXCJub2Rlc0luZGV4W2hhc2hdID0gbm9kZVwiIGhlcmVcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc1BvaW50KGNvb3JkaW5hdGVzLCBwcm9wZXJ0aWVzLCBub2Rlcywgbm9kZXNJbmRleCkge1xuICAgIHZhciBoYXNoID0gZ2V0Tm9kZUhhc2goY29vcmRpbmF0ZXMpLFxuICAgICAgICBub2RlXG4gICAgaWYgKCEobm9kZSA9IG5vZGVzSW5kZXhbaGFzaF0pKSB7XG4gICAgICAgIG5vZGVzLnB1c2gobm9kZSA9IGVtcHR5Tm9kZShjb29yZGluYXRlcywgcHJvcGVydGllcykpXG4gICAgICAgIG5vZGVzSW5kZXhbaGFzaF0gPSBub2RlXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgayBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICBub2RlLnRhZ3Nba10gPSBwcm9wZXJ0aWVzW2tdXG4gICAgICAgIH1cbiAgICAgICAgLy8gdG9kbzogbWV0YVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0xpbmVTdHJpbmcoY29vcmRpbmF0ZXMsIHByb3BlcnRpZXMsIHdheXMsIG5vZGVzLCBub2Rlc0luZGV4KSB7XG4gICAgdmFyIHdheSA9IHtcbiAgICAgICAgdGFnczogcHJvcGVydGllcyxcbiAgICAgICAgbm9kZXM6IFtdXG4gICAgfVxuICAgIHdheXMucHVzaCh3YXkpXG4gICAgLy8gdG9kbzogbWV0YVxuICAgIGNvb3JkaW5hdGVzLmZvckVhY2goZnVuY3Rpb24ocG9pbnQpIHtcbiAgICAgICAgdmFyIGhhc2ggPSBnZXROb2RlSGFzaChwb2ludCksXG4gICAgICAgICAgICBub2RlXG4gICAgICAgIGlmICghKG5vZGUgPSBub2Rlc0luZGV4W2hhc2hdKSkge1xuICAgICAgICAgICAgbm9kZXMucHVzaChub2RlID0gZW1wdHlOb2RlKHBvaW50LCB7fSkpXG4gICAgICAgICAgICBub2Rlc0luZGV4W2hhc2hdID0gbm9kZVxuICAgICAgICB9XG4gICAgICAgIHdheS5ub2Rlcy5wdXNoKG5vZGUpXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc011bHRpUG9seWdvbihjb29yZGluYXRlcywgcHJvcGVydGllcywgcmVsYXRpb25zLCB3YXlzLCBub2Rlcywgbm9kZXNJbmRleCkge1xuICAgIC8vIHNpbXBsZSBhcmVhIHdpdGggb25seSAxIHJpbmc6IC0+IGNsb3NlZCB3YXlcbiAgICBpZiAoY29vcmRpbmF0ZXMubGVuZ3RoID09PSAxICYmIGNvb3JkaW5hdGVzWzBdLmxlbmd0aCA9PT0gMSlcbiAgICAgICAgcmV0dXJuIHByb2Nlc3NMaW5lU3RyaW5nKGNvb3JkaW5hdGVzWzBdWzBdLCBwcm9wZXJ0aWVzLCB3YXlzLCBub2Rlcywgbm9kZXNJbmRleClcbiAgICAvLyBtdWx0aXBvbHlnb25cbiAgICB2YXIgcmVsYXRpb24gPSB7XG4gICAgICAgIHRhZ3M6IHByb3BlcnRpZXMsXG4gICAgICAgIG1lbWJlcnM6IFtdXG4gICAgfVxuICAgIHJlbGF0aW9uLnRhZ3NbXCJ0eXBlXCJdID0gXCJtdWx0aXBvbHlnb25cIlxuICAgIHJlbGF0aW9ucy5wdXNoKHJlbGF0aW9uKVxuICAgIC8vIHRvZG86IG1ldGFcbiAgICBjb29yZGluYXRlcy5mb3JFYWNoKGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgICAgICAgcG9seWdvbi5mb3JFYWNoKGZ1bmN0aW9uKHJpbmcsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgd2F5ID0ge1xuICAgICAgICAgICAgICAgIHRhZ3M6IHt9LFxuICAgICAgICAgICAgICAgIG5vZGVzOiBbXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2F5cy5wdXNoKHdheSlcbiAgICAgICAgICAgIHJlbGF0aW9uLm1lbWJlcnMucHVzaCh7XG4gICAgICAgICAgICAgICAgZWxlbTogd2F5LFxuICAgICAgICAgICAgICAgIHR5cGU6IFwid2F5XCIsXG4gICAgICAgICAgICAgICAgcm9sZTogaW5kZXg9PT0wID8gXCJvdXRlclwiIDogXCJpbm5lclwiXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmluZy5mb3JFYWNoKGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhc2ggPSBnZXROb2RlSGFzaChwb2ludCksXG4gICAgICAgICAgICAgICAgICAgIG5vZGVcbiAgICAgICAgICAgICAgICBpZiAoIShub2RlID0gbm9kZXNJbmRleFtoYXNoXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZXMucHVzaChub2RlID0gZW1wdHlOb2RlKHBvaW50LCB7fSkpXG4gICAgICAgICAgICAgICAgICAgIG5vZGVzSW5kZXhbaGFzaF0gPSBub2RlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdheS5ub2Rlcy5wdXNoKG5vZGUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH0pXG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2VvanNvbnRvb3NtO1xuIiwiLypcbiAqIEpYT04gZnJhbWV3b3JrIC0gQ29weWxlZnQgMjAxMSBieSBNb3ppbGxhIERldmVsb3BlciBOZXR3b3JrXG4gKlxuICogUmV2aXNpb24gIzEgLSBTZXB0ZW1iZXIgNSwgMjAxNFxuICpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvSlhPTlxuICpcbiAqIFRoaXMgZnJhbWV3b3JrIGlzIHJlbGVhc2VkIHVuZGVyIHRoZSBHTlUgUHVibGljIExpY2Vuc2UsIHZlcnNpb24gMyBvciBsYXRlci5cbiAqIGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy9ncGwtMy4wLXN0YW5kYWxvbmUuaHRtbFxuICpcbiAqIHNtYWxsIG1vZGlmaWNhdGlvbnMgcGVyZm9ybWVkIGJ5IHRoZSBpRCBwcm9qZWN0OlxuICogaHR0cHM6Ly9naXRodWIuY29tL29wZW5zdHJlZXRtYXAvaUQvY29tbWl0cy8xOGFhMzNiYTk3YjUyY2FjZjQ1NGU5NWM2NWQxNTQwMDBlMDUyYTFmL2pzL2xpYi9qeG9uLmpzXG4gKlxuICogc21hbGwgbW9kaWZpY2F0aW9ucyBwZXJmb3JtZWQgYnkgdXNlciBAYnVncmVwb3J0MFxuICogaHR0cHM6Ly9naXRodWIuY29tL3R5cmFzZC9KWE9OL3B1bGwvMi9jb21taXRzXG4gKlxuICogc29tZSBhZGRpdGlvbnMgYW5kIG1vZGlmaWNhdGlvbnMgYnkgdXNlciBAaWdvcmRcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS90eXJhc2QvSlhPTi9wdWxsLzUvY29tbWl0c1xuICpcbiAqIGFkYXB0ZWQgZm9yIG5vZGVqcyBhbmQgbnBtIGJ5IE1hcnRpbiBSYWlmZXIgPHR5ci5hc2RAZ21haWwuY29tPlxuICovXG5cbiAvKlxuICAqIE1vZGlmaWNhdGlvbnM6XG4gICogLSBhZGRlZCBjb25maWcgbWV0aG9kIHRoYXQgZXhjZXB0cyBvYmplY3RzIHdpdGggcHJvcHM6XG4gICogICAtIHZhbHVlS2V5IChkZWZhdWx0OiBrZXlWYWx1ZSlcbiAgKiAgIC0gYXR0cktleSAoZGVmYXVsdDoga2V5QXR0cmlidXRlcylcbiAgKiAgIC0gYXR0clByZWZpeCAoZGVmYXVsdDogQClcbiAgKiAgIC0gbG93ZXJDYXNlVGFncyAoZGVmYXVsdDogdHJ1ZSlcbiAgKiAgIC0gdHJ1ZUlzRW1wdHkgKGRlZmF1bHQ6IHRydWUpXG4gICogICAtIGF1dG9EYXRlIChkZWZhdWx0OiB0cnVlKVxuICAqIC0gdHVybmluZyB0YWcgYW5kIGF0dHJpYnV0ZXMgdG8gbG93ZXIgY2FzZSBpcyBvcHRpb25hbFxuICAqIC0gb3B0aW9uYWwgdHVybmluZyBib29sZWFuIHRydWUgdG8gZW1wdHkgdGFnXG4gICogLSBhdXRvIERhdGUgcGFyc2luZyBpcyBvcHRpb25hbFxuICAqIC0gYWRkZWQgcGFyc2VYbWwgbWV0aG9kXG4gICpcbiovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuICAgICAgICBkZWZpbmUoZmFjdG9yeSh3aW5kb3cpKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgd2luZG93LkRPTUltcGxlbWVudGF0aW9uKSB7XG4gICAgICAgICAgICAvLyBCcm93c2VyaWZ5LiBoYXJkY29kZSB1c2FnZSBvZiBicm93c2VyJ3Mgb3duIFhNTERvbSBpbXBsZW1lbnRhdGlvblxuICAgICAgICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90eXJhc2Qvanhvbi9pc3N1ZXMvMThcbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSh3aW5kb3cpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTm9kZS4gRG9lcyBub3Qgd29yayB3aXRoIHN0cmljdCBDb21tb25KUywgYnV0XG4gICAgICAgICAgICAvLyBvbmx5IENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cyxcbiAgICAgICAgICAgIC8vIGxpa2UgTm9kZS5cbiAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCd4bWxkb20nKSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBCcm93c2VyIGdsb2JhbHMgKHJvb3QgaXMgd2luZG93KVxuICAgICAgICByb290LkpYT04gPSBmYWN0b3J5KHdpbmRvdyk7XG4gICAgfVxufSh0aGlzLCBmdW5jdGlvbiAoeG1sRG9tKSB7XG5cbiAgICByZXR1cm4gbmV3IChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXJcbiAgICAgICAgc1ZhbFByb3AgPSBcImtleVZhbHVlXCIsXG4gICAgICAgIHNBdHRyUHJvcCA9IFwia2V5QXR0cmlidXRlc1wiLFxuICAgICAgICBzQXR0cnNQcmVmID0gXCJAXCIsXG4gICAgICAgIHNMb3dDYXNlID0gdHJ1ZSxcbiAgICAgICAgc0VtcHR5VHJ1ZSA9IHRydWUsXG4gICAgICAgIHNBdXRvRGF0ZSA9IHRydWUsXG4gICAgICAgIHNJZ25vcmVQcmVmaXhlZCA9IGZhbHNlLFxuICAgICAgICBwYXJzZXJFcnJvckhhbmRsZXIsXG4gICAgICAgIERPTVBhcnNlcixcbiAgICAgICAgc1BhcnNlVmFsdWVzID0gdHJ1ZSwgLyogeW91IGNhbiBjdXN0b21pemUgdGhlc2UgdmFsdWVzICovXG4gICAgICAgIGFDYWNoZSA9IFtdLCBySXNOdWxsID0gL15cXHMqJC8sIHJJc0Jvb2wgPSAvXig/OnRydWV8ZmFsc2UpJC9pO1xuXG4gICAgICBmdW5jdGlvbiBwYXJzZVRleHQgKHNWYWx1ZSkge1xuICAgICAgICBpZiAoIXNQYXJzZVZhbHVlcykgcmV0dXJuIHNWYWx1ZTtcbiAgICAgICAgaWYgKHJJc051bGwudGVzdChzVmFsdWUpKSB7IHJldHVybiBudWxsOyB9XG4gICAgICAgIGlmIChySXNCb29sLnRlc3Qoc1ZhbHVlKSkgeyByZXR1cm4gc1ZhbHVlLnRvTG93ZXJDYXNlKCkgPT09IFwidHJ1ZVwiOyB9XG4gICAgICAgIGlmIChpc0Zpbml0ZShzVmFsdWUpKSB7IHJldHVybiBwYXJzZUZsb2F0KHNWYWx1ZSk7IH1cbiAgICAgICAgaWYgKHNBdXRvRGF0ZSAmJiBpc0Zpbml0ZShEYXRlLnBhcnNlKHNWYWx1ZSkpKSB7IHJldHVybiBuZXcgRGF0ZShzVmFsdWUpOyB9XG4gICAgICAgIHJldHVybiBzVmFsdWU7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIEVtcHR5VHJlZSAoKSB7IH1cbiAgICAgIEVtcHR5VHJlZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBcIm51bGxcIjsgfTtcbiAgICAgIEVtcHR5VHJlZS5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG51bGw7IH07XG5cbiAgICAgIGZ1bmN0aW9uIG9iamVjdGlmeSAodlZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2VmFsdWUgPT09IG51bGwgPyBuZXcgRW1wdHlUcmVlKCkgOiB2VmFsdWUgaW5zdGFuY2VvZiBPYmplY3QgPyB2VmFsdWUgOiBuZXcgdlZhbHVlLmNvbnN0cnVjdG9yKHZWYWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNyZWF0ZU9ialRyZWUgKG9QYXJlbnROb2RlLCBuVmVyYiwgYkZyZWV6ZSwgYk5lc3RlQXR0cikge1xuICAgICAgICB2YXJcbiAgICAgICAgICBuTGV2ZWxTdGFydCA9IGFDYWNoZS5sZW5ndGgsIGJDaGlsZHJlbiA9IG9QYXJlbnROb2RlLmhhc0NoaWxkTm9kZXMoKSxcbiAgICAgICAgICBiQXR0cmlidXRlcyA9IG9QYXJlbnROb2RlLm5vZGVUeXBlID09PSBvUGFyZW50Tm9kZS5FTEVNRU5UX05PREUgJiYgb1BhcmVudE5vZGUuaGFzQXR0cmlidXRlcygpLCBiSGlnaFZlcmIgPSBCb29sZWFuKG5WZXJiICYgMik7XG5cbiAgICAgICAgdmFyXG4gICAgICAgICAgc1Byb3AsIHZDb250ZW50LCBuTGVuZ3RoID0gMCwgc0NvbGxlY3RlZFR4dCA9IFwiXCIsXG4gICAgICAgICAgdlJlc3VsdCA9IGJIaWdoVmVyYiA/IHt9IDogLyogcHV0IGhlcmUgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIGVtcHR5IG5vZGVzOiAqLyAoc0VtcHR5VHJ1ZSA/IHRydWUgOiAnJyk7XG5cbiAgICAgICAgaWYgKGJDaGlsZHJlbikge1xuICAgICAgICAgIGZvciAodmFyIG9Ob2RlLCBuSXRlbSA9IDA7IG5JdGVtIDwgb1BhcmVudE5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IG5JdGVtKyspIHtcbiAgICAgICAgICAgIG9Ob2RlID0gb1BhcmVudE5vZGUuY2hpbGROb2Rlcy5pdGVtKG5JdGVtKTtcbiAgICAgICAgICAgIGlmIChvTm9kZS5ub2RlVHlwZSA9PT0gNCkgeyBzQ29sbGVjdGVkVHh0ICs9IG9Ob2RlLm5vZGVWYWx1ZTsgfSAvKiBub2RlVHlwZSBpcyBcIkNEQVRBU2VjdGlvblwiICg0KSAqL1xuICAgICAgICAgICAgZWxzZSBpZiAob05vZGUubm9kZVR5cGUgPT09IDMpIHsgc0NvbGxlY3RlZFR4dCArPSBvTm9kZS5ub2RlVmFsdWUudHJpbSgpOyB9IC8qIG5vZGVUeXBlIGlzIFwiVGV4dFwiICgzKSAqL1xuICAgICAgICAgICAgZWxzZSBpZiAob05vZGUubm9kZVR5cGUgPT09IDEgJiYgIShzSWdub3JlUHJlZml4ZWQgJiYgb05vZGUucHJlZml4KSkgeyBhQ2FjaGUucHVzaChvTm9kZSk7IH0gLyogbm9kZVR5cGUgaXMgXCJFbGVtZW50XCIgKDEpICovXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG5MZXZlbEVuZCA9IGFDYWNoZS5sZW5ndGgsIHZCdWlsdFZhbCA9IHBhcnNlVGV4dChzQ29sbGVjdGVkVHh0KTtcblxuICAgICAgICBpZiAoIWJIaWdoVmVyYiAmJiAoYkNoaWxkcmVuIHx8IGJBdHRyaWJ1dGVzKSkgeyB2UmVzdWx0ID0gblZlcmIgPT09IDAgPyBvYmplY3RpZnkodkJ1aWx0VmFsKSA6IHt9OyB9XG5cbiAgICAgICAgZm9yICh2YXIgbkVsSWQgPSBuTGV2ZWxTdGFydDsgbkVsSWQgPCBuTGV2ZWxFbmQ7IG5FbElkKyspIHtcbiAgICAgICAgICBzUHJvcCA9IGFDYWNoZVtuRWxJZF0ubm9kZU5hbWU7XG4gICAgICAgICAgaWYgKHNMb3dDYXNlKSBzUHJvcCA9IHNQcm9wLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgdkNvbnRlbnQgPSBjcmVhdGVPYmpUcmVlKGFDYWNoZVtuRWxJZF0sIG5WZXJiLCBiRnJlZXplLCBiTmVzdGVBdHRyKTtcbiAgICAgICAgICBpZiAodlJlc3VsdC5oYXNPd25Qcm9wZXJ0eShzUHJvcCkpIHtcbiAgICAgICAgICAgIGlmICh2UmVzdWx0W3NQcm9wXS5jb25zdHJ1Y3RvciAhPT0gQXJyYXkpIHsgdlJlc3VsdFtzUHJvcF0gPSBbdlJlc3VsdFtzUHJvcF1dOyB9XG4gICAgICAgICAgICB2UmVzdWx0W3NQcm9wXS5wdXNoKHZDb250ZW50KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdlJlc3VsdFtzUHJvcF0gPSB2Q29udGVudDtcbiAgICAgICAgICAgIG5MZW5ndGgrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYkF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICB2YXJcbiAgICAgICAgICAgIG5BdHRyTGVuID0gb1BhcmVudE5vZGUuYXR0cmlidXRlcy5sZW5ndGgsXG4gICAgICAgICAgICBzQVByZWZpeCA9IGJOZXN0ZUF0dHIgPyBcIlwiIDogc0F0dHJzUHJlZiwgb0F0dHJQYXJlbnQgPSBiTmVzdGVBdHRyID8ge30gOiB2UmVzdWx0O1xuXG4gICAgICAgICAgZm9yICh2YXIgb0F0dHJpYiwgb0F0dHJpYk5hbWUsIG5BdHRyaWIgPSAwOyBuQXR0cmliIDwgbkF0dHJMZW47IG5MZW5ndGgrKywgbkF0dHJpYisrKSB7XG4gICAgICAgICAgICBvQXR0cmliID0gb1BhcmVudE5vZGUuYXR0cmlidXRlcy5pdGVtKG5BdHRyaWIpO1xuICAgICAgICAgICAgb0F0dHJpYk5hbWUgPSBvQXR0cmliLm5hbWU7XG4gICAgICAgICAgICBpZiAoc0xvd0Nhc2UpIG9BdHRyaWJOYW1lID0gb0F0dHJpYk5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIG9BdHRyUGFyZW50W3NBUHJlZml4ICsgb0F0dHJpYk5hbWVdID0gcGFyc2VUZXh0KG9BdHRyaWIudmFsdWUudHJpbSgpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYk5lc3RlQXR0cikge1xuICAgICAgICAgICAgaWYgKGJGcmVlemUpIHsgT2JqZWN0LmZyZWV6ZShvQXR0clBhcmVudCk7IH1cbiAgICAgICAgICAgIHZSZXN1bHRbc0F0dHJQcm9wXSA9IG9BdHRyUGFyZW50O1xuICAgICAgICAgICAgbkxlbmd0aCAtPSBuQXR0ckxlbiAtIDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5WZXJiID09PSAzIHx8IChuVmVyYiA9PT0gMiB8fCBuVmVyYiA9PT0gMSAmJiBuTGVuZ3RoID4gMCkgJiYgc0NvbGxlY3RlZFR4dCkge1xuICAgICAgICAgIHZSZXN1bHRbc1ZhbFByb3BdID0gdkJ1aWx0VmFsO1xuICAgICAgICB9IGVsc2UgaWYgKCFiSGlnaFZlcmIgJiYgbkxlbmd0aCA9PT0gMCAmJiBzQ29sbGVjdGVkVHh0KSB7XG4gICAgICAgICAgdlJlc3VsdCA9IHZCdWlsdFZhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChiRnJlZXplICYmIChiSGlnaFZlcmIgfHwgbkxlbmd0aCA+IDApKSB7IE9iamVjdC5mcmVlemUodlJlc3VsdCk7IH1cblxuICAgICAgICBhQ2FjaGUubGVuZ3RoID0gbkxldmVsU3RhcnQ7XG5cbiAgICAgICAgcmV0dXJuIHZSZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGxvYWRPYmpUcmVlIChvWE1MRG9jLCBvUGFyZW50RWwsIG9QYXJlbnRPYmopIHtcbiAgICAgICAgdmFyIHZWYWx1ZSwgb0NoaWxkO1xuXG4gICAgICAgIGlmIChvUGFyZW50T2JqLmNvbnN0cnVjdG9yID09PSBTdHJpbmcgfHwgb1BhcmVudE9iai5jb25zdHJ1Y3RvciA9PT0gTnVtYmVyIHx8IG9QYXJlbnRPYmouY29uc3RydWN0b3IgPT09IEJvb2xlYW4pIHtcbiAgICAgICAgICBvUGFyZW50RWwuYXBwZW5kQ2hpbGQob1hNTERvYy5jcmVhdGVUZXh0Tm9kZShvUGFyZW50T2JqLnRvU3RyaW5nKCkpKTsgLyogdmVyYm9zaXR5IGxldmVsIGlzIDAgb3IgMSAqL1xuICAgICAgICAgIGlmIChvUGFyZW50T2JqID09PSBvUGFyZW50T2JqLnZhbHVlT2YoKSkgeyByZXR1cm47IH1cbiAgICAgICAgfSBlbHNlIGlmIChvUGFyZW50T2JqLmNvbnN0cnVjdG9yID09PSBEYXRlKSB7XG4gICAgICAgICAgb1BhcmVudEVsLmFwcGVuZENoaWxkKG9YTUxEb2MuY3JlYXRlVGV4dE5vZGUob1BhcmVudE9iai50b0dNVFN0cmluZygpKSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBzTmFtZSBpbiBvUGFyZW50T2JqKSB7XG4gICAgICAgICAgdlZhbHVlID0gb1BhcmVudE9ialtzTmFtZV07XG4gICAgICAgICAgaWYgKHZWYWx1ZSA9PT0gbnVsbCkgdlZhbHVlID0ge307XG4gICAgICAgICAgaWYgKGlzRmluaXRlKHNOYW1lKSB8fCB2VmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikgeyBjb250aW51ZTsgfSAvKiB2ZXJib3NpdHkgbGV2ZWwgaXMgMCAqL1xuICAgICAgICAgIC8vIHdoZW4gaXQgaXMgX1xuICAgICAgICAgIGlmIChzTmFtZSA9PT0gc1ZhbFByb3ApIHtcbiAgICAgICAgICAgIGlmICh2VmFsdWUgIT09IG51bGwgJiYgdlZhbHVlICE9PSB0cnVlKSB7IG9QYXJlbnRFbC5hcHBlbmRDaGlsZChvWE1MRG9jLmNyZWF0ZVRleHROb2RlKHZWYWx1ZS5jb25zdHJ1Y3RvciA9PT0gRGF0ZSA/IHZWYWx1ZS50b0dNVFN0cmluZygpIDogU3RyaW5nKHZWYWx1ZSkpKTsgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoc05hbWUgPT09IHNBdHRyUHJvcCkgeyAvKiB2ZXJib3NpdHkgbGV2ZWwgaXMgMyAqL1xuICAgICAgICAgICAgZm9yICh2YXIgc0F0dHJpYiBpbiB2VmFsdWUpIHsgb1BhcmVudEVsLnNldEF0dHJpYnV0ZShzQXR0cmliLCB2VmFsdWVbc0F0dHJpYl0pOyB9XG4gICAgICAgICAgfSBlbHNlIGlmIChzTmFtZSA9PT0gc0F0dHJzUHJlZisneG1sbnMnKSB7XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nOiBzcGVjaWFsIGhhbmRsaW5nIG9mIHhtbCBuYW1lc3BhY2VzIGlzIGRvbmUgdmlhIGNyZWF0ZUVsZW1lbnROUygpXG4gICAgICAgICAgfSBlbHNlIGlmIChzTmFtZS5jaGFyQXQoMCkgPT09IHNBdHRyc1ByZWYpIHtcbiAgICAgICAgICAgIG9QYXJlbnRFbC5zZXRBdHRyaWJ1dGUoc05hbWUuc2xpY2UoMSksIHZWYWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIGlmICh2VmFsdWUuY29uc3RydWN0b3IgPT09IEFycmF5KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBuSXRlbSA9IDA7IG5JdGVtIDwgdlZhbHVlLmxlbmd0aDsgbkl0ZW0rKykge1xuICAgICAgICAgICAgICBvQ2hpbGQgPSBvWE1MRG9jLmNyZWF0ZUVsZW1lbnROUyh2VmFsdWVbbkl0ZW1dW3NBdHRyc1ByZWYrJ3htbG5zJ10gfHwgb1BhcmVudEVsLm5hbWVzcGFjZVVSSSwgc05hbWUpO1xuICAgICAgICAgICAgICBsb2FkT2JqVHJlZShvWE1MRG9jLCBvQ2hpbGQsIHZWYWx1ZVtuSXRlbV0pO1xuICAgICAgICAgICAgICBvUGFyZW50RWwuYXBwZW5kQ2hpbGQob0NoaWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb0NoaWxkID0gb1hNTERvYy5jcmVhdGVFbGVtZW50TlMoKHZWYWx1ZSB8fCB7fSlbc0F0dHJzUHJlZisneG1sbnMnXSB8fCBvUGFyZW50RWwubmFtZXNwYWNlVVJJLCBzTmFtZSk7XG4gICAgICAgICAgICBpZiAodlZhbHVlIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgICAgICAgIGxvYWRPYmpUcmVlKG9YTUxEb2MsIG9DaGlsZCwgdlZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodlZhbHVlICE9PSBudWxsICYmIHZWYWx1ZSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICBvQ2hpbGQuYXBwZW5kQ2hpbGQob1hNTERvYy5jcmVhdGVUZXh0Tm9kZSh2VmFsdWUudG9TdHJpbmcoKSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghc0VtcHR5VHJ1ZSAmJiB2VmFsdWUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgb0NoaWxkLmFwcGVuZENoaWxkKG9YTUxEb2MuY3JlYXRlVGV4dE5vZGUodlZhbHVlLnRvU3RyaW5nKCkpKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb1BhcmVudEVsLmFwcGVuZENoaWxkKG9DaGlsZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMueG1sVG9KcyA9IHRoaXMuYnVpbGQgPSBmdW5jdGlvbiAob1hNTFBhcmVudCwgblZlcmJvc2l0eSAvKiBvcHRpb25hbCAqLywgYkZyZWV6ZSAvKiBvcHRpb25hbCAqLywgYk5lc3RlQXR0cmlidXRlcyAvKiBvcHRpb25hbCAqLykge1xuICAgICAgICB2YXIgX25WZXJiID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgdHlwZW9mIG5WZXJib3NpdHkgPT09IFwibnVtYmVyXCIgPyBuVmVyYm9zaXR5ICYgMyA6IC8qIHB1dCBoZXJlIHRoZSBkZWZhdWx0IHZlcmJvc2l0eSBsZXZlbDogKi8gMTtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZU9ialRyZWUob1hNTFBhcmVudCwgX25WZXJiLCBiRnJlZXplIHx8IGZhbHNlLCBhcmd1bWVudHMubGVuZ3RoID4gMyA/IGJOZXN0ZUF0dHJpYnV0ZXMgOiBfblZlcmIgPT09IDMpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5qc1RvWG1sID0gdGhpcy51bmJ1aWxkID0gZnVuY3Rpb24gKG9PYmpUcmVlLCBzTmFtZXNwYWNlVVJJIC8qIG9wdGlvbmFsICovLCBzUXVhbGlmaWVkTmFtZSAvKiBvcHRpb25hbCAqLywgb0RvY3VtZW50VHlwZSAvKiBvcHRpb25hbCAqLykge1xuICAgICAgICB2YXIgZG9jdW1lbnRJbXBsZW1lbnRhdGlvbiA9IHhtbERvbS5kb2N1bWVudCAmJiB4bWxEb20uZG9jdW1lbnQuaW1wbGVtZW50YXRpb24gfHwgbmV3IHhtbERvbS5ET01JbXBsZW1lbnRhdGlvbigpO1xuICAgICAgICB2YXIgb05ld0RvYyA9IGRvY3VtZW50SW1wbGVtZW50YXRpb24uY3JlYXRlRG9jdW1lbnQoc05hbWVzcGFjZVVSSSB8fCBudWxsLCBzUXVhbGlmaWVkTmFtZSB8fCBcIlwiLCBvRG9jdW1lbnRUeXBlIHx8IG51bGwpO1xuICAgICAgICBsb2FkT2JqVHJlZShvTmV3RG9jLCBvTmV3RG9jLmRvY3VtZW50RWxlbWVudCB8fCBvTmV3RG9jLCBvT2JqVHJlZSk7XG4gICAgICAgIHJldHVybiBvTmV3RG9jO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5jb25maWcgPSBmdW5jdGlvbihvKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdmFsdWVLZXk6IHNWYWxQcm9wLFxuICAgICAgICAgICAgICAgIGF0dHJLZXk6IHNBdHRyUHJvcCxcbiAgICAgICAgICAgICAgICBhdHRyUHJlZml4OiBzQXR0cnNQcmVmLFxuICAgICAgICAgICAgICAgIGxvd2VyQ2FzZVRhZ3M6IHNMb3dDYXNlLFxuICAgICAgICAgICAgICAgIHRydWVJc0VtcHR5OiBzRW1wdHlUcnVlLFxuICAgICAgICAgICAgICAgIGF1dG9EYXRlOiBzQXV0b0RhdGUsXG4gICAgICAgICAgICAgICAgaWdub3JlUHJlZml4Tm9kZXM6IHNJZ25vcmVQcmVmaXhlZCxcbiAgICAgICAgICAgICAgICBwYXJzZVZhbHVlczogc1BhcnNlVmFsdWVzLFxuICAgICAgICAgICAgICAgIHBhcnNlckVycm9ySGFuZGxlcjogcGFyc2VyRXJyb3JIYW5kbGVyXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGsgaW4gbykge1xuICAgICAgICAgIHN3aXRjaChrKSB7XG4gICAgICAgICAgICBjYXNlICd2YWx1ZUtleSc6XG4gICAgICAgICAgICAgIHNWYWxQcm9wID0gby52YWx1ZUtleTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdhdHRyS2V5JzpcbiAgICAgICAgICAgICAgc0F0dHJQcm9wID0gby5hdHRyS2V5O1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2F0dHJQcmVmaXgnOlxuICAgICAgICAgICAgICBzQXR0cnNQcmVmID0gby5hdHRyUHJlZml4O1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2xvd2VyQ2FzZVRhZ3MnOlxuICAgICAgICAgICAgICBzTG93Q2FzZSA9IG8ubG93ZXJDYXNlVGFncztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0cnVlSXNFbXB0eSc6XG4gICAgICAgICAgICAgIHNFbXB0eVRydWUgPSBvLnRydWVJc0VtcHR5O1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2F1dG9EYXRlJzpcbiAgICAgICAgICAgICAgc0F1dG9EYXRlID0gby5hdXRvRGF0ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdpZ25vcmVQcmVmaXhlZE5vZGVzJzpcbiAgICAgICAgICAgICAgc0lnbm9yZVByZWZpeGVkID0gby5pZ25vcmVQcmVmaXhlZE5vZGVzO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3BhcnNlVmFsdWVzJzpcbiAgICAgICAgICAgICAgc1BhcnNlVmFsdWVzID0gby5wYXJzZVZhbHVlcztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwYXJzZXJFcnJvckhhbmRsZXInOlxuICAgICAgICAgICAgICBwYXJzZXJFcnJvckhhbmRsZXIgPSBvLnBhcnNlckVycm9ySGFuZGxlcjtcbiAgICAgICAgICAgICAgRE9NUGFyc2VyID0gbmV3IHhtbERvbS5ET01QYXJzZXIoe1xuICAgICAgICAgICAgICAgICAgZXJyb3JIYW5kbGVyOiBwYXJzZXJFcnJvckhhbmRsZXIsXG4gICAgICAgICAgICAgICAgICBsb2NhdG9yOiB7fVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHRoaXMuc3RyaW5nVG9YbWwgPSBmdW5jdGlvbih4bWxTdHIpIHtcbiAgICAgICAgaWYgKCFET01QYXJzZXIpIERPTVBhcnNlciA9IG5ldyB4bWxEb20uRE9NUGFyc2VyKCk7XG4gICAgICAgIHJldHVybiBET01QYXJzZXIucGFyc2VGcm9tU3RyaW5nKHhtbFN0ciwgJ2FwcGxpY2F0aW9uL3htbCcpO1xuICAgICAgfTtcblxuICAgICAgdGhpcy54bWxUb1N0cmluZyA9IGZ1bmN0aW9uICh4bWxPYmopIHtcbiAgICAgICAgaWYgKHR5cGVvZiB4bWxPYmoueG1sICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgcmV0dXJuIHhtbE9iai54bWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIChuZXcgeG1sRG9tLlhNTFNlcmlhbGl6ZXIoKSkuc2VyaWFsaXplVG9TdHJpbmcoeG1sT2JqKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdGhpcy5zdHJpbmdUb0pzID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHZhciB4bWxPYmogPSB0aGlzLnN0cmluZ1RvWG1sKHN0cik7XG4gICAgICAgIHJldHVybiB0aGlzLnhtbFRvSnMoeG1sT2JqKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuanNUb1N0cmluZyA9IHRoaXMuc3RyaW5naWZ5ID0gZnVuY3Rpb24ob09ialRyZWUsIHNOYW1lc3BhY2VVUkkgLyogb3B0aW9uYWwgKi8sIHNRdWFsaWZpZWROYW1lIC8qIG9wdGlvbmFsICovLCBvRG9jdW1lbnRUeXBlIC8qIG9wdGlvbmFsICovKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnhtbFRvU3RyaW5nKFxuICAgICAgICAgIHRoaXMuanNUb1htbChvT2JqVHJlZSwgc05hbWVzcGFjZVVSSSwgc1F1YWxpZmllZE5hbWUsIG9Eb2N1bWVudFR5cGUpXG4gICAgICAgICk7XG4gICAgICB9O1xuICAgIH0pKCk7XG5cbn0pKTtcbiJdfQ==
