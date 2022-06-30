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

//a. api/registration
// b. api/login
// c. api/billing-list
// d. api/add-billing
// e. api/update-billing/:id
// f. api/delete-billing/:id

// client.connect((err) => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });

async function run() {
  try {
    await client.connect();
    const powerCollection = client.db("powerHack").collection("billing-list");

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
    app.put("/api/update-billing/:id", async (req, res) => {
      const id = req.params.id;
      const billingData = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: billingData.name,
          email: billingData.email,
          amount: billingData.amount,
          phone: billingData.phone,
        },
      };
      const result = await profileCollection.updateOne(
        filter,
        updateDoc,
        options
      );
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
