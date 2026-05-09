/**
 * Side-effect imports so every Mongoose model is registered before the server handles traffic.
 * After connect, `ensureMongoCollections()` in `mongoCollections.js` creates collections in Atlas/Compass.
 */
import "./User.js";
import "./AdminProfile.js";
import "./TeacherProfile.js";
import "./ParentProfile.js";
import "./StudentProfile.js";
import "./Class.js";
import "./ClassSchedule.js";
import "./Enrollment.js";
import "./ParentChildLink.js";
import "./GradebookEntry.js";
import "./FinalReport.js";
import "./Fee.js";
import "./PaymentRecord.js";
import "./Subscription.js";
import "./Material.js";
import "./ClassPost.js";
import "./Comment.js";
import "./Assignment.js";
import "./Submission.js";
import "./Conversation.js";
import "./ChatMessage.js";
import "./SystemSetting.js";
import "./PasswordResetToken.js";
