
import io from '/libs/socket.io.esm.min.js'

export default class Net {

	constructor(args) {
		this.uuid = args.uuid
		this.service = args.service
		this._services = args._services
		this.listeners = []
		this.socket = io()
		this.socket.on('data', (args) => {
			this._publish(args)
		})
	}

	async write(args) {

		if(args.observe) {
			// todo - pass this onto the server and filter traffic
			console.log("net: got observe " + args.observe)
		}

		else if(args.load) {
			console.log("net: got data to echo")
			await this._send_to_server(args)
		}

		else {
			console.error("net: unknown args")
			console.log(args)
		}
	}

	read(listener) {
		this.listeners.push(listener)
	}

	_publish(e) {
		console.log("net: echoing to listeners")
		this.listeners.forEach(listener=>listener(e))
	}

	_send_to_server(data) {
		this.socket.emit("data",data)
	}
}
