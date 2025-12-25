'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { ChatInput } from './chat-input'
import { ChatMessage } from './chat-message'
import { SuggestedPrompts } from './suggested-prompts'
import {
  ChatMessage as ChatMessageType,
  JobResult,
  GeminiParseResponse,
  JobSearchResponse
} from '@/lib/types'

export function AIJobFinder() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [importingJobs, setImportingJobs] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessageId = generateId()
    const assistantMessageId = generateId()

    // Add user message
    const userMessage: ChatMessageType = {
      id: userMessageId,
      role: 'user',
      content,
      timestamp: new Date()
    }

    // Add loading assistant message
    const loadingMessage: ChatMessageType = {
      id: assistantMessageId,
      role: 'assistant',
      content: 'Understanding your request...',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, loadingMessage])
    setIsLoading(true)

    try {
      // Step 1: Parse the query with Gemini
      const parseResponse = await fetch('/api/ai-search/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: content })
      })

      const parseData: GeminiParseResponse = await parseResponse.json()

      if (!parseData.success || !parseData.parsedParams) {
        // Update with error
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: parseData.error || 'I couldn\'t understand your request. Please try being more specific about the job role and location.',
                  isLoading: false,
                  error: parseData.error
                }
              : msg
          )
        )
        setIsLoading(false)
        return
      }

      // Update message with parsed params
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: parseData.interpretation || `Searching for ${parseData.parsedParams!.numResults} "${parseData.parsedParams!.jobRole}" positions in ${parseData.parsedParams!.location}...`,
                parsedParams: parseData.parsedParams,
                isLoading: true
              }
            : msg
        )
      )

      // Step 2: Search for jobs
      const searchResponse = await fetch('/api/job-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_role: parseData.parsedParams.jobRole,
          location: parseData.parsedParams.location,
          num_results: parseData.parsedParams.numResults
        })
      })

      const searchData: JobSearchResponse = await searchResponse.json()

      if (searchData.status === 'error' || !searchResponse.ok) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `I found your search parameters, but encountered an error while searching: ${searchData.error || 'Unable to connect to job search service'}`,
                  isLoading: false,
                  error: searchData.error
                }
              : msg
          )
        )
        setIsLoading(false)
        return
      }

      // Success - update with results
      const resultsCount = searchData.results?.length || 0
      const resultsMessage = resultsCount > 0
        ? `Found ${resultsCount} job${resultsCount > 1 ? 's' : ''} matching your criteria! Here are the results:`
        : 'I searched but couldn\'t find any jobs matching your criteria. Try broadening your search or using different keywords.'

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: resultsMessage,
                jobResults: searchData.results || [],
                isLoading: false
              }
            : msg
        )
      )

      if (resultsCount > 0) {
        toast.success(`Found ${resultsCount} job listings!`)
      } else {
        toast.info('No jobs found matching your criteria')
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, something went wrong. Please try again.',
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : msg
        )
      )
      toast.error('Failed to process your request')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleImportJob = useCallback(async (job: JobResult) => {
    const jobKey = `${job.company}-${job.title}-${job.url}`
    setImportingJobs(prev => new Set(prev).add(jobKey))

    try {
      // Parse salary range
      let salaryMin: number | null = null
      let salaryMax: number | null = null

      if (job.salary_range) {
        const salaryMatch = job.salary_range.match(/(\d+)k?\s*-\s*(\d+)k?/i)
        if (salaryMatch) {
          salaryMin = parseInt(salaryMatch[1]) * (job.salary_range.toLowerCase().includes('k') ? 1000 : 1)
          salaryMax = parseInt(salaryMatch[2]) * (job.salary_range.toLowerCase().includes('k') ? 1000 : 1)
        }
      }

      // Determine location type
      const locationLower = job.location?.toLowerCase() || ''
      let locationType = 'Onsite'
      if (locationLower.includes('remote')) {
        locationType = 'Remote'
      } else if (locationLower.includes('hybrid')) {
        locationType = 'Hybrid'
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: job.company,
          jobTitle: job.title,
          jobUrl: job.url,
          location: job.location,
          locationType,
          salaryMin,
          salaryMax,
          currency: 'USD',
          status: 'Saved',
          priority: 'Medium',
          source: 'AI Search',
          appliedDate: new Date().toISOString(),
          notes: job.description ? `${job.description}\n\nSource: ${job.source}` : `Source: ${job.source}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to import job')
      }

      toast.success(`Imported "${job.title}" at ${job.company}`)
    } catch (error) {
      console.error('Failed to import job:', error)
      toast.error('Failed to import job to tracker')
    } finally {
      setImportingJobs(prev => {
        const next = new Set(prev)
        next.delete(jobKey)
        return next
      })
    }
  }, [])

  const handleClearChat = useCallback(() => {
    setMessages([])
    toast.info('Chat cleared')
  }, [])

  const handleSelectPrompt = useCallback((prompt: string) => {
    handleSendMessage(prompt)
  }, [handleSendMessage])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-bold text-lg">AI Job Finder</h1>
            <p className="text-xs text-muted-foreground">
              Describe the job you want, I&apos;ll find it for you
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <SuggestedPrompts onSelectPrompt={handleSelectPrompt} />
        ) : (
          <div className="pb-4">
            {messages.map(message => (
              <ChatMessage
                key={message.id}
                message={message}
                onImportJob={handleImportJob}
                importingJobs={importingJobs}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput
        onSubmit={handleSendMessage}
        isLoading={isLoading}
        placeholder="e.g., Find me 10 remote React developer jobs..."
      />
    </div>
  )
}
