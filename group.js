var mongoose = require('mongoose');

var GroupSchema = new mongoose.Schema({
    activity: {
        type: String,
        enum: [
            'Building', 
            'Facility', 
            'Boss(HQ)', 
            'Boss(Playground)'
        ],
        required: true
    },
    building_level: {//Building
        type: Number,
        min: 1,
        max: 6,
        require: function() {
            return this.activity == 'Building';
        }
    },
    cog_type: {//Building
        type: String,
        enum: [
            'Sellbot',
            'Cashbot',
            'Lawbot',
            'Bossbot',
            'Boardbot'
        ],
        required: function() {
            return this.activity == 'Building';
        }
    },
    street: {
        type: String,
        enum: [
            'Punchline Place',
            'Silly Street',
            'Loopy Lane',
            'Wacky Way',
            'Buccaneer Boulevard',
            'Seaweed Street',
            'Anchor Avenue',
            'Lighthouse Lane',
            'Noble Nook',
            'Knight Knoll',
            'Wizard Way',
            'Daisy Drive',
            'Sunflower Street',
            'Petunia Place',
            'Tulip Terrace',
            'Alto Avenue',
            'Baritone Boulevard',
            'Soprano Street',
            'Tenor Terrace',
            'Sleet Street',
            'Walrus Way',
            'Artic Avenue',
            'Polar Place',
            'Legume Lane',
            'Peanut Place',
            'Acorn Avenue',
            'Walnut Way',
            'Lullaby Lane',
            'Twilight Terrace',
            'Pajama Place'
        ],
        required: function() {
            return this.activity == 'Building';
        }
    },
    facility_type: {//Facility
        type: String,
        enum: [
            'Factory-Short',
            'Factory-Side',
            'Factory-Long',
            'Factory-Any',
            'Factory-Short/Sound',
            'Factory-Side/Sound',
            'Factory-Long/Sound',
            'Factory-Any/Sound',

            'Mint-Coin',
            'Mint-Dollar',
            'Mint-Bullion',
            'Mint-Any',
            'Mint-Coin/Sound',
            'Mint-Dollar/Sound',
            'Mint-Bullion/Sound',
            'Mint-Any/Sound',

            'DA Office-A',
            'DA Office-B',
            'DA Office-C',
            'DA Office-D',
            'DA Office-Any',
            'DA Office-A/Sound',
            'DA Office-B/Sound',
            'DA Office-C/Sound',
            'DA Office-D/Sound',
            'DA Office-Any/Sound',

            'Cog Golf-Front Three',
            'Cog Golf-Middle Six',
            'Cog Golf-Back Nine',
            'Cog Golf-Any',
            'Cog Golf-Front Three/Sound',
            'Cog Golf-Middle Six/Sound',
            'Cog Golf-Back Nine/Sound',
            'Cog Golf-Any/Sound'
        ],
        required: function() {
            return this.activity == 'Facility';
        }
    },
    boss: {//Boss(HQ)
        type: String,
        enum: [
            'V.P',
            'V.P - SOS Shopping',
            'C.F.O',
            'C.J',
            'C.E.O'
        ],
        required: function() {
            return this.activity == 'Boss(HQ)';
        }
    },
    playground: {//Boss(Playground)
        type: String,
        enum: [
            'Toontown Central',
            'Barnacle Boatyard',
            'Ye Olde Toontowne',
            // 'Daffodil Gardens', //These playgrounds don't have a task boss.
            // 'Mezzo Melodyland',
            // 'The Brrrgh',
            // 'Acorn Acres',
            // 'Drowsy Dreamland'
        ],
        required: function() {
            return this.activity == 'Boss(Playground)';
        }
    },
    district: {
        type: String,
        enum: [
            'Bamboozle Bay',
            'Boulderbury',
            'Bugle Bay',
            'Comical Canyon',
            'Feather Field',
            'Foghorn Falls',
            'Geyser Gulch',
            'High-Dive Hills',
            'Hypno Harbor',
            'Jellybean Junction',
            'Jollywood',
            'Kazoo Kanyon',
            'Lazy Lagoon',
            'Marble Mountains',
            'Opera Oasis',
            'Piano Peaks',
            'Quicksand Quarry',
            'Rake River',
            'Selter Summit',
            'Splatville',
            'Whistle Woods'
        ],
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Toon',
        required: true
    },
    toons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Toon'
    }],
    created: {
        type: Date,
        default: Date.now()
    }
});

GroupSchema.path('toons').validate(function(v) {
    return v.length < 8;
  });

GroupSchema.post('save', function(next){
    if(!this.created)
    {
       this.created = Date.now();
        this.save();
    }

    if(typeof next == 'function')
        next();
})

module.exports = mongoose.model('Group', GroupSchema);