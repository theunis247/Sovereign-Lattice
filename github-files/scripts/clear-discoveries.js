/**
 * Script to clear all discoveries from the current user's profile
 * Run this in the browser console or as a standalone script
 */

// Database configuration
const DB_NAME = 'QuantumSecureLattice_v8';
const DB_VERSION = 1;
const STORE_USERS = 'users';

/**
 * Get IndexedDB database
 */
function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => {
      console.error('IndexedDB Error:', e);
      reject('Database access failed');
    };
  });
}

/**
 * Get user object by address
 */
async function getUserObject(address) {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_USERS, 'readonly');
      const store = transaction.objectStore(STORE_USERS);
      const request = store.get(address);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Save user object
 */
async function saveUser(user) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_USERS, 'readwrite');
    const store = transaction.objectStore(STORE_USERS);
    const request = store.put(user);
    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => {
      console.error('saveUser Error:', e);
      reject('Database write failed');
    };
  });
}

/**
 * Clear all discoveries from the current user
 */
async function clearCurrentUserDiscoveries() {
  try {
    console.log('🔍 Looking for active user...');
    
    // Get active user address from localStorage
    const activeAddr = localStorage.getItem('LATTICE_ACTIVE_ADDR');
    if (!activeAddr) {
      console.error('❌ No active user found. Please log in first.');
      return false;
    }

    console.log(`📋 Found active user address: ${activeAddr}`);

    // Get user data
    const user = await getUserObject(activeAddr);
    if (!user) {
      console.error('❌ User data not found.');
      return false;
    }

    console.log(`👤 User found: ${user.username}`);
    console.log(`📊 Current discoveries: ${user.solvedBlocks?.length || 0}`);

    if (!user.solvedBlocks || user.solvedBlocks.length === 0) {
      console.log('✅ No discoveries to clear.');
      return true;
    }

    // Clear all solved blocks
    const discoveryCount = user.solvedBlocks.length;
    const updatedUser = {
      ...user,
      solvedBlocks: [] // Clear all discoveries
    };

    // Save updated user
    await saveUser(updatedUser);
    
    console.log(`✅ Successfully cleared ${discoveryCount} discoveries from ${user.username}'s profile.`);
    console.log('🔄 Please refresh the page to see the changes.');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clear discoveries:', error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🗑️  CLEAR DISCOVERIES SCRIPT');
  console.log('============================');
  console.log('⚠️  WARNING: This will permanently remove ALL your breakthrough discoveries!');
  console.log('⚠️  This action cannot be undone!');
  console.log('');
  
  // Ask for confirmation
  const confirmed = confirm(
    'Are you sure you want to permanently delete ALL your discoveries?\n\n' +
    'This action cannot be undone and will:\n' +
    '• Remove all breakthrough discoveries\n' +
    '• Make your certificates inaccessible\n' +
    '• Affect your profile statistics\n\n' +
    'Click OK to proceed or Cancel to abort.'
  );

  if (!confirmed) {
    console.log('❌ Operation cancelled by user.');
    return;
  }

  console.log('🚀 Starting discovery clearing process...');
  const success = await clearCurrentUserDiscoveries();
  
  if (success) {
    console.log('');
    console.log('🎉 DISCOVERIES CLEARED SUCCESSFULLY!');
    console.log('🔄 Please refresh the page to see the changes.');
    
    // Ask if user wants to refresh automatically
    const shouldRefresh = confirm('Would you like to refresh the page now?');
    if (shouldRefresh) {
      window.location.reload();
    }
  } else {
    console.log('');
    console.log('❌ FAILED TO CLEAR DISCOVERIES');
    console.log('Please try again or contact support.');
  }
}

// Export functions for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    clearCurrentUserDiscoveries,
    getUserObject,
    saveUser
  };
} else {
  // Browser environment - make functions available globally
  window.clearDiscoveries = clearCurrentUserDiscoveries;
  window.clearDiscoveriesScript = main;
}

// Auto-run if this script is executed directly
if (typeof window !== 'undefined' && window.location) {
  console.log('🔧 Discovery clearing functions loaded.');
  console.log('💡 Run clearDiscoveriesScript() to start the clearing process.');
  console.log('💡 Or run clearDiscoveries() for direct clearing without prompts.');
}