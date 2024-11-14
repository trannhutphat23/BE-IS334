const mongoose = require('mongoose')
const connectString = "mongodb+srv://phat:phat1516@db-coffeeshop.ipacg.mongodb.net/?retryWrites=true&w=majority&appName=DB-CoffeeShop"

class Database {
    constructor() {
        this.connect()
    }
    // connect
    connect(type = 'mongodb') {
        if (1 === 1) {
            mongoose.set('debug', true)
            mongoose.set('debug', { color: true })
        }
        mongoose.connect(connectString, {
            maxPoolSize: 50
        })
            .then(_ => {
                console.log("Connected Success\n")
            })
            .catch(err => console.log(err))
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database()
        }

        return Database.instance
    }
}

const instanceMongodb = Database.getInstance()

module.exports = instanceMongodb