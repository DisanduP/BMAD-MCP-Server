export interface AgentMetadata {
  id: string;
  name: string;
  title: string;
  icon?: string;
}

export interface AgentMenuItem {
  trigger?: string;
  triggers?: Record<string, string>[];
  action?: string;
  exec?: string;
  workflow?: string;
  description?: string;
  [key: string]: any;
}

export interface AgentPersona {
  role: string;
  identity: string;
  communication_style?: string;
  principles?: string[];
}

export interface BMadAgent {
  metadata: AgentMetadata;
  persona?: AgentPersona;
  menu?: AgentMenuItem[];
  prompts?: any[];
  critical_actions?: string[];
  sourceFile: string;
  type: 'yaml' | 'xml';
}
