import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import mongoose from 'mongoose';
import type { UserState, AdminUser, AdminOverview } from '@nexus/shared';
import { UserModel, OpportunityModel, PeerModel } from './models.js';
import { opportunities, peers } from './catalog.js';
export class Store {
  private users: Record<string, UserState> = {};
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    public mode = 'memory',
    private file = resolve('data/nexus.json'),
  ) {}
  async init(uri?: string) {
    if (this.mode === 'mongo') {
      if (!uri) throw Error('MONGODB_URI is required');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      await UserModel.init();
      await this.seedCatalog();
    } else if (this.mode === 'file') {
      try {
        this.users = JSON.parse(await readFile(this.file, 'utf8'));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }
    }
  }
  async seedCatalog() {
    if (this.mode === 'mongo') {
      await OpportunityModel.bulkWrite(
        opportunities.map((o) => ({
          updateOne: { filter: { id: o.id }, update: { $set: o }, upsert: true },
        })),
      );
      await PeerModel.bulkWrite(
        peers.map((p) => ({
          updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true },
        })),
      );
    }
  }
  async get(id: string): Promise<UserState | undefined> {
    if (this.mode === 'mongo') {
      const d = await UserModel.findOne({ id }).lean();
      if (!d) return;
      const { _id, ...rest } = d;
      return JSON.parse(JSON.stringify(rest));
    }
    return this.users[id] ? structuredClone(this.users[id]) : undefined;
  }
  async byEmail(email: string): Promise<UserState | undefined> {
    if (this.mode === 'mongo') {
      const d = await UserModel.findOne({ email }).lean();
      return d ? this.get(d.id) : undefined;
    }
    return structuredClone(Object.values(this.users).find((u) => u.email === email));
  }
  private exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const task = this.queue.then(fn, fn);
    this.queue = task.catch(() => {});
    return task;
  }
  private async persist(next: Record<string, UserState>) {
    if (this.mode === 'file') {
      await mkdir(dirname(this.file), { recursive: true });
      await writeFile(this.file + '.tmp', JSON.stringify(next, null, 2));
      await rename(this.file + '.tmp', this.file);
    }
    this.users = next;
  }
  async create(user: UserState) {
    if (this.mode === 'mongo') {
      await UserModel.create(user);
      return;
    }
    await this.exclusive(async () => {
      if (Object.values(this.users).some((u) => u.email === user.email))
        throw Object.assign(Error('Email already registered'), { status: 409 });
      await this.persist({ ...this.users, [user.id]: structuredClone(user) });
    });
  }
  async mutate<T>(id: string, fn: (u: UserState) => T): Promise<T> {
    if (this.mode === 'mongo') {
      for (let i = 0; i < 5; i++) {
        const user = await this.get(id);
        if (!user) throw Object.assign(Error('User not found'), { status: 404 });
        const rev = user.revision;
        const result = fn(user);
        user.revision++;
        const update = await UserModel.updateOne(
          { id, revision: rev },
          { $set: user },
          { runValidators: true },
        );
        if (update.modifiedCount) return result;
      }
      throw Object.assign(Error('Concurrent update; retry your request'), { status: 409 });
    }
    return this.exclusive(async () => {
      const user = await this.get(id);
      if (!user) throw Object.assign(Error('User not found'), { status: 404 });
      const result = fn(user);
      user.revision++;
      await this.persist({ ...this.users, [id]: user });
      return result;
    });
  }
  async adminOverview(query: {
    page: number;
    search: string;
    type: string;
  }): Promise<AdminOverview> {
    const pageSize = 20,
      skip = (query.page - 1) * pageSize;
    const projection = {
      _id: 0,
      id: 1,
      name: 1,
      email: 1,
      campus: 1,
      demo: { $regexMatch: { input: '$email', regex: '@demo\\.nexus\\.local$' } },
      skills: {
        $size: { $filter: { input: '$skills', as: 's', cond: { $gt: ['$$s.score', 0] } } },
      },
      proofs: {
        $size: { $filter: { input: '$evidence', as: 'e', cond: { $eq: ['$$e.verified', true] } } },
      },
      sessions: {
        $size: {
          $filter: { input: '$sessions', as: 's', cond: { $eq: ['$$s.status', 'completed'] } },
        },
      },
      credits: { $sum: '$ledger.amount' },
      challenges: { $size: '$completedChallenges' },
      premiumPreview: { $eq: ['$learningPremium.source', 'sandbox'] },
      sandboxSettled: {
        $size: {
          $filter: {
            input: '$payments',
            as: 'p',
            cond: { $and: [{ $eq: ['$$p.mode', 'sandbox'] }, { $eq: ['$$p.status', 'settled'] }] },
          },
        },
      },
    };
    let users: AdminUser[], total: number, summary: AdminOverview['summary'];
    if (this.mode === 'mongo') {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = {
        ...(query.type === 'all' ? {} : { demo: query.type === 'demo' }),
        ...(escaped
          ? {
              $or: [
                { name: { $regex: escaped, $options: 'i' } },
                { email: { $regex: escaped, $options: 'i' } },
              ],
            }
          : {}),
      };
      const [result] = await UserModel.aggregate([
        { $project: projection },
        {
          $facet: {
            users: [
              { $match: match },
              { $sort: { name: 1, id: 1 } },
              { $skip: skip },
              { $limit: pageSize },
            ],
            total: [{ $match: match }, { $count: 'count' }],
            summary: [
              {
                $group: {
                  _id: null,
                  registered: { $sum: { $cond: ['$demo', 0, 1] } },
                  demos: { $sum: { $cond: ['$demo', 1, 0] } },
                  premiumPreviews: { $sum: { $cond: ['$premiumPreview', 1, 0] } },
                  sandboxSettled: { $sum: '$sandboxSettled' },
                },
              },
            ],
          },
        },
      ]);
      users = result.users;
      total = result.total[0]?.count ?? 0;
      const s = result.summary[0];
      summary = {
        registered: s?.registered ?? 0,
        demos: s?.demos ?? 0,
        premiumPreviews: s?.premiumPreviews ?? 0,
        sandboxSettled: s?.sandboxSettled ?? 0,
      };
    } else {
      const rows: AdminUser[] = Object.values(this.users).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        campus: u.campus,
        demo: u.email.endsWith('@demo.nexus.local'),
        skills: u.skills.filter((s) => s.score > 0).length,
        proofs: u.evidence.filter((e) => e.verified).length,
        sessions: u.sessions.filter((s) => s.status === 'completed').length,
        credits: u.ledger.reduce((s, e) => s + e.amount, 0),
        challenges: u.completedChallenges.length,
        premiumPreview: u.learningPremium?.source === 'sandbox',
        sandboxSettled: u.payments.filter((p) => p.mode === 'sandbox' && p.status === 'settled')
          .length,
      }));
      summary = {
        registered: rows.filter((u) => !u.demo).length,
        demos: rows.filter((u) => u.demo).length,
        premiumPreviews: rows.filter((u) => u.premiumPreview).length,
        sandboxSettled: rows.reduce((s, u) => s + u.sandboxSettled, 0),
      };
      const filtered = rows
        .filter(
          (u) =>
            (query.type === 'all' || u.demo === (query.type === 'demo')) &&
            (u.name + ' ' + u.email).toLowerCase().includes(query.search.toLowerCase()),
        )
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
      total = filtered.length;
      users = filtered.slice(skip, skip + pageSize);
    }
    return {
      users,
      total,
      page: query.page,
      pageSize,
      summary,
      revenue: {
        amount: null,
        explanation:
          'Live revenue is not tracked yet. Current premium payments use sandbox or Testnet assets. Neither these payments nor SkillCredits represent real revenue.',
      },
    };
  }
  async close() {
    if (this.mode === 'mongo') await mongoose.disconnect();
  }
  async conversationOwner(roomId: string): Promise<UserState | undefined> {
    if (this.mode === 'mongo') {
      const owner = await UserModel.findOne({ 'conversations.id': roomId }).select('id').lean();
      return owner ? this.get(owner.id) : undefined;
    }
    return structuredClone(
      Object.values(this.users).find((u) => u.conversations?.some((c) => c.id === roomId)),
    );
  }
  async conversationsFor(userId: string) {
    const users: UserState[] =
      this.mode === 'mongo'
        ? JSON.parse(
            JSON.stringify(
              await UserModel.find({ 'conversations.members.id': userId })
                .select('conversations')
                .lean(),
            ),
          )
        : Object.values(this.users);
    return structuredClone(
      users
        .flatMap((u) => u.conversations ?? [])
        .filter((c) => c.members.some((m) => m.id === userId)),
    );
  }
}
