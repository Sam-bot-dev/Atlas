const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // If status is still 200 (not explicitly set), use 500
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  errorHandler,
};
