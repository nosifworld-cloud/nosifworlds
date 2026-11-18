/**
 * Phase 0: Security TDD Specification for NOSIF WORLDS Firestore Rules
 * Verifies that all 12 adversarial "Dirty Dozen" payloads result in PERMISSION_DENIED.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'create' | 'update' | 'get' | 'list';
  expectedOutcome: 'PERMISSION_DENIED';
  description: string;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on User Profile',
    collectionPath: '/users/user_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Rejects isAdmin/role shadow keys via strict hasOnly() schema blueprint.',
  },
  {
    id: 2,
    name: 'Order Payment Status Forgery on Create',
    collectionPath: '/orders/ord_fake_paid',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Blocks clients from creating orders with paymentStatus=verified or fulfillmentStatus=delivered.',
  },
  {
    id: 3,
    name: 'Order Ownership Spoofing',
    collectionPath: '/orders/ord_spoof_uid',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Blocks creating an order where userId != request.auth.uid.',
  },
  {
    id: 4,
    name: 'Non-Admin Product Price Tampering',
    collectionPath: '/products/prod_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Only verified admins can mutate products.',
  },
  {
    id: 5,
    name: 'Unverified Email Admin Spoof',
    collectionPath: '/products/prod_new',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Bootstrapped admin check enforces email_verified == true.',
  },
  {
    id: 6,
    name: 'Cross-User PII Profile Read',
    collectionPath: '/users/victim_uid',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Prevents authenticated non-owners from reading another customer PII.',
  },
  {
    id: 7,
    name: 'Cross-User Order Collection Scraping',
    collectionPath: '/orders',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Enforces resource.data.userId == request.auth.uid on list queries.',
  },
  {
    id: 8,
    name: 'Oversized Document ID Poisoning',
    collectionPath: '/orders/' + 'X'.repeat(300),
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'isValidId() caps document IDs at 128 alphanumeric/dash/underscore chars.',
  },
  {
    id: 9,
    name: 'Oversized Payload Exhaustion',
    collectionPath: '/reviews/rev_1',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Enforces strict max string lengths on all text properties.',
  },
  {
    id: 10,
    name: 'Client Timestamp Forgery',
    collectionPath: '/orders/ord_backdated',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Requires createdAt == request.time and updatedAt == request.time.',
  },
  {
    id: 11,
    name: 'Self-Assigned Admin Escalation',
    collectionPath: '/admins/attacker_uid',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Only existing verified admins may grant admin documents.',
  },
  {
    id: 12,
    name: 'Out-of-Range Review Rating',
    collectionPath: '/reviews/rev_bad_rating',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    description: 'Enforces integer rating between 1 and 5.',
  },
];
