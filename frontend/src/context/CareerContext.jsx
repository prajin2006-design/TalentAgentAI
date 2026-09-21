import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { profileAPI, aiAPI, jobsAPI, resumeAPI } from '../services/api';
import { normalizeReadiness } from '../utils/userHelpers';

const CareerContext = createContext(null);

export const CareerProvider = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [resume, setResume] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);

  // AI & Analysis State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [profileScore, setProfileScore] = useState(75);
  const [jobMatches, setJobMatches] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);
  const [careerPath, setCareerPath] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Chat assistant state
  const [chatMessages, setChatMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatAbortRef = useRef(null);

  // Load real data when user authenticates
  const loadCareerData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setSkills([]);
      setEducation([]);
      setExperience([]);
      setProjects([]);
      setResume(null);
      setProfileCompletion(0);
      setAiAnalysis(null);
      setHasAnalysis(false);
      setProfileScore(0);
      setJobMatches([]);
      setSkillGaps([]);
      setCareerPath([]);
      setChatMessages([]);
      setConversationId(null);
      setChatError('');
      return;
    }

    let loadedProfile = {};
    try {
      const pData = await profileAPI.getProfile();
      if (pData) {
        loadedProfile = pData.profile || {};
        setProfile(loadedProfile);
        setSkills(Array.isArray(pData.skills) ? pData.skills : []);
        setEducation(Array.isArray(pData.education) ? pData.education : []);
        setExperience(Array.isArray(pData.experience) ? pData.experience : []);
        setProjects(Array.isArray(pData.projects) ? pData.projects : []);
        setResume(pData.resume || null);
        setProfileCompletion(normalizeReadiness(pData.profile_completion));
        setProfileScore(normalizeReadiness(loadedProfile.readiness_score || 75));
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    }

    try {
      const aiData = await aiAPI.getAnalysis();
      if (aiData?.has_analysis && aiData?.analysis) {
        setAiAnalysis(aiData.analysis);
        setHasAnalysis(true);
        setProfileScore(normalizeReadiness(aiData.analysis.readiness_score || loadedProfile.readiness_score || 75));
        setJobMatches(Array.isArray(aiData.analysis.job_matches) ? aiData.analysis.job_matches : []);
        setSkillGaps(Array.isArray(aiData.analysis.skill_gaps) ? aiData.analysis.skill_gaps : []);
        setCareerPath(Array.isArray(aiData.analysis.career_roadmap) ? aiData.analysis.career_roadmap : []);
      } else {
        setHasAnalysis(false);
        const jData = await jobsAPI.getJobs();
        if (jData?.jobs) {
          setJobMatches(Array.isArray(jData.jobs) ? jData.jobs : []);
        }
      }
    } catch (aiErr) {
      console.warn('AI analysis load deferred:', aiErr);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadCareerData();
  }, [loadCareerData]);

  // Profile Mutations
  const updateProfile = async (updatedData) => {
    const res = await profileAPI.updateProfile(updatedData);
    setProfile((prev) => ({ ...(prev || {}), ...updatedData }));
    if (res?.profile_completion !== undefined) {
      setProfileCompletion(normalizeReadiness(res.profile_completion));
    }
    return res;
  };

  const addSkill = async (skillData) => {
    const res = await profileAPI.addSkill(skillData);
    if (res?.skill) {
      setSkills((prev) => [...prev, res.skill]);
    }
    await loadCareerData();
    return res;
  };

  const deleteSkill = async (id) => {
    await profileAPI.deleteSkill(id);
    setSkills((prev) => prev.filter((s) => s.id !== id));
    await loadCareerData();
  };

  const addEducation = async (eduData) => {
    const res = await profileAPI.addEducation(eduData);
    await loadCareerData();
    return res;
  };

  const deleteEducation = async (id) => {
    await profileAPI.deleteEducation(id);
    setEducation((prev) => prev.filter((e) => e.id !== id));
    await loadCareerData();
  };

  const addProject = async (projData) => {
    const res = await profileAPI.addProject(projData);
    await loadCareerData();
    return res;
  };

  const deleteProject = async (id) => {
    await profileAPI.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await loadCareerData();
  };

  const addExperience = async (expData) => {
    const res = await profileAPI.addExperience(expData);
    await loadCareerData();
    return res;
  };

  const deleteExperience = async (id) => {
    await profileAPI.deleteExperience(id);
    setExperience((prev) => prev.filter((e) => e.id !== id));
    await loadCareerData();
  };

  const uploadResume = async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await resumeAPI.uploadPDF(formData);
    if (res?.resume) {
      setResume(res.resume);
    }
    await loadCareerData();
    return res;
  };

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await aiAPI.analyzeProfile();
      if (res?.analysis) {
        setAiAnalysis(res.analysis);
        setHasAnalysis(true);
        setProfileScore(normalizeReadiness(res.analysis.readiness_score || 75));
        setJobMatches(Array.isArray(res.analysis.job_matches) ? res.analysis.job_matches : []);
        setSkillGaps(Array.isArray(res.analysis.skill_gaps) ? res.analysis.skill_gaps : []);
        setCareerPath(Array.isArray(res.analysis.career_roadmap) ? res.analysis.career_roadmap : []);
      }
      return res;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSaveJob = async (jobId) => {
    try {
      const res = await jobsAPI.toggleSaveJob(jobId);
      setJobMatches((prev) =>
        prev.map((j) => (j.id === jobId || j.jobId === jobId ? { ...j, saved: res?.saved } : j))
      );
      return res;
    } catch (e) {
      console.error('Failed to toggle save job:', e);
    }
  };

  const applyToJob = async (jobId) => {
    try {
      const res = await jobsAPI.applyToJob(jobId);
      setJobMatches((prev) =>
        prev.map((j) => (j.id === jobId || j.jobId === jobId ? { ...j, applied: true, applicationStatus: 'Submitted', application_status: 'Submitted' } : j))
      );
      return res;
    } catch (err) {
      console.error('Failed to apply to job:', err);
      throw err;
    }
  };

  // Conversational AI Assistant
  const sendMessageToAI = async (queryText, isRegenerate = false) => {
    const text = (queryText || '').trim();
    if (!text || isChatLoading) return;

    if (!isRegenerate) {
      const userMsg = {
        id: Date.now(),
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, userMsg]);
    } else {
      setChatMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].sender === 'ai' && prev[prev.length - 1].isError) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }

    setIsChatLoading(true);
    setChatError('');
    chatAbortRef.current = new AbortController();

    try {
      const res = await aiAPI.askAssistant(text, conversationId, chatAbortRef.current.signal);
      setConversationId(res?.conversation_id);
      const replyContent = res?.response || res?.message || 'Thank you for your question. How else can I assist with your career path?';
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      if (err.name === 'AbortError') return;
      const errorText = err.message || 'AI service error occurred. Please try again.';
      setChatError(errorText);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: errorText,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
      chatAbortRef.current = null;
    }
  };

  const stopChatGeneration = () => chatAbortRef.current?.abort();

  const clearChat = () => {
    setChatMessages([]);
    setConversationId(null);
    setChatError('');
  };

  const loadChatConversation = async (id) => {
    try {
      const result = await aiAPI.getConversation(id);
      setConversationId(id);
      setChatError('');
      if (Array.isArray(result?.messages)) {
        setChatMessages(result.messages.map((message) => ({
          id: message.id,
          sender: (message.role === 'assistant' || message.sender === 'ai') ? 'ai' : 'user',
          text: message.content || message.message || '',
          timestamp: message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
        })));
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
  };

  return (
    <CareerContext.Provider
      value={{
        user,
        logout,
        isAuthenticated,
        profile,
        skills,
        education,
        experience,
        projects,
        resume,
        profileCompletion,
        hasProfile: !!profile && profileCompletion > 0,
        hasAnalysis,
        profileScore,
        jobs: jobMatches,
        jobMatches,
        skillGaps,
        careerPath,
        aiAnalysis,
        isAnalyzing,
        chatMessages,
        conversationId,
        isChatLoading,
        chatError,
        updateProfile,
        addSkill,
        deleteSkill,
        addEducation,
        deleteEducation,
        addProject,
        deleteProject,
        addExperience,
        deleteExperience,
        uploadResume,
        runAiAnalysis,
        toggleSaveJob,
        applyToJob,
        sendMessageToAI,
        clearChat,
        stopChatGeneration,
        loadChatConversation,
        refreshCareerData: loadCareerData
      }}
    >
      {children}
    </CareerContext.Provider>
  );
};

export const useCareer = () => {
  const context = useContext(CareerContext);
  if (!context) {
    throw new Error('useCareer must be used within a CareerProvider');
  }
  return context;
};

export default CareerContext;
