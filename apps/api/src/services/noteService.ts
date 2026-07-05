// apps/api/src/services/noteService.ts
// Note CRUD + AI-powered generation

import { Note } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { config } from '../config/env';
import { NotFoundError, ServiceUnavailableError } from '../middlewares/errorHandler';

interface CreateNoteInput {
  userId: string;
  contestId?: string;
  title: string;
  content: string;
  tags?: string[];
}

interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
}

interface GenerateNoteInput {
  userId: string;
  contestId: string;
  userPrompt?: string;
  skillLevel?: string;
}

class NoteService {
  async getNotesByUser(userId: string, contestId?: string): Promise<Note[]> {
    return prisma.note.findMany({
      where: {
        userId,
        ...(contestId ? { contestId } : {}),
      },
      include: {
        contest: {
          select: { id: true, name: true, platform: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNoteById(id: string, userId: string): Promise<Note> {
    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: {
        contest: { select: { id: true, name: true, platform: true } },
      },
    });
    if (!note) throw new NotFoundError('Note');
    return note;
  }

  async createNote(input: CreateNoteInput): Promise<Note> {
    return prisma.note.create({
      data: {
        userId: input.userId,
        contestId: input.contestId,
        title: input.title,
        content: input.content,
        tags: input.tags ?? [],
      },
    });
  }

  async updateNote(id: string, userId: string, input: UpdateNoteInput): Promise<Note> {
    await this.getNoteById(id, userId); // verify ownership

    return prisma.note.update({
      where: { id },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.tags && { tags: input.tags }),
      },
    });
  }

  async deleteNote(id: string, userId: string): Promise<void> {
    await this.getNoteById(id, userId); // verify ownership
    await prisma.note.delete({ where: { id } });
  }

  /**
   * Generate AI-powered notes for a contest
   */
  async generateNote(input: GenerateNoteInput): Promise<Note> {
    const contest = await prisma.contest.findUnique({
      where: { id: input.contestId },
    });
    if (!contest) throw new NotFoundError('Contest');

    const skillLevel = input.skillLevel ?? 'intermediate';

    // Try OpenAI first, fall back to template
    let content: string;
    let aiModel: string;

    try {
      if (config.ai.openaiKey) {
        const result = await this.callOpenAI(contest, skillLevel, input.userPrompt);
        content = result.content;
        aiModel = result.model;
      } else {
        content = this.generateTemplateNote(contest, skillLevel);
        aiModel = 'template';
      }
    } catch (error) {
      logger.error('AI note generation failed, using template:', error);
      content = this.generateTemplateNote(contest, skillLevel);
      aiModel = 'template-fallback';
    }

    return prisma.note.create({
      data: {
        userId: input.userId,
        contestId: input.contestId,
        title: `Prep Notes: ${contest.name}`,
        content,
        tags: [contest.platform.toLowerCase(), 'ai-generated'],
        isAiGenerated: true,
        aiPrompt: input.userPrompt,
        aiModel,
      },
    });
  }

  private async callOpenAI(
    contest: { name: string; platform: string; startTime: Date; duration: number; url: string },
    skillLevel: string,
    userPrompt?: string
  ): Promise<{ content: string; model: string }> {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: config.ai.openaiKey });

    const systemPrompt = `You are an expert competitive programming coach. Generate comprehensive preparation notes for upcoming programming contests.

Format notes in clean Markdown with these sections:
1. ## Contest Overview
2. ## Preparation Checklist (bullet points)
3. ## Contest Strategy
4. ## Post-Contest Plan

Tailor advice to ${skillLevel} level. Be specific, actionable, and motivating.`;

    const userMessage = `Generate notes for this contest:
- Name: ${contest.name}
- Platform: ${contest.platform}
- Start Time: ${contest.startTime.toISOString()}
- Duration: ${contest.duration} minutes
- URL: ${contest.url}

${userPrompt ? `Additional context: ${userPrompt}` : ''}`;

    const response = await client.chat.completions.create({
      model: config.ai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new ServiceUnavailableError('AI returned empty response');

    return { content, model: config.ai.model };
  }

  private generateTemplateNote(
    contest: { name: string; platform: string; startTime: Date; duration: number; url: string },
    skillLevel: string
  ): string {
    const startIST = new Date(contest.startTime.getTime() + 330 * 60 * 1000);
    const timeStr = startIST.toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return `# Prep Notes: ${contest.name}

## Contest Overview
- **Platform**: ${contest.platform}
- **Start Time (IST)**: ${timeStr}
- **Duration**: ${Math.floor(contest.duration / 60)}h ${contest.duration % 60}m
- **URL**: [Open Contest](${contest.url})

## Preparation Checklist
- [ ] Review data structures (arrays, linked lists, trees, graphs)
- [ ] Practice ${skillLevel === 'beginner' ? 'basic implementation problems' : 'dynamic programming and graph algorithms'}
- [ ] Review STL / standard library functions
- [ ] Test your template code (fast I/O, mod arithmetic)

## Contest Strategy
1. **Read all problems first** (5 minutes) — identify the easy ones
2. **Start with the easiest** — secure guaranteed points
3. **Time-box each problem** — move on after 25–30 minutes if stuck
4. **Don't panic on WA** — read the problem statement again carefully
5. **Edge cases** — empty inputs, single elements, large constraints

## Post-Contest Plan
- [ ] Upsolve all problems you couldn't solve
- [ ] Read the editorial for problems you solved
- [ ] Add new patterns to your notes
- [ ] Practice similar problems from past contests

---
*Generated automatically by CalNote*`;
  }
}

export const noteService = new NoteService();
