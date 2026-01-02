"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const path = __importStar(require("path"));
const agent_loader_js_1 = require("./agent-loader.js");
// Define the project root - can be configured via environment variable or defaults to parent directory
const isTsNode = !!process[Symbol.for("ts-node.register.instance")];
const PROJECT_ROOT = process.env.BMAD_PROJECT_ROOT || (isTsNode
    ? path.resolve(__dirname, '../../')
    : path.resolve(__dirname, '../../../'));
class BMadMcpServer {
    server;
    agentLoader;
    agents = [];
    constructor() {
        this.server = new index_js_1.Server({
            name: "bmad-mcp-server",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
                prompts: {},
            },
        });
        this.agentLoader = new agent_loader_js_1.AgentLoader(PROJECT_ROOT);
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            await this.ensureAgentsLoaded();
            const tools = [];
            for (const agent of this.agents) {
                if (agent.menu) {
                    for (const item of agent.menu) {
                        // Handle legacy trigger
                        if (item.trigger) {
                            tools.push({
                                name: `${this.sanitizeName(agent.metadata.name)}_${this.sanitizeName(item.trigger)}`,
                                description: `${agent.metadata.name}: ${item.description || item.trigger}`,
                                inputSchema: {
                                    type: "object",
                                    properties: {}, // Most BMAD menu items don't take args in the YAML, they are triggers
                                },
                            });
                        }
                        // Handle triggers array
                        if (item.triggers) {
                            // Implementation for complex triggers if needed
                        }
                    }
                }
            }
            return {
                tools,
            };
        });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            await this.ensureAgentsLoaded();
            const toolName = request.params.name;
            // Find the agent and action matching the tool name
            for (const agent of this.agents) {
                if (agent.menu) {
                    for (const item of agent.menu) {
                        if (item.trigger) {
                            const expectedName = `${this.sanitizeName(agent.metadata.name)}_${this.sanitizeName(item.trigger)}`;
                            if (expectedName === toolName) {
                                // In a real implementation, this would execute the BMAD action.
                                // For now, we return the action definition as a success message.
                                return {
                                    content: [
                                        {
                                            type: "text",
                                            text: `Executed ${toolName}.\nAction: ${item.action || item.exec || item.workflow}\nDescription: ${item.description}`,
                                        },
                                    ],
                                };
                            }
                        }
                    }
                }
            }
            throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Tool not found: ${toolName}`);
        });
        this.server.setRequestHandler(types_js_1.ListPromptsRequestSchema, async () => {
            await this.ensureAgentsLoaded();
            return {
                prompts: this.agents.map(agent => ({
                    name: this.sanitizeName(agent.metadata.name),
                    description: agent.metadata.title,
                })),
            };
        });
        this.server.setRequestHandler(types_js_1.GetPromptRequestSchema, async (request) => {
            await this.ensureAgentsLoaded();
            const promptName = request.params.name;
            const agent = this.agents.find(a => this.sanitizeName(a.metadata.name) === promptName);
            if (!agent) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Prompt (Agent) not found: ${promptName}`);
            }
            let systemPrompt = `You are ${agent.metadata.name}.\n`;
            if (agent.persona) {
                systemPrompt += `Role: ${agent.persona.role}\n`;
                systemPrompt += `Identity: ${agent.persona.identity}\n`;
                if (agent.persona.communication_style) {
                    systemPrompt += `Communication Style: ${agent.persona.communication_style}\n`;
                }
            }
            if (agent.critical_actions) {
                systemPrompt += `\nCritical Actions:\n${agent.critical_actions.map(a => `- ${a}`).join('\n')}\n`;
            }
            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: systemPrompt,
                        },
                    },
                ],
            };
        });
    }
    async ensureAgentsLoaded() {
        if (this.agents.length === 0) {
            console.error(`Loading agents from ${PROJECT_ROOT}...`);
            this.agents = await this.agentLoader.loadAgents();
            console.error(`Loaded ${this.agents.length} agents.`);
        }
    }
    sanitizeName(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error("BMad MCP Server running on stdio");
    }
}
const server = new BMadMcpServer();
server.run().catch(console.error);
