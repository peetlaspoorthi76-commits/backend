import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Pre-save middleware to hash password
userSchema.pre('save', async function() {
  // 'this' refers to the user document
  if (!this.isModified('password')) return;

  // Hash the password
  this.password = await bcrypt.hash(this.password, 10);
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;