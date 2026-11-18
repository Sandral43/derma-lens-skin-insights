export const POLICY_UPDATED = "November 18, 2026";
export const SUPPORT_EMAIL = "support@dermalens.app";

export type PolicyTab = "privacy" | "terms" | "data";

export const POLICIES: Record<PolicyTab, { label: string; short: string; sections: { title: string; body: string[] }[] }> = {
  privacy: {
    label: "Privacy",
    short:
      "Your skin is your business. We keep only what helps your routine, you control your photos, and you can download or delete everything at any time.",
    sections: [
      {
        title: "What we collect",
        body: [
          "Account details: your name and email address, or the basic profile shared by Google or Lovable if you sign in with them.",
          "Your skin profile answers, routine quests, check-offs, coins and preferences such as reminder times and your buddy's name.",
          "Skin check results: hydration, texture and clarity scores, a short summary and tips. A face photo is stored only if you turn on photo saving.",
          "Products you save with the heart button.",
        ],
      },
      {
        title: "How we use your information",
        body: [
          "To run your routine, streaks and calendar, and to pick product suggestions that match your skin profile.",
          "When you chat with your buddy, your question and, if you allow it in Settings, your skin profile, routine and last skin check are sent to our AI provider to write a reply.",
          "When you scan, the photo is sent to our AI provider once to estimate your scores. We never use your face photos for advertising or to train models.",
        ],
      },
      {
        title: "Skin photos and storage",
        body: [
          "Photo saving is off unless you turn it on. Saved photos go to a private folder only you can open, and they show up on your Calendar.",
          "You can delete all saved photos at any time from Settings → Skin photo storage. Your scores stay unless you delete your account.",
          "Chats with your buddy are not saved after you leave the chat screen.",
        ],
      },
      {
        title: "Who we share data with",
        body: [
          "Service providers that help us run DermaLens: secure hosting and database, and an AI provider that writes chat replies and estimates scan scores.",
          "When you search for dermatologists, the city you type or your approximate location is sent to OpenStreetMap services to find nearby listings.",
          "We don't sell your data. Product suggestions are not sponsored and contain no affiliate links.",
        ],
      },
      {
        title: "Your choices and rights",
        body: [
          "Download a copy of your data from Settings or this page.",
          "Turn off sharing your skin profile with your buddy, photo saving and reminders whenever you like.",
          "Delete your account from Settings. This permanently removes your profile, routine, scans and photos.",
        ],
      },
      {
        title: "Contact us",
        body: [`Questions about privacy? Email ${SUPPORT_EMAIL} and a real person will get back to you.`],
      },
    ],
  },
  terms: {
    label: "Terms",
    short:
      "DermaLens is a friendly helper for your routine, not a doctor. Be kind, use it for yourself, and see a professional for anything that worries you.",
    sections: [
      {
        title: "Not medical advice",
        body: [
          "Your buddy, skin checks, product suggestions and dermatologist listings share general skincare information only. They are not a diagnosis or treatment.",
          "If something on your skin is painful, changing, bleeding or worrying, please see a dermatologist or doctor.",
        ],
      },
      {
        title: "Your account",
        body: [
          "Keep your login details safe. You're responsible for activity on your account.",
          "DermaLens is meant for adults. If you're under 18, please use it with a parent or guardian.",
        ],
      },
      {
        title: "Skin checks and AI",
        body: [
          "Scores are estimates that depend on lighting, camera and angle. They can be wrong and may vary between scans.",
          "AI replies can make mistakes. Double-check anything important with a professional.",
        ],
      },
      {
        title: "Products and listings",
        body: [
          "Prices are approximate and may change. We don't sell products in the app.",
          "Dermatologist listings come from public map data. They are suggestions, not endorsements, and may be out of date.",
        ],
      },
      {
        title: "Changes and contact",
        body: [`We may update these terms and will show the new date at the top. Questions? Email ${SUPPORT_EMAIL}.`],
      },
    ],
  },
  data: {
    label: "Data use",
    short:
      "Here's exactly where your data goes in plain words, feature by feature.",
    sections: [
      {
        title: "Quests, coins and calendar",
        body: ["Stored in your private account so your progress follows you across devices."],
      },
      {
        title: "Buddy chat",
        body: [
          "Your messages go to our AI provider to write a reply. If “Share my skin profile” is on, your profile, routine and last skin check are included so answers fit you.",
          "Chats aren't saved by DermaLens.",
        ],
      },
      {
        title: "Face scan",
        body: [
          "Your photo is sent once to our AI provider to estimate scores, then only the scores are kept, unless you chose to save the photo privately.",
        ],
      },
      {
        title: "Dermatologist finder",
        body: ["Your typed city or device location is used only for that search and isn't stored."],
      },
      {
        title: "Reminders",
        body: ["Reminder times are saved in your profile. Reminders appear while DermaLens is open on your device."],
      },
    ],
  },
};
