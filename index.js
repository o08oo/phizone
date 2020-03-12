var express=require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
socket.on('chat message', function(msg){
console.log(socket.request.session.passport);
    console.log('message: ' + msg);
io.emit('chat message', socket.request.session.passport.user.username+": "+msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


/*  PASSPORT SETUP  */

const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

app.get('/success', (req, res) => res.send("Welcome "+req.query.username+"!!"));
app.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id, function(err, user) {
    cb(err, user);
  });
});


/* MONGOOSE SETUP */

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/MyDatabase');

const Schema = mongoose.Schema;
const UserDetail = new Schema({
      username: String,
      password: String
    });
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');


/* PASSPORT LOCAL AUTHENTICATION */

const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
      UserDetails.findOne({
        username: username
      }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false);
        }

        if (user.password != password) {
          return done(null, false);
        }
        return done(null, user);
      });
  }
));

app.post('/',
  passport.authenticate('local', { failureRedirect: '/error' }),
  function(req, res) {
    res.redirect('/success?username='+req.user.username);
  });

// Set up the Session middleware using a MongoDB session store
expressSession = require("express-session");
var sessionMiddleware = expressSession({
    name: "COOKIE_NAME_HERE",
    secret: "COOKIE_SECRET_HERE",
    store: new (require("connect-mongo")(expressSession))({
        url: "mongodb://localhost/DATABASE_NAME_HERE"
    })
});

// Set up the Express server
app
    .use(sessionMiddleware)
    .use(passport.initialize())
    .use(passport.session());

io
    .use(function(socket, next){
        // Wrap the express middleware
        sessionMiddleware(socket.request, {}, next);
    });


