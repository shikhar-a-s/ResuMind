const pdfParse= require('pdf-parse');
const generateInterviewReport = require('../src/services/ai.services');
const interviewReportModel = require('../models/interviewReport');
const { authUser } = require('../middlewares/auth.middleware');
async function generateInterviewReportController(req,res){
        const resumeFile = req.file;
        if (!req.file) {
        return res.status(400).json({
                message: "Resume file is required"
        });
}
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
        const { selfDescription, jobDescription } = req.body;
        const interviewReportByAi = await generateInterviewReport({
                resumeText: resumeContent.text,
                selfDescription,
                jobDescription
        });


console.log(
    JSON.stringify(interviewReportByAi, null, 2)
);

console.log("AI RESPONSE:");
console.dir(interviewReportByAi, { depth: null });

const interviewReport = await interviewReportModel.create({
    user: req.user.id,
    resumeText: resumeContent.text,
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

module.exports = { generateInterviewReportController, getLatestInterviewReportController };
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