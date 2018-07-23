var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var http = require('http');
const path = require('path')
var request = require('request');
var moment = require('moment');
var socketio = require('socket.io');


//var fs = require('fs');

var InvasionLog = require('./log-model');
var InvasionHistory = require('./log-history');
var Toon = require('./toon');
var Group = require('./group');

var app = express();

var server = http.createServer(app);
var io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

var connections = 0;
io.on('connect', function(socket){
    connections++;
    io.emit('countchange', io.engine.clientsCount);
    socket.on('disconnect', () => {
        connections--;
        io.emit('countchange', io.engine.clientsCount);
    });
    /*
    this.io.on('connect', (socket: any) => {
        console.log('Connected client on port %s.', this.port);
        socket.on('message', (m: Message) => {
            console.log('[server](message): %s', JSON.stringify(m));
            this.io.emit('message', m);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
    */
});

app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))

mongoose.connect('mongodb://ttcc-admin:aquilina123@ds239071.mlab.com:39071/ttcc-invasions-logs', { 
    useNewUrlParser: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000
}, err=>{
    if(!err){
        console.log('Invasion Logger started.');
    }else{
        console.log(err);
        console.log('Invasion Logger failed to start.');
    }
});

function getGroupForSocket(group_id){
    if(group_id)
    {
        Group.findById(group_id).populate('host').populate('toons').exec(function(err, group){
            if(err)
                console.log('Error Emitting Group.');
            else
            {
                if(group)
                    io.emit('group', group);
                else
                    console.log('Error Emitting Nothing.');
            }
        });
    }
}

app.get('/clientcount', function(req, res){
    console.log(connections + ' client' + (connections == 1 ? '' : '') + ' connected.');
    res.status(200).send(connections + ' client' + (connections == 1 ? '' : '') + ' connected.');
});

app.get('/toon', function(req, res){
    var toonData = req.query;
    if(toonData && toonData.toon)
    {
        Toon.findById(toonData.toon, function(err, toon){
            if(err)
                res.status(400).send('Error getting Toon.');
            else
            {
                if(toon)
                    res.status(200).send(toon);
                else
                    res.status(400).send('Error finding Toon.');
            }
        })
    }
    else
        res.status(400).send('Invalid Request');
});

app.post('/toon/create', function(req, res){
    var toonData = req.body;
    if(toonData && typeof toonData.laff == 'number' && typeof toonData.name == 'string')
    {
        if(toonData.laff < 15 || toonData.laff > 160)
        {
            res.status(400).send('Error creating invaild Toon.');
            return;
        }
        var newToon = new Toon(toonData);
        newToon.save(function(err){
            if(err)
                res.status(400).send('Error creating Toon.');
            else
                res.status(200).send(newToon._id);
        });
    }
    else
        res.status(400).send('Invalid Request');
});

app.post('/toon/edit', function(req, res){
    var toonData = req.body;
    var queryData = {};
    if(typeof toonData.laff == 'number')
    {
        if(toonData.laff < 15 || toonData.laff > 160)
        {
            res.status(400).send('Error editing Toon to invalid state.');
            return;
        }
        queryData.laff = toonData.laff;
    }

    if(typeof toonData.species == "string")
        queryData.species = toonData.species;

    if(typeof toonData.color == "string")
        queryData.color = toonData.color;

    if(Object.keys(queryData).length > 1 && toonData._id)
    {
        Toon.findByIdAndUpdate(toonData._id, queryData, { new: true }, function(err, updatedToon){
            if(err)
                res.status(400).send('Error editing Toon.');
            else
            {
                if(updatedToon)
                    res.status(200).send({ message: 'Toon updated successfully.'});
                else
                    res.status(400).send('Error finding Toon.');
            }
        });
    }
    else
        res.status(400).send('Invalid Request');
});

app.get('/groups', function(req, res){
    Group.find().populate('host').populate('toons').exec(function(err, groups){
        if(err)
            res.status(400).send('Error getting Groups.');
        else
            res.status(200).send(groups);
    });
});

app.get('/group', function(req, res){
    var groupData = req.query;
    if(groupData && groupData.group)
    {
        Group.findById(groupData.group).populate('host').populate('toons').exec(function(err, group){
            if(err)
                res.status(400).send('Error getting Group.');
            else
            {
                if(group)
                    res.status(200).send(group);
                else
                    res.status(400).send('Error finding Group.');
            }
        });
    }
});

app.post('/group/delete', function(req, res){
    var groupData = req.body;
    if(groupData && groupData.group)
    {
        Group.findByIdAndRemove(groupData.group, function(err, deletedGroup){
            if(err)
                res.status(400).send('Error getting Group.');
            else
            {
                io.emit('nomoregroup', groupData.group);
                res.status(200).send({ message: 'Group Deleted'});
            }
        });
    }
    else
        res.status(400).send('Invalid Request');
});

app.post('/group/create', function(req, res){
    var groupData = req.body;
    if(groupData && typeof groupData.activity == 'string' && typeof groupData.district == 'string' && groupData.host)
    {
        Toon.findById(groupData.host, function(err, toon){
            if(err)
                res.status(400).send('Error getting Toon.');
            else
            {
                if(toon)
                {
                    Group.find({ $or: [ { host: toon._id }, { toons: { $elemMatch: { $eq: toon._id } } }] }, function(err, existingGroup){
                        if(err)
                            res.status(400).send('Error scanning Groups.');
                        else
                        {
                            if(existingGroup.length)
                                res.status(400).send('Error creating another Group.');
                            else
                            {
                                groupData.toons = [];
                                if(typeof groupData.size == 'number')
                                {
                                    groupData.size = Math.min(groupData.activity === "Boss(HQ)" ? 7 : 3, groupData.size);
                                    for(var i =0; i < groupData.size; i++)
                                    {
                                        groupData.toons.push(toon._id);
                                    }
                                    groupData.size = undefined;
                                }
                                groupData.created = Date.now();
                                var newGroup = new Group(groupData);
                                newGroup.save(function(err){
                                    if(err)
                                    {
                                        console.log(err);
                                        res.status(400).send('Error creating Group.');
                                    }
                                    else
                                    {
                                        getGroupForSocket(newGroup._id);
                                        res.status(200).send({ message: 'Group Created. ', id: newGroup._id });
                                    }
                                });
                            }
                        }
                    });
                }
                else
                    res.status(400).send('Error finding Toon.');
            }
        });        
    }
    else
        res.status(400).send('Invalid Request');
});

app.post('/group/join', function(req, res){
    var groupData = req.body;
    if(groupData && groupData.toon && groupData.group)
    {
        Toon.findById(groupData.toon, function(err, toon){
            if(err)
                res.status(400).send('Error getting Toon.');
            else
            {
                if(toon)
                {
                    Group.find({ $and: [ {$or: [ { host: toon._id }, { toons: { $elemMatch: { $eq: toon._id } } }] }, {_id: { $not: { $eq: groupData.group } } } ] }, function(err, existingGroup){
                        if(err)
                            res.status(400).send('Error scanning Groups.');
                        else
                        {
                            if(existingGroup.length)
                                res.status(400).send('Error joining Group. (You might be in another group already)');
                            else
                            {
                                Group.findById(groupData.group, function(err, foundGroup){
                                    if(err)
                                        res.status(400).send('Error getting Group.');
                                    else
                                    {
                                        if(foundGroup)
                                        {
                                            if((foundGroup.activity != 'Boss(HQ)' && foundGroup.toons.length < 3) || (foundGroup.activity == 'Boss(HQ)' && foundGroup.toons.length < 7))
                                            {
                                                foundGroup.update({ $push: { toons: toon._id } }, function(err){
                                                    if(err)
                                                        res.status(400).send('Error updating Group.');
                                                    else
                                                    {
                                                        getGroupForSocket(groupData.group);
                                                        res.status(200).send({ message: 'Joined Group'});
                                                    }
                                                });
                                            }
                                            else
                                                res.status(400).send('Error joining full Group.');
                                        }
                                        else
                                            res.status(400).send('Error finding Group.');
                                    }
                                });
                            }
                        }
                    });                    
                }
                else
                    res.status(400).send('Error finding Toon.');
            }
        })
    }
    else
        res.status(400).send('Invalid Request');
});

app.post('/group/leave', function(req, res){
    var groupData = req.body;
    if(groupData && groupData.toon && groupData.group)
    {
        Toon.findById(groupData.toon, function(err, toon){
            if(err)
                res.status(400).send('Error getting Toon.');
            else
            {
                if(toon)
                {
                    Group.findByIdAndUpdate(groupData.group, { $pull: { toons: toon._id } }, { new: true }, function(err, editedGroup){
                        if(err)
                            res.status(400).send('Error getting Group.');
                        else
                        {
                            if(editedGroup)
                            {
                                if(String(editedGroup.host) == String(toon._id))
                                {
                                    Group.findByIdAndRemove(groupData.group, function(err, deletedGroup){
                                        if(err)
                                            res.status(400).send('Error getting Group.');
                                        else
                                        {
                                            io.emit('nomoregroup', groupData.group);
                                            res.status(200).send({ message: 'Group has been disbanded.' });
                                        }
                                    });
                                    return;
                                }
                                else
                                {
                                    getGroupForSocket(groupData.group);
                                    res.status(200).send({ message: 'Left Group' });
                                }
                            }
                            else
                                res.status(400).send('Error finding Group.');
                        }
                    });
                    
                }
                else
                    res.status(400).send('Error finding Toon.');
            }
        })
    }
    else
        res.status(400).send('Invalid Request');

});

app.get('/history', function(req, res){
    var amount = req.query && req.query.amount || 100;
    InvasionHistory.find().sort({ started: -1}).limit(Number(amount)).exec(function(err, histories)
    {
        if(err)
        {
            console.log('error from /history');
            console.log(err);
            res.status(400).send('Error at /history:1');
        } 
        else
        {
			res.status(200).send(histories);
        }
    });
});

app.get('/latest', function(req, res){
    InvasionLog.findOne().select('created').sort({ created: -1}).exec(function(err, latestLog)
    {
        if(err)
        {
            console.log('error from /latest');
            console.log(err);
            res.status(400).send('Error at /latest:1');
        } 
        else
        {
            if(latestLog && latestLog.created)
            {
                var createdMax = moment(latestLog.created).add(1, 'second').toDate();
                var createdMin = moment(latestLog.created).subtract(1, 'second').toDate();
                InvasionLog.find({created: { $gte: createdMin, $lte: createdMax } }).exec(function(err, latestLogs){
                    if(err)
                    {
                        console.log('error from /latest');
                        console.log(err);
                        res.status(400).send('Error at /latest:3');
                    } 
                    else
                    {
                        res.status(200).send(latestLogs);
                    }
                });
            }
            else
            {
                console.log('error from /latest');
                console.log(latestLog);
                res.status(400).send('Error at /latest:2');
            }
        }
    });
});


var requestLoop = setInterval(function(){
    request({
        url: "https://corporateclash.net/api/v1/districts/",
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    },function(error, response, body){
        if(!error && response.statusCode == 200){
            console.log('got a response');
            var districts = JSON.parse(body);
            for(var district in districts)
            {
                let newDistrict = new InvasionLog(districts[district]);

                newDistrict.save(function(err){
                    if(err)
                    console.log(err);
                    else
                    {
                        let createdMax = moment(newDistrict.created).add(45, 'minutes').toDate();
                        let createdMin = moment(newDistrict.created).subtract(45, 'minutes').toDate();
                        if(newDistrict.cogs_attacking !== 'None')
                        {

                            InvasionHistory.findOne({ name: newDistrict.name, cogs_attacking: newDistrict.cogs_attacking, started: { $gte: createdMin, $lte: createdMax } }).sort({created: -1})
                            .exec(function(err, history){
                                if(err)
                                {
                                    console.log('InvasionHistory Error: Finding History');
                                }
                                else
                                {
                                    if(!history)
                                    {
                                        var newEntry = new InvasionHistory({ 
                                            name: newDistrict.name,
                                            population: newDistrict.population, 
                                            cogs_attacking: newDistrict.cogs_attacking, 
                                            cogs_type: newDistrict.cogs_type, 
                                            count_total: newDistrict.count_total, 
                                            started: newDistrict.created 
                                        });
                                        newEntry.save(function(err){
                                            if(err)
                                            {
                                                console.log('InvasionHistory Error: Saving History');
                                                console.log(err);
                                            }
                                            else
                                                console.log('Invasion has started. (' + newDistrict.name + ' - ' + newDistrict.cogs_attacking +  ').');
                                        });
                                    }
                                    else
                                    {
                                        console.log('Invasion in progress. (' + newDistrict.name + ' - ' + newDistrict.cogs_attacking + ')');
                                    }
                                }
                            });
                        }
                        else
                        {
                            InvasionHistory.findOne({ name: newDistrict.name, started: { $gte: createdMin, $lte: createdMax }, ended: null }).sort({ created: -1})
                            .exec(function(err, history){
                                if(err)
                                {
                                    console.log('InvasionHistory Error: Finding History');
                                }
                                else
                                {
                                    if(history)
                                    {
                                        console.log(newDistrict.name + ' - ' + newDistrict.cogs_attacking);
                                        InvasionLog.findOne({ name: newDistrict.name, cogs_attacking: history.cogs_attacking }).sort({created: -1}).exec(function(err, log){
                                            if(err)
                                            {
                                                console.log('InvasionHistory Error: Finding Log');
                                            }
                                            else
                                            {
                                                if(log)
                                                {
                                                    history.ended = Date.now();
                                                    if(history.population < log.population)
                                                        history.population = log.population;

                                                    if(log.count_defeated + 50 >= history.count_total)
                                                        history.count_defeated = history.count_total
                                                    else
                                                        history.count_defeated = log.count_defeated;

                                                    history.save(function(err){
                                                        if(err)
                                                            console.log('InvasionHistory Error: Updating History');
                                                        else
                                                            console.log('Invasion has ended. (' + log.name + ' - ' + log.cogs_attacking + ')');
                                                    });
                                                }
                                                else
                                                {
                                                    console.log('InvasionHistory Error: Log not found.');
                                                }
                                            }
                                        });
                                    }
                                    else
                                    {
                                        //console.log('InvasionHistory Notice: End already logged or no current Start.');
                                    }
                                }
                            });
                        } 
                    }
                });
            }
        }
        else
            console.log('error: ' + response.statusCode);
    });
  }, 15000);


var purgeLoop = setInterval(function(){
    let purgeDate = moment(Date.now()).subtract(30, 'minutes').toDate();
    InvasionLog.remove({ $or: [ { created: { $lte: purgeDate } }, { created: { $eq: null } } ] }, function(err){
        if(err)
        {
            console.log(err);
        }
        else
            console.log("Purged some log data.");
    });

    Group.remove({ $or: [ { created: { $lte: purgeDate } }, { created: { $eq: null } } ] }, function(err){
        if(err)
        {
            console.log(err);
        }
        else
        {
            io.emit('purge');
            console.log("Purged some group data.");
        }
    });

}, 600000);

//clearInterval(requestLoop);
//clearInterval(purgeLoop);

server.listen(process.env.PORT || 5000);
