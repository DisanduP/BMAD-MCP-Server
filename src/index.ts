import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import * as path from 'path';
import { AgentLoader } from './agent-loader.js';
import { BMadAgent } from './types.js';

// Define the project root - can be configured via environment variable or defaults to parent directory
const isTsNode = !!(process as any)[Symbol.for("ts-node.register.instance")];
const PROJECT_ROOT = process.env.BMAD_PROJECT_ROOT || (
  isTsNode 
    ? path.resolve(__dirname, '../../') 
    : path.resolve(__dirname, '../../../')
);

class BMadMcpServer {
  private server: Server;
  private agentLoader: AgentLoader;
  private agents: BMadAgent[] = [];

  constructor() {
    this.server = new Server(
      {
        name: "bmad-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    this.agentLoader = new AgentLoader(PROJECT_ROOT);

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
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

      throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${toolName}`);
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      await this.ensureAgentsLoaded();
      
      return {
        prompts: this.agents.map(agent => ({
          name: this.sanitizeName(agent.metadata.name),
          description: agent.metadata.title,
        })),
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      await this.ensureAgentsLoaded();
      
      const promptName = request.params.name;
      const agent = this.agents.find(a => this.sanitizeName(a.metadata.name) === promptName);

      if (!agent) {
        throw new McpError(ErrorCode.MethodNotFound, `Prompt (Agent) not found: ${promptName}`);
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

  private async ensureAgentsLoaded() {
    if (this.agents.length === 0) {
      console.error(`Loading agents from ${PROJECT_ROOT}...`);
      this.agents = await this.agentLoader.loadAgents();
      console.error(`Loaded ${this.agents.length} agents.`);
    }
  }

  private sanitizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("BMad MCP Server running on stdio");
  }
}

const server = new BMadMcpServer();
server.run().catch(console.error);
