import React, { useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useToast } from '../context/ToastContext'

export const CONTACT_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || ''

const TOPICS = [
  'Something looks wrong with a track',
  'Something is broken on the site',
  'Feature idea',
  'Just saying hi / other',
]

const EMPTY_FORM = { topic: TOPICS[0], name: '', email: '', message: '', botcheck: '' }

export function ContactModal({ isOpen, onClose }) {
  const showToast = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleClose = () => {
    onClose()
    // Reset after the modal is gone so the user doesn't watch the form wipe itself.
    setTimeout(() => {
      setForm(EMPTY_FORM)
      setStatus('idle')
      setError('')
    }, 200)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'sending') return

    // Honeypot: real people never fill this in.
    if (form.botcheck) {
      setStatus('sent')
      return
    }

    setStatus('sending')
    setError('')

    try {
      // FormData (not JSON) keeps this a simple request, so there's no CORS
      // preflight for Web3Forms' Cloudflare layer to reject.
      const payload = new FormData()
      payload.append('access_key', CONTACT_ACCESS_KEY)
      payload.append('subject', `Pump Playlist Builder: ${form.topic}`)
      payload.append('from_name', 'Pump Playlist Builder')
      payload.append('name', form.name.trim() || 'Anonymous')
      payload.append('email', form.email.trim())
      payload.append('topic', form.topic)
      payload.append('message', form.message.trim())

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: payload,
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Message could not be sent.')
      }

      setStatus('sent')
      showToast('Message sent', 'Thanks!')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  const canSubmit = form.email.trim() && form.message.trim() && status !== 'sending'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Questions? Contact me" size="md">
      {status === 'sent' ? (
        <div className="text-center py-4">
          <p className="display-md text-base text-ink-950 dark:text-paper mb-2">Message sent</p>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-5">
            Thanks for reaching out — I'll get back to you at{' '}
            <span className="text-ink-900 dark:text-ink-100">{form.email.trim()}</span>.
          </p>
          <Button variant="primary" onClick={handleClose}>Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            Spotted a track that looks off, hit a bug, or have an idea? Send it over.
          </p>

          <div>
            <label htmlFor="contact-topic" className="eyebrow block mb-1.5">What's this about?</label>
            <select
              id="contact-topic"
              value={form.topic}
              onChange={setField('topic')}
              className="select-field"
            >
              {TOPICS.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="eyebrow block mb-1.5">Name (optional)</label>
              <input
                id="contact-name"
                type="text"
                value={form.name}
                onChange={setField('name')}
                className="input-field"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="eyebrow block mb-1.5">Your email</label>
              <input
                id="contact-email"
                type="email"
                required
                value={form.email}
                onChange={setField('email')}
                className="input-field"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-message" className="eyebrow block mb-1.5">Message</label>
            <textarea
              id="contact-message"
              required
              rows={5}
              value={form.message}
              onChange={setField('message')}
              className="input-field resize-y"
              placeholder="Tell me what's up..."
            />
          </div>

          <input
            type="text"
            name="botcheck"
            value={form.botcheck}
            onChange={setField('botcheck')}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {status === 'error' && (
            <p role="alert" className="text-sm text-flare-600 dark:text-flare-400">
              {error} You can also email me directly at{' '}
              <a href="https://jessicamisener.com/contact" target="_blank" rel="noopener noreferrer" className="underline">
                jessicamisener.com/contact
              </a>.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!canSubmit}>
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
