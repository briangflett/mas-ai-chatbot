#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { CiviCRMClient, CiviCRMConfig } from "./civicrm-client.js";
import * as dotenv from 'dotenv';

dotenv.config();

const config: CiviCRMConfig = {
  cvPath: process.env.CIVICRM_CV_PATH || '/home/brian/buildkit/bin/cv',
  settingsPath: process.env.CIVICRM_SETTINGS_PATH || '/home/brian/buildkit/build/masdemo/web/wp-content/uploads/civicrm/civicrm.settings.php',
};

const civicrm = new CiviCRMClient(config);

const server = new Server(
  {
    name: "civicrm-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools: Tool[] = [
  {
    name: "get_contacts",
    description: "Get a list of contacts from CiviCRM",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of contacts to return (default: 25)",
          default: 25,
        },
        offset: {
          type: "number",
          description: "Number of contacts to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "search_contacts",
    description: "Search for contacts by name",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for contact names",
        },
        limit: {
          type: "number",
          description: "Maximum number of contacts to return (default: 25)",
          default: 25,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_contact",
    description: "Get detailed information about a specific contact",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "Contact ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "get_contributions",
    description: "Get a list of contributions/donations",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of contributions to return (default: 25)",
          default: 25,
        },
        offset: {
          type: "number",
          description: "Number of contributions to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_contributions_by_contact",
    description: "Get contributions for a specific contact",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "number",
          description: "Contact ID",
        },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "get_contribution_stats",
    description: "Get overall contribution statistics",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_events",
    description: "Get a list of events",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of events to return (default: 25)",
          default: 25,
        },
        offset: {
          type: "number",
          description: "Number of events to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_upcoming_events",
    description: "Get upcoming events",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of events to return (default: 10)",
          default: 10,
        },
      },
    },
  },
  {
    name: "get_overall_stats",
    description: "Get overall CiviCRM statistics (contacts, contributions, events, cases)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_cases",
    description: "Get a list of cases/projects",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of cases to return (default: 25)",
          default: 25,
        },
        offset: {
          type: "number",
          description: "Number of cases to skip (default: 0)",
          default: 0,
        },
        status_filter: {
          type: "string",
          description: "Filter by case status (e.g., '1' for Open, '2' for Closed)",
        },
        date_filter: {
          type: "string",
          description: "Filter by start date (YYYY-MM-DD format)",
        },
      },
    },
  },
  {
    name: "get_case_by_id",
    description: "Get detailed information about a specific case",
    inputSchema: {
      type: "object",
      properties: {
        case_id: {
          type: "number",
          description: "Case ID",
        },
      },
      required: ["case_id"],
    },
  },
  {
    name: "get_cases_by_contact",
    description: "Get cases for a specific contact",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "number",
          description: "Contact ID",
        },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "get_cases_by_role",
    description: "Get cases by role relationship (client, case_coordinator, case_manager)",
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "number",
          description: "Contact ID",
        },
        role_type: {
          type: "string",
          enum: ["client", "case_coordinator", "case_manager"],
          description: "Role type relationship to cases",
        },
      },
      required: ["contact_id", "role_type"],
    },
  },
  {
    name: "get_case_contacts",
    description: "Get contacts associated with a specific case",
    inputSchema: {
      type: "object",
      properties: {
        case_id: {
          type: "number",
          description: "Case ID",
        },
      },
      required: ["case_id"],
    },
  },
  {
    name: "get_case_activities",
    description: "Get activities/service requests for a specific case",
    inputSchema: {
      type: "object",
      properties: {
        case_id: {
          type: "number",
          description: "Case ID",
        },
        limit: {
          type: "number",
          description: "Maximum number of activities to return (default: 25)",
          default: 25,
        },
      },
      required: ["case_id"],
    },
  },
  {
    name: "get_open_cases_by_coordinator",
    description: "Get open cases for a specific case coordinator",
    inputSchema: {
      type: "object",
      properties: {
        coordinator_id: {
          type: "number",
          description: "Coordinator Contact ID",
        },
      },
      required: ["coordinator_id"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_contacts": {
        const { limit = 25, offset = 0 } = args as { limit?: number; offset?: number };
        const contacts = await civicrm.getContacts(limit, offset);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(contacts, null, 2),
            },
          ],
        };
      }

      case "search_contacts": {
        const { query, limit = 25 } = args as { query: string; limit?: number };
        const contacts = await civicrm.searchContacts(query, limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(contacts, null, 2),
            },
          ],
        };
      }

      case "get_contact": {
        const { id } = args as { id: number };
        const contact = await civicrm.getContact(id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(contact, null, 2),
            },
          ],
        };
      }

      case "get_contributions": {
        const { limit = 25, offset = 0 } = args as { limit?: number; offset?: number };
        const contributions = await civicrm.getContributions(limit, offset);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(contributions, null, 2),
            },
          ],
        };
      }

      case "get_contributions_by_contact": {
        const { contact_id } = args as { contact_id: number };
        const contributions = await civicrm.getContributionsByContact(contact_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(contributions, null, 2),
            },
          ],
        };
      }

      case "get_contribution_stats": {
        const stats = await civicrm.getContributionStats();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      case "get_events": {
        const { limit = 25, offset = 0 } = args as { limit?: number; offset?: number };
        const events = await civicrm.getEvents(limit, offset);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(events, null, 2),
            },
          ],
        };
      }

      case "get_upcoming_events": {
        const { limit = 10 } = args as { limit?: number };
        const events = await civicrm.getUpcomingEvents(limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(events, null, 2),
            },
          ],
        };
      }

      case "get_overall_stats": {
        const stats = await civicrm.getOverallStats();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      case "get_cases": {
        const { limit = 25, offset = 0, status_filter, date_filter } = args as { 
          limit?: number; 
          offset?: number; 
          status_filter?: string; 
          date_filter?: string; 
        };
        const cases = await civicrm.getCases(limit, offset, status_filter, date_filter);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cases, null, 2),
            },
          ],
        };
      }

      case "get_case_by_id": {
        const { case_id } = args as { case_id: number };
        const caseDetails = await civicrm.getCaseById(case_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(caseDetails, null, 2),
            },
          ],
        };
      }

      case "get_cases_by_contact": {
        const { contact_id } = args as { contact_id: number };
        const cases = await civicrm.getCasesByContact(contact_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cases, null, 2),
            },
          ],
        };
      }

      case "get_cases_by_role": {
        const { contact_id, role_type } = args as { contact_id: number; role_type: 'client' | 'case_coordinator' | 'case_manager' };
        const cases = await civicrm.getCasesByRole(contact_id, role_type);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cases, null, 2),
            },
          ],
        };
      }

      case "get_case_contacts": {
        const { case_id } = args as { case_id: number };
        const contacts = await civicrm.getCaseContacts(case_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(contacts, null, 2),
            },
          ],
        };
      }

      case "get_case_activities": {
        const { case_id, limit = 25 } = args as { case_id: number; limit?: number };
        const activities = await civicrm.getCaseActivities(case_id, limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(activities, null, 2),
            },
          ],
        };
      }

      case "get_open_cases_by_coordinator": {
        const { coordinator_id } = args as { coordinator_id: number };
        const cases = await civicrm.getOpenCasesByCoordinator(coordinator_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cases, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CiviCRM MCP Server running on stdio");
}

main().catch(console.error);