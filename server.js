const express = require('express');
const app = express();
const cors = require('cors');
const allowedOrigins = ['http://localhost:5173', 'https://eco-eats-backend.vercel.app/'];

const corsConfig = {

    origin: ['http://localhost:5173', 'https://eco-eats-backend.vercel.app'], // First two are frontend and Last one is for backend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.options("*", cors(corsConfig)); // Allow preflight requests for all routes
app.use(cors(corsConfig));

const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');

const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donor');
const agentRoutes = require('./routes/agent');

require("dotenv").config();
require("./config/dbConnection.js")();
require('./config/passport')(passport);


app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(session({
    secret:'secret',
    store:new MongoStore({mongoUrl:process.env.MONGODB_URI}),
    resave:false,
    secure: false, // set to false if not in production
    sameSite: 'none', // set to 'lax' if not in production
    saveUninitialized:false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(methodOverride('_method'));
app.use((req,res,next)=>{
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.warning = req.flash('warning');
    res.locals.currentUser = req.user;
    next();
});

//Routes
app.get('/', (req, res) => {
    res.send("Hello");
});
app.use('/api',authRoutes);
app.use('/api',donorRoutes);
app.use('/api',agentRoutes)

app.use((req,res)=>{
    res.status(404).json({message:"Page not found"});
});

const port = process.env.PORT || 4000;
app.listen(port,console.log(`Server is running on port ${port}`));
