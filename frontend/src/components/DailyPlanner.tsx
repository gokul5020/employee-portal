import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, Copy, Check, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export const DailyPlanner: React.FC<{ user: any }> = ({ user }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newText, setNewText] = useState('');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const storageKey = `ep_planner_tasks_${user?.id || 'guest'}`;

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setTasks(JSON.parse(saved));
      } else {
        // Initial defaults for demo
        setTasks([
          { id: '1', text: 'Review team leave requests for next sprint', completed: true },
          { id: '2', text: 'Confirm direct deposit account changes with payroll', completed: false },
          { id: '3', text: 'Prepare notes for weekly engineering standup', completed: false },
        ]);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Save to localStorage
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newTasks));
    } catch {
      // ignore
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newText.trim(),
      completed: false,
    };
    saveTasks([...tasks, newTask]);
    setNewText('');
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleCopyStandup = () => {
    if (tasks.length === 0) {
      showToast('No tasks to copy. Add some tasks first!', 'info');
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const lines = [
      `🎯 *Daily Standup — ${user?.full_name || 'Alex Johnson'}* (${todayStr})`,
      '',
      '*Today’s Completed:*',
      ...tasks.filter((t) => t.completed).map((t) => `• :white_check_mark: ${t.text}`),
      ...(completedCount === 0 ? ['• (None yet)'] : []),
      '',
      '*In Progress / Planned:*',
      ...tasks.filter((t) => !t.completed).map((t) => `• :hourglass_flowing_sand: ${t.text}`),
      ...(tasks.length === completedCount ? ['• :tada: All planned items finished!'] : []),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    showToast('Copied formatted standup summary to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="surface" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'var(--brand-subtle)',
              color: 'var(--color-brand-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Today's Priorities & Standup
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              {completedCount} of {tasks.length} items completed ({progressPercent}%)
            </p>
          </div>
        </div>

        {/* Copy for Slack/Teams */}
        <button
          type="button"
          onClick={handleCopyStandup}
          className="btn btn-secondary btn-sm"
          title="Copy formatted standup for Slack / Microsoft Teams"
        >
          {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy Standup'}</span>
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 6,
          backgroundColor: 'var(--bg-surface-raised)',
          borderRadius: 999,
          overflow: 'hidden',
          marginBottom: 16,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            backgroundColor: progressPercent === 100 ? '#10b981' : 'var(--color-brand-500)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Task input form */}
      <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          className="field-input"
          placeholder="Add a priority for today..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          style={{ padding: '8px 12px', fontSize: '0.8125rem' }}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={!newText.trim()}>
          <Plus size={16} />
          <span>Add</span>
        </button>
      </form>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '240px', overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            No priorities added for today yet.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 6,
                backgroundColor: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                onClick={() => toggleTask(task.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  flex: 1,
                  userSelect: 'none',
                }}
              >
                {task.completed ? (
                  <CheckSquare size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                ) : (
                  <Square size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}
                >
                  {task.text}
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                aria-label="Delete task"
                className="btn-ghost"
                style={{
                  padding: 4,
                  color: 'var(--text-muted)',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
