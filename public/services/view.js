
////////////////////////////////////////////////////////////////////////////////////////////////////
//
// make canvas right now once
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
// start babylon3d right now once
//
////////////////////////////////////////////////////////////////////////////////////////////////////

const engine = new BABYLON.Engine(canvas, true)
const scene = new BABYLON.Scene(engine)

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// babylon helpers to mirror the supplied graph
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let light = 0 // hack

var shadowGenerator = 0

let babylon_fragments = {}

//
// helper
//

function babylon_create_node(fragment) {
	let uuid = fragment.uuid
	let art = fragment.art
	switch(fragment.kind) {

		case "box": return BABYLON.MeshBuilder.CreateBox(uuid)
		case "sphere": return BABYLON.MeshBuilder.CreateSphere(uuid)
		case "camera": return camera

		case "light":
			{
				if(fragment.xyz) {
					let lightpos = new BABYLON.Vector3(...fragment.xyz);
					light = new BABYLON.PointLight(fragment.uuid, lightpos, scene);
					light.position = lightpos
					light.intensity = fragment.intensity || 2.5;

					var lightSphere = BABYLON.Mesh.CreateSphere("sphere", 10, 0.1, scene);
					lightSphere.position = light.position;
					lightSphere.material = new BABYLON.StandardMaterial("light", scene);
					lightSphere.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
					light.falloffType = 2

					return light
				}
				else {
					//const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0))
					// shadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
					let light = BABYLON.HemisphericLight(fragment.uuid)
					return light
				}
			}

		case "gltf":
			{
				for(let i = 0; i < scene.meshes.length; i++) {
					var mesh = scene.meshes[i]
					mesh.donotlight = 1
				}
				let root = new BABYLON.TransformNode(uuid)


				BABYLON.SceneLoader.ImportMesh(null,art,"scene.gltf", scene, (meshes,particles,skeletons) => {
					// force this to attach to correct place
					meshes[0].parent = root
				})
/*
				BABYLON.SceneLoader.Append(art, "scene.gltf", scene, function (scene) {
					// is this needed?
					for(let i = 0; i < scene.meshes.length; i++) {
						var mesh = scene.meshes[i]
						if(mesh.donotlight) continue
						console.log("gltf - lighting node named " + mesh.name)
						if(shadowGenerator) {
							shadowGenerator.addShadowCaster(mesh)
						}
					}
				});
*/
				return root
			}

		case "ground":
			{
				// TODO generalize more
				// TODO error handling
				let heightmap = fragment.heightmap
				let art = fragment.art
				var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground",art, 4, 4, 100, 0, 0.01, scene, false);
				var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
				groundMaterial.diffuseTexture = new BABYLON.Texture(art, scene);
				groundMaterial.diffuseTexture.uScale = 1;
				groundMaterial.diffuseTexture.vScale = 1;
				groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
				ground.material = groundMaterial;
				ground.receiveShadows = true;
				if(!shadowGenerator) {
					//shadowGenerator = new BABYLON.ShadowGenerator(4096, light);
					//shadowGenerator.useExponentialShadowMap = true;
					////shadowGenerator2.usePoissonSampling = true;
				}
				return ground
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

function babylon_sdl(fragment) {

	// each fragment must have a uuid for now
	if(!fragment || !fragment.uuid) {
		console.error("babylon_mirror: illegal fragment no uuid?")
		console.error(fragment)
		return
	}

	// has fragment previously been visited?
	let previous = babylon_fragments[fragment.uuid]

	// sometimes a fragment kind has changed - throw it out if so - to force remaking it
	if(previous && previous.kind != fragment.kind) {
		// delete node and children
		previous.node.dispose()
		previous.node = 0
	}

	// make/remake - remake babylon node if needed
	fragment.node = previous && previous.node ? previous.node : babylon_create_node(fragment)
	if(!fragment.node) {
		console.error("could not make node")
		return
	}

	// remember id
	fragment.node.id = fragment.uuid

	// remember
	let node = fragment.node
	node.fragment = fragment
	node.flo_channel = fragment.flo_channel
	babylon_fragments[fragment.uuid] = fragment

	// revise parent attachment if needed
	let parent = fragment.parent_uuid ? babylon_fragments[fragment.parent_uuid] : 0

	if(parent) {
		node.parent = parent ? parent.node : null
	}

	// revise position
	if(fragment.xyz) {
		node.position.x = fragment.xyz[0]
		node.position.y = fragment.xyz[1]
		node.position.z = fragment.xyz[2]
	}

	// revise rotation
	if(fragment.ypr) {
		node.rotation.x = fragment.ypr[0]
		node.rotation.y = fragment.ypr[1]
		node.rotation.z = fragment.ypr[2]
	}

	// revise scale
	if(fragment.whd) {
		node.scaling.x = fragment.whd[0]
		node.scaling.y = fragment.whd[1]
		node.scaling.z = fragment.whd[2]
	}

	// revise lookat
	if(fragment.lookat) {
		camera.setTarget(BABYLON.Vector3.Zero())
	}

	// revise shadow - TODO too aggressive
	if(shadowGenerator) {
		if(fragment.shadow) {
			shadowGenerator.addShadowCaster(node)
		} else {
			shadowGenerator.removeShadowCaster(node)
		}
	}

	// revise material - TODO too aggressive
	if(fragment.mat) {
		node.material = babylon_material(fragment.mat)
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// events
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

window.addEventListener("click", function (evt) {
	var pickResult = scene.pick(evt.clientX, evt.clientY)

	if(pickResult && pickResult.pickedMesh && pickResult.pickedMesh) {

		// go through some pain to find the root - todo this could be explicit actually - the caller can specify root
		let root = pickResult.pickedMesh
		for(;root.parent;root=root.parent) {
			if(root.parent && root.parent.fragment && root.parent.fragment.kind == "scene") break
		}

		if(!root.fragment || !root.fragment._view) return
		root.fragment._view._publish({event:"pick",fragment:root.fragment})
	}

});

document.addEventListener('keydown', (e,args) => {
//	if(global_event_channel) global_event_channel({channel:babylon_sdl,e:e})
});

//scene.onPointerObservable.add((pointerInfo) => {
//	console.log("this is not working")
//})

//scene.onKeyboardObservable.add((kbInfo) => {
//	console.log("this is not working")
//})

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

		if(!fragment || !fragment.uuid) {
			console.error("view: bad fragment")
			console.log(fragment)
			return
		}

		// don't pass the children portion of the graph - just pass one node
		let children = fragment.children
		delete fragment.children

		// inject this service so i can send messages and so on
		fragment._view = this

		// render the one node
		babylon_sdl(fragment)

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

/*

///
/// ViewFactory
///

export default class ViewFactory {

	constructor(args) {
		// the caller (typically pool) MUST supply a poolchannel for any traffic this service wishes to send to anybody else
		this.poolchannel = args.poolchannel
		// the caller (typically pool) MUST specify where it would like this service to be mounted
		this.uuid = args.uuid || args.service
		this.mountcounter = 0
	}

	async channel(args) {

		// if no command is specified then assume that the caller intention is to spin up a new view parser
		let c = args && args.view_command ? args.view_command : "create"

		switch(c) {
			case "create":
				// instance a copy of the view parser
				await this._create(args)
				break
			default:
				// unknown command - no other commands are handled yet
				console.error({error:"ViewFactory: unknown command "})
				console.error(args)
				return {error:"ViewFactory: unknown command"}
		}

	}

	///
	/// spin up a new instance of view - and forward the traffic onwards
	///

	async _create(args) {

		// make a mount point - this should always be in a portion of the namespace that this service area controls
		this.mountcounter++
		args.uuid = this.uuid + "/" + this.mountcounter

		// make a view instance and pass it whatever the command was initially 
		let instance = new View(args)
		let channel = instance.channel.bind(instance)

		// register the service channel
		this.poolchannel({uuid:"pool",command:"register",use_uuid:args.uuid,channel:channel})

		// pass the command onwards again - this is the better place to handle the command than in the constructor
		instance.channel(args)
	}
}
*/


