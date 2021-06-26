'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

var plannerSchema = Schema( {
  userId: ObjectId,
  month: String,
  week: Number,
  createdAt: Date,
  item: String,
  time: Number,
  startTime: String,
  endTime: String
} );

module.exports = mongoose.model( 'Planner', plannerSchema );
