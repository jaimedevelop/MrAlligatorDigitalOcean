// pages/ProjectDetailsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { PhotoGallery } from '../components/PhotoGallery';
import { Calendar, MapPin, Clock, PenTool as Tool, CheckCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { Project } from '../types';

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { getProjectById } = useProjects();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const projectData = await getProjectById(id);
        setProject(projectData);
        if (!projectData) {
          throw new Error('Project not found');
        }
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch project details'));
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, getProjectById]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error ? `Error: ${error.message}` : 'The requested project could not be found.'}
          </p>
          <Link
            to="/projects"
            className="text-blue-900 hover:text-blue-700 flex items-center gap-2 justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const seo = {
    title: project.title,
    description: project.description,
    keywords: ["plumbing project", project.category.toLowerCase(), "case study", "plumbing services"]
  };

  return (
    <>
      <SEOHead seo={seo} />

      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <Link
          to="/projects"
          className="text-blue-900 hover:text-blue-700 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative h-[400px]">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${project.imageUrl})`,
            backgroundPosition: "center",
            backgroundSize: "cover"
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="container mx-auto px-4 h-full flex items-end pb-12 relative z-10">
          <div className="text-white">
            <div className="inline-block bg-blue-900 text-white px-4 py-1 rounded-full text-sm mb-4">
              {project.category}
            </div>
            <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
            <p className="text-xl max-w-2xl">{project.description}</p>
          </div>
        </div>
      </section>

      {/* Project Details */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Challenge, Solution, Outcome */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Project Overview</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">The Challenge</h3>
                    <p className="text-gray-700">{project.projectDetails.challenge}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Our Solution</h3>
                    <p className="text-gray-700">{project.projectDetails.solution}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">The Outcome</h3>
                    <p className="text-gray-700">{project.projectDetails.outcome}</p>
                  </div>
                </div>
              </div>

              {/* Photo Gallery */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Project Gallery</h2>
                <PhotoGallery photos={project.gallery} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Project Highlights */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Project Highlights</h3>
                <ul className="space-y-3">
                  {project.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-blue-900" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Project Details */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-blue-900" />
                    <span>Completed: {project.completionDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-5 h-5 text-blue-900" />
                    <span>Duration: {project.specifications.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-blue-900" />
                    <span>Location: {project.specifications.location}</span>
                  </div>
                </div>
              </div>

              {/* Services & Materials */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Services Provided</h4>
                    <ul className="space-y-2">
                      {project.specifications.services.map((service, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-700">
                          <Tool className="w-4 h-4 text-blue-900" />
                          {service}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Materials Used</h4>
                    <ul className="space-y-2">
                      {project.specifications.materials.map((material, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-700">
                          <ChevronRight className="w-4 h-4 text-blue-900" />
                          {material}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-blue-900 text-white p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Need Similar Work?</h3>
                <p className="mb-4">
                  We're ready to help with your plumbing project. Contact us for a free consultation.
                </p>
                <div className="space-y-2">
                  <Link
                    to="/contact"
                    className="block text-center bg-white text-blue-900 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Contact Us
                  </Link>
                  <Link
                    to="/schedule"
                    className="block text-center border border-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
                  >
                    Schedule Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}