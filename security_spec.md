# NOSIF WORLDS Security Specification (Phase 0)

## 1. Data Invariants
1. **Single-Vendor Catalog Integrity**: Only verified administrators (`isAdmin()`) may create, update, or delete documents in `/products/{productId}`, `/articles/{articleId}`, and `/siteContent/{docId}`.
2. **PII Isolation**: `/users/{userId}` and `/users/{userId}/wishlist/{itemId}` contain private customer data and may only be read or written by `request.auth.uid == userId` (or `isAdmin()` for user reads).
3. **Order Ownership & Terminal Locking**: An order in `/orders/{orderId}` can only be created by a verified user with `incoming().userId == request.auth.uid`, initial `fulfillmentStatus == 'pending'`, and `paymentStatus in ['pending_gateway', 'cod_pending']`. Customers cannot forge `'verified'` payment status or `'delivered'` fulfillment status, nor update orders once created; only `isAdmin()` may transition order statuses, and orders in terminal `'delivered'` or `'cancelled'` states are locked from non-admin mutation.
4. **Review Moderation**: Verified users may create `/reviews/{reviewId}` with `incoming().userId == request.auth.uid` and `rating >= 1 && rating <= 5`. Non-admins cannot inject `'hidden'` or arbitrary shadow fields, and only approved reviews (`resource.data.status == 'approved'`) or the author's own reviews / admin reads are exposed.
5. **Admin Privilege Protection**: Non-admin users cannot create or modify `/admins/{adminId}` or inject `role`/`isAdmin` shadow keys into `/users/{userId}`.
6. **Temporal & ID Integrity**: All document IDs match `^[a-zA-Z0-9_\-]+$` (max 128 chars). All `createdAt`/`updatedAt` fields must equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection on User Profile**: `{ "uid": "u1", "displayName": "A", "email": "a@b.com", "isAdmin": true, "createdAt": "<time>", "updatedAt": "<time>" }` -> Rejected by `hasOnly(...)`.
2. **Order Payment Spoofing**: `{ ..., "userId": "u1", "paymentStatus": "verified", "fulfillmentStatus": "delivered" }` on create -> Rejected by create state constraint.
3. **Order Ownership Spoofing**: `{ ..., "userId": "victim_uid" }` created by attacker -> Rejected by `incoming().userId == request.auth.uid`.
4. **Non-Admin Product Price Tampering**: Non-admin attempts `updateDoc('/products/p1', { priceBdt: 1 })` -> Rejected by `isAdmin()`.
5. **Unverified Email Admin Spoof**: Token with `email == 'aminulislamnosif84@gmail.com'` and `email_verified == false` -> Rejected by `request.auth.token.email_verified == true`.
6. **Cross-User PII Read**: Authenticated user `u2` reads `/users/u1` -> Rejected by `isOwner(userId)`.
7. **Cross-User Order List Scraping**: Authenticated user `u2` runs `getDocs(collection(db, 'orders'))` without matching `userId` -> Rejected by `allow list: if isAdmin() || resource.data.userId == request.auth.uid`.
8. **ID Poisoning (2KB Document ID)**: `setDoc(doc(db, 'orders', 'A'.repeat(2048)), ...)` -> Rejected by `isValidId(orderId)`.
9. **Oversized String Exhaustion**: Review comment > 1500 chars -> Rejected by `.size() <= 1500`.
10. **Client Timestamp Forgery**: Creating an order with `createdAt: Timestamp.fromMillis(0)` -> Rejected by `incoming().createdAt == request.time`.
11. **Self-Granted Admin Document**: Attacker writes `/admins/attackerUid` -> Rejected by `isAdmin()`.
12. **Hidden Review Creation by Customer**: Customer creates review with `status: 'hidden'` or invalid `rating: 99` -> Rejected by `isValidReview()`.
