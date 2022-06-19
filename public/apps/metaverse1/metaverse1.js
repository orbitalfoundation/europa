
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// largely declarative layout for mixed 2d/3d scene
///
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//
// ground - a 3d primitive of a special type
// TODO handle relative urls
//

let myground = {
	uuid:"/myground",
	kind:"ground",
	heightmap: "./apps/metaverse1/textures/heightMap.png",
	art: "./apps/metaverse1/textures/ground.jpg",
}


//
// a sign - a 3d primitive with 2d elements
//

let mysign_material = {
	uuid:"/mysign/material",
	kind:"material",
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

let mysign = {
	uuid:"/mysign",
	kind:"box",
	shadow:1,
	ypr:[-1.5707,1.5707,0],
	xyz:[1,0.5,0],
	whd:[0.1,1,1],
	mat: mysign_material,
}

//
// tree - a 3d primitive
// TODO would be fun to have many copies of this tree
//

let mytree = {
	uuid:"/mytree",
	xyz:[0,0,0],
	children:[
		{
			uuid:"/mytree/trunk",
			kind:"box",
			shadow:1,
			whd:[0.1,1,0.1],
			xyz:[-1,0,0],
			mat: { rgba:0xff20f020, }
		},
		{
			uuid:"/mytree/crown",
			kind:"sphere",
			shadow:1,
			whd:[0.7,0.7,0.7],
			xyz:[-1,0.7,0],
			mat: { rgba:0xff20f020, }
		}
	]
}

//
// camera - avatar will take over camera
//

let mycamera = {
	uuid:"/mycamera",
	kind:"camera",
	xyz:[0,2,5],
	lookat:[0,0,0]
}

//
// lights
//

let mylight_positional = {
	uuid:"/mylight",
	kind:"light",
	xyz:[10,10,10],
	intensity:2.5
}

let mylight_general = {
	uuid:"/mylight",
	kind:"light",
}

//
// avatar - since each player brings this - it should be locally unique
//

let myavatar = {
	uuid:"/myavatar/" + SERVICES.uuidv4(),
	kind:"gltf",
	art:"./apps/metaverse1/llama/",
	xyz:[0,0,0],
}

//let myparticle_fx = {
//	// it is handy to push particle fx down to view
//}

//let mytrigger = {
//	// it is handy to push rollover collision triggers down to view
//}

//
// overall scene
//

let myscene = {
	uuid:"/myscene",
	kind:"scene",
	children:[ myground, mysign, mytree, myavatar, mycamera, mylight_positional ]
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// services
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
let net = await SERVICES.channel({ service:"*:/services/net", observe:"/metaverse1/*" })

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// deal with events
///
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

view.read((e) => {

	if(e.event == "pick") {

		console.log("pic")

		if(e.fragment && e.fragment.uuid == "/mysign") {
			console.log("move sign")
			mysign.xyz[1]+= 0.5
			net.write({load:mysign})
		}

		if(e.fragment && e.fragment.uuid == "/mytree") {
			console.log("move tree")
			mytree.xyz[1]+= 0.5
			net.write({load:mytree})
		}

		if(e.fragment && e.fragment.uuid == myavatar.uuid) {
			console.log("move avatgar")
			myavatar.xyz[1]+= 0.5
			net.write({load:myavatar})
		}
	}

	// startup
	// tick
	// keyboard
	// collisions
})

net.read((e)=>{
	// handle change requests
	console.log(1)
	view.write(e)
})

// this could be inside of net and could be contingent on say if we are first or authoritative

net.write({load:myscene})
