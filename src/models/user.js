const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
    },
    room: {
        type: String,
        trim: true,
        required: true,
    },
    socketId: {
        type: String,
        required: true
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User