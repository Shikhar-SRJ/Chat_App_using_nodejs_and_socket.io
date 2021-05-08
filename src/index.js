const http = require('http')
const express = require('express')
require('./db/mongoose')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const User = require('./models/user')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT
const publicDirectoryPath = path.join(__dirname, '../public')
app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    console.log('New connection added')    
    
    socket.on('join' , async ({ username, room }, callback) => {
        const usernameTaken = await User.findOne({ username, room })
        if (usernameTaken) {
            return callback('This username is taken!')
        }
        const user = new User({ socketId: socket.id, username, room })
        try {
            await user.save()
        } catch (e) {
            return callback(e)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined the chat!`))
        const usersInRoom = await User.find({ room: user.room })
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: usersInRoom,
        })

        callback()
    })

    socket.on('sendMessage',async (message, callback) => {
        const user = await User.findOne({socketId: socket.id})
        const filter = new Filter
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('disconnect', async () => {
        const user = await User.findOneAndRemove({socketId: socket.id})
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left the chat`))
            const usersInRoom = await User.find({room: user.room})
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: usersInRoom,
            })
        }
    })

    socket.on('sendLocation',async (location, callback) => {
        const user = await User.findOne({socketId: socket.id})
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })
})


server.listen(port, () => {
    console.log('The server is running on port', port)
})
