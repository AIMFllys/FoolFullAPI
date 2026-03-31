/** Remove potential prompt injection attempts from user messages */
export function sanitizeUserMessage(msg: string): string {
  return msg
    .replace(/\[system\]/gi, '')
    .replace(/\[assistant\]/gi, '')
    .replace(/role:\s*system/gi, '')
    .replace(/忽略.*指令/gi, '')
    .replace(/ignore.*instruction/gi, '')
    .trim();
}
