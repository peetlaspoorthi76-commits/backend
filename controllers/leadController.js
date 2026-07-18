import Lead from '../models/Lead.js';
import { paginatedResponse, successResponse } from '../utils/apiResponse.js';

const STATUS_VALUES = ['New', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Won', 'Lost'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildLeadFilter = (userId, query) => {
  const { status, search, source, dateFrom, dateTo } = query;
  const filter = { owner: userId };

  if (status && status !== 'All') filter.status = status;
  if (source && source !== 'All') filter.source = source;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  return filter;
};

export const getLeads = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const filter = buildLeadFilter(req.user._id, req.query);

    const leads = await Lead.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Lead.countDocuments(filter);
    paginatedResponse(res, leads, total, page, limit);
  } catch (error) {
    next(error);
  }
};

export const createLead = async (req, res, next) => {
  try {
    const lead = await Lead.create({ ...req.body, owner: req.user._id });
    successResponse(res, lead, 'Lead created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, owner: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    successResponse(res, lead);
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.owner;

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    successResponse(res, lead, 'Lead updated successfully');
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!STATUS_VALUES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { status },
      { new: true, runValidators: true }
    );

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    successResponse(res, lead, 'Lead status updated');
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, owner: req.user._id });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    await lead.deleteOne();
    successResponse(res, null, 'Lead deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getLeadStats = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [statusAgg, sourceAgg, totalLeads, thisMonthLeads, lastMonthLeads] = await Promise.all([
      Lead.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      Lead.countDocuments({ owner: ownerId }),
      Lead.countDocuments({ owner: ownerId, createdAt: { $gte: startOfThisMonth } }),
      Lead.countDocuments({
        owner: ownerId,
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
    ]);

    const statusBreakdown = STATUS_VALUES.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {});
    statusAgg.forEach(({ _id, count }) => {
      statusBreakdown[_id] = count;
    });

    const sourceBreakdown = {};
    sourceAgg.forEach(({ _id, count }) => {
      sourceBreakdown[_id] = count;
    });

    const wonLeads = statusBreakdown['Won'] || 0;
    const lostLeads = statusBreakdown['Lost'] || 0;
    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 1000) / 10 : 0;
    const growthRate =
      lastMonthLeads > 0
        ? Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 1000) / 10
        : thisMonthLeads > 0
          ? 100
          : 0;

    successResponse(res, {
      totalLeads,
      wonLeads,
      lostLeads,
      statusBreakdown,
      sourceBreakdown,
      conversionRate,
      thisMonthLeads,
      lastMonthLeads,
      growthRate,
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyStats = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`,
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
      });
    }

    const startDate = months[0].start;

    const aggregated = await Lead.aggregate([
      { $match: { owner: ownerId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] } },
        },
      },
    ]);

    const statsMap = aggregated.reduce((acc, item) => {
      acc[`${item._id.year}-${item._id.month}`] = item;
      return acc;
    }, {});

    const monthlyData = months.map(({ year, month, label }) => {
      const key = `${year}-${month + 1}`;
      const entry = statsMap[key];
      const total = entry?.total || 0;
      const won = entry?.won || 0;
      const lost = entry?.lost || 0;
      const conversionRate = total > 0 ? Math.round((won / total) * 1000) / 10 : 0;

      return { month: label, total, won, lost, conversionRate };
    });

    successResponse(res, monthlyData);
  } catch (error) {
    next(error);
  }
};

export const searchLeads = async (req, res, next) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length === 0) {
      return successResponse(res, []);
    }

    const leads = await Lead.find({
      owner: req.user._id,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    })
      .select('_id name company email status')
      .limit(parseInt(limit));

    successResponse(res, leads);
  } catch (error) {
    next(error);
  }
};
