import { Router, type Response } from 'express';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import type { Conversation, UserState } from '@nexus/shared';
import { Store } from './store.js';
import { peers } from './catalog.js';

const fail = (status: number, message: string) => Object.assign(Error(message), { status });
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const safe = ({ inviteHash, ...room }: Conversation) => room;
const current = (res: Response) => res.locals.user as UserState;

export function chatRouter(store: Store) {
  const router = Router();
  const member = async (roomId: string, userId: string) => {
    const owner = await store.conversationOwner(roomId);
    const room = owner?.conversations?.find((c) => c.id === roomId);
    if (!room || !room.members.some((m) => m.id === userId))
      throw fail(404, 'Conversation not found');
    return { owner: owner!, room };
  };
  router.get('/', async (_req, res) => {
    const rooms = await store.conversationsFor(current(res).id);
    res.json({
      items: rooms
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map((c) => safe({ ...c, messages: c.messages.slice(-1) })),
    });
  });
  router.post('/', async (req, res) => {
    const { peerId } = z.object({ peerId: z.string().max(80) }).parse(req.body);
    const peer = peers.find((p) => p.id === peerId);
    if (!peer) throw fail(404, 'Peer not found');
    const user = current(res);
    const room = await store.mutate(user.id, (u) => {
      u.conversations ??= [];
      const existing = u.conversations.find((c) => c.peerId === peerId);
      if (existing) return existing;
      const now = new Date().toISOString();
      const created: Conversation = {
        id: randomUUID(),
        ownerId: u.id,
        peerId,
        title: `${peer.name} · learning exchange`,
        members: [{ id: u.id, name: u.name }],
        messages: [],
        inviteHash: '',
        createdAt: now,
        updatedAt: now,
      };
      u.conversations.push(created);
      return created;
    });
    res.status(201).json(safe(room));
  });
  router.get('/:id', async (req, res) => {
    const { room } = await member(String(req.params.id), current(res).id);
    const before = req.query.before ? z.string().datetime().parse(req.query.before) : undefined;
    const messages = before ? room.messages.filter((m) => m.sentAt < before) : room.messages;
    res.json({ ...safe(room), messages: messages.slice(-100), hasEarlier: messages.length > 100 });
  });
  router.post('/:id/invite', async (req, res) => {
    const { owner, room } = await member(String(req.params.id), current(res).id);
    if (owner.id !== current(res).id)
      throw fail(403, 'Only the conversation creator can invite a peer');
    if (room.members.length >= 2) throw fail(409, 'This conversation already has two participants');
    const token = randomBytes(24).toString('hex');
    await store.mutate(owner.id, (u) => {
      u.conversations!.find((c) => c.id === room.id)!.inviteHash = digest(token);
    });
    res.json({ roomId: room.id, token });
  });
  router.post('/:id/join', async (req, res) => {
    const { token } = z.object({ token: z.string().length(48) }).parse(req.body);
    const owner = await store.conversationOwner(String(req.params.id));
    if (!owner) throw fail(404, 'Invitation not found');
    const user = current(res);
    const room = await store.mutate(owner.id, (u) => {
      const c = u.conversations!.find((c) => c.id === req.params.id)!;
      if (c.members.some((m) => m.id === user.id)) return c;
      if (!c.inviteHash || c.inviteHash !== digest(token))
        throw fail(404, 'Invitation is invalid or already used');
      if (c.members.length >= 2) throw fail(409, 'This conversation is full');
      c.members.push({ id: user.id, name: user.name });
      c.inviteHash = '';
      c.updatedAt = new Date().toISOString();
      return c;
    });
    res.json(safe(room));
  });
  router.post(
    '/:id/messages',
    rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }),
    async (req, res) => {
      const body = z
        .object({ text: z.string().trim().min(1).max(2000), clientId: z.string().uuid() })
        .parse(req.body);
      const user = current(res);
      const { owner, room } = await member(String(req.params.id), user.id);
      const message = await store.mutate(owner.id, (u) => {
        const c = u.conversations!.find((c) => c.id === room.id)!;
        if (!c.members.some((m) => m.id === user.id)) throw fail(404, 'Conversation not found');
        const existing = c.messages.find(
          (m) => m.clientId === body.clientId && m.senderId === user.id,
        );
        if (existing) return existing;
        if (c.messages.length >= 1000)
          throw fail(409, 'This demo conversation has reached its 1,000-message limit');
        const sentAt = new Date().toISOString();
        const m = {
          id: randomUUID(),
          senderId: user.id,
          clientId: body.clientId,
          text: body.text,
          sentAt,
        };
        c.messages.push(m);
        c.updatedAt = sentAt;
        return m;
      });
      res.status(201).json(message);
    },
  );
  return router;
}
