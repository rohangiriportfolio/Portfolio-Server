require("dotenv").config();
require("./db/conn");
const express = require("express");
const app = express();
const cors = require("cors");
const PORT = 5000 || process.env.PORT;
const userdb = require("./model/userSchema");
const commentdb = require("./model/commentSchema");
const cookieParser = require('cookie-parser');
const jwtToken = require('jsonwebtoken');
const validateCookie = require('./middle/jwtMiddle');

app.use(cors({
    origin: "https://rohan-giri-portfolio.vercel.app",
    methods: "GET,POST,PUT,DELETE",
    credentials: true
}));

app.use(express.json());

app.use(cookieParser());

app.use(validateCookie("token"));

app.post("/api/data", async (req, res) => {
    try {
    //   let profile = req.query;  // For get request
    let profile = req.body;
      console.log("Received data:", profile.sub);
  
      // Make sure userdb is correctly imported and connected to MongoDB
      let user = await userdb.findOne({ googleId: profile.sub });
  
      if (!user) {
        user = new userdb({
          googleId: profile.sub,
          displayName: profile.name,
          email: profile.email,
          image: profile.picture,
        });
  
        await user.save(); // Wait for the save operation
        console.log("User saved to MongoDB:", user);
      } else {
        console.log("User already exists:", user);
      }
    profile={
        googleId:profile.sub,
        displayName:profile.name,
        email:profile.email,
        image:profile.picture, 
    }
    // res.cookie('user', profile); 
    const token = jwtToken.sign(profile,"JaiShreeRam");
    res.status(200)
   .cookie("token", token, {
       httpOnly: true,
       secure: true,
       sameSite: "None"
   })
   .send('https://rohan-giri-portfolio.vercel.app');

    // res.status(200).json({ message: "User saved" });
    } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ message: "Error saving data", error });
    }
});
 
app.get("/login/success", (req, res) => {
    const user = JSON.stringify(req.user); 
    // res.send(req.cookies.user); 
    // console.log('TestUser: ', user);
    if (user) {
        res.status(200).json({user});
    } else {
        res.status(400).json({ message: "Not Authorized" });
    }
})

app.get("/comments/show", async (req, res) => {
    try {
        const allComments = await commentdb.find({});
        res.send({ message: "Comments sent", comments: allComments });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error fetching comments" });
    }
});



app.post('/comments/submit', (req, res) => {
    const { text, userdata } = req.body;

    // Process the text data
    console.log(text, userdata);
    let comment = new commentdb({
        googleId: userdata.googleId,
        displayName: userdata.displayName||'Visitor',
        image: userdata.image,
        comment: text,
        like: [],
        disLike: []
    });
    comment.save();
    // Send a response back to the client
    res.json({ message: 'Data received successfully' });
});

app.post('/likes/submit', async (req, res) => {
    const { cardId, userdata } = req.body;
    const id = await commentdb.findById(cardId);
    const userId = userdata.googleId !== undefined ? userdata.googleId : '1';
    if (id.like.includes(userId)) {
        id.like = id.like.filter(id => id !== userId);
        await id.save();
        res.send({ message: 'false' });
    }
    else {
        id.like.push(userId);
        await id.save();
        res.send({ message: 'true' });
    }
});

app.post('/disLikes/submit', async (req, res) => {
    const { cardId, userdata } = req.body;
    const id = await commentdb.findById(cardId);
    const userId = userdata.googleId !== undefined ? userdata.googleId : '2';
    if (id.disLike.includes(userId)) {
        id.disLike = id.disLike.filter(dislike => dislike !== userId);
        await id.save();
        res.send({ message: 'false' });
    } else {
        id.disLike.push(userId);
        await id.save();
        res.send({ message: 'true' });
    }
});


app.get("/logout", (req, res) => {
    res.clearCookie('token', { path: '/' }); 
    // res.status(200).redirect("https://portfolio-client-bay-seven.vercel.app/");
    res.status(200).redirect("https://rohan-giri-portfolio.vercel.app/");
  });

app.listen(PORT, () => {
    console.log(`server start at port no ${PORT}`)
})
