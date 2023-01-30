require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.njxwr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();
    const powerCollection = client.db("powerHack").collection("billing-list");

    app.post("/api/login", verifyJWT, async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
      res.send({ accessToken });
    });

    app.post("/api/registration", verifyJWT, async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ accessToken });
    });

    app.get("/api/billing-list", async (req, res) => {
      const query = {};
      const cursor = powerCollection.find(query);
      const billings = await cursor.toArray();
      res.send(billings);
    });

    app.get("/billings", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = powerCollection.find(query);
      let bills;
      if (page || size) {
        bills = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        bills = await cursor.toArray();
      }
      res.send(bills);
    });

    app.get("/billingCount", async (req, res) => {
      const count = await powerCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.post("/api/billing-list", async (req, res) => {
      const newBill = req.body;
      const result = await powerCollection.insertOne(newBill);
      res.send(result);
    });

    // update billing
    app.patch("/api/update-billing/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = { $set: body };
      const result = await powerCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/api/delete-billing/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await powerCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Power Hack Website server");
});
app.listen(port, () => {
  console.log(`Power Hack website is running on ${port}`);
});
