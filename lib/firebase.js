import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'

// â”€â”€ Firebase Config â”€â”€
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// â”€â”€ Initialize (prevent duplicate init) â”€â”€
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db   = getFirestore(app)

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// COLLECTION NAMES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export const COLLECTIONS = {
  USERS:        'users',        // admin + member accounts
  MEMBERS:      'members',      // member profiles
  ENTRIES:      'entries',      // monthly deposit entries
  PROJECTS:     'projects',     // investment projects
  TRANSACTIONS: 'transactions', // all financial transactions
  SADAQAH:      'sadaqah',      // sadaqah fund records
  EXPENSES:     'expenses',     // group expenses
  CASH_AUDIT:   'cashAudit',    // cash audit entries
  SETTINGS:     'settings',     // app settings
  ADMINS:       'admins',       // admin profiles
  NOTIFICATIONS:'notifications',// pending approvals
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// GENERIC HELPERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Get single document
export async function getDocument(collectionName, docId) {
  try {
    const ref  = doc(db, collectionName, docId)
    const snap = await getDoc(ref)
    if (snap.exists()) return { id: snap.id, ...snap.data() }
    return null
  } catch (e) {
    console.error('getDocument error:', e)
    return null
  }
}

// Get all documents from collection
export async function getCollection(collectionName, conditions = []) {
  try {
    const ref = collection(db, collectionName)
    let q = ref
    if (conditions.length > 0) {
      q = query(ref, ...conditions)
    }
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('getCollection error:', e)
    return []
  }
}

// Add new document (auto ID)
export async function addDocument(collectionName, data) {
  try {
    const ref = collection(db, collectionName)
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (e) {
    console.error('addDocument error:', e)
    throw e
  }
}

// Set document (specific ID)
export async function setDocument(collectionName, docId, data) {
  try {
    const ref = doc(db, collectionName, docId)
    await setDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch (e) {
    console.error('setDocument error:', e)
    throw e
  }
}

// Update document
export async function updateDocument(collectionName, docId, data) {
  try {
    const ref = doc(db, collectionName, docId)
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (e) {
    console.error('updateDocument error:', e)
    throw e
  }
}

// Delete document
export async function deleteDocument(collectionName, docId) {
  try {
    const ref = doc(db, collectionName, docId)
    await deleteDoc(ref)
    return true
  } catch (e) {
    console.error('deleteDocument error:', e)
    throw e
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MEMBERS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getAllMembers() {
  return getCollection(COLLECTIONS.MEMBERS, [
    orderBy('joinDate', 'asc')
  ])
}

export async function getMemberById(memberId) {
  return getDocument(COLLECTIONS.MEMBERS, memberId)
}

export async function addMember(memberData) {
  return addDocument(COLLECTIONS.MEMBERS, memberData)
}

export async function updateMember(memberId, data) {
  return updateDocument(COLLECTIONS.MEMBERS, memberId, data)
}

export async function deleteMember(memberId) {
  return deleteDocument(COLLECTIONS.MEMBERS, memberId)
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ENTRIES (Monthly deposits)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getEntriesByMember(memberId) {
  return getCollection(COLLECTIONS.ENTRIES, [
    where('memberId', '==', memberId),
    orderBy('year', 'asc'),
    orderBy('monthIndex', 'asc')
  ])
}

export async function getEntriesByMonth(year, monthIndex) {
  return getCollection(COLLECTIONS.ENTRIES, [
    where('year', '==', year),
    where('monthIndex', '==', monthIndex)
  ])
}

export async function addEntry(entryData) {
  return addDocument(COLLECTIONS.ENTRIES, entryData)
}

// Bulk entry
export async function addBulkEntries(entries) {
  const promises = entries.map(e => addDocument(COLLECTIONS.ENTRIES, e))
  return Promise.all(promises)
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PROJECTS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getAllProjects() {
  return getCollection(COLLECTIONS.PROJECTS, [
    orderBy('startDate', 'desc')
  ])
}

export async function getProjectById(projectId) {
  return getDocument(COLLECTIONS.PROJECTS, projectId)
}

export async function addProject(projectData) {
  return addDocument(COLLECTIONS.PROJECTS, projectData)
}

export async function updateProject(projectId, data) {
  return updateDocument(COLLECTIONS.PROJECTS, projectId, data)
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TRANSACTIONS (Profit, Capital, etc.)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getTransactionsByMember(memberId) {
  return getCollection(COLLECTIONS.TRANSACTIONS, [
    where('memberId', '==', memberId),
    orderBy('date', 'desc')
  ])
}

export async function getTransactionsByProject(projectId) {
  return getCollection(COLLECTIONS.TRANSACTIONS, [
    where('projectId', '==', projectId),
    orderBy('date', 'desc')
  ])
}

export async function addTransaction(txnData) {
  return addDocument(COLLECTIONS.TRANSACTIONS, txnData)
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SADAQAH
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getSadaqahEntries() {
  return getCollection(COLLECTIONS.SADAQAH, [
    orderBy('date', 'desc')
  ])
}

export async function addSadaqahEntry(data) {
  return addDocument(COLLECTIONS.SADAQAH, data)
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXPENSES
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getExpenses() {
  return getCollection(COLLECTIONS.EXPENSES, [
    orderBy('date', 'desc')
  ])
}

export async function addExpense(data) {
  return addDocument(COLLECTIONS.EXPENSES, data)
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CASH AUDIT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getCashAuditEntries() {
  return getCollection(COLLECTIONS.CASH_AUDIT, [
    orderBy('date', 'desc')
  ])
}

export async function addCashAuditEntry(data) {
  return addDocument(COLLECTIONS.CASH_AUDIT, data)
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SETTINGS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getSettings() {
  return getDocument(COLLECTIONS.SETTINGS, 'main')
}

export async function updateSettings(data) {
  return setDocument(COLLECTIONS.SETTINGS, 'main', data)
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// NOTIFICATIONS (Payment Approvals)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getPendingApprovals() {
  return getCollection(COLLECTIONS.NOTIFICATIONS, [
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  ])
}

export async function addPaymentRequest(data) {
  return addDocument(COLLECTIONS.NOTIFICATIONS, {
    ...data,
    status: 'pending',
  })
}

export async function approvePayment(notifId, entryData) {
  // 1. Mark notification as approved
  await updateDocument(COLLECTIONS.NOTIFICATIONS, notifId, {
    status: 'approved'
  })
  // 2. Add the actual entry
  await addDocument(COLLECTIONS.ENTRIES, entryData)
  return true
}

export async function rejectPayment(notifId) {
  return updateDocument(COLLECTIONS.NOTIFICATIONS, notifId, {
    status: 'rejected'
  })
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DASHBOARD STATS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getDashboardStats() {
  try {
    const [members, entries, projects, transactions, expenses] = await Promise.all([
      getAllMembers(),
      getCollection(COLLECTIONS.ENTRIES),
      getAllProjects(),
      getCollection(COLLECTIONS.TRANSACTIONS),
      getExpenses(),
    ])

    const activeMembers = members.filter(m => m.status === 'active')
    const totalDeposit  = entries.reduce((sum, e) => sum + (e.amount || 0), 0)
    const totalSadaqah  = entries.reduce((sum, e) => sum + (e.sadaqah || 0), 0)
    const totalSavings  = totalDeposit - totalSadaqah
    const totalInvest   = projects.reduce((sum, p) => sum + (p.totalInvest || 0), 0)
    const totalProfit   = transactions
      .filter(t => t.type === 'profit')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

    // Calculate total due
    const now = new Date()
    const groupStart = new Date(2022, 9, 1) // Oct 2022
    const totalMonths = Math.floor(
      (now.getFullYear() - groupStart.getFullYear()) * 12 +
      (now.getMonth() - groupStart.getMonth())
    ) + 1

    let totalDue = 0
    activeMembers.forEach(member => {
      const memberEntries = entries.filter(e => e.memberId === member.id)
      const paid = memberEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
      const joinDate = member.joinDate?.toDate ? member.joinDate.toDate() : new Date(member.joinDate)
      const memberMonths = member.joinType === 'A'
        ? totalMonths
        : Math.floor(
            (now.getFullYear() - joinDate.getFullYear()) * 12 +
            (now.getMonth() - joinDate.getMonth())
          ) + 1
      const expected = memberMonths * (member.monthlyAmount || 1000)
      const due = Math.max(0, expected - paid)
      totalDue += due
    })

    return {
      activeMembers: activeMembers.length,
      totalDeposit,
      totalSadaqah,
      totalSavings,
      totalInvest,
      totalProfit,
      totalExpenses,
      totalDue,
      netBalance: totalSavings + totalProfit - totalExpenses - totalInvest,
    }
  } catch (e) {
    console.error('getDashboardStats error:', e)
    return {}
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MEMBER LEDGER CALCULATION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getMemberLedger(memberId) {
  try {
    const [member, entries, transactions] = await Promise.all([
      getMemberById(memberId),
      getEntriesByMember(memberId),
      getTransactionsByMember(memberId),
    ])

    if (!member) return null

    const now = new Date()
    const groupStart = new Date(2022, 9, 1)
    const joinDate = member.joinDate?.toDate
      ? member.joinDate.toDate()
      : new Date(member.joinDate)

    const totalMonths = Math.floor(
      (now.getFullYear() - groupStart.getFullYear()) * 12 +
      (now.getMonth() - groupStart.getMonth())
    ) + 1

    const memberMonths = member.joinType === 'A'
      ? totalMonths
      : Math.floor(
          (now.getFullYear() - joinDate.getFullYear()) * 12 +
          (now.getMonth() - joinDate.getMonth())
        ) + 1

    const totalDeposit  = entries.reduce((s, e) => s + (e.amount || 0), 0)
    const totalSadaqah  = entries.reduce((s, e) => s + (e.sadaqah || 0), 0)
    const netSavings    = totalDeposit - totalSadaqah
    const totalProfit   = transactions
      .filter(t => t.type === 'profit')
      .reduce((s, t) => s + (t.netAmount || 0), 0)
    const totalInvest   = transactions
      .filter(t => t.type === 'invest')
      .reduce((s, t) => s + (t.amount || 0), 0)
    const capitalReturn = transactions
      .filter(t => t.type === 'capitalReturn')
      .reduce((s, t) => s + (t.amount || 0), 0)
    const currentInvest = totalInvest - capitalReturn

    const expected  = memberMonths * (member.monthlyAmount || 1000)
    const due       = Math.max(0, expected - totalDeposit)
    const advance   = Math.max(0, totalDeposit - expected)

    const totalBalance = netSavings + totalProfit + currentInvest

    return {
      member,
      entries,
      transactions,
      summary: {
        totalDeposit,
        totalSadaqah,
        netSavings,
        totalProfit,
        currentInvest,
        capitalReturn,
        totalBalance,
        due,
        advance,
        memberMonths,
        monthsPaid: entries.length,
      }
    }
  } catch (e) {
    console.error('getMemberLedger error:', e)
    return null
  }
}

// Export everything
export {
  app, auth, db,
  collection, doc, getDoc, getDocs,
  setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit,
  serverTimestamp, onSnapshot
}
