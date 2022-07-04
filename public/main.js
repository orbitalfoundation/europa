
//
// Bootstrap the kernel by loading up the services manager service by hand
//

import './services/services.js'

//
// As an optional feature to help running in a browser and from electron, optionally look at command line arguments
//

let args = typeof process !== 'undefined' ? process : { argv:[0,0,0,0,0] }

//
// Effectively tell flo (our application manifest parser) to load and run an app
//

SERVICES.channel({
	service: args.argv[3] || "*:/services/flo",
	load: args.argv[4] || "*:/apps/metaverse1/metaverse1",
})
