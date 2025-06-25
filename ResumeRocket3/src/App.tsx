import React, { useState } from 'react'
import './App.css'

interface AnalysisResult {
  atsScore: number;
  analysis: {
    strengths: string[];
    improvements: string[];
    keywordMatch: number;
    formatting: number;
    content: number;
  };
  suggestions: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
  }>;
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [industry, setIndustry] = useState('technology')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a resume file')
      return
    }

    if (!userEmail) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('resume', selectedFile)
      formData.append('industry', industry)
      formData.append('userEmail', userEmail)

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          atsScore: data.resume.atsScore,
          analysis: data.resume.analysis,
          suggestions: data.resume.suggestions || []
        })
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setResult(null)
    setError('')
    setUserEmail('')
    setIndustry('technology')
  }

  const handleDownloadReport = () => {
    if (!result) return
    
    const reportData = {
      filename: selectedFile?.name || 'resume',
      atsScore: result.atsScore,
      analysis: result.analysis,
      suggestions: result.suggestions,
      generatedAt: new Date().toISOString(),
      userEmail: userEmail
    }
    
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `resume-analysis-report-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleScheduleConsultation = () => {
    // Redirect to Pierline Consultation's actual contact page
    window.open('https://www.pierlineconsultation.com/contact', '_blank')
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1>Pierline Consultation Resume Optimizer</h1>
          <p>Professional Resume Analysis & IT Career Optimization</p>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {!result ? (
            <div className="upload-section">
              <div className="upload-card">
                <h2>Upload Your Resume</h2>
                <p>Get instant AI-powered feedback and optimization suggestions</p>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="industry">Target Industry</label>
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="form-select"
                  >
                    <option value="technology">Technology & IT</option>
                    <option value="cybersecurity">Cybersecurity</option>
                    <option value="cloud">Cloud Services</option>
                    <option value="finance">Financial Services</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="file">Resume File</label>
                  <div className="file-upload">
                    <input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="file-input"
                    />
                    <div className="file-upload-text">
                      {selectedFile ? selectedFile.name : 'Choose PDF, DOC, or DOCX file'}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={loading || !selectedFile || !userEmail}
                  className="upload-button"
                >
                  {loading ? 'Analyzing...' : 'Analyze Resume'}
                </button>
              </div>
            </div>
          ) : (
            <div className="results-section">
              <div className="results-header">
                <h2>Resume Analysis Results</h2>
                <button onClick={resetForm} className="new-analysis-button">
                  Analyze Another Resume
                </button>
              </div>

              <div className="score-card">
                <div className="score-display">
                  <div className="score-number">{result.atsScore}</div>
                  <div className="score-label">ATS Score</div>
                </div>
                <div className="score-breakdown">
                  <div className="breakdown-item">
                    <span>Keyword Match</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${result.analysis.keywordMatch}%` }}
                      ></div>
                    </div>
                    <span>{result.analysis.keywordMatch}%</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Formatting</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${result.analysis.formatting}%` }}
                      ></div>
                    </div>
                    <span>{result.analysis.formatting}%</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Content Quality</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${result.analysis.content}%` }}
                      ></div>
                    </div>
                    <span>{result.analysis.content}%</span>
                  </div>
                </div>
              </div>

              <div className="analysis-grid">
                <div className="analysis-card strengths">
                  <h3>Strengths</h3>
                  <ul>
                    {result.analysis.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>

                <div className="analysis-card improvements">
                  <h3>Areas for Improvement</h3>
                  <ul>
                    {result.analysis.improvements.map((improvement, index) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {result.suggestions.length > 0 && (
                <div className="suggestions-section">
                  <h3>Optimization Suggestions</h3>
                  <div className="suggestions-grid">
                    {result.suggestions.map((suggestion, index) => (
                      <div key={index} className={`suggestion-card ${suggestion.priority}`}>
                        <div className="suggestion-header">
                          <h4>{suggestion.title}</h4>
                          <span className="priority-badge">{suggestion.priority}</span>
                        </div>
                        <p>{suggestion.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="next-steps">
                <h3>Next Steps</h3>
                <div className="steps-grid">
                  <div className="step-card">
                    <h4>Download Your Report</h4>
                    <p>Get a detailed PDF analysis report with all recommendations</p>
                    <button className="step-button" onClick={handleDownloadReport}>Download PDF</button>
                  </div>
                  <div className="step-card">
                    <h4>Schedule Consultation</h4>
                    <p>Connect with Pierline's IT career specialists</p>
                    <button className="step-button" onClick={handleScheduleConsultation}>Contact Pierline</button>
                  </div>
                  <div className="step-card">
                    <h4>Optimize & Retest</h4>
                    <p>Apply suggestions and test your improved resume</p>
                    <button className="step-button" onClick={resetForm}>Test Again</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 Pierline Consultation. Empowering Financial Technology with Precision.</p>
          <p><a href="https://www.pierlineconsultation.com" target="_blank" rel="noopener noreferrer" style={{color: '#a0aec0', textDecoration: 'underline'}}>Visit Pierline Consultation</a></p>
        </div>
      </footer>
    </div>
  )
}