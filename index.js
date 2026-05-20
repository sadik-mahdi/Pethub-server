
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();

const app = express()
const port = 5000

app.use(cors())
app.use(express.json())

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // await client.connect();

    const db = client.db("pet-hub");
    const petCollection = db.collection("pets");

    app.get("/pet", async(req, res) => {
      const result  = await petCollection.find().toArray();
      res.json(result);
    })

    app.post("/pet", async (req, res) => {
      try {
        const petData = req.body;
        const result = await petCollection.insertOne(petData);

        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(500).send("Insert failed");
      }
    });


    app.get("/pet/:id", async(req, res)=> {
      const {id} = req.params
      const result = await petCollection.findOne({_id:id})
      res.json(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log("Ping successful");
  } catch (err) {
    console.error("Mongo error:", err);
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
