import AppError from "../utilities/appError.js";

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError("Inavlid token. Please log in again!", 401);
};

const handleJWTExpiredError = () => {
  return new AppError(`Your token has expired!. Please log in again.`, 400);
};

const sendDevError = (err, req, res) => {
  // API ERRORS
  if (req.originalUrl.startsWith("/api")) {
    console.log("DEV ERROR💥: ", err);

    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // RENDERED WEBSITE ERROR --- rendered but still in dev mode
  console.log("DEV RENDER ERROR💥: ", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    message: err.message,
  });
};

const sendProdError = (err, req, res) => {
  // API ERRORS
  // Operational, trusted error: CAN be sent to client
  // if error is operational, send predefined message to user

  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      console.log("PROD ERROR💥: ", err);
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // NOT OPERATIONAL
    // Programming or other unknown error: don't leak error details
    // if error is !operational, send custom message to user
    // and log for dev

    console.log("PROD NON-Operational API ERROR💥: ", err);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }

  // RENDERED WEBSITE ERROR
  // OPERATIONAL ERROR: can send to client cos it has mostly been modified by AppError
  if (err.isOperational) {
    console.log("PROD Operational ERROR💥: ", err);

    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      message: err.message,
    });
  }

  // NON OPERATIONAL ERROR: unknown error: NOT MODIFIED
  console.log("PROD NON-Operational ERROR💥: ", err);

  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    message: "Please try again later",
  });
};

const globalErrorHandler = (err, req, res, next) => {
  console.log(err.stack); // shows where error is from

  err.statusCode = err.statusCode || 500;
  err.status = err.status | "error";

  if (process.env.NODE_ENV === "development") {
    sendDevError(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    console.log("Running in production");

    // Invalid Product ID
    if (err.name === "CastError") err = handleCastErrorDB(err);

    // occurs when unique is false. creating new object with
    // name that already exist for unique.
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);

    // occurs when a required is not met
    if (err.name === "ValidationError") err = handleValidationErrorDB(err);

    if (err.name === "JsonWebTokenError") err = handleJWTError();

    if (err.name == "TokenExpiredError") err = handleJWTExpiredError();

    sendProdError(err, req, res);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.nessage,
  });
};

export default globalErrorHandler;
