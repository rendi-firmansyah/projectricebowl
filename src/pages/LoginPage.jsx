import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, LogIn, Sparkles, AlertCircle, Shield, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const { user, admin, login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectParam = searchParams.get('redirect') || '/'
  const modeParam = searchParams.get('mode') // 'admin' or null
  const isAdminMode = modeParam === 'admin'
  const finalRedirect = redirectParam.startsWith('/') ? redirectParam : '/' + redirectParam

  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // UI states
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If coming from admin route and admin is already logged in, go to admin
    if (isAdminMode && admin) {
      navigate('/admin', { replace: true })
      return
    }
    // If regular user is logged in and no admin mode, redirect to their destination
    if (!isAdminMode && user) {
      navigate(finalRedirect, { replace: true })
    }
  }, [user, admin, navigate, finalRedirect, isAdminMode])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    // Delay slightly to feel premium & authentic
    setTimeout(async () => {
      if (isForgotPassword) {
        if (!email || !password || !confirmPassword) {
          setError('Silakan isi semua field')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Password baru minimal 6 karakter')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Password konfirmasi tidak cocok')
          setLoading(false)
          return
        }
        try {
          const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          const data = await response.json().catch(() => null)
          if (!response.ok) {
            setError(data?.message || 'Gagal mereset password')
          } else {
            setSuccessMessage('Password berhasil diperbarui! Silakan masuk kembali.')
            setEmail('')
            setPassword('')
            setConfirmPassword('')
            setIsForgotPassword(false)
          }
        } catch {
          setError('Tidak bisa menghubungi server')
        }
      } else if (isSignUp) {
        if (!name || !email || !password) {
          setError('Please fill in all fields')
          setLoading(false)
          return
        }
        const res = await register(name, email, password)
        if (!res.success) {
          setError(res.message)
        } else {
          // User registered successfully, navigate
          navigate(finalRedirect, { replace: true })
        }
      } else {
        if (!email || !password) {
          setError('Please fill in all fields')
          setLoading(false)
          return
        }
        const res = await login(email, password, isAdminMode ? 'admin' : 'user')
        if (!res.success) {
          setError(res.message)
        } else {
          // Navigate based on role
          if (isAdminMode) {
            navigate('/admin', { replace: true })
          } else {
            navigate(finalRedirect, { replace: true })
          }
        }
      }
      setLoading(false)
    }, 800)
  }

  const handleAdminPreset = () => {
    setEmail('admin@couplebowl.com')
    setPassword('admin')
    setIsSignUp(false)
    setIsForgotPassword(false)
    setError('')
    setSuccessMessage('')
    if (!isAdminMode) {
      navigate('/login?mode=admin', { replace: true })
    }
  }

  return (
    <div className="login-page-container">
      {/* Background decorations */}
      <div className="login-decor-circle-1" />
      <div className="login-decor-circle-2" />
      
      <div className="login-card glass animate-scale-in" style={{ paddingTop: '56px' }}>
        {/* Back to Home */}
        <Link to="/" className="login-back-home">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="login-header">
          <div className="login-logo-icon">CB</div>
          <h2 className="login-title">Couple Bowl</h2>
          <p className="login-subtitle">
            {isForgotPassword 
              ? 'Reset kata sandi akun Anda' 
              : isAdminMode 
                ? 'Sign in to access Admin Panel' 
                : isSignUp 
                  ? 'Join us for delicious healthy bowls' 
                  : 'Sign in to order your favorite bowl'}
          </p>
        </div>

        {/* Tab switchers - hide register for admin mode */}
        {!isAdminMode && !isForgotPassword && (
          <div className="login-tabs">
            <button 
              type="button" 
              className={`login-tab-btn ${!isSignUp ? 'active' : ''}`}
              onClick={() => { setIsSignUp(false); setError(''); setSuccessMessage(''); }}
            >
              Sign In
            </button>
            <button 
              type="button" 
              className={`login-tab-btn ${isSignUp ? 'active' : ''}`}
              onClick={() => { setIsSignUp(true); setError(''); setSuccessMessage(''); }}
            >
              Register
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="login-error-alert" style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
              <CheckCircle size={16} style={{ color: '#059669' }} />
              <span>{successMessage}</span>
            </div>
          )}

          {isSignUp && !isForgotPassword && (
            <div className="login-input-group">
              <label className="login-label">Full Name</label>
              <div className="login-input-wrapper">
                <User size={18} className="login-input-icon" />
                <input 
                  type="text" 
                  className="input-field login-input" 
                  placeholder="Enter your full name"
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="login-input-group">
            <label className="login-label">Email Address</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input 
                type="email" 
                className="input-field login-input" 
                placeholder="name@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="login-label">{isForgotPassword ? 'New Password' : 'Password'}</label>
              {!isSignUp && !isForgotPassword && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                  onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="input-field login-input login-password-input" 
                placeholder="********"
                value={password} 
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(value => !value)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isForgotPassword && (
            <div className="login-input-group">
              <label className="login-label">Confirm New Password</label>
              <div className="login-input-wrapper">
                <Lock size={18} className="login-input-icon" />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="input-field login-input login-password-input" 
                  placeholder="********"
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowConfirmPassword(value => !value)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
            {loading ? (
              <span className="login-loading-spinner" />
            ) : (
              <>
                <LogIn size={18} />
                <span>{isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : isAdminMode ? 'Sign In as Admin' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        {isForgotPassword ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#4B5563', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            {/* Divider */}
            <div className="login-divider">
              <span className="login-divider-text">OR</span>
            </div>

            {/* Shortcuts for testing / admin */}
            <div className="login-shortcuts">
              <button 
                type="button" 
                className="login-shortcut-btn admin-preset"
                onClick={handleAdminPreset}
                disabled={loading}
              >
                <Shield size={14} />
                <span>Use Admin Credentials</span>
              </button>
            </div>
          </>
        )}

        <div className="login-footer-note">
          <Sparkles size={14} style={{ color: '#F59E0B' }} />
          <span>Fresh and healthy premium rice bowls</span>
        </div>
      </div>
    </div>
  )
}
