# BMAD MCP Server

A Model Context Protocol (MCP) server that bridges BMAD (Breakthrough Method of Agile AI-driven Development) agents with GitHub Copilot, enabling AI-assisted development workflows through specialized agent tools and prompts.

## What is BMAD?

BMAD is a comprehensive AI-driven development methodology featuring specialized agents for different aspects of software development, including:

- **Core Agents**: Master orchestration and task execution
- **Builder Module**: Agent and workflow creation/maintenance
- **Game Development**: Specialized game development agents
- **Methodology Module**: Full software development lifecycle agents
- **Creative Innovation**: Design thinking and creative problem-solving

## Prerequisites

- **Node.js** 20.0.0 or higher
- **VS Code** with GitHub Copilot extension
- **BMAD Repository** cloned locally
- **MCP Support** in VS Code (available in recent versions)

## Quick Start

### 1. Clone and Setup BMAD Repository

```bash
git clone https://github.com/bmad-code-org/BMAD-METHOD.git
cd BMAD-METHOD
npm install
```

### 2. Build the MCP Server

```bash
cd mcp-server
npm install
npm run build
```

### 3. Configure VS Code

Add the following to your VS Code `settings.json` (accessible via `Cmd/Ctrl + Shift + P` → "Preferences: Open Settings (JSON)"):

```json
{
  "mcp.servers": {
    "bmad": {
      "command": "node",
      "args": [
        "/absolute/path/to/BMAD-MCP-Server/mcp-server/build/index.js"
      ],
      "env": {
        "BMAD_PROJECT_ROOT": "/absolute/path/to/BMAD-METHOD"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**Important**: 
- Replace `/absolute/path/to/BMAD-MCP-Server` with the path to this MCP server repository
- Set `BMAD_PROJECT_ROOT` environment variable to point to your BMAD repository
- If not set, it defaults to looking in the parent directory

### 4. Reload VS Code

Use `Cmd/Ctrl + Shift + P` → "Developer: Reload Window" to apply the configuration.

### 5. Verify Installation

Open GitHub Copilot Chat and ask:
> "What tools are available from the bmad server?"

You should see a list of 50+ BMAD agent tools.

## Available Tools

### Core Agents
- `bmad_master_list_tasks` - List available tasks
- `bmad_master_list_workflows` - List available workflows
- `bmad_master_party_mode` - Group chat with all agents
- `bmad_orchestrator_*` - Orchestration and agent management tools

### Builder Tools
- `bmad_builder_create_agent` - Create new BMAD agents
- `bmad_builder_edit_agent` - Edit existing agents
- `bmad_builder_validate_workflow` - Validate workflows

### Development Tools
- `architect_create_architecture` - Create architecture documents
- `architect_create_excalidraw_diagram` - Generate system diagrams
- `dev_*` - Development workflow tools
- `analyst_*` - Analysis and requirements tools

### Game Development
- `game_architect_*` - Game architecture tools
- `game_designer_*` - Game design tools
- `game_dev_*` - Game development tools

### Creative & Innovation
- `brainstorming_coach_*` - Creative ideation tools
- `design_thinking_coach_*` - Design thinking facilitation
- `innovation_strategist_*` - Innovation planning tools

## Available Prompts

Load agent personas as system prompts:

- `bmad_master` - Master task executor and workflow orchestrator
- `architect` - System architect and technical design leader
- `game_designer` - Game design specialist
- `analyst` - Requirements and data analysis expert
- `dev` - Software development engineer
- And 15+ more specialized agent prompts

## Usage Examples

### Using Tools
```
"Run the architect_create_architecture tool to create an architecture document"
"Use the bmad_master_list_tasks tool"
"Execute architect implementation readiness check"
```

### Loading Prompts
```
"Load the architect prompt and help me design a microservices architecture"
"Use the game_designer persona to review my game concept"
"Load bmad_master and show me available workflows"
```

### Interactive Workflow
```
1. "Load the architect prompt"
2. "Create an architecture document for my e-commerce platform"
3. "Run the architect_create_excalidraw_diagram tool"
4. "Validate the architecture with architect_validate_architecture"
```

## Troubleshooting

### Server Not Connecting
1. **Check Path**: Ensure the path in `settings.json` is correct and absolute
2. **Build Status**: Verify `npm run build` completed successfully
3. **Node Version**: Ensure Node.js 20+ is installed
4. **VS Code Version**: Update to latest VS Code with MCP support

### Tools Not Appearing
1. **Reload Window**: Use "Developer: Reload Window"
2. **Restart VS Code**: Completely close and reopen
3. **Check Output**: Look for MCP errors in VS Code's Output panel
4. **Verify Configuration**: Ensure JSON syntax is valid in settings.json

### Permission Issues
- Ensure the MCP server has read access to the BMAD repository
- Check that Node.js can execute the built index.js file

### Development Mode
For development and debugging:
```bash
npm run dev  # Runs with ts-node for live reloading
```

## Architecture

The MCP server:
- **Scans** all `*.agent.yaml` and `*.agent.xml` files in the BMAD repository
- **Parses** agent definitions and their menu items
- **Exposes** menu triggers as MCP tools
- **Provides** agent personas as MCP prompts
- **Executes** BMAD workflows and actions through the tool interface

## Contributing

1. Agent definitions are in `src/core/agents/` and `src/modules/*/agents/`
2. Add new menu items to agent YAML files to create new tools
3. Update agent personas to modify prompt behavior
4. Test changes by rebuilding and reloading VS Code

## License

MIT License - See BMAD repository LICENSE file.

## Support

- **Issues**: Report bugs in the BMAD repository
- **Documentation**: See main BMAD docs for agent capabilities
- **Community**: Join BMAD discussions for best practices
