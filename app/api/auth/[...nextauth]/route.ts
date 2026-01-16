// Re-export GET and POST handlers from auth.ts (NextAuth v5 beta pattern)
import { handlers } from '@/lib/auth'
import type { NextRequest } from 'next/server'

const originalPOST = handlers.POST
const originalGET = handlers.GET

export const POST = async (req: NextRequest, context: any) => {
  // #region agent log
  fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:POST',message:'POST handler called',data:{url:req.url,method:req.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  const startTime = Date.now()
  try {
    const result = await originalPOST(req, context)
    // #region agent log
    fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:POST',message:'POST handler completed',data:{duration:Date.now()-startTime,status:result?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return result
  } catch (err: any) {
    // #region agent log
    fetch('http://127.0.0.1:7252/ingest/af4f18b1-607b-409e-9a53-dc7dabb167e7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:POST',message:'POST handler error',data:{duration:Date.now()-startTime,error:err?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw err
  }
}

export const GET = originalGET
