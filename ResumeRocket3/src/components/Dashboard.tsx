import React, { useState, useEffect } from 'react'

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface DashboardProps {
  user: User;
  authToken: string;
}

interface UserStats {
  resumesAnalyzed: number;
  avgScore: number;
  interviews: number;
  totalOptimizations: number;
}

interface Resume {
  id: number;
  filename: string;
  industry: string;
  atsScore: number;
  createdAt: string;
}

export default function Dashboard({ user, authToken }: DashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentResumes, setRecentResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [user.id, authToken])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?userId=${user.id}`, {
        headers: authToken ? {
          'Authorization': `Bearer ${authToken}`
        } : {}
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentResumes(data.recentResumes || [])
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (err) {
      setError('Network error loading dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Dashboard Error</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-button">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome back, {user.firstName}!</h2>
        <p>Here's your resume optimization progress with Pierline Consultation</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats?.resumesAnalyzed || 0}</div>
          <div className="stat-label">Resumes Analyzed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.avgScore || 0}</div>
          <div className="stat-label">Average ATS Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.interviews || 0}</div>
          <div className="stat-label">Interviews Secured</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.totalOptimizations || 0}</div>
          <div className="stat-label">Optimizations Made</div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Resume Analysis</h3>
        {recentResumes.length > 0 ? (
          <div className="resumes-list">
            {recentResumes.map((resume) => (
              <div key={resume.id} className="resume-item">
                <div className="resume-info">
                  <h4>{resume.filename}</h4>
                  <p>Industry: {resume.industry}</p>
                  <p>Analyzed: {new Date(resume.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="resume-score">
                  <div className={`score-badge ${getScoreClass(resume.atsScore)}`}>
                    {resume.atsScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-resumes">
            <p>No resumes analyzed yet. Upload your first resume to get started!</p>
          </div>
        )}
      </div>

      <div className="next-steps">
        <h3>Recommended Next Steps</h3>
        <div className="recommendations">
          <div className="recommendation-card">
            <h4>Schedule a Consultation</h4>
            <p>Get personalized career guidance from Pierline Consultation experts</p>
            <button className="recommendation-button">Book Now</button>
          </div>
          <div className="recommendation-card">
            <h4>Upload Another Resume</h4>
            <p>Analyze different versions or target specific industries</p>
            <button className="recommendation-button">Upload Resume</button>
          </div>
          <div className="recommendation-card">
            <h4>Download Analysis Report</h4>
            <p>Get detailed PDF reports of your resume analysis</p>
            <button className="recommendation-button">Download</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getScoreClass(score: number): string {
  if (score >= 80) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 60) return 'fair'
  return 'needs-improvement'
}