const express = require('express')
const morgan = require('morgan');
const cors = require('cors');
const hpp = require('hpp');
const xss = require('xss-clean');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// routes
const userRouter = require('./routes/users');
const NotFoundError = require('./errors/notFound');
const globalErrorHandler = require('./controllers/errorController');

// start express app
const app = express();

// global middlewares
// implement CORS
app.use(cors());
// access-control-allow-origin
app.options('*', cors());

// set security HTTP headers
app.use(helmet());

// development logging
if (app.get('env') === 'development') {
    app.use(morgan('dev'));
}

// limit request from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, Please try again in an hour!',
});

app.use('/api', limiter);

// body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// data sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(hpp());

// compression middleware
app.use(compression());

// test middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);
    // console.log(req.cookies);

    next();
});

// api routes
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
    next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

module.exports = app;
