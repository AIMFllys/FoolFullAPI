/** Remove prompt-injection style wrappers while preserving the user's actual request. */
export function sanitizeUserMessage(msg: string): string {
  return msg
    .replace(/\[system:[\s\S]*?\]\s*/gi, '')
    .replace(/\[system\]/gi, '')
    .replace(/\[assistant\]/gi, '')
    .replace(/role:\s*system/gi, '')
    .replace(/active tools:\s*.+/gi, '')
    .replace(/^\s*user:\s*/gi, '')
    .replace(/ignore.*instruction/gi, '')
    .replace(/忽略.*指令/gi, '')
    .trim();
}
