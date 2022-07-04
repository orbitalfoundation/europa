
import io from '/libs/socket.io.esm.min.js'

export default class Net {

	constructor(args) {
		this.uuid = args.uuid
		this.service = args.service
		this._services = args._services
		this.listeners = []
		this.socket = io()
		this.socket.on('data', (stuff) => {
			this.listeners.forEach(listener=>listener(stuff))
		})
	}

	write(args) {
		if(!args.load && !args.observe) return // initial setup state args arrive here... todo may want to prevent this
		this.socket.emit("data",args)
	}

	read(listener) {
		this.listeners.push(listener)
	}

}
