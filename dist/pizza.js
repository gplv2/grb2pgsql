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
            // Check each feature if it crosses another one, if so, do not simplify
/*
            console.log('Check for intersects with other objects');
            if (!checkIntersects(feature, features)) {
               console.log('This is a loose structure');
               var tolerance = 15;
               var simplified = mapshaper.simplify( feature, tolerance);
               if(gjcheck.valid(simplified)) {
                  // console.log('Simplified...');
                  // feature = simplified;
               }
            } else {
               console.log('We seem to share space, not simplifying');
            }
*/
            
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
            "@upload": "false",
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

/*
function checkIntersects(Feature, myFeatures) {
   // simple area with only 1 ring: -> closed way
   var intersects = null;

   if (myFeatures.length >= 1 ) {

      myFeatures.forEach(function(polygon) {
            intersects = turf.intersect(Feature, polygon);
            if (intersects) {
               return(intersects);
            } 
      });
   }
   return(intersects);
}*/

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