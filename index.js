const express = require('express')
const app = express()
const cors = require('cors')
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
    try {
        // Connect the client to the server	(optional starting in v4.7)

        // await client.connect();
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

        //get latest blogs
        app.get('/latest-blogs', async(req,res)=>{
            const blogs = await CollectionOfBlogs.find().sort({date_time:-1}).limit(5).toArray();
            res.send(blogs);
        })

        app.delete("/blogs/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await CollectionOfBlogs.deleteOne(filter)
            res.send(result)
        })
        //showing blog of a specific user
        app.get('/blog', async (req, res) => {
            const email = req.query.email;
            const filter = { email: email }
            const blog = await CollectionOfBlogs.find(filter).toArray();
            res.send(blog);
        });

        app.get("/blog/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const blog = await CollectionOfBlogs.findOne(filter)
            res.send(blog)
        })

        //update my blog
        app.put("/blog/:id", async (req, res) => {
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

        //profile api
        app.post('/profile', async (req, res) => {
            const profile = req.body;
            const result = await CollectionOfProfile.insertOne(profile);
            res.send(result);
        })
        app.get("/profile", async(req,res)=>{
            const user = req.query;
            const filter = {email: user.email}
            const result = await CollectionOfProfile.find(filter).toArray()
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

        app.get('/users', async (req, res) => {
            const users = req.body;
            const result = await CollectionOfAllUsers.find(users).toArray();
            res.send(result);
        })

        app.delete("/users/:id", async(req,res)=>{
            const Id = req.params.id;
            const filter = {_id : new ObjectId(Id)}
            const result = await CollectionOfAllUsers.deleteOne(filter)
            res.send(result)
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