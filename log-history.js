var mongoose = require('mongoose');

var HistorySchema = new mongoose.Schema({
    name: String,
    population: Number,
    cogs_attacking: String,
    cogs_type: String,
    count_defeated: Number,
    count_total: Number,
    started: Date,
    ended: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('InvasionHistory', HistorySchema);