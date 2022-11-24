const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iohfkju.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);

async function run() {
    try {
        const categoriesCollection = client.db('icebox').collection('categories');
        const productsCollection = client.db('icebox').collection('products');

        app.get('/categories', async (req, res) => { 
         
            const query = {};
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
        })
        app.get('/category/:id', async (req, res) => { 
            const id = req.params.id;
            const query = { category_id: id };
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        })

        // app.get('/products/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { category_id: id };
        //     const product = await productsCollection.find(query).toArray();
        //     console.log(product);
        //     res.send(product);
        // })
        app.get('/products', async (req, res) => { 
         
            const query = {};
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        })
     

    }
    finally {

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('icebox server is running');
})

app.listen(port, () => console.log(`icebox running on ${port}`))