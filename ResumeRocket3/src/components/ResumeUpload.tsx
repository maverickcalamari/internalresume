import React, { useState } from 'react'

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface ResumeUploadProps {
  user: User | null;
  authToken: string | null;
}

interface AnalysisResult {
  id: number;
  filename: string;
  industry: string;
  atsScore: number;
  analysis: {
    strengths: string[];
    weaknesses: string[];
    keywords: string[];
  };
  suggestions: any[];
  createdAt: string;
}

export default function ResumeUpload({ user, authToken }: ResumeUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [industry, setIndustry] = useState('')
  const [userEmail, setUserEmail] = useState(user?.email || '')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError('')
    }
  }

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!selectedFile) {
      setError('Please select a resume file')
      return
    }

    if (!userEmail) {
      setError('Please provide your email address')
      return
    }

    setUploading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', selectedFile)
      formData.append('userEmail', userEmail)
      formData.append('industry', industry)
      if (user) {
        formData.append('userId', user.id.toString())
      }

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        headers: authToken ? {
          'Authorization': `Bearer ${authToken}`
        } : {},
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data.resume)
        setSelectedFile(null)
        setIndustry('')
        // Reset form
        const fileInput = document.getElementById('resume-file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Network error - please try again')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-section">
      <h2>Resume Analysis & Optimization</h2>
      <p>Upload your resume for AI-powered analysis and receive detailed feedback with ATS scoring.</p>

      <form onSubmit={handleUpload} className="upload-form">
        <div className="form-group">
          <label htmlFor="resume-file">Select Resume File (PDF, DOC, DOCX)</label>
          <input
            type="file"
            id="resume-file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            required
          />
          {selectedFile && (
            <div className="file-info">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="user-email">Email Address</label>
          <input
            type="email"
            id="user-email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
          <small>Analysis results will be sent to this email</small>
        </div>

        <div className="form-group">
          <label htmlFor="industry">Target Industry (Optional)</label>
          <select
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">Select Industry</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Education">Education</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="upload-button"
          disabled={uploading || !selectedFile || !userEmail}
        >
          {uploading ? 'Analyzing Resume...' : 'Analyze Resume'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {result && (
        <div className="analysis-result">
          <h3>Analysis Complete!</h3>
          <div className="score-display">
            <div className="ats-score">
              <span className="score-number">{result.atsScore}</span>
              <span className="score-label">ATS Score</span>
            </div>
            <div className="score-details">
              <p><strong>File:</strong> {result.filename}</p>
              <p><strong>Industry:</strong> {result.industry}</p>
              <p><strong>Analyzed:</strong> {new Date(result.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="analysis-details">
            <div className="strengths">
              <h4>Strengths</h4>
              <ul>
                {result.analysis.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>

            <div className="improvements">
              <h4>Areas for Improvement</h4>
              <ul>
                {result.analysis.weaknesses?.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            </div>

            <div className="keywords">
              <h4>Relevant Keywords</h4>
              <div className="keyword-tags">
                {result.analysis.keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">{keyword}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="next-steps">
            <h4>Next Steps</h4>
            <p>Detailed analysis and personalized recommendations have been sent to your email. For comprehensive resume optimization and career consultation, contact Pierline Consultation directly.</p>
          </div>
        </div>
      )}
    </div>
  )
}