import axios from "axios";
import { apiConfig } from "./api.config";

export async function generateInterviewReport(resumeFile, selfDescription, jobDescription) {
    try {
        const formData = new FormData();
        formData.append("resume", resumeFile);
        formData.append("selfDescription", selfDescription);
        formData.append("jobDescription", jobDescription);

        const response = await axios.post(
            "/api/interview/generate",
            formData,
            {
                ...apiConfig,
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );
        // Persist the returned interview report so frontend can show it even if
        // a subsequent GET /api/interview/latest fails due to backend issues.
        if (response.data && response.data.interviewReport) {
            try {
                localStorage.setItem('latestInterviewReport', JSON.stringify(response.data.interviewReport));
                // append to all stored reports for client-side listing
                try {
                    const existing = JSON.parse(localStorage.getItem('allInterviewReports') || '[]');
                    existing.push(response.data.interviewReport);
                    localStorage.setItem('allInterviewReports', JSON.stringify(existing));
                } catch (e) {
                    // ignore
                }
            } catch (err) {
                // ignore localStorage errors
            }
        }
        return response.data;
    } catch (err) {
        throw err.response?.data || err;
    }
}

export async function deleteInterviewReport(reportId) {
    if (!reportId) throw new Error('Report id is required');
    try {
        const response = await axios.delete(`/api/interview/${reportId}`, apiConfig);
        return response.data;
    } catch (err) {
        throw err.response?.data || err;
    }
}
