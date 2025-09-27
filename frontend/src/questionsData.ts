import { Suggestion } from "@/components/Suggestion";

export interface Question {
  id: number;
  title: string;
  text: string;
  type: string;
  suggestions: Suggestion[];
}

interface QuestionData {
  questions: {
    id: number;
    text: string;
    type: string;
  }[];
}

const questionData: QuestionData = require('../samplequestion.json');

// Transform JSON questions to match our component structure
export const questions: Question[] = questionData.questions.map((q, index) => ({
  id: q.id,
  title: q.text, // Use the text as the title for display
  text: q.text,
  type: q.type,
  suggestions: [
    {
      type: "info",
      title: "Problem Type",
      content: `This is a ${q.type} question.`,
    },
    {
      type: "logic",
      title: "Approach",
      content: "Analyze the problem step by step and show your work clearly.",
    },
    {
      type: "feedback",
      title: "Hint",
      content: "Use proper mathematical notation and check your final answer.",
    }
  ]
}));
