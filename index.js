const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iohfkju.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);


//jwt middleware
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}



async function run() {
    try {
        const categoriesCollection = client.db('icebox').collection('categories');
        const productsCollection = client.db('icebox').collection('products');
        const bookingsCollection = client.db('icebox').collection('bookings');
        const usersCollection = client.db('icebox').collection('users');
        const paymentsCollection = client.db('icebox').collection('payments');
        const addProductsCollection = client.db('icebox').collection('addProducts')
        const googleUsersCollection = client.db('icebox').collection('googleUsers')
        
 


        app.get('/categories', async (req, res) => {
             const query = {};
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
        })

       


        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            console.log(req.params.id);
            const product_category = await categoriesCollection.find({category_id : id}).toArray();
            console.log(product_category);
            res.send(product_category);
        })

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            console.log(req.params.id);
           
                const product_category = await productsCollection.find({category_id : id}).toArray();
                console.log(product_category);
                res.send(product_category);
           
           
        })

//category select er jonno
        app.get('/categoriesName', async (req, res) => {
            const query = {};
            const category = await categoriesCollection.find(query).project({name:1}).toArray();
            res.send(category);
        })

        app.get('/products', async (req, res) => {
         
            const query = {};
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        })

        app.get('/bookings',  async (req, res) => {
            const email = req.query.email;

            // const decodedEmail = req.decoded.email;
            // verifyJWT,
            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }

            const query = { email: email };
            const bookings= await bookingsCollection.find(query).toArray();
            res.send(bookings);
            console.log(bookings);
        })


//bookings korte
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

//id onujayi booking get kora
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        })

//payment
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })
        
        
//jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            console.log(user);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1D' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
           
        }) 
//admin ki na check
app.get('/users/admin/:email', async (req, res) => {
    const email = req.params.email;
    const query = { email }
    const user = await usersCollection.findOne(query);
    res.send({isAdmin: user?.role === 'admin' });
})
        
        //seller ki na check
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.userType === 'seller' });
        })

         //buyer ki na check
         app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isBuyer: user?.userType === 'buyer' });
        })

        
       

        //allbuyers seller
        app.get('/users/:userType', async (req, res) => {
            const userType = req.params.userType;
            console.log(userType);
            const query = { userType: userType };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            console.log(result)
            res.send(result);
        })

        //admin banabo
        app.put('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

       

        //googleUsers
        app.post('/googleUsers', async (req, res) => {
            const googleUser = req.body;
            console.log(googleUser);
            const result = await googleUsersCollection.insertOne(googleUser);
            console.log(result)
            res.send(result);
        })

        //delete product
        app.delete('/addProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await addProductsCollection.deleteOne(query);
            res.send(result);
        })

        //delete Buyer
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })

        //delete Buyer
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        })

         //myproduct get
         app.get('/addProducts', async (req, res) => {
             const query = {};
           
            const myProducts = await addProductsCollection.find(query).toArray();
            console.log(myProducts)
            res.send(myProducts);
        })

        //addproduct post
        app.post('/addProducts', async (req, res) => {
            const product = req.body;
            console.log(product);
            const result = await addProductsCollection.insertOne(product);
            console.log(result)
            res.send(result);
        })

        //available get
        app.get('/addProducts/:role', async (req, res) => {
            const role = req.params.role;
            console.log(role);
            const query = { role: role };
            const proCollection = await addProductsCollection.find(query).toArray();
            res.send(proCollection);
        });
        //make verify

        app.put('/users/verify/:id', async (req, res) => {
        
        //     const decodedEmail = req.decoded.email;
        //  const query = { email: decodedEmail };
        //  const user = await usersCollection.findOne(query);
        //  if (user?.type !== 'verified') {
        //      return res.status(403).send({
        //          message: 'forbidden access'
        //      })
        //  }


    const id = req.params.id;
    const filter = { _id: ObjectId(id) }
    const options = { upsert: true };
    const updatedDoc = {
        $set: {
            type: 'verified'
        }
    }
    const result = await usersCollection.updateOne(filter, updatedDoc, options);
    res.send(result);
    });

   //make advertise

        app.put('/addProducts/available/:id',  async (req, res) => {
        
            //     const decodedEmail = req.decoded.email;
            //  const query = { email: decodedEmail };
            //  const user = await addProductsCollection.findOne(query);
            //  if (user?.role !== 'available') {
            //      return res.status(403).send({
            //          message: 'forbidden access'
            //      })
            //  }


        const id = req.params.id;
        const filter = { _id: ObjectId(id) }
        const options = { upsert: true };
        const updatedDoc = {
            $set: {
                role: 'available'
            }
        }
        const result = await addProductsCollection.updateOne(filter, updatedDoc, options);
        res.send(result);
        });
        
//report
        app.put('/products/report/:id',  async (req, res) => {
        
            //     const decodedEmail = req.decoded.email;
            //  const query = { email: decodedEmail };
            //  const user = await addProductsCollection.findOne(query);
            //  if (user?.role !== 'available') {
            //      return res.status(403).send({
            //          message: 'forbidden access'
            //      })
            //  }


        const id = req.params.id;
        const filter = { _id: ObjectId(id) }
        const options = { upsert: true };
        const updatedDoc = {
            $set: {
                type: 'report'
            }
        }
        const result = await productsCollection.updateOne(filter, updatedDoc, options);
        res.send(result);
        });

        // reported product
        app.get('/products/report/:type', async (req, res) => {
            const type= req.params.type;
            console.log(type);
            const query = { type:type};
            const reportedItem = await productsCollection.find(query).toArray();
            res.send(reportedItem);
        });


     
        

    }

    finally {

    }
}
run().catch(console.log);

app.get('/', async (req, res) => {
    res.send('icebox server is running');
})

app.listen(port, () => console.log(`icebox running on ${port}`))