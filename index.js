const express = require("express");
const app = express();
const cors = require("cors");

const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.vhpjabi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//Start JWT verification
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log(authorization);
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  console.log("Token inside verify JWT", token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(403)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};
//End JWT verification

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //Define database collection
    const productCollection = client.db("collegeDB").collection("colleges");
    const candidateCollection = client.db("collegeDB").collection("candidates");

    //Start JWT operation
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10h",
      });
      res.send({ token });
    });
    //End JWT operation

    // Server visual test
    app.get("/", (req, res) => {
      res.send("Server running test!!!");
    });

    // Start GET crud operation.............................

    //Define Tabs products by category

    app.get("/colleges", async (req, res) => {
      const toys = productCollection.find();
      const result = await toys.toArray();
      res.send(result);
    });

    
    app.get("/testimonials", async (req, res) => {
      const toys = candidateCollection.find();
      const result = await toys.toArray();
      res.send(result);
    });

    //Define details view by id
    //Details view any specific item

    app.get("/colleges/:id", async (req, res) => {
      try {
        const specificItemId = req.params.id;
        const filter = { _id: new ObjectId(specificItemId) };

        const result = await productCollection.findOne(filter);
        res.send(result);
      } catch (error) {
        res.send(error.message);
      }
    });

    //Start get data by query or email

    app.get("/myCollege", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log("came back after verify", decoded);
      let query = {};

      if (decoded.email !== req.query.email) {
        return res.status(403).send({ error: 1, message: "forbidden access" });
      }

      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const sort = req.query.sort;
      const options = {
        sort: {
          price: sort === "asc" ? 1 : -1,
        },
      };
      const result = await candidateCollection.find(query, options).toArray();
      res.send(result);
    });

    // End get data by query or email

    // // Start get items by Sort
    // app.get("/updateToy", async (req, res) => {
    //     const toys = await productCollection
    //       .find({})
    //       .sort({ createdAt: -1 })
    //       .toArray();
    //     res.send(toys);
    //   });
    // // End get items by Sort

    // app.get("/api/data", async (req, res) => {
    //   const { sort } = req.query;

    //   let data = await productCollection.find().toArray();

    //   res.send(data)
    // // Convert number strings to numbers
    // let convertedData = data.map(item => ({
    //   ...item,
    //   price: Number(item.price)
    // }));

    // let sortedData = [...convertedData];
    //   if (sort == "asc") {
    //     sortedData.sort((a, b) => a.price - b.price);
    //   } else if (sort == "desc") {
    //     sortedData.sort((a, b) => b.price - a.price);
    //   }

    //   res.send(sortedData);
    // });

    // Start Get items by Search

    app.get("/getCollegeNameByText/:text", async (req, res) => {
      const text = req.params.text;
      const result = await productCollection
        .find({
          $or: [{ collegeName: { $regex: text, $options: "i" } }],
        })
        .toArray();
      res.send(result);
    });

    // End Get items by Search

    // End GET crud operation.................

    // Start POST crud operation..................

    //Start POST data get from client by website form or else by form

    app.post("/admissionForm", async (req, res) => {
      try {
        const dataSetClient = req.body; //get data from website to server site
        // console.log(dataGetClient);

        const result = await candidateCollection.insertOne(dataSetClient); // Define the database collection where keep the data
        res.send(result); //Send data from server site to database(MongoDB)
      } catch (error) {
        res.send(error.message);
      }
    });

    //End POST data get from client by website form or else by form

    // End POST crud operation...........................

    // Start PATCH crud operation............................

    //Start PATCH or PUT specific database(MongoDB) update

    // API to update the admission form data by college ID
    app.patch("/admissionForm/:id", async (req, res) => {
      try {
        const specificItemId = req.params.id; //catch the target item
        const updatedFormData = req.body; //get data from website to server site
        const filter = { _id: new ObjectId(specificItemId) }; //Match the target item in the database and client site

        const newUpdatedItem = {
          $set: {
            ...updatedFormData,
          },
        };

        const result = await candidateCollection.updateOne(
          filter,
          newUpdatedItem
        );
        res.send(result);
      } catch (error) {
        res.status(500).send(error.message);
      }
    });
    //End PATCH or PUT specific database(MongoDB) update
    // End PATCH crud operation...........

    // Start DELETE crud operation...............

    //Start Delete  specific or target single item by id
    // app.delete("/myToys/:id", async (req, res) => {
    //   try {
    //     const specificItemId = req.params.id; //catch the target item
    //     const filter = { _id: new ObjectId(specificItemId) }; //Match the target item database and client site
    //     const result = await productCollection.deleteOne(filter); // targeted  single item deleted
    //     res.send(result); //send response database to client site
    //   } catch (error) {
    //     res.send(error.message);
    //   }
    // });
    //End Delete  specific or target single item by id
    // End DELETE crud operation.....................

    //Creating index on two fields
    //  const indexKeys = { price: 1 }; // Replace field1 and field2 with your actual field names
    //  const indexOptions = { email: "sellerEmail" }; // Replace index_name with the desired index name
    //  const result = await productCollection.createIndex(indexKeys, indexOptions);
    //  console.log(result);
    //  End index on two fields

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`My server on port ${port}`);
});
