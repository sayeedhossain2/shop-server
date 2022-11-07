const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("colors");
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_PRODUCT}:${process.env.DB_PASSWORD}@cluster0.khpqtwr.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const practiceCollection = client.db("nodePractice").collection("practice");
    const orderCollection = client.db("nodePractice").collection("orders");

    // veryfy jwt
    function verifyJWT(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = authHeader.split(" ")[1];
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        function (err, decoded) {
          if (err) {
            return res.status(403).send({ message: "unauthorized access" });
          }
          req.decoded = decoded;
          next();
        }
      );
    }

    /* 
    jwt.verify(token, 'shhhhh', function(err, decoded) {
  console.log(decoded.foo) // bar
});
    */

    // jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1hr",
      });
      res.send({ token });
    });

    // get all the data
    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = practiceCollection.find(query);
      const products = await cursor
        .skip(page * size)
        .limit(size)
        .toArray();
      const count = await practiceCollection.estimatedDocumentCount();
      res.send({ count, products });
    });

    // get value using _id
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const products = await practiceCollection.findOne(query);
      res.send(products);
    });

    // single product
    app.get("/singleproducts/:name", async (req, res) => {
      const name = req.params.name;
      const query = { name: name };
      const products = await practiceCollection.findOne(query);
      res.send([products]);
    });

    // get value by name
    app.get("/product/:category", async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const products = await practiceCollection.find(query).toArray();
      res.send(products);
      //   category
    });

    // specific data post to db
    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await practiceCollection.insertOne(product);
      res.send(result);
    });

    // orders api start
    app.post("/orders", async (req, res) => {
      const orders = req.body;
      const result = await orderCollection.insertOne(orders);
      res.send(result);
    });
    // orders api end

    // order data get from database
    app.get("/orders", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log("inside orders api", decoded);
      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "Forbiden access" });
      }

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }

      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    // delete operation using id
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      console.log(result);
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.log(error.name, error.message));

app.get("/", (req, res) => {
  res.send("practice problem server is running");
});

app.listen(port, () => {
  console.log(`practice problem server running on ${port}`.cyan.bold);
});
