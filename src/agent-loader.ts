import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as yaml from 'js-yaml';
import * as xml2js from 'xml2js';
import { BMadAgent, AgentMenuItem } from './types.js';

export class AgentLoader {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async loadAgents(): Promise<BMadAgent[]> {
    const agents: BMadAgent[] = [];
    
    // Load YAML agents
    const yamlFiles = await glob('src/{core,modules/*}/agents/*.agent.yaml', {
      cwd: this.projectRoot,
      absolute: true,
    });

    for (const file of yamlFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const parsed = yaml.load(content) as any;
        if (parsed && parsed.agent) {
          agents.push(this.parseYamlAgent(parsed.agent, file));
        }
      } catch (err) {
        console.error(`Error loading YAML agent from ${file}:`, err);
      }
    }

    // Load XML agents (basic support)
    const xmlFiles = await glob('src/{core,modules/*}/agents/*.agent.xml', {
      cwd: this.projectRoot,
      absolute: true,
    });

    for (const file of xmlFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
        const parsed = await parser.parseStringPromise(content);
        if (parsed && parsed.agent) {
          agents.push(this.parseXmlAgent(parsed.agent, file));
        }
      } catch (err) {
        console.error(`Error loading XML agent from ${file}:`, err);
      }
    }

    return agents;
  }

  private parseYamlAgent(data: any, filePath: string): BMadAgent {
    return {
      metadata: data.metadata,
      persona: data.persona,
      menu: data.menu,
      prompts: data.prompts,
      critical_actions: data.critical_actions,
      sourceFile: filePath,
      type: 'yaml'
    };
  }

  private parseXmlAgent(data: any, filePath: string): BMadAgent {
    // XML parsing results in a different structure, need to map it
    // This is a simplified mapping
    return {
      metadata: {
        id: data.id || 'unknown',
        name: data.name || 'Unknown Agent',
        title: data.title || data.name,
        icon: data.icon
      },
      // XML agents might not have the same persona structure, adapting as needed
      persona: {
        role: data.name,
        identity: "XML defined agent",
      },
      menu: [], // XML agents handle menu differently in the example
      sourceFile: filePath,
      type: 'xml'
    };
  }
}
