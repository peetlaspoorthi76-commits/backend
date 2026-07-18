import Lead from '../models/Lead.js';

// Get all leads with pagination/filters
export const getLeads = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = { owner: req.user._id };
    if (status && status !== 'All') filter.status = status;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { company: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const leads = await Lead.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Lead.countDocuments(filter);
    res.status(200).json({ success: true, data: leads, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

// Create a new lead
export const createLead = async (req, res, next) => {
  try {
    const lead = await Lead.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: lead });
  } catch (error) { next(error); }
};

// Get one lead by ID
export const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, owner: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.status(200).json({ success: true, data: lead });
  } catch (error) { next(error); }
};

// Update lead
export const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, req.body, { new: true, runValidators: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.status(200).json({ success: true, data: lead });
  } catch (error) { next(error); }
};

// Update lead status
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const lead = await Lead.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, { status }, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.status(200).json({ success: true, data: lead });
  } catch (error) { next(error); }
};

// Delete lead
export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) { next(error); }
};
