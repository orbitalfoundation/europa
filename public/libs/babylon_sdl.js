
// TODO this whole thing has to move inside of the view.js instance

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
// camera - hardcoded for now
// TODO revist
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
// renderloop - hardcoded for now
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
// materials are going to effectively be full canvases with fonts and so on - not simply textures or heightmaps
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
// babylon mirror the supplied graph
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var shadowGenerator = 0

let babylon_fragments = {}

let orbit = 0

let light = 0

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

		let root = pickResult.pickedMesh
		for(;root.parent;root=root.parent) {
			if(root.parent && root.parent.fragment && root.parent.fragment.kind == "scene") break
		}

		if(!root.fragment || !root.fragment._view) return
		root.fragment._view.publish({e:root,fragment:root.fragment,view:root.fragment._view})
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
