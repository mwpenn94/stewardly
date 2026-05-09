/**
 * Re-export of the foundation's LLM helper so engine code does not import
 * from `_core` directly (keeps the engine-module boundary clean).
 */
export { invokeLLM } from "../../_core/llm";
