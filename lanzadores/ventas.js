const ticketModel = require("_modelos/ticket-model");
const Ticket = require("../dto/ticket-dto");

ultimoTicketID = 0;

module.exports = {
  ultimoTicket
};

ticketModel.findOne(null, (error, /** @type {Ticket} */ ticket) => {
  if (error) return reject(error.message)
  if (tickets.length > 0) {
    ultimoTicketID = ticket.serial
  }
}).sort({
  "creado": -1
}).limit(1).lean()