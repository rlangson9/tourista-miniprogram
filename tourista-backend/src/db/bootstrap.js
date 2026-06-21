// src/db/bootstrap.js
// Runs on server start. If the DB has no admin yet, runs the full seed once.
// Keeps `npm start` working out-of-the-box without a manual seed step.
const db = require("./index.js");

module.exports = function bootstrap() {
  const hasAdmin = db.prepare("SELECT COUNT(*) c FROM admins").get().c > 0;
  const hasTrips = db.prepare("SELECT COUNT(*) c FROM trips").get().c > 0;
  if (!hasAdmin || !hasTrips) {
    console.log("First run detected — seeding database...");
    require("./seed.js");
  }
};
