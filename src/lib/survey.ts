export type SurveyAnswers = {
  skin_type: string | null;
  concerns: string[];
  sensitivity: string | null;
  routine_level: string | null;
  avoid_ingredients: string[];
};

export type SurveyQuestion =
  | {
      key: "skin_type" | "sensitivity" | "routine_level";
      kind: "single";
      question: string;
      options: { value: string; label: string }[];
    }
  | {
      key: "concerns" | "avoid_ingredients";
      kind: "multi";
      question: string;
      options: { value: string; label: string }[];
      noneValue?: string;
    };

export const SURVEY: SurveyQuestion[] = [
  {
    key: "skin_type",
    kind: "single",
    question: "How does your skin usually feel by midday?",
    options: [
      { value: "Dry", label: "Tight or a little flaky" },
      { value: "Oily", label: "Shiny all over" },
      { value: "Combination", label: "Shiny in my T-zone only" },
      { value: "Normal", label: "Comfy and balanced" },
      { value: "Not sure", label: "I'm not sure yet" },
    ],
  },
  {
    key: "concerns",
    kind: "multi",
    question: "What would you like to work on?",
    options: [
      { value: "Dryness", label: "Dryness" },
      { value: "Breakouts", label: "Breakouts" },
      { value: "Dark spots", label: "Dark spots" },
      { value: "Redness", label: "Redness" },
      { value: "Fine lines", label: "Fine lines" },
      { value: "Dullness", label: "Dull skin" },
      { value: "Sun protection", label: "Sun protection" },
    ],
  },
  {
    key: "sensitivity",
    kind: "single",
    question: "How does your skin react to new products?",
    options: [
      { value: "Very sensitive", label: "It often stings or turns red" },
      { value: "A little sensitive", label: "Sometimes, with strong stuff" },
      { value: "Not sensitive", label: "Rarely, it's pretty tough" },
    ],
  },
  {
    key: "routine_level",
    kind: "single",
    question: "What does your routine look like today?",
    options: [
      { value: "None", label: "Nothing yet" },
      { value: "Basics", label: "Just the basics" },
      { value: "Some steps", label: "A few steps" },
      { value: "Full", label: "A full routine" },
    ],
  },
  {
    key: "avoid_ingredients",
    kind: "multi",
    question: "Anything you'd like to avoid?",
    noneValue: "Nothing in particular",
    options: [
      { value: "Fragrance", label: "Fragrance" },
      { value: "Alcohol", label: "Drying alcohol" },
      { value: "Essential oils", label: "Essential oils" },
      { value: "Nothing in particular", label: "Nothing in particular" },
    ],
  },
];

export const EMPTY_ANSWERS: SurveyAnswers = {
  skin_type: null,
  concerns: [],
  sensitivity: null,
  routine_level: null,
  avoid_ingredients: [],
};
