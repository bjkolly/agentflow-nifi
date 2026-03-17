'use client';

import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

type FormData = {
  name: string;
  email: string;
  company: string;
  role: string;
  interest: string;
  message: string;
};

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const INTEREST_OPTIONS = [
  'Product Demo',
  'Technical Deep-Dive',
  'Partnership',
  'General Inquiry',
];

const inputClasses =
  'bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-llm focus:border-transparent w-full transition-colors';

/*
 * To receive form submissions via email, sign up at https://formspree.io
 * and replace the ID below with your own Formspree form ID.
 * Free tier: 50 submissions/month.
 */
const FORMSPREE_ID = 'myknjwaj';

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    role: '',
    interest: '',
    message: '',
  });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setErrorMessage('Name, email, and message are required.');
      return;
    }
    if (!emailRegex.test(formData.email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Something went wrong');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        role: '',
        interest: '',
        message: '',
      });
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to send message. Please try again.',
      );
    }
  }

  if (status === 'success') {
    return (
      <GlassCard className="p-8 md:p-10">
        <div className="text-center py-8">
          <div className="text-5xl mb-4">&#x2705;</div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">
            Message Sent
          </h3>
          <p className="text-text-muted mb-6">
            Thank you for reaching out. We&apos;ll be in touch shortly.
          </p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="text-llm hover:underline font-medium"
          >
            Send another message
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8 md:p-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-muted mb-2">
            Name <span className="text-guard">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            className={inputClasses}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-muted mb-2">
            Email <span className="text-guard">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="you@company.com"
            className={inputClasses}
          />
        </div>

        {/* Company & Role — side-by-side on larger screens */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-text-muted mb-2">
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Your company"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-text-muted mb-2">
              Role / Title
            </label>
            <input
              type="text"
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="Your role"
              className={inputClasses}
            />
          </div>
        </div>

        {/* Interest */}
        <div>
          <label htmlFor="interest" className="block text-sm font-medium text-text-muted mb-2">
            What are you interested in?
          </label>
          <select
            id="interest"
            name="interest"
            value={formData.interest}
            onChange={handleChange}
            className={`${inputClasses} appearance-none`}
          >
            <option value="" className="bg-surface">
              Select an option
            </option>
            {INTEREST_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-surface">
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-text-muted mb-2">
            Message <span className="text-guard">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us about your use case, requirements, or questions..."
            className={`${inputClasses} resize-vertical`}
          />
        </div>

        {/* Error message */}
        {status === 'error' && (
          <div className="bg-guard/10 border border-guard/30 rounded-lg px-4 py-3 text-guard text-sm">
            {errorMessage}
          </div>
        )}

        {/* Submit */}
        <Button
          variant="primary"
          type="submit"
          className={`w-full ${status === 'submitting' ? 'opacity-70 pointer-events-none' : ''}`}
        >
          {status === 'submitting' ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </GlassCard>
  );
}
