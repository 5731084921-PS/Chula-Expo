const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

/**
 * Place Schema
 */
const PlaceSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  name: {
    th: { type: String, required: true },
    en: { type: String, required: true }
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  rooms: [{
    type: ObjectId,
    ref: 'Room'
  }],
  zone:{
     type: ObjectId,
     ref: 'Zone'

    }
});

const Place = mongoose.model('Place', PlaceSchema);

module.exports = Place;
