var mongoose = require('mongoose');

var LoggerSchema = new mongoose.Schema({
    name: String,
    online: Boolean,
    population: Number,
    invasion_online: Boolean,
    last_update: Number,
    cogs_attacking: String,
    cogs_type: String,
    count_defeated: Number,
    count_total: Number,
    remaining_time: Number,
    created: Date
});

var bots = {
    'Bossbot': [
        'Flunky',
        'Pencil Pusher',
        'Yesman',
        'Micromanager',
        'Downsizer',
        'Head Hunter',
        'Corporate Raider',
        'The Big Cheese'
    ],

    'Lawbot': [
        'Bottom Feeder',
        'Bloodsucker',
        'Double Talker',
        'Ambulance Chaser',
        'Back Stabber',
        'Spin Doctor',
        'Legal Eagle',
        'Big Wig'
    ],

    'Cashbot': [
        'Short Change',
        'Penny Pincher',
        'Tightwad',
        'Bean Counter',
        'Number Cruncher',
        'Money Bags',
        'Loan Shark',
        'Robber Baron'
    ],

    'Sellbot': [
        'Cold Caller',
        'Telemarketer',
        'Name Dropper',
        'Glad Hander',
        'Mover and Shaker',
        'Two Face',
        'The Mingler',
        'Mr. Hollywood'
    ],

    'Boardbot': [
        'Con Artist',
        'Connoisseur',
        'Swindler',
        'Middleman',
        'Toxic Manager',
        'Magnate',
        'Big Fish',
        'Head Honcho'
    ]
}

var swaps = {
    'Bossbot': 'Boardbot',
    'Lawbot': 'Bossbot',
    'Cashbot': 'Lawbot',
    'Sellbot': 'Cashbot',
    'Boardbot': 'Sellbot'
}

function getTypeFromCog(cog){
    var type = '';
    switch(cog)
    {
      case 'Flunky': case 'Pencil Pusher': case 'Yesman': case 'Micromanager': case 'Downsizer': case 'Head Hunter': case 'Corporate Raider': case 'The Big Cheese':
        type = 'Bossbot';
        break;
      case 'Bottom Feeder': case 'Bloodsucker': case 'Double Talker': case 'Ambulance Chaser': case 'Back Stabber': case 'Spin Doctor': case 'Legal Eagle': case 'Big Wig':
        type = 'Lawbot';
        break;
      case 'Short Change': case 'Penny Pincher': case 'Tightwad': case 'Bean Counter': case 'Number Cruncher': case 'Money Bags': case 'Loan Shark': case 'Robber Baron':
        type = 'Cashbot';
        break;
      case 'Cold Caller': case 'Telemarketer': case 'Name Dropper': case 'Glad Hander': case 'Mover and Shaker': case 'Two Face': case 'The Mingler': case 'Mr. Hollywood':
        type = 'Sellbot';
        break;
      case 'Con Artist': case 'Connoisseur': case 'Swindler': case 'Middleman': case 'Toxic Manager': case 'Magnate': case 'Big Fish': case 'Head Honcho':
        type = 'Boardbot';
        break;
    }
    return type;
}

LoggerSchema.post('save', function(next){
    if(!this.created)
    {
        if(this.cogs_attacking != null && this.cogs_attacking !== 'None')
        {
            var badType = getTypeFromCog(this.cogs_attacking);
            // console.log(this.cogs_attacking + ' of type ' + badType );
            var badCogIndex = bots[badType].indexOf(this.cogs_attacking);
            this.cogs_attacking = bots[swaps[badType]][badCogIndex];
        }
        this.cogs_type = getTypeFromCog(this.cogs_attacking);
        
        // if(this.cogs_attacking !== 'None')
        //     console.log("is actually " + this.cogs_attacking + " of type " + this.cogs_type);
        
        this.created = Date.now();
        this.save();
    }

    if(typeof next == 'function')
        next();
})

module.exports = mongoose.model('InvasionLog', LoggerSchema);
