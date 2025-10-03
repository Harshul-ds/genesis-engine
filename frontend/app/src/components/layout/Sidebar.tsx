import React, { useState, useEffect } from 'react';
import { useAgentStore } from '../../lib/agent-store';
import styles from './Sidebar.module.css';
// You'll need an icon library, e.g., `npm install react-icons`
import { FaHistory, FaSave, FaBars, FaTimes } from 'react-icons/fa';

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, []);
  const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');
  const { sessionHistory, savedPrompts } = useAgentStore();

  return (
    <div className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.toggleButton} onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <FaTimes /> : <FaBars />}
      </div>

      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FaHistory />
              History
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'saved' ? styles.active : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <FaSave />
              Saved
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'history' && (
              <div className={styles.historySection}>
                <h4>Session History</h4>
                <div className={styles.historyList}>
                  {sessionHistory.length === 0 ? (
                    <p className={styles.empty}>No sessions yet</p>
                  ) : (
                    sessionHistory.map((event, index) => (
                      <div key={index} className={styles.historyItem}>
                        <span className={styles.timestamp}>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                        <p className={styles.eventText}>{event.payload.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'saved' && (
              <div className={styles.savedSection}>
                <h4>Saved Prompts</h4>
                <div className={styles.savedList}>
                  {savedPrompts.length === 0 ? (
                    <p className={styles.empty}>No saved prompts</p>
                  ) : (
                    savedPrompts.map((prompt, index) => (
                      <div key={index} className={styles.savedItem}>
                        <h5>{prompt.title}</h5>
                        <p className={styles.savedContent}>{prompt.content.substring(0, 100)}...</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
