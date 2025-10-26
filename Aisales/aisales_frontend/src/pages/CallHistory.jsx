import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NavigationBar from '../components/NavigationBar';
import styles from './modules/CallHistory.module.css';
import { Search, Phone, PhoneIncoming, PhoneOutgoing, Bot, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CallHistory = () => {
    const [calls, setCalls] = useState([]);
    const [selectedCall, setSelectedCall] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleChatbotRedirect = (call) => {
        if (!call) {
            console.error('No call selected');
            return;
        }

        const orderId = call.orderId;
        if (!orderId) {
            console.error('No order ID available');
            return;
        }

        // Add more detailed logging
        console.log('Call details:', {
            id: call.id,
            orderId: orderId,
            fullCall: call
        });

        try {
            console.log('Attempting navigation to:', `/chat/${orderId}`);
            navigate(`/chat/${orderId}`);
        } catch (error) {
            console.error('Navigation error:', error);
        }
    };

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/calls/history', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // Debug log to see the structure including orderId
                console.log('API Response Data:', data);
                setCalls(data);
                if (data.length > 0) {
                    console.log('First call details:', {
                        id: data[0].id,
                        orderId: data[0].orderId
                    });
                    setSelectedCall(data[0]);
                }
            } catch (error) {
                console.error('Error fetching calls:', error);
            }
        };

        if (token) {
            fetchCalls();
        }
    }, [token]);

    const getSentimentColor = (score) => {
        if (score >= 0.6) return '#4CAF50';
        if (score >= 0.4) return '#FFC107';
        return '#F44336';
    };

    const getSentimentIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'positive': return '😊';
            case 'neutral': return '😐';
            case 'negative': return '😟';
            default: return '❓';
        }
    };

    const filteredCalls = calls.filter(call =>
        call.callTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <NavigationBar />
            <div className={styles.container}>
            <div className={styles.leftPanel}>
                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search calls..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.callList}>
                    {filteredCalls.map((call) => (
                        <div
                            key={call.id}
                            className={`${styles.callItem} ${selectedCall?.id === call.id ? styles.selected : ''}`}
                            onClick={() => setSelectedCall(call)}
                        >
                            <div className={styles.callItemHeader}>
                                <span className={styles.callTitle}>{call.callTitle}</span>
                                {call.callDirection === 'INCOMING' ?
                                    <PhoneIncoming size={16} className={styles.incomingCall} /> :
                                    <PhoneOutgoing size={16} className={styles.outgoingCall} />
                                }
                            </div>
                            <div className={styles.callItemMeta}>
                                <span>{new Date(call.callDateTime).toLocaleString()}</span>
                                <span className={styles.sentiment}>
                                    {getSentimentIcon(call.sentimentType)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.rightPanel}>
                {selectedCall ? (
                    <div className={styles.callDetails}>
                        <div className={styles.callHeader}>
                            <h2>{selectedCall.callTitle}</h2>
                            <button
                                className={styles.chatbotButton}
                                onClick={() => {
                                    console.log('Attempting chat redirect with call:', selectedCall);
                                    if (selectedCall) {
                                        handleChatbotRedirect(selectedCall);
                                    }
                                }}
                            >
                                <Bot size={20} />
                                <span>Open in Chatbot</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>

                        <div className={styles.sentimentSection}>
                            <div className={styles.sentimentScore}>
                                <div className={styles.scoreLabel}>Sentiment Score</div>
                                <div
                                    className={styles.scoreValue}
                                    style={{ color: getSentimentColor(selectedCall.sentimentScore) }}
                                >
                                    {(selectedCall.sentimentScore * 100).toFixed(1)}%
                                </div>
                                <div className={styles.sentimentBar}>
                                    <div
                                        className={styles.sentimentFill}
                                        style={{
                                            width: `${selectedCall.sentimentScore * 100}%`,
                                            backgroundColor: getSentimentColor(selectedCall.sentimentScore)
                                        }}
                                    />
                                </div>
                            </div>
                            <div className={styles.sentimentType}>
                                {getSentimentIcon(selectedCall.sentimentType)}
                                <span>{selectedCall.sentimentType}</span>
                            </div>
                        </div>

                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <label>Call Date & Time</label>
                                <span>{new Date(selectedCall.callDateTime).toLocaleString()}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Direction</label>
                                <span className={styles.direction}>
                                    {selectedCall.callDirection === 'INCOMING' ?
                                        <><PhoneIncoming size={16} /> Incoming</> :
                                        <><PhoneOutgoing size={16} /> Outgoing</>
                                    }
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Contact</label>
                                <span>{`${selectedCall.firstName} ${selectedCall.lastName}`}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Email</label>
                                <span>{selectedCall.email}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Phone</label>
                                <span>{selectedCall.phoneNumber}</span>
                            </div>
                        </div>

                        <div className={styles.summary}>
                            <label>Summary</label>
                            <p>{selectedCall.summary}</p>
                        </div>
                    </div>
                ) : (
                    <div className={styles.noSelection}>
                        <Phone size={48} />
                        <p>Select a call to view details</p>
                    </div>
                )}
            </div>
        </div>
        </div>
    );
};

export default CallHistory;