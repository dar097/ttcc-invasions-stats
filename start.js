var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var http = require('http');
const path = require('path')
var request = require('request');
var moment = require('moment');

//var fs = require('fs');

var InvasionLog = require('./log-model');
var InvasionHistory = require('./log-history');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', (req, res) => res.render('pages/index'))

mongoose.connect('mongodb://ttcc-admin:aquilina123@ds239071.mlab.com:39071/ttcc-invasions-logs', { useNewUrlParser: true }, err=>{
    if(!err){
        console.log('Invasion Logger started.');
    }else{
        console.log(err);
        console.log('Invasion Logger failed to start.');
    }
});

app.get('/history', function(req, res){
    InvasionHistory.find().sort({ created: -1}).limit(100).exec(function(err, histories)
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
            InvasionLog.remove({ cogs_attacking: "None" }, function(err){
                if(err)
                {
                    console.log(err);
                }
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
                                                    console.log('InvasionHistory Notice: Saved History (' + newDistrict.name + ').');
                                            });
                                        }
                                        else
                                        {
                                            console.log('InvasionHistory Notice: Start already logged. (' + newDistrict.name + ' - ' + newDistrict.cogs_attacking + ')');
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
                                            console.log(history);
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

                                                        history.count_defeated = log.count_defeated;                                                        
                                                        history.save(function(err){
                                                            if(err)
                                                                console.log('InvasionHistory Error: Updating History');
                                                            else
                                                                console.log('InvasionHistory Notice: Saved History (' + log.name + ').');
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
            });
        }else{
            console.log('error: ' + response.statusCode);
        }
    });
  }, 25000);
  
  // If you ever want to stop it...  clearInterval(requestLoop)

app.listen(3000);
