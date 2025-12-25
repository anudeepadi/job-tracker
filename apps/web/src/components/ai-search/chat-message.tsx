'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { User, Sparkles, Loader2, AlertCircle, MapPin, Briefcase, Hash } from 'lucide-react'
import { ChatMessage as ChatMessageType, JobResult } from '@/lib/types'
import { JobResultsCard } from './job-results-card'

interface ChatMessageProps {
  message: ChatMessageType
  onImportJob?: (job: JobResult) => Promise<void>
  importingJobs?: Set<string>
}

export function ChatMessage({ message, onImportJob, importingJobs }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-2 max-w-[85%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Text Content */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : message.error ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{message.error}</span>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Parsed Parameters (for assistant messages) */}
        {isAssistant && message.parsedParams && !message.isLoading && (
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant="secondary" className="text-xs gap-1">
              <Briefcase className="h-3 w-3" />
              {message.parsedParams.jobRole}
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              <MapPin className="h-3 w-3" />
              {message.parsedParams.location}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <Hash className="h-3 w-3" />
              {message.parsedParams.numResults} results
            </Badge>
            {message.parsedParams.additionalPreferences?.map((pref, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {pref}
              </Badge>
            ))}
          </div>
        )}

        {/* Job Results */}
        {isAssistant && message.jobResults && message.jobResults.length > 0 && (
          <div className="w-full mt-2">
            <JobResultsCard
              jobs={message.jobResults}
              onImportJob={onImportJob}
              importingJobs={importingJobs}
            />
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  )
}
