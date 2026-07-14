export interface HelpSection {
  id: string;
  title: string;
  items: { question: string; answer: string }[];
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      {
        question: 'How do I sign up?',
        answer:
          'From the landing page, click "Register" and create an account with your email and password, or use "Continue with Google" to sign in instantly using your Google account.',
      },
      {
        question: 'What shows up on my Home dashboard?',
        answer:
          'Your Home page (accessible via the house icon in the left nav) summarizes your upcoming week\'s events, recent notes, and gives quick launch cards into the AI chat and code editor.',
      },
    ],
  },
  {
    id: 'calendar',
    title: 'Calendar',
    items: [
      {
        question: 'How does AI scheduling work?',
        answer:
          'Type a request in the AI Chat panel on the Calendar page, like "block 2 hours every weekday evening for DSA practice." The AI reads your sleep window and upcoming contests automatically, and will never schedule over a contest or your sleep hours unless you explicitly ask it to.',
      },
      {
        question: 'How do I use voice input?',
        answer:
          'Click the microphone icon next to the chat input on the Calendar page and speak your request naturally. The transcript appears in the input field in real time — click send when you\'re ready, or click the mic again to stop.',
      },
      {
        question: 'Which AI provider is used for scheduling?',
        answer:
          'This is controlled entirely from Settings -> AI Preferences, not from the Calendar page itself. Choose between Ashna AI (managed) or your own Custom AI Agent (Gemini) there — the Calendar chat panel shows which one is currently active as a read-only badge.',
      },
      {
        question: 'Why does an event show a "shifted to avoid..." explanation?',
        answer:
          'Click any AI-scheduled event (marked with a sparkle icon) to see its full reasoning — the AI explains any tradeoffs it made, like shortening a sleep block to avoid an overlapping contest.',
      },
      {
        question: 'How do I sync with Google Calendar?',
        answer:
          'Go to Settings -> External Accounts and click "Link Google Account." Once linked, events you create here automatically push to your real Google Calendar, and you can view a read-only preview of your Google Calendar directly on the Calendar page sidebar.',
      },
    ],
  },
  {
    id: 'notes',
    title: 'Notes',
    items: [
      {
        question: 'How do I write a note about a specific event?',
        answer:
          'On the Notes page, click "For event," search for and select the event, then write your note. The event\'s title stays visible above the editor so you always know what you\'re writing about.',
      },
      {
        question: 'Does the AI automatically create notes for me?',
        answer:
          'No — notes are always written intentionally by you. AI-scheduled events include their own reasoning (visible when you click the event), but that reasoning is never auto-saved as a note on your behalf.',
      },
      {
        question: 'How does "highlight to ask AI" work?',
        answer:
          'Select any text or code inside a note, and a floating Ashna AI box appears. Choose "Explain," "Review for Errors," "Optimise," or type your own custom question about the highlighted selection.',
      },
    ],
  },
  {
    id: 'code',
    title: 'Code Execution',
    items: [
      {
        question: 'What languages are supported?',
        answer:
          'Over 60 languages via the Piston execution engine, including all major competitive programming languages (C++, Python, Java, and more). Use the language dropdown at the top of the Code page.',
      },
      {
        question: 'How do I give my program input?',
        answer:
          'Use the "Program Input (stdin)" field below the code editor — anything typed there is piped to your program\'s standard input when you click Run Code.',
      },
      {
        question: 'Can Ashna AI help me understand my code?',
        answer:
          'Click "Ask Ashna" above the editor to get an explanation of your current code, or use the highlight-to-ask feature inside Notes for more targeted questions about a specific snippet.',
      },
    ],
  },
  {
    id: 'contests',
    title: 'Contests',
    items: [
      {
        question: 'Where do contests come from?',
        answer:
          'Codeforces, LeetCode, and CodeChef are automatically scraped every 30 minutes. Filter by platform using the tabs at the top of the Contests page.',
      },
      {
        question: 'Can I schedule practice around a specific contest?',
        answer:
          'Click "Schedule around this" on any contest card to jump into the AI chat with that contest pre-filled as context for your request.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    items: [
      {
        question: 'Where do I change my sleep window?',
        answer:
          'Settings -> Scheduling Preferences. This window is used by the AI to avoid scheduling anything during your sleep hours, and defaults to 11 PM-6 AM IST if never set.',
      },
      {
        question: 'How do I add my own Gemini API key for the Custom AI Agent?',
        answer:
          'Settings -> AI Preferences -> Custom AI Agent Configuration. Your key is encrypted before storage and never shown again once saved — the field is write-only.',
      },
      {
        question: 'How do I manage active login sessions?',
        answer:
          'Settings -> Security shows every device currently logged into your account. Click "Revoke" next to any session to log it out remotely.',
      },
    ],
  },
];