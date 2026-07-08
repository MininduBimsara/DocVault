import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import {
  listPendingReviewsHandler,
  approveReviewHandler,
  rejectReviewHandler,
  editReviewHandler,
} from "../controllers/reviews.controller";

const router = Router();

// Apply auth and reviewer/admin restrictions to all endpoints
router.use(requireAuth, requireRole(["REVIEWER", "ADMIN"]));

router.get("/pending", listPendingReviewsHandler);
router.post("/:taskId/approve", approveReviewHandler);
router.post("/:taskId/reject", rejectReviewHandler);
router.post("/:taskId/edit", editReviewHandler);

export default router;
