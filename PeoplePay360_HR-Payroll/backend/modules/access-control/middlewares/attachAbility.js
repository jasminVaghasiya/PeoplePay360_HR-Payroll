const { defineAbilitiesFor } = require("../abilities/defineAbility");
const { ROLE } = require("../models/types");

const attachAbility = async (req, res, next) => {
  try {
    if (!req?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user?.payload?.user || req.user?.user || req.user?._id || req.user?.id;
    const role = req.user?.role || ROLE.EMPLOYEE;

    // Cache loaded authorization context
    req.authContext = {
      role,
      userId
    };

    const enrichedUser = {
      ...req.user,
      id: userId,
      role
    };

    req.ability = defineAbilitiesFor(enrichedUser);
    next();
  } catch (error) {
    console.error("Error in attachAbility:", error);
    return res.status(500).json({ status: 500, success: false, message: "Internal server error" });
  }
};

module.exports = attachAbility;
