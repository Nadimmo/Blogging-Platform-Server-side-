const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const dotenv = require("dotenv")
dotenv.config()
const port = process.env.PORT || 5000;

app.use(express.json())
app.use(cors({
    origin: ["https://blogging-platform-5850d.firebaseapp.com/", "https://blogging-platform-5850d.web.app/", "http://localhost:5173"],
    methods: "GET, POST, PUT, DELETE",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}))


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rrkijcq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    // Connect to the MongoDB server
    const CollectionOfBlogs = client.db("BloggingPlatformDB").collection("blogsDB");
    const CollectionOfReview = client.db("BloggingPlatformDB").collection("reviewDB");
    const CollectionOfContact = client.db("BloggingPlatformDB").collection("contactDB");
    const CollectionOfSaveBlogs = client.db("BloggingPlatformDB").collection("saveBlogsDB");
    const CollectionOfAllUsers = client.db("BloggingPlatformDB").collection("usersDB");
    const CollectionOfProfile = client.db("BloggingPlatformDB").collection("profilesDB");
    const CollectionOfAuthor = client.db("BloggingPlatformDB").collection("authorsDB");
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        //create jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign({ user }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ token });
        })

        //verify token
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "UnAuthorize Access" })
            }
            const token = req.headers.authorization.split(' ')[1];
            console.log("token", token)
            jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
                if (error) {
                    return res.status(403).send({ message: "Token is not valid" })
                }
                req.decoded = decoded
                // console.log(req.decoded)
                // console.log("email form token", req.decoded.user.email)
                next();
            })
        }

        //verify admin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.user.email;
            const filter = { email: email }
            const result = await CollectionOfAllUsers.findOne(filter)
            const isAdmin = result.role === "admin"
            if (!isAdmin) {
                return res.status(403).send({ message: "Not authorized to perform this action" })
            }
            next()
        }

        //blog related api
        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            const result = await CollectionOfBlogs.insertOne(blog);
            res.send(result);
        });

        app.get('/blogs', async (req, res) => {
            const blogs = await CollectionOfBlogs.find().toArray();
            res.send(blogs);
        });

        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const blog = await CollectionOfBlogs.findOne(filter);
            res.send(blog);
        });

        app.delete("/blogs/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await CollectionOfBlogs.deleteOne(filter)
            res.send(result)
        })
        //get latest blogs
        app.get('/latest-blogs', async (req, res) => {
            const blogs = await CollectionOfBlogs.find().sort({ date_time: -1 }).limit(5).toArray();
            res.send(blogs);
        })

        //showing blog of a specific user
        app.get('/blog', verifyToken, async (req, res) => {
            const email = req.query.email;
            const filter = { email: email }
            const blog = await CollectionOfBlogs.find(filter).toArray();
            res.send(blog);
        });
        app.get("/blog/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const blog = await CollectionOfBlogs.findOne(filter)
            res.send(blog)
        })
        //update my blog
        app.put("/blog/:id", verifyToken, async (req, res) => {
            const id = req.params.id;
            const updatedBlog = req.body;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    title: updatedBlog.title,
                    short_description: updatedBlog.short_description,
                    blog_details: updatedBlog.blog_details,
                    category: updatedBlog.category,
                    author_name: updatedBlog.author_name,
                    email: updatedBlog.email,
                    date_time: updatedBlog.date_time,
                    image: updatedBlog.image,
                    likes: 0
                }
            }
            const result = await CollectionOfBlogs.updateOne(filter, updateDoc)
            res.send(result)
        })


        //review related api
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await CollectionOfReview.insertOne(review);
            res.send(result);
        });
        app.get('/review', async (req, res) => {
            const review = req.body;
            const result = await CollectionOfReview.find(review).toArray();
            res.send(result);
        })
        app.get("/review/:id", async (req, res) => {
            const Id = req.params.id;
            const filter = { _id: new ObjectId(Id) }
            const result = await CollectionOfReview.findOne(filter)
            res.send(result)
        })
        app.delete("/review/:id", verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await CollectionOfReview.deleteOne(filter)
            res.send(result)
        })
        app.put("/review/:id", verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const updatedReview = req.body;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    name: updatedReview.name,
                    designation: updatedReview.designation,
                    review: updatedReview.review
                }
            }
            const result = await CollectionOfReview.updateOne(filter, updateDoc)
            res.send(result)
        })

        //profile api
        app.post('/profile', async (req, res) => {
            const profile = req.body;
            const result = await CollectionOfProfile.insertOne(profile);
            res.send(result);
        })
        //get profile of a specific user
        app.get("/profile", verifyToken, async (req, res) => {
            const user = req.query;
            const filter = { email: user.email }
            const result = await CollectionOfProfile.find(filter).toArray()
            res.send(result)
        })
        app.get("/profiles", verifyToken, async (req, res) => {
            const user = req.body;
            const result = await CollectionOfProfile.find(user).toArray()
            res.send(result)
        })
        app.get("/profiles/:id", async (req, res) => {
            const Id = req.params.id;
            const filter = { _id: new ObjectId(Id) }
            const result = await CollectionOfProfile.findOne(filter)
            res.send(result)
        })
        //update specific profile
        app.put("/profiles/:id", async (req, res) => {
            const Id = req.params.id;
            const updatedProfile = req.body;
            const filter = { _id: new ObjectId(Id) }
            const updateDoc = {
                $set: {
                    name: updatedProfile.name,
                    bio: updatedProfile.bio,
                    designation: updatedProfile.designation
                }
            }
            const result = await CollectionOfProfile.updateOne(filter, updateDoc)
            res.send(result)
        })

        //contact related api
        app.post('/contact', async (req, res) => {
            const contact = req.body;
            const result = await CollectionOfContact.insertOne(contact);
            res.send(result);
        });
        app.get('/contact', async (req, res) => {
            const contact = req.body;
            const result = await CollectionOfContact.find(contact).toArray();
            res.send(result);
        })

        //save blogs related api
        app.post('/save-blogs', async (req, res) => {
            const { blogId, email } = req.body;  // Fix destructuring

            if (!blogId || !email) {
                return res.status(400).send('Missing blogId or email');
            }
            const filter = { blogId, email }; // Ensure user can save different blogs
            const existing = await CollectionOfSaveBlogs.findOne(filter); // Use findOne()
            if (existing) {
                return res.status(400).send('Blog already saved');
            }

            const result = await CollectionOfSaveBlogs.insertOne({ blogId, email });
            res.send(result);
        });
        app.get('/saved-blogs', async (req, res) => {
            const email = req.query.email;
            const savedBlogs = await CollectionOfSaveBlogs.find({ email }).toArray();
            res.send(savedBlogs);
        });

        //added new author
        app.post("/addAuthor", async (req, res) => {
            const author = req.body;
            const result = await CollectionOfAuthor.insertOne(author)
            res.send(result)
        })
        app.get("/authors", async (req, res) => {
            const author = req.body;
            const result = await CollectionOfAuthor.find(author).toArray()
            res.send(result)
        })
        app.get("/authors/:id", async (req, res) => {
            const Id = req.params.id;
            const filter = { _id: new ObjectId(Id) }
            const result = await CollectionOfAuthor.findOne(filter)
            res.send(result)
        })


        //user related api
        app.post('/users', async (req, res) => {
            const user = req.body;
            const email = { email: user.email }
            const existing = await CollectionOfAllUsers.findOne(email);
            if (existing) {
                return res.status(400).send('User already exists');
            }
            const result = await CollectionOfAllUsers.insertOne(user);
            res.send(result);
        });
        app.get('/users', verifyToken, async (req, res) => {
            const users = req.body;
            const result = await CollectionOfAllUsers.find(users).toArray();
            res.send(result);
        })
        app.get("/users/:id", verifyToken, async (req, res) => {
            const Id = req.params.id;
            const filter = { _id: new ObjectId(Id) }
            const result = await CollectionOfAllUsers.findOne(filter)
            res.send(result)
        })
        app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
            const Id = req.params.id;
            const filter = { _id: new ObjectId(Id) }
            const result = await CollectionOfAllUsers.deleteOne(filter)
            res.send(result)
        })
        //make admin
        app.put('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const ID = req.params.id;
            const filter = { _id: new ObjectId(ID) }
            const updateDoc = {
                $set: { role: "admin" }
            }
            const result = await CollectionOfAllUsers.updateOne(filter, updateDoc)
            res.send(result)
        })
        //check admin
        app.get("/users/admin/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.user.email) {
                return res.status(401).send({ message: "Unauthorize access" })
            }
            const filter = { email: email }
            const result = await CollectionOfAllUsers.findOne(filter)
            let admin = false;
            if (result) {
                admin = result.role === "admin"
            }
            res.send({ admin })
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('project is ready')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})