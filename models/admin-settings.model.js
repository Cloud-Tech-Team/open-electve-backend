const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema({
  allowedDateTime: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // Default: 24 hours from now
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
adminSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Ensure only one settings document exists
adminSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this({});
    await settings.save();
  }
  return settings;
};

adminSettingsSchema.statics.updateSettings = async function(newSettings) {
  let settings = await this.getSettings();
  Object.assign(settings, newSettings);
  await settings.save();
  return settings;
};

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
