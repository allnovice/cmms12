export type SurveyQuestion =
  | {
      id: string;
      question: string;
      type: "single-choice" | "multi-choice";
      options: string[];
    }
  | {
      id: string;
      question: string;
      type: "scale";
      scale: { min: number; max: number; labels?: Record<number, string> };
    }
  | {
      id: string;
      question: string;
      type: "text";
    };

export const surveyQuestions: SurveyQuestion[] = [
  {
    id: "role",
    question: "What is your role?",
    type: "single-choice",
    options: ["Maintenance Technician", "Supervisor", "Chief", "Admin", "User"],
  },
  {
    id: "usage_frequency",
    question: "How often do you use the CMMS?",
    type: "single-choice",
    options: ["Daily", "Several times a week", "Weekly", "Rarely"],
  },
  {
    id: "ease_of_use",
    question: "The CMMS interface is easy to understand.",
    type: "scale",
    scale: {
      min: 1,
      max: 5,
      labels: {
        1: "Strongly Disagree",
        3: "Neutral",
        5: "Strongly Agree",
      },
    },
  },
  {
    id: "features_used",
    question: "Which CMMS features do you use regularly?",
    type: "multi-choice",
    options: ["Work Orders", "Preventive Maintenance", "Asset Tracking", "Inventory", "Reports"],
  },
  {
    id: "improvements",
    question: "What improvements would you suggest for the CMMS?",
    type: "text",
  },
];
