import { Router } from 'itty-router'

// Create a new router
const router = Router()
var caches = [
  ["osg.chic.nrp.internet2.edu:8000", [41.8882, -87.6164]],
  ["osg.kans.nrp.internet2.edu:8000", [39.1024, -94.5986]],
  ["osg-houston-stashcache.nrp.internet2.edu:8000", [29.8131, -95.3098]],
  ["osg.newy32aoa.nrp.internet2.edu:8000", [40.7145, -74.0029]],
  ["osg-sunnyvale-stashcache.nrp.internet2.edu:8000", [37.373779, -121.987513]],
  ["stashcache.t2.ucsd.edu:8000", [32.884310, -117.239614]],
  ["its-condor-xrootd1.syr.edu:8000", [43.0385961, -76.13268340000002]],
  ["stash-cache.osg.chtc.io:8000", [43.071568, -89.406931]],
  ["osg-gftp2.pace.gatech.edu:8000", [33.7758, -84.3947]]
];

/**
 * Respond with hello worker text
 * @param {Request} request
 */

router.get("/_caches", async request => {


  // Annotate some of the data
  let toReturn = {"city": request.cf.city, 
                  "latitude": request.cf.latitude, 
                  "longitude": request.cf.longitude, 
                  "postalCode": request.cf.postalCode, 
                  "region": request.cf.region,
                  "AITA": request.cf.colo};
  
  // Get the closest cache
  var cache_distance_return = await getClosestCaches(request);
  console.log(cache_distance_return);
  // Add to the returned json
  toReturn["caches"] = cache_distance_return.caches;
  toReturn["matched"] = cache_distance_return.matched;
  return new Response(JSON.stringify(toReturn), {
    headers: { 'content-type': 'application/json' },
  });
});

// getClosestCaches returns an ordered list of caches, nearest to the request first
// and returns the method for calculating the nearest cache
// Returns: {caches: array of caches, matched: string}
async function getClosestCaches(request) {
  let matched = ""
  let cache_distance = new Array();
  
  if (request.cf.city != undefined) {
    // For each of the caches, find the distance
    caches.forEach(function(cache) {
      let distance = Math.abs(getDistanceFromLatLonInKm(request.cf.latitude, request.cf.longitude, cache[1][0], cache[1][1]));
      cache_distance.push([cache[0], distance]);
    });
    cache_distance.sort(function(a, b) {
      return a[1] - b[1];
    });

    matched = "Using lat/log from GeoIP";
  
  } else if (request.cf.colo != undefined) {
    // Get the lat/log from the KV
    let lat_log = await AirportCodes.get(request.cf.colo);
    if (lat_log != null) {
      let split_lat_log = lat_log.split(",");
      let lat = parseFloat(split_lat_log[0]);
      let long = parseFloat(split_lat_log[1]);
      if (lat != 0 || long != 0) {
        caches.forEach(function(cache) {
          let distance = Math.abs(getDistanceFromLatLonInKm(lat, long, cache[1][0], cache[1][1]));
          cache_distance.push([cache[0], distance]);
        });
        cache_distance.sort(function(a, b) {
          return a[1] - b[1];
        });
      }
    }

    matched = "Using lat/log from Airport Code";
  }

  if (cache_distance.length == 0) {
    // if city is undefined, then we are defaulting to kansas, so random shuffle the caches
    caches.forEach(function(cache) {
      cache_distance.push([cache[0], 0]);
    });
    shuffleArray(cache_distance);
    matched = "Using random shuffle of caches";
  }

  return {
    caches: cache_distance,
    matched: matched
  }
  
}

// All routes that haven't been captures, reply with a redirect to the nearest cache
router.all("*", async request => {
  // Get closest cache
  var caches_returned = await getClosestCaches(request);
  var ordered_caches = caches_returned.caches
  // Calculate the new redirect
  const url = new URL(request.url);
  var redirect = "http://" + ordered_caches[0][0] + url.pathname;
  return Response.redirect(redirect, 301);
});

// Add the event listener to fetch
addEventListener('fetch', (e) => {
  e.respondWith(router.handle(e.request))
});


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}
