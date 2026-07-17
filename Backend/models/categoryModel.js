const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A category must have a name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Category name must be less or equal than 50 characters'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // ✅ allows nested categories
      default: null,
    },
    image: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

categorySchema.pre('save', function () {
  this.slug = slugify(this.name, { lower: true });
});

// ✅ POST-DELETE MIDDLEWARE: clean up image file from filesystem
categorySchema.post('findOneAndDelete', async function (doc) {
  if (doc && doc.image) {
    const fs = require('fs');
    const path = require('path');
    const imgPath = path.join(__dirname, '..', 'public', 'img', 'categories', doc.image);
    fs.unlink(imgPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error(`Error deleting category image ${doc.image}: ${err.message}`);
      }
    });
  }
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
