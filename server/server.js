
/////////////////////////////////////////////////////////////////
/// db 
///
/// stores hashes
/// hash space is overloaded - some terms are reserved
///
///		offset
///		limit
///		event
///		orderby
///
/// some fields get special treatment
///
///		uuid
///
/////////////////////////////////////////////////////////////////

let db_indexed = {}

///
/// add an item to database
/// - TODO right now the indexes are hardcoded allow more
/// - TODO fancier merge rules?
/// - TODO fancy ACL rules per obj?
///

function db_insert(item) {
	if(!item || !item.slug) return
	let now = Date.now()
	let prev = db_indexed[item.slug] || { created:now }
	let results = db_indexed[item.slug] = { ...prev, ...item, updated:now }
	return results
}

///
/// A query may be one hash to match or an array of hashes to match
/// If an uuid is passed then always ONLY matches on that UUID
/// Results are always returned as an array
///

function db_query(queries) {
	let results = []
	if(queries) {
		if(!Array.isArray(queries)) queries = [queries]
		queries.forEach(match=>{
			delete match.offset
			delete match.limit
			delete match.event
			delete match.orderby
			console.log(match)
			data.forEach(item=>{
				let success = true
				for (const [k,v] of Object.entries(match)) {
					if(item[k] != v) {
						success = false;
						break;
					}
				}
				if(success) {
					results.push(item)
				}
			})
		})
	}
	return results
}

///
/// given a set of queries on objects - return the children of them as an array
///

function db_query_children(queries) {
	let parents = db_query(queries)
	parents.forEach(item=>{
		// may enumerate children as an array of explicitly named candidates
		if(item.children && Array.isArray(item.children)) {
			item.children.forEach(slug=>{
				data.forEach(item2=>{
					if(item2.slug == slug) results.push(item2)
				})
			})
			return
		}
		// or children indicate parent by name
		let query = item.children
		data.forEach(item=>{
			Object.keys(query).forEach(key=>{
				if(item[key] == query[key]) children.push(item)
			})
		})
	})

}

////////////////////////////////////////////////////////////
// express js
////////////////////////////////////////////////////////////

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import path from 'path'
import express from 'express'
import http from 'http'

let static_files = path.join(__dirname, '../public')

const app = express()
app.use(express.json());
const httpserver = http.createServer(app)

app.use(express.static(static_files))
app.get('/', (req, res) => {
	res.sendFile(static_files + '/client_browser_main.html');
})

app.use(function(err, req, res, next) {
	console.log(err)
	next(err)
})

app.post('/query',(req,res) => {
	let results = db_query(req.body)
	res.status(200).json(results)
})

app.get('/observe',(req,res) => {
	res.status(200).json({ success: "good " })
})

/////////////////////////////////////////////////////////////////
// web sockets for observables
/////////////////////////////////////////////////////////////////

import { Server } from "socket.io"
const io = new Server(httpserver)

io.on('connection', (socket) => {
	// - send graph on new connections - todo

	// send to all listeners
	socket.on('data', (args) => {
		io.emit("data",args)
		// - todo save graph
	})

	// do something with disconnects i guess
	socket.on('disconnect', () => {
		console.log('Server: user disconnected')
	})
})

/////////////////////////////////////////////////////////////////
// start express and websockets together
/////////////////////////////////////////////////////////////////

httpserver.listen(3000, () => {
	console.log('listening on *:3000')
})

