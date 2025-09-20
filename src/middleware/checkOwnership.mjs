import asyncHandler from "./asyncHandler.mjs";

const checkOwnership = (Model, field = "instructor") =>
  asyncHandler(async (req, res, next) => {
    const resource = await Model.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    if (resource[field].toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    next();
  });

export default checkOwnership;
