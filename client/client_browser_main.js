
//
// Start a service manager service
//

import Services from './services/services.js'

//
// tell flo to load a manifest
//

new Services({
	service: "localhost:/services/flo",
	load: "localhost:/apps/desktop/desktop",
})
