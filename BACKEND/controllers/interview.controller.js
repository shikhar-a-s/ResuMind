const pdfParse= require('pdf-parse');
const generateInterviewReport = require('../src/services/ai.services');
const interviewReportModel = require('../models/interviewReport');
const { authUser } = require('../middlewares/auth.middleware');
 function cleanResumeText(text) {
  const lines = text.split("\n");

  return lines.map(line => {
    const words = line.split(/\s+/);
    const seen = new Set();

    return words.filter(word => {
      const isRepeatedToken =
        word.includes("@") ||
        word.includes("github.com") ||
        word.includes("linkedin.com");

      if (!isRepeatedToken) return true;

      if (seen.has(word)) return false;

      seen.add(word);
      return true;
    }).join(" ");
  }).join("\n");
}
async function generateInterviewReportController(req,res){
        if (!req.file) {
        return res.status(400).json({
                message: "Resume file is required"
        });
}
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
        console.log(resumeContent.text);
const rawText = resumeContent.text;
const cleanedText = cleanResumeText(rawText);


console.log("RAW TEXT:");
console.log(rawText);

console.log("CLEANED TEXT:");
console.log(cleanedText);
        const { selfDescription, jobDescription } = req.body;
        const interviewReportByAi = await generateInterviewReport({
                resumeText: cleanedText,
                selfDescription,
                jobDescription
        });
const interviewReport = await interviewReportModel.create({
    user: req.user.id,
    resumeText: cleanedText,
    selfDescription,
    jobDescription,
    ...interviewReportByAi
});

res.status(200).json({
        message:"Interview report generated successfully",
        interviewReport
})
}

async function getLatestInterviewReportController(req, res) {
        try {
                const interviewReport = await interviewReportModel.findOne({ user: req.user._id }).sort({ createdAt: -1 }).lean();
                if (!interviewReport) {
                        return res.status(404).json({ message: 'No interview report found' });
                }
                res.status(200).json({ interviewReport });
        } catch (err) {
                console.error('Error fetching latest interview report:', err);
                res.status(500).json({ message: 'Failed to fetch interview report' });
        }
}

async function getUserReportsController(req, res) {
        try {
                const userId = req.user._id || req.user.id;
                if (!userId) return res.status(400).json({ message: 'User id not available' });
                const reports = await interviewReportModel.find({ user: userId }).sort({ createdAt: -1 }).lean();
                return res.status(200).json({ reports });
        } catch (err) {
                console.error('Error fetching user reports:', err);
                return res.status(500).json({ message: 'Failed to fetch user reports' });
        }
}

async function deleteInterviewReportController(req, res) {
    try {
        const reportId = req.params.id;
        const userId = req.user._id || req.user.id;
        if (!reportId) {
            return res.status(400).json({ message: 'Report id is required' });
        }
        const report = await interviewReportModel.findOne({ _id: reportId, user: userId });
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        await interviewReportModel.deleteOne({ _id: reportId, user: userId });
        return res.status(200).json({ message: 'Report deleted successfully', reportId });
    } catch (err) {
        console.error('Error deleting interview report:', err);
        return res.status(500).json({ message: 'Failed to delete interview report' });
    }
}

module.exports = { generateInterviewReportController, getLatestInterviewReportController, getUserReportsController, deleteInterviewReportController };