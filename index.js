const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iohfkju.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

async function run() {
    try {
        const categoriesCollection = client.db('icebox').collection('categories');
        

    }
    finally {

    }
}
run().catch(console.log);


app.get('/', async (req, res) => {
    res.send('icebox server is running');
})

app.listen(port, () => console.log(`icebox running on ${port}`))