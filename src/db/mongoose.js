const mongoose = require('mongoose')

const DB_URI = process.env.DB_URL

mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
})