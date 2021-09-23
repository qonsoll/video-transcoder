const Joi = require('joi')

module.exports = (schema) => {
  // Joi validation options
  const validationOptions = {
    abortEarly: true, // abort after the last validation error
    allowUnknown: true, // allow unknown keys that will be ignored
    stripUnknown: true // remove unknown keys from the validated data
  }

  // return the validation middleware
  return (req, res, next) => {
    const validationResult = schema.validate(req, validationOptions)
    if (validationResult.error) {
      // Joi Error
      const JoiError = {
        status: 'failed',
        error: validationResult.error
      }

      // Send back the JSON error response
      return res.status(422).json(JoiError)
    }
    next()
  }
}
