import React, { useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader, BarChart3 } from 'lucide-react';
import HeaderControls from '../components/HeaderControls';
import './interview-report.css';
import axios from 'axios';
import { apiConfig } from '../../services/api.config';
import { ScrollAnimate } from '../components/ScrollAnimate';

export function InterviewReport() {
  const { theme, toggleTheme } = useTheme();
  const { user, handleLogout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('summary');

  useEffect(() => {
    if (authLoading) return; // wait until auth finished
    let mounted = true;
    async function fetchReport() {
      setLoading(true);
      // If we just generated a report, it will be stored in localStorage by the dashboard.
      // Check localStorage first and use it immediately to avoid a stuck spinner.
      try {
        const stored = localStorage.getItem('latestInterviewReport');
        const parsed = stored ? JSON.parse(stored) : null;
        const currentId = user?._id || user?.id;
        if (parsed && (!currentId || String(parsed.user) === String(currentId))) {
          if (mounted) {
            setReport(parsed);
            setError('');
            setLoading(false);
          }
          return; // skip network fetch
        }
      } catch (e) {
        // ignore parse errors and continue to network fetch
      }
      try {
        const resp = await axios.get('/api/interview/latest', apiConfig);
        if (!mounted) return;
        // Prefer server response, fall back to persisted report if available
        if (resp.data && resp.data.interviewReport) {
          const r = resp.data.interviewReport;
          // ensure the report belongs to the logged-in user
          const currentId = user?._id || user?.id;
          if (!currentId || String(r.user) === String(currentId)) {
            setReport(r);
          } else {
            setReport(null);
            setError('No report found for this user');
          }
        } else {
          const stored = localStorage.getItem('latestInterviewReport');
          const parsed = stored ? JSON.parse(stored) : null;
          const currentId = user?._id || user?.id;
          if (!parsed || (currentId && String(parsed.user) !== String(currentId))) {
            setReport(null);
          } else {
            setReport(parsed);
          }
        }
      } catch (err) {
        // If server returns 404 or any error, try to load cached report from localStorage
        if (err.response && err.response.status === 404) {
          const stored = localStorage.getItem('latestInterviewReport');
          if (stored) {
            setReport(JSON.parse(stored));
            setError('');
          } else {
            setError('No report available');
          }
        } else {
          setError(err.response?.data?.message || 'Failed to load interview report');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchReport();
    return () => { mounted = false; };
  }, [user, authLoading]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin" size={48} />
          <div>Loading your interview report...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={()=>navigate('/dashboard')} className="px-4 py-2 rounded bg-foreground">Back</button>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div>No report found. Create one from the dashboard.</div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-white dark:bg-black text-foreground">
      {/* Background - abstract circles (same as dashboard) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 dark:bg-white bg-gray-900 rounded-full opacity-5" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 dark:bg-white bg-gray-900 rounded-full opacity-5" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 dark:bg-white bg-gray-900 rounded-full opacity-5" />
      </div>
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div
          onClick={() => navigate('/dashboard')}
          className="text-2xl font-extrabold text-foreground cursor-pointer select-none hover:text-foreground/80"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/dashboard'); }}
        >
          ResuMind AI
        </div>
        <div className="flex items-center gap-4">
          <HeaderControls />
        </div>
      </header>
      <section className="px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Interview Report</h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 ir-table-wrap">
            <aside className="col-span-12 lg:col-span-3 border rounded p-4 ir-column ir-left">
              <nav className="space-y-3">
                <button onClick={()=>setActiveSection('summary')} className={`menu-btn w-full text-left px-3 py-2 rounded ${activeSection==='summary' ? 'bg-foreground/10 font-semibold' : 'hover:bg-foreground/5'}`}>Summary</button>
                <button onClick={()=>setActiveSection('technical')} className={`menu-btn w-full text-left px-3 py-2 rounded ${activeSection==='technical' ? 'bg-foreground/10 font-semibold' : 'hover:bg-foreground/5'}`}>Technical Questions</button>
                <button onClick={()=>setActiveSection('behavioral')} className={`menu-btn w-full text-left px-3 py-2 rounded ${activeSection==='behavioral' ? 'bg-foreground/10 font-semibold' : 'hover:bg-foreground/5'}`}>Behavioural Questions</button>
                <button onClick={()=>setActiveSection('improvements')} className={`menu-btn w-full text-left px-3 py-2 rounded ${activeSection==='improvements' ? 'bg-foreground/10 font-semibold' : 'hover:bg-foreground/5'}`}>Improvements</button>
                {/* Skill Gaps moved to right panel - removed from left menu */}
                <button onClick={()=>setActiveSection('roadmap')} className={`menu-btn w-full text-left px-3 py-2 rounded ${activeSection==='roadmap' ? 'bg-foreground/10 font-semibold' : 'hover:bg-foreground/5'}`}>Road Map</button>
              </nav>
            </aside>

            <main className="col-span-12 lg:col-span-6 border rounded p-6 ir-column ir-center">
              {activeSection === 'summary' && (
                <div className="ir-animate section-card">
                  <h3 className="text-lg font-semibold mb-4">Summary</h3>
                  <p className="mb-4">Title: {report.title}</p>
                  <h4 className="font-semibold mb-2">Resume insights</h4>
                  <p className="text-foreground/70 whitespace-pre-line">{report.resumeText?.slice(0,1000)}{report.resumeText && report.resumeText.length>1000 ? '...' : ''}</p>
                </div>
              )}

              {activeSection === 'technical' && (
                <div className="ir-animate section-card">
                  <h3 className="text-lg font-semibold mb-4">Technical Questions</h3>
                  <div className="space-y-4">
                    {report.technicalInterviews?.map((t,i)=> (
                      <div key={i}>
                        <div className="font-medium">Q: {t.questions}</div>
                        <div className="text-foreground/60">Answer guide: {t.answers}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'behavioral' && (
                <div className="ir-animate section-card">
                  <h3 className="text-lg font-semibold mb-4">Behavioural Questions</h3>
                  <div className="space-y-4">
                    {report.behavioralInterviews?.map((b,i)=> (
                      <div key={i}>
                        <div className="font-medium">Q: {b.questions}</div>
                        <div className="text-foreground/60">Approach: {b.intention}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'improvements' && (
                <div className="ir-animate section-card">
                  <h3 className="text-lg font-semibold mb-4">Improvements</h3>
                  <div className="space-y-3">
                    {Array.isArray(report.improvements) && report.improvements.length > 0 ? (
                      <div className="space-y-4">
                        {report.improvements.map((imp, i) => (
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
              )}

              {/* Skill gaps are displayed in the right column as compact chips */}

              {activeSection === 'roadmap' && (
                <div className="ir-animate section-card">
                  <h3 className="text-lg font-semibold mb-4">Preparation Roadmap</h3>
                  <div className="space-y-4">
                    {report.preparationPlan?.map((p,i)=>(
                      <div key={i} className="p-3 border rounded">
                        <div className="font-medium">Day {p.day}</div>
                        <div className="text-foreground/70">{p.focusAreas}</div>
                        <div className="text-foreground/60 mt-1">{p.tasks}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>

            <aside className="col-span-12 lg:col-span-3 border rounded p-6 ir-column">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold">ATS Score</h3>
                  <div className="text-2xl font-bold">{report.atsScore ?? 'N/A'}</div>
                </div>
                <div>
                  <BarChart3 size={40} />
                </div>
              </div>

              <h3 className="font-semibold mb-4">Skill Gaps</h3>
              <div className="flex flex-wrap gap-2">
                {report.skillGapAnalysis?.map((s,i)=> (
                  <span key={i} className={`skill-chip ${s.severity==='High' ? 'gap-high' : s.severity==='Medium' ? 'gap-medium' : 'gap-low'}`} title={s.severity}>
                    <span className="skill-dot" aria-hidden />
                    <span className="skill-name">{s.skills}</span>
                  </span>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

export default InterviewReport;
