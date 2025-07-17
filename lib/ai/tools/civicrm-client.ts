
import { promisify } from 'node:util';
import { exec } from 'node:child_process';

const execAsync = promisify(exec);

export interface CiviCRMConfig {
  cvPath: string;
  settingsPath: string;
}

export interface CiviCRMContact {
  id: number;
  contact_type: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  organization_name?: string;
  created_date?: string;
  modified_date?: string;
}

export interface CiviCRMContribution {
  id: number;
  contact_id: number;
  total_amount: number;
  currency: string;
  contribution_status: string;
  receive_date: string;
  source?: string;
  contribution_type?: string;
}

export interface CiviCRMEvent {
  id: number;
  title: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  max_participants?: number;
  participant_count?: number;
  is_active: boolean;
}

export interface CiviCRMCase {
  id: number;
  case_type_id: number;
  case_type: string;
  subject: string;
  status_id: number;
  status: string;
  priority_id?: number;
  priority?: string;
  start_date: string;
  end_date?: string;
  created_date: string;
  modified_date: string;
  details?: string;
  client_id: number;
  client_name?: string;
  manager_id?: number;
  manager_name?: string;
  is_deleted: boolean;
}

export class CiviCRMClient {
  private config: CiviCRMConfig;

  constructor(config: CiviCRMConfig) {
    this.config = config;
  }

  private buildCvApi4Command(entity: string, action: string, params: any = {}) {
    const paramString = JSON.stringify(params);
    return `CIVICRM_SETTINGS=${this.config.settingsPath} ${this.config.cvPath} api4 ${entity}.${action} '${paramString}'`;
  }

  async api4Call(entity: string, action: string, params: any = {}) {
    try {
      const command = this.buildCvApi4Command(entity, action, params);
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.error('CiviCRM CV API4 stderr:', stderr);
      }
      
      try {
        const result = JSON.parse(stdout.trim());
        return result; // API4 returns array directly
      } catch (parseError) {
        console.error('Failed to parse CiviCRM API4 response:', stdout);
        throw new Error(`Failed to parse CiviCRM API4 response: ${parseError}`);
      }
    } catch (error) {
      console.error('CiviCRM API4 call failed:', error);
      throw error;
    }
  }

  // Contact operations
  async getContacts(limit = 25, offset = 0): Promise<CiviCRMContact[]> {
    const result = await this.api4Call('Contact', 'get', {
      select: ['id', 'contact_type', 'display_name', 'first_name', 'last_name', 'email', 'phone', 'organization_name', 'created_date', 'modified_date'],
      limit,
      offset
    });
    return result as CiviCRMContact[];
  }

  async searchContacts(query: string, limit = 25): Promise<CiviCRMContact[]> {
    const result = await this.api4Call('Contact', 'get', {
      select: ['id', 'contact_type', 'display_name', 'first_name', 'last_name', 'email_primary.email', 'phone', 'organization_name'],
      where: [['display_name', 'LIKE', `%${query}%`]],
      limit
    });
    return result as CiviCRMContact[];
  }

  async findContactByEmail(email: string): Promise<CiviCRMContact | null> {
    const result = await this.api4Call('Contact', 'get', {
      select: ['id', 'contact_type', 'display_name', 'first_name', 'last_name', 'email_primary.email', 'phone', 'organization_name'],
      where: [['email_primary.email', '=', email]],
      limit: 1
    });
    return result.length > 0 ? result[0] as CiviCRMContact : null;
  }

  async getContact(id: number): Promise<CiviCRMContact | null> {
    const result = await this.api4Call('Contact', 'get', {
      select: ['id', 'contact_type', 'display_name', 'first_name', 'last_name', 'email', 'phone', 'organization_name', 'created_date', 'modified_date'],
      where: [['id', '=', id]],
      limit: 1
    });
    return result.length > 0 ? result[0] as CiviCRMContact : null;
  }

  // Contribution operations
  async getContributions(limit = 25, offset = 0): Promise<CiviCRMContribution[]> {
    const result = await this.api4Call('Contribution', 'get', {
      select: ['id', 'contact_id', 'total_amount', 'currency', 'contribution_status_id', 'receive_date', 'source', 'financial_type_id'],
      limit,
      offset
    });
    return result as CiviCRMContribution[];
  }

  async getContributionsByContact(contactId: number): Promise<CiviCRMContribution[]> {
    const result = await this.api4Call('Contribution', 'get', {
      select: ['id', 'contact_id', 'total_amount', 'currency', 'contribution_status_id', 'receive_date', 'source', 'financial_type_id'],
      where: [['contact_id', '=', contactId]]
    });
    return result as CiviCRMContribution[];
  }

  async getContributionStats() {
    const result = await this.api4Call('Contribution', 'get', {
      select: ['total_amount', 'currency', 'contribution_status_id', 'receive_date'],
      limit: 1000
    });
    
    const contributions = result as CiviCRMContribution[];
    const total = contributions.reduce((sum, contrib) => {
      const amount = Number.parseFloat(contrib.total_amount?.toString() || '0');
      return sum + (Number.isNaN(amount) ? 0 : amount);
    }, 0);
    const completed = contributions.filter(c => c.contribution_status === 'Completed').length;
    
    return {
      total_amount: total,
      total_contributions: contributions.length,
      completed_contributions: completed,
      pending_contributions: contributions.length - completed,
    };
  }

  // Event operations
  async getEvents(limit = 25, offset = 0): Promise<CiviCRMEvent[]> {
    const result = await this.api4Call('Event', 'get', {
      select: ['id', 'title', 'event_type_id', 'start_date', 'end_date', 'max_participants', 'participant_count', 'is_active'],
      limit,
      offset
    });
    return result as CiviCRMEvent[];
  }

  async getUpcomingEvents(limit = 10): Promise<CiviCRMEvent[]> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.api4Call('Event', 'get', {
      select: ['id', 'title', 'event_type_id', 'start_date', 'end_date', 'max_participants', 'participant_count', 'is_active'],
      where: [
        ['start_date', '>=', today],
        ['is_active', '=', true]
      ],
      limit
    });
    return result as CiviCRMEvent[];
  }

  // Case management operations
  async getCases(limit = 25, offset = 0, statusFilter?: string, dateFilter?: string): Promise<CiviCRMCase[]> {
    const where: any[] = [['is_deleted', '=', false]];

    if (statusFilter) {
      where.push(['status_id', '=', statusFilter]);
    }

    if (dateFilter) {
      where.push(['start_date', '>=', dateFilter]);
    }

    const result = await this.api4Call('Case', 'get', {
      select: ['id', 'case_type_id', 'subject', 'status_id', 'priority_id', 'start_date', 'end_date', 'created_date', 'modified_date', 'details'],
      where,
      limit,
      offset
    });
    
    const cases = result as CiviCRMCase[];
    
    // Get case types and statuses for enrichment
    const [caseTypes, caseStatuses] = await Promise.all([
      this.api4Call('CaseType', 'get', { select: ['id', 'title'] }),
      this.api4Call('OptionValue', 'get', { 
        select: ['value', 'label'],
        where: [['option_group_id', '=', 'case_status']]
      })
    ]);

    const caseTypeMap = new Map();
    caseTypes.forEach((type: any) => {
      caseTypeMap.set(Number.parseInt(type.id), type.title);
    });

    const statusMap = new Map();
    caseStatuses.forEach((status: any) => {
      statusMap.set(Number.parseInt(status.value), status.label);
    });

    // Enrich cases with type and status names
    return cases.map(caseItem => ({
      ...caseItem,
      case_type: caseTypeMap.get(Number.parseInt(caseItem.case_type_id.toString())) || 'Unknown',
      status: statusMap.get(Number.parseInt(caseItem.status_id.toString())) || 'Unknown',
    }));
  }

  async getCasesByRole(contactId: number, roleType: 'client' | 'case_coordinator' | 'case_manager'): Promise<CiviCRMCase[]> {
    // Different approaches based on role type
    if (roleType === 'client') {
      // For clients, get cases where they are case contacts
      const caseContacts = await this.api4Call('CaseContact', 'get', {
        select: ['case_id', 'contact_id'],
        where: [['contact_id', '=', contactId]]
      });

      if (!caseContacts || caseContacts.length === 0) {
        return [];
      }

      const caseIds = caseContacts.map((cc: any) => cc.case_id);
      
      // Get the actual cases
      const cases = await this.api4Call('Case', 'get', {
        select: ['id', 'case_type_id', 'subject', 'status_id', 'priority_id', 'start_date', 'end_date', 'created_date', 'modified_date', 'details'],
        where: [
          ['id', 'IN', caseIds],
          ['is_deleted', '=', false]
        ]
      });

      return cases as CiviCRMCase[];
    }

    // For case coordinator/manager, we need to look at relationships using API4
    // Relationship type 9 is typically "Case Coordinator", 10 for case_manager
    const relationshipTypeId = roleType === 'case_coordinator' ? 9 : 10;
    
    try {
      const relationships = await this.api4Call('Relationship', 'get', {
        select: ['*', 'contact_id_b.sort_name', 'case_id.subject'],
        where: [
          ['relationship_type_id', '=', relationshipTypeId],
          ['contact_id_a', '=', contactId],
          ['is_active', '=', true]
        ],
        limit: 25
      });

      if (!relationships || relationships.length === 0) {
        return [];
      }

      const caseIds = relationships
        .map((rel: any) => rel.case_id)
        .filter((caseId: any) => caseId); // Filter out null/undefined case_ids

      if (caseIds.length === 0) {
        return [];
      }
      
      // Get the actual case details
      const cases = await this.api4Call('Case', 'get', {
        select: ['id', 'case_type_id', 'subject', 'status_id', 'priority_id', 'start_date', 'end_date', 'created_date', 'modified_date', 'details'],
        where: [
          ['id', 'IN', caseIds],
          ['is_deleted', '=', false]
        ]
      });
      
      return cases as CiviCRMCase[];
    } catch (error) {
      console.error(`Error getting cases by role ${roleType} for contact ${contactId}:`, error);
      return [];
    }
  }

  // General statistics
  async getOverallStats() {
    const [contacts, contributions, events, cases] = await Promise.all([
      this.api4Call('Contact', 'get', { select: ['id'], limit: 999999 }),
      this.getContributionStats(),
      this.api4Call('Event', 'get', { select: ['id'], where: [['is_active', '=', true]], limit: 999999 }),
      this.api4Call('Case', 'get', { select: ['id'], where: [['is_deleted', '=', false]], limit: 999999 }),
    ]);

    return {
      total_contacts: contacts.length,
      total_contributions: contributions.total_contributions,
      total_contribution_amount: contributions.total_amount,
      completed_contributions: contributions.completed_contributions,
      active_events: events.length,
      total_cases: cases.length,
    };
  }
}