// src/firebase/services/projectsService.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  setDocument, 
  getDocument, 
  getAllDocuments, 
  updateDocument, 
  deleteDocument,
  queryDocuments
} from '../utils/firebase/database';
import { uploadImage } from './imageUploadService';
import { Project, ProjectFormData } from '../types/types';

// Collection name constant
const COLLECTION_NAME = 'projects';

// Logging utility
const logOperation = (operation, details) => {
  console.log(`[Projects Service ${operation}]`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};

/**
 * Get all projects
 * @returns {Promise<Project[]>} Array of projects
 */
export async function getAllProjects() {
  try {
    logOperation('getAllProjects', { starting: true });
    
    const result = await getAllDocuments(COLLECTION_NAME);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch projects');
    }
    
    // Process projects with proper data validation
    const projects = result.data.map((doc, index) => {
      try {
        // Validate date format
        const completionDateStr = doc.completionDate || new Date().toISOString().split('T')[0];
        const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(completionDateStr);
        
        return {
          id: doc.id,
          title: doc.title || 'Untitled Project',
          description: doc.description || '',
          category: doc.category || 'Residential',
          image: doc.image || '',
          imageUrl: doc.imageUrl || doc.image || '',
          completionDate: isValidDate ? completionDateStr : new Date().toISOString().split('T')[0],
          highlights: Array.isArray(doc.highlights) ? doc.highlights : [],
          type: doc.type || 'Unknown',
          details: doc.details || '',
          tableOnly: doc.tableOnly || false,
          specifications: {
            duration: '', 
            location: '', 
            services: [], 
            materials: [],
            ...(doc.specifications || {})
          },
          projectDetails: {
            challenge: '', 
            solution: '', 
            outcome: '',
            ...(doc.projectDetails || {})
          },
          gallery: Array.isArray(doc.gallery) ? doc.gallery : []
        };
      } catch (processError) {
        console.error(`[Projects Service Error] Error processing project at index ${index}:`, processError);
        // Return null for failed items, which will be filtered out
        return null;
      }
    }).filter(project => project !== null);
    
    logOperation('getAllProjects', { success: true, count: projects.length });
    return projects;
  } catch (error) {
    console.error(`[Projects Service Error] getAllProjects:`, error);
    throw error;
  }
}

/**
 * Get project by ID
 * @param {string} id - Project ID
 * @returns {Promise<Project|null>} Project or null if not found
 */
export async function getProjectById(id) {
  try {
    logOperation('getProjectById', { id });
    
    const result = await getDocument(COLLECTION_NAME, id);
    
    if (!result.success) {
      if (result.error === 'Document not found') {
        logOperation('getProjectById', { notFound: true, id });
        return null;
      }
      throw new Error(result.error || `Failed to fetch project with ID: ${id}`);
    }
    
    const doc = result.data;
    
    // Validate date format
    const completionDateStr = doc.completionDate || new Date().toISOString().split('T')[0];
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(completionDateStr);
    
    // Format and return the project with all required fields
    const project = {
      id: doc.id,
      title: doc.title || 'Untitled Project',
      description: doc.description || '',
      category: doc.category || 'Residential',
      image: doc.image || '',
      imageUrl: doc.imageUrl || doc.image || '',
      completionDate: isValidDate ? completionDateStr : new Date().toISOString().split('T')[0],
      highlights: Array.isArray(doc.highlights) ? doc.highlights : [],
      type: doc.type || 'Unknown',
      details: doc.details || '',
      tableOnly: doc.tableOnly || false,
      specifications: {
        duration: '', 
        location: '', 
        services: [], 
        materials: [],
        ...(doc.specifications || {})
      },
      projectDetails: {
        challenge: '', 
        solution: '', 
        outcome: '',
        ...(doc.projectDetails || {})
      },
      gallery: Array.isArray(doc.gallery) ? doc.gallery : []
    };
    
    logOperation('getProjectById', { success: true, id });
    return project;
  } catch (error) {
    console.error(`[Projects Service Error] getProjectById:`, error);
    throw error;
  }
}

/**
 * Save project (create or update)
 * @param {Project} project - Project data
 * @returns {Promise<Project>} Saved project
 */
export async function saveProject(project) {
  try {
    logOperation('saveProject', { id: project.id });
    
    const docId = project.id || Date.now().toString();
    
    // Prepare project data, ensuring all required fields
    const projectData = {
      ...project,
      id: docId,
      updatedAt: new Date().toISOString()
    };
    
    // Set or update the document
    const result = await setDocument(
      COLLECTION_NAME, 
      docId, 
      projectData
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save project');
    }
    
    // Fetch the saved project to return
    const savedResult = await getDocument(COLLECTION_NAME, docId);
    
    if (!savedResult.success) {
      throw new Error(savedResult.error || 'Project saved but failed to retrieve');
    }
    
    logOperation('saveProject', { success: true, id: docId });
    return savedResult.data;
  } catch (error) {
    console.error(`[Projects Service Error] saveProject:`, error);
    throw error;
  }
}

/**
 * Delete project
 * @param {string} id - Project ID
 * @returns {Promise<void>}
 */
export async function deleteProject(id) {
  try {
    logOperation('deleteProject', { id });
    
    const result = await deleteDocument(COLLECTION_NAME, id);
    
    if (!result.success) {
      throw new Error(result.error || `Failed to delete project with ID: ${id}`);
    }
    
    logOperation('deleteProject', { success: true, id });
  } catch (error) {
    console.error(`[Projects Service Error] deleteProject:`, error);
    throw error;
  }
}

// React Query Hooks

/**
 * Hook to fetch all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects
  });
}

/**
 * Hook to fetch a single project by ID
 * @param {string} id - Project ID
 */
export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id),
    enabled: !!id
  });
}

/**
 * Hook to save a project with image handling
 */
export function useSaveProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectData) => {
      try {
        // Handle new main image upload if present
        if (projectData.newImage) {
          const imageUrl = await uploadImage(projectData.newImage);
          projectData.image = imageUrl;
        }
        
        // Handle gallery image uploads if present
        if (projectData.gallery) {
          const updatedGallery = await Promise.all(
            projectData.gallery.map(async (item) => {
              if (item.file) {
                const imageUrl = await uploadImage(item.file);
                return {
                  url: imageUrl,
                  caption: item.caption
                };
              }
              return item;
            })
          );
          projectData.gallery = updatedGallery;
        }
        
        // Remove the newImage property as it's not needed in the database
        delete projectData.newImage;
        
        // Clean up gallery data
        let finalGallery = [];
        if (projectData.gallery) {
          finalGallery = projectData.gallery
            .map(item => ({ 
              url: item.url || '', 
              caption: item.caption || '' 
            }))
            .filter(item => item.url); // Filter out items without URLs
        }
        
        // Construct the final project object
        const projectToSave = {
          ...(projectData),
          gallery: finalGallery
        };
        
        // Save the project
        const savedProject = await saveProject(projectToSave);
        return savedProject;
      } catch (error) {
        console.error('Error saving project:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });
}