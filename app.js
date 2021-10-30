const express = require('express');
app = express()
var cors = require('cors');
const expressLayouts = require('express-ejs-layouts');

app.use(cors());
app.use(expressLayouts);
app.set('view engine','ejs');


app.use(express.static('public'));

app.get('/', (req, res) => res.render('welcome'));
app.get('/favicon.ico', (req, res) => res.status(204));


const PORT = process.env.PORT || 3000;

var server = app.listen(PORT, console.log(`Server running on  ${PORT}`));
