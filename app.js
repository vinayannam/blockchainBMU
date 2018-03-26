var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/blockchain-server');
var db = mongoose.connection;

var routes = require('./routes/index');
var users = require('./routes/users');
var bank = require('./routes/bank');
var miners = require('./routes/miners');

var app = express();
app.enable('trust proxy')
var io = require('socket.io')(3100);

app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({ defaultLayout: 'layout' }));
app.set('view engine', 'handlebars');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));

app.use(flash());

app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/bank', bank);
app.use('/miners', miners);

app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function() {
    console.log('User server started on port ' + app.get('port'));
    console.log('Miner server started on port ' + 3100);
});

var Transaction = require('./models/transaction');
var Miner = require('./models/miner');

var online = [];

io.on('connection', function(socket) {
    var address = socket.handshake.address;
    var ip = address.split(':')[address.split(':').length - 1];
    Miner.getAllMiners(function(err, miners) {
        miners.forEach(function(miner) {
            if (ip == miner.ipaddress) {
                console.log("Miner " + ip + " is connected");
                online.push(socket);
                console.log("Miners online: " + online.length);
                Transaction.getAllTransactions(function(err, transactions) {
                    socket.emit('transaction', { transactions: transactions });
                });
            }
        });
    });
    socket.on('disconnect', function() {
        console.log('Miner ' + ip + ' got disconnected!');
        var i = online.indexOf(socket);
        online.splice(i, 1);
        console.log("Miners online: " + online.length);
    });
});