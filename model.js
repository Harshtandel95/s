const mongoose = require('mongoose');
const generatorSchema = new mongoose.Schema({
  tags: String,
  class: String,
});
const companySchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    unique: true
  },
  Generator: {
    BodyGenerator:[generatorSchema],
    TOCgenerator: [generatorSchema],
    UIcomponents: [generatorSchema],
    FAQgenerator: [generatorSchema]
  },
  shopify_id:String,
  shopify_url:String,
});

module.exports = mongoose.model('Company', companySchema);
