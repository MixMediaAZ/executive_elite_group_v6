'use client'

import Image from 'next/image'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // #region agent log
    fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:19',message:'handleSubmit called',data:{emailLength:email.length,hasPassword:!!password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    try {
      // #region agent log
      fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:25',message:'Before signIn call',data:{nextAuthUrl:process.env.NEXT_PUBLIC_NEXTAUTH_URL||'not-set'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      const signInStartTime = Date.now()
      const result = await Promise.race([
        signIn('credentials', {
          email,
          password,
          redirect: false,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Login request timed out after 30 seconds')), 30000)
        ),
      ]) as any

      // #region agent log
      fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:35',message:'signIn returned',data:{duration:Date.now()-signInStartTime,hasResult:!!result,ok:result?.ok,error:result?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      if (result?.error) {
        setError('Invalid email or password. Please check your credentials and try again.')
        setLoading(false)
      } else if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('An unexpected error occurred. Please try again.')
        setLoading(false)
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login/page.tsx:46',message:'signIn error caught',data:{errorMessage:err?.message,isTimeout:err?.message?.includes('timeout')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      if (err?.message?.includes('timeout')) {
        setError('Login request timed out. The server may be experiencing high load. Please try again in a moment.')
      } else {
        setError('An error occurred while signing in. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden"
      style={{
        backgroundImage: 'url(/wallpaper.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll'
      }}
    >
      <div className="absolute inset-0 bg-white/50"></div>
      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logo.jpg"
              alt="Executive Elite Group"
              className="h-16 w-auto object-contain mx-auto"
              width={200}
              height={200}
              priority
            />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/register" className="font-medium text-eeg-blue-electric hover:text-eeg-blue-600">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 hover:from-eeg-blue-600 hover:to-eeg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-eeg-blue-electric disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
