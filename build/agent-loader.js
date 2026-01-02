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
exports.AgentLoader = void 0;
const fs = __importStar(require("fs"));
const glob_1 = require("glob");
const yaml = __importStar(require("js-yaml"));
const xml2js = __importStar(require("xml2js"));
class AgentLoader {
    projectRoot;
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    async loadAgents() {
        const agents = [];
        // Load YAML agents
        const yamlFiles = await (0, glob_1.glob)('src/{core,modules/*}/agents/*.agent.yaml', {
            cwd: this.projectRoot,
            absolute: true,
        });
        for (const file of yamlFiles) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const parsed = yaml.load(content);
                if (parsed && parsed.agent) {
                    agents.push(this.parseYamlAgent(parsed.agent, file));
                }
            }
            catch (err) {
                console.error(`Error loading YAML agent from ${file}:`, err);
            }
        }
        // Load XML agents (basic support)
        const xmlFiles = await (0, glob_1.glob)('src/{core,modules/*}/agents/*.agent.xml', {
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
            }
            catch (err) {
                console.error(`Error loading XML agent from ${file}:`, err);
            }
        }
        return agents;
    }
    parseYamlAgent(data, filePath) {
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
    parseXmlAgent(data, filePath) {
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
exports.AgentLoader = AgentLoader;
