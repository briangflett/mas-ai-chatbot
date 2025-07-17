import { tool } from 'ai';
import { z } from 'zod';
import { CiviCRMClient } from './civicrm-client';

const config = {
  cvPath: process.env.CIVICRM_CV_PATH || '/home/brian/buildkit/bin/cv',
  settingsPath: process.env.CIVICRM_SETTINGS_PATH || '/home/brian/buildkit/build/masdemo/web/wp-content/uploads/civicrm/civicrm.settings.php',
};

const civicrm = new CiviCRMClient(config);

export const getContacts = tool({
  description: 'Get a list of contacts from CiviCRM',
  inputSchema: z.object({
    limit: z.number().default(25).describe('Maximum number of contacts to return'),
    offset: z.number().default(0).describe('Number of contacts to skip'),
  }),
  execute: async ({ limit, offset }) => {
    try {
      const contacts = await civicrm.getContacts(limit, offset);
      return {
        success: true,
        data: contacts,
        count: contacts.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const searchContacts = tool({
  description: 'Search for contacts by name in CiviCRM',
  inputSchema: z.object({
    query: z.string().describe('Search query for contact names'),
    limit: z.number().default(25).describe('Maximum number of contacts to return'),
  }),
  execute: async ({ query, limit }) => {
    try {
      const contacts = await civicrm.searchContacts(query, limit);
      return {
        success: true,
        data: contacts,
        count: contacts.length,
        query,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getContact = tool({
  description: 'Get detailed information about a specific contact',
  inputSchema: z.object({
    id: z.number().describe('Contact ID'),
  }),
  execute: async ({ id }) => {
    try {
      const contact = await civicrm.getContact(id);
      return {
        success: true,
        data: contact,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getContributions = tool({
  description: 'Get a list of contributions/donations from CiviCRM',
  inputSchema: z.object({
    limit: z.number().default(25).describe('Maximum number of contributions to return'),
    offset: z.number().default(0).describe('Number of contributions to skip'),
  }),
  execute: async ({ limit, offset }) => {
    try {
      const contributions = await civicrm.getContributions(limit, offset);
      return {
        success: true,
        data: contributions,
        count: contributions.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getContributionsByContact = tool({
  description: 'Get contributions for a specific contact',
  inputSchema: z.object({
    contact_id: z.number().describe('Contact ID'),
  }),
  execute: async ({ contact_id }) => {
    try {
      const contributions = await civicrm.getContributionsByContact(contact_id);
      return {
        success: true,
        data: contributions,
        count: contributions.length,
        contact_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getContributionStats = tool({
  description: 'Get overall contribution statistics from CiviCRM',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const stats = await civicrm.getContributionStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getEvents = tool({
  description: 'Get a list of events from CiviCRM',
  inputSchema: z.object({
    limit: z.number().default(25).describe('Maximum number of events to return'),
    offset: z.number().default(0).describe('Number of events to skip'),
  }),
  execute: async ({ limit, offset }) => {
    try {
      const events = await civicrm.getEvents(limit, offset);
      return {
        success: true,
        data: events,
        count: events.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getUpcomingEvents = tool({
  description: 'Get upcoming events from CiviCRM',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Maximum number of events to return'),
  }),
  execute: async ({ limit }) => {
    try {
      const events = await civicrm.getUpcomingEvents(limit);
      return {
        success: true,
        data: events,
        count: events.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getCases = tool({
  description: 'Get a list of cases/projects from CiviCRM',
  inputSchema: z.object({
    limit: z.number().default(25).describe('Maximum number of cases to return'),
    offset: z.number().default(0).describe('Number of cases to skip'),
    status_filter: z.string().optional().describe('Filter by case status ID'),
    date_filter: z.string().optional().describe('Filter by start date (YYYY-MM-DD format)'),
  }),
  execute: async ({ limit, offset, status_filter, date_filter }) => {
    try {
      const cases = await civicrm.getCases(limit, offset, status_filter, date_filter);
      return {
        success: true,
        data: cases,
        count: cases.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getOverallStats = tool({
  description: 'Get overall CiviCRM statistics (contacts, contributions, events, cases)',
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const stats = await civicrm.getOverallStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getCasesByRole = tool({
  description: 'Get cases by role relationship (client, case_coordinator, case_manager) for a contact',
  inputSchema: z.object({
    contact_id: z.number().describe('Contact ID'),
    role_type: z.enum(['client', 'case_coordinator', 'case_manager']).describe('Role type relationship to cases'),
  }),
  execute: async ({ contact_id, role_type }) => {
    try {
      const cases = await civicrm.getCasesByRole(contact_id, role_type);
      return {
        success: true,
        data: cases,
        count: cases.length,
        contact_id,
        role_type,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const findContactByEmail = tool({
  description: 'Find a contact by their email address',
  inputSchema: z.object({
    email: z.string().email().describe('Email address to search for'),
  }),
  execute: async ({ email }) => {
    try {
      const contact = await civicrm.findContactByEmail(email);
      
      return {
        success: true,
        data: contact,
        query: email,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

export const getMyCasesAsCoordinator = ({ session, dataStream }: any) => tool({
  description: 'Get cases where the current logged-in user is the Case Coordinator - automatically finds user by session email',
  inputSchema: z.object({}),
  execute: async ({}) => {
    try {
      // Get the user's email from their session
      if (!session?.user?.email) {
        return {
          success: false,
          error: 'User not logged in or email not available in session',
        };
      }

      // Find the user's contact record in CiviCRM
      const contact = await civicrm.findContactByEmail(session.user.email);
      if (!contact) {
        return {
          success: false,
          error: `No CiviCRM contact found for email: ${session.user.email}`,
        };
      }

      // Get cases where this contact is the coordinator
      const cases = await civicrm.getCasesByRole(parseInt(contact.id.toString()), 'case_coordinator');
      
      return {
        success: true,
        data: cases,
        count: cases.length,
        user_email: session.user.email,
        contact_id: contact.id,
        contact_name: contact.display_name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});