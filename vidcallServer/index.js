require('dotenv').config()
const {USE_PORT} = process.env
const express = require('express')
const moment = require("moment")
const app = express()
const server = require("http").Server(app)
const cors = require('cors')
const {ExpressPeerServer} = require('peer')

const customGenerationFunction = () =>
  (Math.random().toString(36) + "0000000000000000000").substr(2, 16);

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: "/",
    generateClientId: customGenerationFunction,
})
const ioSocket = require("socket.io")(server, {
    cors: {
        origin: '*'
    }
})

app.use(cors({credentials: true}))

app.use('/peerjs', peerServer);
app.use(express.static("public"))

app.get('/', (req, res) => {
    res.redirect(`/${moment().format('L')}`)
})

ioSocket.on("connection", (socket) => {
    console.log("socket connected on id: ", socket.id)

    // send id to Fe
    socket.emit("me", socket.id)

    socket.on("callUser" , (data)=>{
        console.log('callUser: ', data)
        ioSocket.to(data.userToCall).emit("callUser", {signalData: data.signalData, from: data.from, name: data.name})
    })

    socket.on("answerCall", (data) => {
        console.log("answerCall :", data)
        ioSocket.to(data.to).emit("callAccepted", data.signal)
    })

    socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	})
})

server.listen(USE_PORT, ()=> {
    console.log(`videoCall-server running on ${USE_PORT}`)
})