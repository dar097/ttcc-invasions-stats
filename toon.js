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
            'alligator',
            'bat',
            'bear',
            'beaver',
            'cat',
            'deer',
            'dog',
            'duck',
            'fox',
            'horse',
            'monkey',
            'mouse',
            'pig',
            'rabbit',
            'raccoon'
        ]   
    },
    color: String,
    created: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Toon', ToonSchema);