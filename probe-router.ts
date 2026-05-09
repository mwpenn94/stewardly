import { appRouter } from "./server/routers";
const top: any = (appRouter as any)._def;
console.log("top keys:", Object.keys(top));
const procs = top.procedures || top.record;
console.log("procs has voiceAgent?", !!procs?.voiceAgent);
console.log("voiceAgent direct keys:", procs?.voiceAgent ? Object.keys(procs.voiceAgent) : null);
console.log("decide via dot:", !!procs?.voiceAgent?.decide);
