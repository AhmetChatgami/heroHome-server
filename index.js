const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = 3000;
const admin = require("firebase-admin");
require("dotenv").config();
const serviceAccount = require("./adminsdk.json"); 
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");

});


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// MongoDB connection //
console.log(process.env.DB_PASS);
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0gdtq1d.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


const middleware = async (req, res, next)=>{
  const author = req.headers.authorization;
  if(!author){
    res.status(401).send({message: "Invalid Token"})
  }
  
  // Bearer tokenString

  const token = author.split(' ')[1];

   try{
    await admin.auth().verifyIdToken(token)
    next()
    
  } catch(error){
    res.status(401).send({message: "Unauthorized access"})
  }

}

async function run() {
  try {
    await client.connect();

    const database = client.db("providerdb");
    const providerCollection = database.collection("providers");
    const bookingsCollection = database.collection("bookings");

    app.get("/providers", async (req, res) => {
      const result = await providerCollection.find().toArray();
      res.send(result);
    });

    // Get single provider
    app.get("/providers/:id", async (req, res) => {
      const { id } = req.params;

      const result = await providerCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send({ success: true, result });
    });

    

    // Update API
    app.put("/providers/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const update = {
        $set: data,
      };

      const result = await providerCollection.updateOne(filter, update);

      res.send({ success: true, result });
    });

    // Delete API
    app.delete("/providers/:id", async (req, res) => {
      const { id } = req.params;
      const result = await providerCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send({ success: true });
    });

    // Post API
    app.post("/providers", async (req, res) => {
      const newProvider = req.body;
      const result = await providerCollection.insertOne(newProvider);
      res.send(result);
    });

    app.get("/latest", async (req, res) => {
      const result = await providerCollection
        .find()
        .sort({ price: "desc" })
        .limit(3)
        .toArray();
      console.log(result);
      res.send(result);
    });

    app.get("/my-services", middleware, async (req, res)=>{
      const email = req.query.email;
      const result = await providerCollection.find({email: email}).toArray();
      res.send(result);
    })

    // Booking APIs
    app.post("/bookings", async(req, res)=>{
      const data =req.body
      const result = await bookingsCollection.insertOne(data);
      res.send(result);
      console.log(result);
    })
    
// sorting out single booking
    // app.get("/bookings/bookedId", async (req, res) => {
    //   const bookedId = req.params.bookedId;
    //   const query = {booked_by: bookedId};
    //   const cursor = bookingsCollection.find(query).sort({price: -1})
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });


    app.get("/my-bookings", middleware,async(req, res)=>{
      const email = req.query.email;
      const result = await bookingsCollection.find({booked_by: email}).toArray();
      res.send(result);
    })

    app.get('/search', async(req,res)=>{
      const searchText = req.query.search
      const result = await providerCollection.find({
        category: { $regex: searchText, $options: "i" }
      }).toArray();
      res.send(result)
    })

    // Ping the deployment
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
// -----------****-----------//

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
