import React, { useEffect, useState } from 'react';
import Protected from '../components/protected';
import HeaderControls from '../components/HeaderControls';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import { apiConfig } from '../../services/api.config';
import {LayoutDashboard, Download, Trash2, CheckCircle} from 'lucide-react';
import './interview-report.css';
import { useNavigate } from 'react-router-dom';
import{jsPDF} from 'jspdf';
import { deleteInterviewReport } from '../../services/interview.api';

export function AllReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

const downloadPDF = () => {
  if (!selected) return;

  const doc = new jsPDF();

  let y = 20;

  const checkPage = () => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
  };

  // ===== TITLE =====
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");

  const title = doc.splitTextToSize(
    selected.title || "Interview Report",
    180
  );

  doc.text(title, 10, y);
  y += title.length * 8 + 5;

  // ===== ATS SCORE =====
  doc.setFontSize(14);
  doc.text(
    `ATS Score: ${selected.atsScore || "N/A"}`,
    10,
    y
  );

  y += 12;

  // ===== RESUME SUMMARY =====
  checkPage();

  doc.setFontSize(16);
  doc.text("Resume Summary", 10, y);

  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const summary = doc.splitTextToSize(
    selected.resumeText || "No summary available",
    180
  );

  doc.text(summary, 10, y);

  y += summary.length * 6 + 10;

  // ===== TECHNICAL QUESTIONS =====
  checkPage();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Technical Questions", 10, y);

  y += 8;

  doc.setFontSize(11);

  selected.technicalInterviews?.forEach((item, index) => {
    checkPage();

    doc.setFont("helvetica", "bold");

    const question = doc.splitTextToSize(
      `${index + 1}. ${item.questions}`,
      180
    );

    doc.text(question, 10, y);

    y += question.length * 6;

    doc.setFont("helvetica", "normal");

    const answer = doc.splitTextToSize(
      `Answer Guide: ${item.answers}`,
      180
    );

    doc.text(answer, 15, y);

    y += answer.length * 6 + 8;
  });

  // ===== BEHAVIORAL QUESTIONS =====
  checkPage();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Behavioral Questions", 10, y);

  y += 8;

  doc.setFontSize(11);

  selected.behavioralInterviews?.forEach((item, index) => {
    checkPage();

    doc.setFont("helvetica", "bold");

    const question = doc.splitTextToSize(
      `${index + 1}. ${item.questions}`,
      180
    );

    doc.text(question, 10, y);

    y += question.length * 6;

    doc.setFont("helvetica", "normal");

    const answer = doc.splitTextToSize(
      `Expected Approach: ${item.answers || item.intention || ""}`,
      180
    );

    doc.text(answer, 15, y);

    y += answer.length * 6 + 8;
  });

  // ===== IMPROVEMENTS =====
  checkPage();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Improvements", 10, y);

  y += 8;

  doc.setFontSize(11);

  selected.improvements?.forEach((item) => {
    checkPage();

    doc.setFont("helvetica", "bold");

    const title = doc.splitTextToSize(
      item.title,
      180
    );

    doc.text(title, 10, y);

    y += title.length * 6;

    doc.setFont("helvetica", "normal");

    const desc = doc.splitTextToSize(
      item.description,
      180
    );

    doc.text(desc, 15, y);

    y += desc.length * 6 + 8;
  });

  // ===== PREPARATION PLAN =====
  checkPage();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Preparation Plan", 10, y);

  y += 8;

  doc.setFontSize(11);

  selected.preparationPlan?.forEach((day) => {
    checkPage();

    doc.setFont("helvetica", "bold");

    const heading = doc.splitTextToSize(
      `Day ${day.day}: ${day.focusAreas}`,
      180
    );

    doc.text(heading, 10, y);

    y += heading.length * 6;

    doc.setFont("helvetica", "normal");

    const tasks = doc.splitTextToSize(
      `Tasks: ${day.tasks}`,
      180
    );

    doc.text(tasks, 15, y);

    y += tasks.length * 6 + 8;
  });

  doc.save(
    `${
      selected.title?.replace(/\s+/g, "_") ||
      "Interview_Report"
    }.pdf`
  );
};

  useEffect(() => {
    let mounted = true;
    async function load() {
      // Prefer server-side listing for user's reports
      try {
        const resp = await axios.get('/api/interview/reports', apiConfig);
        if (!mounted) return;
        const serverReports = resp.data?.reports || [];
        setReports(serverReports);
        if (serverReports.length > 0) setSelected(serverReports[0]);
        return;
      } catch (err) {
        // fall back to localStorage if server unavailable
      }

      try {
        const all = JSON.parse(localStorage.getItem('allInterviewReports') || '[]');
        const uid = user?._id || user?.id;
        const my = all.filter(r => uid && r && (String(r.user) === String(uid)));
        my.sort((a, b) => {
          const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        if (!mounted) return;
        setReports(my);
        if (my.length > 0) setSelected(my[0]);
      } catch (e) { if (mounted) setReports([]); }
    }

    load();
    return () => { mounted = false; };
  }, [user]);

  const navigate = useNavigate();

  const handleDeleteReport = async () => {
    if (!selected) return;

    try {
      await deleteInterviewReport(selected._id || selected.id);
      const updatedReports = reports.filter((r) => r._id !== selected._id && r.id !== selected.id);
      setReports(updatedReports);
      setSelected(updatedReports[0] || null);
      setDeleteConfirmationVisible(false);
      setStatusType('success');
      setStatusMessage('Report deleted successfully.');
      try {
        const existing = JSON.parse(localStorage.getItem('allInterviewReports') || '[]');
        const filtered = existing.filter((r) => r._id !== selected._id && r.id !== selected.id);
        localStorage.setItem('allInterviewReports', JSON.stringify(filtered));
        const latest = JSON.parse(localStorage.getItem('latestInterviewReport') || 'null');
        if (latest && (latest._id === selected._id || latest.id === selected.id)) {
          localStorage.setItem('latestInterviewReport', JSON.stringify(filtered[0] || {}));
        }
      } catch (error) {
        // ignore localStorage cleanup errors
      }
    } catch (err) {
      setStatusType('error');
      setStatusMessage(err.message || err?.message || 'Failed to delete report');
      setDeleteConfirmationVisible(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-6 sm:px-8">
        <div
          onClick={() => navigate('/dashboard')}
          className="text-2xl font-extrabold text-foreground cursor-pointer select-none hover:text-foreground/80"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/dashboard'); }}
        >
          ResuMind AI
        </div>
        <div className="flex items-center gap-4"><HeaderControls /></div>
      </header>

      <section className="px-4 py-6 sm:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-extrabold text-foreground">Your Reports</h1>
          {statusMessage && (
            <div className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${statusType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              {statusType === 'success' && <CheckCircle size={18} className="text-emerald-600" />}
              <span className="font-medium">{statusMessage}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 ir-table-wrap">
          <aside className="col-span-12 lg:col-span-3 bg-foreground/5 border rounded p-4 h-[70vh] overflow-auto ir-column ir-left">
            {reports.length === 0 ? (
              <div className="p-4 text-sm text-foreground/70">No reports found.</div>
            ) : (
              <ul>
                {reports.map((r, idx) => (
                  <li
                    key={idx}
                    className={`p-3 border-b cursor-pointer ${selected===r? 'bg-foreground/10' : ''}`}
                    onClick={() => {
                      setSelected(r);
                      setDeleteConfirmationVisible(false);
                    }}
                  >
                    <div className="font-semibold truncate">{r.title || `Report ${idx+1}`}</div>
                    <div className="text-xs text-foreground/60 truncate">{new Date(r.createdAt || Date.now()).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <main className="col-span-12 lg:col-span-6 bg-foreground/5 border rounded p-6 h-[70vh] overflow-auto ir-column ir-center">
            {selected ? (
              <div>
  <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
  <h2 className="text-xl font-bold">
    {selected.title || "Interview Report"}
  </h2>

  <div className="flex items-center gap-2">
    <button
      onClick={downloadPDF}
      className="inline-flex items-center gap-2 text-sm bg-foreground text-background px-3 py-2 rounded hover:bg-foreground/80"
    >
      <Download size={16} />
    </button>
    <button
      onClick={() => setDeleteConfirmationVisible(true)}
      className="inline-flex items-center gap-2 text-sm bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
    >
      <Trash2 size={16} />
    </button>
  </div>
</div>
{deleteConfirmationVisible && (
  <div className="mb-4 rounded-2xl border border-foreground/10 bg-foreground/5 p-4 text-sm text-foreground shadow-sm">
    <div className="mb-3 font-semibold text-foreground">Delete report?</div>
    <p className="mb-4 text-foreground/70">This action cannot be undone. Please confirm to remove the selected report.</p>
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleDeleteReport}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-background shadow-sm transition hover:bg-red-700 font-semibold"
      >
        Confirm Delete
      </button>
      <button
        onClick={() => setDeleteConfirmationVisible(false)}
        className="inline-flex items-center gap-2 rounded-xl border border-foreground/20 bg-background px-4 py-2 text-foreground shadow-sm transition hover:bg-foreground/5"
      >
        Cancel
      </button>
    </div>
  </div>
)}
                <div className="text-sm text-foreground/70 mb-4">Generated: {new Date(selected.createdAt || Date.now()).toLocaleString()}</div>

                {/* Summary */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Summary</h3>
                  <p className="text-foreground/70 whitespace-pre-line">{selected.resumeText?.slice(0,1000) || selected.resumeText || selected.summary || 'No summary available.'}{selected.resumeText && selected.resumeText.length>1000 ? '...' : ''}</p>
                </div>

                {/* Technical Questions */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Technical Questions</h3>
                  <div className="space-y-4">
                    {(selected.technicalInterviews && selected.technicalInterviews.length>0) ? selected.technicalInterviews.map((t,i)=> (
                      <div key={i}>
                        <div className="font-medium">Q: {t.questions}</div>
                        <div className="text-foreground/60">Answer guide: {t.answers}</div>
                      </div>
                    )) : (<div className="text-foreground/60">No technical questions available.</div>)}
                  </div>
                </div>

                {/* Behavioural Questions */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Behavioural Questions</h3>
                  <div className="space-y-4">
                    {(selected.behavioralInterviews && selected.behavioralInterviews.length>0) ? selected.behavioralInterviews.map((b,i)=> (
                      <div key={i}>
                        <div className="font-medium">Q: {b.questions}</div>
                        <div className="text-foreground/60">Approach: {b.intention || b.answer || '—'}</div>
                      </div>
                    )) : (<div className="text-foreground/60">No behavioural questions available.</div>)}
                  </div>
                </div>

                {/* Improvements */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Improvements</h3>
                  <div className="space-y-3">
                    {Array.isArray(selected.improvements) && selected.improvements.length > 0 ? (
                      <div className="space-y-4">
                        {selected.improvements.map((imp, i) => (
                          <div key={i} className="p-3 border rounded">
                            {imp.title && <div className="font-semibold mb-1">{imp.title}</div>}
                            {imp.description && <div className="text-foreground/70 whitespace-pre-line">{imp.description}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-foreground/60">No improvements provided.</div>
                    )}
                  </div>
                </div>

                {/* Roadmap */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Preparation Roadmap</h3>
                  <div className="space-y-4">
                    {(selected.preparationPlan && selected.preparationPlan.length>0) ? selected.preparationPlan.map((p,i)=>(
                      <div key={i} className="p-3 border rounded">
                        <div className="font-medium">Day {p.day || (i+1)}</div>
                        <div className="text-foreground/70">{p.focusAreas || p.focus || '—'}</div>
                        <div className="text-foreground/60 mt-1">{p.tasks || p.actions || ''}</div>
                      </div>
                    )) : (<div className="text-foreground/60">No roadmap available.</div>)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-foreground/70">Select a report from the list to view its content.</div>
            )}
          </main>

          <aside className="col-span-12 lg:col-span-3 border rounded p-6 h-[70vh] overflow-auto ir-column">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold">ATS Score</h3>
                    <div className="text-2xl font-bold">{selected.atsScore ?? 'N/A'}</div>
                  </div>
                  <div>
                    <LayoutDashboard size={40} />
                  </div>
                </div>
                <h3 className="font-semibold mb-4">Skill Gaps</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.skillGapAnalysis?.length > 0 ? selected.skillGapAnalysis.map((s,i)=> (
                    <span key={i} className={`skill-chip ${s.severity==='High' ? 'gap-high' : s.severity==='Medium' ? 'gap-medium' : 'gap-low'}`} title={s.severity}>
                      <span className="skill-dot" aria-hidden />
                      <span className="skill-name">{s.skills}</span>
                    </span>
                  )) : (
                    <div className="text-foreground/60">No skill gap data available.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-foreground/70">When a report is selected, details appear here.</div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function ProtectedAllReports(){
  return (
    <Protected>
      <AllReports />
    </Protected>
  )
}
