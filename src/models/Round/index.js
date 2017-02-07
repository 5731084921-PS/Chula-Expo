const mongoose = require('mongoose');
const User = require('../User');
const Ticket = require('../Ticket');

const ObjectId = mongoose.Schema.Types.ObjectId;

/**
 * Round Schema
 */
const RoundSchema = new mongoose.Schema({
  name: {
    th: { type: String, required: true },
    en: { type: String, required: true }
  },
  activityId: {
    type: ObjectId,
    ref: 'Activity',
    required: true,
  },
  start: { type: Date, required: true },
  end: { type: Date, required: true },

  seats: {
    avaliable: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    fullCapacity: { type: Number, required: true },
  },

  // tickets: [{
  //   type: ObjectId,
  //   ref: 'Ticket',
  // }],

  createAt: { type: Date, default: new Date() },
  updateAt: { type: Date, default: new Date() },
});

RoundSchema.index({ avaliable: -1, start: 1, end: 1, activityId: 1 });

/**
 * Pre-save method
 */
RoundSchema.pre('save', function save(next) {
  const round = this;
  if (!round.isModified('password')) {
    // Correcting Avaliable Seats
    this.seats.avaliable = this.seats.fullCapacity - this.seats.reserved;
  }
  // Update at updated
  this.updateAt = new Date();
  next();
});

/**
 * Find and reserve method
 */
RoundSchema.method.reserve = userId => new Promise((resolve, reject) => {
  Ticket.findOne({ user: userId, round: this.id }, (err, ticket) => {
    if (err) {
      return reject(err);
    }
    // Ticket is already create throw Error
    if (ticket) {
      return reject({ code: 28 });
    }
    User.findById(userId, (err, user) => {
      if (err) {
        return reject(err);
      } else if (!user) {
        // User isn't exist
        return reject({ code: 24 });
      }
      // Fully booked seats
      if (this.seatsReserved + 1 > this.seatsAvaliable) {
        return reject({ code: 30 });
      }

      const ticket = new Ticket({ userId, roundId: user.id, });

      this.seats.reserved++;
      // this.tickets.push(ticket);

      user.reservedActivity.push({
        roundId: this.id,
        ticket: ticket.id,
        reservedAt: new Date(),
      });

      Promise.all([
        this.save(),
        user.save(),
        ticket.save(),
      ]).then((results) => {
        resolve(results[2]);
      }).catch(reject);
    });
  });
});

RoundSchema.method.cancelReservedSeat = (userId, forceRemove) => new Promise((resolve, reject) => {
  User.findById(userId, (err, user) => {
    Ticket.findOne({ user: userId, round: this.id }, (err, ticket) => {
      if (err) {
        return reject(err);
      }
      // Ticket isn't exist
      if (!ticket) {
        return reject({ code: 27 });
      }
      // Already checked in ticket
      if (ticket.checked && !forceRemove) {
        return reject({ code: 31 });
      }
      // Number of reserved seats is incorrect
      if (this.seats.reserved <= 0 && !forceRemove) {
        return reject({ code: 0 });
      }
      // Decease reseaved seats by 1 and bound by zero
      this.seats.reserved = Math.max(this.seats.reserved - 1, 0);
      // Filter out User's reseved activity
      user.reservedActivity.filter(activity => activity.ticket !== ticket.id);

      Promise.all([
        this.save(),
        user.save(),
        ticket.remove(),
      ]).then(() => resolve())
        .catch(reject);
    });
  });
});

const Round = mongoose.model('Round', RoundSchema);

module.exports = Round;
