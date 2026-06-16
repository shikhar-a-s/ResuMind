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

The ATS score should simulate a strict ATS reviewer and experienced recruiter.

IMPORTANT:

* Do NOT inflate scores.
* Do NOT act as a mentor or coach.
* Be objective and critical.
* Do NOT reward effort.
* Reward demonstrated evidence only.

ATS SCORING CATEGORIES

Internally calculate:

1. Resume Formatting and ATS Readability (15 points)
2. Professional Experience and Internships (25 points)
3. Projects and Technical Impact (20 points)
4. Skills Demonstration and Relevance (15 points)
5. Achievements and Quantified Results (15 points)
6. Resume Quality and Keyword Optimization (10 points)

Sum all categories to determine the final ATS score.

DO NOT RETURN CATEGORY SCORES.

STRICT SCORING GUIDELINES

Student Resume Ranges:

* 40-55 = Weak Resume
* 56-65 = Below Average Resume
* 66-75 = Good Resume
* 76-85 = Strong Resume
* 86-90 = Exceptional Resume
* 91-100 = Extremely Rare, Top-Tier Resume

Most student resumes should score between 55 and 75.

Scores above 85 should be rare.

Scores above 90 should only be given if the resume demonstrates exceptional achievements, internships, leadership, measurable impact, and outstanding project quality.

MANDATORY PENALTIES

Apply appropriate penalties when applicable:

* No internships or professional experience: -10 to -20
* No quantified achievements: -5 to -15
* Generic project descriptions: -5 to -15
* No measurable project impact: -5 to -15
* Weak action verbs: -3 to -8
* Missing deployment, cloud, testing, or production experience: -5 to -15
* Missing leadership, teamwork, or extracurricular achievements: -3 to -10
* Weak ATS formatting or organization: -5 to -15

IMPORTANT RULES

* Do NOT award points simply for listing technologies.
* Do NOT award points simply for listing skills.
* Do NOT award points simply for having projects.
* Projects must demonstrate complexity, impact, or technical depth.
* High CGPA alone should not significantly increase ATS score.
* Self Description must NOT affect ATS score.
* Job Description should have minimal influence on ATS score.

JOB DESCRIPTION USAGE

Use the Job Description only for:

* Technical interview questions
* Behavioral interview questions
* Skill gap analysis
* Preparation plan
* Improvement suggestions

Do not heavily increase or decrease ATS score based on job match.

INTERNAL JOB MATCH ANALYSIS

Internally evaluate:

* Required skills match
* Missing skills
* Preferred skills match
* Relevant experience
* Technical strengths
* Interview focus areas

Use this analysis to generate:

* technicalInterviews
* behavioralInterviews
* skillGapAnalysis
* preparationPlan
* improvements

OUTPUT FORMAT

{
"atsScore": 72,
"technicalInterviews": [
{
"questions": "Question",
"intention": "Reason",
"answers": "Ideal Answer"
}
],
"behavioralInterviews": [
{
"questions": "Question",
"intention": "Reason",
"answers": "Ideal Answer"
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
"tasks": "Tasks"
}
],
"improvements": [
{
"title": "Improvement Title",
"description": "Improvement Description"
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
* Exactly 7 preparationPlan objects
* At least 5 improvements
* Every array item must be an object
* severity must be Low, Medium, or High
* ATS score must be an integer from 0 to 100

FINAL VALIDATION

Before returning the final ATS score, verify:

* Would a strict recruiter realistically assign this score?
* Is the score justified by evidence in the resume?
* Has the score been inflated due to listed technologies, CGPA, or self description?

If uncertain, choose the lower score.

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