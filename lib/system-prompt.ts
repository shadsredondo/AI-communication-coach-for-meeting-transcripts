import { SECTIONS } from '@/lib/prompt/sage-sections'

// Sage's coaching system prompt, assembled from composable sections (see
// lib/prompt/sage-sections.ts). The sections are joined with the same
// `\n\n---\n\n` separator the prompt used when it was a single block, wrapped
// with a leading and trailing newline — so the assembled string is identical
// to the previous monolith and Sage's output is unchanged. Edit a section in
// sage-sections.ts to change one part of Sage in isolation; reorder SECTIONS
// there to reorder the prompt.
export const SYSTEM_PROMPT = '\n' + SECTIONS.join('\n\n---\n\n') + '\n'
