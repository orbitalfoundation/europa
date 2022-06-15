
// helper for avatar uuids

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

//
// ground - a 3d primitive of a special type
// TODO handle relative urls
//

let my_ground = {
	uuid:"/myground",
	kind:"ground",
	heightmap: "./apps/desktop/textures/heightMap.png",
	art: "./apps/desktop/textures/ground.jpg",
}


//
// a sign - a 3d primitive with 2d elements
//

let my_sign_material = {
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

let my_sign = {
	uuid:"/mysign",
	kind:"box",
	shadow:1,
	ypr:[-1.5707,1.5707,0],
	xyz:[1,0.5,0],
	whd:[0.1,1,1],
	mat: my_sign_material,
}

//
// tree - a 3d primitive
// TODO would be fun to have many copies of this tree
//

let my_tree = {
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

let my_camera = {
	uuid:"/mycamera",
	kind:"camera",
	xyz:[0,2,5],
	lookat:[0,0,0]
}

//
// lights
//

let my_light_positional = {
	uuid:"/mylight",
	kind:"light",
	xyz:[10,10,10],
	intensity:2.5
}

let my_light_general = {
	uuid:"/mylight",
	kind:"light",
}

//
// avatar - since each player brings this - it should be locally unique
//

let my_avatar = {
	uuid:"/myavatar/"+uuidv4(),
	kind:"gltf",
	art:"./apps/desktop/llama/",
	xyz:[0,0,0],
}

//let my_particle_fx = {
//	// it is handy to push particle fx down to view
//}

//let my_trigger = {
//	// it is handy to push rollover collision triggers down to view
//}

//
// overall scene
//

let my_scene = {
	uuid:"/myscene",
	kind:"scene",
	children:[ my_ground, my_sign, my_tree, my_avatar, my_camera, my_light_positional ]
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// making things here by hand is a bit rough because i would like to pass services in a special way not globally
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
let view = await window.services.send({
		id:"/myview", // an idea - may remove
		kind:"service", // an idea of services versus wires - may remove
		service:"localhost:/services/view", // service to make
})

view.send({load:my_scene})
*/

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// thinking about different ways to handle events
///
/// in this approach i build a channel and i pass it to the view - this seems reasonable?
///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import Channel from "../../services/channel.js"
let mychannel = new Channel()

mychannel.send = (e) => {

	console.log(e)

	if(e.fragment && e.fragment.uuid == "/mysign") {
		console.log("move sign")
		my_sign.xyz[1]+= 0.5
		//view.send({load:my_sign})
		e.view.send({load:my_sign})
	}

	if(e.fragment && e.fragment.uuid == "/mytree") {
		console.log("move tree")
		my_tree.xyz[1]+= 0.5
		e.view.send({load:my_tree})
	}

	if(e.fragment && e.fragment.uuid == my_avatar.uuid) {
		console.log("move avatgar")
		my_avatar.xyz[1]+= 0.5
		e.view.send({load:my_avatar})
	}

	// startup
	// tick
	// keyboard
	// collisions
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// evaluating the best way to have a manifest
///
/// 1)
/// i could just make services at will and then i get full variable access easily...
/// and i could add to a registry later
///
/// 2)
/// i could have a default function also that passes me things like services and other helpful capabilities
/// now also flo could just watch whatever services are built on the fly...
/// notably apps may create and tear down services so it is nice to do that - there may be no static manifest at all.
///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// - todo the nomenclature send and listen are kind of inaccurate

export async function my_app_entry_point(args) {

	// make a view service
	let view = await args._services.send({
		id:"/myview", // an idea - may remove
		kind:"service", // an idea of services versus wires - may remove
		service:"localhost:/services/view", // service to make
	})

	// have view report events to my handler
	view.listen(mychannel)

	// send view a scene
	view.send({load:my_scene})
}

