var express  = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
mongoose.connect('mongodb://localhost/DATABASE_01');
var db = mongoose.connection;
var session = require('client-sessions');

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
	console.log("DB");
});

app.use(bodyParser());

app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
    return next();
});

app.use(session({
  cookieName: 'session',
  secret: 'the_cake_is_a_lie',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly: false,
  secure: false,
  ephemeral: false
}));

app.use(function(req, res, next) {
  if (req.session && req.session.user) {
    User.findOne({ name: req.session.user.name }, function(err, user) {
      if (user) {
        req.user = user;
        delete req.user.password;
        req.session.user = user;
        res.locals.user = user;
      }
      next();
    });
  } else {
    next();
  }
});

var CitySchema = mongoose.Schema({
	name: String,
});
var City = mongoose.model('CITY', CitySchema, 'CITY');

app.get('/cities', function (req, res) {
	City.find({}, function(err, cities) {
		if( err || !cities) console.log("No cities found");
		  else 
		{
			res.writeHead(200, {'Content-Type': 'application/json'});
			str='[';
			cities.forEach( function(city) {
				str = str + '{ "name" : "' + city.name;
				str = str + '", "_id" : "' + city._id;
				str = str + '"},' +'\n';
			});
			str = str.trim();
			str = str.substring(0,str.length-1);
			str = str + ']';
			res.end(str);
		}
	});
});

var UserSchema = mongoose.Schema({
	name: String,
	pwd: String,
});
var User = mongoose.model('USER', UserSchema, 'USER');

 app.post('/login', function(req, res) {
	var jsonData = JSON.parse(req.body.mydata);
	User.findOne({ name: jsonData.username }, function(err, user) {
		if (!user) {
			res.end('no login', { error: 'Invalid name or password.' });
		} else {
			if (jsonData.password == user.pwd) {
				req.session.user = user;
				res.end('login');
			} else {
				res.end('no login', { error: 'Invalid name or password.' });
			}
		}
	});
});

app.get('/index', function(req, res) {
	requireLogin();
	console.log("app.post /index");
	if (req.session && req.session.user) {
    User.findOne({ name: req.session.user.name }, function (err, user) {
      if (!user) {
        req.session.reset();
        res.end('/login');
      } else {
        res.locals.user = user;
        res.render('index.jade');
      }
    });
  } else {
    res.end('/login');
  }
});

app.get('/logout', function(req, res) {
	req.session.reset();
	res.end('/logout');
});

app.post('/register', function (req, res) {
	var jsonData = JSON.parse(req.body.mydata);
    var newuser = new User();

    newuser.name      = jsonData.user_name;
    newuser.pwd       = jsonData.user_pwd;

    newuser.save(function(err){
        if(err){ throw err; }
        console.log('saved');
    })
    res.send('user saved');
});

var tripSchema = mongoose.Schema({
	trip_owner: [{ type: mongoose.Schema.Types.ObjectId, ref: 'USER', required: true, set: JSON.stringify, get: JSON.parse}],
	trip_start:	[{ type: mongoose.Schema.Types.ObjectId, ref: 'CITY', required: true, set: JSON.stringify, get: JSON.parse}],
	trip_end: 	[{ type: mongoose.Schema.Types.ObjectId, ref: 'CITY', required: true, set: JSON.stringify, get: JSON.parse}],
	trip_date: 	[{ type: Date, 		required: true }],
	nb: 		[{ type: Number, 	required: true }],
	nb_max: 	[{ type: Number, 	required: true }]
}, {
  toJSON: {getters: true},
  toObject: {getters: true}
});
var Trip = mongoose.model('TRIP', tripSchema, 'TRIP');

app.get('/searchtrip', function (req, res) {
	Trip.find({'trip_start': req.query.city})
	.populate('trip_owner', 'name')
	.populate('trip_start')
	.populate('trip_end')
	.$where('this.nb < this.nb_max')
	.exec(function(err, trips) {
		if( err || !trips) console.log("No trips found");
		  else 
		{
			res.writeHead(200, {'Content-Type': 'application/json'});
			str='[';
			trips.forEach( function(trip) {
				str = str + '{"trip_owner":'+ JSON.stringify(trip.trip_owner);
				str = str + ',"trip_start":'+ JSON.stringify(trip.trip_start);
				str = str + ',"trip_end":'+ JSON.stringify(trip.trip_end);
				str = str + ',"trip_date":"' + trip.trip_date;
				str = str + '","nb":"' + trip.nb;
				str = str + '","nb_max":"' + trip.nb_max;
				str = str + '","_id":"' + trip._id;
				str = str + '"},';
			});
			str = str.trim();
			str = str.substring(0,str.length-1);
			str = str + ']';
			res.end(str);
		}
	});
});

app.post('/createtrip', function (req, res) {
	var data = JSON.parse(req.body.mydata);
    newTrip = new Trip();

	newTrip.trip_owner = data.iduser;
	newTrip.trip_start = data.idcitystart;
	newTrip.trip_end = data.idcityend;
	newTrip.trip_date = new Date(data.date);
	newTrip.nb = 0;
	newTrip.nb_max = data.nb;
	
	newTrip.save(function(err){
        if(err){ throw err; }
    })
	res.send('Trip saved');
});

var teamTripSchema = mongoose.Schema({
	trip: 		[{ type: mongoose.Schema.Types.ObjectId, ref: 'TRIP', required: true}],
	trip_pa:	[{ type: mongoose.Schema.Types.ObjectId, ref: 'USER', required: true}],
});
var TeamTrip = mongoose.model('TEAMTRIP', tripSchema, 'TEAMTRIP');

app.post('/jointrip', requireLogin, function (req, res) {
	var jsonData = JSON.parse(req.body.mydata);
    newTeamTrip = new TeamTrip();

	newTeamTrip.trip = jsonData.tripid;
	newTeamTrip.trip_pa = jsonData.userid;
	
	newTeamTrip.save(function(err){
        if(err){ throw err; }
    })
	Trip.findById(jsonData.tripid)
	.$where('this.nb < this.nb_max')
	.exec(function(err, doc){
		if (err || !doc)
		else {
			doc.nb = parseInt(doc.nb) + 1;
			doc.save();
		}
	});
	res.send('TeamTrip saved');
});





app.listen(8080);