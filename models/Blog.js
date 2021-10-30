const mongoose = require('mongoose');

var blogSchema = new mongoose.Schema({
	name: String,
	email: String,
	title: String,
	content: String,
	image: String,
});

const TrueBlog = mongoose.model('Blog', blogSchema);
module.exports = TrueBlog;