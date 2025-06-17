// src/ai/flows/generate-tuition-reminder.ts
'use server';
/**
 * @fileOverview Generates personalized tuition reminder messages for students.
 *
 * - generateTuitionReminder - A function that generates a tuition reminder message.
 * - GenerateTuitionReminderInput - The input type for the generateTuitionReminder function.
 * - GenerateTuitionReminderOutput - The return type for the generateTuitionReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTuitionReminderInputSchema = z.object({
  studentName: z.string().describe('The name of the student.'),
  planName: z.string().describe('The name of the student\'s current plan.'),
  paymentStatus: z.enum(['paid', 'pending', 'overdue']).describe('The payment status of the student\'s tuition.'),
  dueDate: z.string().describe('The due date of the tuition payment (YYYY-MM-DD).'),
  amountDue: z.number().describe('The amount of tuition due.'),
  paymentMethod: z.string().describe('The preferred payment method (e.g., PIX, cash, card).'),
  attendanceHistory: z.string().describe('A brief summary of the student\'s recent attendance history.'),
});
export type GenerateTuitionReminderInput = z.infer<typeof GenerateTuitionReminderInputSchema>;

const GenerateTuitionReminderOutputSchema = z.object({
  reminderMessage: z.string().describe('The generated tuition reminder message for WhatsApp.'),
});
export type GenerateTuitionReminderOutput = z.infer<typeof GenerateTuitionReminderOutputSchema>;

export async function generateTuitionReminder(input: GenerateTuitionReminderInput): Promise<GenerateTuitionReminderOutput> {
  return generateTuitionReminderFlow(input);
}

const generateTuitionReminderPrompt = ai.definePrompt({
  name: 'generateTuitionReminderPrompt',
  input: {schema: GenerateTuitionReminderInputSchema},
  output: {schema: GenerateTuitionReminderOutputSchema},
  prompt: `You are an AI assistant specialized in generating personalized tuition reminder messages for a futvolei coach.

  Given the following information about a student, generate a friendly and effective WhatsApp message to remind them about their tuition payment.

  Student Name: {{{studentName}}}
  Plan Name: {{{planName}}}
  Payment Status: {{{paymentStatus}}}
  Due Date: {{{dueDate}}}
  Amount Due: {{{amountDue}}}
  Payment Method: {{{paymentMethod}}}
  Attendance History: {{{attendanceHistory}}}

  The message should:
  - Be personalized and address the student by name.
  - Clearly state the amount due and the due date.
  - Provide the preferred payment method.
  - Briefly mention their attendance history to encourage continued participation.
  - Maintain a friendly and encouraging tone.
  - Be concise and suitable for sending via WhatsApp.
  - Do not include any hashtags or promotional content.
  - Be no more than 160 characters in length.

  Here's an example:
  "Hi [Student Name], just a friendly reminder that your payment of [Amount Due] for the [Plan Name] plan is due on [Due Date]. You can pay via [Payment Method]. Keep up the great attendance!"
  `,
});

const generateTuitionReminderFlow = ai.defineFlow(
  {
    name: 'generateTuitionReminderFlow',
    inputSchema: GenerateTuitionReminderInputSchema,
    outputSchema: GenerateTuitionReminderOutputSchema,
  },
  async input => {
    const {output} = await generateTuitionReminderPrompt(input);
    return output!;
  }
);
