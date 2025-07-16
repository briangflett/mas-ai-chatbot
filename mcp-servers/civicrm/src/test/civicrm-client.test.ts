import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CiviCRMClient } from '../civicrm-client'

describe('CiviCRMClient', () => {
  let client: CiviCRMClient
  
  beforeEach(() => {
    client = new CiviCRMClient({
      cvPath: '/mock/cv',
      settingsPath: '/mock/settings.php'
    })
  })

  describe('buildCvApi4Command', () => {
    it('should build correct API4 command', () => {
      const command = client['buildCvApi4Command']('Contact', 'get', {
        select: ['id', 'display_name'],
        limit: 10
      })
      
      expect(command).toContain('api4 Contact.get')
      expect(command).toContain('{"select":["id","display_name"],"limit":10}')
    })
  })

  describe('Contact operations', () => {
    beforeEach(() => {
      vi.spyOn(client, 'api4Call').mockResolvedValue([
        { id: 1, display_name: 'John Doe', email: 'john@example.com' },
        { id: 2, display_name: 'Jane Smith', email: 'jane@example.com' }
      ])
    })

    it('should get contacts with correct parameters', async () => {
      const contacts = await client.getContacts(25, 0)
      
      expect(client.api4Call).toHaveBeenCalledWith('Contact', 'get', {
        select: ['id', 'contact_type', 'display_name', 'first_name', 'last_name', 'email', 'phone', 'organization_name', 'created_date', 'modified_date'],
        limit: 25,
        offset: 0
      })
      
      expect(contacts).toHaveLength(2)
      expect(contacts[0]).toMatchObject({
        id: 1,
        display_name: 'John Doe',
        email: 'john@example.com'
      })
    })

    it('should search contacts with LIKE query', async () => {
      await client.searchContacts('John', 10)
      
      expect(client.api4Call).toHaveBeenCalledWith('Contact', 'get', {
        select: ['id', 'contact_type', 'display_name', 'first_name', 'last_name', 'email', 'phone', 'organization_name'],
        where: [['display_name', 'LIKE', '%John%']],
        limit: 10
      })
    })

    it('should get single contact by ID', async () => {
      vi.spyOn(client, 'api4Call').mockResolvedValue([
        { id: 1, display_name: 'John Doe', email: 'john@example.com' }
      ])
      
      const contact = await client.getContact(1)
      
      expect(client.api4Call).toHaveBeenCalledWith('Contact', 'get', {
        select: ['id', 'contact_type', 'display_name', 'first_name', 'last_name', 'email', 'phone', 'organization_name', 'created_date', 'modified_date'],
        where: [['id', '=', 1]],
        limit: 1
      })
      
      expect(contact).toMatchObject({
        id: 1,
        display_name: 'John Doe',
        email: 'john@example.com'
      })
    })

    it('should return null for non-existent contact', async () => {
      vi.spyOn(client, 'api4Call').mockResolvedValue([])
      
      const contact = await client.getContact(999)
      
      expect(contact).toBeNull()
    })
  })

  describe('Case operations', () => {
    beforeEach(() => {
      vi.spyOn(client, 'api4Call').mockImplementation(async (entity, action, params) => {
        if (entity === 'Case') {
          return [
            { id: 1, subject: 'Test Case', status_id: 1, case_type_id: 1 }
          ]
        }
        if (entity === 'CaseType') {
          return [{ id: 1, title: 'Service Request' }]
        }
        if (entity === 'OptionValue') {
          return [{ value: 1, label: 'Active' }]
        }
        return []
      })
    })

    it('should get cases with status filtering', async () => {
      await client.getCases(10, 0, '1', '2024-01-01')
      
      expect(client.api4Call).toHaveBeenCalledWith('Case', 'get', {
        select: ['id', 'case_type_id', 'subject', 'status_id', 'priority_id', 'start_date', 'end_date', 'created_date', 'modified_date', 'details'],
        where: [
          ['is_deleted', '=', false],
          ['status_id', '=', '1'],
          ['start_date', '>=', '2024-01-01']
        ],
        limit: 10,
        offset: 0
      })
    })

    it('should enrich cases with type and status names', async () => {
      const cases = await client.getCases(10, 0)
      
      expect(cases[0]).toMatchObject({
        id: 1,
        subject: 'Test Case',
        case_type: 'Service Request',
        status: 'Active'
      })
    })

    it('should get case by ID', async () => {
      const caseData = await client.getCaseById(1)
      
      expect(client.api4Call).toHaveBeenCalledWith('Case', 'get', {
        select: ['id', 'case_type_id', 'subject', 'status_id', 'priority_id', 'start_date', 'end_date', 'created_date', 'modified_date', 'details'],
        where: [['id', '=', 1]],
        limit: 1
      })
      
      expect(caseData).toMatchObject({
        id: 1,
        subject: 'Test Case',
        case_type: 'Service Request',
        status: 'Active'
      })
    })
  })

  describe('Relationship-based case queries', () => {
    beforeEach(() => {
      vi.spyOn(client, 'api4Call').mockImplementation(async (entity, action, params) => {
        if (entity === 'Relationship') {
          return [
            {
              case_id: 1,
              contact_id_b: 2,
              'contact_id_b.sort_name': 'Client Name',
              'case_id.subject': 'Test Project'
            }
          ]
        }
        return []
      })
    })

    it('should get cases by coordinator role', async () => {
      const cases = await client.getCasesByRole(1, 'case_coordinator')
      
      expect(client.api4Call).toHaveBeenCalledWith('Relationship', 'get', {
        select: ['*', 'contact_id_b.sort_name', 'case_id.subject'],
        where: [
          ['relationship_type_id', '=', 9],
          ['contact_id_a', '=', 1],
          ['is_active', '=', true]
        ],
        limit: 25
      })
      
      expect(cases).toHaveLength(1)
      expect(cases[0]).toMatchObject({
        id: '1',
        subject: 'Test Project',
        client_name: 'Client Name',
        client_id: 2
      })
    })

    it('should return empty array for client role with no cases', async () => {
      vi.spyOn(client, 'getCasesByContact').mockResolvedValue([])
      
      const cases = await client.getCasesByRole(1, 'client')
      
      expect(cases).toHaveLength(0)
    })
  })

  describe('Statistics operations', () => {
    it('should get overall stats using API4', async () => {
      vi.spyOn(client, 'api4Call').mockImplementation(async (entity, action, params) => {
        return Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }))
      })
      
      vi.spyOn(client, 'getContributionStats').mockResolvedValue({
        total_contributions: 25,
        total_amount: 5000,
        completed_contributions: 20,
        pending_contributions: 5
      })
      
      const stats = await client.getOverallStats()
      
      expect(stats).toMatchObject({
        total_contacts: 10,
        total_contributions: 25,
        total_contribution_amount: 5000,
        completed_contributions: 20,
        active_events: 10,
        total_cases: 10
      })
    })
  })

  describe('Error handling', () => {
    it('should handle API4 call failures', async () => {
      vi.spyOn(client, 'api4Call').mockRejectedValue(new Error('API call failed'))
      
      await expect(client.getContacts()).rejects.toThrow('API call failed')
    })

    it('should handle empty results gracefully', async () => {
      vi.spyOn(client, 'api4Call').mockResolvedValue([])
      
      const contacts = await client.getContacts()
      expect(contacts).toHaveLength(0)
    })
  })
})