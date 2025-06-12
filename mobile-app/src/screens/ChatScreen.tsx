
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { COLORS, SIZES } from '../constants';
import io from 'socket.io-client';

interface Message {
  id: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'prescription';
  sender_id: number;
  receiver_id: number;
  chat_id: number;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: number;
    username: string;
    profile_image?: string;
    role: string;
  };
  attachment_url?: string;
  attachment_name?: string;
}

interface Chat {
  id: number;
  type: 'CUSTOMER_SUPPORT' | 'PHARMACY_CONSULTATION' | 'DELIVERY_TRACKING';
  status: 'ACTIVE' | 'CLOSED';
  participant1_id: number;
  participant2_id: number;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  pharmacy?: {
    id: number;
    name: string;
  };
  order?: {
    id: number;
    order_number: string;
  };
  support_agent?: {
    id: number;
    username: string;
    profile_image?: string;
  };
}

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { chatId, pharmacyId, orderId, supportAgentId } = route.params as {
    chatId?: number;
    pharmacyId?: number;
    orderId?: number;
    supportAgentId?: number;
  };

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    initializeChat();
    setupSocketConnection();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      let chatResponse;
      
      if (chatId) {
        // Load existing chat
        chatResponse = await api.get(`/api/chat/${chatId}`);
      } else {
        // Create new chat
        const chatData: any = {};
        
        if (pharmacyId) {
          chatData.type = 'PHARMACY_CONSULTATION';
          chatData.pharmacy_id = pharmacyId;
        } else if (orderId) {
          chatData.type = 'DELIVERY_TRACKING';
          chatData.order_id = orderId;
        } else if (supportAgentId) {
          chatData.type = 'CUSTOMER_SUPPORT';
          chatData.support_agent_id = supportAgentId;
        } else {
          chatData.type = 'CUSTOMER_SUPPORT';
        }
        
        chatResponse = await api.post('/api/chat/create', chatData);
      }
      
      if (chatResponse.data.status === 'success') {
        setChat(chatResponse.data.data);
        await loadMessages(chatResponse.data.data.id);
        await loadOtherUserInfo(chatResponse.data.data);
      } else {
        Alert.alert('Error', 'Failed to initialize chat');
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await api.get(`/api/chat/${chatId}/messages?limit=50`);
      
      if (response.data.status === 'success') {
        setMessages(response.data.data.reverse());
        
        // Mark messages as read
        await api.put(`/api/chat/${chatId}/mark-read`);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadOtherUserInfo = async (chatData: Chat) => {
    try {
      const otherUserId = chatData.participant1_id === user?.id 
        ? chatData.participant2_id 
        : chatData.participant1_id;
      
      if (chatData.type === 'PHARMACY_CONSULTATION' && chatData.pharmacy) {
        setOtherUser({
          name: chatData.pharmacy.name,
          type: 'pharmacy',
          avatar: null,
        });
      } else if (chatData.support_agent) {
        setOtherUser({
          name: chatData.support_agent.username,
          type: 'support',
          avatar: chatData.support_agent.profile_image,
        });
      } else {
        // Load user info
        const response = await api.get(`/api/users/${otherUserId}`);
        if (response.data.status === 'success') {
          setOtherUser({
            name: response.data.data.username,
            type: 'user',
            avatar: response.data.data.profile_image,
          });
        }
      }
    } catch (error) {
      console.error('Error loading other user info:', error);
    }
  };

  const setupSocketConnection = () => {
    socketRef.current = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000', {
      auth: {
        token: user?.token,
      },
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat socket');
    });

    socketRef.current.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Mark as read if chat is active
      if (message.sender_id !== user?.id) {
        api.put(`/api/chat/${message.chat_id}/mark-read`);
      }
    });

    socketRef.current.on('user_typing', (data: { userId: number; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    });

    socketRef.current.on('message_read', (data: { messageId: number; userId: number }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.messageId ? { ...msg, is_read: true } : msg
        )
      );
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat || isSending) return;

    try {
      setIsSending(true);
      const messageText = newMessage.trim();
      setNewMessage('');

      const response = await api.post('/api/chat/send-message', {
        chat_id: chat.id,
        content: messageText,
        type: 'text',
      });

      if (response.data.status === 'success') {
        const message = response.data.data;
        setMessages(prev => [...prev, message]);
        
        // Emit via socket for real-time delivery
        socketRef.current?.emit('send_message', {
          chatId: chat.id,
          message: message,
        });
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Error', 'Failed to send message');
        setNewMessage(messageText); // Restore message on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setNewMessage(newMessage); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);

    // Emit typing indicator
    if (socketRef.current && chat) {
      socketRef.current.emit('typing', {
        chatId: chat.id,
        isTyping: true,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', {
          chatId: chat.id,
          isTyping: false,
        });
      }, 1000);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isMyMessage = message.sender_id === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            {otherUser?.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Icon 
                  name={otherUser?.type === 'pharmacy' ? 'storefront' : 
                        otherUser?.type === 'support' ? 'headset' : 'person'} 
                  size={20} 
                  color={COLORS.white} 
                />
              </View>
            )}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime
            ]}>
              {formatMessageTime(message.created_at)}
            </Text>
            
            {isMyMessage && (
              <Icon
                name={message.is_read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={message.is_read ? COLORS.success : COLORS.lightGray}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.avatarContainer}>
          {otherUser?.avatar ? (
            <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Icon 
                name={otherUser?.type === 'pharmacy' ? 'storefront' : 
                      otherUser?.type === 'support' ? 'headset' : 'person'} 
                size={20} 
                color={COLORS.white} 
              />
            </View>
          )}
        </View>
        
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{otherUser?.name || 'Chat'}</Text>
            <Text style={styles.headerSubtitle}>
              {chat?.type === 'PHARMACY_CONSULTATION' ? 'Pharmacy Consultation' :
               chat?.type === 'DELIVERY_TRACKING' ? 'Delivery Support' :
               'Customer Support'}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <Icon name="ellipsis-vertical" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.gray}
              value={newMessage}
              onChangeText={handleTyping}
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity style={styles.attachButton}>
              <Icon name="attach" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || isSending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Icon name="send" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: SIZES.padding,
    fontSize: SIZES.font,
    color: COLORS.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  backButton: {
    marginRight: SIZES.padding,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.font,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginTop: 2,
  },
  moreButton: {
    marginLeft: SIZES.padding,
  },
  messagesList: {
    flex: 1,
    backgroundColor: COLORS.lightGray2,
  },
  messagesContainer: {
    padding: SIZES.padding,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SIZES.padding,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: SIZES.base,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: SIZES.padding,
    borderRadius: SIZES.radius * 2,
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: SIZES.base,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  messageText: {
    fontSize: SIZES.font,
    lineHeight: 20,
  },
  myMessageText: {
    color: COLORS.white,
  },
  otherMessageText: {
    color: COLORS.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SIZES.base / 2,
    gap: 4,
  },
  messageTime: {
    fontSize: SIZES.small,
  },
  myMessageTime: {
    color: COLORS.lightGray,
  },
  otherMessageTime: {
    color: COLORS.gray,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SIZES.padding,
  },
  typingBubble: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 2,
    borderBottomLeftRadius: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    padding: SIZES.padding,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: SIZES.base,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.lightGray2,
    borderRadius: SIZES.radius * 2,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
  },
  textInput: {
    flex: 1,
    fontSize: SIZES.font,
    color: COLORS.text,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  attachButton: {
    marginLeft: SIZES.base,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
});

export default ChatScreen;
