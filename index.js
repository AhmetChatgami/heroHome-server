const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// MongoDB connection //

const uri =
  "mongodb+srv://homedb:Ob2lXMAobuox9b5A@cluster0.0gdtq1d.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("providerdb");
    const providerCollection = database.collection("providers");

    app.get("/providers", async (req, res) => {
      const result = await providerCollection.find().toArray();
      res.send(result);
    });

    app.post("/providers", async (req, res) => {
      const newProvider = req.body;
      const result = await providerCollection.insertOne(newProvider);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
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
