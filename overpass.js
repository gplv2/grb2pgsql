// vim: tabstop=4:softtabstop=4:shiftwidth=4:noexpandtab

var overpassapi = "http://overpass-api.de/api/interpreter?data=";

var osmInfo = []; // list of all addresses returned by overpass
var streets = []; // list of streets with the addresses divided in several categories + extra info
	
/**
 * Get the data from osm, ret should be an empty array
 */
function getOsmInfo() {
	finished[streets.length] = false;
	var streetsFilter = getStreetsFilter();
	var tagSet = '[~"^addr:(official_)?housenumber$"~".*"]';
	if (streetsFilter)
		tagSet += '["addr:street"~"^' + streetsFilter + '$"]';
	else
		tagSet += '["addr:street"]';
	var pcode = getPcode();

	var pcodeQuery =  '["addr:postcode"="' + pcode + '"]';
	var noPcodeQuery = '["addr:postcode"!~"."]';

	var query = 
		'[out:json];'+
		'area["boundary"="postal_code"]["postal_code"="' + pcode + '"]->.area;'+
		'('+
			'node' + tagSet + noPcodeQuery + '(area.area);'+
			'way' + tagSet + noPcodeQuery + '(area.area);'+
			'relation' + tagSet + noPcodeQuery + '(area.area);'+
			'node' + tagSet + pcodeQuery + '(area.area);'+
			'way' + tagSet + pcodeQuery + '(area.area);'+
			'relation' + tagSet + pcodeQuery + '(area.area);'+
		');'+
		'out center;'

	var req = new XMLHttpRequest();
	req.onreadystatechange = function()
	{
		switch(req.readyState) {
			case 0:
				// 0: request not initialized 
					overpasserror.innerHTML = 'Overpass request not initialized';
					break;
			case 1:
				// 1: server connection established
					overpasserror.innerHTML = 'Overpass server connection established';
					break;
			case 2:
				// 2: request received 
					overpasserror.innerHTML = 'Overpass request received';
					break;
			case 3:
				// 3: processing request 
					overpasserror.innerHTML = 'Overpass processing request';
					break;
			case 4:
				// 4: request finished and response is ready
					overpasserror.innerHTML = 'Overpass request finished and response is ready';
					break;
			default:
					overpasserror.innerHTML = 'Overpass Unknown status';
				// unknown status
		}
		if (req.readyState != 4)
			return;
		if (req.status != 200) {
	        overpasserror.innerHTML = 'non "HTTP 200 OK" status: ' + req.status ;
			return;
        }
		var data = JSON.parse(req.responseText).elements;
		for (var i = 0; i < data.length; i++)
		{
			var addr = {};
			var d = data[i];
			addr.lat = d.lat || (d.center && d.center.lat);
			addr.lon = d.lon || (d.center && d.center.lon);

			addr.housenumber = d.tags["addr:housenumber"];
			addr.official_housenumber = d.tags["addr:official_housenumber"];
			addr.street = d.tags["addr:street"];
			osmInfo.push(addr);
		}
		finished[streets.length] = true;
		//finishLoading();
	}
	console.log("Overpass query:\n" + query);
	req.open("GET", overpassapi + encodeURIComponent(query), true);
	req.send(null);
}

// REMOTECONTROL BINDINGS
function openInJosm(type, streetData, layerName)
{

	var url =  "http://localhost:8111/load_data?new_layer=true&layer_name="+layerName+"&data=";
	var xml = getOsmXml(type, streetData);

	var req = new XMLHttpRequest();
	req.onreadystatechange = function()
	{
		if (req.readyState == 4 && req.status == 400)
			// something went wrong. Alert the user with appropriate messages
			testJosmVersion();
	}
	req.open("GET", url + encodeURIComponent(xml), true);
	req.send(null);
}

function openStreetInJosm(streetNumber)
{
	var street = streets[streetNumber];
	// Get the BBOX of the addresses in the street, and add some margins
	var link = "http://localhost:8111/load_and_zoom"+
		"?left=" + (street.l - 0.001) +
		"&right=" + (street.r + 0.001) +
		"&top=" + (street.t + 0.0005) +
		"&bottom=" + (street.b - 0.0005);

	var req = new XMLHttpRequest();
	req.open("GET", link, true);
	req.send(null);
}

function testJosmVersion() {
	var req = new XMLHttpRequest();
	req.open("GET", "http://localhost:8111/version", true);
	req.send(null);
	req.onreadystatechange = function()
	{
		if (req.readyState != 4)
			return;
		var version = JSON.parse(req.responseText).protocolversion;
		if (version.minor < 6)
			alert("Your JOSM installation does not yet support load_data requests. Please update JOSM to version 7643 or newer");
	}
}

function escapeXML(str)
{
	return str.replace(/&/g, "&amp;")
		.replace(/'/g, "&apos;")
		.replace(/>/g, "&gt;")
		.replace(/</g, "&lt;");
}
