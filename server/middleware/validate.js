/**
 * Input validation helper using simple schema-based checks.
 * Usage: router.post("/path", validate({ email: "required|email", password: "required|min:6" }), handler)
 */

function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    const source = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const ruleList = rules.split("|");
      const value = source[field];

      for (const rule of ruleList) {
        const [ruleName, ruleParam] = rule.split(":");

        if (ruleName === "required" && (value === undefined || value === null || value === "")) {
          errors.push(`${field} is required`);
          break;
        }

        if (value !== undefined && value !== null && value !== "") {
          if (ruleName === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(`${field} must be a valid email`);
          }
          if (ruleName === "min" && typeof value === "string" && value.length < parseInt(ruleParam)) {
            errors.push(`${field} must be at least ${ruleParam} characters`);
          }
          if (ruleName === "max" && typeof value === "string" && value.length > parseInt(ruleParam)) {
            errors.push(`${field} must be at most ${ruleParam} characters`);
          }
          if (ruleName === "alpha" && !/^[a-zA-Z]+$/.test(value)) {
            errors.push(`${field} must contain only letters`);
          }
          if (ruleName === "alphanum" && !/^[a-zA-Z0-9]+$/.test(value)) {
            errors.push(`${field} must be alphanumeric`);
          }
          if (ruleName === "in" && ruleParam) {
            const allowed = ruleParam.split(",");
            if (!allowed.includes(value)) {
              errors.push(`${field} must be one of: ${allowed.join(", ")}`);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    next();
  };
}

const schemas = {
  register: { email: "required|email", password: "required|min:12" },
  login: { email: "required|email", password: "required" },
  createUser: { email: "required|email", password: "required|min:12", role: "required|in:super_admin,admin,instructor,student,guest" },
  updateUser: { role: "in:super_admin,admin,instructor,student,guest" },
  createCourse: { title: "required" },
  updateCourse: {},
  createProblem: { problemId: "required", title: "required" },
  updateProblem: {},
  createModule: { title: "required", course: "required" },
  createPermission: { role: "required|in:super_admin,admin,instructor,student,guest", resource: "required", actions: "required" },
  createNotification: { title: "required", message: "required" },
};

module.exports = { validate, schemas };
