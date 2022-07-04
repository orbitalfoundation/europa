
import "/libs/babylon.js"
import "/libs/babylonjs.loaders.min.js"
import "https://cdn.babylonjs.com/cannon.js"

let viewers = []
var shadowGenerator = 0

let babylon_nodes = {}

////////////////////////////////////////////////////////////////////////////////////////////////////
//
// make canvas right now once only ever
//
////////////////////////////////////////////////////////////////////////////////////////////////////

let canvas = document.createElement("canvas")
let canvas2d = document.createElement("canvas")
let context2d = canvas2d.getContext("2d")
canvas.style.cssText += 'position:absolute;top:0;'
canvas2d.style.cssText += 'position:absolute;top:0;'
const resize = () => {
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
	canvas2d.width = window.innerWidth
	canvas2d.height = window.innerHeight
}
resize()
document.body.appendChild(canvas)
document.body.appendChild(canvas2d)
window.addEventListener('resize', resize)


////////////////////////////////////////////////////////////////////////////////////////////////////
//
// start babylon3d right now once only ever
//
////////////////////////////////////////////////////////////////////////////////////////////////////

const engine = new BABYLON.Engine(canvas, true)
const scene = new BABYLON.Scene(engine)

// we may want to fake gravity since i do not want global gravity todo
var gravityVector = new BABYLON.Vector3(0,-9.81, 0);
var physicsPlugin = new BABYLON.CannonJSPlugin();
scene.enablePhysics(gravityVector, physicsPlugin);

////////////////////////////////////////////////////////////////////////////////////////////////////
//
// camera
//
////////////////////////////////////////////////////////////////////////////////////////////////////

//const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0))
//camera.attachControl(canvas, true)
//const camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 1, -15), scene);

var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 5, -10, scene) )
camera.setTarget(BABYLON.Vector3.Zero())
camera.attachControl(canvas, true)
camera.inputs.addMouseWheel()
//camera.inputs.attached["mousewheel"].wheelYMoveRelative = BABYLON.Coordinate.Y;
// camera.inputs.attached["mousewheel"].wheelPrecisionY = -1;
// camera.attachControl(true);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// renderloop
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var renderLoop = function () {
	scene.render();
};
engine.runRenderLoop(renderLoop);

window.addEventListener("resize",engine.resize.bind(engine))

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// material helper
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function babylon_material(fragment) {

	// make a material from args

	let mat = new BABYLON.StandardMaterial("material");

	if(fragment.rgba) {
		let a = ((fragment.rgba >> 24) & 0xff) / 256.0
		let r = ((fragment.rgba >> 16) & 0xff) / 256.0
		let g = ((fragment.rgba >> 8) & 0xff) / 256.0
		let b = ((fragment.rgba) & 0xff) / 256.0
		mat.diffuseColor = new BABYLON.Color3(r,g,b)
	}

	// todo deal with texture

	if(fragment.art) {
		mat.diffuseTexture = new BABYLON.Texture(fragment.art, scene)
		mat.diffuseTexture.uScale = 1
		mat.diffuseTexture.vScale = 1
		if(fragment.alpha) mat.alpha = fragment.alpha
		mat.specularColor = new BABYLON.Color3(0, 0, 0)
	}

	// deal with dynamic material

	if(!fragment.children) return mat

	var texture = new BABYLON.DynamicTexture("dynamic texture", {width:512, height:256}, scene)
	var context = texture.getContext()
	
	mat.diffuseTexture = texture;

	// deal with 2d elements - children if any (materials are much richer concepts than simply a texture)

	fragment.children.forEach(child=>{
		switch(child.kind) {
			case "text":
				let text = child.text ? child.text : "nothing"
				let font = child.font ? child.font : "bold 44px monospace";
				texture.drawText(text, 75, 135, font, "green", "white", true, true);
			// rect
			// path
			default:
		}
	})

	return mat
}



function center_debug(mesh) {

    const bv = mesh.getHierarchyBoundingVectors()
    const sz = { x: bv.max.x - bv.min.x, y: bv.max.y - bv.min.y, z: bv.max.z - bv.min.z }


	let box = new BABYLON.Mesh.CreateBox("box", 1, scene);
	let mat = new BABYLON.StandardMaterial("mat", scene);
	mat.alpha = 0;
	box.material = mat;
	box.scaling = new BABYLON.Vector3(sz.x, sz.y, sz.z);
	box.position = new BABYLON.Vector3((bv.min.x + bv.max.x) / 2, (bv.min.y + bv.max.y) / 2, (bv.min.z + bv.max.z) / 2);
	box.enableEdgesRendering();    
	box.edgesWidth = 2.0;
	console.log(bv)
	console.log(sz)


	// center
	//mesh.position.x = (bv.max.x-bv.minx.z) / 2


//	box.position = new BABYLON.Vector3((bv.min.x + bv.max.x) / 2, (bv.min.y + bv.max.y) / 2, (bv.min.z + bv.max.z) / 2);
//	box.parent = mesh.parent



console.log(mesh.parent.position)
console.log(mesh.parent.scaling)

	//mesh.position.x -= (bv.max.x - bv.min.x) / 2
//	mesh.position.y -= (bv.max.y - bv.min.y) / 2
	//mesh.position.z -= (bv.max.z - bv.min.z) / 2
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// babylon helpers to mirror the supplied graph
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function babylon_create_node(fragment) {
	let uuid = fragment.uuid
	let art = fragment.art
	switch(fragment.kind) {

		case "ground":
		case "box":
			{
				let mesh = 0
				if(false && fragment.heightmap) {
					// this appears to not allow physics so disable or now
					// get width and height todo
	  				//mesh = BABYLON.Mesh.CreateGroundFromHeightMap(uuid,fragment.heightmap, 4, 4, 100, 0, 0.01, scene, false)
	  				//mesh = BABYLON.Mesh.CreateGround(uuid, 1, 1, 10, scene);
				} else {
					mesh = BABYLON.MeshBuilder.CreateBox(uuid)
				}

				if(fragment.receiveShadows) mesh.receiveShadows = true

				return mesh
			}

		case "sphere": return BABYLON.MeshBuilder.CreateSphere(uuid)
		case "camera": return camera

		case "light":
			{
				if(fragment.xyz) {
					let lightpos = new BABYLON.Vector3(...fragment.xyz);
					let light = new BABYLON.PointLight(fragment.uuid, lightpos, scene);
					light.position = lightpos
					light.intensity = fragment.intensity || 2.5;

					var lightSphere = BABYLON.Mesh.CreateSphere("sphere", 10, 0.1, scene);
					lightSphere.position = light.position;
					lightSphere.material = new BABYLON.StandardMaterial("light", scene);
					lightSphere.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
					light.falloffType = 2

					if(!shadowGenerator) {
						shadowGenerator = new BABYLON.ShadowGenerator(4096, light)
						// shadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
					}

					return light
				}
				else {
					let light = BABYLON.HemisphericLight(fragment.uuid,new BABYLON.Vector3(0, 1, 0))
					return light
				}
			}

		case "gltf":
			{
				let root = new BABYLON.CreateBox(uuid)

				root.material = babylon_material({alpha:0.3,		art: "./apps/metaverse1/textures/ground.jpg" })

				BABYLON.SceneLoader.ImportMesh(null,art,"scene.gltf", scene, (meshes,particles,skeletons) => {
					if(meshes) {
						let middle = new BABYLON.TransformNode(uuid+"_trans")
						middle.parent = root
						if(fragment.adjust) {
							middle.position.y = fragment.adjust.xyz[1]
							middle.rotation.y = fragment.adjust.ypr[1]
						}
						meshes[0].parent = middle
						//root.isVisible = false
						let recurse = (m) => {
							if(shadowGenerator && m.isPickable) {
								shadowGenerator.addShadowCaster(m)
							}
							m.getChildMeshes(true,recurse)
						}
						meshes.forEach(recurse)
						//center_debug(meshes[0])
					}

				})
				return root
			}

		default:
			return new BABYLON.TransformNode(uuid)
	}
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// apply changes from fragment to node
//
// TODO these could and should be optimized to only revise if there is an actual change
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function babylon_sdl(fragment,view) {

	// uuid of node
	// TODO note that the uuid must be unique per caller instance - so we may have to work harder on this that we are doing
	let uuid = fragment ? fragment.uuid : 0

	// each fragment must have a uuid 
	if(!uuid) {
		console.error("view: illegal fragment no uuid?")
		console.error(fragment)
		return 0
	}

	// does a babylon node exist for this fragment?
	let node = babylon_nodes[uuid] || 0

	// throw away node if it changed significantly
	if(node.fragment && node.fragment.hasOwnProperty("kind") && fragment.hasOwnProperty("kind") && node.fragment.kind != fragment.kind) {
		if(node) node.dispose()
		node = babylon_nodes[uuid] = 0
	}

	// guarantee that a node exists - default kind is always 'group'
	if(!node) {
		if(!fragment.kind) fragment.kind = "group"
		node = babylon_nodes[uuid] = babylon_create_node(fragment)
		if(!node) {
			console.error("view: could not make node")
			return 0
		}
		node.id = uuid
		node._view_backhandle = view
		console.log("view: spawned node uuid=" + uuid)
	}

	// merge in any new state
	fragment = node.fragment = { ...(node.fragment ? node.fragment : {}), ...fragment}

	// revise parent attachment?
	let parent = fragment.parent_uuid ? babylon_nodes[fragment.parent_uuid] : 0
	if((!node.parent && !parent) || (node.parent && parent && node.parent.id == parent.id)) {
	} else {
		// TODO this is borked somehow
//		node.parent = parent
	}

	// revise shadow?
	if(shadowGenerator && !node.fragment.shadow_was_updated) {
		node.fragment.shadow_was_updated = 1
		fragment.hasOwnProperty("shadow") ? shadowGenerator.addShadowCaster(node) : shadowGenerator.removeShadowCaster(node);
	}

	// revise material?
	// TODO at the moment this logic is not sensitive to subtle material changes
	if(fragment.mat && !node.fragment.material_was_updated) {
		node.fragment.material_was_updated = 1
		node.material = babylon_material(fragment.mat)
	}

// - there is a network bug here
// - if the server gets a fresh join
// - then those objects appear here again
// - and if there is physics they will pop
// - ways to deal with this
//		- server could not re-publish objects that did not change at all; it could understand view networking or just basic state cache
//		- we can tell that objects have physics and should not be updating here
//		- we can mark up objects
//

	// revise rotation?
	if(fragment.ypr && !(node.rotation.x == fragment.ypr[0] && node.rotation.y == fragment.ypr[1] && node.rotation.z==fragment.ypr[2])) {
		node.rotation.x = fragment.ypr[0]
		node.rotation.y = fragment.ypr[1]
		node.rotation.z = fragment.ypr[2]
	}

	// revise position?
	if(fragment.xyz && !(node.position.x == fragment.xyz[0] && node.position.y == fragment.xyz[1] && node.position.z==fragment.xyz[2])) {
		node.position.x = fragment.xyz[0]
		node.position.y = fragment.xyz[1]
		node.position.z = fragment.xyz[2]
	}

	// revise scale?
	if(fragment.whd && !(node.scaling.x == fragment.whd[0] && node.scaling.y == fragment.whd[1] && node.scaling.z==fragment.whd[2])) {
		node.scaling.x = fragment.whd[0]
		node.scaling.y = fragment.whd[1]
		node.scaling.z = fragment.whd[2]
	}

	// revise lookat? have this last since it depends on camera state
	if(fragment.lookat && !(node.lookat && node.lookat.x == fragment.lookat[0] && node.lookat.y == fragment.lookat[1] && node.lookat.z==fragment.lookat[2])) {
		// todo - this is a bit of a hack to operate directly on the camera - it should ideally be node set target
		camera.setTarget(new BABYLON.Vector3(...fragment.lookat))
		node.lookat = fragment.lookat
	}

	// seek to target if no physics
	// todo don't pop
	if(fragment.impulse && !node.physics) {
		node.position.x += fragment.impulse[0]
		node.position.y += fragment.impulse[1]
		node.position.z += fragment.impulse[2]
	}

	// add physics after setting pose because altering position by force throws off physics
	if(fragment.physics && !node.physics) {
		let mass = fragment.physics.mass || 0
		let restitution = fragment.physics.restitution || 0.9
		node.physics = new BABYLON.PhysicsImpostor(node, BABYLON.PhysicsImpostor.BoxImpostor, { mass: mass, restitution: restitution }, scene);
	}

	// add a physics impulse to an object this frame right now
	if(fragment.impulse && node.physics) {
		console.log(fragment.impulse)
		node.physics.applyImpulse(new BABYLON.Vector3(fragment.impulse[0],fragment.impulse[1],fragment.impulse[2]), node.getAbsolutePosition())
	}

	return node
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// events
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener("click", function (evt) {
	var pickResult = scene.pick(evt.clientX, evt.clientY)

	if(pickResult && pickResult.pickedMesh && pickResult.pickedMesh) {

		// climb up to pickable or fail
		let node = pickResult.pickedMesh
		for(;node;node=node.parent) {
			if(node.fragment && node.fragment.pickable) break
		}

		// publish picking event
		if(node && node.fragment && node.fragment.pickable && node._view_backhandle) {
			node._view_backhandle._publish({event:"pick",fragment:node.fragment})
		}
	}

})

document.addEventListener("keydown", (e,args) => {
	// TODO - it's not great that I am finding the back channel to listeners this way - maybe richer concepts of listening are needed
	viewers.forEach(view=>{
		e.event = "keydown"
		view._publish(e)
	})
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// View
///
/// This is performing several roles:
///
/// + It pretends to be a rust/wasm service that is only accessible over a socket or message channel - ie: an asynchronous arms length relationship.
///
/// + It receives commands or requests with a 'load' of a scene graph - this will be painted or updated persistently to a display. This is the key role.
///
/// + The design intent is that important events such as mouse movement or touch events can be piped back to a caller if they specify an event return channel.
///
/// + If this is written well, it should be swappable for a native rust/wasm or other rasterizer and event handler.
///
/// + Although this class is multiply instanced, there is only one actual view.
///
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default class View {

	constructor(args) {
		this.uuid = args.uuid
		this.service = args.service
		this._services = args._services
		this.nodes = []
		this.listeners = []
		if(args.listen) this.listeners = [args.listen]

		this.write = this.write.bind(this)

		viewers.push(this) // i need to know who all the observers are
	}

	async write(args) {
		let c = args && args.command ? args.command : "load"
		switch(c) {
			case "load":
				if(args.load) {
					this.fragment_recurse(args.load)
				}
				break
			default:
				console.error("View: not valid command=" + c)
				console.error(args)
				break
		}
	}

	read(listener) {
		this.listeners.push(listener)
	}

	_publish(e) {
		this.listeners.forEach(listener=>listener(e))
	}

	fragment_recurse(fragment) {

		// special support for arrays as a convenience feature - only useful for root node
		if(Array.isArray(fragment)) {
			fragment.forEach(child=>{
				child.parent_uuid = 0
				this.fragment_recurse(child)
			})
			return
		}

		if(!fragment || !fragment.uuid) {
			console.error("view: bad fragment")
			console.log(fragment)
			console.log(JSON.stringify(fragment))
			return
		}

		// don't pass the children portion of the graph - just pass one node
		let children = fragment.children
		delete fragment.children

		// render the one node
		babylon_sdl(fragment,this)

		// visit children one by one - always set parent
		if(children) {
			children.forEach(child=>{
				child.parent_uuid = fragment.uuid
				this.fragment_recurse(child)
			})
		}

		// undamage
		fragment.children = children

		// remember fragments
		this.nodes[fragment.uuid]=fragment
	}
}
