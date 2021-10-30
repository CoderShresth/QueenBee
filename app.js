const express = require('express');
app = express()
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require("body-parser")
const User = require('./models/User');
const Blog = require('./models/Blog');
const bcrypt = require('bcryptjs');
var socket = require('socket.io')
const db = require('./config/keys').mongoURI;
var cors = require('cors');

app.use(cors());
const { ensureAuthenticated, forwardAuthenticated } = require('./config/auth');


var Message = mongoose.model('Message',new mongoose.Schema({
  name : String,
  message : String
}, {collection: 'chat'}))

require('./config/passport')(passport);

mongoose.connect(db, {
   useNewUrlParser: true ,useUnifiedTopology: true
  }).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.use(expressLayouts);
app.set('view engine','ejs');

app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.use(express.static('public'));

app.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));
app.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.render('dashboard', {
      user: req.user
    })
);

app.get('/chat', (req, res) =>{
  res.render('/chat.html')
})

app.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

app.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  let errors = [];
  if (!name || !email || !password) {
    errors.push({ msg: 'Please enter all fields' });
  }
  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }
  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                console.log('no error');
                res.redirect('/login');
              })
              .catch(err => console.log('A LOT OF ERRORS'+ name +' '+email + err));
          });
        });
      }
    });
  }
});

app.get('/messages', (req, res) => {
  Message.find({},(err, messages)=> {
    res.send(messages);
  })
})

app.get('/favicon.ico', (req, res) => res.status(204));

app.get('/messages/:user', (req, res) => {
  var user = req.params.user
  Message.find({name: user},(err, messages)=> {
    res.send(messages);
  })
})

app.post('/messages', async (req, res) => {
  try{
    var message = new Message(req.body);

    var savedMessage = await message.save()
      console.log('saved');

    var censored = await Message.findOne({message:'badword'});
      if(censored)
        await Message.remove({_id: censored.id})
      else
        io.emit('message', req.body);
      res.sendStatus(200);
  }
  catch (error){
    res.sendStatus(500);
    return console.log('error',error);
  }
  finally{
    console.log('Message Posted')
  }

})

app.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

app.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
});

app.post("/newPost", function(req, res){
	var title = req.body.title;
	var content = req.body.content;
	var image = req.body.image;
	var newPost = {title: title, content: content, image: image};
	Blog.create(newPost, function(err, newlyCreated){
		if(err){
			console.log(err);
		} else {
			const link = '/blog';
			res.redirect(link);
			console.log(newlyCreated);
		};
	});
});

app.get('/blog',ensureAuthenticated, (req,res) => {
  Blog.find({}).sort({ _id: -1 }).exec(
		function(err, Allblogs){
		if(err){
			res.render('error');
		} else {
			res.render("blog",{Allblogs: Allblogs, name:req.name});
		};
	});
});

app.get('/doctors', (req, res)=>{
  res.render('find_doctor.ejs');
})

const PORT = process.env.PORT || 3000;

var server = app.listen(PORT, console.log(`Server running on  ${PORT}`));
let io = socket(server)
io.on('connection', function(socket){
  console.log(`${socket.id} is connected`);
});