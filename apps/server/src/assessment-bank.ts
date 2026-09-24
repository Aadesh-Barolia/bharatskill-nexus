import type { Question } from '@nexus/shared';
type Item = Question & { answer: number; topic: string; explanation: string };
const q = (
  topic: string,
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
): Item => ({ id: '', topic, prompt, options, answer, explanation });
// Authored foundation checks. Keys and explanations are only returned after submission.
export const assessmentBank: Record<string, Item[]> = {
  'public-speaking': [
    q(
      'Structure',
      'You have two minutes to introduce a project. Which outline is clearest?',
      [
        'Every detail in chronological order',
        'Main idea, supporting example, takeaway',
        'A list of unrelated achievements',
      ],
      1,
      'One main idea with an example and takeaway gives listeners a clear path.',
    ),
    q(
      'Audience',
      'You are explaining a technical project to new students. What should you do first?',
      [
        'Use specialist vocabulary to sound credible',
        'Read the entire report aloud',
        'Connect the problem to something the audience understands',
      ],
      2,
      'Use familiar context and explain necessary terms for this audience.',
    ),
    q(
      'Evidence',
      'Which statement best supports a proposal?',
      [
        'Our pilot reduced average waiting time from 12 to 8 minutes across 30 visits',
        'Everyone knows this is better',
        'This is guaranteed to work everywhere',
      ],
      0,
      'A concrete pilot result supports the claim while leaving room for limitations.',
    ),
    q(
      'Questions',
      'Someone asks a question you cannot answer confidently. What is best?',
      [
        'Invent a confident answer',
        'Acknowledge the uncertainty and offer to check',
        'Ignore the person',
      ],
      1,
      'Honest uncertainty followed by a specific follow-up protects trust.',
    ),
  ],
  communication: [
    q(
      'Listening',
      'A teammate says a task is unclear. What is a useful first response?',
      [
        'Tell them to work faster',
        'Repeat the instructions louder',
        'Ask what is unclear and paraphrase their concern',
      ],
      2,
      'Clarify the gap in understanding before proposing a solution.',
    ),
    q(
      'Feedback',
      'Which feedback is most actionable?',
      [
        'You are careless',
        'The chart has no units; please label both axes before sharing',
        'You should be better',
      ],
      1,
      'Observable behavior and a concrete next step make feedback useful.',
    ),
    q(
      'Clarity',
      'Which request gives a teammate a clear next action?',
      [
        'Please review slide 3 for accuracy by 3 pm today',
        'Look at things soon',
        'Do whatever seems right',
      ],
      0,
      'A specific task and deadline reduce ambiguity.',
    ),
    q(
      'Disagreement',
      'Two teammates disagree about priorities. What helps?',
      [
        'Attack the other person’s motives',
        'Avoid discussing constraints',
        'Agree on the shared goal and compare the trade-offs',
      ],
      2,
      'Shared goals and explicit trade-offs help keep disagreement focused on the work.',
    ),
  ],
  'problem-solving': [
    q(
      'Problem definition',
      'What should come before choosing a solution?',
      [
        'Buy a new tool',
        'Describe the current gap, desired outcome and constraints',
        'Copy the most popular solution',
      ],
      1,
      'A clear problem statement helps avoid solving the wrong problem.',
    ),
    q(
      'Diagnosis',
      'A website becomes slow after a release. What is a useful next step?',
      [
        'Measure where time is spent and compare with the previous release',
        'Change everything immediately',
        'Assume the database is always responsible',
      ],
      0,
      'Measurements narrow the cause and make changes easier to evaluate.',
    ),
    q(
      'Experiments',
      'You have two plausible fixes and limited evidence. What is best?',
      [
        'Pick the most expensive fix',
        'Deploy both everywhere without measurement',
        'Run a small reversible test using agreed success criteria',
      ],
      2,
      'A limited experiment reduces uncertainty without committing the entire system.',
    ),
    q(
      'Trade-offs',
      'Two fixes have different costs and benefits. How should you compare them?',
      [
        'Use only the most optimistic benefit',
        'Compare impact, cost, risk and constraints',
        'Choose whichever was suggested first',
      ],
      1,
      'Explicit criteria make the decision and its compromises reviewable.',
    ),
  ],
  'technical-fundamentals': [
    q(
      'Web requests',
      'What normally happens when a browser requests a page?',
      [
        'The browser sends a request and a server returns a response',
        'The browser edits the server’s source code',
        'The server needs the browser’s password for every page',
      ],
      0,
      'HTTP uses requests and responses to exchange resources.',
    ),
    q(
      'Storage',
      'Which distinction between RAM and persistent storage is useful?',
      [
        'They always keep data for the same duration',
        'RAM is only for pictures',
        'RAM normally holds working data; persistent storage retains saved data without power',
      ],
      2,
      'Working memory and persistent storage serve different lifetimes of data.',
    ),
    q(
      'APIs',
      'What is an API contract?',
      [
        'A guarantee that no errors occur',
        'A definition of supported inputs, outputs and behavior',
        'A copy of a user’s password',
      ],
      1,
      'Clients and services agree on requests, responses and errors through a contract.',
    ),
    q(
      'Validation',
      'Why validate input on the server even if the form validates it?',
      [
        'Requests can bypass the form',
        'Validation makes passwords public',
        'Browsers never send invalid input',
      ],
      0,
      'Server-side validation protects the boundary regardless of the client used.',
    ),
  ],
  git: [
    q(
      'Working tree',
      'Which command shows changed and staged files?',
      ['git push', 'git status', 'git clone'],
      1,
      'git status reports the working tree and staging area relative to the current branch.',
    ),
    q(
      'Commits',
      'What does git commit normally record?',
      [
        'Every file anywhere on your computer',
        'Only files on the remote server',
        'A snapshot of the staged changes',
      ],
      2,
      'Stage the changes you want included before committing.',
    ),
    q(
      'Branches',
      'Why create a branch for a new feature?',
      [
        'To work along a separate line of development',
        'To automatically delete the main branch',
        'To publish credentials safely',
      ],
      0,
      'A branch lets work progress separately until it is integrated.',
    ),
    q(
      'Conflicts',
      'Git reports a merge conflict. What should you do?',
      [
        'Delete both versions without checking',
        'Review the conflicting changes, resolve them and test the result',
        'Force push immediately without review',
      ],
      1,
      'A conflict needs an intentional resolution that preserves the intended behavior.',
    ),
  ],
  'network-marketing': [
    q(
      'Customer needs',
      'What is a responsible first step before pitching a product?',
      [
        'Promise earnings immediately',
        'Ask about the customer’s needs and whether the product fits',
        'Pressure the customer to recruit friends',
      ],
      1,
      'Understand needs and product fit before recommending a purchase.',
    ),
    q(
      'Claims',
      'Which approach to a product claim is most responsible?',
      [
        'Use the largest number you can imagine',
        'Treat one testimonial as a universal guarantee',
        'Use supportable evidence and explain limitations',
      ],
      2,
      'Claims should be supported and should not promise universal outcomes.',
    ),
    q(
      'Consent',
      'Someone declines promotional messages. What should you do?',
      [
        'Respect the request and stop promotional contact',
        'Contact them from a different number',
        'Add them to more groups',
      ],
      0,
      'Respecting a refusal protects consent and trust.',
    ),
    q(
      'Transparency',
      'You receive a commission for a recommendation. What should you do?',
      [
        'Hide the relationship',
        'Disclose the commission relationship clearly',
        'Say the product is free when it is not',
      ],
      1,
      'A clear disclosure helps people evaluate your recommendation with relevant context.',
    ),
  ],
  cybersecurity: [
    q(
      'Phishing',
      'An unexpected email asks you to sign in through a link. What is safest?',
      [
        'Enter your password quickly',
        'Reply with your OTP',
        'Open the known official site independently and verify the request',
      ],
      2,
      'Use a trusted route rather than an unverified sign-in link.',
    ),
    q(
      'Account protection',
      'Which improves protection if a password is stolen?',
      [
        'A second authentication factor',
        'Reusing the password everywhere',
        'Sharing recovery codes',
      ],
      0,
      'A separate factor can reduce the risk from a stolen password; protect recovery codes too.',
    ),
    q(
      'Permissions',
      'What does least privilege mean?',
      [
        'Everyone gets administrator access',
        'Grant only the access needed for the task',
        'Disable all access reviews',
      ],
      1,
      'Limit permissions to the work that needs them and review them when roles change.',
    ),
    q(
      'Secrets',
      'Where should an application’s private API key be kept?',
      [
        'In a public repository',
        'In frontend JavaScript',
        'In protected server-side configuration',
      ],
      2,
      'Anything shipped to a browser can be inspected; private credentials belong on the server.',
    ),
  ],
  'data-analysis': [
    q(
      'Missing data',
      'A dataset contains missing measurements. What should you do first?',
      [
        'Replace every missing value with zero without checking',
        'Investigate why values are missing and choose a documented treatment',
        'Delete the column immediately',
      ],
      1,
      'The cause and pattern of missingness should inform how it is handled.',
    ),
    q(
      'Summaries',
      'Most salaries are similar, but one is extremely large. Which typical-value summary is less affected?',
      ['Median', 'Maximum', 'Sum'],
      0,
      'The median depends on order and is less sensitive to an extreme value than the mean.',
    ),
    q(
      'Causation',
      'Two variables rise together. What can you conclude from this alone?',
      [
        'One certainly causes the other',
        'The data must be fake',
        'They are associated; causation needs more evidence',
      ],
      2,
      'An association can reflect other influences and does not establish causation by itself.',
    ),
    q(
      'Charts',
      'You want to compare counts across four categories. What is a clear starting chart?',
      [
        'A chart with no labels',
        'A bar chart with labeled categories and a count axis',
        'An unrelated photograph',
      ],
      1,
      'Labeled bars make comparisons across categories straightforward.',
    ),
  ],
  'critical-thinking': [
    q(
      'Sources',
      'Which source gives the strongest direct support for a survey claim?',
      [
        'A repost without a link',
        'An anonymous slogan',
        'The original report with methods and sample details',
      ],
      2,
      'Original methods and sample details let you evaluate the basis of the claim.',
    ),
    q(
      'Assumptions',
      'A plan says everyone can attend at 8 am. What should you check?',
      [
        'Whether availability actually supports that assumption',
        'Whether the title sounds exciting',
        'Whether one person likes mornings',
      ],
      0,
      'Check the assumption with the affected people before relying on it.',
    ),
    q(
      'Counterevidence',
      'You prefer one explanation. How can you test it fairly?',
      [
        'Look only for agreement',
        'Look for evidence that could disprove it as well as support it',
        'Ignore alternative explanations',
      ],
      1,
      'Seeking counterevidence reduces confirmation bias.',
    ),
    q(
      'Uncertainty',
      'A small pilot looks promising. What is a careful conclusion?',
      [
        'It will work for every person',
        'No further evidence can matter',
        'It is promising in this sample; test whether it generalizes',
      ],
      2,
      'State the result within its scope and investigate whether it holds more broadly.',
    ),
  ],
  teamwork: [
    q(
      'Ownership',
      'A shared task keeps being missed. What helps?',
      [
        'Assume someone will do it',
        'Agree on an owner, deadline and definition of done',
        'Blame the whole group',
      ],
      1,
      'Explicit ownership and completion criteria make coordination easier.',
    ),
    q(
      'Blockers',
      'Your task is blocked and may delay others. What should you do?',
      [
        'Report the blocker early with its impact and needed help',
        'Wait until the deadline passes',
        'Pretend it is complete',
      ],
      0,
      'Early communication lets the team adjust plans or remove the blocker.',
    ),
    q(
      'Inclusion',
      'One teammate has not spoken in a discussion. What is constructive?',
      [
        'Assume they have no ideas',
        'Assign blame for silence',
        'Invite their perspective and allow time to respond',
      ],
      2,
      'An invitation with time to think can broaden participation without pressure.',
    ),
    q(
      'Handoffs',
      'What makes a task handoff useful?',
      [
        'Only saying done',
        'Sharing current status, relevant files and remaining risks',
        'Removing all context',
      ],
      1,
      'A useful handoff gives the next person what they need to continue.',
    ),
  ],
  productivity: [
    q(
      'Priorities',
      'Your time is limited. How should you choose what to do first?',
      [
        'Pick tasks randomly',
        'Always do the easiest task',
        'Consider importance, deadlines and dependencies',
      ],
      2,
      'Priorities should reflect outcomes and constraints, not only ease.',
    ),
    q(
      'Planning',
      'A task feels too large to start. What helps?',
      [
        'Break it into a small concrete next action',
        'Wait for perfect motivation',
        'Add more unrelated tasks',
      ],
      0,
      'A concrete next action makes the work easier to begin and estimate.',
    ),
    q(
      'Focus',
      'Notifications interrupt a planned study block. What can help?',
      [
        'Open every notification immediately',
        'Silence nonessential notifications for a planned focus period',
        'Study while joining unrelated calls',
      ],
      1,
      'Reducing avoidable interruptions protects attention during a focus period.',
    ),
    q(
      'Review',
      'You repeatedly underestimate task duration. What should you do?',
      [
        'Keep the same estimates forever',
        'Stop tracking outcomes',
        'Compare estimates with actual time and adjust future plans',
      ],
      2,
      'Reviewing actual time helps calibrate estimates and reserve realistic buffers.',
    ),
  ],
  python: [
    q(
      'Lists',
      'What is the value of len([10, 20, 30])?',
      ['30', '3', '2'],
      1,
      'len returns the number of elements in the list.',
    ),
    q(
      'Indexing',
      'What does [10, 20, 30][0] evaluate to?',
      ['10', '20', '30'],
      0,
      'Python list indexing starts at zero.',
    ),
    q(
      'Conditions',
      'Which expression checks whether x equals 5?',
      ['x = 5', 'x + 5', 'x == 5'],
      2,
      '== compares values; = is used for assignment.',
    ),
    q(
      'Functions',
      'What does return do inside a function?',
      [
        'Repeats the function forever',
        'Ends the function call and provides its result',
        'Always prints to the screen',
      ],
      1,
      'return gives a value back to the caller; printing is a separate operation.',
    ),
  ],
};
for (const items of Object.values(assessmentBank))
  items.forEach((item, i) => {
    item.id = `q${i + 1}`;
  });
