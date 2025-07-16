import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

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

export interface CiviCRMCaseContact {
  case_id: number;
  contact_id: number;
  relationship_type_id: number;
  relationship_type: string;
  contact_name: string;
  contact_email?: string;
}

export interface CiviCRMActivity {
  id: number;
  activity_type_id: number;
  activity_type: string;
  subject: string;
  details?: string;
  activity_date_time: string;
  status_id: number;
  status: string;
  priority_id?: number;
  priority?: string;
  source_contact_id: number;
  source_contact_name?: string;
  target_contact_id?: number;
  target_contact_name?: string;
  assignee_contact_id?: number;
  assignee_contact_name?: string;
  case_id?: number;
  created_date: string;
  modified_date: string;
}

export class CiviCRMClient {
  private config: CiviCRMConfig;

  constructor(config: CiviCRMConfig) {
    this.config = config;
  }

  private buildCvCommand(entity: string, action: string, params: any = {}) {
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(' ');
    
    return `CIVICRM_SETTINGS=${this.config.settingsPath} ${this.config.cvPath} api ${entity}.${action} ${paramString}`;
  }

  private buildCvApi4Command(entity: string, action: string, params: any = {}) {
    const paramString = JSON.stringify(params);
    return `CIVICRM_SETTINGS=${this.config.settingsPath} ${this.config.cvPath} api4 ${entity}.${action} '${paramString}'`;
  }

  async apiCall(entity: string, action: string, params: any = {}) {
    try {
      const command = this.buildCvCommand(entity, action, params);
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.error('CiviCRM CV stderr:', stderr);
      }
      
      // Parse the output
      if (action === 'getcount') {
        return { result: parseInt(stdout.trim()) };
      }
      
      try {
        const result = JSON.parse(stdout.trim());
        return { values: result.values || result };
      } catch (parseError) {
        console.error('Failed to parse CiviCRM response:', stdout);
        throw new Error(`Failed to parse CiviCRM response: ${parseError}`);
      }
    } catch (error) {
      console.error('CiviCRM API call failed:', error);
      throw error;
    }
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
      select: ['id', 'contact_type', 'display_name', 'first_name', 'last_name', 'email', 'phone', 'organization_name'],
      where: [['display_name', 'LIKE', `%${query}%`]],
      limit
    });
    return result as CiviCRMContact[];
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
      const amount = parseFloat(contrib.total_amount?.toString() || '0');
      return sum + (isNaN(amount) ? 0 : amount);
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
      caseTypeMap.set(parseInt(type.id), type.title);
    });

    const statusMap = new Map();
    caseStatuses.forEach((status: any) => {
      statusMap.set(parseInt(status.value), status.label);
    });

    // Enrich cases with type and status names
    return cases.map(caseItem => ({
      ...caseItem,
      case_type: caseTypeMap.get(parseInt(caseItem.case_type_id.toString())) || 'Unknown',
      status: statusMap.get(parseInt(caseItem.status_id.toString())) || 'Unknown',
    }));
  }

  async getCaseById(caseId: number): Promise<CiviCRMCase | null> {
    const result = await this.api4Call('Case', 'get', {
      select: ['id', 'case_type_id', 'subject', 'status_id', 'priority_id', 'start_date', 'end_date', 'created_date', 'modified_date', 'details'],
      where: [['id', '=', caseId]],
      limit: 1
    });
    
    if (result.length === 0) return null;

    const caseItem = result[0];
    
    // Get case type and status
    const [caseTypes, caseStatuses] = await Promise.all([
      this.api4Call('CaseType', 'get', { 
        select: ['id', 'title'],
        where: [['id', '=', caseItem.case_type_id]]
      }),
      this.api4Call('OptionValue', 'get', { 
        select: ['value', 'label'],
        where: [
          ['option_group_id', '=', 'case_status'],
          ['value', '=', caseItem.status_id]
        ]
      })
    ]);

    const caseType = caseTypes.length > 0 ? caseTypes[0] : null;
    const status = caseStatuses.length > 0 ? caseStatuses[0] : null;

    return {
      ...caseItem,
      case_type: caseType?.title || 'Unknown',
      status: status?.label || 'Unknown',
    };
  }

  async getCasesByContact(contactId: number, relationshipType?: string): Promise<CiviCRMCase[]> {
    // Get case contacts for the specified contact
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

  async getCasesByRole(contactId: number, roleType: 'client' | 'case_coordinator' | 'case_manager'): Promise<CiviCRMCase[]> {
    // Different approaches based on role type
    if (roleType === 'client') {
      return this.getCasesByContact(contactId);
    }

    // For case coordinator/manager, we need to look at relationships using API4
    // Relationship type 9 is typically "Case Coordinator"
    const relationshipTypeId = roleType === 'case_coordinator' ? 9 : 10; // Assuming 10 for case_manager
    
    console.log('API4 Relationship query parameters:', {
      entity: 'Relationship',
      action: 'get',
      params: {
        select: ['*', 'contact_id_b.sort_name', 'case_id.subject'],
        where: [
          ['relationship_type_id', '=', relationshipTypeId],
          ['contact_id_a', '=', contactId],
          ['is_active', '=', true]
        ],
        limit: 25
      }
    });

    const relationships = await this.api4Call('Relationship', 'get', {
      select: ['*', 'contact_id_b.sort_name', 'case_id.subject'],
      where: [
        ['relationship_type_id', '=', relationshipTypeId],
        ['contact_id_a', '=', contactId],
        ['is_active', '=', true]
      ],
      limit: 25
    });

    console.log('API4 Relationship query result:', relationships);

    if (!relationships || relationships.length === 0) {
      console.log('No relationships found');
      return [];
    }

    const caseIds = relationships
      .map((rel: any) => rel.case_id.toString()) // Convert to string to match case.id
      .filter((caseId: any) => caseId); // Filter out null/undefined case_ids

    console.log('Case IDs from relationships:', caseIds);

    if (caseIds.length === 0) {
      return [];
    }
    
    // Instead of filtering through all cases, construct case objects directly from relationship data
    console.log('Building cases from relationship data...');
    const casesFromRelationships = relationships.map((rel: any) => ({
      id: rel.case_id.toString(),
      case_type_id: null, // We don't have this from the relationship query
      subject: rel['case_id.subject'],
      status_id: null, // We don't have this from the relationship query
      start_date: null,
      end_date: null,
      created_date: null,
      modified_date: null,
      case_type: 'Service Request', // Default, could be enriched later
      status: 'Active', // Default, could be enriched later
      client_name: rel['contact_id_b.sort_name'],
      client_id: rel.contact_id_b
    }));
    
    console.log('Cases from relationships:', casesFromRelationships.length);
    return casesFromRelationships as CiviCRMCase[];
  }

  async getCaseContacts(caseId: number): Promise<CiviCRMCaseContact[]> {
    const result = await this.api4Call('CaseContact', 'get', {
      select: ['case_id', 'contact_id'],
      where: [['case_id', '=', caseId]]
    });

    if (!result || result.length === 0) {
      return [];
    }

    const caseContacts = result as any[];
    
    // Get contact details for each case contact
    const contacts = await Promise.all(
      caseContacts.map(async (cc) => {
        const contact = await this.getContact(cc.contact_id);
        return {
          case_id: cc.case_id,
          contact_id: cc.contact_id,
          relationship_type_id: 0, // This would need to be determined based on actual relationship
          relationship_type: 'Client', // Default, would need proper mapping
          contact_name: contact?.display_name || 'Unknown',
          contact_email: contact?.email,
        };
      })
    );

    return contacts;
  }

  async getCaseActivities(caseId: number, limit = 25): Promise<CiviCRMActivity[]> {
    const result = await this.api4Call('Activity', 'get', {
      select: ['id', 'activity_type_id', 'subject', 'details', 'activity_date_time', 'status_id', 'priority_id', 'source_contact_id', 'target_contact_id', 'assignee_contact_id', 'created_date', 'modified_date'],
      where: [['case_id', '=', caseId]],
      limit
    });

    const activities = result as CiviCRMActivity[];
    
    // Get activity types and statuses
    const [activityTypes, activityStatuses] = await Promise.all([
      this.api4Call('OptionValue', 'get', { 
        select: ['value', 'label'],
        where: [['option_group_id', '=', 'activity_type']]
      }),
      this.api4Call('OptionValue', 'get', { 
        select: ['value', 'label'],
        where: [['option_group_id', '=', 'activity_status']]
      })
    ]);

    const typeMap = new Map();
    activityTypes.forEach((type: any) => {
      typeMap.set(parseInt(type.value), type.label);
    });

    const statusMap = new Map();
    activityStatuses.forEach((status: any) => {
      statusMap.set(parseInt(status.value), status.label);
    });

    // Enrich activities
    return activities.map(activity => ({
      ...activity,
      activity_type: typeMap.get(parseInt(activity.activity_type_id.toString())) || 'Unknown',
      status: statusMap.get(parseInt(activity.status_id.toString())) || 'Unknown',
    }));
  }

  async getOpenCasesByCoordinator(coordinatorId: number): Promise<CiviCRMCase[]> {
    // Get open cases where the coordinator is assigned
    const openCases = await this.getCases(100, 0, '1'); // Assuming status 1 is 'Open'
    
    // Filter by coordinator - this is a simplified approach
    // In a real implementation, you'd need to check case roles properly
    return openCases.filter(c => c.manager_id === coordinatorId);
  }

  // General statistics (updated to include cases)
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