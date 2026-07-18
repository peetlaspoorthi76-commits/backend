
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

export const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  res.status(statusCode).json({ success: false, message, errors });
};

export const paginatedResponse = (res, data, total, page, limit) => {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  });
};