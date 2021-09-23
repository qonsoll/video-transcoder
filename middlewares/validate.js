module.exports = (schema) => {
  // Joi validation options
  const validationOptions = {
    abortEarly: false, // abort after the last validation error
    allowUnknown: true, // allow unknown keys that will be ignored
    stripUnknown: true // remove unknown keys from the validated data
  }

  // return the validation middleware
  return (req, res, next) =>
    Joi.validate(req, schema, validationOptions, (err, data) => {
      if (err) {
        // Joi Error
        const JoiError = {
          status: 'failed',
          error: {
            original: err._object,
            // fetch only message and type from each error
            details: err.details.map(({ message, type }) => ({
              message: message.replace(/['"]/g, ''),
              type
            }))
          }
        }

        // Send back the JSON error response
        res.status(422).json(JoiError)
      } else {
        // Replace req.body with the data after Joi validation
        req.body = data
      }
      next()
    })
}
