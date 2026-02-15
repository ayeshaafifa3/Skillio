import { api } from './api';

export interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
  created_at: string;
}

export interface Session {
  id: number;
  mode: string;
  difficulty: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface SessionDetail {
  session_id: number;
  mode: string;
  difficulty: string;
  title: string;
  job_description: string;
  resume_text: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export class InterviewChatService {
  /**
   * Get the most recent interview session
   */
  static async getLatestSession(): Promise<SessionDetail> {
    try {
      const response = await api.get('/interview/session/latest');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch latest session:', error);
      throw error;
    }
  }

  /**
   * Start a new interview chat session
   */
  static async startSession(
    jobDescription: string,
    mode: 'programming' | 'hr' = 'programming',
    resumeText: string = '',
    title: string = 'New Interview',
    difficulty: string = 'beginner'
  ) {
    try {
      const response = await api.post('/interview/session/start', {
        job_description: jobDescription,
        mode: mode,
        resume_text: resumeText,
        title: title,
        difficulty: difficulty,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for current user
   */
  static async getSessions(): Promise<Session[]> {
    try {
      const response = await api.get('/interview/sessions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      throw error;
    }
  }

  /**
   * Get all messages in a specific session
   */
  static async getSessionMessages(sessionId: number): Promise<SessionDetail> {
    try {
      const response = await api.get(`/interview/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch session messages:', error);
      throw error;
    }
  }

  /**
   * Send a user message and get AI response
   */
  static async sendMessage(
    sessionId: number,
    message: string
  ): Promise<Message> {
    try {
      const response = await api.post('/interview/message', {
        session_id: sessionId,
        message: message,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Delete an interview session
   */
  static async deleteSession(sessionId: number): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/interview/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }
}
