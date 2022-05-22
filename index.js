const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const res = require("express/lib/response");
require("dotenv").config();

const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req,res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'unauthorized access'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded)=>{
    if(err){
      return res.status(403).send({message: 'Forbidden Access'});
    }
    console.log('decoded', decoded);
    req.decoded = decoded;
    next();
  });
     //console.log('inside verifyJWT', authHeader);
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wd1z6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
console.log("inventory management connected");

async function run() {
  try {
    await client.connect();
    const inventoryCollection = client
      .db("inventoryManagement")
      .collection("inventory");
    const myItemsCollection = client
      .db("inventoryManagement")
      .collection("myItems");

    //update product quantity
          
            app.put('/updateq/:id', async(req, res) =>{
              const id = req.params.id;
              const updateQuantity = req.body;
              console.log(id);
        
              const filter = {_id: ObjectId(id)};
              const options = { upsert: true };
              const updatedDoc = {
                  $set: {
                     ...updateQuantity , 
                  }
              };
  
              const result = await inventoryCollection.updateOne(filter, updatedDoc, options);
              console.log(result);

              res.send(result);
          });



      //Auth
    app.post('/signin', async(req, res)=>{
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN,{
        expiresIn: '1d'
      });
      res.send({accessToken})
    })

    //Inventories API
    app.get("/inventory", async (req, res) => {
      const query = {};
      const cursor = inventoryCollection.find(query);
      const inventories = await cursor.toArray();
      res.send(inventories);
    });

    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      //console.log(id);
      const query = { _id: ObjectId(id) };
      const inventory = await inventoryCollection.findOne(query);
      res.send(inventory);
    });

    //POST
    app.post("/inventory", async (req, res) => {
      const newInventory = req.body;
      const result = await inventoryCollection.insertOne(newInventory);
      res.send(result);
    });

    //Delete API
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await inventoryCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/myItem:id", async(req, res)=>{
      const id = req.params.id;
      console.log("your deleted id: ",id);
      const query = {_id: ObjectId(id)};
      const result = await myItemsCollection.deleteOne(query);
      res.send(result);
    });

    //myItems Collection API

   app.get('/myItems', verifyJWT, async(req,res) =>{
     const decodedEmail = req.decoded.email;
     const email = req.query.email;
     
     console.log("check email: "+email + "  -  " + decodedEmail);
     if(email === decodedEmail){
       const query = {};
       const cursor = myItemsCollection.find(query);
       const myItems = await cursor.toArray();
      //  console.log(myItems);
       res.send(myItems);

     }
     else{
       res.status(403).send({message: 'Forbidden Access'})
     }
   })


    app.post("/myItems", async (req, res) => {
      const myItems = req.body;
      const result = await myItemsCollection.insertOne(myItems);
      res.send(result);
    });
  } 
  finally {

  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("inventory management server running");
});

app.listen(port, () => {
  console.log("listening server", port);
});
