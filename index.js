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

    app.get('/pet', async(req, res)=>{
      const result = await petCollection.find().toArray();
      res.json(result);
    })

  app.get('/pet/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const isValidId = ObjectId.isValid(id);

      const query = {
        $or: [
          {_id : id}, 
          isValidId ? { _id: new ObjectId(id) } : null 
          ].filter(Boolean) 
      };

      const result = await petCollection.findOne(query);

      if (!result) {
        return res.status(404).json(null);
      }

      res.json(result);
    } catch (error) {
      console.error("Backend single pet fetch error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post('/pet', async(req, res)=>{
    const petData = req.body
    console.log(petData);
    const result = await petCollection.insertOne(petData);
    res.json(result);
  })

  app.post('/request', async(req, res) => {
    const requestData = req.body
    const result = await requestsCollection.insertOne(requestData);
    res.json(result);
  })

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
