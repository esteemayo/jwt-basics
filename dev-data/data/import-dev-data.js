const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
require('colors');

// models
const User = require('../../models/User');

dotenv.config({ path: './config.env' });

// db local
const db = process.env.DATABASE_LOCAL;

// atlas mongo uri
const mongoUri = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);

// MongoDB connection
mongoose.connect(mongoUri)
    .then(() => console.log(`Connected to MongoDB → ${mongoUri}`.gray.bold))
    .catch((err) => console.log(`Could not connect to MongoDB → ${err}`.red.bold));

// read JSON file
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

// import data into database
const loadData = async () => {
    try {
        await User.create(users, { validateBeforeSave: false });
        console.log('👍👍👍👍👍👍👍👍 Done!'.green.bold);
        process.exit();
    } catch (ex) {
        console.log('\n👎👎👎👎👎👎👎👎 Error! The Error info is below but if you are importing sample data make sure to drop the existing database first with.\n\n\t npm run blowitallaway\n\n\n'.red.bold);
        console.log(ex);
        process.exit();
    }
};

// delete data from database
const removeData = async () => {
    try {
        console.log('😢😢 Goodbye Data...'.blue.bold);
        await User.deleteMany();
        console.log('Data Deleted. To load sample data, run\n\n\t npm run sample\n\n'.green.bold);
        process.exit();
    } catch (ex) {
        console.log(ex);
        process.exit();
    }
};

if (process.argv[2] === '--import') {
    loadData();
} else if (process.argv[2] === '--delete') {
    removeData();
}
