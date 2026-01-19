'use client'

import Image from 'next/image'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
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

    try {
      // #region agent log
      fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/auth/login/page.tsx:25',message:'login submit start',data:{emailPrefix:email.substring(0,5),windowLocation:window.location.href,origin:window.location.origin,host:window.location.host},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H3,H4,H5'})}).catch(()=>{});
      // #endregion
      
      // Use a more explicit timeout approach for better error handling
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Login request timed out after 30 seconds')), 30000)
      )

      const signInPromise = signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      const result = await Promise.race([signInPromise, timeoutPromise]) as any
      
      // #region agent log
      fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/auth/login/page.tsx:41',message:'signIn result',data:{hasResult:!!result,hasError:!!result?.error,hasOk:!!result?.ok,status:result?.status,errorMsg:result?.error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2'})}).catch(()=>{});
      // #endregion

      // Handle the response
      if (result?.error) {
        // #region agent log
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/auth/login/page.tsx:48',message:'signIn error path',data:{error:result.error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        setError('Invalid email or password. Please check your credentials and try again.')
        setLoading(false)
        return
      }

      // NextAuth v5 beta workaround: manually fetch session after signIn to ensure it's set
      // This fixes issues where signIn() resolves but session isn't immediately available
      if (result?.ok || result?.status === 200) {
        // Fetch session to ensure it's properly set
        const session = await getSession()
        
        // #region agent log
        fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/auth/login/page.tsx:60',message:'session fetched',data:{hasSession:!!session,hasUser:!!session?.user,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        
        // Small delay to ensure session is fully propagated
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Successful login - redirect to dashboard
        router.push('/dashboard')
        router.refresh()
        return
      }

      // Unexpected response format - check if it's a URL (NextAuth v5 beta sometimes returns URL)
      if (typeof result === 'string' && result.startsWith('http')) {
        // NextAuth returned a URL instead of object - this means success
        await getSession()
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/dashboard')
        router.refresh()
        return
      }

      // Unexpected response format
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    } catch (err: any) {
      setLoading(false)
      if (err?.message?.includes('timeout')) {
        setError('Login request timed out. The server may be experiencing high load. Please try again in a moment.')
      } else {
        setError('An error occurred while signing in. Please try again.')
      }
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
