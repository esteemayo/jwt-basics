const mongoose = require('mongoose');
const dotenv = require('dotenv');
require('colors');

process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION 🔥! Shutting down gracefully...'.red.bold);
    console.log(err.name, err.message);
    process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// database local
const db = process.env.DATABASE_LOCAL;

// atlas mongo uri
const mongoUri = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

mongoose.connect(mongoUri)
    .then(() => console.log(`Conected to MongoDB → ${mongoUri}`.gray.bold));

app.set('port', process.env.PORT || 6060);

const server = app.listen(app.get('port'), () => {
    console.log(`Server running on port → ${server.address().port}`.blue.bold);
});

process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION 🔥! Shutting down gracefully...'.red.bold);
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
