'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import type { AIAgentResponse } from '@/lib/aiAgent'
import {
  FiSearch,
  FiPlus,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiMessageSquare,
  FiGlobe,
  FiSend,
  FiAlertCircle,
  FiRefreshCw,
  FiTrash2,
  FiX,
  FiMenu
} from 'react-icons/fi'
import {
  HiOutlineAcademicCap,
  HiOutlineSparkles,
  HiOutlineLightBulb,
  HiOutlineDocumentText
} from 'react-icons/hi'

// --- Constants ---
const MANAGER_AGENT_ID = '6999679c3f15947a386b5b1e'

const AGENTS_INFO = [
  {
    id: '6999679c3f15947a386b5b1e',
    name: 'Research Coordinator',
    role: 'Manager - coordinates sub-agents',
    provider: 'OpenAI / gpt-4.1'
  },
  {
    id: '69996776771423cce61cd012',
    name: 'Web Research Agent',
    role: 'Sub-agent - web search',
    provider: 'Perplexity / sonar-pro'
  },
  {
    id: '699967889f3636d6dd80970f',
    name: 'ArXiv Research Agent',
    role: 'Sub-agent - academic papers',
    provider: 'OpenAI / gpt-4.1'
  }
]

const EXAMPLE_PROMPTS = [
  'Latest advances in RAG architectures',
  'Compare vector databases for production use',
  'Transformer architectures for time series forecasting',
  'State of the art in multimodal AI models'
]

const SAMPLE_RESEARCH: ResearchResponse = {
  summary:
    'Recent advances in Retrieval-Augmented Generation (RAG) architectures have focused on improving retrieval accuracy, reducing hallucinations, and enabling more efficient integration of external knowledge into large language models. Key developments include multi-hop retrieval, graph-based RAG, and adaptive retrieval strategies that dynamically decide when to retrieve.',
  web_findings: [
    {
      title: 'LangChain RAG Best Practices Guide',
      url: 'https://docs.langchain.com/rag-best-practices',
      summary:
        'Comprehensive guide covering chunking strategies, embedding model selection, and hybrid search approaches for production RAG systems.',
      source_type: 'Documentation'
    },
    {
      title: 'Building Production RAG Systems - Pinecone Blog',
      url: 'https://pinecone.io/blog/production-rag',
      summary:
        'Detailed walkthrough of production-grade RAG pipelines, including vector store optimization, re-ranking techniques, and evaluation metrics.',
      source_type: 'Blog Post'
    },
    {
      title: 'RAG vs Fine-tuning: A Comprehensive Comparison',
      url: 'https://towardsdatascience.com/rag-vs-finetuning',
      summary:
        'Analysis of when to use RAG vs fine-tuning, with benchmarks showing RAG excels for knowledge-intensive tasks while fine-tuning is better for style adaptation.',
      source_type: 'Article'
    }
  ],
  academic_papers: [
    {
      title: 'REALM: Retrieval-Augmented Language Model Pre-Training',
      authors: 'Kelvin Guu, Kenton Lee, Zora Tung, Panupong Pasupat, Ming-Wei Chang',
      abstract:
        'We present REALM, a method for augmenting language model pre-training with a learned textual knowledge retriever. The model learns to retrieve documents from a large corpus during pre-training, improving performance on open-domain QA.',
      arxiv_id: '2002.08909',
      arxiv_url: 'https://arxiv.org/abs/2002.08909',
      published_date: '2020-02-10',
      relevance_summary:
        'Foundational work on retrieval-augmented pre-training that influenced modern RAG architectures.'
    },
    {
      title: 'Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection',
      authors: 'Akari Asai, Zeqiu Wu, Yizhong Wang, Avirup Sil, Hannaneh Hajishirzi',
      abstract:
        'We introduce Self-RAG, a framework that trains an LM to adaptively retrieve passages on-demand and generate and reflect on retrieved passages using special reflection tokens. Self-RAG significantly outperforms existing RAG approaches.',
      arxiv_id: '2310.11511',
      arxiv_url: 'https://arxiv.org/abs/2310.11511',
      published_date: '2023-10-17',
      relevance_summary:
        'State-of-the-art adaptive retrieval approach that uses self-reflection to decide when and what to retrieve.'
    }
  ],
  key_takeaways: [
    'Adaptive retrieval strategies outperform static retrieval by 15-20% on knowledge-intensive benchmarks.',
    'Hybrid search combining dense and sparse retrieval yields the best results for production systems.',
    'Self-reflection mechanisms like Self-RAG reduce hallucinations by up to 30%.',
    'Graph-based RAG architectures are emerging as promising approaches for multi-hop reasoning tasks.'
  ]
}

// --- Interfaces ---
interface WebFinding {
  title?: string
  url?: string
  summary?: string
  source_type?: string
}

interface AcademicPaper {
  title?: string
  authors?: string
  abstract?: string
  arxiv_id?: string
  arxiv_url?: string
  published_date?: string
  relevance_summary?: string
}

interface ResearchResponse {
  summary?: string
  web_findings?: WebFinding[]
  academic_papers?: AcademicPaper[]
  key_takeaways?: string[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'agent' | 'error'
  content: string
  parsedResponse?: ResearchResponse
  timestamp: number
}

interface Session {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
}

// --- ErrorBoundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(231,18%,14%)] text-[hsl(60,30%,96%)]">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-[hsl(228,10%,62%)] mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-[hsl(265,89%,72%)] text-white rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Helpers ---
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function truncateText(text: string, maxLen: number): string {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

function parseAgentResponse(result: AIAgentResponse): ResearchResponse {
  let parsed = result?.response?.result
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      if (result?.raw_response) {
        try {
          const rawParsed = JSON.parse(result.raw_response)
          parsed = rawParsed?.response?.result || rawParsed
        } catch {
          // fallback
        }
      }
    }
  }
  return {
    summary: parsed?.summary ?? '',
    web_findings: Array.isArray(parsed?.web_findings) ? parsed.web_findings : [],
    academic_papers: Array.isArray(parsed?.academic_papers) ? parsed.academic_papers : [],
    key_takeaways: Array.isArray(parsed?.key_takeaways) ? parsed.key_takeaways : []
  }
}

// --- Markdown Renderer ---
function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm leading-relaxed">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// --- Skeleton Loader ---
function LoadingSkeleton() {
  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-[hsl(265,89%,72%)] flex items-center justify-center">
          <HiOutlineSparkles className="w-4 h-4 text-white animate-pulse" />
        </div>
        <span className="text-sm text-[hsl(228,10%,62%)]">Researching across web and academic sources...</span>
      </div>
      <div className="space-y-4 bg-[hsl(232,16%,18%)] rounded-xl p-6 border border-[hsl(232,16%,28%)] shadow-lg">
        <div className="space-y-2">
          <div className="h-4 bg-[hsl(232,16%,28%)] rounded-lg w-3/4 animate-pulse" />
          <div className="h-4 bg-[hsl(232,16%,28%)] rounded-lg w-full animate-pulse" />
          <div className="h-4 bg-[hsl(232,16%,28%)] rounded-lg w-5/6 animate-pulse" />
        </div>
        <div className="h-px bg-[hsl(232,16%,28%)]" />
        <div className="space-y-3">
          <div className="h-3 bg-[hsl(232,16%,28%)] rounded-lg w-1/3 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="h-24 bg-[hsl(232,16%,28%)] rounded-xl animate-pulse" />
            <div className="h-24 bg-[hsl(232,16%,28%)] rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="h-px bg-[hsl(232,16%,28%)]" />
        <div className="space-y-3">
          <div className="h-3 bg-[hsl(232,16%,28%)] rounded-lg w-1/4 animate-pulse" />
          <div className="h-28 bg-[hsl(232,16%,28%)] rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// --- Web Finding Card ---
function WebFindingCard({ finding }: { finding: WebFinding }) {
  return (
    <div className="bg-[hsl(232,16%,22%)] rounded-xl p-4 border border-[hsl(232,16%,28%)] hover:border-[hsl(265,89%,72%)] transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-[hsl(60,30%,96%)] leading-tight group-hover:text-[hsl(265,89%,72%)] transition-colors">
          {finding?.title ?? 'Untitled'}
        </h4>
        {finding?.url && (
          <a
            href={finding.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(228,10%,62%)] hover:text-[hsl(191,97%,70%)] transition-colors flex-shrink-0"
            title="Open source"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {finding?.summary && (
        <p className="text-xs text-[hsl(228,10%,62%)] leading-relaxed mb-3">{finding.summary}</p>
      )}
      <div className="flex items-center gap-2">
        {finding?.source_type && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[hsl(265,89%,72%)]/15 text-[hsl(265,89%,72%)] border border-[hsl(265,89%,72%)]/20">
            {finding.source_type}
          </span>
        )}
        {finding?.url && (
          <span className="text-[10px] text-[hsl(228,10%,62%)] truncate max-w-[180px]">
            {finding.url.replace(/^https?:\/\//, '').split('/')[0]}
          </span>
        )}
      </div>
    </div>
  )
}

// --- Academic Paper Card ---
function AcademicPaperCard({ paper }: { paper: AcademicPaper }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-[hsl(232,16%,22%)] rounded-xl p-4 border border-[hsl(232,16%,28%)] hover:border-[hsl(191,97%,70%)] transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[hsl(60,30%,96%)] leading-tight mb-1">
            {paper?.title ?? 'Untitled Paper'}
          </h4>
          {paper?.authors && (
            <p className="text-xs text-[hsl(228,10%,62%)] mb-2">{paper.authors}</p>
          )}
        </div>
        {paper?.arxiv_url && (
          <a
            href={paper.arxiv_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(228,10%,62%)] hover:text-[hsl(191,97%,70%)] transition-colors flex-shrink-0 mt-0.5"
            title="View on ArXiv"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {paper?.relevance_summary && (
        <p className="text-xs text-[hsl(135,94%,60%)] mb-2 leading-relaxed">
          {paper.relevance_summary}
        </p>
      )}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {paper?.published_date && (
          <span className="text-[10px] text-[hsl(228,10%,62%)] flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            {paper.published_date}
          </span>
        )}
        {paper?.arxiv_id && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[hsl(191,97%,70%)]/15 text-[hsl(191,97%,70%)] border border-[hsl(191,97%,70%)]/20">
            arXiv:{paper.arxiv_id}
          </span>
        )}
      </div>
      {paper?.abstract && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[hsl(265,89%,72%)] hover:text-[hsl(326,100%,68%)] transition-colors flex items-center gap-1 font-medium"
          >
            {expanded ? (
              <>
                <FiChevronUp className="w-3 h-3" />
                Hide Abstract
              </>
            ) : (
              <>
                <FiChevronDown className="w-3 h-3" />
                Show Abstract
              </>
            )}
          </button>
          {expanded && (
            <div className="mt-2 p-3 bg-[hsl(232,16%,18%)] rounded-lg border border-[hsl(232,16%,28%)]">
              <p className="text-xs text-[hsl(228,10%,62%)] leading-relaxed">{paper.abstract}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Research Response Display ---
function ResearchResponseBlock({ data }: { data: ResearchResponse }) {
  const webFindings = Array.isArray(data?.web_findings) ? data.web_findings : []
  const academicPapers = Array.isArray(data?.academic_papers) ? data.academic_papers : []
  const keyTakeaways = Array.isArray(data?.key_takeaways) ? data.key_takeaways : []
  const summary = data?.summary ?? ''

  return (
    <div className="w-full max-w-3xl space-y-4">
      {/* Summary */}
      {summary && (
        <div className="bg-[hsl(232,16%,18%)] rounded-xl p-5 border border-[hsl(232,16%,28%)] shadow-lg shadow-purple-500/5">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineSparkles className="w-4 h-4 text-[hsl(265,89%,72%)]" />
            <h3 className="text-sm font-semibold text-[hsl(265,89%,72%)] tracking-tight">Summary</h3>
          </div>
          <div className="text-sm text-[hsl(60,30%,96%)] leading-relaxed">
            {renderMarkdown(summary)}
          </div>
        </div>
      )}

      {/* Web Findings */}
      {webFindings.length > 0 && (
        <div className="bg-[hsl(232,16%,18%)] rounded-xl p-5 border border-[hsl(232,16%,28%)] shadow-lg shadow-purple-500/5">
          <div className="flex items-center gap-2 mb-3">
            <FiGlobe className="w-4 h-4 text-[hsl(31,100%,65%)]" />
            <h3 className="text-sm font-semibold text-[hsl(31,100%,65%)] tracking-tight">
              Web Findings
            </h3>
            <span className="text-[10px] bg-[hsl(31,100%,65%)]/15 text-[hsl(31,100%,65%)] px-1.5 py-0.5 rounded-full font-medium">
              {webFindings.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {webFindings.map((finding, i) => (
              <WebFindingCard key={i} finding={finding} />
            ))}
          </div>
        </div>
      )}

      {/* Academic Papers */}
      {academicPapers.length > 0 && (
        <div className="bg-[hsl(232,16%,18%)] rounded-xl p-5 border border-[hsl(232,16%,28%)] shadow-lg shadow-purple-500/5">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineAcademicCap className="w-4 h-4 text-[hsl(191,97%,70%)]" />
            <h3 className="text-sm font-semibold text-[hsl(191,97%,70%)] tracking-tight">
              Academic Papers
            </h3>
            <span className="text-[10px] bg-[hsl(191,97%,70%)]/15 text-[hsl(191,97%,70%)] px-1.5 py-0.5 rounded-full font-medium">
              {academicPapers.length}
            </span>
          </div>
          <div className="space-y-3">
            {academicPapers.map((paper, i) => (
              <AcademicPaperCard key={i} paper={paper} />
            ))}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {keyTakeaways.length > 0 && (
        <div className="bg-[hsl(232,16%,18%)] rounded-xl p-5 border border-[hsl(232,16%,28%)] shadow-lg shadow-purple-500/5">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineLightBulb className="w-4 h-4 text-[hsl(135,94%,60%)]" />
            <h3 className="text-sm font-semibold text-[hsl(135,94%,60%)] tracking-tight">
              Key Takeaways
            </h3>
          </div>
          <ul className="space-y-2">
            {keyTakeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[hsl(60,30%,96%)]">
                <span className="w-5 h-5 rounded-full bg-[hsl(135,94%,60%)]/15 text-[hsl(135,94%,60%)] flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// --- Welcome Screen ---
function WelcomeScreen({ onSelectPrompt }: { onSelectPrompt: (prompt: string) => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(265,89%,72%)] to-[hsl(326,100%,68%)] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/20">
          <FiSearch className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[hsl(60,30%,96%)] mb-2 tracking-tight">Welcome to PRO.AI</h1>
        <p className="text-[hsl(228,10%,62%)] text-sm mb-8 leading-relaxed">
          Your AI-powered research assistant for web and academic sources.
          Ask a question and get a comprehensive synthesis from across the internet and ArXiv.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => onSelectPrompt(prompt)}
              className="text-left px-4 py-3 rounded-xl border border-[hsl(232,16%,28%)] bg-[hsl(232,16%,18%)] text-sm text-[hsl(60,30%,96%)] hover:border-[hsl(265,89%,72%)] hover:bg-[hsl(232,16%,22%)] transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
            >
              <span className="text-[hsl(265,89%,72%)] mr-1.5">
                <FiSearch className="w-3 h-3 inline-block" />
              </span>
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- Sidebar Session Item ---
function SessionItem({
  session,
  isActive,
  onClick,
  onDelete
}: {
  session: Session
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const firstUserMsg = session.messages.find((m) => m.role === 'user')
  const preview = truncateText(firstUserMsg?.content ?? '', 50)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className={`group relative px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-[hsl(232,16%,22%)] border border-[hsl(265,89%,72%)]/30' : 'hover:bg-[hsl(232,16%,20%)] border border-transparent'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold truncate ${isActive ? 'text-[hsl(265,89%,72%)]' : 'text-[hsl(60,30%,96%)]'}`}>
            {session.title}
          </p>
          {preview && (
            <p className="text-[10px] text-[hsl(228,10%,62%)] truncate mt-0.5">{preview}</p>
          )}
        </div>
        {hovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="text-[hsl(228,10%,62%)] hover:text-[hsl(0,100%,62%)] transition-colors p-0.5 flex-shrink-0"
            title="Delete session"
          >
            <FiTrash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      <p className="text-[10px] text-[hsl(228,10%,62%)] mt-1">{formatTimestamp(session.createdAt)}</p>
    </div>
  )
}

// --- Agent Status Panel ---
function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <div className="bg-[hsl(232,16%,18%)] rounded-xl border border-[hsl(232,16%,28%)] p-4">
      <h3 className="text-xs font-semibold text-[hsl(228,10%,62%)] uppercase tracking-wider mb-3">
        Agent Pipeline
      </h3>
      <div className="space-y-2">
        {AGENTS_INFO.map((agent) => {
          const isActive = activeAgentId === agent.id
          return (
            <div
              key={agent.id}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors ${isActive ? 'bg-[hsl(265,89%,72%)]/10' : ''}`}
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-[hsl(135,94%,60%)] animate-pulse' : 'bg-[hsl(232,16%,28%)]'}`}
              />
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-medium truncate ${isActive ? 'text-[hsl(265,89%,72%)]' : 'text-[hsl(60,30%,96%)]'}`}>
                  {agent.name}
                </p>
                <p className="text-[9px] text-[hsl(228,10%,62%)] truncate">{agent.role}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// === MAIN PAGE ===
export default function Page() {
  // Session management
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sampleDataOn, setSampleDataOn] = useState(false)

  // Chat state
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null
  const messages = activeSession?.messages ?? []

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [inputValue])

  // Sample data
  useEffect(() => {
    if (sampleDataOn && sessions.length === 0) {
      const sampleSession: Session = {
        id: 'sample-session-1',
        title: 'Latest advances in RAG architectures',
        createdAt: Date.now() - 3600000,
        messages: [
          {
            id: 'sample-user-1',
            role: 'user',
            content: 'Latest advances in RAG architectures',
            timestamp: Date.now() - 3600000
          },
          {
            id: 'sample-agent-1',
            role: 'agent',
            content: '',
            parsedResponse: SAMPLE_RESEARCH,
            timestamp: Date.now() - 3590000
          }
        ]
      }
      setSessions([sampleSession])
      setActiveSessionId('sample-session-1')
    }
    if (!sampleDataOn && sessions.length === 1 && sessions[0]?.id === 'sample-session-1') {
      setSessions([])
      setActiveSessionId(null)
    }
  }, [sampleDataOn, sessions.length, sessions])

  // Create new session
  const createNewSession = useCallback(() => {
    const newSession: Session = {
      id: generateId(),
      title: 'New Research',
      messages: [],
      createdAt: Date.now()
    }
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    setInputValue('')
    setLastFailedMessage(null)
    setSidebarOpen(false)
  }, [])

  // Delete session
  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
      }
    },
    [activeSessionId]
  )

  // Send a research query
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || loading) return
      setLastFailedMessage(null)

      // Create session if none active
      let sessionId = activeSessionId
      if (!sessionId) {
        const newSession: Session = {
          id: generateId(),
          title: truncateText(messageText, 40),
          messages: [],
          createdAt: Date.now()
        }
        setSessions((prev) => [newSession, ...prev])
        setActiveSessionId(newSession.id)
        sessionId = newSession.id
      }

      // Add user message
      const userMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: messageText.trim(),
        timestamp: Date.now()
      }
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s
          const updated = { ...s, messages: [...s.messages, userMsg] }
          if (s.messages.filter((m) => m.role === 'user').length === 0) {
            updated.title = truncateText(messageText, 40)
          }
          return updated
        })
      )
      setInputValue('')

      // Call agent
      setLoading(true)
      setActiveAgentId(MANAGER_AGENT_ID)
      try {
        const result = await callAIAgent(messageText.trim(), MANAGER_AGENT_ID, {
          session_id: sessionId
        })
        setActiveAgentId(null)

        if (result.success) {
          const parsed = parseAgentResponse(result)
          const agentMsg: ChatMessage = {
            id: generateId(),
            role: 'agent',
            content: '',
            parsedResponse: parsed,
            timestamp: Date.now()
          }
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== sessionId) return s
              return { ...s, messages: [...s.messages, agentMsg] }
            })
          )
        } else {
          const errorMsg: ChatMessage = {
            id: generateId(),
            role: 'error',
            content: result?.error ?? result?.response?.message ?? 'Research failed. Please try again.',
            timestamp: Date.now()
          }
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== sessionId) return s
              return { ...s, messages: [...s.messages, errorMsg] }
            })
          )
          setLastFailedMessage(messageText.trim())
        }
      } catch (err) {
        setActiveAgentId(null)
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: 'error',
          content: err instanceof Error ? err.message : 'An unexpected error occurred.',
          timestamp: Date.now()
        }
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sessionId) return s
            return { ...s, messages: [...s.messages, errorMsg] }
          })
        )
        setLastFailedMessage(messageText.trim())
      }
      setLoading(false)
    },
    [activeSessionId, loading]
  )

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  // Retry last failed message
  const handleRetry = () => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage)
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen h-screen flex bg-[hsl(231,18%,14%)] text-[hsl(60,30%,96%)] font-sans">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[hsl(231,18%,12%)] border-r border-[hsl(232,16%,22%)] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[hsl(232,16%,22%)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(265,89%,72%)] to-[hsl(326,100%,68%)] flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <FiSearch className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold tracking-tight">PRO.AI</span>
              </div>
              <button
                className="lg:hidden text-[hsl(228,10%,62%)] hover:text-[hsl(60,30%,96%)] transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[hsl(265,89%,72%)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
            >
              <FiPlus className="w-4 h-4" />
              New Research
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {sessions.length === 0 && (
              <div className="text-center py-8">
                <FiMessageSquare className="w-6 h-6 text-[hsl(232,16%,28%)] mx-auto mb-2" />
                <p className="text-[10px] text-[hsl(228,10%,62%)]">No sessions yet</p>
              </div>
            )}
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onClick={() => {
                  setActiveSessionId(session.id)
                  setSidebarOpen(false)
                }}
                onDelete={() => deleteSession(session.id)}
              />
            ))}
          </div>

          {/* Agent Status */}
          <div className="p-3 border-t border-[hsl(232,16%,22%)]">
            <AgentStatusPanel activeAgentId={activeAgentId} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 h-screen">
          {/* Top Bar */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-[hsl(232,16%,28%)] bg-[hsl(231,18%,14%)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-[hsl(228,10%,62%)] hover:text-[hsl(60,30%,96%)] transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="w-4 h-4 text-[hsl(265,89%,72%)]" />
                <span className="text-sm font-semibold tracking-tight">
                  {activeSession?.title ?? 'PRO.AI'}
                </span>
              </div>
            </div>
            {/* Sample Data Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[hsl(228,10%,62%)] font-medium">Sample Data</span>
              <button
                onClick={() => setSampleDataOn((prev) => !prev)}
                className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${sampleDataOn ? 'bg-[hsl(265,89%,72%)]' : 'bg-[hsl(232,16%,28%)]'}`}
                role="switch"
                aria-checked={sampleDataOn}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${sampleDataOn ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 && !loading ? (
              <WelcomeScreen
                onSelectPrompt={(prompt) => {
                  setInputValue(prompt)
                  sendMessage(prompt)
                }}
              />
            ) : (
              <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {messages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-xl bg-[hsl(232,16%,24%)] rounded-xl rounded-tr-sm px-4 py-3 shadow-lg">
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className="text-[10px] text-[hsl(228,10%,62%)] mt-1.5 text-right">
                            {formatTimestamp(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    )
                  }

                  if (msg.role === 'error') {
                    return (
                      <div key={msg.id} className="flex justify-start">
                        <div className="max-w-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-full bg-[hsl(0,100%,62%)]/20 flex items-center justify-center">
                              <FiAlertCircle className="w-3.5 h-3.5 text-[hsl(0,100%,62%)]" />
                            </div>
                          </div>
                          <div className="bg-[hsl(0,100%,62%)]/10 border border-[hsl(0,100%,62%)]/20 rounded-xl px-4 py-3">
                            <p className="text-sm text-[hsl(0,100%,62%)]">{msg.content}</p>
                            {lastFailedMessage && (
                              <button
                                onClick={handleRetry}
                                disabled={loading}
                                className="mt-2 flex items-center gap-1.5 text-xs text-[hsl(265,89%,72%)] hover:text-[hsl(326,100%,68%)] transition-colors font-medium"
                              >
                                <FiRefreshCw className="w-3 h-3" />
                                Retry
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // Agent response
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(265,89%,72%)] to-[hsl(326,100%,68%)] flex items-center justify-center shadow-md shadow-purple-500/20">
                            <HiOutlineSparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-[hsl(265,89%,72%)]">Research Coordinator</span>
                          <span className="text-[10px] text-[hsl(228,10%,62%)]">{formatTimestamp(msg.timestamp)}</span>
                        </div>
                        {msg.parsedResponse ? (
                          <ResearchResponseBlock data={msg.parsedResponse} />
                        ) : (
                          <div className="bg-[hsl(232,16%,18%)] rounded-xl p-5 border border-[hsl(232,16%,28%)]">
                            <p className="text-sm text-[hsl(228,10%,62%)]">No structured data in response.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Loading skeleton */}
                {loading && (
                  <div className="flex justify-start">
                    <LoadingSkeleton />
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="flex-shrink-0 border-t border-[hsl(232,16%,28%)] bg-[hsl(231,18%,14%)] p-4">
            <div className="max-w-4xl mx-auto flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a research question..."
                  disabled={loading}
                  rows={1}
                  className="w-full resize-none rounded-xl bg-[hsl(232,16%,18%)] border border-[hsl(232,16%,28%)] text-sm text-[hsl(60,30%,96%)] placeholder-[hsl(228,10%,62%)] px-4 py-3 pr-12 focus:outline-none focus:border-[hsl(265,89%,72%)] focus:ring-1 focus:ring-[hsl(265,89%,72%)] transition-all disabled:opacity-50 leading-relaxed"
                />
              </div>
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || loading}
                className="flex-shrink-0 w-11 h-11 rounded-xl bg-[hsl(265,89%,72%)] text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
              >
                {loading ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiSend className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-center text-[9px] text-[hsl(228,10%,62%)] mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
