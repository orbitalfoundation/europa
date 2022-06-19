
//
// 'pool' is the microkernel core service - it is the thread manager, event router and other service loader
//

import Pool from './services/pool.js'

//
// tell flo to load up an app manifest
//

let target = process.argv[4] || "localhost:/sys/services/flo"
let url = process.argv[3] || "localhost:/public/apps/metaverse1/main"
new Pool().channel({target: target, url:url })
