const express = require('express');
const dotenv = require('dotenv');
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`))

const verifyToken = async(req, res, next) => {
  const authHeader = req?.headers.authorization;
  if(!authHeader){
    return res.status(401).json({message : "Unauthorized"})
  }
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.split(" ")[1] 
    : authHeader;
  if(!token){
    return res.status(401).json({message : "Unauthorized"})
  }
  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload; 
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(403).json({ message: "Forbidden: Verification failed" });
  }
};

async function run() {
  try {
    // await client.connect();

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

  app.get("/pet/:id", verifyToken, async (req, res) => {
    try {
      const { id } = req.params;

      const pet = await petCollection.findOne({ _id: id });

      if (!pet) {
        return res.status(404).json({ message: "Pet not found" });
      }

      res.json(pet);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/request/:userId", verifyToken, async (req, res) => {
    const { userId } = req.params;
    const result = await requestsCollection.find({ userId }).toArray();
    res.json(result);
  });

  app.post('/request', verifyToken, async(req, res) => {
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

    // await client.db("admin").command({ ping: 1 });
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
