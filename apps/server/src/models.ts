import mongoose, { Schema } from 'mongoose';
import type { Opportunity, Peer } from '@nexus/shared';
const bounded = { type: Number, min: 0, max: 100, required: true };
const skill = new Schema(
  {
    id: { type: String, required: true },
    name: String,
    score: bounded,
    confidence: { type: Number, min: 0, max: 1 },
    evidence: [String],
    related: [String],
  },
  { _id: false },
);
const ledger = new Schema(
  {
    id: { type: String, required: true },
    amount: { type: Number, required: true },
    reason: String,
    reference: { type: String, required: true },
    createdAt: Date,
  },
  { _id: false },
);
const session = new Schema(
  {
    id: String,
    peerId: String,
    skillId: String,
    status: { type: String, enum: ['booked', 'completed'] },
    createdAt: Date,
    completedAt: Date,
  },
  { _id: false },
);
const payment = new Schema(
  {
    id: String,
    mode: { type: String, enum: ['sandbox', 'testnet'] },
    status: { type: String, enum: ['required', 'settled'] },
    createdAt: Date,
    expiresAt: Date,
    transaction: String,
    opportunityId: String,
  },
  { _id: false },
);
// Progress, evidence and ledger entries share an aggregate: one atomic MongoDB update.
const userSchema = new Schema(
  {
    id: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: String,
    learningPremium: {
      type: new Schema(
        { source: { type: String, enum: ['sandbox'] }, activatedAt: String },
        { _id: false },
      ),
      default: null,
    },
    name: String,
    campus: String,
    languages: [String],
    conversations: [
      new Schema(
        {
          id: String,
          ownerId: String,
          peerId: String,
          title: String,
          inviteHash: String,
          members: [new Schema({ id: String, name: String }, { _id: false })],
          messages: [
            new Schema(
              {
                id: String,
                clientId: String,
                senderId: String,
                text: { type: String, maxlength: 2000 },
                sentAt: Date,
              },
              { _id: false },
            ),
          ],
          createdAt: Date,
          updatedAt: Date,
        },
        { _id: false },
      ),
    ],
    assessments: [
      new Schema(
        {
          id: String,
          skillId: String,
          version: String,
          startedAt: String,
          expiresAt: String,
          submittedAt: String,
          answers: { type: [Number], default: undefined },
          score: Number,
          profileBefore: Number,
          profileAfter: Number,
        },
        { _id: false },
      ),
    ],
    skills: [skill],
    factors: { evidence: bounded, experience: bounded, projects: bounded, activity: bounded },
    sessions: [session],
    evidence: [
      new Schema(
        {
          id: String,
          skillId: String,
          type: String,
          title: String,
          verified: Boolean,
          createdAt: Date,
        },
        { _id: false },
      ),
    ],
    ledger: [ledger],
    snapshots: [new Schema({ score: bounded, at: Date, reason: String }, { _id: false })],
    payments: [payment],
    completedChallenges: [String],
    revision: { type: Number, required: true, default: 0 },
  },
  { versionKey: false, strict: 'throw' },
);
userSchema.index({ 'payments.transaction': 1 }, { sparse: true });
userSchema.index({ 'conversations.id': 1 });
userSchema.index({ 'conversations.members.id': 1 });
export const UserModel = mongoose.model('User', userSchema);
export const OpportunityModel = mongoose.model(
  'Opportunity',
  new Schema<Opportunity>(
    {
      id: { type: String, unique: true },
      title: String,
      company: String,
      location: String,
      type: String,
      description: String,
      requirements: [{ skillId: String, target: bounded, weight: { type: Number, min: 0 } }],
      tags: [String],
      demo: Boolean,
    },
    { versionKey: false },
  ),
);
export const PeerModel = mongoose.model(
  'Peer',
  new Schema<Peer>(
    {
      id: { type: String, unique: true },
      name: String,
      initials: String,
      campus: String,
      skills: { type: Map, of: Number },
      teaching: bounded,
      availability: bounded,
      reliability: bounded,
      languages: [String],
      wants: [String],
      activeLearners: Number,
      completed: Number,
      color: String,
    },
    { versionKey: false },
  ),
);
