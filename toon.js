var mongoose = require('mongoose');

var ToonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    laff: {
        type: Number,
        required: true
    },
    species: {
        type: String,
        enum: [
            'Alligator',
            'Bat',
            'Bear',
            'Beaver',
            'Cat',
            'Deer',
            'Dog',
            'Duck',
            'Fox',
            'Horse',
            'Monkey',
            'Mouse',
            'Pig',
            'Rabbit',
            'Raccoon'
        ]   
    },
    color: String,
    created: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Toon', ToonSchema);