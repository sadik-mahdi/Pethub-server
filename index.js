const express = require('express');
const dotenv = require('dotenv');
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();

const uri =  process.env.MONGODB_URI;

const app = express()
const PORT = process.env.PORT

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const db = client.db("pet-hub");
    const petCollection = db.collection("pets");
    const requestsCollection = db.collection("requests");

  app.get("/pet", async (req, res) => {
    const { search, species } = req.query;
    const query = {};
    if (search) {
      query.petName = {
        $regex: search,
        $options: "i",
      };
    }
    if (species) {
      query.species = {
        $in: species.split(","),
      };
    }
    const result = await petCollection.find(query).toArray();
    res.json(result);
  });

  app.get("/pet/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    let query;
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const pet = await petCollection.findOne(query);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }
    res.json(pet);
  });

  app.post("/pet", async (req, res) => {
    const petData = req.body;

    const result = await petCollection.insertOne(petData);

    res.json(result);
  });

  app.get("/request/:userId", async (req, res) => {
    const { userId } = req.params;
    const result = await requestsCollection.find({ userId }).toArray();
    res.json(result);
  });

  app.post('/request', async(req, res) => {
    const requestData = req.body
    const result = await requestsCollection.insertOne(requestData);
    res.json(result);
  })

  app.delete("/request/:requestId", async (req, res) => {
    const { requestId } = req.params;

    const result = await requestsCollection.deleteOne({
      _id: new ObjectId(requestId),
    });

    res.json(result);
  });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
