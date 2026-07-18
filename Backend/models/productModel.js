const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [
        100,
        'A product name must have less or equal than 100 characters',
      ],
      minlength: [
        3,
        'A product name must have more or equal than 3 characters',
      ],
    },
    slug: String,
    description: {
      type: String,
      trim: true,
      required: [true, 'A product must have a description'],
    },
    price: {
      type: Number,
      required: [true, 'A product must have a price'],
    },
    costPrice: {
      type: Number,
      required: [true, 'A product must have a cost price'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    stock: {
      type: Number,
      required: [true, 'A product must have stock quantity'],
      min: [0, 'Stock cannot be negative'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    imageCover: {
      type: String,
      required: [true, 'A product must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },

    // 🔥 Discounts: automatic or code-based
    discounts: [
      {
        code: { type: String, trim: true }, // optional if requiresCode = false
        discountPrice: {
          type: Number,
          validate: {
            validator: function (val) {
              const parent = typeof this.ownerDocument === 'function' ? this.ownerDocument() : null;
              if (!parent || parent.price === undefined) return true;
              return val < parent.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price',
          },
        },
        discountStart: Date,
        discountEnd: Date,
        active: { type: Boolean, default: true },
        requiresCode: { type: Boolean, default: true }, // NEW flag
      },
    ],
    linkedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    marke: {
      type: String,
      required: [true, 'A car must have a manufacturer (marke)'],
    },
    model: {
      type: String,
      required: [true, 'A car must have a model'],
    },
    version: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'A car must have a year'],
    },
    mileage: {
      type: Number,
      required: [true, 'A car must have mileage (kilometrage)'],
    },
    fuelType: {
      type: String,
      required: [true, 'A car must have a fuel type'],
      enum: ['Diesel', 'Gasoline', 'Electric', 'Hybrid'],
    },
    horsepower: {
      type: Number,
      required: [true, 'A car must have horsepower (puissance)'],
    },
    transmission: {
      type: String,
      required: [true, 'A car must have a transmission'],
      enum: ['Automatique', 'Manuelle'],
    },
    color: {
      type: String,
      required: [true, 'A car must have a color (couleur)'],
    },
    paint: {
      type: String,
      default: 'Non',
      enum: ['Oui', 'Non'],
    },
    condition: {
      type: String,
      default: 'Controlé',
      enum: ['Neuf', 'Occasion', 'Controlé', 'Endommagé'],
    },
    controlPassed: {
      type: Boolean,
      default: true,
    },
    availability: {
      type: String,
      default: 'Disponible',
      enum: ['Disponible', 'Vendu', 'Réservé'],
    },
    video: String,
    features: {
      type: [String],
      default: [],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ✅ Virtual field for profit margin
productSchema.virtual('profit').get(function () {
  return this.price - this.costPrice;
});

// ✅ Virtual: calculate best available discount
productSchema.virtual('finalPrice').get(function () {
  const now = Date.now();
  if (this.discounts && this.discounts.length > 0) {
    // find automatic discount first (requiresCode = false)
    const autoDiscount = this.discounts.find(
      (d) =>
        d.active &&
        !d.requiresCode &&
        d.discountPrice < this.price &&
        (!d.discountStart || now >= d.discountStart) &&
        (!d.discountEnd || now <= d.discountEnd),
    );
    if (autoDiscount) return autoDiscount.discountPrice;
  }
  return this.price;
});

// ✅ Virtual: discount percentage (first valid one)
productSchema.virtual('discountPercent').get(function () {
  const now = Date.now();
  if (this.discounts && this.discounts.length > 0) {
    const validDiscount = this.discounts.find(
      (d) =>
        d.active &&
        d.discountPrice < this.price &&
        (!d.discountStart || now >= d.discountStart) &&
        (!d.discountEnd || now <= d.discountEnd),
    );
    if (validDiscount) {
      return Math.round(
        ((this.price - validDiscount.discountPrice) / this.price) * 100,
      );
    }
  }
  return 0;
});

// ✅ DOCUMENT MIDDLEWARE: generate name and slug
productSchema.pre('save', function () {
  if (!this.name) {
    this.name = `${this.marke} ${this.model} ${this.version || ''} ${this.year}`.replace(/\s+/g, ' ').trim();
  }
  this.slug = slugify(this.name, { lower: true });
});

// ✅ POST-DELETE MIDDLEWARE: clean up image files from filesystem
productSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const fs = require('fs');
    const path = require('path');

    if (doc.imageCover) {
      const coverPath = path.join(__dirname, '..', 'public', 'img', 'products', doc.imageCover);
      fs.unlink(coverPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Error deleting product cover image ${doc.imageCover}: ${err.message}`);
        }
      });
    }

    if (doc.images && doc.images.length > 0) {
      doc.images.forEach((img) => {
        const imgPath = path.join(__dirname, '..', 'public', 'img', 'products', img);
        fs.unlink(imgPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error(`Error deleting product gallery image ${img}: ${err.message}`);
          }
        });
      });
    }

    if (doc.video) {
      const videoPath = path.join(__dirname, '..', 'public', 'videos', 'products', doc.video);
      fs.unlink(videoPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Error deleting product video ${doc.video}: ${err.message}`);
        }
      });
    }
  }
});

// ✅ QUERY MIDDLEWARE: populate category automatically
productSchema.pre(/^find/, function (next) {
  if (typeof this.populate === 'function') {
    this.populate({
      path: 'category',
      select: 'name slug',
    });
  }
  if (typeof next === 'function') next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
