import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { AlertCircle, Bot, Loader2, RotateCcw, Send, ShieldAlert, Sparkles, UserRound } from 'lucide-react';
import { assistantApi } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  'Help me prepare for a conversation with my manager',
  'What should I include in a leave request?',
  'How can I set professional development goals?',
];

export function Assistant() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [statusError, setStatusError] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    assistantApi.getStatus()
      .then(({ enabled: isEnabled }) => setEnabled(isEnabled))
      .catch(() => setStatusError('Could not check AI assistant availability. Please refresh or contact your administrator.'));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedQuestion = question.trim();
    if (!submittedQuestion || loading || !enabled) return;

    setLoading(true);
    setError('');
    setQuestion('');
    setMessages((current) => [...current, { role: 'user', content: submittedQuestion }]);
    try {
      const { answer } = await assistantApi.ask(submittedQuestion);
      setMessages((current) => [...current, { role: 'assistant', content: answer }]);
    } catch (requestError: unknown) {
      const detail = isAxiosError<{ detail?: unknown }>(requestError)
        ? requestError.response?.data?.detail
        : undefined;
      setError(typeof detail === 'string' ? detail : 'The assistant could not answer right now. Please try again.');
      setQuestion(submittedQuestion);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const startOver = () => {
    setMessages([]);
    setError('');
    setQuestion('');
    inputRef.current?.focus();
  };

  return (
    <div className="assistant-page">
      <header className="assistant-heading">
        <div className="assistant-heading-icon"><Sparkles size={21} /></div>
        <div>
          <p className="assistant-eyebrow">EMPLOYEE SELF-SERVICE</p>
          <h1>HR assistant</h1>
          <p>Get a starting point for everyday workplace questions.</p>
        </div>
      </header>

      <section className="assistant-card surface" aria-label="HR assistant chat">
        <div className="assistant-card-header">
          <div className="assistant-card-title">
            <Bot size={18} />
            <span>Ask a question</span>
          </div>
          {messages.length > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={startOver} disabled={loading}>
              <RotateCcw size={14} />
              New conversation
            </button>
          )}
        </div>

        {statusError ? (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} />
            {statusError}
          </div>
        ) : enabled === null ? (
          <div className="assistant-status" role="status">
            <Loader2 size={16} className="animate-spin" />
            Checking assistant availability…
          </div>
        ) : !enabled ? (
          <div className="assistant-not-configured" role="status">
            <AlertCircle size={18} />
            <div>
              <strong>Assistant not configured</strong>
              <p>An administrator needs to configure the AI provider on the server before you can use this feature.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="assistant-messages" aria-live="polite" aria-relevant="additions text">
              {messages.length === 0 ? (
                <div className="assistant-welcome">
                  <div className="assistant-welcome-icon"><Sparkles size={20} /></div>
                  <h2>How can I help?</h2>
                  <p>Ask for general guidance about workplace conversations, leave requests, or professional development.</p>
                  <div className="assistant-suggestions">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="assistant-suggestion"
                        onClick={() => {
                          setQuestion(suggestion);
                          inputRef.current?.focus();
                        }}
                        disabled={loading}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <article className={`assistant-message assistant-message-${message.role}`} key={`${index}-${message.role}`}>
                    <span className="assistant-avatar" aria-hidden="true">
                      {message.role === 'assistant' ? <Bot size={16} /> : <UserRound size={16} />}
                    </span>
                    <div className="assistant-message-content">
                      <span className="assistant-message-label">{message.role === 'assistant' ? 'HR assistant' : 'You'}</span>
                      <p>{message.content}</p>
                    </div>
                  </article>
                ))
              )}
              {loading && (
                <div className="assistant-message assistant-message-assistant" role="status">
                  <span className="assistant-avatar" aria-hidden="true"><Bot size={16} /></span>
                  <div className="assistant-message-content">
                    <span className="assistant-message-label">HR assistant</span>
                    <p className="assistant-thinking"><Loader2 size={15} className="animate-spin" /> Thinking…</p>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {error && (
              <div className="alert alert-error assistant-error" role="alert">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form className="assistant-composer" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="assistant-question">Your question</label>
              <textarea
                ref={inputRef}
                id="assistant-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a general workplace question…"
                maxLength={1200}
                rows={2}
                disabled={loading}
              />
              <div className="assistant-composer-footer">
                <span>{question.length}/1200</span>
                <button type="submit" className="btn btn-primary btn-sm" disabled={!question.trim() || loading}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Send
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      <aside className="assistant-disclaimer">
        <ShieldAlert size={16} />
        <p>
          <strong>Protect your privacy.</strong> Each question is sent to your organization’s configured AI provider and is not saved by this portal.
          Do not include names, account details, health information, or other sensitive or identifying information.
          Responses are general guidance, may be inaccurate, and are not official company policy; check your handbook or contact HR.
        </p>
      </aside>
    </div>
  );
}
