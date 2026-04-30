'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Step {
  id: string
  title: string
  time: string
  done: boolean
  children: React.ReactNode
}

function StepCard({ step, onToggle }: { step: Step; onToggle: () => void }) {
  const [open, setOpen] = useState(!step.done)
  return (
    <div className={`card border-l-4 ${step.done ? 'border-l-green-500' : 'border-l-brand-gold'}`}>
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={e => { e.stopPropagation(); onToggle() }}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              step.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-brand-gold'
            }`}
          >
            {step.done && <span className="text-xs">✓</span>}
          </button>
          <div>
            <h3 className={`font-semibold ${step.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
              {step.title}
            </h3>
            <span className="text-xs text-gray-400">{step.time}</span>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </div>
      {open && !step.done && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 text-sm text-gray-700 space-y-3">
          {step.children}
        </div>
      )}
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">
      {children}
    </pre>
  )
}

export default function SetupPage() {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const toggle = (id: string) => setDone(d => ({ ...d, [id]: !d[id] }))

  const completedCount = Object.values(done).filter(Boolean).length
  const totalSteps = 5

  const steps: Omit<Step, 'done'>[] = [
    {
      id: 'supabase',
      title: '1. Create Supabase project',
      time: '5 min',
      children: (
        <ol className="list-decimal list-inside space-y-2">
          <li>Go to <a href="https://supabase.com" target="_blank" className="text-brand-gold underline">supabase.com</a> → New project</li>
          <li>Choose a region close to India (Singapore / Mumbai)</li>
          <li>Note your <strong>Project URL</strong> and two API keys: <code className="bg-gray-100 px-1 rounded">anon</code> and <code className="bg-gray-100 px-1 rounded">service_role</code></li>
          <li>Open <strong>SQL Editor</strong> → paste the full contents of <code className="bg-gray-100 px-1 rounded">supabase/schema.sql</code> → Run</li>
          <li>Go to <strong>Database → Replication</strong> → enable the <code className="bg-gray-100 px-1 rounded">items</code> table for Realtime</li>
        </ol>
      ),
    },
    {
      id: 'env',
      title: '2. Fill in .env.local',
      time: '2 min',
      children: (
        <>
          <p>Open <code className="bg-gray-100 px-1 rounded">.env.local</code> and replace the placeholder values:</p>
          <Code>{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # keep secret!
SESSION_SECRET=<run: openssl rand -base64 32>
GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv
ADMIN_PHONE=+919602368928
ADMIN_EMAIL=your@email.com`}</Code>
          <p className="text-yellow-700 bg-yellow-50 rounded p-2">
            ⚠️ <strong>Never commit .env.local to git.</strong> It&apos;s already in .gitignore.
          </p>
        </>
      ),
    },
    {
      id: 'whitelist',
      title: '3. Set up Google Sheet whitelist',
      time: '5 min',
      children: (
        <>
          <p>Create a Google Sheet with authorized bidder emails and phone numbers:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Column A = Email, Column B = Phone Number</li>
            <li>Add your shop owners&apos; contact info as you collect it</li>
            <li>The sheet must be shared as &quot;Anyone with the link can view&quot;</li>
            <li>Copy the CSV export URL into <code className="bg-gray-100 px-1 rounded">GOOGLE_SHEET_CSV_URL</code></li>
          </ol>
          <p className="text-blue-700 bg-blue-50 rounded p-2">
            💡 The system checks <strong>all columns</strong> — bidders can log in with either email or phone. The +91 prefix is ignored automatically.
          </p>
        </>
      ),
    },
    {
      id: 'items',
      title: '4. Import your items',
      time: '15 min',
      children: (
        <>
          <p>Prepare a CSV or Excel file with these columns:</p>
          <Code>{`name = product * | category = company / brand * | starting_price * | description | min_increment | image_url`}</Code>
          <p>Then:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Login as admin</li>
            <li>Go to <Link href="/admin" className="text-brand-gold underline">/admin</Link> → click <strong>Import Items</strong></li>
            <li>Upload your .csv or .xlsx file, review rows, click Import</li>
          </ol>
        </>
      ),
    },
    {
      id: 'deploy',
      title: '5. Deploy to Vercel',
      time: '10 min',
      children: (
        <>
          <ol className="list-decimal list-inside space-y-2">
            <li>Push this folder to a GitHub repo</li>
            <li>Go to <a href="https://vercel.com/new" target="_blank" className="text-brand-gold underline">vercel.com/new</a> → import your repo</li>
            <li>Add all env vars from .env.local in <strong>Environment Variables</strong> settings</li>
            <li>Deploy — Vercel auto-detects Next.js</li>
          </ol>
          <p className="text-blue-700 bg-blue-50 rounded p-2">
            💡 Region is set to <strong>bom1</strong> (Mumbai) in vercel.json for lowest latency to Indian bidders.
          </p>
        </>
      ),
    },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-navy">Setup Checklist</h1>
        <p className="text-gray-500 mt-1">Complete these steps to launch your auction</p>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>{completedCount} of {totalSteps} steps done</span>
            <span>{Math.round(completedCount / totalSteps * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-gold h-2 rounded-full transition-all"
              style={{ width: `${completedCount / totalSteps * 100}%` }}
            />
          </div>
        </div>
      </div>

      {completedCount === totalSteps && (
        <div className="card p-6 bg-green-50 border-green-200 text-center mb-6">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-green-800">You&apos;re live!</h2>
          <p className="text-green-700 mt-1">Your auction site is ready. Share the URL with buyers.</p>
          <Link href="/" className="btn-primary mt-4 inline-block">Go to Catalog</Link>
        </div>
      )}

      <div className="space-y-3">
        {steps.map(step => (
          <StepCard
            key={step.id}
            step={{ ...step, done: !!done[step.id] }}
            onToggle={() => toggle(step.id)}
          />
        ))}
      </div>
    </div>
  )
}
