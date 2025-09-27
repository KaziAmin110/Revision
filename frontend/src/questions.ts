import { Suggestion } from "@/components/Suggestion";

export interface Question {
  id: number;
  title: string;
  suggestions: Suggestion[];
}

export const questions: Question[] = [
  {
    id: 1,
    title: "Physics: Free-Body Diagram",
    suggestions: [
      {
        type: "info",
        title: "Initial State",
        content:
          "The block is at rest on an inclined plane. Identify all forces acting on it.",
      },
      {
        type: "logic",
        title: "Key Forces",
        content:
          "Don't forget the force of gravity, the normal force, and the force of friction.",
      },
    ],
  },
  {
    id: 2,
    title: "Calculus: Area Under a Curve",
    suggestions: [
      {
        type: "info",
        title: "Goal",
        content: "Find the area under the curve y = x² from x = 0 to x = 2.",
      },
      {
        type: "logic",
        title: "Method",
        content: "Use a definite integral to calculate the exact area.",
      },
      {
        type: "feedback",
        title: "Integral Setup",
        content: "Your integral should be ∫ from 0 to 2 of x² dx. Great start!",
      },
    ],
  },
  {
    id: 3,
    title: "Chemistry: Balancing Equations",
    suggestions: [
      {
        type: "info",
        title: "The Equation",
        content: "Balance the chemical equation: H₂ + O₂ → H₂O.",
      },
      {
        type: "feedback",
        title: "Check Atoms",
        content:
          "Count the number of hydrogen and oxygen atoms on both the reactant and product sides.",
      },
    ],
  },
];
