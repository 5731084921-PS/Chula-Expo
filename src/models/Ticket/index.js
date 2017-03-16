/* eslint-disable func-names,space-before-function-paren */
const mongoose = require('mongoose');
const { User, Round } = require('../');

const ObjectId = mongoose.Schema.Types.ObjectId;

/**
 * Ticket Schema
 */
const TicketSchema = new mongoose.Schema({
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
  },
  round: {
    type: ObjectId,
    ref: 'Round',
    required: true,
  },
  checked: {
    type: Boolean,
    default: false,
  },
  size: {
    type: Number,
    default: 1,
  },
  createAt: { type: Date, default: new Date() },
  updateAt: { type: Date, default: new Date() },
  createBy: {
    type: ObjectId,
    ref: 'User'
  },

});

TicketSchema.index({ user: 1, round: 1 }, { unique: true });

TicketSchema.statics.cancelReserved = function(ticketId) {
  return new Promise((resolve, reject) => {
    TicketSchema.findbyId(ticketId, (err, ticket) => {
      if (err) {
        return reject(err);
      }
      // Ticket isn't exist
      if (!ticket) {
        return reject({ code: 27 });
      }
      User.findById(ticket.user, (err, user) => {
        if (err) {
          return reject(err);
        }
        Round.findById(ticket.round, (err, round) => {
          if (err) {
            return reject(err);
          }
          // Decease reseaved seats by 1 and bound by zero
          round.seats.reserved = Math.max(round.seats.reserved - ticket.size, 0);
          // Filter out User's reseved activity
          user.reservedActivity.filter(activity => activity.ticket !== ticket.id);

          Promise.all([
            round.save(),
            user.save(),
            ticket.remove(),
          ]).then(() => resolve())
            .catch(reject);
        });
      });
    });
  });
};

TicketSchema.methods.checkIn = function() {
  return new Promise((resolve, reject) => {
    if (this.checked) {
      return reject({ code: 35 });
    }
    this.checked = true;
    this.save()
      .then(resolve)
      .catch(err => reject(err));
  });
};


TicketSchema.statics.toggle = function(ticketId) {
  return new Promise((resolve, reject) => {
    this.findById(ticketId).exec()
      .then((ticket) => {
        ticket.checked = !ticket.checked;
        ticket.save()
          .then(resolve)
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
};

const Ticket = mongoose.model('Ticket', TicketSchema);

module.exports = Ticket;
