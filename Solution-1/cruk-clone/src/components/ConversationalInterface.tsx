import React, { useState, useEffect, useRef } from 'react';
import apiClient, { ChatMessage, AgentResponse, getMockUserId } from '../services/api';
import './ConversationalInterface.css';

interface ConversationalInterfaceProps {
  userId?: string;
  sessionId?: string;
  onClose?: () => void;
}

export const ConversationalInterface: React.FC<ConversationalInterfaceProps> = ({ 
  userId, 
  sessionId: initialSessionId,
  onClose 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(initialSessionId || `session-${Date.now()}`);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to WebSocket on mount
  useEffect(() => {
    const connectWS = async () => {
      try {
        await apiClient.connectWebSocket(userId);
        setIsConnected(true);

        // Register message handler
        const unsubscribe = apiClient.onWebSocketMessage((message: AgentResponse) => {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: message.text,
            timestamp: message.timestamp || new Date().toISOString(),
            metadata: message.uiComponents ? { uiComponents: message.uiComponents } : undefined
          };
          setMessages(prev => [...prev, assistantMessage]);
          setLoading(false);
        });

        // Send initial greeting
        const greeting: ChatMessage = {
          role: 'assistant',
          content: 'Hello! I\'m here to help you learn more about Cancer Research UK and how you can support our mission. What would you like to know?',
          timestamp: new Date().toISOString()
        };
        setMessages([greeting]);

        return () => {
          unsubscribe();
          apiClient.disconnectWebSocket();
        };
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
        setIsConnected(false);
      }
    };

    connectWS();

    return () => {
      apiClient.disconnectWebSocket();
    };
  }, [userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      if (isConnected) {
        // Send via WebSocket
        apiClient.sendWebSocketMessage({
          userId: userId || getMockUserId(),
          input: {
            text: inputText,
            timestamp: new Date().toISOString()
          },
          sessionId
        });
      } else {
        // Fallback to REST API
        const response = await apiClient.sendMessage(inputText, sessionId);
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.text,
          timestamp: response.timestamp || new Date().toISOString(),
          metadata: response.uiComponents ? { uiComponents: response.uiComponents } : undefined
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble responding right now. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInputText(action);
    inputRef.current?.focus();
  };

  return (
    <div className="conversational-interface">
      <div className="chat-header">
        <div className="chat-header-content">
          <h3>Chat with CRUK</h3>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">{isConnected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
        {onClose && (
          <button className="btn-close-chat" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.role}`}
          >
            <div className="message-avatar">
              {message.role === 'assistant' ? (
                <img src="/images/logo.svg" alt="CRUK" />
              ) : (
                <div className="user-avatar-placeholder">
                  {userId?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="message-content">
              <div className="message-bubble">
                {message.content}
              </div>
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              {message.metadata?.uiComponents && (
                <div className="message-ui-components">
                  {/* Render UI components here if needed */}
                  <p className="ui-component-placeholder">
                    [Interactive component would render here]
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message assistant">
            <div className="message-avatar">
              <img src="/images/logo.svg" alt="CRUK" />
            </div>
            <div className="message-content">
              <div className="message-bubble typing">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-quick-actions">
        <button 
          className="quick-action-btn"
          onClick={() => handleQuickAction('Tell me about cancer research')}
        >
          Cancer Research
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => handleQuickAction('How can I donate?')}
        >
          Donate
        </button>
        <button 
          className="quick-action-btn"
          onClick={() => handleQuickAction('Fundraising events')}
        >
          Events
        </button>
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="btn-send"
          disabled={!inputText.trim() || loading}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path 
              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};
