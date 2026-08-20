// Plain HTML templates, one function per event type. Deliberately simple for
// v1 — swap for React Email components later if templates grow complex.

function wrapper(bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #111;">
    <p style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #888;">GCU — Gente Como Uno</p>
    ${bodyHtml}
  </div>`;
}

export function welcomeCodeEmail(code: string) {
  return {
    subject: `Your GCU code: ${code}`,
    html: wrapper(`
      <h1 style="font-size: 20px;">Here's your code</h1>
      <p>Enter this code to verify your email:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.15em;">${code}</p>
      <p style="color: #888; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
    `),
  };
}

export function onboardingNudgeEmail() {
  return {
    subject: "You started something at GCU — finish it",
    html: wrapper(`
      <h1 style="font-size: 20px;">Pick up where you left off</h1>
      <p>You started the GCU questionnaire but haven't finished. It only takes a few minutes.</p>
    `),
  };
}

export function submissionConfirmationEmail() {
  return {
    subject: "You're in the pool",
    html: wrapper(`
      <h1 style="font-size: 20px;">You're in the pool</h1>
      <p>Thanks for finishing the questionnaire. Next: bring two people in with your referral code to become eligible for matches.</p>
    `),
  };
}

export function onHoldEmail() {
  return {
    subject: "Your profile is under review",
    html: wrapper(`
      <h1 style="font-size: 20px;">You're under review</h1>
      <p>Thanks for finishing the questionnaire. Your profile needs a quick manual review before matching starts — Vicente will follow up.</p>
    `),
  };
}

export function referralReminderEmail(referralCount: number, referralCode: string) {
  return {
    subject: `${referralCount}/2 — almost there`,
    html: wrapper(`
      <h1 style="font-size: 20px;">${referralCount}/2 referrals</h1>
      <p>Your code: <strong>${referralCode}</strong></p>
      <p>Get ${2 - referralCount} more ${referralCount === 1 ? "person" : "people"} to join and you're activated.</p>
    `),
  };
}

export function activatedEmail() {
  return {
    subject: "Welcome to the pool — you're activated",
    html: wrapper(`
      <h1 style="font-size: 20px;">You're activated</h1>
      <p>Both referrals are in. You're now eligible to receive matches.</p>
    `),
  };
}

export function weeklyMatchEmail() {
  return {
    subject: "Your match this week",
    html: wrapper(`
      <h1 style="font-size: 20px;">Your match is ready</h1>
      <p>Placeholder — matching logic not built yet.</p>
    `),
  };
}
