# === FORCE MCP USAGE ===
When any MCP tool is available and can perform the requested task,
the AI must ALWAYS use the MCP tool instead of generating code,
even if the code could work.

The AI should only write code if:
- No MCP tool can handle the task, OR
- The user explicitly says "don't use tools".

If a tool *might* be able to do the task,
the AI must try the MCP tool first before doing anything else.
