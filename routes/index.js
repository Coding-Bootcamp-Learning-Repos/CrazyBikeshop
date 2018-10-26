var express = require('express');
var router = express.Router();
var stripe = require("stripe")("sk_test_8jzI2NnMxI3cderKZ9pg1ttL");
var bcrypt = require('bcryptjs');

/////// DATABASE SETUP ///////

var mongoose = require('mongoose');
var options = { connectTimeoutMS: 5000, useNewUrlParser: true };
mongoose.connect('mongodb://fitzfoufou:lacapsule1@ds117960.mlab.com:17960/crazybikeshop',
options,
    function(err) {
     console.log(err);
    }
);

//Set up of database models in NoSQL
//Orders
var orderSchema = mongoose.Schema({
    productImage: String,
    productName: String,
    productPrice: Number,
    quantity: Number
});

//Users
var userSchema = mongoose.Schema({
    name: String,
    email:String,
    password:String,
    orders:[orderSchema],
    type: String
});
var userModel = mongoose.model('users', userSchema);

//Products
var productSchema = mongoose.Schema({
    productImage: String,
    productName: String,
    productPrice: Number,
});
var productModel = mongoose.model('products', productSchema);


//Initialisation of product database
// var newProduct = new productModel({productName: "Model BIKO45", productImage:"/images/bike-1.jpg", productPrice: 679})
// newProduct.save(function (error, product) {console.log(product);});
//
// var newProduct = new productModel({productName: "Model ZOOK7", productImage:"/images/bike-2.jpg", productPrice: 799})
// newProduct.save(function (error, product) {console.log(product);});
//
// var newProduct = new productModel({productName: "Model LIKO89", productImage:"/images/bike-3.jpg", productPrice: 839})
// newProduct.save(function (error, product) {console.log(product);});
//
// var newProduct = new productModel({productName: "Model GEWO", productImage:"/images/bike-4.jpg", productPrice: 1206})
// newProduct.save(function (error, product) {console.log(product);});
//
// var newProduct = new productModel({productName: "Model TITAN5", productImage:"/images/bike-5.jpg", productPrice: 989})
// newProduct.save(function (error, product) {console.log(product);});
//
// var newProduct = new productModel({productName: "Model AMIG39", productImage:"/images/bike-6.jpg", productPrice: 599})
// newProduct.save(function (error, product) {console.log(product);});

var dataBike =[];
productModel.find(
  {},
  function(err,products){dataBike=products;}
);


/////// USEFUL FUNCTIONS ///////

Array.prototype.sumPond = function (price, quantity) {
    var total = 0
    for ( var i = 0, _len = this.length; i < _len; i++ ) {
        total += this[i][price]*this[i][quantity]
    }
    return total
}

/////// ARCHITECTURE CHOICES ///////

//  A word on sessions :
//  These are the variables we want to stock in the sessions:
//  > User : object with all the user information including:
//    --> Name
//    --> id
//    --> orders

// A word on users:
// There are two types of users in my website:
// > Client : user who signed in or signed up
// > Visitor : user who hasn't signed up yet


/////// ROUTES ///////

//Route to display the catalogue
router.get('/', function(req, res, next) {
  if (req.session.user) {
    /*User type = client*/
    res.render('index', { dataBike:dataBike, user:req.session.user});
    console.log(req.session.user.name);
  } else {
    /*User type = visitor*/
    req.session.user={
      name: "temp",
      email: "temp@temp",
      password: "temp",
      orders:[],
      type: "visitor"
    }
    console.log(req.session.user.name);
    res.render('index', { dataBike:dataBike, user:req.session.user});
  }
});

//Route to get to the basket
router.get('/shop', function(req, res, next) {
  res.render('shop', {user:req.session.user});
});

//Route to add an order to the basket
router.post('/add-shop', function(req, res) {
  if (req.session.user.name !=="temp") {
    /*User type = client*/
    userModel.findOne(
      {_id:req.session.user._id},
      function(err,user){
        var i = req.session.user.orders.findIndex(
          function(order){
            return order.productName==req.body.productName;
          })
        console.log(i);
        if (i!==-1) {
          //The product is already in the card
          req.session.user.orders[i].quantity++;
        } else {
          //The product is not in the card yet
          req.session.user.orders.push({
            productName: req.body.productName,
            productImage: req.body.productImage,
            productPrice: req.body.productPrice,
            quantity: 1
          })
        }
        userModel.updateOne(
          {_id:req.session.user._id},
          {orders:req.session.user.orders},
          function(err,raw){
            res.redirect('shop');
          }
        )
      }
    )
  } else {
    /*User type = visitor*/
    var i = req.session.user.orders.findIndex(
      function(order){
        return order.productName===req.body.productName;
      });
    if (i!==-1) {
      //The product is already in the card
      req.session.user.orders[i].quantity++
    } else {
      //The product is not in the card yet
      req.session.user.orders.push({
        productName: req.body.productName,
        productImage: req.body.productImage,
        productPrice: req.body.productPrice,
        quantity: 1
      })
    }
    res.redirect('shop');
  }
});

//Route to delete an order from the basket
router.get('/delete-shop', function(req, res, next) {
  req.session.user.orders.splice(req.query.position,1);
  if (req.session.user.name !=="temp") {
    /*User type = client*/
    userModel.updateOne(
      {_id:req.session.user._id},
      {orders:req.session.user.orders},
      function(err,raw){
        res.redirect('shop');
      }
    )
  } else {
    /*User type = visitor*/
    res.redirect('shop');
  }
});

//Route to modify the number of orders of a specific product
router.post('/update-shop', function(req, res, next) {
  req.session.user.orders[req.body.position].quantity=req.body.quantity;
  if (req.session.user.name !=="temp") {
    /*User type = client*/
    userModel.updateOne(
      {_id:req.session.user._id},
      {orders:req.session.user.orders},
      function(err,raw){
        res.redirect('shop');
      }
    )
  } else {
    /*User type = visitor*/
    res.redirect('shop');
  }
});


// Route to sign in in to the website
var salt = "$2a$10$s7Re1cyDCCMTQeRTJiLUSO"; //To crypt the user password
// const salt = bcrypt.genSaltSync(10);
router.post('/inscription', function(req, res) {
  var hash = bcrypt.hashSync(req.body.password, salt);
  if (req.session.user) {
    var newUser = new userModel({
      name: req.body.name,
      email:req.body.email,
      password: hash,
      orders:req.session.user.orders,
      type:"client"
    })
  } else {
    var newUser = new userModel({
      name: req.body.name,
      email:req.body.email,
      password: hash,
      orders:[],
      type:"client"
    })
  }
  newUser.save(
    function (error, user) {
      req.session.user=user;
      res.render('index', { dataBike:dataBike, user:req.session.user});
    }
  );
});


// Route to sign In to the website
router.post('/connection', function(req, res) {
  var hash = bcrypt.hashSync(req.body.password, salt);
  userModel.find(
    {email:req.body.email, password: hash},
    function (err, users) {
      if (users.length>0) {
        req.session.user=users[0];
        res.render('index', { dataBike:dataBike, user:req.session.user});
      } else{
        res.render('index', { dataBike:dataBike, user:req.session.user, error:"wrongPassword"});
      }
    }
  )
});

//Route to log out from website
router.get("/logout",function(req,res){
  req.session.user="";
  res.redirect('/');
})


//Route to pay through Stripe
router.post("/payment", function(req,res){
  console.log(req.body);
  console.log(req.session.user.orders.sumPond("price","quantity"));
  // Token is created using Checkout or Elements!
  // Get the payment token ID submitted by the form:
  const token = req.body.stripeToken; // Using Express

  const charge = stripe.charges.create({
    amount: req.session.user.orders.sumPond("productPrice","quantity")*100,
    currency: 'eur',
    description: 'Charge for bike',
    source: token,
  });
  console.log(charge);
  res.render('index',{ dataBike:dataBike, user:req.session.user, payed:"ok"});
})

module.exports = router;


/////// MINIMAL TEST ///////
// 1. Check that you can see the six bikes on the home page
// 2. Click on the "Buy" button of several bikes and go to the shop page to check wether they have been added
// 3. Change the quantity of one order in the basket page - check if total updates at the bottom
// 4. Delete a bike to see wether the delete button works - check if total updates at the bottom
// 5. Try signing up and check if the bikes already purchased are still there
// 6. Try signing out
// 7. Try signing in again with your details and check wether the basket is still the same
// 8. Try paying with a fake account and see if you receive an alert on the home page to tell you that the payment was successful
// 9. Bonus : try reordering bikes on home page
