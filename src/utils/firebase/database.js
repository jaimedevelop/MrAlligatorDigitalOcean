/*database.js*/

import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    addDoc
  } from 'firebase/firestore';
  import app from './config';
  
  // Initialize Firestore
  const db = getFirestore(app);
  
  /**
   * Dispatch custom events for different operations
   * @param {string} operation - The operation type (created, updated, deleted)
   * @param {string} collection - The collection name
   * @param {string} docId - The document ID (optional)
   */
  const dispatchDatabaseEvent = (operation, collection, docId = null) => {
    // Dispatch specific collection events
    const collectionEvent = `${collection}${operation.charAt(0).toUpperCase() + operation.slice(1)}`;
    window.dispatchEvent(new CustomEvent(collectionEvent, { 
      detail: { collection, operation, docId } 
    }));
    
    // Dispatch generic database event
    window.dispatchEvent(new CustomEvent('databaseUpdated', { 
      detail: { collection, operation, docId } 
    }));
  };
  
  /**
   * Create or update a document in a collection
   * @param {string} collectionName - Collection name
   * @param {string} docId - Document ID
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Success status
   */
  export const setDocument = async (collectionName, docId, data) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date()
      }, { merge: true });
      
      // Dispatch update event
      dispatchDatabaseEvent('updated', collectionName, docId);
      
      return { success: true };
    } catch (error) {
      console.error(`[Firestore] Error setting document in ${collectionName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  /**
   * Add a new document to a collection
   * @param {string} collectionName - Collection name
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Success status with document ID
   */
  export const addDocument = async (collectionName, data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Dispatch create event
      dispatchDatabaseEvent('created', collectionName, docRef.id);
      
      return { 
        success: true, 
        id: docRef.id 
      };
    } catch (error) {
      console.error(`[Firestore] Error adding document to ${collectionName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  /**
   * Get a document from a collection
   * @param {string} collectionName - Collection name
   * @param {string} docId - Document ID
   * @returns {Promise<Object>} Document data or null
   */
  export const getDocument = async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          success: true,
          data: { id: docSnap.id, ...docSnap.data() }
        };
      } else {
        return {
          success: false,
          error: 'Document not found'
        };
      }
    } catch (error) {
      console.error(`[Firestore] Error getting document from ${collectionName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  /**
   * Get all documents from a collection
   * @param {string} collectionName - Collection name
   * @returns {Promise<Array>} Array of documents
   */
  export const getAllDocuments = async (collectionName) => {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return {
        success: true,
        data: documents
      };
    } catch (error) {
      console.error(`[Firestore] Error getting all documents from ${collectionName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  /**
   * Update a document in a collection
   * @param {string} collectionName - Collection name
   * @param {string} docId - Document ID
   * @param {Object} data - Document data to update
   * @returns {Promise<Object>} Success status
   */
  export const updateDocument = async (collectionName, docId, data) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      
      // Dispatch update event
      dispatchDatabaseEvent('updated', collectionName, docId);
      
      return { success: true };
    } catch (error) {
      console.error(`[Firestore] Error updating document in ${collectionName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  /**
   * Delete a document from a collection
   * @param {string} collectionName - Collection name
   * @param {string} docId - Document ID
   * @returns {Promise<Object>} Success status
   */
  export const deleteDocument = async (collectionName, docId) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      
      // Dispatch delete event
      dispatchDatabaseEvent('deleted', collectionName, docId);
      
      return { success: true };
    } catch (error) {
      console.error(`[Firestore] Error deleting document from ${collectionName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  /**
   * Query documents from a collection
   * @param {string} collectionName - Collection name
   * @param {Array} conditions - Array of where conditions [field, operator, value]
   * @param {string} orderByField - Field to order by
   * @param {string} orderDirection - Order direction ('asc' or 'desc')
   * @param {number} limitCount - Limit number of results
   * @returns {Promise<Array>} Array of documents
   */
  export const queryDocuments = async (
    collectionName, 
    conditions = [], 
    orderByField = null, 
    orderDirection = 'asc', 
    limitCount = null
  ) => {
    try {
      let q = collection(db, collectionName);
      
      // Add where conditions
      if (conditions && conditions.length > 0) {
        conditions.forEach(condition => {
          q = query(q, where(condition[0], condition[1], condition[2]));
        });
      }
      
      // Add orderBy
      if (orderByField) {
        q = query(q, orderBy(orderByField, orderDirection));
      }
      
      // Add limit
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      return {
        success: true,
        data: documents
      };
    } catch (error) {
      console.error(`[Firestore] Error querying documents from ${collectionName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Export the db instance if needed
  export { db };