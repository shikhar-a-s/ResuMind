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

const prompt =`Analyze the candidate's resume, job description, and self description.

Return ONLY valid JSON.

ATS SCORING METHODOLOGY

Calculate ATS Score primarily from the resume itself.

Evaluate:

ATS SCORING MUST BE STRICT.

For fresh graduates and students:
- Do not award points simply for listing skills.
- Do not award points simply for having projects.
- Projects without measurable impact should receive limited credit.
- Lack of internships or professional experience should significantly reduce the ATS score.
- Most student resumes should score between 50 and 75.
- Scores above 85 should be extremely rare.
- Scores above 90 should be reserved for resumes that would be competitive at top-tier technology companies.

Before assigning the final ATS score, internally evaluate:
1. Formatting (15)
2. Experience (25)
3. Projects (20)
4. Skills (15)
5. Achievements (15)
6. Keyword Relevance (10)

Sum these categories to produce the final ATS score.
Return only the final ATS score.

Scoring Rules:

* ATS score must be an integer between 0 and 100.
* ATS score should reflect the overall quality and ATS-friendliness of the resume.
* Do NOT heavily penalize the candidate for not matching the job description.
* Do NOT increase ATS score based on selfDescription.
* Use the job description mainly for identifying skill gaps, interview questions, and preparation planning.
* Use selfDescription only as supporting context for interview preparation recommendations.
* Scores above 90 should be reserved for exceptionally well-structured and highly impactful resumes.
* Average resumes should typically score between 60 and 85.

JOB MATCH ANALYSIS (DO NOT RETURN)

Internally compare the resume against the job description to identify:

* Missing required skills
* Missing preferred skills
* Relevant experience alignment
* Technical strengths
* Potential interview focus areas

Use this analysis when generating:

* technicalInterviews
* behavioralInterviews
* skillGapAnalysis
* preparationPlan
* improvements

OUTPUT FORMAT

{
"atsScore": 80,
"technicalInterviews": [
{
"questions": "Question",
"intention": "Reason for asking",
"answers": "Ideal answer"
}
],
"behavioralInterviews": [
{
"questions": "Question",
"intention": "Reason for asking",
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
"focusAreas": "Topic",
"tasks": "Specific preparation tasks"
}
],
"improvements": [
{
"title": "Improvement Title",
"description": "Specific actionable recommendation"
}
],
"title": "Generate a unique professional report title every time"
}

REQUIREMENTS

* Return valid JSON only
* No markdown
* No explanations
* No text outside JSON
* Exactly 5 technicalInterviews
* Exactly 5 behavioralInterviews
* Exactly 5 skillGapAnalysis
* Exactly 7 preparationPlan objects (Days 1-7)
* At least 5 improvements
* Every array item must be an object
* severity must be one of:

  * Low
  * Medium
  * High
* Interview questions must be tailored to both the resume and the job description
* Skill gaps must be based on missing or weakly demonstrated skills relative to the job description
* Preparation plan must address identified skill gaps
* Improvements must focus on increasing ATS score, resume quality, and interview readiness

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