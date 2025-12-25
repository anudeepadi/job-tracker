'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight } from 'lucide-react'

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void
}

const SUGGESTED_PROMPTS = [
  {
    text: 'Find me remote React developer jobs',
    category: 'Tech'
  },
  {
    text: 'Data scientist positions in San Francisco, 15 results',
    category: 'Data'
  },
  {
    text: 'Machine learning engineer roles in Austin, TX',
    category: 'ML/AI'
  },
  {
    text: 'Product manager jobs in New York City',
    category: 'Product'
  },
  {
    text: 'Senior software engineer positions in Seattle',
    category: 'Tech'
  },
  {
    text: 'Entry level AI researcher roles, remote preferred',
    category: 'ML/AI'
  }
]

export function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">AI Job Finder</h2>
        <p className="text-muted-foreground max-w-md">
          Describe what kind of job you&apos;re looking for in natural language.
          I&apos;ll understand and search across multiple job boards for you.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">
          Try one of these examples:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-between text-left h-auto py-3 px-4 hover:border-primary/50 group"
              onClick={() => onSelectPrompt(prompt.text)}
            >
              <span className="text-sm truncate mr-2">{prompt.text}</span>
              <ArrowRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8 text-xs text-muted-foreground">
        <p>Powered by Gemini AI + CrewAI agents</p>
      </div>
    </div>
  )
}
