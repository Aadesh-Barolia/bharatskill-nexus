import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  MessageCircle,
  Plus,
  Send,
  Users,
  ArrowLeft,
} from 'lucide-react';
import type { ChatRoom, ChatMessage } from '@nexus/shared';
import { api, post } from './api';
type Room = ChatRoom & { hasEarlier?: boolean };
export default function Chat({
  userId,
  initialPeer,
  onFindPeers,
}: {
  userId: string;
  initialPeer: string | null;
  onFindPeers: () => void;
}) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]),
    [room, setRoom] = useState<Room | null>(null),
    [selected, setSelected] = useState(''),
    [draft, setDraft] = useState(''),
    [error, setError] = useState(''),
    [sending, setSending] = useState(false),
    [loading, setLoading] = useState(true),
    [invite, setInvite] = useState(''),
    [copied, setCopied] = useState(false);
  const [invitation, setInvitation] = useState(() => {
    const p = new URLSearchParams(location.hash.slice(1));
    return p.get('chat') && p.get('invite')
      ? { roomId: p.get('chat')!, token: p.get('invite')! }
      : null;
  });
  const [joining, setJoining] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const pending = useRef<{ text: string; clientId: string } | null>(null);
  const selection = useRef(selected);
  selection.current = selected;
  const list = useCallback(async () => {
    const r = await api<{ items: ChatRoom[] }>('/chats');
    setRooms(r.items);
    return r.items;
  }, []);
  useEffect(() => {
    let live = true;
    async function start() {
      try {
        const items = await list();
        if (!live) return;
        if (initialPeer) {
          const c = await post<ChatRoom>('/chats', { peerId: initialPeer });
          if (live) {
            setSelected(c.id);
            setRoom(c);
            await list();
          }
        } else if (items.length && !invitation) setSelected(items[0].id);
      } catch (e) {
        if (live) setError((e as Error).message);
      } finally {
        if (live) setLoading(false);
      }
    }
    void start();
    return () => {
      live = false;
    };
  }, [initialPeer, list]);
  useEffect(() => {
    if (!selected) {
      setRoom(null);
      return;
    }
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    setInvite('');
    setDraft('');
    pending.current = null;
    const poll = async () => {
      try {
        if (document.visibilityState === 'visible') {
          const r = await api<Room>(`/chats/${selected}`);
          if (live) {
            setRoom(r);
            setError('');
            await list();
          }
        }
      } catch (e) {
        if (live) setError((e as Error).message);
      } finally {
        if (live) timer = setTimeout(poll, 3000);
      }
    };
    void poll();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [selected, list]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  }, [room?.messages.at(-1)?.id, selected]);
  const peer = room?.members.find((m) => m.id !== userId);
  async function send() {
    if (!draft.trim() || sending || !selected) return;
    const id = selected;
    setSending(true);
    setError('');
    pending.current =
      pending.current?.text === draft
        ? pending.current
        : { text: draft, clientId: crypto.randomUUID() };
    const submitted = pending.current;
    try {
      await post(`/chats/${id}/messages`, submitted);
      if (selection.current === id) {
        setDraft((current) => (current === submitted.text ? '' : current));
        pending.current = null;
        const updated = await api<Room>(`/chats/${id}`);
        if (selection.current === id) setRoom(updated);
        await list();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }
  async function invitePeer() {
    setError('');
    try {
      const r = await post<{ roomId: string; token: string }>(`/chats/${selected}/invite`);
      setInvite(`${location.origin}/#chat=${r.roomId}&invite=${r.token}`);
      setCopied(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="chat-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR PEOPLE, ONE CONVERSATION CLOSER</span>
          <h1>Say hello. Build something.</h1>
          <p>Ask a question, plan a session, or share that thing you just figured out.</p>
        </div>
      </div>
      {invitation && (
        <div className="chat-invitation">
          <Users size={24} />
          <div>
            <h3>You’ve been invited to a learning exchange.</h3>
            <p>Join with your signed-in profile to start talking.</p>
          </div>
          <button
            className="primary"
            disabled={joining}
            onClick={async () => {
              setJoining(true);
              try {
                const c = await post<ChatRoom>(`/chats/${invitation.roomId}/join`, {
                  token: invitation.token,
                });
                setSelected(c.id);
                setRoom(c);
                setInvitation(null);
                history.replaceState(null, '', location.pathname);
                await list();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setJoining(false);
              }
            }}
          >
            Join conversation
            <ArrowUpRight size={17} />
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="alert error">
          {error}
        </div>
      )}
      <div className={`chat-layout ${selected ? 'has-selection' : ''}`}>
        <aside className="conversation-list">
          <div className="conversation-list-heading">
            <h2>Your conversations</h2>
            <button
              className="icon-button"
              onClick={onFindPeers}
              aria-label="Start a peer conversation"
            >
              <Plus size={19} />
            </button>
          </div>
          <div className="conversation-items" data-lenis-prevent>
            {loading ? (
              <p className="chat-hint">Loading your conversations…</p>
            ) : rooms.length ? (
              rooms.map((c) => {
                const other = c.members.find((m) => m.id !== userId);
                const name = other?.name ?? c.title.split(' · ')[0];
                return (
                  <button
                    key={c.id}
                    className={`conversation-item ${selected === c.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelected(c.id);
                      setRoom(null);
                    }}
                  >
                    <span className="chat-avatar">
                      {name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                    <div>
                      <strong>{name}</strong>
                      <span>{c.messages.at(-1)?.text ?? 'A good place to say hello.'}</span>
                      <small>
                        {other ? 'Peer conversation' : 'Demo peer · invite a participant'}
                      </small>
                    </div>
                    <ArrowUpRight size={15} />
                  </button>
                );
              })
            ) : (
              <div className="chat-list-empty">
                <MessageCircle size={25} />
                <p>Your first hello goes here.</p>
                <button className="text-button" onClick={onFindPeers}>
                  Find a peer
                  <ArrowUpRight size={15} />
                </button>
              </div>
            )}
          </div>
          <div className="chat-list-note">
            <span className="status-dot" />
            Made for a little give-and-take.
          </div>
        </aside>
        <div className="conversation-main">
          {room ? (
            <>
              <header className="conversation-header">
                <button
                  className="chat-back icon-button"
                  onClick={() => setSelected('')}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={20} />
                </button>
                <span className="chat-avatar">{(peer?.name ?? room.title).slice(0, 1)}</span>
                <div>
                  <h2>{peer?.name ?? room.title.split(' · ')[0]}</h2>
                  <p>
                    {peer
                      ? 'Learning exchange · updates every few seconds'
                      : 'Demo peer profile · no connected participant yet'}
                  </p>
                </div>
                {!peer && room.ownerId === userId && (
                  <button className="secondary" onClick={invitePeer}>
                    Invite a peer
                    <Plus size={15} />
                  </button>
                )}
              </header>
              {invite && !peer && (
                <div className="invite-box">
                  <div>
                    <strong>Bring someone into the conversation.</strong>
                    <p>
                      Open this link in a second signed-in browser to try two-way chat. It works
                      once.
                    </p>
                  </div>
                  <label>
                    Invitation link
                    <input
                      aria-label="Invitation link"
                      value={invite}
                      readOnly
                      onFocus={(e) => e.target.select()}
                    />
                  </label>
                  <button
                    className="secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(invite);
                        setCopied(true);
                      } catch {
                        setError('Select the invitation link and copy it manually.');
                      }
                    }}
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}{' '}
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              )}
              <div
                className="message-list"
                data-lenis-prevent
                role="log"
                aria-label="Conversation messages"
                aria-live="polite"
              >
                {room.hasEarlier && (
                  <p className="message-history-note">Showing the latest 100 messages.</p>
                )}
                {!room.messages.length && (
                  <div className="chat-welcome">
                    <span>✳</span>
                    <h3>
                      Small hello.
                      <br />
                      Big possibilities.
                    </h3>
                    <p>
                      {peer
                        ? 'Your conversation starts here.'
                        : 'Invite a real participant to talk. Demo profiles do not send automated replies.'}
                    </p>
                  </div>
                )}
                {room.messages.map((m: ChatMessage) => {
                  const mine = m.senderId === userId;
                  const author = room.members.find((p) => p.id === m.senderId)?.name ?? 'Peer';
                  return (
                    <div key={m.id} className={`message ${mine ? 'mine' : ''}`}>
                      <span className="message-author">{mine ? 'You' : author}</span>
                      <p>{m.text}</p>
                      <time dateTime={m.sentAt}>
                        {new Date(m.sentAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {mine && <Check size={11} />}
                      </time>
                    </div>
                  );
                })}
                <div ref={bottom} />
              </div>
              <form
                className="message-composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <label className="sr-only" htmlFor="chat-message">
                  Your message
                </label>
                <textarea
                  id="chat-message"
                  placeholder="A question. An idea. A hello…"
                  maxLength={2000}
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                />
                <button
                  className="primary"
                  type="submit"
                  disabled={!draft.trim() || sending}
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
                <small>ENTER TO SEND · SHIFT + ENTER FOR A NEW LINE</small>
                <small>{draft.length}/2000</small>
              </form>
            </>
          ) : (
            <div className="chat-welcome no-room">
              <span>↗</span>
              <h2>
                Good things start
                <br />
                with a conversation.
              </h2>
              <p>Choose a conversation or meet someone through NexusMatch.</p>
              <button className="primary" onClick={onFindPeers}>
                Meet your people
                <ArrowUpRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
