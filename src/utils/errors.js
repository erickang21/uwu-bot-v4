/**
 * Raised when an upstream provider fails us, as opposed to the user giving bad
 * input (thrown as a plain string) or the bot itself having a bug (a plain
 * Error). The distinction is what lets analytics separate provider outages from
 * our own defects; the message is still shown to the user verbatim.
 */
class ApiError extends Error {
  constructor(message, api = null) {
    super(message);
    this.name = "ApiError";
    this.api = api;
  }
}

module.exports = { ApiError };
