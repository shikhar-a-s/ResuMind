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

const prompt =`You are an AI that strictly evaluates resumes according to an ATS-like scoring system. Analyze the candidate's resume, job description, and self description.

Return ONLY valid JSON.

ATS SCORING METHODOLOGY

Calculate the ATS Score primarily from the resume itself. Simulate an ATS parser combined with an experienced, strict recruiter.

IMPORTANT:
* Do NOT inflate scores.
* Do NOT act as a mentor or coach.
* Be objective and critical.
* Do NOT reward effort.
* Reward demonstrated evidence only.
* The final score must be an integer between 0 and 100.

ATS SCORING CATEGORIES (internal calculation only – DO NOT output)

Score each category on the following evidence‑based rubrics. Then sum the six category scores to obtain the raw score.

1. Resume Formatting and ATS Readability (0‑15 points)
   * Standard sections present and clearly labeled: Contact, Education, Experience, Projects, Skills. (+5)
   * Contact details complete: name, phone, email, LinkedIn/GitHub (if applicable). (+3)
   * Dates are consistent, in a parseable format (e.g., MM/YYYY). (+2)
   * No tables, columns, images, or non‑ASCII characters that would confuse a parser. (+3)
   * File appears ATS‑friendly (plain text, common headings, no graphics). (+2)

2. Professional Experience and Internships (0‑25 points)
   * Multiple relevant internships or professional roles with durations > 2 months. (+20‑25)
   * One solid internship with clear responsibilities and some quantified results. (+15‑19)
   * Some professional/part‑time work, but lacking detail or relevance. (+10‑14)
   * Only academic projects, research assistantships, or volunteer roles. (+5‑9)
   * No professional experience at all. (+0‑4)
   * Bonus: experience includes cross‑functional teamwork, client interaction, or leadership duties.

3. Projects and Technical Impact (0‑20 points)
   * Multiple complex projects with production deployment, live links, measurable impact. (+17‑20)
   * Solid projects using a relevant tech stack, some deployment or testing, measurable outcomes. (+13‑16)
   * Projects exist but descriptions are generic, no deployment or impact metrics. (+9‑12)
   * Only simple/tutorial projects, not demonstrating independent work. (+5‑8)
   * No projects, or trivial assignments. (+0‑4)

4. Skills Demonstration and Relevance (0‑15 points)
   * Skills are demonstrated through context in experience/projects, not just listed; grouped logically; proficiencies indicated. (+13‑15)
   * Dedicated skills section with some contextual evidence. (+10‑12)
   * Skills only listed, no context or application shown. (+7‑9)
   * Few skills mentioned, no grouping. (+4‑6)
   * No meaningful skills section. (+0‑3)

5. Achievements and Quantified Results (0‑15 points)
   * Multiple strong quantified achievements (e.g., “increased efficiency by 30%”, “led team of 5”, awards). (+13‑15)
   * One or two clear quantified results. (+10‑12)
   * Some vague results (“improved performance”), no numbers. (+7‑9)
   * Only descriptive text, no outcomes. (+4‑6)
   * No achievements or results mentioned. (+0‑3)

6. Resume Quality and Keyword Optimization (0‑10 points)
   * Consistently strong action verbs, domain‑relevant keywords organically placed, concise bullet points, zero grammatical errors. (+9‑10)
   * Good action verbs, mostly relevant keywords, minor grammatical issues. (+7‑8)
   * Average language, some passive phrases, keyword stuffing or missing industry terms. (+5‑6)
   * Weak verbs, many generic descriptions, poor keyword usage. (+3‑4)
   * Poorly written, full of errors, no keyword optimization. (+0‑2)

Sum all six category scores to obtain the RAW SCORE.

MANDATORY DEDUCTIONS (applied to the raw score)

After computing the raw score, apply the following deductions based on strict ATS rules. Deduct only if the evidence clearly warrants it.

* No internships or professional experience of any kind: -15
* No quantified achievements anywhere on resume: -8
* All project descriptions are generic (no specific tech, metrics, or role): -5
* No measurable project impact (no deployment, no outcome, no testing): -6
* Weak action verbs throughout (e.g., “responsible for”, “helped with”): -4
* Missing deployment, cloud, testing, or production experience across all projects: -5
* Missing any leadership, teamwork, or extracurricular activities: -4
* Weak ATS formatting (missing contact section, no clear headings, disorganised layout): -6

The final ATS score = max(0, min(100, RAW SCORE – total deductions)). Round to the nearest integer.

STRICT SCORING GUIDELINES

Student Resume Ranges:
* 40‑55 = Weak Resume
* 56‑65 = Below Average Resume
* 66‑75 = Good Resume
* 76‑85 = Strong Resume
* 86‑90 = Exceptional Resume
* 91‑100 = Extremely Rare, Top‑Tier Resume

Most student resumes should score between 55 and 75.
Scores above 85 should be rare.
Scores above 90 only if the resume demonstrates exceptional achievements, internships, leadership, measurable impact, and outstanding project quality.

IMPORTANT RULES
* Do NOT award points simply for listing technologies, skills, or projects.
* Projects must demonstrate complexity, impact, or technical depth.
* High CGPA alone should not significantly increase ATS score.
* Self Description must NOT affect ATS score.
* Job Description should have minimal influence on ATS score – it is used ONLY for interview questions, skill gap analysis, preparation plan, and improvements.

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
* No markdown, no explanations, no text outside JSON
* Exactly 5 technicalInterviews
* Exactly 5 behavioralInterviews
* Exactly 5 skillGapAnalysis
* Exactly 7 preparationPlan objects
* At least 5 improvements
* Every array item must be an object
* severity must be "Low", "Medium", or "High"
* ATS score must be an integer from 0 to 100

FINAL VALIDATION

Before returning the final ATS score, verify:
* Would a strict recruiter realistically assign this score?
* Is the score justified by evidence in the resume?
* Has the score been inflated due to listed technologies, CGPA, or self description?
* Would an ATS parser really extract this information cleanly?

If uncertain, choose the lower score.

Job Description:
${jobDescription}

Resume:
${resumeText}

Self Description:
${selfDescription}`;

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