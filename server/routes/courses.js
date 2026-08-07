const express = require("express");
const Course = require("../models/Course");
const Module = require("../models/Module");
const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

const Submission = require("../models/Submission");

// ── Get All Courses (with embedded modules and topics) ───────────────────────
router.get("/", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const [courses, currentUser, solvedIds] = await Promise.all([
      Course.find()
        .populate({ path: 'modules', model: 'Module' })
        .populate({ path: 'modules.prerequisites', model: 'Module' })
        .sort({ order: 1 })
        .lean(),
      User.findById(req.userId).lean(),
      Submission.distinct("problemId", { userId: req.userId, verdict: "pass" }),
    ]);

    if (!currentUser) return res.status(401).json({ error: "User not found" });

    const unlockedModuleIds = (currentUser.unlockedModules || []).map(id => id.toString());
    const isAdminRole = ['admin', 'super_admin', 'instructor'].includes(currentUser.role);

    const enrichedCourses = courses.map(course => {
      course.modules = course.modules.map(module => {
        const topics = module.topics || [];
        const totalTopics = topics.length;
        let solvedCount = 0;

        const enrichedTopics = topics.map(topic => {
          const solved = solvedIds.includes(topic.problemId);
          if (solved) solvedCount++;
          return { ...topic, solved };
        });

        const progressPercent = totalTopics === 0 ? 0 : Math.round((solvedCount / totalTopics) * 100);

        // Auto-unlock once all prerequisite modules are fully solved
        const prereqsMet = !module.prerequisites
          || module.prerequisites.length === 0
          || module.prerequisites.every(prereq => {
            if (!prereq) return true;
            const prereqTopics = prereq.topics || [];
            return prereqTopics.length === 0 || prereqTopics.every(t => solvedIds.includes(t.problemId));
          });

        // Admins/instructors always have access; otherwise check unlockedModules or completed prerequisites
        const isUnlocked = isAdminRole
          || unlockedModuleIds.includes(module._id.toString())
          || prereqsMet;

        const status = isUnlocked
          ? (progressPercent === 100 ? 'complete' : 'active')
          : 'locked';

        return { ...module, topics: enrichedTopics, progress: `${progressPercent}%`, status, unlocked: isUnlocked };
      });
      return course;
    });

    res.json(enrichedCourses);
  } catch (err) {
    console.error("[courses] GET / error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Unlock a module for a user ──────────────────────────────────────────────
router.post("/:moduleId/unlock", requireAuth, requireRole(["instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const targetModule = await Module.findById(moduleId).populate('prerequisites');
    if (!targetModule) return res.status(404).json({ error: "Module not found" });

    const Enrollment = require("../models/Enrollment");
    const isAdminRole = ['admin', 'super_admin', 'instructor'].includes(user.role);

    // Enforce course enrollment if not admin
    if (!isAdminRole) {
      const isEnrolled = await Enrollment.findOne({ userId: user._id, courseId: targetModule.course }).lean();
      if (!isEnrolled) {
        return res.status(403).json({ error: "You must be enrolled in the course to unlock its modules." });
      }
    }

    // Enforce prerequisites if not admin
    if (!isAdminRole && targetModule.prerequisites && targetModule.prerequisites.length > 0) {
      // Check if user has completed all prerequisites
      const solvedIds = await Submission.distinct("problemId", { userId: req.userId, verdict: "pass" });
      
      for (const prereq of targetModule.prerequisites) {
        let solvedCount = 0;
        const totalTopics = prereq.topics?.length || 0;
        
        prereq.topics?.forEach(topic => {
          if (solvedIds.includes(topic.problemId)) solvedCount++;
        });
        
        if (totalTopics > 0 && solvedCount < totalTopics) {
          return res.status(403).json({ error: "Prerequisites not met" });
        }
      }
    }

    const alreadyUnlocked = user.unlockedModules.some(id => id.toString() === moduleId);
    if (!alreadyUnlocked) {
      user.unlockedModules.push(moduleId);
      await user.save();
    }

    res.json({ success: true, unlockedModules: user.unlockedModules });
  } catch (err) {
    console.error("[courses] POST /unlock error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Enroll in a course ────────────────────────────────────────────────────────
router.post("/:courseId/enroll", requireAuth, requireRole(["student", "instructor", "admin", "super_admin"]), async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const Enrollment = require("../models/Enrollment");
    const existing = await Enrollment.findOne({ userId: req.userId, courseId });
    if (existing) {
      return res.status(200).json({ message: "Already enrolled", enrollment: existing });
    }

    const enrollment = await Enrollment.create({ userId: req.userId, courseId });

    // Auto-unlock the first module (no prerequisites) on enrollment
    const firstModule = await Module.findOne({ course: courseId, prerequisites: { $in: [null, []] } }).sort({ order: 1 }).lean();
    if (firstModule) {
      const user = await User.findById(req.userId);
      if (user && !user.unlockedModules.some(id => id.toString() === firstModule._id.toString())) {
        user.unlockedModules.push(firstModule._id);
        await user.save();
      }
    }

    res.status(201).json({ success: true, enrollment });
  } catch (err) {
    console.error("[courses] POST /enroll error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Get user's enrollments ────────────────────────────────────────────────────
router.get("/enrollments", requireAuth, async (req, res) => {
  try {
    const Enrollment = require("../models/Enrollment");
    const enrollments = await Enrollment.find({ userId: req.userId })
      .populate("courseId", "title description icon order")
      .sort({ enrolledAt: -1 })
      .lean();
    res.json(enrollments);
  } catch (err) {
    console.error("[courses] GET /enrollments error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
