import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = '/api/analyze';

function riskColor(level) {
  if (level === 'high') return '#d64545';
  if (level === 'medium') return '#d9a635';
  return '#3f9d5c';
}

function scoreColor(score) {
  if (score >= 66) return '#d64545';
  if (score >= 33) return '#d9a635';
  return '#3f9d5c';
}

export default function App() {
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/history`);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && pastedText.trim().length < 30) {
      setError('Upload a PDF/TXT file or paste at least a few sentences of contract text.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      if (file) form.append('contract', file);
      if (pastedText.trim()) form.append('contractText', pastedText);

      const res = await axios.post(API, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const openHistoryItem = async (id) => {
    try {
      const res = await axios.get(`${API}/${id}`);
      setResult(res.data);
    } catch (e) {
      setError('Could not load that analysis.');
    }
  };

  const deleteHistoryItem = async (id, ev) => {
    ev.stopPropagation();
    try {
      await axios.delete(`${API}/${id}`);
      loadHistory();
      if (result?._id === id) setResult(null);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🛡️ ContractGuard</h1>
        <p>AI contract risk scanner for freelancers — turns a 45-minute contract read into a 90-second risk report.</p>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <h3>Past Analyses</h3>
          {history.length === 0 && <p className="muted">No analyses yet.</p>}
          <ul className="history-list">
            {history.map((h) => (
              <li key={h._id} onClick={() => openHistoryItem(h._id)} className="history-item">
                <div>
                  <strong>{h.contractTitle}</strong>
                  <span className="score-pill" style={{ background: scoreColor(h.overallRiskScore) }}>
                    {h.overallRiskScore}
                  </span>
                </div>
                <button className="delete-btn" onClick={(ev) => deleteHistoryItem(h._id, ev)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="main">
          <form className="upload-form" onSubmit={handleSubmit}>
            <label className="file-label">
              Upload contract (PDF or TXT)
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </label>
            <div className="or-divider">— or paste the text below —</div>
            <textarea
              placeholder="Paste the contract text here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={8}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : 'Scan Contract'}
            </button>
            {error && <p className="error">{error}</p>}
          </form>

          {result && (
            <section className="result">
              <div className="result-header">
                <h2>{result.contractTitle}</h2>
                <div className="score-box" style={{ borderColor: scoreColor(result.overallRiskScore) }}>
                  <span style={{ color: scoreColor(result.overallRiskScore) }}>{result.overallRiskScore}</span>
                  <small>risk score / 100</small>
                </div>
              </div>
              <p className="summary">{result.summary}</p>

              <h3>Flagged Clauses</h3>
              {result.clauses.length === 0 && <p className="muted">No significant risk clauses flagged.</p>}
              <div className="clause-list">
                {result.clauses.map((c, i) => (
                  <div className="clause-card" key={i} style={{ borderLeftColor: riskColor(c.riskLevel) }}>
                    <div className="clause-top">
                      <span className="category">{c.category}</span>
                      <span className="risk-tag" style={{ background: riskColor(c.riskLevel) }}>
                        {c.riskLevel}
                      </span>
                    </div>
                    <p className="clause-text">"{c.clauseText}"</p>
                    <p className="clause-explanation">{c.explanation}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
