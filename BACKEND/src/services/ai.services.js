const { GoogleGenAI } = require("@google/genai");
const { z } = require('zod');
const { zodToJsonSchema } = require('zod-to-json-schema');

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Match GenAI's actual output format (flat arrays with string values)
const interviewReportSchema = z.object({
  atsScore: z.number(),

  technicalInterviews: z.array(
    z.object({
      questions: z.string(),
      intention: z.string(),
      answers: z.string()
    })
  ),

  behavioralInterviews: z.array(
    z.object({
      questions: z.string(),
      intention: z.string(),
      answers: z.string()
    })
  ),

  skillGapAnalysis: z.array(
    z.object({
      skills: z.string(),
      severity: z.enum(["Low", "Medium", "High"])
    })
  ),

  preparationPlan: z.array(
    z.object({
      day: z.number(),
      focusAreas: z.string(),
      tasks: z.string()
    })
    
  ),
  improvements: z.array(
    z.object({
      title: z.string(),
      description: z.string()
    })
  ),
  title: z.string()
});

async function generateInterviewReport({resumeText, selfDescription, jobDescription}) {

const prompt =` Analyze the candidate's resume against the job description as an experienced ATS reviewer and recruiter.

Return ONLY valid JSON.

ATS Score Calculation Process (DO NOT RETURN THESE VALUES):

1. Evaluate:

   * Keyword Match (35%)
   * Required Skills Match (25%)
   * Relevant Experience Match (20%)
   * Job Title Alignment (10%)
   * Education & Certifications (5%)
   * ATS Readability & Formatting (5%)

2. Score each category from 0-100.

3. Calculate:

ATS Score =
(Keyword Match × 0.35) +
(Skills Match × 0.25) +
(Experience Match × 0.20) +
(Title Alignment × 0.10) +
(Education × 0.05) +
(Formatting × 0.05)

4. Round to nearest integer.

Important Rules:

* Be strict and realistic.
* Missing required skills should significantly reduce ATS score.
* Missing preferred skills should moderately reduce ATS score.
* Do not reward skills not mentioned in the resume.
* ATS score should resemble what a recruiter or ATS screening tool would assign.
* If the candidate lacks several core requirements, ATS score should rarely exceed 75.
* Scores above 90 should only be given when there is exceptional alignment.

Return ONLY this structure:

{
"atsScore": 80,
"technicalInterviews": [
{
"questions": "Question",
"intention": "Reason",
"answers": "Ideal answer"
}
],
"behavioralInterviews": [
{
"questions": "Question",
"intention": "Reason",
"answers": "Ideal answer"
}
],
"skillGapAnalysis": [
{
"skills": "Skill",
"severity": "High"
}
],
"preparationPlan": [
{
"day": 1,
"focusAreas": "Focus Area",
"tasks": "Tasks"
}
],
"improvements": [
{
"title": "Improvement",
"description": "Actionable recommendation"
}
],
"title": "Generate a unique professional report title every time"
}

Requirements:

* Return JSON only
* No markdown
* No explanations
* ATS score must be derived from the calculation process above
* Exactly 5 technicalInterviews
* Exactly 5 behavioralInterviews
* Exactly 5 skillGapAnalysis
* Exactly 7 preparationPlan days
* At least 5 improvements
* Every array item must be an object
* severity must be one of: Low, Medium, High
* Questions must be tailored to both the job description and the candidate's experience
* Skill gaps must directly reflect missing or weakly demonstrated requirements
* Preparation plan must address the identified skill gaps

Job Description:
${jobDescription}

Resume:
${resumeText}

Self Description:
${selfDescription}
`;

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json"
  }
});
const parsed = JSON.parse(response.text);

console.dir(parsed, { depth: null });

const validated = interviewReportSchema.parse(parsed);

return validated;
}

module.exports = generateInterviewReport;