require('dotenv').load();
const redis = require('socket.io-redis');
const bodyParser = require('body-parser');
const express = require('express');
const methodOverride = require('method-override');
const streams = require('./app/streams.js')();
const socketLogger = require('socketio-winston-logger');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors()); //NOSONAR
app.set('port', process.env.PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
  })
);
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

require('./app/routes.js')(app, streams);

let server;
server = app.listen(app.get('port'), function () {
  console.log('Express server listening on PORT', server.address().port);
});

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const winstonSocketLogger = createLogger({
  level: 'debug',
  format: combine(
    label({ label: 'SignalService' }),
    timestamp(),
    myFormat
  ),
  transports: [new transports.Console()]
});

const io = require('socket.io').listen(server);
io.use(socketLogger(winstonSocketLogger));

/**
 * redis server configuration
 */
io.adapter(
  redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  })
);
/**
 * create socket server
 */
require('./app/socketHandler.js')(io, streams, winstonSocketLogger);
