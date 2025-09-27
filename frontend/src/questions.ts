import { Suggestion } from "@/components/Suggestion";

export interface Question {
  id: number;
  title: string;
  suggestions: Suggestion[];
}

// Simple JSON data structure with just core components
export const questions: Question[] = [
  {
    id: 1,
    title: "Solve for $x$: $x + 5 = 12$",
    suggestions: [
      {
        type: "info",
        title: "Equation Type",
        content: "This is a simple linear equation with one variable.",
      },
      {
        type: "logic",
        title: "Solution Method",
        content: "Isolate the variable by performing the same operation on both sides of the equation.",
      },
      {
        type: "feedback",
        title: "Check Your Work",
        content: "Substitute your answer back into the original equation to verify it's correct.",
      },
    ],
  },
  {
    id: 2,
    title: "Find the area under the curve $f(x) = x^2$ from $x = 0$ to $x = 2$",
    suggestions: [
      {
        type: "info",
        title: "Integration Problem",
        content: "This requires calculating a definite integral to find the area under the curve.",
      },
      {
        type: "logic",
        title: "Setup",
        content: "Set up the definite integral: $\\int_0^2 x^2 \\, dx$",
      },
      {
        type: "feedback",
        title: "Power Rule",
        content: "Use the power rule: $\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C$",
      },
    ],
  },
  {
    id: 3,
    title: "Balance the chemical equation: $\\text{H}_2 + \\text{O}_2 \\rightarrow \\text{H}_2\\text{O}$",
    suggestions: [
      {
        type: "info",
        title: "Chemical Balancing",
        content: "Balance the equation by ensuring equal numbers of each type of atom on both sides.",
      },
      {
        type: "logic",
        title: "Count Atoms",
        content: "Count hydrogen and oxygen atoms on both the reactant and product sides.",
      },
      {
        type: "feedback",
        title: "Coefficients",
        content: "The balanced equation is: $2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}$",
      },
    ],
  },
  {
    id: 4,
    title: "Calculate the derivative: $\\frac{d}{dx}[3x^2 + 2x - 1]$",
    suggestions: [
      {
        type: "info",
        title: "Differentiation",
        content: "Apply differentiation rules to find the derivative of this polynomial.",
      },
      {
        type: "logic",
        title: "Power Rule",
        content: "Use the power rule: $\\frac{d}{dx}[x^n] = nx^{n-1}$",
      },
      {
        type: "feedback",
        title: "Term by Term",
        content: "Differentiate each term separately and combine the results.",
      },
    ],
  },
];
