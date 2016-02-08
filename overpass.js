// vim: tabstop=4:softtabstop=4:shiftwidth=4:noexpandtab

var overpassapi = "http://overpass-api.de/api/interpreter?data=";

var osmInfo = [];
var streets = []; // list of streets with the addresses divided in several categories + extra info
	
/**
 * Get the data from osm, ret should be an empty array
 */
function getOsmInfo() {
       var osmInfo = []; 
       var webmercator  = new OpenLayers.Projection("EPSG:3857");
       var geodetic     = new OpenLayers.Projection("EPSG:4326");
       var mercator     = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection

	 $('#msg').removeClass().addClass("notice info");

        var bounds = map.getExtent();
	bounds.transform(map.getProjectionObject(), geodetic);
	//bounds.toBBOX(); 
        console.log(bounds.toBBOX());

	var query = "<osm-script output=\"json\" timeout=\"250\">" +
                    "  <union>" +
                    "    <query type=\"way\">" +
                    "      <has-kv k=\"source:geometry:oidn\"/>" +
                    "      <bbox-query e=\"" + bounds.right + "\" n=\"" + bounds.top + "\" s=\"" + bounds.bottom + "\" w=\"" + bounds.left + "\"/>" +
                    "    </query>" +
                    "  </union>" +
                    "  <union>" +
                    "    <item/>" +
                    "    <recurse type=\"down\"/>" +
                    "  </union>" +
                    "  <print mode=\"meta\"/>" +
                    "</osm-script>";

	var req = new XMLHttpRequest();
	var overpasserror = "";
	req.onreadystatechange = function()
	{
		switch(req.readyState) {
			case 0:
				// 0: request not initialized 
					overpasserror = 'Overpass request not initialized';
					break;
			case 1:
				// 1: server connection established
					overpasserror = 'Overpass server connection established';
					break;
			case 2:
				// 2: request received 
					overpasserror = 'Overpass request received';
					break;
			case 3:
				// 3: processing request 
					overpasserror = 'Overpass processing request';
					break;
			case 4:
				// 4: request finished and response is ready
					overpasserror = 'Overpass request finished and response is ready';
					break;
			default:
					overpasserror = 'Overpass Unknown status';
				// unknown status
		}
		$("#msg").html("Info : "+ overpasserror);

		if (req.readyState != 4)
			return;
		if (req.status != 200) {
	        	overpasserror = 'non "HTTP 200 OK" status: ' + req.status ;
			$("#msg").switchClass( "info", "error", 200, "easeInOutQuad" ).html("Error : "+ overpasserror).switchClass( "info", "error", 1000, "easeInOutQuad" );
			return;
        	}

		//console.log(req.responseText);
		var data = JSON.parse(req.responseText).elements;
		for (var i = 0; i < data.length; i++)
		{
			var addr = {};
			var d = data[i];
			addr.lat = d.lat || (d.center && d.center.lat);
			addr.lon = d.lon || (d.center && d.center.lon);

			// addr.housenumber = d.tags["addr:housenumber"];
			// addr.official_housenumber = d.tags["addr:official_housenumber"];
			// addr.street = d.tags["addr:street"];
			osmInfo.push(d.tabs);
		}
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
	$.ajax({
		url: "//localhost:8111/version",
		dataType: "json",
		timeout: 5000 // 5 second wait
        }).done(function (data) {
		//console.log(data);
		var version = data.protocolversion;
		if (version.minor < 6) {
	 		$('#msg').removeClass().addClass("notice error").html("Your JOSM installation does not yet support load_data requests. Please update JOSM to version 7643 or newer");
		} else {
	 		$('#msg').removeClass().addClass("notice success").html("JOSM minor version " + version.minor);
		}
	}).fail(function (jqXHR, textStatus, errorThrown) {
	        $('#msg').removeClass().addClass("notice error").html("Fail to get JOSM version using remote control, is it running ?");
		//console.log(errorThrown);
         });

}

function escapeXML(str)
{
	return str.replace(/&/g, "&amp;")
		.replace(/'/g, "&apos;")
		.replace(/>/g, "&gt;")
		.replace(/</g, "&lt;");
}
