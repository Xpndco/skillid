// Edit Skill Path content here. This is the single source of truth for
// path + day copy, per-day RealSkill assignment URLs, and CTA labels.

export interface SkillPathDay {
  day: number;
  title: string;
  summary: string;
  realskillUrl: string;
  ctaLabel: string;
  videoUrl?: string;
}

export interface SkillPath {
  slug: string;
  title: string;
  tagline: string;
  courseSlug: string;
  days: SkillPathDay[];
  isOnboarding?: boolean;
}

// Shared 10-day template. Any Skill ID built with buildSkillPath() inherits
// this arc. Individual days can be overridden per-path via dayOverrides.
const DEFAULT_DAY_TEMPLATE: ReadonlyArray<{ title: string; summary: string }> = [
  {
    title: "Start With One Rep",
    summary: "Commit to one clean rep pattern today and prove you can own it before adding anything else.",
  },
  {
    title: "Find Where It Breaks",
    summary: "Identify whether the skill breaks down at the ball, the feet, the body, or the eyes.",
  },
  {
    title: "Train the Base Move",
    summary: "Drill the skill in a stationary, pressure-free setting so the mechanics become yours.",
  },
  {
    title: "Add Footwork Rhythm",
    summary: "Connect the skill to footwork so it lives in your whole body, not just your hands.",
  },
  {
    title: "Add a Pace Change",
    summary: "Layer tempo on top so the move becomes believable under defense.",
  },
  {
    title: "Add a Defender Read",
    summary: "Train against a cone, chair, or live defender so the skill responds to a read.",
  },
  {
    title: "Sell It",
    summary: "Sharpen eyes, shoulders, and fakes so the skill actually moves the defender, not just the ball.",
  },
  {
    title: "String Moves Together",
    summary: "Combine two reps in sequence so you can counter a defender who takes away the first one.",
  },
  {
    title: "Execute at Game Speed",
    summary: "Run the skill at full speed, under fatigue, with a real decision attached.",
  },
  {
    title: "Continue Inside RealSkill",
    summary: "Take your base into the full course and keep building inside RealSkill.",
  },
];

type DayOverride = Partial<Omit<SkillPathDay, "day">>;

interface BuildSkillPathArgs {
  slug: string;
  title: string;
  tagline: string;
  courseSlug: string;
  realskillUrl: string;
  isOnboarding?: boolean;
  dayOverrides?: Partial<Record<number, DayOverride>>;
}

export function buildSkillPath(args: BuildSkillPathArgs): SkillPath {
  const days: SkillPathDay[] = DEFAULT_DAY_TEMPLATE.map((tmpl, i) => {
    const day = i + 1;
    const override = args.dayOverrides?.[day] ?? {};
    const defaultCta =
      day === 1
        ? "Start Training This Skill"
        : day === 10
          ? "Continue Inside RealSkill"
          : "Train Inside RealSkill";
    return {
      day,
      title: tmpl.title,
      summary: tmpl.summary,
      realskillUrl: args.realskillUrl,
      ctaLabel: defaultCta,
      ...override,
    };
  });
  return {
    slug: args.slug,
    title: args.title,
    tagline: args.tagline,
    courseSlug: args.courseSlug,
    isOnboarding: args.isOnboarding,
    days,
  };
}

export const SKILL_PATHS: Record<string, SkillPath> = {
  "one-skill-at-a-time": {
    slug: "one-skill-at-a-time",
    title: "One Skill At A Time Challenge",
    tagline: "Build your first Skill ID Profile in 10 days with one clear step at a time.",
    courseSlug: "oneskillatatime",
    isOnboarding: true,
    days: [
      {
        day: 1,
        title: "Start With One Skill",
        summary: "Most players try to improve everything at once. That’s why nothing actually changes. Today, you’re starting with one skill — and one assignment — so you can finally build something real.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
        ctaLabel: "Start Training This Skill",
      },
      {
        day: 2,
        title: "Find What Breaks First",
        summary: "Identify whether your skill breaks down because of the ball, feet, body, or decision.",
        realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
        ctaLabel: "Train Inside RealSkill",
      },
      {
        day: 3,
        title: "Use the Checklist",
        summary: "Start working through the first section of your Skill ID checklist instead of guessing what to train.",
        realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
        ctaLabel: "Train Inside RealSkill",
      },
      {
        day: 4,
        title: "Mark Progress Honestly",
        summary: "Learn how to mark Complete vs. Needs Work so your Skill ID Profile actually guides you.",
        realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
        ctaLabel: "Train Inside RealSkill",
      },
      {
        day: 5,
        title: "Repeat With Accountability",
        summary: "Revisit your first assignment with a clear focus and a specific training constraint.",
        realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
        ctaLabel: "Train Inside RealSkill",
      },
      {
        day: 6,
        title: "Add Footwork",
        summary: "Connect the skill to movement so it does not stay trapped as a stationary drill.",
        realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
        ctaLabel: "Train Inside RealSkill",
      },
      {
        day: 7,
        title: "Add a Decision Layer",
        summary: "Begin connecting your skill to a simple read or trigger.",
        realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
        ctaLabel: "Train Inside RealSkill",
      },
      {
        day: 8,
        title: "Review What Improved",
        summary: "Look back at what changed, what still breaks, and what needs more exposure.",
        realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
        ctaLabel: "Train Inside RealSkill",
      },
      {
        day: 9,
        title: "Complete Your First Section",
        summary: "Finish the first section of your Skill ID Profile and lock in your progress.",
        realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
        ctaLabel: "Train Inside RealSkill",
      },
      {
        day: 10,
        title: "Continue Your Skill Path",
        summary: "You’ve built your first Skill ID Profile. Now continue inside RealSkill to expand your skills and complete your full training system.",
        realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
        ctaLabel: "Continue Inside RealSkill",
      },
    ],
  },

  // Finishing
  "finishing-off-two-feet": buildSkillPath({
    slug: "finishing-off-two-feet",
    title: "Finishing Off Two Feet",
    tagline: "Training to get you finishing off two feet like a pro.",
    courseSlug: "finishingofftwofeet",
    realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
  }),
  "kyrie-finishing-package": buildSkillPath({
    slug: "kyrie-finishing-package",
    title: "Kyrie Finishing Package",
    tagline: "Master the techniques needed to finish like the best below the rim.",
    courseSlug: "kyriefinishingpackage",
    realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
  }),
  "perfect-floater": buildSkillPath({
    slug: "perfect-floater",
    title: "The Perfect Floater",
    tagline: "Training dedicated to teaching you the techniques and precision needed for the perfect floater.",
    courseSlug: "perfectfloater",
    realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
  }),
  "hang-time-finishing": buildSkillPath({
    slug: "hang-time-finishing",
    title: "Hang Time Finishing",
    tagline: "Training that gives you the skills needed for more athletic finishing.",
    courseSlug: "hangtimefinishing",
    realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
  }),

  // Shooting
  "unstoppable-shot-separation": buildSkillPath({
    slug: "unstoppable-shot-separation",
    title: "Unstoppable Shot Separation",
    tagline: "Training to master space separation out of step backs and pull backs.",
    courseSlug: "unstoppableshotseparation",
    realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
  }),
  "perfect-shot-fluidity": buildSkillPath({
    slug: "perfect-shot-fluidity",
    title: "Perfect Shot Fluidity",
    tagline: "Training that gives you a quicker and more fluid shooting stroke.",
    courseSlug: "perfectshotfluidity",
    realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
  }),
  "master-the-mid-range": buildSkillPath({
    slug: "master-the-mid-range",
    title: "Master the Mid-Range",
    tagline: "Training that gives you the ability to master the mid-range.",
    courseSlug: "masterthemidrange",
    realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
  }),

  // Ball Handling
  "manipulation-mastery": buildSkillPath({
    slug: "manipulation-mastery",
    title: "Manipulation Mastery",
    tagline: "Training to get you manipulating the basketball at a world-class level.",
    courseSlug: "manipulationmastery",
    realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
  }),

  // Passing
  "pinpoint-passing": buildSkillPath({
    slug: "pinpoint-passing",
    title: "Pinpoint Passing",
    tagline: "Training to develop the techniques needed for elite passing accuracy and wizardry.",
    courseSlug: "pinpointpassing",
    realskillUrl: "https://app.possibletraining.com/dashboard/skill-id",
  }),
};

export function getPath(slug: string): SkillPath | null {
  return SKILL_PATHS[slug] ?? null;
}
