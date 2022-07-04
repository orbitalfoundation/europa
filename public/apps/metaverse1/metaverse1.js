
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Metaverse1
///
/// This document is intended to exercise ideas in the Orbital SDL grammar:
///
///		+ Describing typical static or startup content to pass to a view service
///		+ Describing lightweight event handlers
///		+ Describing heavier weight full blown services
///		+ Exercising a view service
///		+ Exercising a network service
///		+ Producing in total a lightweight useful application; in this case a simple multiplayer 3d shared space
///
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//
// ground
// TODO handle relative urls
//

let myground = {
	uuid:"/myground",
	kind:"box",
	network:"static",
	created:0,
	updated:0,
	physics:{shape:"box",mass:0},
	receivesShadows: true,
	xyz:[0,-0.1,0],
	whd:[3,0.1,3],
	mat: {
		alpha: 0.5,
		heightmap: "./apps/metaverse1/textures/heightMap.png",
		art: "./apps/metaverse1/textures/ground.jpg",
	}
}

//
// a sign - a 3d primitive with 2d elements
//

let mysign = {
	uuid:"/mysign",
	kind:"box",
	network:"static",
	created:0,
	updated:0,
	//physics:{shape:"box",mass:0.1},
	shadow:1,
	//ypr:[-1.5707,1.5707,0],
	xyz:[1,1,0],
	whd:[1,1,1],
	pickable:true,
	mat: {
		alpha:0.5,
		rgba:0x964b00,
		children:[
			{
				uuid:"/mysign/material/text",
				kind:"text",
				text:"hello",
				font:"bold 44px monospace",
				rgba:0xffff00ff
			}
		]
	}
}

//
// tree - a 3d primitive
// TODO would be fun to have many copies of this tree
//

let mytree = {
	uuid:"/mytree",
	kind:"group",
	network:"static",
	created:0,
	updated:0,
	xyz:[0,0,0],
	pickable:true,
	children:[
		{
			uuid:"/mytree/trunk",
			kind:"box",
			network:"static",
			created:0,
			updated:0,
			shadow:1,
			whd:[0.1,1,0.1],
			xyz:[-1,0,0],
			mat: { rgba:0xff20f020, }
		},
		{
			uuid:"/mytree/crown",
			kind:"sphere",
			network:"static",
			created:0,
			updated:0,
			shadow:1,
			whd:[0.7,0.7,0.7],
			xyz:[-1,0.7,0],
			mat: { rgba:0xff20f020, }
		}
	]
}

//
// camera - avatar will take over camera
// - todo we do not want to network the cam at all really
//

let mycamera = {
	uuid:"/mycamera",
	kind:"camera",
	network:"donotnetwork",
	created:0,
	updated:0,
	xyz:[0,2,5],
	lookat:[0,0,0],
}

//
// lights
//

let mylight_positional = {
	uuid:"/mylight",
	kind:"light",
	network:"static",
	created:0,
	updated:0,
	xyz:[10,10,10],
	intensity:2.5
}

let mylight_general = {
	uuid:"/mylight",
	kind:"light",
	network:"static",
	created:0,
	updated:0,
}

//
// avatar - since each player brings this - it should be locally unique
//

let myavatar = {
	uuid:"/myavatar/" + SERVICES.durable_uuid(),
	kind:"gltf",
	network:"dynamic",
	created:0,
	updated:0,
	art:"./apps/metaverse1/llama/",
	adjust:{xyz:[0,-0.5,0],ypr:[0,1.9,0]},
	whd:[1,1,1],
	xyz:[0,1,0],
	xyzd:[0,1,0],
	ypr:[0,0,0],
	yprd:[0,0,0],
	//	physics:{shape:"box",mass:0.1},
	debugbox:1,
	pickable:true,
}

//let myparticle_fx = {
//}

//
// A typical scene
// TODO - note that it might be nice not to bother having a scene parent but simply pass an array of elements to rasterizer
//

let myscene = [ mylight_positional, myground, mysign, mytree, myavatar, mycamera ]

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// application services - describes the heavier services that this application manifest depends on to start with
///
/// services design:
///
///		- there are many ways to indicate which services i want to start; a manifest could also work
///		- an await could probably be mitigated using a hidden promise but i don't really care
///		- also if an export default method was used then the await could be in that... rather than global
///		- the initial command may as well also pass arguments to the service itself
///
///		- regarding net specifically:
///		- right now net is here for clarity; but for more general utility it may be pushed down to view
///		- objects can be marked up with all kinds of rules regarding replication, acls...
///		- it definitely wants a lot of view related filtering of traffic based on frequency, distance also
///		- it is probably ok to pass graphs as opposed to linear sets to the network layer
///		- net implicitly involves persistence
///
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let view = await SERVICES.channel({ service:"*:/services/view", observe:"*" })
let net = await SERVICES.channel({ service:"*:/services/net" })

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// deal with events
///
/// TODO work in progress - what is a good way to portably decorate components with these lightweight behaviors?
///
/// can behavior also be loaded in a reasonable way? and attached easily? right now they are hardcoded here...
///
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import "/libs/babylon.js"

view.read((e) => {

	if(e.event == "pick") {
		console.log("picking")
	}

	if(e.event == "keydown") {
		// todo for now - later some kind of router switcher manager would be nice
		avatar_movement_handler(e)
	}

	// startup
	// tick
	// keyboard
	// collisions
})


let avatar_movement_handler = (args) => {

	let uuid = myavatar.uuid
	let xyz = myavatar.xyz
	let ypr = myavatar.ypr

	// rotate and get translation change also

	let m = 0
	switch(args.key) {
		case 'a': ypr[1] -=0.1; break;
		case 'd': ypr[1] +=0.1; break;
		case 's': m = 0.1; break;
		case 'w': m = -0.1; break;
	}

	// get current orientation as euler and use to estimate translation target
	let rot = BABYLON.Quaternion.FromEulerAngles(...ypr)
	let vec = new BABYLON.Vector3(0,0,m).rotateByQuaternionToRef(rot,BABYLON.Vector3.Zero())

	if(m) {
		xyz[0] += vec.x
		xyz[1] += vec.y
		xyz[2] += vec.z
	}

	// send to local view by hand (rather than relying on network) to lower latency for locally authoritative state of player
	// todo in general view should support tweening on pose
	view.write({load:[{uuid,xyz,ypr}]})

	// multicast to other network listeners except back to this instance
	// todo may want to even disallow / ignore remote state changes since we are locally authoritative for the player state
	net.write({load:[{uuid,xyz,ypr}]})

	// put camera behind translation target - publish locally immedately - not to network just to view
	vec = new BABYLON.Vector3(0,0,5).rotateByQuaternionToRef(rot,BABYLON.Vector3.Zero())
	vec.x += xyz[0]
	vec.y += xyz[1] + 2
	vec.z += xyz[2]
	view.write({load:[{uuid:mycamera.uuid,xyz:[vec.x,vec.y,vec.z],lookat:xyz}]})


}

// Write scene to server - server is smart enough not to re-echo state if it has not changed but it can be redundant to even send this
net.write({load:myscene})

// Route all inbound traffic directly to view - in the future some events may want to be caught here
net.read(view.write)

// Listen to traffic for this area - this populates the initial local scene
net.write({observe:"/metaverse1/*"})

