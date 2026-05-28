'use client'

import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'

import { ChatStore } from '@/app-store/stores/ChatStore'
import { ChatMessage } from '@/entities/ai/model/types'
import { Button } from '@/shared/ui/Button'
import { AiResponseView } from '@/widgets/AiResponseView'

import s from './AssistantChatPanel.module.scss'

export type AssistantChatPanelVariant = 'full' | 'compact'

interface AssistantChatPanelProps {
  store: ChatStore
  variant?: AssistantChatPanelVariant
  emptyHint?: string
  suggestedQuestions?: string[]
  placeholder?: string
}

const DEFAULT_EMPTY_HINT = 'Спросите AI о состоянии команды, перегрузке или актуальности графиков.'
const DEFAULT_PLACEHOLDER = 'Спросите что-нибудь… (Ctrl+Enter — отправить)'

export const AssistantChatPanel = observer(function AssistantChatPanel({
  store,
  variant = 'full',
  emptyHint = DEFAULT_EMPTY_HINT,
  suggestedQuestions,
  placeholder = DEFAULT_PLACEHOLDER,
}: AssistantChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isCompact = variant === 'compact'

  const messages = store.messages.value
  const isLoading = store.askStage.isLoading

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = (): void => {
    void store.send()
  }

  const handleSuggested = (question: string): void => {
    store.input.change(question)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`${s.root} ${isCompact ? s.compact : s.full}`}>
      <div className={`${s.messages} ${isCompact ? s.messagesCompact : s.messagesFull}`}>
        {messages.length === 0 && (
          <div className={`${s.emptyState} ${isCompact ? s.emptyStateCompact : ''}`}>
            <p className={s.emptyHint}>{emptyHint}</p>
            {suggestedQuestions && suggestedQuestions.length > 0 && (
              <ul className={s.suggestions}>
                {suggestedQuestions.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      className={s.suggestion}
                      onClick={() => handleSuggested(q)}
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && !hasStreamingPlaceholder(messages) && (
          <div className={s.thinking}>
            <span className={s.dot} />
            <span className={s.dot} />
            <span className={s.dot} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={s.inputRow}>
        <textarea
          className={`${s.textarea} ${isCompact ? s.textareaCompact : ''}`}
          placeholder={placeholder}
          value={store.input.value}
          onChange={(e) => store.input.change(e.target.value)}
          onKeyDown={onKeyDown}
          rows={isCompact ? 2 : 3}
          disabled={isLoading}
        />
        <Button
          variant="primary"
          size={isCompact ? 'sm' : 'md'}
          onClick={handleSend}
          disabled={isLoading || !store.input.value.trim()}
        >
          {isLoading ? 'Думаю…' : 'Спросить'}
        </Button>
      </div>
    </div>
  )
})

function hasStreamingPlaceholder(messages: ChatMessage[]): boolean {
  const last = messages[messages.length - 1]
  return Boolean(last && last.role === 'assistant' && last.streamingText !== undefined)
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className={`${s.bubble} ${s.bubbleUser}`}>
        <div className={s.bubbleText}>{message.text}</div>
      </div>
    )
  }
  if (message.role === 'error') {
    return (
      <div className={`${s.bubble} ${s.bubbleError}`}>
        <div className={s.bubbleText}>{message.text}</div>
      </div>
    )
  }
  return (
    <div className={`${s.bubble} ${s.bubbleAssistant}`}>
      {message.payload ? (
        <AiResponseView
          summary={message.payload.summary}
          answer={message.payload.answer}
          reasons={message.payload.reasons}
          recommendedActions={message.payload.recommendedActions}
          missingData={message.payload.missingData}
          usedContext={message.payload.usedContext}
        />
      ) : message.streamingText !== undefined ? (
        <div className={s.bubbleText}>
          {message.streamingText}
          <span className={s.cursor} aria-hidden="true" />
        </div>
      ) : (
        <div className={s.bubbleText}>{message.text}</div>
      )}
    </div>
  )
}
